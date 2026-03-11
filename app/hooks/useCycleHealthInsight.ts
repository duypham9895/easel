import { useState, useCallback } from 'react';
import i18n from '@/i18n/config';
import { useAppStore } from '@/store/appStore';
import { computeCycleStats } from '@/utils/cycleCalculator';

export interface HealthInsightResult {
  explanation: string;
  suggestions: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  shouldSuggestDoctor: boolean;
  doctorReason: string | null;
}

export interface UserHealthContext {
  recentStress: 'low' | 'moderate' | 'high' | null;
  sleepChanges: boolean;
  dietChanges: boolean;
  exerciseChanges: boolean;
  travelRecent: boolean;
}

interface UseCycleHealthInsightResult {
  fetchInsight: (context: UserHealthContext) => Promise<void>;
  result: HealthInsightResult | null;
  loading: boolean;
  error: string | null;
}

function buildFallbackResult(): HealthInsightResult {
  const t = (key: string) => i18n.t(`health:${key}`);
  return {
    explanation: t('insight.explanationTitle') + '\n\n' +
      i18n.t('health:deviation.earlyBody', { days: '?' }).replace('?', '...'),
    suggestions: [
      {
        icon: 'moon',
        title: t('questionnaire.sleepChanges'),
        description: t('insight.suggestionsTitle'),
      },
      {
        icon: 'activity',
        title: t('questionnaire.exerciseChanges'),
        description: t('insight.suggestionsTitle'),
      },
      {
        icon: 'heart',
        title: t('questionnaire.stressQuestion'),
        description: t('insight.suggestionsTitle'),
      },
    ],
    shouldSuggestDoctor: false,
    doctorReason: null,
  };
}

const DAY_MS = 86_400_000;

/**
 * Computes recent cycle lengths (gaps between consecutive period start dates)
 * from the period log history. Filters to valid range [10, 90] days.
 */
function computeRecentCycleLengths(
  logs: ReadonlyArray<{ startDate: string }>,
): number[] {
  if (logs.length < 2) return [];

  const sorted = [...logs].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lengths: number[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = Math.round(
      (new Date(sorted[i].startDate).getTime() -
        new Date(sorted[i + 1].startDate).getTime()) / DAY_MS,
    );
    if (gap >= 10 && gap <= 90) lengths.push(gap);
  }

  return lengths;
}

/**
 * Fetches AI-generated health insight when Moon's period deviates
 * from the predicted date. Uses lifestyle context (stress, sleep, etc.)
 * to generate a personalized explanation + suggestions.
 *
 * Falls back to generic suggestions if the API call fails.
 */
export function useCycleHealthInsight(): UseCycleHealthInsightResult {
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;

  const [result, setResult] = useState<HealthInsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(
    async (context: UserHealthContext) => {
      const { periodLogs, lastDeviation } = useAppStore.getState();

      setLoading(true);
      setError(null);

      // If proxy is not configured or no deviation, return fallback immediately
      if (!proxyUrl || !clientToken || !lastDeviation) {
        setResult(buildFallbackResult());
        setLoading(false);
        return;
      }

      try {
        // Compute cycle statistics from period log history
        const stats = computeCycleStats(periodLogs);
        const recentCycleLengths = computeRecentCycleLengths(periodLogs);

        // Proxy expects daysDifference as a positive integer (absolute value)
        const absDaysDifference = Math.abs(lastDeviation.daysDifference);

        // Proxy rejects on_time type — only send early/late deviations
        if (lastDeviation.type === 'on_time' || absDaysDifference < 1) {
          setResult(buildFallbackResult());
          setLoading(false);
          return;
        }

        const res = await fetch(`${proxyUrl}/api/cycle-health-insight`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Token': clientToken,
          },
          body: JSON.stringify({
            deviation: {
              type: lastDeviation.type,
              daysDifference: absDaysDifference,
              cycleHistory: {
                avgCycleLength: stats.avgCycleLength,
                variability: stats.variability,
                confidence: stats.confidence,
                recentCycleLengths,
              },
            },
            userContext: {
              recentStress: context.recentStress,
              sleepChanges: context.sleepChanges,
              dietChanges: context.dietChanges,
              exerciseChanges: context.exerciseChanges,
              travelRecent: context.travelRecent,
            },
            language: i18n.language,
          }),
        });

        if (!res.ok) throw new Error(`Proxy ${res.status}`);

        const data = (await res.json()) as HealthInsightResult;

        if (data.explanation && data.suggestions) {
          setResult({
            explanation: data.explanation,
            suggestions: data.suggestions,
            shouldSuggestDoctor: data.shouldSuggestDoctor ?? false,
            doctorReason: data.doctorReason ?? null,
          });
        } else {
          // Partial response — fall back
          setResult(buildFallbackResult());
        }
      } catch (err) {
        console.warn('[useCycleHealthInsight] failed to fetch:', err);
        setError(
          err instanceof Error ? err.message : 'Unknown error',
        );
        // Always show something useful — never leave the user empty-handed
        setResult(buildFallbackResult());
      } finally {
        setLoading(false);
      }
    },
    [proxyUrl, clientToken],
  );

  return { fetchInsight, result, loading, error };
}
