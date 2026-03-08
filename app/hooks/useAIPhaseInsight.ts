import { useState, useCallback } from 'react';
import i18n from '@/i18n/config';
import { CyclePhase } from '@/types';
import { PHASE_INFO } from '@/constants/phases';

interface UseAIPhaseInsightResult {
  phaseInsight: string | null;
  isLoading: boolean;
  fetchPhaseInsight: (mood: number | null, symptoms: string[]) => Promise<void>;
}

/**
 * Fetches AI-generated personalized "About this Phase" content after Moon
 * submits her daily check-in. Uses mood + symptoms + cycle context to
 * generate relevant phase insight instead of generic static text.
 *
 * Triggered manually (not on mount) — mirrors useAIDailyInsight pattern.
 * Falls back to null (caller should keep showing static i18n text until set).
 */
export function useAIPhaseInsight(
  phase: CyclePhase,
  dayInCycle: number,
): UseAIPhaseInsightResult {
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;

  const [phaseInsight, setPhaseInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPhaseInsight = useCallback(
    async (mood: number | null, symptoms: string[]) => {
      if (!proxyUrl || !clientToken) return;

      setIsLoading(true);

      try {
        const res = await fetch(`${proxyUrl}/api/phase-insight`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Token': clientToken,
          },
          body: JSON.stringify({
            phase,
            dayInCycle,
            mood,
            symptoms,
            phaseTagline: PHASE_INFO[phase].tagline,
            language: i18n.language,
          }),
        });

        if (!res.ok) throw new Error(`Proxy ${res.status}`);

        const data = (await res.json()) as { insight?: string };
        if (data.insight) setPhaseInsight(data.insight);
      } catch (err) {
        console.warn('[useAIPhaseInsight] failed to fetch:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [phase, dayInCycle, proxyUrl, clientToken],
  );

  return { phaseInsight, isLoading, fetchPhaseInsight };
}
