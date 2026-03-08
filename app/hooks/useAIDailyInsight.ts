import { useState, useCallback } from 'react';
import i18n from '@/i18n/config';
import { CyclePhase } from '@/types';

interface UseAIDailyInsightResult {
  insight: string | null;
  isLoading: boolean;
  fetchInsight: (mood: number | null, symptoms: string[]) => Promise<void>;
}

/**
 * Fetches an AI-generated daily insight after GF logs her mood/symptoms.
 *
 * Unlike the greeting or partner advice hooks, this is NOT fetched automatically
 * on mount — it is triggered manually after the user submits her check-in,
 * so the AI response always reflects the freshly logged data.
 */
export function useAIDailyInsight(
  phase: CyclePhase,
  dayInCycle: number
): UseAIDailyInsightResult {
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;

  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsight = useCallback(
    async (mood: number | null, symptoms: string[]) => {
      if (!proxyUrl || !clientToken) return;

      setIsLoading(true);
      setInsight(null);

      try {
        const res = await fetch(`${proxyUrl}/api/daily-insight`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Token': clientToken,
          },
          body: JSON.stringify({ phase, dayInCycle, mood, symptoms, language: i18n.language }),
        });

        if (!res.ok) throw new Error(`Proxy ${res.status}`);

        const data = (await res.json()) as { insight?: string };
        if (data.insight) setInsight(data.insight);
      } catch (err) {
        console.warn('[useAIDailyInsight] failed to fetch insight:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [phase, dayInCycle, proxyUrl, clientToken]
  );

  return { insight, isLoading, fetchInsight };
}
