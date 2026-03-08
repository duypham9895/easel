import { useState, useEffect } from 'react';
import i18n from '@/i18n/config';
import { CyclePhase } from '@/types';
import { PHASE_INFO } from '@/constants/phases';

/** Static fallback advice shown instantly while AI loads or if proxy is unavailable. */
function getFallbackAdvice(phase: CyclePhase): string {
  return PHASE_INFO[phase].partnerAdvice;
}

interface UseAIPartnerAdviceResult {
  advice: string;
  isAI: boolean;
  isLoading: boolean;
}

/**
 * Fetches AI-generated, phase-aware partner advice for the boyfriend.
 * Shows static fallback immediately; replaces with AI text once fetched.
 * Re-fetches when phase, dayInCycle, or Moon's mood/symptoms change.
 *
 * When mood/symptoms are provided, the AI generates advice that accounts
 * for how Moon actually feels today — not just generic phase guidance.
 */
export function useAIPartnerAdvice(
  phase: CyclePhase,
  dayInCycle: number,
  partnerMood?: number | null,
  partnerSymptoms?: string[] | null,
): UseAIPartnerAdviceResult {
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;
  const phaseTagline = PHASE_INFO[phase].tagline;

  const fallback = getFallbackAdvice(phase);

  const [advice, setAdvice] = useState(fallback);
  const [isAI, setIsAI] = useState(false);
  const [isLoading, setIsLoading] = useState(!!proxyUrl);

  // Stable serialization for dependency tracking
  const symptomsKey = partnerSymptoms ? partnerSymptoms.join(',') : '';

  useEffect(() => {
    setAdvice(fallback);
    setIsAI(false);

    if (!proxyUrl || !clientToken) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    (async () => {
      try {
        const body: Record<string, unknown> = {
          phase,
          dayInCycle,
          phaseTagline,
          language: i18n.language,
        };
        // Include mood/symptoms when available so AI can personalize
        if (partnerMood != null) body.mood = partnerMood;
        if (partnerSymptoms && partnerSymptoms.length > 0) body.symptoms = partnerSymptoms;

        const res = await fetch(`${proxyUrl}/api/partner-advice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Token': clientToken,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Proxy ${res.status}`);

        const data = (await res.json()) as { advice?: string };
        if (data.advice) {
          setAdvice(data.advice);
          setIsAI(true);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('[useAIPartnerAdvice] falling back to static advice:', err);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, dayInCycle, partnerMood, symptomsKey]);

  return { advice, isAI, isLoading };
}
