import { useState, useEffect } from 'react';
import { CyclePhase, SOSOption } from '@/types';

/** Per-type static fallbacks shown while AI loads. */
const FALLBACK_TIPS: Record<string, string> = {
  sweet_tooth: 'Grab her favourite snack or dessert right now — it will mean a lot.',
  need_a_hug: 'Put down your phone, go to her, and just hold her. No words needed.',
  cramps_alert: 'Fill a hot water bottle and bring it to her with something warm to drink.',
  quiet_time: 'Give her space right now. Check in with a gentle message in an hour.',
};

interface UseAISOSTipResult {
  tip: string;
  isAI: boolean;
  isLoading: boolean;
}

/**
 * Fetches an AI-generated specific action tip for the boyfriend when
 * an SOS signal arrives. Returns a static fallback immediately.
 *
 * Re-fetches if the SOS type changes (new signal from GF).
 */
export function useAISOSTip(
  sos: SOSOption,
  phase: CyclePhase,
  dayInCycle: number
): UseAISOSTipResult {
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;

  const fallback = FALLBACK_TIPS[sos.id] ?? sos.description;

  const [tip, setTip] = useState(fallback);
  const [isAI, setIsAI] = useState(false);
  const [isLoading, setIsLoading] = useState(!!proxyUrl);

  useEffect(() => {
    setTip(fallback);
    setIsAI(false);

    if (!proxyUrl || !clientToken) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    (async () => {
      try {
        const res = await fetch(`${proxyUrl}/api/sos-tip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Token': clientToken,
          },
          body: JSON.stringify({ sosType: sos.id, phase, dayInCycle }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Proxy ${res.status}`);

        const data = (await res.json()) as { tip?: string };
        if (data.tip) {
          setTip(data.tip);
          setIsAI(true);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('[useAISOSTip] falling back to static tip:', err);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sos.id, phase, dayInCycle]);

  return { tip, isAI, isLoading };
}
