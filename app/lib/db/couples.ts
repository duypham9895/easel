import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DbCouple {
  id: string;
  girlfriend_id: string;
  boyfriend_id: string | null;
  link_code: string | null;
  link_code_expires_at: string | null;
  status: 'pending' | 'linked';
  created_at: string;
  linked_at: string | null;
}

/**
 * GF calls this to create a couple record and get a fresh 6-digit numeric link code.
 * Returns both the code and the couple's ID so the caller can subscribe to updates.
 * Throws if the couple is already linked (prevents accidentally unlinking).
 */
export async function createOrRefreshLinkCode(
  girlfriendId: string
): Promise<{ code: string; coupleId: string }> {
  // Guard: do not reset a couple that is already linked
  const { data: existing } = await supabase
    .from('couples')
    .select('id, status')
    .eq('girlfriend_id', girlfriendId)
    .maybeSingle();

  if (existing?.status === 'linked') {
    throw new Error('You are already linked to a partner');
  }

  const code = Math.floor(100_000 + Math.random() * 900_000).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  const { data: upserted, error } = await supabase
    .from('couples')
    .upsert(
      {
        girlfriend_id: girlfriendId,
        link_code: code,
        link_code_expires_at: expiresAt,
        status: 'pending',
      },
      { onConflict: 'girlfriend_id' }
    )
    .select('id')
    .single();

  if (error) throw error;
  return { code, coupleId: upserted.id };
}

/** BF calls this with the 6-digit code GF shared. Returns the couple id on success. */
export async function linkToPartnerByCode(
  boyfriendId: string,
  code: string
): Promise<string> {
  // Find the couple with this code that is still valid and pending
  const { data, error: findError } = await supabase
    .from('couples')
    .select('id, girlfriend_id, link_code_expires_at, status')
    .eq('link_code', code)
    .single();

  if (findError || !data) throw new Error('Invalid link code');

  // Prevent self-linking
  if (data.girlfriend_id === boyfriendId) {
    throw new Error('You cannot link to yourself');
  }

  if (data.status === 'linked') throw new Error('This code has already been used');

  const expiresAt = data.link_code_expires_at
    ? new Date(data.link_code_expires_at)
    : null;
  if (expiresAt && expiresAt < new Date()) throw new Error('Link code has expired');

  // Claim the couple row atomically — only succeeds if status is still 'pending'
  const { error: updateError } = await supabase
    .from('couples')
    .update({
      boyfriend_id: boyfriendId,
      status: 'linked',
      linked_at: new Date().toISOString(),
      link_code: null,
      link_code_expires_at: null,
    })
    .eq('id', data.id)
    .eq('status', 'pending'); // atomic guard against race condition

  if (updateError) throw updateError;
  return data.id;
}

/** Returns the couple for the authenticated user, or null. */
export async function getMyCouple(): Promise<DbCouple | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('couples')
    .select('id, girlfriend_id, boyfriend_id, link_code, link_code_expires_at, status, created_at, linked_at')
    .or(`girlfriend_id.eq.${user.id},boyfriend_id.eq.${user.id}`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as DbCouple;
}

/**
 * GF subscribes to her couple row so her app is notified the moment BF links.
 * Call this once the couple record exists (after generateLinkCode).
 * Returns an unsubscribe function — call on unmount.
 */
export function subscribeToCoupleLinked(
  coupleId: string,
  onLinked: (couple: DbCouple) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  channel = supabase
    .channel(`couple-linked:${coupleId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'couples',
        filter: `id=eq.${coupleId}`,
      },
      (payload) => {
        const updated = payload.new as DbCouple;
        if (updated.status === 'linked') {
          onLinked(updated);
        }
      }
    )
    .subscribe();

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}
