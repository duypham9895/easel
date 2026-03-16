import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { FlowIntensity, PeriodSymptom, PeriodDayRecord, DbPeriodDayLog } from '@/types';

/** Upsert a single day's period details. Idempotent on (user_id, log_date). */
export async function upsertPeriodDayLog(
  userId: string,
  logDate: string,
  flowIntensity: FlowIntensity,
  symptoms: PeriodSymptom[],
  notes?: string,
): Promise<void> {
  const { error } = await supabase
    .from('period_day_logs')
    .upsert(
      {
        user_id: userId,
        log_date: logDate,
        flow_intensity: flowIntensity,
        symptoms,
        notes: notes ?? null,
      },
      { onConflict: 'user_id, log_date' },
    );

  if (error) throw error;
}

/** Fetch period day logs for a user within a date range, ordered by date ascending. */
export async function fetchPeriodDayLogs(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<PeriodDayRecord[]> {
  const { data, error } = await supabase
    .from('period_day_logs')
    .select('log_date, flow_intensity, symptoms, notes')
    .eq('user_id', userId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Pick<DbPeriodDayLog, 'log_date' | 'flow_intensity' | 'symptoms' | 'notes'>[]).map(
    (row) => ({
      logDate: row.log_date,
      flowIntensity: row.flow_intensity,
      symptoms: row.symptoms ?? [],
      ...(row.notes != null ? { notes: row.notes } : {}),
    }),
  );
}

/** Delete a specific day log by user + date. */
export async function deletePeriodDayLog(
  userId: string,
  logDate: string,
): Promise<void> {
  const { error } = await supabase
    .from('period_day_logs')
    .delete()
    .eq('user_id', userId)
    .eq('log_date', logDate);

  if (error) throw error;
}

/**
 * Subscribe to period day log changes for a specific user (partner sync).
 * Used by Sun to see Moon's flow/symptom updates in real-time.
 * Returns a cleanup function — call it on unmount.
 */
export function subscribeToPeriodDayLogs(
  moonUserId: string,
  onDayLogChange: (
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    log: Pick<DbPeriodDayLog, 'log_date' | 'flow_intensity' | 'symptoms'> | null,
    oldLog: Pick<DbPeriodDayLog, 'log_date'> | null,
  ) => void,
): () => void {
  let channel: RealtimeChannel | null = null;

  channel = supabase
    .channel(`period-day-logs:${moonUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'period_day_logs',
        filter: `user_id=eq.${moonUserId}`,
      },
      (payload) => {
        const record = payload.new as unknown as DbPeriodDayLog;
        onDayLogChange('INSERT', {
          log_date: record.log_date,
          flow_intensity: record.flow_intensity,
          symptoms: record.symptoms,
        }, null);
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'period_day_logs',
        filter: `user_id=eq.${moonUserId}`,
      },
      (payload) => {
        const record = payload.new as unknown as DbPeriodDayLog;
        onDayLogChange('UPDATE', {
          log_date: record.log_date,
          flow_intensity: record.flow_intensity,
          symptoms: record.symptoms,
        }, null);
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'period_day_logs',
        filter: `user_id=eq.${moonUserId}`,
      },
      (payload) => {
        const old = payload.old as unknown as Pick<DbPeriodDayLog, 'log_date'>;
        onDayLogChange('DELETE', null, { log_date: old.log_date });
      },
    )
    .subscribe();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
