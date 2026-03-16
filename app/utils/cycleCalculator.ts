import { CyclePhase } from '@/types';
import type { PeriodRecord, CycleDeviation, CalendarMarker, PredictionWindow } from '@/types';
import type { CycleSettings } from '@/types';
import { getOvulationDay } from '@/constants/cycle';

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  variability: number;
  confidence: 'high' | 'medium' | 'low';
}

const DAY_MS = 86_400_000;
const DEFAULT_STATS: CycleStats = { avgCycleLength: 28, avgPeriodLength: 5, variability: 0, confidence: 'low' };

/**
 * Determine weight for a cycle gap based on whether the bounding logs have tags.
 * Tagged cycles (stress, illness, etc.) get 0.5x weight since they may be atypical.
 * Recency weighting: recent half gets 2x, older half gets 1x (before tag adjustment).
 */
function gapWeight(isRecent: boolean, isTagged: boolean): number {
  const base = isRecent ? 2 : 1;
  return isTagged ? base * 0.5 : base;
}

export function computeCycleStats(logs: PeriodRecord[]): CycleStats {
  if (logs.length < 2) return { ...DEFAULT_STATS };

  const sorted = [...logs]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 7);

  const gaps: number[] = [];
  const gapTagged: boolean[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const days = Math.round(
      (new Date(sorted[i].startDate).getTime() - new Date(sorted[i + 1].startDate).getTime()) / DAY_MS,
    );
    if (days >= 21 && days <= 45) {
      gaps.push(days);
      // A gap is "tagged" if either bounding log has tags
      const hasTag = (sorted[i].tags && sorted[i].tags!.length > 0)
        || (sorted[i + 1].tags && sorted[i + 1].tags!.length > 0);
      gapTagged.push(!!hasTag);
    }
  }
  if (gaps.length === 0) return { ...DEFAULT_STATS };

  const recentCount = Math.ceil(gaps.length / 2);
  let wSum = 0, wTotal = 0;
  for (let i = 0; i < gaps.length; i++) {
    const w = gapWeight(i < recentCount, gapTagged[i]);
    wSum += gaps[i] * w;
    wTotal += w;
  }
  const avgCycleLength = Math.round(wSum / wTotal);

  const pLens: number[] = [];
  for (const r of sorted) {
    if (r.endDate) {
      const d = Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / DAY_MS) + 1;
      if (d >= 2 && d <= 10) pLens.push(d);
    }
  }
  const avgPeriodLength = pLens.length > 0
    ? Math.round(pLens.reduce((a, b) => a + b, 0) / pLens.length)
    : 5;

  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
  const variability = Math.round(Math.sqrt(variance) * 10) / 10;

  const confidence = gaps.length >= 6 ? 'high' : gaps.length >= 3 ? 'medium' : 'low';

  return { avgCycleLength, avgPeriodLength, variability, confidence };
}

export function getCurrentDayInCycle(
  lastPeriodStartDate: string,
  _avgCycleLength: number,
): number {
  const start = new Date(lastPeriodStartDate);
  const today = new Date();

  // Normalize to start of day
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 1;
  return diffDays + 1;
}

export function getCurrentPhase(
  dayInCycle: number,
  avgCycleLength: number,
  avgPeriodLength: number,
): CyclePhase {
  const ovulationDay = getOvulationDay(avgCycleLength, avgPeriodLength);

  if (dayInCycle <= avgPeriodLength) return 'menstrual';
  if (dayInCycle <= ovulationDay - 3) return 'follicular';
  if (dayInCycle <= ovulationDay + 2) return 'ovulatory';
  return 'luteal';
}

export function getDaysUntilNextPeriod(
  dayInCycle: number,
  avgCycleLength: number,
): number {
  const remaining = avgCycleLength - dayInCycle + 1;
  return remaining <= 0 ? avgCycleLength : remaining;
}

export function getConceptionChance(phase: CyclePhase): string {
  switch (phase) {
    case 'menstrual': return 'Low';
    case 'follicular': return 'Medium';
    case 'ovulatory': return 'Very High';
    case 'luteal': return 'Low';
  }
}

