import { supabase } from '@/lib/supabase';
import { CycleSettings } from '@/types';

export interface DbCycleSettings {
  id: string;
  user_id: string;
  avg_cycle_length: number;
  avg_period_length: number;
  last_period_start_date: string; // ISO date YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

/** Fetch cycle settings for a user. Returns null if not set yet. */
export async function getCycleSettings(userId: string): Promise<CycleSettings | null> {
  const { data, error } = await supabase
    .from('cycle_settings')
    .select('id, user_id, avg_cycle_length, avg_period_length, last_period_start_date, created_at, updated_at')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    avgCycleLength: (data as DbCycleSettings).avg_cycle_length,
    avgPeriodLength: (data as DbCycleSettings).avg_period_length,
    lastPeriodStartDate: (data as DbCycleSettings).last_period_start_date,
  };
}

/** Create or update cycle settings for the authenticated GF. */
export async function upsertCycleSettings(
  userId: string,
  settings: CycleSettings
): Promise<void> {
  const { error } = await supabase
    .from('cycle_settings')
    .upsert(
      {
        user_id: userId,
        avg_cycle_length: settings.avgCycleLength,
        avg_period_length: settings.avgPeriodLength,
        last_period_start_date: settings.lastPeriodStartDate,
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
}

/** Log a new period start. Upserts on start_date to allow re-logging. */
export async function logPeriodStart(
  userId: string,
  startDate: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('period_logs')
    .upsert(
      { user_id: userId, start_date: startDate, notes: notes ?? null },
      { onConflict: 'user_id, start_date' }
    );

  if (error) throw error;
}
