import {
  getCurrentDayInCycle,
  getCurrentPhase,
  getDaysUntilNextPeriod,
  getConceptionChance,
  buildCalendarMarkers,
  computeCycleStats,
  detectDeviation,
} from '../cycleCalculator';
import type { PeriodRecord, CycleDeviation } from '@/types';

// Standard cycle params used throughout: 28-day cycle, 5-day period
// getOvulationDay(28, 5) = Math.max(6, 14) = 14
// Phases: menstrual=1–5, follicular=6–11, ovulatory=12–16, luteal=17–28

describe('getConceptionChance', () => {
  it('returns Low for menstrual', () => {
    expect(getConceptionChance('menstrual')).toBe('Low');
  });

  it('returns Medium for follicular', () => {
    expect(getConceptionChance('follicular')).toBe('Medium');
  });

  it('returns Very High for ovulatory', () => {
    expect(getConceptionChance('ovulatory')).toBe('Very High');
  });

  it('returns Low for luteal', () => {
    expect(getConceptionChance('luteal')).toBe('Low');
  });
});

describe('getCurrentDayInCycle', () => {
  function toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  it('returns 1 when lastPeriodStartDate is today', () => {
    const today = toDateString(new Date());
    expect(getCurrentDayInCycle(today, 28)).toBe(1);
  });

  it('returns 2 when lastPeriodStartDate was yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getCurrentDayInCycle(toDateString(yesterday), 28)).toBe(2);
  });

  it('returns 28 on the last day of a 28-day cycle', () => {
    const start = new Date();
    start.setDate(start.getDate() - 27);
    expect(getCurrentDayInCycle(toDateString(start), 28)).toBe(28);
  });

  it('returns 1 when lastPeriodStartDate is in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(getCurrentDayInCycle(toDateString(tomorrow), 28)).toBe(1);
  });
});

describe('getCurrentPhase', () => {
  // Standard: 28-day cycle, 5-day period, ovulation day = 14
  // Boundary: menstrual ends at 5, follicular ends at 11, ovulatory ends at 16

  it('returns menstrual on day 1', () => {
    expect(getCurrentPhase(1, 28, 5)).toBe('menstrual');
  });

  it('returns menstrual on last day of period (day 5)', () => {
    expect(getCurrentPhase(5, 28, 5)).toBe('menstrual');
  });

  it('returns follicular on first day after period (day 6)', () => {
    expect(getCurrentPhase(6, 28, 5)).toBe('follicular');
  });

  it('returns follicular on last day before ovulatory window (day 11)', () => {
    expect(getCurrentPhase(11, 28, 5)).toBe('follicular');
  });

  it('returns ovulatory on first day of ovulatory window (day 12)', () => {
    expect(getCurrentPhase(12, 28, 5)).toBe('ovulatory');
  });

  it('returns ovulatory on ovulation day (day 14)', () => {
    expect(getCurrentPhase(14, 28, 5)).toBe('ovulatory');
  });

  it('returns ovulatory on last day of ovulatory window (day 16)', () => {
    expect(getCurrentPhase(16, 28, 5)).toBe('ovulatory');
  });

  it('returns luteal on first day after ovulatory window (day 17)', () => {
    expect(getCurrentPhase(17, 28, 5)).toBe('luteal');
  });

  it('returns luteal on last day of cycle (day 28)', () => {
    expect(getCurrentPhase(28, 28, 5)).toBe('luteal');
  });

  it('handles short cycle (21-day, 3-day period) — ovulation = day 7', () => {
    // getOvulationDay(21, 3) = Math.max(4, 7) = 7
    // menstrual=1–3, follicular=4–4, ovulatory=5–9, luteal=10–21
    expect(getCurrentPhase(1, 21, 3)).toBe('menstrual');
    expect(getCurrentPhase(3, 21, 3)).toBe('menstrual');
    expect(getCurrentPhase(4, 21, 3)).toBe('follicular');
    expect(getCurrentPhase(5, 21, 3)).toBe('ovulatory');
    expect(getCurrentPhase(10, 21, 3)).toBe('luteal');
  });

  it('handles long cycle (45-day, 7-day period) — ovulation = day 31', () => {
    // getOvulationDay(45, 7) = Math.max(8, 31) = 31
    // menstrual=1–7, follicular=8–28, ovulatory=29–33, luteal=34–45
    expect(getCurrentPhase(1, 45, 7)).toBe('menstrual');
    expect(getCurrentPhase(7, 45, 7)).toBe('menstrual');
    expect(getCurrentPhase(8, 45, 7)).toBe('follicular');
    expect(getCurrentPhase(28, 45, 7)).toBe('follicular');
    expect(getCurrentPhase(29, 45, 7)).toBe('ovulatory');
    expect(getCurrentPhase(33, 45, 7)).toBe('ovulatory');
    expect(getCurrentPhase(34, 45, 7)).toBe('luteal');
    expect(getCurrentPhase(45, 45, 7)).toBe('luteal');
  });

  it('handles minimum period length (2 days)', () => {
    // getOvulationDay(28, 2) = Math.max(3, 14) = 14
    expect(getCurrentPhase(1, 28, 2)).toBe('menstrual');
    expect(getCurrentPhase(2, 28, 2)).toBe('menstrual');
    expect(getCurrentPhase(3, 28, 2)).toBe('follicular');
  });

  it('handles maximum period length (10 days)', () => {
    // getOvulationDay(28, 10) = Math.max(11, 14) = 14
    expect(getCurrentPhase(10, 28, 10)).toBe('menstrual');
    expect(getCurrentPhase(11, 28, 10)).toBe('follicular');
  });
});