/**
 * Compute a prediction window for the next period start date.
 *
 * Uses the tag-aware weighted average from computeCycleStats to determine
 * a predicted date, then creates a window of ±min(ceil(variability), 4) days
 * (minimum ±1 day) around it.
 *
 * Confidence = base 40 + cycle_count bonus (up to 30) + variability bonus (up to 30),
 * clamped to [10, 100].
 */
export function computePredictionWindow(
  logs: PeriodRecord[],
  _currentSettings: CycleSettings,
): PredictionWindow | null {
  if (logs.length < 2) return null;

  const stats = computeCycleStats(logs);

  // Use the most recent log as the anchor
  const sorted = [...logs].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastStart = parseLocalDate(sorted[0].startDate);

  const predicted = new Date(lastStart.getTime());
  predicted.setDate(predicted.getDate() + stats.avgCycleLength);
  const predictedDate = toLocalDateString(predicted);

  // Window radius: ceil(variability), clamped to [1, 4]
  const radius = Math.max(1, Math.min(4, Math.ceil(stats.variability)));

  const windowStart = new Date(predicted.getTime());
  windowStart.setDate(windowStart.getDate() - radius);

  const windowEnd = new Date(predicted.getTime());
  windowEnd.setDate(windowEnd.getDate() + radius);

  // Confidence calculation
  const gapCount = Math.min(sorted.length - 1, 6); // max 6 usable gaps from 7 logs
  const cycleBonus = Math.min(30, gapCount * 5);    // 5 pts per gap, max 30
  const varBonus = stats.variability <= 1 ? 30
    : stats.variability <= 2 ? 20
    : stats.variability <= 3 ? 10
    : 0;
  const confidence = Math.max(10, Math.min(100, 40 + cycleBonus + varBonus));

  const confidenceLabel: PredictionWindow['confidenceLabel'] =
    confidence >= 70 ? 'high' : confidence >= 45 ? 'medium' : 'low';

  return {
    startDate: toLocalDateString(windowStart),
    endDate: toLocalDateString(windowEnd),
    predictedDate,
    confidence,
    confidenceLabel,
  };
}

/**
 * Returns a map of date strings (YYYY-MM-DD) to their cycle status
 * for use in the calendar view.
 *
 * Each marker includes a `source` field:
 * - 'logged' — based on actual period data from periodLogs
 * - 'predicted' — based on cycle length projections
 *
 * Historical periods from logs take precedence over predicted periods
 * for the same date, so logged data is never overwritten.
 */
export function buildCalendarMarkers(
  lastPeriodStartDate: string,
  avgCycleLength: number,
  avgPeriodLength: number,
  periodLogs?: PeriodRecord[],
): Record<string, CalendarMarker> {
  const markers: Record<string, CalendarMarker> = {};

  // Track which dates have logged data so predictions don't overwrite them
  const loggedDates = new Set<string>();

  // Mark actual historical period dates from logs
  if (periodLogs && periodLogs.length > 0) {
    for (const log of periodLogs) {
      const pStart = parseLocalDate(log.startDate);
      let pLen: number;
      if (log.endDate) {
        const pEnd = parseLocalDate(log.endDate);
        pLen = Math.round((pEnd.getTime() - pStart.getTime()) / DAY_MS) + 1;
      } else {
        pLen = avgPeriodLength;
      }
      for (let d = 0; d < pLen; d++) {
        const date = new Date(pStart.getTime());
        date.setDate(date.getDate() + d);
        const key = toLocalDateString(date);
        markers[key] = { type: 'period', source: 'logged' };
        loggedDates.add(key);
      }
    }
  }

  const start = parseLocalDate(lastPeriodStartDate);

  // FR-12: skip predicted dates before today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateString(today);

  // Mark 3 cycles ahead (predicted)
  for (let cycle = 0; cycle < 3; cycle++) {
    const cycleStart = new Date(start.getTime());
    cycleStart.setDate(cycleStart.getDate() + cycle * avgCycleLength);

    // Period days
    for (let d = 0; d < avgPeriodLength; d++) {
      const date = new Date(cycleStart.getTime());
      date.setDate(date.getDate() + d);
      const key = toLocalDateString(date);
      // Don't overwrite logged data with predictions; skip past predicted dates
      if (!loggedDates.has(key) && key >= todayStr) {
        markers[key] = { type: 'period', source: 'predicted' };
      }
    }

    const ovulationDay = getOvulationDay(avgCycleLength, avgPeriodLength);
    const ovulationDate = new Date(cycleStart.getTime());
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDay - 1);
    const ovKey = toLocalDateString(ovulationDate);
    if (!loggedDates.has(ovKey) && ovKey >= todayStr) {
      markers[ovKey] = { type: 'ovulation', source: 'predicted' };
    }

    // Fertile window (3 days before ovulation)
    for (let d = 1; d <= 3; d++) {
      const fertileDate = new Date(ovulationDate.getTime());
      fertileDate.setDate(fertileDate.getDate() - d);
      const key = toLocalDateString(fertileDate);
      if (!markers[key] && key >= todayStr) {
        markers[key] = { type: 'fertile', source: 'predicted' };
      }
    }
  }

  return markers;
}

