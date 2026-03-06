import { supabase } from '@/lib/supabase';

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

/** GF calls this to create a couple record and get a fresh 6-digit link code. */
export async function createOrRefreshLinkCode(girlfriendId: string): Promise<string> {
  const code = Math.floor(100_000 + Math.random() * 900_000).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  // Upsert: create if not exists, refresh code if already exists
  const { error } = await supabase
    .from('couples')
    .upsert(
      {
        girlfriend_id: girlfriendId,
        link_code: code,
        link_code_expires_at: expiresAt,
        status: 'pending',
      },
      { onConflict: 'girlfriend_id' }
    );

  if (error) throw error;
  return code;
}

/** BF calls this with the code GF shared. Returns the couple id on success. */
export async function linkToPartnerByCode(
  boyfriendId: string,
  code: string
): Promise<string> {
  // Find the couple with this code that is still valid and pending
  const { data, error: findError } = await supabase
    .from('couples')
    .select('id, link_code_expires_at, status')
    .eq('link_code', code)
    .single();

  if (findError || !data) throw new Error('Invalid link code');
  if (data.status === 'linked') throw new Error('This code has already been used');

  const expiresAt = data.link_code_expires_at
    ? new Date(data.link_code_expires_at)
    : null;
  if (expiresAt && expiresAt < new Date()) throw new Error('Link code has expired');

  // Claim the couple row
  const { error: updateError } = await supabase
    .from('couples')
    .update({
      boyfriend_id: boyfriendId,
      status: 'linked',
      linked_at: new Date().toISOString(),
      link_code: null,
      link_code_expires_at: null,
    })
    .eq('id', data.id);

  if (updateError) throw updateError;
  return data.id;
}

/** Returns the couple for the authenticated user, or null. */
export async function getMyCouple(): Promise<DbCouple | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .or(`girlfriend_id.eq.${user.id},boyfriend_id.eq.${user.id}`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as DbCouple;
}
