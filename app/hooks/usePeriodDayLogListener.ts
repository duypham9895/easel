import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { subscribeToPeriodDayLogs } from '@/lib/db/periodDayLogs';
import { getMyCouple } from '@/lib/db/couples';

export function usePeriodDayLogListener() {
  const role = useAppStore(s => s.role);
  const isPartnerLinked = useAppStore(s => s.isPartnerLinked);
  const coupleId = useAppStore(s => s.coupleId);
  const receivePeriodDayLog = useAppStore(s => s.receivePeriodDayLog);

  useEffect(() => {
    // Only Sun subscribes — Moon is the writer
    if (role !== 'sun' || !isPartnerLinked || !coupleId) return;

    let unsubscribe: (() => void) | null = null;

    (async () => {
      const couple = await getMyCouple();
      if (!couple?.girlfriend_id) return;

      unsubscribe = subscribeToPeriodDayLogs(
        couple.girlfriend_id,
        (event, log, oldLog) => {
          if (event === 'DELETE' && oldLog) {
            receivePeriodDayLog('DELETE', oldLog.log_date, null);
          } else if (log) {
            receivePeriodDayLog(event, log.log_date, {
              logDate: log.log_date,
              flowIntensity: log.flow_intensity,
              symptoms: log.symptoms ?? [],
            });
          }
        },
      );
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [role, isPartnerLinked, coupleId, receivePeriodDayLog]);
}
