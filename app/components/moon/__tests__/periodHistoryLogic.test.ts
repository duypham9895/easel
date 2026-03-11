/**
 * Unit tests for PeriodHistoryInput pure logic functions.
 *
 * These are tested in isolation (no React, no RN) so we can use
 * the standard node test environment with ts-jest.
 */

import {
  computeCycleLengthFromPeriods,
  computePeriodLengthFromEntries,
  hasOverlap,
  validatePeriods,
  sortPeriodsDesc,
} from '../periodHistoryLogic';

// ── computeCycleLengthFromPeriods ────────────────────────────────────────

describe('computeCycleLengthFromPeriods', () => {
  it('returns null when fewer than 2 periods', () => {
    expect(computeCycleLengthFromPeriods([])).toBeNull();
    expect(computeCycleLengthFromPeriods([{ startDate: '2025-01-01' }])).toBeNull();
  });

  it('computes average gap for two periods 28 days apart', () => {
    const periods = [
      { startDate: '2025-02-01' },
      { startDate: '2025-01-04' },
    ];
    expect(computeCycleLengthFromPeriods(periods)).toBe(28);
  });

  it('computes average gap for three periods', () => {
    const periods = [
      { startDate: '2025-03-01' },
      { startDate: '2025-02-01' },
      { startDate: '2025-01-04' },
    ];
    // Gaps: 28 and 28 -> avg 28
    expect(computeCycleLengthFromPeriods(periods)).toBe(28);
  });

  it('handles unsorted input (computes correctly regardless of order)', () => {
    const periods = [
      { startDate: '2025-01-04' },
      { startDate: '2025-02-01' },
    ];
    expect(computeCycleLengthFromPeriods(periods)).toBe(28);
  });

  it('returns null when all gaps are outside 21–45 day range', () => {
    // Gap of 10 days — too short
    const periods = [
      { startDate: '2025-01-11' },
      { startDate: '2025-01-01' },
    ];
    expect(computeCycleLengthFromPeriods(periods)).toBeNull();
  });

  it('returns null when gap is exactly 20 days (boundary: just below minimum)', () => {
    const periods = [
      { startDate: '2025-01-21' },
      { startDate: '2025-01-01' },
    ];
    expect(computeCycleLengthFromPeriods(periods)).toBeNull();
  });

  it('includes gap of exactly 21 days (minimum boundary)', () => {
    const periods = [
      { startDate: '2025-01-22' },
      { startDate: '2025-01-01' },
    ];
    expect(computeCycleLengthFromPeriods(periods)).toBe(21);
  });

  it('includes gap of exactly 45 days (maximum boundary)', () => {
    const periods = [
      { startDate: '2025-02-15' },
      { startDate: '2025-01-01' },
    ];
    expect(computeCycleLengthFromPeriods(periods)).toBe(45);
  });

  it('returns null when gap is exactly 46 days (boundary: just above maximum)', () => {
    const periods = [
      { startDate: '2025-02-16' },
      { startDate: '2025-01-01' },
    ];
    expect(computeCycleLengthFromPeriods(periods)).toBeNull();
  });

  it('averages multiple valid gaps, ignoring invalid ones', () => {
    // Gaps: 30 (valid), 10 (invalid), 28 (valid)
    const periods = [
      { startDate: '2025-04-01' },
      { startDate: '2025-03-02' }, // gap 30
      { startDate: '2025-02-20' }, // gap 10 — filtered
      { startDate: '2025-01-23' }, // gap 28
    ];
    // Valid gaps: [30, 28] → avg = 29
    expect(computeCycleLengthFromPeriods(periods)).toBe(29);
  });
});

// ── computePeriodLengthFromEntries ───────────────────────────────────────

