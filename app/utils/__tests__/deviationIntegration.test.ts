/**
 * Integration tests: log → recalculate → deviation detection pipeline.
 *
 * These tests verify that the full cycle recalculation pipeline produces
 * correct deviation results when a new period is logged. They combine:
 *   computeCycleStats() → predicted next date → detectDeviation()
 *
 * This is the QA contract for EAS-45. When the Backend Engineer wires
 * detectDeviation into addPeriodLog (ticket 1.1), these tests validate
 * the end-to-end data flow.
 */

import { computeCycleStats, detectDeviation } from '../cycleCalculator';
import type { PeriodRecord, CycleDeviation } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRecords(entries: Array<[string, string?]>): PeriodRecord[] {
  return entries.map(([startDate, endDate]) =>
    endDate ? { startDate, endDate } : { startDate },
  );
}

/** Add days to a YYYY-MM-DD string using local-time construction (timezone-safe). */
function dateOffset(base: string, offsetDays: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d + offsetDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Simulates the full pipeline:
 * 1. Compute stats from existing logs
 * 2. Derive predicted next period date from stats + last period
 * 3. Run detectDeviation with the actual new period date
 */
function runPipeline(
  existingLogs: PeriodRecord[],
  actualNewPeriodDate: string,
): { stats: ReturnType<typeof computeCycleStats>; deviation: CycleDeviation } {
  const stats = computeCycleStats(existingLogs);
  const lastPeriod = [...existingLogs].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  )[0];
  const deviation = detectDeviation(
    actualNewPeriodDate,
    lastPeriod.startDate,
    stats.avgCycleLength,
  );
  return { stats, deviation };
}

// ---------------------------------------------------------------------------
// Pipeline: computeCycleStats → predicted date → detectDeviation
// ---------------------------------------------------------------------------

