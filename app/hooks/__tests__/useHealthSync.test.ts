/**
 * useHealthSync — TDD test suite
 *
 * Tests:
 *  1. isDuplicate helper — pure logic, no mocks needed
 *  2. HealthKit sync path — writes new records to period_logs via addPeriodLog
 *  3. Deduplication — records within 2-day tolerance are skipped
 *  4. Android / HealthConnect path — same persistence and dedup behaviour
 */

// ---------------------------------------------------------------------------
// Module mocks — must appear before any imports that trigger the module graph
// ---------------------------------------------------------------------------

// react-native-health: provide just enough shape for buildHealthKitSync to proceed
jest.mock('react-native-health', () => ({
  default: {
    Constants: {
      Permissions: {
        MenstrualFlow: 'MenstrualFlow',
      },
    },
    initHealthKit: jest.fn(),
    getMenstrualFlowSamples: jest.fn(),
  },
}), { virtual: true });

// react-native-health-connect: provide just enough shape for buildHealthConnectSync
jest.mock('react-native-health-connect', () => ({
  requestPermission: jest.fn(),
  readRecords: jest.fn(),
}), { virtual: true });

// react-native Platform — set to ios by default; override per describe block
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Zustand store — we only need the state accessed inside the hook
jest.mock('@/store/appStore', () => ({
  useAppStore: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { PeriodRecord } from '@/types';
import { isDuplicate } from '../useHealthSync';
import { useAppStore } from '@/store/appStore';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeLog(startDate: string, endDate?: string): PeriodRecord {
  return endDate ? { startDate, endDate } : { startDate };
}

// ---------------------------------------------------------------------------
// 1. isDuplicate — pure unit tests
// ---------------------------------------------------------------------------

describe('isDuplicate', () => {
  it('returns false when the existing log list is empty', () => {
    expect(isDuplicate([], '2024-01-15')).toBe(false);
  });

  it('returns true when an exact date match exists', () => {
    const existing = [makeLog('2024-01-15')];
    expect(isDuplicate(existing, '2024-01-15')).toBe(true);
  });

  it('returns true when existing log is 1 day before tolerance boundary', () => {
    // 2024-01-13 is 2 days before 2024-01-15 — within default tolerance of 2
    const existing = [makeLog('2024-01-13')];
    expect(isDuplicate(existing, '2024-01-15')).toBe(true);
  });

  it('returns true when existing log is 1 day after tolerance boundary', () => {
    // 2024-01-17 is 2 days after 2024-01-15 — within default tolerance of 2
    const existing = [makeLog('2024-01-17')];
    expect(isDuplicate(existing, '2024-01-15')).toBe(true);
  });

  it('returns true when existing log is exactly at tolerance boundary (2 days)', () => {
    const existing = [makeLog('2024-01-13')]; // exactly 2 days away
    expect(isDuplicate(existing, '2024-01-15')).toBe(true);
  });

  it('returns false when nearest log is 3 days away (beyond default tolerance)', () => {
    const existing = [makeLog('2024-01-12')]; // 3 days before
    expect(isDuplicate(existing, '2024-01-15')).toBe(false);
  });

  it('returns false when nearest log is 3 days in the future (beyond tolerance)', () => {
    const existing = [makeLog('2024-01-18')]; // 3 days after
    expect(isDuplicate(existing, '2024-01-15')).toBe(false);
  });

  it('matches against any entry in the list, not just the first', () => {
    const existing = [
      makeLog('2024-03-01'),
      makeLog('2024-01-15'), // exact match hidden further in list
    ];
    expect(isDuplicate(existing, '2024-01-15')).toBe(true);
  });

  it('respects a custom toleranceDays parameter', () => {
    const existing = [makeLog('2024-01-12')]; // 3 days away
    // With tolerance=3, should match; with tolerance=2, should not
    expect(isDuplicate(existing, '2024-01-15', 3)).toBe(true);
    expect(isDuplicate(existing, '2024-01-15', 2)).toBe(false);
  });

  it('handles empty string dates gracefully (NaN difference → no match)', () => {
    const existing = [makeLog('')];
    // new Date('').getTime() → NaN; Math.abs(NaN - n) → NaN; NaN <= 172800000 → false
    expect(isDuplicate(existing, '2024-01-15')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2 & 3. HealthKit (iOS) sync path — persistence + deduplication
// ---------------------------------------------------------------------------

describe('useHealthSync — iOS / HealthKit path', () => {
  // We test the persistence behaviour by exercising useHealthSync's returned
  // sync() function. The hook is not a React hook in the traditional sense
  // (it relies on Platform + require), so we call it as a plain function.

  const mockAddPeriodLog = jest.fn().mockResolvedValue(undefined);
  const mockUpdateCycleSettings = jest.fn().mockResolvedValue(undefined);
  const mockUpdateNotificationPrefs = jest.fn();

  // Fake HealthKit module reference
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const HealthKit = require('react-native-health').default;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default store state: no existing logs
    (useAppStore as unknown as jest.Mock).mockImplementation((selector: (s: object) => unknown) =>
      selector({
        updateCycleSettings: mockUpdateCycleSettings,
        updateNotificationPrefs: mockUpdateNotificationPrefs,
        addPeriodLog: mockAddPeriodLog,
        periodLogs: [],
      }),
    );
  });

  function setupHealthKit(samples: object[]) {
    HealthKit.initHealthKit.mockImplementation(
      (_opts: unknown, cb: (err: null) => void) => cb(null),
    );
    HealthKit.getMenstrualFlowSamples.mockImplementation(
      (_opts: unknown, cb: (err: null, results: object[]) => void) => cb(null, samples),
    );
  }

  it('calls addPeriodLog for each new record when no existing logs', async () => {
    setupHealthKit([
      { startDate: '2024-01-15T00:00:00.000Z' },
      { startDate: '2024-01-16T00:00:00.000Z' },
      { startDate: '2024-01-17T00:00:00.000Z' },
    ]);

    // Import here so Platform.OS mock is in place
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useHealthSync } = require('../useHealthSync');
    const { sync } = useHealthSync();
    const records = await sync();

    expect(records.length).toBeGreaterThan(0);
    // Each distinct period group should be persisted
    expect(mockAddPeriodLog).toHaveBeenCalledTimes(records.length);
  });

  it('skips records that duplicate an existing log (within 2-day tolerance)', async () => {
    // Simulate one period already stored
    (useAppStore as unknown as jest.Mock).mockImplementation((selector: (s: object) => unknown) =>
      selector({
        updateCycleSettings: mockUpdateCycleSettings,
        updateNotificationPrefs: mockUpdateNotificationPrefs,
        addPeriodLog: mockAddPeriodLog,
        // existing log at 2024-01-15 — matches any HK record within 2 days
        periodLogs: [makeLog('2024-01-15')],
      }),
    );

    // HealthKit returns samples that correspond to the SAME period (2024-01-14 to 2024-01-17)
    // plus a second period from 2024-03-01
    setupHealthKit([
      { startDate: '2024-03-01T00:00:00.000Z' },
      { startDate: '2024-01-14T00:00:00.000Z' },
      { startDate: '2024-01-15T00:00:00.000Z' },
      { startDate: '2024-01-16T00:00:00.000Z' },
      { startDate: '2024-01-17T00:00:00.000Z' },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    jest.resetModules();
    // Re-apply mocks after module reset
    jest.mock('react-native-health', () => ({
      default: {
        Constants: { Permissions: { MenstrualFlow: 'MenstrualFlow' } },
        initHealthKit: HealthKit.initHealthKit,
        getMenstrualFlowSamples: HealthKit.getMenstrualFlowSamples,
      },
    }), { virtual: true });
    jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
    jest.mock('@/store/appStore', () => ({ useAppStore: useAppStore }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useHealthSync } = require('../useHealthSync');
    const { sync } = useHealthSync();
    const records = await sync();

    // buildPeriodRecords groups consecutive days → two periods: Jan and Mar
    // Jan period is within 2 days of existing log → skipped
    // Mar period is new → persisted
    expect(records.length).toBe(2);
    // Only the new March period should be written to the store
    expect(mockAddPeriodLog).toHaveBeenCalledTimes(1);
    expect(mockAddPeriodLog.mock.calls[0][0]).toMatch(/^2024-03/);
  });

  it('does not call addPeriodLog when HealthKit returns no samples', async () => {
    HealthKit.initHealthKit.mockImplementation(
      (_opts: unknown, cb: (err: null) => void) => cb(null),
    );
    HealthKit.getMenstrualFlowSamples.mockImplementation(
      (_opts: unknown, cb: (err: null, results: null) => void) => cb(null, null),
    );

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useHealthSync } = require('../useHealthSync');
    const { sync } = useHealthSync();
    await sync();

    expect(mockAddPeriodLog).not.toHaveBeenCalled();
  });

  it('does not call addPeriodLog when HealthKit init fails', async () => {
    HealthKit.initHealthKit.mockImplementation(
      (_opts: unknown, cb: (err: Error) => void) => cb(new Error('init failed')),
    );

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useHealthSync } = require('../useHealthSync');
    const { sync } = useHealthSync();
    await sync();

    expect(mockAddPeriodLog).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. Android / Health Connect sync path
// ---------------------------------------------------------------------------

describe('useHealthSync — Android / Health Connect path', () => {
  const mockAddPeriodLog = jest.fn().mockResolvedValue(undefined);
  const mockUpdateCycleSettings = jest.fn().mockResolvedValue(undefined);
  const mockUpdateNotificationPrefs = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const HealthConnect = require('react-native-health-connect');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Switch Platform to android
    jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
    jest.mock('@/store/appStore', () => ({
      useAppStore: jest.fn((selector: (s: object) => unknown) =>
        selector({
          updateCycleSettings: mockUpdateCycleSettings,
          updateNotificationPrefs: mockUpdateNotificationPrefs,
          addPeriodLog: mockAddPeriodLog,
          periodLogs: [],
        }),
      ),
    }));
    jest.mock('react-native-health-connect', () => HealthConnect, { virtual: true });
  });

  it('calls addPeriodLog for each new record on Android', async () => {
    HealthConnect.requestPermission.mockResolvedValue([{ accessType: 'read', recordType: 'MenstruationFlow' }]);
    HealthConnect.readRecords.mockResolvedValue({
      records: [
        { startDate: '2024-02-10T00:00:00.000Z' },
        { startDate: '2024-02-11T00:00:00.000Z' },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useHealthSync } = require('../useHealthSync');
    const { sync } = useHealthSync();
    const records = await sync();

    expect(records.length).toBeGreaterThan(0);
    expect(mockAddPeriodLog).toHaveBeenCalledTimes(records.length);
  });

  it('skips duplicate records on Android (within 2-day tolerance)', async () => {
    // Override store to include an existing log matching the HK data
    jest.mock('@/store/appStore', () => ({
      useAppStore: jest.fn((selector: (s: object) => unknown) =>
        selector({
          updateCycleSettings: mockUpdateCycleSettings,
          updateNotificationPrefs: mockUpdateNotificationPrefs,
          addPeriodLog: mockAddPeriodLog,
          periodLogs: [makeLog('2024-02-10')],
        }),
      ),
    }));

    HealthConnect.requestPermission.mockResolvedValue([{ accessType: 'read', recordType: 'MenstruationFlow' }]);
    HealthConnect.readRecords.mockResolvedValue({
      records: [
        { startDate: '2024-02-10T00:00:00.000Z' },
        { startDate: '2024-02-11T00:00:00.000Z' },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useHealthSync } = require('../useHealthSync');
    const { sync } = useHealthSync();
    await sync();

    // All samples form one period group, which matches existing log → all skipped
    expect(mockAddPeriodLog).not.toHaveBeenCalled();
  });

  it('does not call addPeriodLog when permission is denied', async () => {
    HealthConnect.requestPermission.mockResolvedValue([]);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useHealthSync } = require('../useHealthSync');
    const { sync } = useHealthSync();
    await sync();

    expect(mockAddPeriodLog).not.toHaveBeenCalled();
  });
});