describe('computePeriodLengthFromEntries', () => {
  it('returns null when no periods have endDate', () => {
    expect(computePeriodLengthFromEntries([])).toBeNull();
    expect(computePeriodLengthFromEntries([{ startDate: '2025-01-01' }])).toBeNull();
  });

  it('computes inclusive period length (start + end on same day = 1 day? no, range is exclusive)', () => {
    // Jan 1 to Jan 5: (5-1)*ms / DAY_MS + 1 = 4 + 1 = 5 days
    const periods = [{ startDate: '2025-01-01', endDate: '2025-01-05' }];
    expect(computePeriodLengthFromEntries(periods)).toBe(5);
  });

  it('returns null when computed length is below minimum (2 days)', () => {
    // Start and end on same day = 1 day, invalid
    const periods = [{ startDate: '2025-01-01', endDate: '2025-01-01' }];
    expect(computePeriodLengthFromEntries(periods)).toBeNull();
  });

  it('returns null when computed length exceeds maximum (10 days)', () => {
    // 12-day period
    const periods = [{ startDate: '2025-01-01', endDate: '2025-01-12' }];
    expect(computePeriodLengthFromEntries(periods)).toBeNull();
  });

  it('includes length of exactly 2 days (minimum boundary)', () => {
    const periods = [{ startDate: '2025-01-01', endDate: '2025-01-02' }];
    expect(computePeriodLengthFromEntries(periods)).toBe(2);
  });

  it('includes length of exactly 10 days (maximum boundary)', () => {
    const periods = [{ startDate: '2025-01-01', endDate: '2025-01-10' }];
    expect(computePeriodLengthFromEntries(periods)).toBe(10);
  });

  it('averages valid lengths, ignoring invalid ones', () => {
    const periods = [
      { startDate: '2025-02-01', endDate: '2025-02-05' }, // 5 days
      { startDate: '2025-01-01', endDate: '2025-01-03' }, // 3 days
    ];
    expect(computePeriodLengthFromEntries(periods)).toBe(4);
  });

  it('ignores periods without endDate when computing average', () => {
    const periods = [
      { startDate: '2025-02-01', endDate: '2025-02-06' }, // 6 days
      { startDate: '2025-01-01' }, // no endDate — skip
    ];
    expect(computePeriodLengthFromEntries(periods)).toBe(6);
  });
});

// ── hasOverlap ───────────────────────────────────────────────────────────

describe('hasOverlap', () => {
  it('returns false for empty array', () => {
    expect(hasOverlap([])).toBe(false);
  });

  it('returns false for a single period', () => {
    expect(hasOverlap([{ startDate: '2025-01-01' }])).toBe(false);
  });

  it('returns false when periods do not overlap (no endDate)', () => {
    const periods = [
      { startDate: '2025-02-01' },
      { startDate: '2025-01-01' },
    ];
    expect(hasOverlap(periods)).toBe(false);
  });

  it('returns false when periods do not overlap (with endDate)', () => {
    const periods = [
      { startDate: '2025-02-01', endDate: '2025-02-05' },
      { startDate: '2025-01-01', endDate: '2025-01-05' },
    ];
    expect(hasOverlap(periods)).toBe(false);
  });

  it('returns true when one period starts before previous ends', () => {
    const periods = [
      { startDate: '2025-01-10', endDate: '2025-01-20' },
      { startDate: '2025-01-15', endDate: '2025-01-25' }, // overlaps with previous
    ];
    expect(hasOverlap(periods)).toBe(true);
  });

  it('returns true when periods share the same start date', () => {
    const periods = [
      { startDate: '2025-01-01', endDate: '2025-01-05' },
      { startDate: '2025-01-01', endDate: '2025-01-03' },
    ];
    expect(hasOverlap(periods)).toBe(true);
  });

  it('returns true when next period starts on same day as previous endDate', () => {
    // currEnd = '2025-01-10', nextStart = '2025-01-10' — same day means overlap
    const periods = [
      { startDate: '2025-01-01', endDate: '2025-01-10' },
      { startDate: '2025-01-10' },
    ];
    expect(hasOverlap(periods)).toBe(true);
  });

  it('returns false when next period starts day after previous endDate', () => {
    const periods = [
      { startDate: '2025-01-01', endDate: '2025-01-10' },
      { startDate: '2025-01-11' },
    ];
    expect(hasOverlap(periods)).toBe(false);
  });

  it('handles unsorted input correctly', () => {
    // Provide in reverse order — should still detect overlap
    const periods = [
      { startDate: '2025-01-15', endDate: '2025-01-25' },
      { startDate: '2025-01-10', endDate: '2025-01-20' },
    ];
    expect(hasOverlap(periods)).toBe(true);
  });
});

