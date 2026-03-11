import { CyclePhase } from '@/types';
import type { PeriodRecord } from '@/types';
import { getOvulationDay } from '@/constants/cycle';

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  variability: number;
  confidence: 'high' | 'medium' | 'low';
}

const DAY_MS = 86_400_000;
const DEFAULT_STATS: CycleStats = { avgCycleLength: 28, avgPeriodLength: 5, variability: 0, confidence: 'low' };

export function computeCycleStats(logs: PeriodRecord[]): CycleStats {
  if (logs.length < 2) return { ...DEFAULT_STATS };

  const sorted = [...logs]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 7);

  const gaps: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const days = Math.round(
      (new Date(sorted[i].startDate).getTime() - new Date(sorted[i + 1].startDate).getTime()) / DAY_MS,
    );
    if (days >= 21 && days <= 45) gaps.push(days);
  }
  if (gaps.length === 0) return { ...DEFAULT_STATS };

  const recentCount = Math.ceil(gaps.length / 2);
  let wSum = 0, wTotal = 0;
  for (let i = 0; i < gaps.length; i++) {
    const w = i < recentCount ? 2 : 1;
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
 * Returns a map of date strings (YYYY-MM-DD) to their cycle status
 * for use in the calendar view.
 */
export function buildCalendarMarkers(
  lastPeriodStartDate: string,
  avgCycleLength: number,
  avgPeriodLength: number,
  periodLogs?: PeriodRecord[],
): Record<string, { type: 'period' | 'ovulation' | 'fertile' }> {
  const markers: Record<string, { type: 'period' | 'ovulation' | 'fertile' }> = {};

  // Mark actual historical period dates from logs
  if (periodLogs && periodLogs.length > 0) {
    for (const log of periodLogs) {
      const pStart = new Date(log.startDate);
      pStart.setHours(0, 0, 0, 0);
      const pLen = log.endDate
        ? Math.round((new Date(log.endDate).getTime() - pStart.getTime()) / DAY_MS) + 1
        : avgPeriodLength;
      for (let d = 0; d < pLen; d++) {
        const date = new Date(pStart.getTime());
        date.setDate(date.getDate() + d);
        markers[toDateString(date)] = { type: 'period' };
      }
    }
  }

  const start = new Date(lastPeriodStartDate);
  start.setHours(0, 0, 0, 0);

  // Mark 3 cycles ahead
  for (let cycle = 0; cycle < 3; cycle++) {
    const cycleStart = new Date(start.getTime());
    cycleStart.setDate(cycleStart.getDate() + cycle * avgCycleLength);

    // Period days
    for (let d = 0; d < avgPeriodLength; d++) {
      const date = new Date(cycleStart.getTime());
      date.setDate(date.getDate() + d);
      markers[toDateString(date)] = { type: 'period' };
    }

    const ovulationDay = getOvulationDay(avgCycleLength, avgPeriodLength);
    const ovulationDate = new Date(cycleStart.getTime());
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDay - 1);
    markers[toDateString(ovulationDate)] = { type: 'ovulation' };

    // Fertile window (3 days before ovulation)
    for (let d = 1; d <= 3; d++) {
      const fertileDate = new Date(ovulationDate.getTime());
      fertileDate.setDate(fertileDate.getDate() - d);
      const key = toDateString(fertileDate);
      if (!markers[key]) {
        markers[key] = { type: 'fertile' };
      }
    }
  }

  return markers;
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
