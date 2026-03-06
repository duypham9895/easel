import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types';

export interface DbProfile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
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
  fields: Partial<Pick<DbProfile, 'role' | 'display_name'>>
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId);

  if (error) throw error;
}
