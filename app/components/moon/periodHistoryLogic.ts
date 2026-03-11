/**
 * Pure logic functions for PeriodHistoryInput.
 *
 * Extracted to a separate module so they can be unit-tested in isolation
 * without requiring React Native or a rendering environment.
 */

export interface PeriodEntry {
  startDate: string;   // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD (optional)
}

export type ValidationError =
  | 'future'
  | 'tooOld'
  | 'endBeforeStart'
  | 'overlap';

const DAY_MS = 86_400_000;

/** 24 months approximation: 24 * 30 days */
export const TWO_YEARS_MS = 24 * 30 * DAY_MS;

/**
 * Compute average cycle length from a list of periods.
 * Returns null if there are fewer than 2 periods or if no valid gaps exist.
 * Valid gap range: 21–45 days inclusive.
 */
export function computeCycleLengthFromPeriods(periods: PeriodEntry[]): number | null {
  if (periods.length < 2) return null;

  const sorted = [...periods].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const gaps: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i].startDate).getTime();
    const next = new Date(sorted[i + 1].startDate).getTime();
    const diffDays = Math.round((next - curr) / DAY_MS);
    if (diffDays >= 21 && diffDays <= 45) {
      gaps.push(diffDays);
    }
  }

  if (gaps.length === 0) return null;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

/**
 * Compute average period length from entries that have endDate set.
 * Returns null if no valid lengths exist.
 * Valid range: 2–10 days inclusive.
 */
export function computePeriodLengthFromEntries(periods: PeriodEntry[]): number | null {
  const lengths: number[] = [];

  for (const p of periods) {
    if (p.endDate) {
      const days =
        Math.round(
          (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / DAY_MS,
        ) + 1;
      if (days >= 2 && days <= 10) {
        lengths.push(days);
      }
    }
  }

  if (lengths.length === 0) return null;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

/**
 * Check whether any two periods in the list overlap.
 * Uses the endDate when present, otherwise treats the startDate as the end.
 * Two periods overlap when one starts on or before the other ends.
 */
export function hasOverlap(periods: PeriodEntry[]): boolean {
  const sorted = [...periods].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const currEnd = sorted[i].endDate ?? sorted[i].startDate;
    const nextStart = sorted[i + 1].startDate;
    if (new Date(currEnd).getTime() >= new Date(nextStart).getTime()) {
      return true;
    }
  }

  return false;
}

/**
 * Validate a list of period entries.
 * Returns a ValidationError string on the first problem found, or null if valid.
 */
export function validatePeriods(periods: PeriodEntry[]): ValidationError | null {
  if (periods.length === 0) return null;

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const minDate = new Date(Date.now() - TWO_YEARS_MS);

  for (const p of periods) {
    if (new Date(p.startDate + 'T12:00:00') > todayEnd) {
      return 'future';
    }
    if (new Date(p.startDate + 'T12:00:00') < minDate) {
      return 'tooOld';
    }
    if (p.endDate && new Date(p.endDate) < new Date(p.startDate)) {
      return 'endBeforeStart';
    }
  }

  if (hasOverlap(periods)) {
    return 'overlap';
  }

  return null;
}

/**
 * Sort periods in descending order (newest first) without mutating the input.
 */
export function sortPeriodsDesc(periods: PeriodEntry[]): PeriodEntry[] {
  return [...periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
}
