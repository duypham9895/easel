import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { subscribeToPeriodLogs } from '@/lib/db/cycle';
import { getMyCouple } from '@/lib/db/couples';
import { getCycleSettings } from '@/lib/db/cycle';

/**
 * Sun-side Realtime listener for Moon's period_logs.
 *
 * When Moon logs or updates a period, Sun's partnerCycleSettings are refreshed
 * so the calendar and dashboard reflect the latest data.
 *
 * This covers the IN-APP (foreground) case.
 * Only active when: role === 'sun' AND coupleId is set (partner linked).
 */
export function usePeriodListener() {
  const role = useAppStore((s) => s.role);
  const coupleId = useAppStore((s) => s.coupleId);

  useEffect(() => {
    if (role !== 'sun' || !coupleId) return;

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      // Look up Moon's userId from the couple record
      const couple = await getMyCouple();
      if (cancelled || !couple?.girlfriend_id) return;

      const moonUserId = couple.girlfriend_id;

      unsubscribe = subscribeToPeriodLogs(moonUserId, async () => {
        if (cancelled) return;

        // Refresh partner cycle settings from DB
        try {
          const partnerCycle = await getCycleSettings(moonUserId);
          if (!cancelled && partnerCycle) {
            useAppStore.setState({ partnerCycleSettings: partnerCycle });
          }
        } catch (err) {
          console.warn('[usePeriodListener] failed to refresh partner cycle settings:', err);
        }
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [role, coupleId]);
}
