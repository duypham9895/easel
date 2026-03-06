import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

/**
 * Save (or update) the Expo push token for this device.
 * Uses upsert on (user_id, token) — safe to call every login.
 */
export async function upsertPushToken(userId: string, token: string): Promise<void> {
  const platform = Platform.OS as 'ios' | 'android' | 'web';

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform },
      { onConflict: 'user_id, token' }
    );

  if (error) throw error;
}
