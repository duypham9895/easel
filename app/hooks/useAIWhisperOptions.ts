import { useState, useEffect } from 'react';
import i18n from '@/i18n/config';
import { CyclePhase, SOSOption } from '@/types';
import { WHISPER_OPTIONS } from '@/constants/whisper';

const AI_ICON = 'send';
const AI_COLOR = '#B39DDB'; // MOON.accentPrimary

export function useAIWhisperOptions(
  phase: CyclePhase,
  dayInCycle: number,
): { options: SOSOption[]; isAI: boolean; isLoading: boolean } {
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;

  const fallback = WHISPER_OPTIONS[phase] ?? WHISPER_OPTIONS.menstrual;

  const [options, setOptions] = useState<SOSOption[]>(fallback);
  const [isAI, setIsAI] = useState(false);
  const [isLoading, setIsLoading] = useState(!!proxyUrl);

  useEffect(() => {
    // Reset to static options immediately when phase changes
    setOptions(fallback);
    setIsAI(false);

    if (!proxyUrl || !clientToken) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    (async () => {
      try {
        const res = await fetch(`${proxyUrl}/api/whisper-options`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Token': clientToken,
          },
          body: JSON.stringify({ phase, dayInCycle, language: i18n.language }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Proxy ${res.status}`);

        const data = (await res.json()) as { options?: string[] };
        if (data.options && data.options.length > 0) {
          const aiOptions: SOSOption[] = data.options.slice(0, 4).map((title, i) => ({
            id: `ai_${phase}_${i}`,
            title,
            icon: AI_ICON,
            color: AI_COLOR,
            description: title,
          }));
          setOptions(aiOptions);
          setIsAI(true);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('[useAIWhisperOptions] falling back to static options:', err);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, dayInCycle]);

  return { options, isAI, isLoading };
}
