import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import { CyclePhase } from '@/types';
import { PHASE_INFO } from '@/constants/phases';

/** i18n keys for fallback greetings, 3 per phase. */
const GREETING_KEYS: Record<CyclePhase, string[]> = {
  menstrual: ['greetingMenstrual1', 'greetingMenstrual2', 'greetingMenstrual3'],
  follicular: ['greetingFollicular1', 'greetingFollicular2', 'greetingFollicular3'],
  ovulatory: ['greetingOvulatory1', 'greetingOvulatory2', 'greetingOvulatory3'],
  luteal: ['greetingLuteal1', 'greetingLuteal2', 'greetingLuteal3'],
};

interface UseAIGreetingResult {
  greeting: string;
  isAI: boolean;   // true once the AI response has replaced the fallback
  isLoading: boolean;
}

export function useAIGreeting(
  phase: CyclePhase,
  dayInCycle: number
): UseAIGreetingResult {
  const { t } = useTranslation('dashboard');
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;
  const phaseTagline = PHASE_INFO[phase].tagline;

  // Rotate through translated fallbacks deterministically by day
  const keys = GREETING_KEYS[phase];
  const fallback = t(keys[dayInCycle % keys.length]);

  const [greeting, setGreeting] = useState(fallback);
  const [isAI, setIsAI] = useState(false);
  const [isLoading, setIsLoading] = useState(!!proxyUrl);

  useEffect(() => {
    // Show fallback immediately; replace with AI greeting if proxy is configured
    setGreeting(fallback);
    setIsAI(false);

    if (!proxyUrl || !clientToken) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    (async () => {
      try {
        const res = await fetch(`${proxyUrl}/api/greeting`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Token': clientToken,
          },
          body: JSON.stringify({ phase, dayInCycle, phaseTagline, language: i18n.language }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Proxy ${res.status}`);

        const data = (await res.json()) as { greeting?: string };
        if (data.greeting) {
          setGreeting(data.greeting);
          setIsAI(true);
        }
      } catch (err: unknown) {
        // AbortError = component unmounted — silently ignore
        if (err instanceof Error && err.name === 'AbortError') return;
        // Any other error: keep showing the fallback greeting
        console.warn('[useAIGreeting] falling back to static greeting:', err);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  // Re-fetch whenever phase or day changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, dayInCycle]);

  return { greeting, isAI, isLoading };
}
