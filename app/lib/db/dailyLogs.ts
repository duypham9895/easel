import { supabase } from '@/lib/supabase';

export interface PartnerDailyLog {
  mood: number | null;
  symptoms: string[] | null;
  log_date: string;
}

/**
 * Fetches the partner's daily log for today (or a specific date).
 * Used by Sun to see Moon's current mood and symptoms.
 *
 * RLS already allows Sun to read partner's daily_logs via the
 * couples relationship — no extra security needed.
 */
export async function fetchPartnerDailyLog(
  partnerId: string,
  date?: string,
): Promise<PartnerDailyLog | null> {
  const targetDate = date ?? new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_logs')
    .select('mood, symptoms, log_date')
    .eq('user_id', partnerId)
    .eq('log_date', targetDate)
    .maybeSingle();

  if (error) {
    console.warn('[fetchPartnerDailyLog] query failed:', error);
    return null;
  }

  return data;
}
