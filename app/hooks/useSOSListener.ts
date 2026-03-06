import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { subscribeToSOS } from '@/lib/db/sos';
import { SOS_OPTIONS } from '@/constants/sos';
import { WHISPER_OPTIONS } from '@/constants/whisper';
import { SOSOption } from '@/types';

// Flat list of all whisper options across every phase for quick ID lookup
const ALL_WHISPER_OPTIONS: SOSOption[] = Object.values(WHISPER_OPTIONS).flat();

/**
 * Sun-side Realtime listener.
 *
 * When a new `sos_signals` row is inserted for their couple, this hook fires
 * `receiveWhisper` which sets `activeWhisper` locally — driving the WhisperAlert banner.
 *
 * This covers the IN-APP (foreground) case.
 * The BACKGROUND case is handled by the Supabase Edge Function → Expo Push.
 *
 * Only active when: role === 'sun' AND coupleId is set (partner linked).
 */
export function useSOSListener() {
  const { role, coupleId, receiveWhisper } = useAppStore();

  useEffect(() => {
    if (role !== 'sun' || !coupleId) return;

    const unsubscribe = subscribeToSOS(coupleId, (signal) => {
      // Search SOS options first, then whisper options, then reconstruct from DB signal
      const option: SOSOption =
        SOS_OPTIONS.find((o) => o.id === signal.type) ??
        ALL_WHISPER_OPTIONS.find((o) => o.id === signal.type) ??
        {
          id: signal.type,
          title: signal.message ?? signal.type,
          icon: 'message-circle',
          color: '#B39DDB',
          description: signal.message ?? signal.type,
        };
      receiveWhisper(option);
    });

    return unsubscribe;
  }, [role, coupleId, receiveWhisper]);
}