// ── validatePeriods ──────────────────────────────────────────────────────

describe('validatePeriods', () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const twoYearsAgo = new Date(today.getTime() - 24 * 30 * 86_400_000);
  const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const threeYearsAgo = new Date(today);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const threeYearsAgoStr = threeYearsAgo.toISOString().split('T')[0];

  it('returns null for a valid single period (today)', () => {
    expect(validatePeriods([{ startDate: todayStr }])).toBeNull();
  });

  it('returns null for an empty periods array', () => {
    expect(validatePeriods([])).toBeNull();
  });

  it('returns "future" error when startDate is in the future', () => {
    const result = validatePeriods([{ startDate: tomorrowStr }]);
    expect(result).toBe('future');
  });

  it('returns "tooOld" error when startDate is older than 24 months', () => {
    const result = validatePeriods([{ startDate: threeYearsAgoStr }]);
    expect(result).toBe('tooOld');
  });

  it('returns "endBeforeStart" error when endDate is before startDate', () => {
    const result = validatePeriods([
      { startDate: '2025-01-10', endDate: '2025-01-05' },
    ]);
    expect(result).toBe('endBeforeStart');
  });

  it('returns "overlap" error when periods overlap', () => {
    const result = validatePeriods([
      { startDate: '2025-01-10', endDate: '2025-01-20' },
      { startDate: '2025-01-15' },
    ]);
    expect(result).toBe('overlap');
  });

  it('returns null for two valid non-overlapping periods', () => {
    const result = validatePeriods([
      { startDate: '2025-02-01' },
      { startDate: '2025-01-01' },
    ]);
    expect(result).toBeNull();
  });

  it('returns null for periods with valid endDates', () => {
    const result = validatePeriods([
      { startDate: '2025-02-01', endDate: '2025-02-05' },
      { startDate: '2025-01-01', endDate: '2025-01-05' },
    ]);
    expect(result).toBeNull();
  });

  it('returns "endBeforeStart" even when other periods are valid', () => {
    const result = validatePeriods([
      { startDate: '2025-02-01', endDate: '2025-02-05' },
      { startDate: '2025-01-10', endDate: '2025-01-05' }, // endDate before startDate
    ]);
    expect(result).toBe('endBeforeStart');
  });
});

// ── sortPeriodsDesc ──────────────────────────────────────────────────────

describe('sortPeriodsDesc', () => {
  it('returns empty array for empty input', () => {
    expect(sortPeriodsDesc([])).toEqual([]);
  });

  it('returns single item unchanged', () => {
    const periods = [{ startDate: '2025-01-01' }];
    expect(sortPeriodsDesc(periods)).toEqual(periods);
  });

  it('sorts periods in descending order (newest first)', () => {
    const periods = [
      { startDate: '2025-01-01' },
      { startDate: '2025-03-01' },
      { startDate: '2025-02-01' },
    ];
    const result = sortPeriodsDesc(periods);
    expect(result[0].startDate).toBe('2025-03-01');
    expect(result[1].startDate).toBe('2025-02-01');
    expect(result[2].startDate).toBe('2025-01-01');
  });

  it('does not mutate the original array', () => {
    const original = [
      { startDate: '2025-01-01' },
      { startDate: '2025-03-01' },
    ];
    const originalRef = original[0];
    sortPeriodsDesc(original);
    expect(original[0]).toBe(originalRef); // original unchanged
  });

  it('handles already-sorted input correctly', () => {
    const periods = [
      { startDate: '2025-03-01' },
      { startDate: '2025-02-01' },
      { startDate: '2025-01-01' },
    ];
    const result = sortPeriodsDesc(periods);
    expect(result[0].startDate).toBe('2025-03-01');
    expect(result[2].startDate).toBe('2025-01-01');
  });
});