describe('getDaysUntilNextPeriod', () => {
  it('returns full cycle length on day 1', () => {
    expect(getDaysUntilNextPeriod(1, 28)).toBe(28);
  });

  it('returns 1 on the last day of the cycle', () => {
    expect(getDaysUntilNextPeriod(28, 28)).toBe(1);
  });

  it('returns cycleLength when day exceeds cycle (wrap-around)', () => {
    expect(getDaysUntilNextPeriod(29, 28)).toBe(28);
  });

  it('returns correct mid-cycle value (day 14 of 28)', () => {
    expect(getDaysUntilNextPeriod(14, 28)).toBe(15);
  });

  it('works for a 21-day cycle', () => {
    expect(getDaysUntilNextPeriod(1, 21)).toBe(21);
    expect(getDaysUntilNextPeriod(21, 21)).toBe(1);
  });

  it('works for a 45-day cycle', () => {
    expect(getDaysUntilNextPeriod(1, 45)).toBe(45);
    expect(getDaysUntilNextPeriod(45, 45)).toBe(1);
  });
});

describe('buildCalendarMarkers', () => {
  // Use a helper that computes expected keys using local-time construction,
  // matching the implementation's toLocalDateString() approach.
  function dateKey(start: string, offsetDays: number): string {
    const [y, m, d] = start.split('-').map(Number);
    const dt = new Date(y, m - 1, d + offsetDays);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  const START = '2025-06-15'; // mid-year to avoid UTC-boundary edge cases
  const CYCLE = 28;
  const PERIOD = 5;
  // getOvulationDay(28, 5) = Math.max(6, 14) = 14 → offset = 13 from cycleStart

  it('marks cycle start date as period (day 1)', () => {
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD);
    expect(markers[dateKey(START, 0)]).toEqual({ type: 'period', source: 'predicted' });
  });

  it('marks last period day as period (day 5)', () => {
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD);
    expect(markers[dateKey(START, 4)]).toEqual({ type: 'period', source: 'predicted' });
  });

  it('marks ovulation day correctly (cycleStart + 13 days)', () => {
    // ovulationDay = 14, zero-indexed offset = 13
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD);
    expect(markers[dateKey(START, 13)]).toEqual({ type: 'ovulation', source: 'predicted' });
  });

  it('marks fertile window (3 days before ovulation: offsets 10, 11, 12)', () => {
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD);
    expect(markers[dateKey(START, 10)]).toEqual({ type: 'fertile', source: 'predicted' });
    expect(markers[dateKey(START, 11)]).toEqual({ type: 'fertile', source: 'predicted' });
    expect(markers[dateKey(START, 12)]).toEqual({ type: 'fertile', source: 'predicted' });
  });

  it('covers 3 cycles — second cycle period day 1 at offset 28', () => {
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD);
    expect(markers[dateKey(START, 28)]).toEqual({ type: 'period', source: 'predicted' });
  });

  it('covers 3 cycles — third cycle period day 1 at offset 56', () => {
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD);
    expect(markers[dateKey(START, 56)]).toEqual({ type: 'period', source: 'predicted' });
  });

  it('period days are not overwritten by fertile marker', () => {
    // Period = days 0–4, fertile = days 10–12 — no overlap
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD);
    expect(markers[dateKey(START, 0)]).toEqual({ type: 'period', source: 'predicted' });
    expect(markers[dateKey(START, 4)]).toEqual({ type: 'period', source: 'predicted' });
  });

  it('second cycle has ovulation marker at correct offset', () => {
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD);
    // Second cycle starts at offset 28, ovulation at offset 28 + 13 = 41
    expect(markers[dateKey(START, 41)]).toEqual({ type: 'ovulation', source: 'predicted' });
  });

  it('produces markers for a short 21-day cycle', () => {
    // getOvulationDay(21, 3) = Math.max(4, 7) = 7 → offset 6
    const markers = buildCalendarMarkers(START, 21, 3);
    expect(markers[dateKey(START, 0)]).toEqual({ type: 'period', source: 'predicted' });
    expect(markers[dateKey(START, 6)]).toEqual({ type: 'ovulation', source: 'predicted' });
    // Second cycle starts at offset 21
    expect(markers[dateKey(START, 21)]).toEqual({ type: 'period', source: 'predicted' });
  });

  it('fertile marker does not overwrite existing period marker (overlap)', () => {
    // 21-day cycle, 5-day period: ovulationDay = max(6, 7) = 7
    // Period: offsets 0–4 (days 1–5)
    // Fertile window: 3 days before ovulation offset 6 → offsets 3, 4, 5
    // Offsets 3 and 4 are already period days → should stay as 'period'
    const markers = buildCalendarMarkers(START, 21, 5);
    expect(markers[dateKey(START, 3)]).toEqual({ type: 'period', source: 'predicted' });
    expect(markers[dateKey(START, 4)]).toEqual({ type: 'period', source: 'predicted' });
    // Offset 5 has no prior marker → should be 'fertile'
    expect(markers[dateKey(START, 5)]).toEqual({ type: 'fertile', source: 'predicted' });
  });

  it('marks historical period logs as logged source', () => {
    const periodLogs: PeriodRecord[] = [
      { startDate: '2025-06-01', endDate: '2025-06-04' },
    ];
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD, periodLogs);
    // June 1-4 should be logged
    expect(markers['2025-06-01']).toEqual({ type: 'period', source: 'logged' });
    expect(markers['2025-06-02']).toEqual({ type: 'period', source: 'logged' });
    expect(markers['2025-06-03']).toEqual({ type: 'period', source: 'logged' });
    expect(markers['2025-06-04']).toEqual({ type: 'period', source: 'logged' });
  });

  it('logged data takes precedence over predicted data for the same date', () => {
    // Log a period that overlaps with the predicted cycle start
    const periodLogs: PeriodRecord[] = [
      { startDate: START, endDate: dateKey(START, 2) },
    ];
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD, periodLogs);
    // Days 0-2 should be logged (overlap with predicted period days 0-4)
    expect(markers[dateKey(START, 0)]).toEqual({ type: 'period', source: 'logged' });
    expect(markers[dateKey(START, 1)]).toEqual({ type: 'period', source: 'logged' });
    expect(markers[dateKey(START, 2)]).toEqual({ type: 'period', source: 'logged' });
    // Days 3-4 should still be predicted (no logged data)
    expect(markers[dateKey(START, 3)]).toEqual({ type: 'period', source: 'predicted' });
    expect(markers[dateKey(START, 4)]).toEqual({ type: 'period', source: 'predicted' });
  });

  it('logged periods do not get overwritten by predicted ovulation or fertile markers', () => {
    // Log a period that extends into where ovulation would be predicted
    const periodLogs: PeriodRecord[] = [
      { startDate: dateKey(START, 10), endDate: dateKey(START, 14) },
    ];
    const markers = buildCalendarMarkers(START, CYCLE, PERIOD, periodLogs);
    // Offsets 10-12 are fertile window, 13 is ovulation — but logged period should take precedence
    expect(markers[dateKey(START, 10)]).toEqual({ type: 'period', source: 'logged' });
    expect(markers[dateKey(START, 11)]).toEqual({ type: 'period', source: 'logged' });
    expect(markers[dateKey(START, 12)]).toEqual({ type: 'period', source: 'logged' });
    expect(markers[dateKey(START, 13)]).toEqual({ type: 'period', source: 'logged' });
    expect(markers[dateKey(START, 14)]).toEqual({ type: 'period', source: 'logged' });
  });
});

