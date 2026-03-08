import { useState, useCallback } from 'react';
import i18n from '@/i18n/config';
import { CyclePhase } from '@/types';
import { PHASE_INFO } from '@/constants/phases';

interface UseAISelfCareResult {
  selfCare: string | null;
  isLoading: boolean;
  fetchSelfCare: (mood: number | null, symptoms: string[]) => Promise<void>;
}

/**
 * Fetches AI-generated personalized self-care advice after Moon submits
 * her daily check-in. Uses mood + symptoms to tailor actionable tips
 * instead of generic phase-based text.
 *
 * Triggered manually (not on mount) — mirrors useAIDailyInsight pattern.
 * Falls back to null (caller should keep showing static i18n text until set).
 */
export function useAISelfCare(
  phase: CyclePhase,
  dayInCycle: number,
): UseAISelfCareResult {
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;

  const [selfCare, setSelfCare] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSelfCare = useCallback(
    async (mood: number | null, symptoms: string[]) => {
      if (!proxyUrl || !clientToken) return;

      setIsLoading(true);

      try {
        const res = await fetch(`${proxyUrl}/api/self-care`, {
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

        const data = (await res.json()) as { selfCare?: string };
        if (data.selfCare) setSelfCare(data.selfCare);
      } catch (err) {
        console.warn('[useAISelfCare] failed to fetch:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [phase, dayInCycle, proxyUrl, clientToken],
  );

  return { selfCare, isLoading, fetchSelfCare };
}
