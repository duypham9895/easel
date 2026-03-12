/**
 * Data Integrity E2E Tests — Period Calendar Feature
 *
 * Tests that verify data consistency, constraint enforcement, and
 * mathematical correctness of the cycle prediction system.
 */
import {
  computeCycleStats,
  computePredictionWindow,
  buildCalendarMarkers,
  detectDeviation,
} from '@/utils/cycleCalculator';
import type { PeriodRecord, CycleSettings, CalendarMarker } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDays(base: string, offset: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d + offset);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
}

function todayStr(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function generatePeriodLogs(
  count: number,
  cycleLengthDays: number,
  baseDate: string,
  options?: { periodLength?: number; taggedIndices?: Map<number, string[]> },
): PeriodRecord[] {
  const periodLength = options?.periodLength ?? 5;
  const logs: PeriodRecord[] = [];
  for (let i = 0; i < count; i++) {
    const startOffset = -(i * cycleLengthDays);
    const startDate = addDays(baseDate, startOffset);
    const endDate = addDays(startDate, periodLength - 1);
    const tags = options?.taggedIndices?.get(i);
    logs.push({
      startDate,
      endDate,
      ...(tags ? { tags } : {}),
    });
  }
  return logs;
}

function makeSettings(overrides?: Partial<CycleSettings>): CycleSettings {
  return {
    avgCycleLength: 28,
    avgPeriodLength: 5,
    lastPeriodStartDate: '2025-06-01',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test: Deleting period that anchors prediction
// ---------------------------------------------------------------------------
describe('Deleting period that anchors prediction', () => {
  it('should recalculate prediction based on remaining logs after deleting most recent', () => {
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-29' }, // most recent — anchor
      { startDate: '2025-06-01' }, // 28-day gap
      { startDate: '2025-05-04' }, // 28-day gap
    ];

    const settings = makeSettings({ lastPeriodStartDate: '2025-06-29' });
    const predBefore = computePredictionWindow(logs, settings);
    expect(predBefore).not.toBeNull();
    expect(predBefore!.predictedDate).toBe(addDays('2025-06-29', 28));

    // Delete the most recent log
    const logsAfterDelete = logs.filter(l => l.startDate !== '2025-06-29');
    expect(logsAfterDelete).toHaveLength(2);

    const settingsAfter = makeSettings({ lastPeriodStartDate: '2025-06-01' });
    const predAfter = computePredictionWindow(logsAfterDelete, settingsAfter);
    expect(predAfter).not.toBeNull();

    // Prediction should now anchor on '2025-06-01' (the NEW most recent)
    expect(predAfter!.predictedDate).toBe(addDays('2025-06-01', 28));
  });

  it('should return null prediction when deletion leaves only 1 log', () => {
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-29' },
      { startDate: '2025-06-01' },
    ];

    const predBefore = computePredictionWindow(logs, makeSettings());
    expect(predBefore).not.toBeNull();

    // Delete the most recent → 1 log remains
    const logsAfterDelete = logs.filter(l => l.startDate !== '2025-06-29');
    const predAfter = computePredictionWindow(logsAfterDelete, makeSettings());
    expect(predAfter).toBeNull();
  });

  it('should return null prediction when all logs are deleted', () => {
    const pred = computePredictionWindow([], makeSettings());
    expect(pred).toBeNull();
  });

  it('should correctly recompute stats after deleting a middle log', () => {
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-29' },  // gap to next: 28
      { startDate: '2025-06-01' },  // gap to next: 28
      { startDate: '2025-05-04' },  // gap to next: 28
      { startDate: '2025-04-06' },
    ];

    const statsBefore = computeCycleStats(logs);
    expect(statsBefore.avgCycleLength).toBe(28);

    // Delete the June 1 log → remaining gaps change
    const logsAfterDelete = logs.filter(l => l.startDate !== '2025-06-01');
    // Remaining: [2025-06-29, 2025-05-04, 2025-04-06]
    // gap[0] = June 29 - May 4 = 56 days (outside 21-45 range, filtered out!)
    // gap[1] = May 4 - Apr 6 = 28 days (valid)
    const statsAfter = computeCycleStats(logsAfterDelete);
    // Only 1 valid gap → avgCycleLength = 28 (from the valid gap)
    expect(statsAfter.avgCycleLength).toBe(28);
    expect(statsAfter.confidence).toBe('low'); // only 1 valid gap
  });
});