describe('computeCycleStats', () => {
  // Helper: build a PeriodRecord array from an array of [startDate, endDate?] pairs
  function makeRecords(entries: Array<[string, string?]>): PeriodRecord[] {
    return entries.map(([startDate, endDate]) => (endDate ? { startDate, endDate } : { startDate }));
  }

  it('returns defaults for empty input', () => {
    expect(computeCycleStats([])).toEqual({
      avgCycleLength: 28,
      avgPeriodLength: 5,
      variability: 0,
      confidence: 'low',
    });
  });

  it('returns defaults for a single period record', () => {
    const logs = makeRecords([['2025-01-01']]);
    expect(computeCycleStats(logs)).toEqual({
      avgCycleLength: 28,
      avgPeriodLength: 5,
      variability: 0,
      confidence: 'low',
    });
  });

  it('computes correct cycle length from 2 periods (1 gap) — low confidence', () => {
    // Gap: 2025-02-01 to 2025-01-01 = 31 days
    const logs = makeRecords([['2025-02-01'], ['2025-01-01']]);
    const result = computeCycleStats(logs);
    expect(result.avgCycleLength).toBe(31);
    expect(result.confidence).toBe('low');
    expect(result.variability).toBe(0); // single gap, std dev = 0
  });

  it('returns medium confidence with 4 periods (3 gaps)', () => {
    // Gaps: 28, 28, 28 — all uniform
    const logs = makeRecords([
      ['2025-04-01'],
      ['2025-03-04'],
      ['2025-02-04'],
      ['2025-01-07'],
    ]);
    const result = computeCycleStats(logs);
    expect(result.confidence).toBe('medium');
    expect(result.avgCycleLength).toBe(28);
    expect(result.variability).toBe(0);
  });

  it('returns high confidence with 7 periods (6 gaps) and variability = 0 for uniform gaps', () => {
    // 7 records, each 28 days apart
    const logs = makeRecords([
      ['2025-07-01'],
      ['2025-06-03'],
      ['2025-05-06'],
      ['2025-04-08'],
      ['2025-03-11'],
      ['2025-02-11'],
      ['2025-01-14'],
    ]);
    const result = computeCycleStats(logs);
    expect(result.confidence).toBe('high');
    expect(result.avgCycleLength).toBe(28);
    expect(result.variability).toBe(0);
  });

  it('applies recent-cycle 2x weighting: first half of gaps weighted more heavily', () => {
    // 6 gaps: recent 3 at 21 days, older 3 at 42 days
    // recentCount = ceil(6/2) = 3 → indices 0,1,2 get weight 2; indices 3,4,5 get weight 1
    // wSum = 3*(21*2) + 3*(42*1) = 126 + 126 = 252; wTotal = 3*2 + 3*1 = 9
    // weighted avg = 252/9 = 28
    const logs = makeRecords([
      ['2025-07-01'], // base (most recent)
      ['2025-06-10'], // gap 21
      ['2025-05-20'], // gap 21
      ['2025-04-29'], // gap 21
      ['2025-03-18'], // gap 42
      ['2025-02-04'], // gap 42
      ['2024-12-24'], // gap 42
    ]);
    const result = computeCycleStats(logs);
    expect(result.avgCycleLength).toBe(28);
    expect(result.confidence).toBe('high');
  });

  it('only uses last 7 records (6 gaps) when 9 records are provided', () => {
    // 9 records: oldest 2 should be ignored
    // All gaps are 28 days so result is same regardless, but confidence must be high (6 gaps)
    const logs = makeRecords([
      ['2025-09-01'],
      ['2025-08-04'],
      ['2025-07-07'],
      ['2025-06-09'],
      ['2025-05-12'],
      ['2025-04-14'],
      ['2025-03-17'],
      ['2025-02-17'], // 8th record — excluded after slice
      ['2025-01-20'], // 9th record — excluded after slice
    ]);
    const result = computeCycleStats(logs);
    expect(result.confidence).toBe('high');
    expect(result.avgCycleLength).toBe(28);
  });

  it('computes correct population std dev for variability', () => {
    // 3 gaps: 28, 30, 32 → mean=30, variance=((4+0+4)/3)=8/3, std dev≈1.6
    const logs = makeRecords([
      ['2025-04-01'],
      ['2025-03-04'], // gap 28
      ['2025-02-02'], // gap 30
      ['2025-01-01'], // gap 32
    ]);
    const result = computeCycleStats(logs);
    // std dev = sqrt((4+0+4)/3) = sqrt(8/3) ≈ 1.6329... → rounded to 1 decimal = 1.6
    expect(result.variability).toBe(1.6);
  });

  it('filters out gaps outside 21–45 day range', () => {
    // 3 gaps: 20 (invalid), 28 (valid), 50 (invalid) → only 1 valid gap
    const logs = makeRecords([
      ['2025-04-01'],
      ['2025-03-12'], // gap 20 — too short, filtered
      ['2025-02-12'], // gap 28 — valid
      ['2025-01-23'], // gap 20 — too short, filtered
    ]);
    // Only 1 valid gap (28), so confidence = low
    const result = computeCycleStats(logs);
    expect(result.avgCycleLength).toBe(28);
    expect(result.confidence).toBe('low');
  });

  it('returns defaults when all gaps are outside the valid range', () => {
    // All gaps of 10 days (invalid)
    const logs = makeRecords([
      ['2025-02-01'],
      ['2025-01-22'], // gap 10
      ['2025-01-12'], // gap 10
    ]);
    expect(computeCycleStats(logs)).toEqual({
      avgCycleLength: 28,
      avgPeriodLength: 5,
      variability: 0,
      confidence: 'low',
    });
  });

  it('defaults avgPeriodLength to 5 when no records have endDate', () => {
    const logs = makeRecords([['2025-02-01'], ['2025-01-04']]);
    const result = computeCycleStats(logs);
    expect(result.avgPeriodLength).toBe(5);
  });

  it('computes avgPeriodLength from records that have endDate (inclusive days)', () => {
    // startDate=Jan 1, endDate=Jan 5 → 5 days (inclusive)
    // startDate=Feb 1, endDate=Feb 3 → 3 days (inclusive)
    // avg = (5+3)/2 = 4
    const logs = makeRecords([
      ['2025-02-28', '2025-03-02'], // period length 3 (inclusive: 28 Feb + 1,2 Mar)
      ['2025-01-31', '2025-02-04'], // period length 5 (inclusive: 31 Jan + 1,2,3,4 Feb)
    ]);
    const result = computeCycleStats(logs);
    expect(result.avgPeriodLength).toBe(4); // (3+5)/2 = 4
  });

  it('sorts unsorted input correctly before computing gaps', () => {
    // Provide records in ascending order (oldest first); result should be same as DESC order
    // 3 records = 2 gaps → confidence = 'low'
    const ascending = makeRecords([
      ['2025-01-01'],
      ['2025-01-29'], // gap 28
      ['2025-02-26'], // gap 28
    ]);
    const result = computeCycleStats(ascending);
    expect(result.avgCycleLength).toBe(28);
    expect(result.confidence).toBe('low'); // 2 gaps → low confidence
  });

  it('handles unsorted input with 4 records (3 valid gaps)', () => {
    // Provide in random order
    const unsorted = makeRecords([
      ['2025-03-04'],
      ['2025-01-07'],
      ['2025-04-01'],
      ['2025-02-04'],
    ]);
    const sorted = makeRecords([
      ['2025-04-01'],
      ['2025-03-04'],
      ['2025-02-04'],
      ['2025-01-07'],
    ]);
    expect(computeCycleStats(unsorted)).toEqual(computeCycleStats(sorted));
  });

  it('boundary gap of exactly 21 days is included as valid', () => {
    const logs = makeRecords([['2025-02-21'], ['2025-01-31']]);
    // gap = 21 days exactly
    const result = computeCycleStats(logs);
    expect(result.avgCycleLength).toBe(21);
    expect(result.confidence).toBe('low');
  });

  it('boundary gap of exactly 45 days is included as valid', () => {
    const logs = makeRecords([['2025-02-15'], ['2025-01-01']]);
    // gap = 45 days exactly
    const result = computeCycleStats(logs);
    expect(result.avgCycleLength).toBe(45);
    expect(result.confidence).toBe('low');
  });
});