/**
 * Detects whether a newly logged period deviates from the predicted date.
 *
 * @param actualStartDate      - The date Moon actually started her period (YYYY-MM-DD)
 * @param lastPeriodStartDate  - The start date of her previous period (YYYY-MM-DD)
 * @param avgCycleLength       - The predicted cycle length in days
 * @returns CycleDeviation describing early/late/on_time and significance
 */
export function detectDeviation(
  actualStartDate: string,
  lastPeriodStartDate: string,
  avgCycleLength: number,
): CycleDeviation {
  const lastStart = parseLocalDate(lastPeriodStartDate);

  const predicted = new Date(lastStart.getTime());
  predicted.setDate(predicted.getDate() + avgCycleLength);
  const predictedDate = toLocalDateString(predicted);

  const actual = parseLocalDate(actualStartDate);

  const daysDifference = Math.round((actual.getTime() - predicted.getTime()) / DAY_MS);
  const absDiff = Math.abs(daysDifference);

  const type: CycleDeviation['type'] =
    absDiff <= 2 ? 'on_time' : daysDifference < 0 ? 'early' : 'late';

  return {
    type,
    daysDifference,
    predictedDate,
    actualDate: actualStartDate,
    isSignificant: absDiff > 3,
  };
}

/**
 * Enrich calendar markers with range position info for connected period rendering.
 * Identifies start/end/mid positions within consecutive period day sequences.
 */
export function enrichMarkersWithRangeInfo(
  markers: Record<string, CalendarMarker>,
): Record<string, CalendarMarker> {
  const enriched: Record<string, CalendarMarker> = {};
  for (const [key, marker] of Object.entries(markers)) {
    enriched[key] = { ...marker };
  }

  const periodDates = Object.entries(markers)
    .filter(([_, m]) => m.type === 'period')
    .map(([date]) => date)
    .sort();

  for (let i = 0; i < periodDates.length; i++) {
    const date = periodDates[i];
    const prev = periodDates[i - 1];
    const next = periodDates[i + 1];
    const isConsecutiveWithPrev = prev !== undefined && daysDiffStr(prev, date) === 1;
    const isConsecutiveWithNext = next !== undefined && daysDiffStr(date, next) === 1;

    enriched[date] = {
      ...enriched[date],
      isRangeStart: !isConsecutiveWithPrev && isConsecutiveWithNext,
      isRangeEnd: isConsecutiveWithPrev && !isConsecutiveWithNext,
      isRangeMid: isConsecutiveWithPrev && isConsecutiveWithNext,
    };
  }

  return enriched;
}

/** Compute days between two YYYY-MM-DD strings. */
function daysDiffStr(a: string, b: string): number {
  return Math.round((parseLocalDate(b).getTime() - parseLocalDate(a).getTime()) / DAY_MS);
}

/** Parse a YYYY-MM-DD string as local midnight (avoids UTC date-only parsing pitfall). */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date as YYYY-MM-DD using local time components. */
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

