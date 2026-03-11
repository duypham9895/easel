import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/appStore';
import type { CycleDeviation } from '@/types';

const LAST_DEVIATION_PROMPT_KEY = 'lastDeviationPromptCycle';

/**
 * Detects deviations between actual and predicted period start dates.
 * Computes a CycleDeviation from the latest period log vs. the predicted date.
 */
function computeDeviation(
  lastPeriodStartDate: string,
  avgCycleLength: number,
  periodLogs: ReadonlyArray<{ startDate: string; endDate?: string }>,
): CycleDeviation | null {
  if (periodLogs.length < 2) return null;

  const latestStart = periodLogs[0].startDate;
  const previousStart = periodLogs[1].startDate;

  // The predicted date is previousStart + avgCycleLength
  const previousMs = new Date(previousStart + 'T00:00:00').getTime();
  const predictedMs = previousMs + avgCycleLength * 86_400_000;
  const predictedDate = new Date(predictedMs).toISOString().split('T')[0];

  const actualMs = new Date(latestStart + 'T00:00:00').getTime();
  const daysDifference = Math.round((actualMs - predictedMs) / 86_400_000);

  const absDiff = Math.abs(daysDifference);
  const type: CycleDeviation['type'] =
    absDiff <= 2 ? 'on_time' : daysDifference < 0 ? 'early' : 'late';

  const isSignificant = Math.abs(daysDifference) > 3;

  return {
    type,
    daysDifference,
    predictedDate,
    actualDate: latestStart,
    isSignificant,
  };
}

interface UseDeviationDetectionResult {
  deviation: CycleDeviation | null;
  showInsightPrompt: boolean;
  dismissInsightPrompt: () => void;
  acceptInsightPrompt: () => void;
}

export function useDeviationDetection(): UseDeviationDetectionResult {
  const cycleSettings = useAppStore((s) => s.cycleSettings);
  const periodLogs = useAppStore((s) => s.periodLogs);

  const [deviation, setDeviation] = useState<CycleDeviation | null>(null);
  const [showInsightPrompt, setShowInsightPrompt] = useState(false);
  const [promptedCycle, setPromptedCycle] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Load the last prompted cycle from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(LAST_DEVIATION_PROMPT_KEY)
      .then((value) => {
        setPromptedCycle(value);
        initializedRef.current = true;
      })
      .catch((err) => {
        console.warn('[useDeviationDetection] failed to read AsyncStorage:', err);
        initializedRef.current = true;
      });
  }, []);

  // Compute deviation when period logs or cycle settings change
  useEffect(() => {
    if (!initializedRef.current) return;

    const computed = computeDeviation(
      cycleSettings.lastPeriodStartDate,
      cycleSettings.avgCycleLength,
      periodLogs,
    );
    setDeviation(computed);

    if (computed?.isSignificant) {
      // Use the latest period start date as the cycle key to prevent repeat prompts
      const cycleKey = periodLogs[0]?.startDate ?? '';
      if (promptedCycle !== cycleKey) {
        setShowInsightPrompt(true);
      }
    } else {
      setShowInsightPrompt(false);
    }
  }, [cycleSettings.lastPeriodStartDate, cycleSettings.avgCycleLength, periodLogs, promptedCycle]);

  const dismissInsightPrompt = useCallback(() => {
    setShowInsightPrompt(false);
    const cycleKey = periodLogs[0]?.startDate ?? '';
    setPromptedCycle(cycleKey);
    AsyncStorage.setItem(LAST_DEVIATION_PROMPT_KEY, cycleKey).catch((err) =>
      console.warn('[useDeviationDetection] failed to persist dismiss:', err),
    );
  }, [periodLogs]);

  const acceptInsightPrompt = useCallback(() => {
    setShowInsightPrompt(false);
    const cycleKey = periodLogs[0]?.startDate ?? '';
    setPromptedCycle(cycleKey);
    AsyncStorage.setItem(LAST_DEVIATION_PROMPT_KEY, cycleKey).catch((err) =>
      console.warn('[useDeviationDetection] failed to persist accept:', err),
    );
    // The caller can observe showInsightPrompt going false after accept
    // and open the health insight flow accordingly
  }, [periodLogs]);

  return {
    deviation,
    showInsightPrompt,
    dismissInsightPrompt,
    acceptInsightPrompt,
  };
}