describe('detectDeviation', () => {
  // Helper: add days to a YYYY-MM-DD string using local-time Date construction
  // to match the implementation's parseLocalDate() approach and avoid UTC pitfalls.
  function addDays(base: string, offsetDays: number): string {
    const [y, m, d] = base.split('-').map(Number);
    const dt = new Date(y, m - 1, d + offsetDays);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  // Standard setup: last period Jan 1, 28-day cycle
  // predicted = lastStart + 28 days (computed inside detectDeviation)
  const LAST = '2025-01-01';
  const CYCLE = 28;

  it('returns on_time when actual matches predicted exactly (0 days)', () => {
    const actual = addDays(LAST, CYCLE); // actual = predicted
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('on_time');
    expect(result.daysDifference).toBe(0);
    expect(result.isSignificant).toBe(false);
    expect(result.actualDate).toBe(actual);
    expect(result.predictedDate).toBe(actual);
  });

  it('returns on_time when actual is 1 day late (within ±2 threshold)', () => {
    const actual = addDays(LAST, CYCLE + 1);
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('on_time');
    expect(result.daysDifference).toBe(1);
    expect(result.isSignificant).toBe(false);
  });

  it('returns on_time when actual is 2 days early (boundary of ±2)', () => {
    const actual = addDays(LAST, CYCLE - 2);
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('on_time');
    expect(result.daysDifference).toBe(-2);
    expect(result.isSignificant).toBe(false);
  });

  it('returns on_time when actual is 2 days late (boundary of ±2)', () => {
    const actual = addDays(LAST, CYCLE + 2);
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('on_time');
    expect(result.daysDifference).toBe(2);
    expect(result.isSignificant).toBe(false);
  });

  it('returns early when actual is 3 days before predicted', () => {
    const actual = addDays(LAST, CYCLE - 3);
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('early');
    expect(result.daysDifference).toBe(-3);
    expect(result.isSignificant).toBe(false); // |3| is NOT > 3
  });

  it('returns late when actual is 3 days after predicted', () => {
    const actual = addDays(LAST, CYCLE + 3);
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('late');
    expect(result.daysDifference).toBe(3);
    expect(result.isSignificant).toBe(false); // |3| is NOT > 3
  });

  it('returns early + significant when actual is 5 days before predicted', () => {
    const actual = addDays(LAST, CYCLE - 5);
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('early');
    expect(result.daysDifference).toBe(-5);
    expect(result.isSignificant).toBe(true);
  });

  it('returns late + significant when actual is 7 days after predicted', () => {
    const actual = addDays(LAST, CYCLE + 7);
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('late');
    expect(result.daysDifference).toBe(7);
    expect(result.isSignificant).toBe(true);
  });

  it('isSignificant boundary: 4 days late is significant (|4| > 3)', () => {
    const actual = addDays(LAST, CYCLE + 4);
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('late');
    expect(result.daysDifference).toBe(4);
    expect(result.isSignificant).toBe(true);
  });

  it('isSignificant boundary: 4 days early is significant (|-4| > 3)', () => {
    const actual = addDays(LAST, CYCLE - 4);
    const result = detectDeviation(actual, LAST, CYCLE);
    expect(result.type).toBe('early');
    expect(result.daysDifference).toBe(-4);
    expect(result.isSignificant).toBe(true);
  });

  it('works with short cycle (21 days)', () => {
    const actual = addDays(LAST, 21 - 2); // 2 days early
    const result = detectDeviation(actual, LAST, 21);
    expect(result.type).toBe('on_time');
    expect(result.daysDifference).toBe(-2);
    expect(result.predictedDate).toBe(addDays(LAST, 21));
  });

  it('works with medium-long cycle (35 days)', () => {
    const actual = addDays(LAST, 35 + 3); // 3 days late
    const result = detectDeviation(actual, LAST, 35);
    expect(result.type).toBe('late');
    expect(result.daysDifference).toBe(3);
    expect(result.predictedDate).toBe(addDays(LAST, 35));
    expect(result.isSignificant).toBe(false);
  });

  it('works with long cycle (45 days)', () => {
    const actual = addDays(LAST, 45 + 7); // 7 days late
    const result = detectDeviation(actual, LAST, 45);
    expect(result.type).toBe('late');
    expect(result.daysDifference).toBe(7);
    expect(result.predictedDate).toBe(addDays(LAST, 45));
    expect(result.isSignificant).toBe(true);
  });

  it('handles month boundary crossing correctly', () => {
    const lastStart = '2025-01-15';
    const actual = addDays(lastStart, 28 - 2); // 2 days early
    const result = detectDeviation(actual, lastStart, 28);
    expect(result.type).toBe('on_time');
    expect(result.daysDifference).toBe(-2);
    expect(result.predictedDate).toBe(addDays(lastStart, 28));
  });

  it('handles year boundary crossing correctly', () => {
    const lastStart = '2025-12-15';
    const actual = addDays(lastStart, 28 + 6); // 6 days late
    const result = detectDeviation(actual, lastStart, 28);
    expect(result.type).toBe('late');
    expect(result.daysDifference).toBe(6);
    expect(result.predictedDate).toBe(addDays(lastStart, 28));
    expect(result.isSignificant).toBe(true);
  });
});
