import { supabase } from '@/lib/supabase';
import { SOSOption } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DbSOSSignal {
  id: string;
  couple_id: string;
  sender_id: string;
  type: string;
  message: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

/** GF inserts a new SOS signal. */
export async function sendSOSSignal(
  coupleId: string,
  senderId: string,
  option: SOSOption
): Promise<void> {
  const { error } = await supabase
    .from('sos_signals')
    .insert({
      couple_id: coupleId,
      sender_id: senderId,
      type: option.id,
      message: option.title,
    });

  if (error) throw error;
}

/** BF acknowledges a received SOS. */
export async function acknowledgeSOSSignal(signalId: string): Promise<void> {
  const { error } = await supabase
    .from('sos_signals')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('id', signalId);

  if (error) throw error;
}

/**
 * Subscribe to new SOS signals for a couple.
 * Returns a cleanup function — call it on unmount or when partner unlinks.
 *
 * @param coupleId - The couple's ID
 * @param onSignal - Called with the new SOS signal row when received
 */
export function subscribeToSOS(
  coupleId: string,
  onSignal: (signal: DbSOSSignal) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  channel = supabase
    .channel(`sos:${coupleId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sos_signals',
        filter: `couple_id=eq.${coupleId}`,
      },
      (payload) => {
        onSignal(payload.new as DbSOSSignal);
      }
    )
    .subscribe();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
