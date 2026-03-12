import type { PeriodRecord } from '@/types';

export interface GenerateOptions {
  months: number;
  avgCycle?: number;       // default 28
  variability?: number;    // std dev in days, default 2
  overrideRate?: number;   // 0-1, fraction of cycles with tags
  periodLength?: number;   // default 5
  startAnchor?: string;    // YYYY-MM-DD anchor for the most recent period (default: '2026-03-01')
}

/**
 * Deterministic seeded random number generator (mulberry32).
 * Allows reproducible test data without Math.random().
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const TAG_OPTIONS = ['stress', 'illness', 'travel', 'medication', 'other'];

/**
 * Generate realistic period log data for testing.
 *
 * Produces `months` period records going backwards from `startAnchor`,
 * with deterministic pseudo-random variability applied to cycle lengths.
 */
export function generatePeriodLogs(options: GenerateOptions): PeriodRecord[] {
  const {
    months,
    avgCycle = 28,
    variability = 2,
    overrideRate = 0,
    periodLength = 5,
    startAnchor = '2026-03-01',
  } = options;

  const rand = seededRandom(42);
  const logs: PeriodRecord[] = [];

  // Start from the anchor date and work backwards
  let currentStart = parseDate(startAnchor);

  for (let i = 0; i < months; i++) {
    const endDate = new Date(currentStart.getTime());
    endDate.setDate(endDate.getDate() + periodLength - 1);

    // Decide tags based on overrideRate
    const hasTags = rand() < overrideRate;
    const tags: string[] | undefined = hasTags
      ? [TAG_OPTIONS[Math.floor(rand() * TAG_OPTIONS.length)]]
      : undefined;

    const record: PeriodRecord = {
      startDate: toDateString(currentStart),
      endDate: toDateString(endDate),
      ...(tags ? { tags } : {}),
    };

    logs.push(record);

    // Calculate previous cycle start: go back avgCycle +/- variability days
    // Using Box-Muller-like transform for normally distributed offsets
    const u1 = rand();
    const u2 = rand();
    const normal = Math.sqrt(-2 * Math.log(Math.max(u1, 0.001))) * Math.cos(2 * Math.PI * u2);
    const offset = Math.round(normal * variability);
    const cycleLen = avgCycle + offset;

    const prevStart = new Date(currentStart.getTime());
    prevStart.setDate(prevStart.getDate() - cycleLen);
    currentStart = prevStart;
  }

  // logs[0] is most recent, logs[months-1] is oldest — already sorted desc
  return logs;
}

/**
 * Generate logs with specific cycle lengths (for precise testing).
 * The most recent period starts at `startAnchor` and cycles go backwards.
 */
export function generateLogsWithExactCycles(
  cycleLengths: number[],
  options?: {
    periodLength?: number;
    startAnchor?: string;
    tagIndices?: number[];  // which cycles (0-based from most recent) should have tags
  },
): PeriodRecord[] {
  const periodLength = options?.periodLength ?? 5;
  const startAnchor = options?.startAnchor ?? '2026-03-01';
  const tagIndices = new Set(options?.tagIndices ?? []);

  const logs: PeriodRecord[] = [];
  let currentStart = parseDate(startAnchor);

  // We need cycleLengths.length + 1 logs to create cycleLengths.length gaps
  for (let i = 0; i <= cycleLengths.length; i++) {
    const endDate = new Date(currentStart.getTime());
    endDate.setDate(endDate.getDate() + periodLength - 1);

    const tags = tagIndices.has(i) ? ['stress'] : undefined;

    logs.push({
      startDate: toDateString(currentStart),
      endDate: toDateString(endDate),
      ...(tags ? { tags } : {}),
    });

    if (i < cycleLengths.length) {
      const prevStart = new Date(currentStart.getTime());
      prevStart.setDate(prevStart.getDate() - cycleLengths[i]);
      currentStart = prevStart;
    }
  }

  return logs;
}