describe('log → recalculate → deviation pipeline', () => {
  it('regular cycle (3 periods, 28-day gaps) + on-time new period', () => {
    // 3 periods 28 days apart → avg = 28, confidence = low (2 gaps)
    const logs = makeRecords([
      ['2025-03-01'],
      ['2025-02-01'],
      ['2025-01-04'],
    ]);
    const predicted = dateOffset('2025-03-01', 28);
    const { stats, deviation } = runPipeline(logs, predicted);

    expect(stats.avgCycleLength).toBe(28);
    expect(deviation.type).toBe('on_time');
    expect(deviation.daysDifference).toBe(0);
    expect(deviation.isSignificant).toBe(false);
  });

  it('regular cycle + late period triggers significant deviation', () => {
    const logs = makeRecords([
      ['2025-03-01'],
      ['2025-02-01'],
      ['2025-01-04'],
    ]);
    const predicted = dateOffset('2025-03-01', 28);
    const actual = dateOffset(predicted, 7); // 7 days late
    const { deviation } = runPipeline(logs, actual);

    expect(deviation.type).toBe('late');
    expect(deviation.daysDifference).toBe(7);
    expect(deviation.isSignificant).toBe(true);
    expect(deviation.predictedDate).toBe(predicted);
  });

  it('regular cycle + early period triggers significant deviation', () => {
    const logs = makeRecords([
      ['2025-03-01'],
      ['2025-02-01'],
      ['2025-01-04'],
    ]);
    const predicted = dateOffset('2025-03-01', 28);
    const actual = dateOffset(predicted, -6); // 6 days early
    const { deviation } = runPipeline(logs, actual);

    expect(deviation.type).toBe('early');
    expect(deviation.daysDifference).toBe(-6);
    expect(deviation.isSignificant).toBe(true);
  });

  it('irregular cycle history produces wider predictions', () => {
    // Gaps: 35, 25, 30 → weighted avg emphasizes recent
    // recentCount = ceil(3/2) = 2 → indices 0,1 get 2x weight
    // wSum = 35*2 + 25*2 + 30*1 = 150; wTotal = 5 → avg = 30
    const logs = makeRecords([
      ['2025-04-05'], // most recent
      ['2025-03-01'], // gap 35
      ['2025-02-04'], // gap 25
      ['2025-01-05'], // gap 30
    ]);
    const predicted = dateOffset('2025-04-05', 30);
    const actual = dateOffset(predicted, 2); // 2 days late → on_time
    const { stats, deviation } = runPipeline(logs, actual);

    expect(stats.avgCycleLength).toBe(30);
    expect(deviation.type).toBe('on_time');
    expect(deviation.daysDifference).toBe(2);
    expect(deviation.isSignificant).toBe(false);
  });

  it('single period log falls back to default 28 days', () => {
    const logs = makeRecords([['2025-03-01']]);
    const predicted = dateOffset('2025-03-01', 28);
    const { stats, deviation } = runPipeline(logs, predicted);

    expect(stats.avgCycleLength).toBe(28);
    expect(deviation.type).toBe('on_time');
    expect(deviation.daysDifference).toBe(0);
  });

  it('single period log + early actual period → deviation detected', () => {
    const logs = makeRecords([['2025-03-01']]);
    const predicted = dateOffset('2025-03-01', 28);
    const actual = dateOffset(predicted, -7); // 7 days early
    const { deviation } = runPipeline(logs, actual);

    expect(deviation.type).toBe('early');
    expect(deviation.daysDifference).toBe(-7);
    expect(deviation.isSignificant).toBe(true);
  });

  it('high-confidence history (7 periods) + slight deviation is not significant', () => {
    // 7 records, each 30 days apart → high confidence
    const logs = makeRecords([
      ['2025-07-28'],
      ['2025-06-28'],
      ['2025-05-29'],
      ['2025-04-29'],
      ['2025-03-30'],
      ['2025-02-28'],
      ['2025-01-29'],
    ]);
    const predicted = dateOffset('2025-07-28', 30);
    const actual = dateOffset(predicted, 1); // 1 day late → on_time
    const { stats, deviation } = runPipeline(logs, actual);

    expect(stats.confidence).toBe('high');
    expect(deviation.type).toBe('on_time');
    expect(deviation.isSignificant).toBe(false);
  });

  it('recomputation with endDate records affects avgPeriodLength', () => {
    const logs = makeRecords([
      ['2025-03-01', '2025-03-07'], // 7-day period
      ['2025-02-01', '2025-02-04'], // 4-day period
      ['2025-01-04', '2025-01-07'], // 4-day period
    ]);
    const { stats } = runPipeline(logs, dateOffset('2025-03-01', 28));

    expect(stats.avgCycleLength).toBe(28);
    expect(stats.avgPeriodLength).toBe(5); // (7+4+4)/3 = 5
  });

  it('pipeline handles year boundary: Dec → Jan cycle', () => {
    const logs = makeRecords([
      ['2025-12-15'],
      ['2025-11-17'], // gap 28
    ]);
    const predicted = dateOffset('2025-12-15', 28);
    const actual = dateOffset(predicted, 6); // 6 days late
    const { deviation } = runPipeline(logs, actual);

    expect(deviation.type).toBe('late');
    expect(deviation.daysDifference).toBe(6);
    expect(deviation.predictedDate).toBe(predicted);
    expect(deviation.isSignificant).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases: pipeline with unusual inputs
// ---------------------------------------------------------------------------

describe('deviation pipeline edge cases', () => {
  it('all gaps outside valid range → falls back to default, deviation still works', () => {
    // Gaps of 10 days (invalid) → computeCycleStats returns default 28
    const logs = makeRecords([
      ['2025-02-01'],
      ['2025-01-22'], // gap 10 — invalid
      ['2025-01-12'], // gap 10 — invalid
    ]);
    const predicted = dateOffset('2025-02-01', 28);
    const { stats, deviation } = runPipeline(logs, predicted);

    expect(stats.avgCycleLength).toBe(28);
    expect(deviation.type).toBe('on_time');
    expect(deviation.daysDifference).toBe(0);
  });

  it('very late period (14+ days) is significant', () => {
    const logs = makeRecords([
      ['2025-03-01'],
      ['2025-02-01'], // gap 28
    ]);
    const predicted = dateOffset('2025-03-01', 28);
    const actual = dateOffset(predicted, 14); // 14 days late
    const { deviation } = runPipeline(logs, actual);

    expect(deviation.type).toBe('late');
    expect(deviation.daysDifference).toBe(14);
    expect(deviation.isSignificant).toBe(true);
  });

  it('very early period (10+ days) is significant', () => {
    const logs = makeRecords([
      ['2025-03-01'],
      ['2025-02-01'], // gap 28
    ]);
    const predicted = dateOffset('2025-03-01', 28);
    const actual = dateOffset(predicted, -12); // 12 days early
    const { deviation } = runPipeline(logs, actual);

    expect(deviation.type).toBe('early');
    expect(deviation.daysDifference).toBe(-12);
    expect(deviation.isSignificant).toBe(true);
  });

  it('consecutive on-time periods maintain confidence without false deviations', () => {
    // 4 periods, all 28 days apart → medium confidence, no deviation
    const logs = makeRecords([
      ['2025-04-26'],
      ['2025-03-29'],
      ['2025-03-01'],
      ['2025-02-01'],
    ]);
    const predicted = dateOffset('2025-04-26', 28);
    const { stats, deviation } = runPipeline(logs, predicted);

    expect(stats.confidence).toBe('medium');
    expect(deviation.type).toBe('on_time');
    expect(deviation.isSignificant).toBe(false);
  });
});
