/**
 * E2E Integration tests: multi-period → store recompute → cycle phase + predictions.
 *
 * These tests verify the full pipeline that EAS-32 requires:
 * 1. Moon adds multiple periods → dashboard shows correct phase + prediction
 * 2. Adding more periods → predictions improve (accuracy/confidence)
 * 3. Removing a period → predictions recalculate
 * 4. Single period → backward compatible (same as before multi-period)
 *
 * Uses the real cycleCalculator (not mocked) combined with store's
 * recomputeCycleFromLogs logic to verify end-to-end correctness.
 */

import {
  computeCycleStats,
  getCurrentPhase,
  getDaysUntilNextPeriod,
  buildCalendarMarkers,
} from '../cycleCalculator';
import type { PeriodRecord, CycleSettings } from '@/types';

// ---------------------------------------------------------------------------
// Helpers (mirror store's recomputeCycleFromLogs logic)
// ---------------------------------------------------------------------------

/** Replicates the store's recomputeCycleFromLogs without needing Zustand. */
function recomputeCycleFromLogs(logs: PeriodRecord[], current: CycleSettings): CycleSettings {
  const lastPeriodStartDate = logs[0]?.startDate ?? current.lastPeriodStartDate;
  const gaps: number[] = [];
  for (let i = 0; i < logs.length - 1; i++) {
    const a = new Date(logs[i].startDate).getTime();
    const b = new Date(logs[i + 1].startDate).getTime();
    const days = Math.round((a - b) / 86_400_000);
    if (days >= 21 && days <= 45) gaps.push(days);
  }
  const avgCycleLength = gaps.length > 0
    ? Math.round(gaps.reduce((sum, d) => sum + d, 0) / gaps.length)
    : current.avgCycleLength;
  return { ...current, lastPeriodStartDate, avgCycleLength };
}

