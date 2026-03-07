import { CyclePhase } from '@/types';
import { getOvulationDay } from '@/constants/cycle';

export function getCurrentDayInCycle(
  lastPeriodStartDate: string,
  avgCycleLength: number,
): number {
  const start = new Date(lastPeriodStartDate);
  const today = new Date();

  // Normalize to start of day
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 1;
  return (diffDays % avgCycleLength) + 1;
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
): Record<string, { type: 'period' | 'ovulation' | 'fertile' }> {
  const markers: Record<string, { type: 'period' | 'ovulation' | 'fertile' }> = {};
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
