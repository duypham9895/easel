import { useState, useEffect } from 'react';
import { CyclePhase } from '@/types';
import { PHASE_INFO } from '@/constants/phases';

/** Fallback greeting shown immediately while AI loads (or if AI fails). */
function getFallbackGreeting(phase: CyclePhase, dayInCycle: number): string {
  const fallbacks: Record<CyclePhase, string[]> = {
    menstrual: [
      'Rest is productive. Let today be gentle.',
      'Your body is working hard — honour it.',
      'Slow down and let yourself be held by the day.',
    ],
    follicular: [
      'Fresh energy is on the way. You\'ve got this.',
      'A new chapter is beginning — step into it.',
      'Feel the spark? The world is ready for you.',
    ],
    ovulatory: [
      'You\'re glowing. Let that light out today.',
      'This is your moment to connect and create.',
      'Peak energy — go do something you love.',
    ],
    luteal: [
      'Slow and steady. You don\'t have to do it all.',
      'Trust your feelings — they know what they need.',
      'Cosy mode activated. You\'ve earned some peace.',
    ],
  };

  const list = fallbacks[phase];
  // Rotate through fallbacks deterministically by day so it feels fresh each day
  return list[dayInCycle % list.length];
}

interface UseAIGreetingResult {
  greeting: string;
  isAI: boolean;   // true once the AI response has replaced the fallback
  isLoading: boolean;
}

export function useAIGreeting(
  phase: CyclePhase,
  dayInCycle: number
): UseAIGreetingResult {
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;
  const phaseTagline = PHASE_INFO[phase].tagline;

  const fallback = getFallbackGreeting(phase, dayInCycle);

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
          body: JSON.stringify({ phase, dayInCycle, phaseTagline }),
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
