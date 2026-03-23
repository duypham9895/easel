import { useState, useCallback } from 'react';
import { useHealthSync, PeriodRecord } from '@/hooks/useHealthSync';
import { useAppStore } from '@/store/appStore';

export type OnboardingStep =
  | 'education'
  | 'syncing'
  | 'import-summary'
  | 'empty-state'
  | 'manual-input'
  | 'review'
  | 'permission-denied';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SyncResult {
  records: PeriodRecord[];
  periodsFound: number;
  dateRange: { start: string; end: string } | null;
  avgCycleLength: number;
  avgPeriodLength: number;
  lastPeriodStartDate: string;
  source: 'healthkit' | 'manual';
  confidenceLevel: ConfidenceLevel;
}

interface ManualInput {
  lastPeriodStartDate: string;
  avgCycleLength: number;
  avgPeriodLength: number;
}

interface MultiPeriodInput {
  periods: Array<{ startDate: string; endDate?: string }>;
  avgCycleLength: number;
  avgPeriodLength: number;
}

function computeAvgCycleLength(records: PeriodRecord[]): number {
  if (records.length < 2) return 28;
  const gaps: number[] = [];
  for (let i = 0; i < records.length - 1; i++) {
    const curr = new Date(records[i].startDate).getTime();
    const next = new Date(records[i + 1].startDate).getTime();
    const diffDays = Math.round(Math.abs(next - curr) / 86_400_000);
    if (diffDays >= 21 && diffDays <= 45) {
      gaps.push(diffDays);
    }
  }
  if (gaps.length === 0) return 28;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

function computeAvgPeriodLength(records: PeriodRecord[]): number {
  const lengths: number[] = [];
  for (const r of records) {
    if (r.endDate) {
      const start = new Date(r.startDate).getTime();
      const end = new Date(r.endDate).getTime();
      const days = Math.round(Math.abs(end - start) / 86_400_000) + 1;
      if (days >= 2 && days <= 10) {
        lengths.push(days);
      }
    }
  }
  if (lengths.length === 0) return 5;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

function computeConfidence(periodsFound: number, source: 'healthkit' | 'manual'): ConfidenceLevel {
  if (source === 'manual') return 'low';
  if (periodsFound >= 6) return 'high';
  if (periodsFound >= 2) return 'medium';
  return 'low';
}

function computePredictedDate(lastPeriodStartDate: string, avgCycleLength: number): string {
  const start = new Date(lastPeriodStartDate);
  start.setHours(12, 0, 0, 0);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Find next period date that's in the future
  let nextDate = new Date(start);
  while (nextDate <= today) {
    nextDate.setDate(nextDate.getDate() + avgCycleLength);
  }
  return nextDate.toISOString().split('T')[0];
}

export function useHealthSyncOnboarding() {
  const { isAvailable, sync } = useHealthSync();
  const updateCycleSettings = useAppStore((s) => s.updateCycleSettings);

  const [step, setStep] = useState<OnboardingStep>('education');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncHealthKit = useCallback(async () => {
    setStep('syncing');
    setIsSyncing(true);
    try {
      const records = await sync();
      setIsSyncing(false);

      if (records.length === 0) {
        setStep('empty-state');
        return;
      }

      const avgCycleLength = computeAvgCycleLength(records);
      const avgPeriodLength = computeAvgPeriodLength(records);
      const lastPeriodStartDate = records[0].startDate;
      const confidenceLevel = computeConfidence(records.length, 'healthkit');

      const result: SyncResult = {
        records,
        periodsFound: records.length,
        dateRange: {
          start: records[records.length - 1].startDate,
          end: records[0].startDate,
        },
        avgCycleLength,
        avgPeriodLength,
        lastPeriodStartDate,
        source: 'healthkit',
        confidenceLevel,
      };

      setSyncResult(result);
      setStep('import-summary');
    } catch {
      setIsSyncing(false);
      setStep('permission-denied');
    }
  }, [sync]);

  const handlePermissionDenied = useCallback(() => {
    setStep('manual-input');
  }, []);

  const handleManualSubmit = useCallback((input: ManualInput) => {
    const result: SyncResult = {
      records: [],
      periodsFound: 0,
      dateRange: null,
      avgCycleLength: input.avgCycleLength,
      avgPeriodLength: input.avgPeriodLength,
      lastPeriodStartDate: input.lastPeriodStartDate,
      source: 'manual',
      confidenceLevel: 'low',
    };
    setSyncResult(result);
    setStep('review');
  }, []);

  const handleMultiPeriodSubmit = useCallback((input: MultiPeriodInput) => {
    const sorted = [...input.periods].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
    const lastPeriodStartDate = sorted[0]?.startDate ?? new Date().toISOString().split('T')[0];
    const confidenceLevel = computeConfidence(sorted.length, 'manual');

    const records: PeriodRecord[] = sorted.map(p => ({
      startDate: p.startDate,
      endDate: p.endDate ?? undefined,
    }));

    const result: SyncResult = {
      records,
      periodsFound: sorted.length,
      dateRange: sorted.length > 1
        ? { start: sorted[sorted.length - 1].startDate, end: sorted[0].startDate }
        : null,
      avgCycleLength: input.avgCycleLength,
      avgPeriodLength: input.avgPeriodLength,
      lastPeriodStartDate,
      source: 'manual',
      confidenceLevel,
    };
    setSyncResult(result);
    setStep('review');
  }, []);

  const handleImportContinue = useCallback(() => {
    setStep('review');
  }, []);

  const handleImportReject = useCallback(() => {
    // Pre-fill manual input with synced values
    setStep('manual-input');
  }, []);

  const handleEditFromReview = useCallback(() => {
    setStep('manual-input');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!syncResult) return;
    await updateCycleSettings({
      avgCycleLength: syncResult.avgCycleLength,
      avgPeriodLength: syncResult.avgPeriodLength,
      lastPeriodStartDate: syncResult.lastPeriodStartDate,
    });
  }, [syncResult, updateCycleSettings]);

  const handleSkipToManual = useCallback(() => {
    setStep('manual-input');
  }, []);

  const predictedDate = syncResult
    ? computePredictedDate(syncResult.lastPeriodStartDate, syncResult.avgCycleLength)
    : null;

  return {
    step,
    syncResult,
    isSyncing,
    isHealthKitAvailable: isAvailable,
    predictedDate,
    computePredictedDate,
    handleSyncHealthKit,
    handlePermissionDenied,
    handleManualSubmit,
    handleMultiPeriodSubmit,
    handleImportContinue,
    handleImportReject,
    handleEditFromReview,
    handleConfirm,
    handleSkipToManual,
  };
}