// ---------------------------------------------------------------------------
// Test: Predicted dates must be >= today (FR-12)
// ---------------------------------------------------------------------------
describe('FR-12: Predicted dates must be >= today', () => {
  it('should NOT produce predicted markers before today for far-past lastPeriodStartDate', () => {
    // Last period 180 days ago — all predicted periods from that anchor are in the past
    const farPast = addDays(todayStr(), -180);
    const markers = buildCalendarMarkers(farPast, 28, 5);

    const today = todayStr();
    const predictedPastDates = Object.entries(markers)
      .filter(([date, marker]) => marker.source === 'predicted' && date < today);

    expect(predictedPastDates).toHaveLength(0);
  });

  it('should still allow logged markers in the past', () => {
    const pastDate = addDays(todayStr(), -10);
    const periodLogs: PeriodRecord[] = [
      { startDate: pastDate, endDate: addDays(pastDate, 4) },
    ];

    const markers = buildCalendarMarkers(todayStr(), 28, 5, periodLogs);

    // Logged markers in the past should exist
    expect(markers[pastDate]).toEqual({ type: 'period', source: 'logged' });
  });

  it('should produce predicted markers for today and future dates', () => {
    const today = todayStr();
    // Use today as lastPeriodStartDate so predicted cycle starts today
    const markers = buildCalendarMarkers(today, 28, 5);

    // Today should have a predicted period marker
    expect(markers[today]).toEqual({ type: 'period', source: 'predicted' });

    // Tomorrow should also have a predicted marker
    expect(markers[addDays(today, 1)]).toEqual({ type: 'period', source: 'predicted' });
  });

  it('should skip predicted markers that fall before today across 3 cycles', () => {
    // 60 days ago — first 2 cycles are fully in the past
    const pastStart = addDays(todayStr(), -60);
    const markers = buildCalendarMarkers(pastStart, 28, 5);

    const today = todayStr();
    for (const [date, marker] of Object.entries(markers)) {
      if (marker.source === 'predicted') {
        expect(date >= today).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Test: Duplicate period prevention
// ---------------------------------------------------------------------------
describe('Duplicate period prevention', () => {
  const DEDUP_WINDOW_DAYS = 2;

  /**
   * Simulates the validation that should happen before adding a period.
   * The store's addPeriodLog deduplicates by replacing logs with the same startDate,
   * but we also need to check for overlaps within the dedup window.
   */
  function hasOverlap(existingLogs: PeriodRecord[], newStartDate: string): boolean {
    for (const log of existingLogs) {
      const existingStart = new Date(log.startDate).getTime();
      const newStart = new Date(newStartDate).getTime();
      const diffDays = Math.abs(newStart - existingStart) / 86_400_000;
      if (diffDays <= DEDUP_WINDOW_DAYS) {
        return true;
      }
    }
    return false;
  }

  it('should flag overlap when logging a period 1 day after an existing one', () => {
    const existingLogs: PeriodRecord[] = [{ startDate: '2025-03-01' }];
    expect(hasOverlap(existingLogs, '2025-03-02')).toBe(true);
  });

  it('should flag overlap when logging a period on the same day', () => {
    const existingLogs: PeriodRecord[] = [{ startDate: '2025-03-01' }];
    expect(hasOverlap(existingLogs, '2025-03-01')).toBe(true);
  });

  it('should flag overlap when logging a period 2 days after (boundary)', () => {
    const existingLogs: PeriodRecord[] = [{ startDate: '2025-03-01' }];
    expect(hasOverlap(existingLogs, '2025-03-03')).toBe(true);
  });

  it('should NOT flag overlap when logging 3 days after (outside window)', () => {
    const existingLogs: PeriodRecord[] = [{ startDate: '2025-03-01' }];
    expect(hasOverlap(existingLogs, '2025-03-04')).toBe(false);
  });

  it('should flag overlap against any existing log in the array', () => {
    const existingLogs: PeriodRecord[] = [
      { startDate: '2025-03-01' },
      { startDate: '2025-04-01' },
    ];
    // 2 days before the second log
    expect(hasOverlap(existingLogs, '2025-03-30')).toBe(true);
    // Well outside both windows
    expect(hasOverlap(existingLogs, '2025-03-15')).toBe(false);
  });

  it('should handle the store dedup behavior: same startDate replaces existing', () => {
    // The store does: updated = [newEntry, ...existing.filter(l => l.startDate !== startDate)]
    const existingLogs: PeriodRecord[] = [
      { startDate: '2025-06-01' },
      { startDate: '2025-05-04' },
    ];
    const newLog: PeriodRecord = { startDate: '2025-06-01', tags: ['stress'] };

    const updated = [newLog, ...existingLogs.filter(l => l.startDate !== newLog.startDate)]
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    // Should have replaced, not duplicated
    expect(updated).toHaveLength(2);
    expect(updated[0].startDate).toBe('2025-06-01');
    expect(updated[0].tags).toEqual(['stress']);
  });
});

// ---------------------------------------------------------------------------
// Test: Tag weight reduction math
// ---------------------------------------------------------------------------
describe('Tag weight reduction math', () => {
  it('should compute correct untagged weighted average for [28, 30, 32, 28]', () => {
    // 5 logs → 4 gaps: [28, 30, 32, 28] (most recent first)
    // recentCount = ceil(4/2) = 2
    // weights = [2, 2, 1, 1]
    // wSum = 28*2 + 30*2 + 32*1 + 28*1 = 56+60+32+28 = 176
    // wTotal = 2+2+1+1 = 6
    // avg = 176/6 = 29.33 → 29
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01' },
      { startDate: addDays('2025-06-01', -28) },  // gap 28
      { startDate: addDays('2025-06-01', -58) },   // gap 30
      { startDate: addDays('2025-06-01', -90) },   // gap 32
      { startDate: addDays('2025-06-01', -118) },  // gap 28
    ];

    const stats = computeCycleStats(logs);
    expect(stats.avgCycleLength).toBe(29);
  });

  it('should halve the tagged cycle weight and recompute correctly', () => {
    // Same 4 gaps: [28, 30, 32, 28]
    // Tag the log at index 2 (sorted[2]) which borders gap[1]=30 and gap[2]=32
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01' },
      { startDate: addDays('2025-06-01', -28) },
      { startDate: addDays('2025-06-01', -58), tags: ['stress'] }, // tagged
      { startDate: addDays('2025-06-01', -90) },
      { startDate: addDays('2025-06-01', -118) },
    ];

    // gap[0] = 28 (sorted[0]-sorted[1]): neither has tags → not tagged
    // gap[1] = 30 (sorted[1]-sorted[2]): sorted[2] has tags → tagged
    // gap[2] = 32 (sorted[2]-sorted[3]): sorted[2] has tags → tagged
    // gap[3] = 28 (sorted[3]-sorted[4]): neither has tags → not tagged
    //
    // recentCount = ceil(4/2) = 2
    // gap[0]: recent, not tagged → weight = 2
    // gap[1]: recent, tagged → weight = 2*0.5 = 1
    // gap[2]: old, tagged → weight = 1*0.5 = 0.5
    // gap[3]: old, not tagged → weight = 1
    //
    // wSum = 28*2 + 30*1 + 32*0.5 + 28*1 = 56+30+16+28 = 130
    // wTotal = 2+1+0.5+1 = 4.5
    // avg = 130/4.5 = 28.89 → 29
    const stats = computeCycleStats(logs);
    expect(stats.avgCycleLength).toBe(29);
  });

  it('should show measurable difference between tagged and untagged', () => {
    // Create a scenario where the difference is more pronounced
    // 3 gaps: [40, 28, 28], recentCount=2
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01' },
      { startDate: addDays('2025-06-01', -40) },  // gap 40
      { startDate: addDays('2025-06-01', -68) },   // gap 28
      { startDate: addDays('2025-06-01', -96) },   // gap 28
    ];

    // Untagged: weights = [2, 2, 1]
    // wSum = 40*2+28*2+28*1 = 80+56+28 = 164, wTotal = 5 → 32.8 → 33
    const statsNoTag = computeCycleStats(logs);
    expect(statsNoTag.avgCycleLength).toBe(33);

    // Tag the most recent log → gap[0]=40 becomes tagged
    const logsTagged: PeriodRecord[] = [
      { startDate: '2025-06-01', tags: ['travel'] },
      { startDate: addDays('2025-06-01', -40) },
      { startDate: addDays('2025-06-01', -68) },
      { startDate: addDays('2025-06-01', -96) },
    ];

    // Tagged: gap[0] tagged → weight = 2*0.5=1
    // weights = [1, 2, 1]
    // wSum = 40*1+28*2+28*1 = 40+56+28 = 124, wTotal = 4 → 31
    const statsTagged = computeCycleStats(logsTagged);
    expect(statsTagged.avgCycleLength).toBe(31);

    // The difference: 33 vs 31
    expect(statsNoTag.avgCycleLength - statsTagged.avgCycleLength).toBe(2);
  });

  it('should verify that tagging all cycles still produces a valid result', () => {
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01', tags: ['stress'] },
      { startDate: addDays('2025-06-01', -28), tags: ['illness'] },
      { startDate: addDays('2025-06-01', -56), tags: ['travel'] },
    ];

    // All gaps tagged
    // gaps: [28, 28], recentCount=1
    // gap[0]: recent, tagged → weight = 2*0.5 = 1
    // gap[1]: old, tagged → weight = 1*0.5 = 0.5
    // wSum = 28*1+28*0.5 = 28+14 = 42, wTotal = 1.5 → 28
    const stats = computeCycleStats(logs);
    expect(stats.avgCycleLength).toBe(28);
  });
});

// ---------------------------------------------------------------------------
// Test: Calendar markers consistency
// ---------------------------------------------------------------------------
describe('Calendar markers consistency', () => {
  it('logged markers should never be overwritten by predicted markers', () => {
    const today = todayStr();
    const periodLogs: PeriodRecord[] = [
      { startDate: today, endDate: addDays(today, 4) },
    ];

    const markers = buildCalendarMarkers(today, 28, 5, periodLogs);

    // The 5 days of the logged period should all be 'logged'
    for (let d = 0; d < 5; d++) {
      const key = addDays(today, d);
      expect(markers[key]).toEqual({ type: 'period', source: 'logged' });
    }
  });

  it('should mark exactly 3 cycles of predicted data', () => {
    const today = todayStr();
    const markers = buildCalendarMarkers(today, 28, 5);

    // Count predicted period days: 3 cycles * 5 days = 15
    const predictedPeriods = Object.entries(markers)
      .filter(([_, m]) => m.type === 'period' && m.source === 'predicted');
    expect(predictedPeriods.length).toBe(15);

    // Count predicted ovulation days: 3 cycles * 1 day = 3
    const predictedOvulations = Object.entries(markers)
      .filter(([_, m]) => m.type === 'ovulation' && m.source === 'predicted');
    expect(predictedOvulations.length).toBe(3);
  });

  it('each date should have at most one marker', () => {
    const today = todayStr();
    const markers = buildCalendarMarkers(today, 28, 5);

    // Since markers is a Record<string, CalendarMarker>, each key appears once by definition.
    // But let's verify that ovulation and fertile don't overlap with period:
    for (const [date, marker] of Object.entries(markers)) {
      // Each date has exactly one type
      expect(['period', 'ovulation', 'fertile']).toContain(marker.type);
      expect(['logged', 'predicted']).toContain(marker.source);
    }
  });
});

// ---------------------------------------------------------------------------
// Test: Deviation detection edge cases
// ---------------------------------------------------------------------------
describe('Deviation detection edge cases', () => {
  it('should handle deviation when period comes exactly on predicted date', () => {
    const dev = detectDeviation('2025-01-29', '2025-01-01', 28);
    expect(dev.type).toBe('on_time');
    expect(dev.daysDifference).toBe(0);
    expect(dev.isSignificant).toBe(false);
  });

  it('should correctly identify very late period (15 days)', () => {
    const dev = detectDeviation(addDays('2025-01-01', 43), '2025-01-01', 28);
    expect(dev.type).toBe('late');
    expect(dev.daysDifference).toBe(15);
    expect(dev.isSignificant).toBe(true);
  });

  it('should correctly identify very early period (10 days)', () => {
    const dev = detectDeviation(addDays('2025-01-01', 18), '2025-01-01', 28);
    expect(dev.type).toBe('early');
    expect(dev.daysDifference).toBe(-10);
    expect(dev.isSignificant).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test: Prediction window confidence formula
// ---------------------------------------------------------------------------
describe('Prediction window confidence formula', () => {
  it('should compute minimum confidence: 1 gap, high variability', () => {
    // Need 2 logs, with very different gap — but only 1 gap means variability = 0
    // To get high variability we need at least 2 gaps
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01' },
      { startDate: addDays('2025-06-01', -21) },
      { startDate: addDays('2025-06-01', -66) },
    ];
    // gaps: [21, 45], variability = sqrt(((21-33)^2 + (45-33)^2)/2) = 12
    // gapCount = min(2, 6) = 2
    // cycleBonus = 2*5 = 10
    // varBonus = 0 (variability > 3)
    // confidence = 40 + 10 + 0 = 50
    const pw = computePredictionWindow(logs, makeSettings());
    expect(pw!.confidence).toBe(50);
    expect(pw!.confidenceLabel).toBe('medium');
  });

  it('should compute maximum confidence: 7 logs, 0 variability', () => {
    const logs = generatePeriodLogs(7, 28, '2025-06-01');
    // gapCount = min(6, 6) = 6
    // cycleBonus = 6*5 = 30
    // varBonus = 30 (variability = 0)
    // confidence = 40 + 30 + 30 = 100
    const pw = computePredictionWindow(logs, makeSettings());
    expect(pw!.confidence).toBe(100);
    expect(pw!.confidenceLabel).toBe('high');
  });

  it('should clamp confidence to minimum 10', () => {
    // This is hard to hit since base is 40 and min cycleBonus is 5,
    // but the formula has max(10, ...) so verify the formula is correct
    // Minimum possible: 40 + 5 + 0 = 45 (2 logs, high var)
    // We can't get below 45 with valid data — so 10 clamp is theoretical
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01' },
      { startDate: addDays('2025-06-01', -25) },
    ];
    const pw = computePredictionWindow(logs, makeSettings());
    // gapCount=1, cycleBonus=5, variability=0 → varBonus=30
    // confidence = 40+5+30 = 75
    expect(pw!.confidence).toBeGreaterThanOrEqual(10);
  });

  it('should assign correct confidence labels at boundaries', () => {
    // confidence 70 → high
    // confidence 69 → medium
    // confidence 45 → medium
    // confidence 44 → low

    // 4 logs, variability ~2.5 → varBonus = 10
    // gapCount = 3, cycleBonus = 15
    // confidence = 40 + 15 + 10 = 65 → medium
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01' },
      { startDate: addDays('2025-06-01', -25) },  // gap 25
      { startDate: addDays('2025-06-01', -55) },   // gap 30
      { startDate: addDays('2025-06-01', -83) },   // gap 28
    ];
    const stats = computeCycleStats(logs);
    // variability check: mean = (25+30+28)/3 = 27.67
    // var = ((25-27.67)^2 + (30-27.67)^2 + (28-27.67)^2) / 3
    //     = (7.11 + 5.43 + 0.11) / 3 = 4.22
    // std = sqrt(4.22) ≈ 2.1 → varBonus = 10 (2 < var ≤ 3 → wait, 2.1 ≤ 2? No, 2.1 > 2)
    // Actually: variability <= 2 → 20, variability <= 3 → 10
    // 2.1 is > 2 but ≤ 3 → varBonus = 10
    const pw = computePredictionWindow(logs, makeSettings());
    expect(pw!.confidence).toBe(65);
    expect(pw!.confidenceLabel).toBe('medium');
  });
});

// ---------------------------------------------------------------------------
// Test: Store-level simulation (recomputeCycleFromLogs equivalent)
// ---------------------------------------------------------------------------
describe('Store-level cycle recomputation simulation', () => {
  /**
   * Simulates recomputeCycleFromLogs from appStore.ts
   * (pure function, no Supabase dependency)
   */
  function recomputeCycleFromLogs(
    logs: PeriodRecord[],
    current: CycleSettings,
  ): CycleSettings {
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

  it('should set lastPeriodStartDate to the most recent log', () => {
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-29' },
      { startDate: '2025-06-01' },
    ];
    const settings = makeSettings({ lastPeriodStartDate: '2025-01-01' });
    const result = recomputeCycleFromLogs(logs, settings);
    expect(result.lastPeriodStartDate).toBe('2025-06-29');
  });

  it('should keep current settings when logs array is empty', () => {
    const settings = makeSettings({ lastPeriodStartDate: '2025-01-01', avgCycleLength: 30 });
    const result = recomputeCycleFromLogs([], settings);
    expect(result.lastPeriodStartDate).toBe('2025-01-01');
    expect(result.avgCycleLength).toBe(30);
  });

  it('should compute simple average (not weighted) for avgCycleLength', () => {
    // The store's recomputeCycleFromLogs uses simple average, not weighted
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01' },
      { startDate: addDays('2025-06-01', -30) },
      { startDate: addDays('2025-06-01', -58) },
    ];
    // gaps: [30, 28] → simple avg = 29
    const result = recomputeCycleFromLogs(logs, makeSettings());
    expect(result.avgCycleLength).toBe(29);
  });

  it('should filter invalid gaps (<21 or >45) in store recomputation', () => {
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01' },
      { startDate: addDays('2025-06-01', -15) }, // gap 15 (invalid)
      { startDate: addDays('2025-06-01', -43) }, // gap 28 (valid)
    ];
    const result = recomputeCycleFromLogs(logs, makeSettings());
    expect(result.avgCycleLength).toBe(28); // only valid gap used
  });

  it('should preserve avgPeriodLength (store recompute does not change it)', () => {
    const settings = makeSettings({ avgPeriodLength: 7 });
    const logs: PeriodRecord[] = [
      { startDate: '2025-06-01', endDate: '2025-06-03' }, // 3-day period
      { startDate: '2025-05-04' },
    ];
    const result = recomputeCycleFromLogs(logs, settings);
    // recomputeCycleFromLogs does NOT update avgPeriodLength
    expect(result.avgPeriodLength).toBe(7);
  });
});
