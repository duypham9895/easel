import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { subscribeToSOS } from '@/lib/db/sos';
import { SOS_OPTIONS } from '@/constants/sos';

/**
 * BF-side Realtime listener.
 *
 * When a new `sos_signals` row is inserted for their couple, this hook fires
 * `receiveSOS` which sets `activeSOS` locally — driving the SOSAlert banner.
 *
 * This covers the IN-APP (foreground) case.
 * The BACKGROUND case is handled by the Supabase Edge Function → Expo Push.
 *
 * Only active when: role === 'boyfriend' AND coupleId is set (partner linked).
 */
export function useSOSListener() {
  const { role, coupleId, receiveSOS } = useAppStore();

  useEffect(() => {
    if (role !== 'boyfriend' || !coupleId) return;

    const unsubscribe = subscribeToSOS(coupleId, (signal) => {
      const option = SOS_OPTIONS.find((o) => o.id === signal.type);
      if (option) receiveSOS(option);
    });

    return unsubscribe;
  }, [role, coupleId]);
}
