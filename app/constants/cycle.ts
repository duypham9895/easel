/** Typical luteal phase length in days (biological constant). */
export const LUTEAL_PHASE_LENGTH = 14;

/** Calculate ovulation day from cycle parameters. */
export function getOvulationDay(avgCycleLength: number, avgPeriodLength: number): number {
  return Math.max(avgPeriodLength + 1, avgCycleLength - LUTEAL_PHASE_LENGTH);
}