/** Simulate adding a period log (immutable, sorted DESC). */
function addPeriodLog(logs: PeriodRecord[], startDate: string, endDate?: string): PeriodRecord[] {
  const entry: PeriodRecord = endDate ? { startDate, endDate } : { startDate };
  return [entry, ...logs.filter((l) => l.startDate !== startDate)]
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/** Simulate removing a period log. */
function removePeriodLog(logs: PeriodRecord[], startDate: string): PeriodRecord[] {
  return logs.filter((l) => l.startDate !== startDate);
}

const DEFAULT_SETTINGS: CycleSettings = {
  avgCycleLength: 28,
  avgPeriodLength: 5,
  lastPeriodStartDate: '2026-01-01',
};

// ---------------------------------------------------------------------------
// Scenario 1: Moon adds 3 periods → correct phase + prediction
// ---------------------------------------------------------------------------

describe('E2E: Moon adds 3 periods → dashboard shows correct phase + prediction', () => {
  it('computes correct avgCycleLength from 3 periods with 30-day gaps', () => {
    let logs: PeriodRecord[] = [];
    let settings = { ...DEFAULT_SETTINGS };

    // Add 3 periods: 30 days apart
    logs = addPeriodLog(logs, '2026-01-01', '2026-01-05');
    settings = recomputeCycleFromLogs(logs, settings);
    // 1 period → keeps default
    expect(settings.avgCycleLength).toBe(28);

    logs = addPeriodLog(logs, '2026-01-31', '2026-02-04');
    settings = recomputeCycleFromLogs(logs, settings);
    // 2 periods → 1 gap of 30 days
    expect(settings.avgCycleLength).toBe(30);

    logs = addPeriodLog(logs, '2026-03-02', '2026-03-06');
    settings = recomputeCycleFromLogs(logs, settings);
    // 3 periods → 2 gaps of 30 days each
    expect(settings.avgCycleLength).toBe(30);
    expect(settings.lastPeriodStartDate).toBe('2026-03-02');
  });

  it('derives correct phase from recomputed 30-day cycle settings', () => {
    // With avgCycleLength=30, avgPeriodLength=5:
    // ovulationDay = max(6, 30-14) = 16
    expect(getCurrentPhase(1, 30, 5)).toBe('menstrual');
    expect(getCurrentPhase(5, 30, 5)).toBe('menstrual');
    expect(getCurrentPhase(6, 30, 5)).toBe('follicular');
    // ovulationDay = max(6, 30-14) = 16
    expect(getCurrentPhase(13, 30, 5)).toBe('follicular');
    expect(getCurrentPhase(14, 30, 5)).toBe('ovulatory');
    expect(getCurrentPhase(18, 30, 5)).toBe('ovulatory');
    expect(getCurrentPhase(19, 30, 5)).toBe('luteal');
  });

  it('daysUntilNextPeriod reflects recomputed cycle length', () => {
    expect(getDaysUntilNextPeriod(1, 30)).toBe(30);
    expect(getDaysUntilNextPeriod(15, 30)).toBe(16);
    expect(getDaysUntilNextPeriod(30, 30)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Scenario 2: Adding more periods → predictions improve
// ---------------------------------------------------------------------------

describe('E2E: Adding more periods → predictions improve with accuracy', () => {
  it('computeCycleStats confidence increases from low → medium → high', () => {
    // 2 records → 1 gap → low
    const logs2: PeriodRecord[] = [
      { startDate: '2026-03-01' },
      { startDate: '2026-02-01' },
    ];
    expect(computeCycleStats(logs2).confidence).toBe('low');

    // 4 records → 3 gaps → medium
    const logs4: PeriodRecord[] = [
      { startDate: '2026-04-28' },
      { startDate: '2026-03-31' },
      { startDate: '2026-03-03' },
      { startDate: '2026-02-03' },
    ];
    expect(computeCycleStats(logs4).confidence).toBe('medium');

    // 7 records → 6 gaps → high
    const logs7: PeriodRecord[] = [
      { startDate: '2026-06-24' },
      { startDate: '2026-05-27' },
      { startDate: '2026-04-29' },
      { startDate: '2026-04-01' },
      { startDate: '2026-03-04' },
      { startDate: '2026-02-04' },
      { startDate: '2026-01-07' },
    ];
    expect(computeCycleStats(logs7).confidence).toBe('high');
  });

  it('more data points converge avgCycleLength to true pattern', () => {
    // Person has a true 30-day cycle
    // With 2 periods: just one gap, could be noisy
    const logs2: PeriodRecord[] = [
      { startDate: '2026-02-01' },
      { startDate: '2026-01-01' },
    ];
    const stats2 = computeCycleStats(logs2);
    expect(stats2.avgCycleLength).toBe(31); // 31-day gap (Jan→Feb)

    // With 5 periods: more accurate picture (all 30-day gaps)
    const logs5: PeriodRecord[] = [
      { startDate: '2026-05-01' },
      { startDate: '2026-04-01' },
      { startDate: '2026-03-02' },
      { startDate: '2026-01-31' },
      { startDate: '2026-01-01' },
    ];
    const stats5 = computeCycleStats(logs5);
    expect(stats5.avgCycleLength).toBe(30);
    expect(stats5.variability).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Scenario 3: Removing a period → predictions recalculate
// ---------------------------------------------------------------------------

describe('E2E: Moon removes a period → predictions recalculate', () => {
  it('avgCycleLength recalculates after removal', () => {
    let logs: PeriodRecord[] = [
      { startDate: '2026-03-01' },
      { startDate: '2026-02-01' }, // 28-day gap
      { startDate: '2026-01-01' }, // 31-day gap
    ];
    let settings = recomputeCycleFromLogs(logs, DEFAULT_SETTINGS);
    // avg of 28 and 31 = 29.5 → rounds to 30
    expect(settings.avgCycleLength).toBe(30);

    // Remove the middle period
    logs = removePeriodLog(logs, '2026-02-01');
    settings = recomputeCycleFromLogs(logs, settings);
    // Now gap is Jan 1 → Mar 1 = 59 days → outside 21-45 range → filtered
    // No valid gaps → keeps previous avgCycleLength (30)
    expect(settings.avgCycleLength).toBe(30);
    expect(settings.lastPeriodStartDate).toBe('2026-03-01');
  });

  it('lastPeriodStartDate updates to most recent remaining log', () => {
    let logs: PeriodRecord[] = [
      { startDate: '2026-03-15' },
      { startDate: '2026-02-15' },
      { startDate: '2026-01-15' },
    ];
    let settings = recomputeCycleFromLogs(logs, DEFAULT_SETTINGS);
    expect(settings.lastPeriodStartDate).toBe('2026-03-15');

    // Remove most recent
    logs = removePeriodLog(logs, '2026-03-15');
    settings = recomputeCycleFromLogs(logs, settings);
    expect(settings.lastPeriodStartDate).toBe('2026-02-15');
  });
});

// ---------------------------------------------------------------------------
// Scenario 4: Single period → backward compatible
// ---------------------------------------------------------------------------

describe('E2E: Single period → backward compatible (same as before)', () => {
  it('single period keeps default avgCycleLength of 28', () => {
    const logs: PeriodRecord[] = [{ startDate: '2026-03-01' }];
    const settings = recomputeCycleFromLogs(logs, DEFAULT_SETTINGS);
    expect(settings.avgCycleLength).toBe(28);
    expect(settings.lastPeriodStartDate).toBe('2026-03-01');
  });

  it('single period produces standard phases identical to pre-multi-period', () => {
    // Default 28-day cycle, 5-day period
    expect(getCurrentPhase(1, 28, 5)).toBe('menstrual');
    expect(getCurrentPhase(5, 28, 5)).toBe('menstrual');
    expect(getCurrentPhase(6, 28, 5)).toBe('follicular');
    expect(getCurrentPhase(12, 28, 5)).toBe('ovulatory');
    expect(getCurrentPhase(17, 28, 5)).toBe('luteal');
    expect(getCurrentPhase(28, 28, 5)).toBe('luteal');
  });

  it('computeCycleStats returns defaults for single record', () => {
    const stats = computeCycleStats([{ startDate: '2026-03-01' }]);
    expect(stats.avgCycleLength).toBe(28);
    expect(stats.avgPeriodLength).toBe(5);
    expect(stats.confidence).toBe('low');
  });

  it('calendar markers work with single period (no logged history)', () => {
    // Use future date since FR-12 skips predicted dates before today
    const markers = buildCalendarMarkers('2027-03-01', 28, 5);
    // Should have predicted period + ovulation + fertile markers
    expect(markers['2027-03-01']).toEqual({ type: 'period', source: 'predicted' });
    expect(markers['2027-03-05']).toEqual({ type: 'period', source: 'predicted' });
  });

  it('calendar markers with single period log marks it as logged', () => {
    const logs: PeriodRecord[] = [{ startDate: '2026-03-01', endDate: '2026-03-05' }];
    const markers = buildCalendarMarkers('2026-03-01', 28, 5, logs);
    expect(markers['2026-03-01']).toEqual({ type: 'period', source: 'logged' });
    expect(markers['2026-03-05']).toEqual({ type: 'period', source: 'logged' });
  });
});

// ---------------------------------------------------------------------------
// Calendar markers with multi-period recomputed stats
// ---------------------------------------------------------------------------

describe('E2E: Calendar markers reflect recomputed stats from multiple periods', () => {
  it('markers use recomputed cycle length for predictions', () => {
    const logs: PeriodRecord[] = [
      { startDate: '2026-03-01', endDate: '2026-03-04' },
      { startDate: '2026-02-01', endDate: '2026-02-04' },
    ];
    const settings = recomputeCycleFromLogs(logs, DEFAULT_SETTINGS);
    // Gap = 28 days
    expect(settings.avgCycleLength).toBe(28);

    const markers = buildCalendarMarkers(
      settings.lastPeriodStartDate,
      settings.avgCycleLength,
      settings.avgPeriodLength,
      logs,
    );

    // Logged periods should appear as 'logged'
    expect(markers['2026-03-01']).toEqual({ type: 'period', source: 'logged' });
    expect(markers['2026-02-01']).toEqual({ type: 'period', source: 'logged' });

    // Next predicted cycle should start 28 days after last period
    expect(markers['2026-03-29']).toEqual({ type: 'period', source: 'predicted' });
  });

  it('logged dates take precedence over predicted in integrated flow', () => {
    const logs: PeriodRecord[] = [
      { startDate: '2026-03-01', endDate: '2026-03-05' },
      { startDate: '2026-02-01', endDate: '2026-02-05' },
    ];
    const settings = recomputeCycleFromLogs(logs, DEFAULT_SETTINGS);
    const markers = buildCalendarMarkers(
      settings.lastPeriodStartDate,
      settings.avgCycleLength,
      settings.avgPeriodLength,
      logs,
    );

    // Logged dates: March 1-5 should be 'logged', not 'predicted'
    for (let d = 1; d <= 5; d++) {
      const key = `2026-03-0${d}`;
      expect(markers[key]?.source).toBe('logged');
    }
  });
});
