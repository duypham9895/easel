import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types';

export interface DbProfile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, display_name, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // row not found
    throw error;
  }
  return data as DbProfile;
}

export async function upsertProfile(
  userId: string,
  fields: Partial<Pick<DbProfile, 'role' | 'display_name' | 'avatar_url'>>
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...fields }, { onConflict: 'id' });

  if (error) throw error;
}
