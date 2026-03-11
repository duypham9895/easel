import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { subscribeToPeriodLogs } from '@/lib/db/cycle';
import { getMyCouple } from '@/lib/db/couples';
import { getCycleSettings } from '@/lib/db/cycle';
import { detectDeviation } from '@/utils/cycleCalculator';
import type { CycleDeviation } from '@/types';

/**
 * Sun-side Realtime listener for Moon's period_logs.
 *
 * When Moon logs a new period, this hook:
 * 1. Recalculates partnerCycleSettings so Sun's display updates
 * 2. Checks for significant deviation (|days| > 3)
 * 3. Exposes `deviation` state for the UI to show a notification card
 *
 * Only active when: role === 'sun' AND partner is linked.
 *
 * This covers the IN-APP (foreground) case.
 * The BACKGROUND case is handled by the notify-period-update Edge Function.
 */
export function usePeriodLogListener(): {
  deviation: CycleDeviation | null;
  clearDeviation: () => void;
} {
  const role = useAppStore((s) => s.role);
  const isPartnerLinked = useAppStore((s) => s.isPartnerLinked);
  const partnerCycleSettings = useAppStore((s) => s.partnerCycleSettings);

  const [deviation, setDeviation] = useState<CycleDeviation | null>(null);
  const [moonUserId, setMoonUserId] = useState<string | null>(null);

  // Fetch Moon's user ID when partner is linked
  useEffect(() => {
    if (role !== 'sun' || !isPartnerLinked) {
      setMoonUserId(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const couple = await getMyCouple();
        if (!cancelled && couple?.girlfriend_id) {
          setMoonUserId(couple.girlfriend_id);
        }
      } catch (err) {
        console.warn('[usePeriodLogListener] failed to fetch couple:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [role, isPartnerLinked]);

  // Keep a ref to partnerCycleSettings so the subscription callback
  // always reads the latest value without causing re-subscription.
  const partnerCycleRef = useRef(partnerCycleSettings);
  useEffect(() => {
    partnerCycleRef.current = partnerCycleSettings;
  }, [partnerCycleSettings]);

  // Subscribe to period_logs changes for Moon
  useEffect(() => {
    if (role !== 'sun' || !moonUserId || !partnerCycleRef.current) return;

    const unsubscribe = subscribeToPeriodLogs(moonUserId, (newLog) => {
      const settings = partnerCycleRef.current;
      if (!settings) return;

      // Detect deviation from predicted cycle
      const result = detectDeviation(
        newLog.start_date,
        settings.lastPeriodStartDate,
        settings.avgCycleLength,
      );

      if (result.isSignificant) {
        setDeviation(result);
      }

      // Refresh partner cycle settings so Sun's dashboard recalculates
      (async () => {
        try {
          const updated = await getCycleSettings(moonUserId);
          if (updated) {
            useAppStore.setState({ partnerCycleSettings: updated });
          }
        } catch (err) {
          console.warn('[usePeriodLogListener] failed to refresh cycle settings:', err);
        }
      })();
    });

    return unsubscribe;
  }, [role, moonUserId]);

  const clearDeviation = () => setDeviation(null);

  return { deviation, clearDeviation };
}
