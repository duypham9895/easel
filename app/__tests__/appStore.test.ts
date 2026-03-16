/**
 * Integration tests for appStore period-related actions.
 *
 * These tests verify that store actions correctly:
 * - Update periodLogs state
 * - Recompute predictionWindow
 * - Call the appropriate DB functions
 * - Handle optimistic updates
 */

// ---------------------------------------------------------------------------
// Mocks — must be defined before imports
// ---------------------------------------------------------------------------

// Mock all Supabase DB functions
const mockLogPeriodStart = jest.fn().mockResolvedValue(undefined);
const mockDeletePeriodLog = jest.fn().mockResolvedValue(undefined);
const mockUpdatePeriodLogTags = jest.fn().mockResolvedValue(undefined);
const mockUpdatePeriodEndDate = jest.fn().mockResolvedValue(undefined);
const mockGetProfile = jest.fn().mockResolvedValue(null);
const mockUpsertProfile = jest.fn().mockResolvedValue(undefined);
const mockGetCycleSettings = jest.fn().mockResolvedValue(null);
const mockUpsertCycleSettings = jest.fn().mockResolvedValue(undefined);
const mockFetchPeriodLogs = jest.fn().mockResolvedValue([]);
const mockCreateOrRefreshLinkCode = jest.fn().mockResolvedValue(null);
const mockLinkToPartnerByCode = jest.fn().mockResolvedValue(null);
const mockGetMyCouple = jest.fn().mockResolvedValue(null);
const mockSendSOSSignal = jest.fn().mockResolvedValue(undefined);
const mockUpsertPushToken = jest.fn().mockResolvedValue(undefined);
const mockUpsertPeriodDayLog = jest.fn().mockResolvedValue(undefined);
const mockFetchPeriodDayLogs = jest.fn().mockResolvedValue([]);
const mockDeletePeriodDayLog = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/db/periodDayLogs', () => ({
  upsertPeriodDayLog: mockUpsertPeriodDayLog,
  fetchPeriodDayLogs: mockFetchPeriodDayLogs,
  deletePeriodDayLog: mockDeletePeriodDayLog,
}));

jest.mock('@/lib/db/cycle', () => ({
  getCycleSettings: mockGetCycleSettings,
  upsertCycleSettings: mockUpsertCycleSettings,
  fetchPeriodLogs: mockFetchPeriodLogs,
  logPeriodStart: mockLogPeriodStart,
  deletePeriodLog: mockDeletePeriodLog,
  updatePeriodLogTags: mockUpdatePeriodLogTags,
  updatePeriodEndDate: mockUpdatePeriodEndDate,
}));

jest.mock('@/lib/db/profiles', () => ({
  getProfile: mockGetProfile,
  upsertProfile: mockUpsertProfile,
}));

jest.mock('@/lib/db/couples', () => ({
  createOrRefreshLinkCode: mockCreateOrRefreshLinkCode,
  linkToPartnerByCode: mockLinkToPartnerByCode,
  getMyCouple: mockGetMyCouple,
}));

jest.mock('@/lib/db/sos', () => ({
  sendSOSSignal: mockSendSOSSignal,
}));

jest.mock('@/lib/db/pushTokens', () => ({
  upsertPushToken: mockUpsertPushToken,
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
  __esModule: true,
}));

jest.mock('@/i18n/config', () => ({
  default: {
    changeLanguage: jest.fn(),
    language: 'en',
  },
  __esModule: true,
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import type { PeriodRecord, PeriodDayRecord } from '@/types';

// We need to dynamically import the store after mocks are set up
let useAppStore: typeof import('@/store/appStore').useAppStore;

beforeAll(async () => {
  const mod = await import('@/store/appStore');
  useAppStore = mod.useAppStore;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function seedStore(overrides: Record<string, unknown>) {
  useAppStore.setState({
    userId: 'test-user-id',
    coupleId: 'test-couple-id',
    cycleSettings: {
      avgCycleLength: 28,
      avgPeriodLength: 5,
      lastPeriodStartDate: '2026-02-01',
    },
    periodLogs: [],
    predictionWindow: null,
    lastDeviation: null,
    ...overrides,
  });
}

function getState() {
  return useAppStore.getState();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('appStore period actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to a known state
    seedStore({});
  });

  // -----------------------------------------------------------------------
  // addPeriodLog
  // -----------------------------------------------------------------------
  describe('addPeriodLog', () => {
    it('adds a new period log to state', async () => {
      await getState().addPeriodLog('2026-03-01');
      const state = getState();

      expect(state.periodLogs).toHaveLength(1);
      expect(state.periodLogs[0].startDate).toBe('2026-03-01');
    });

    it('calls logPeriodStart DB function', async () => {
      await getState().addPeriodLog('2026-03-01');
      expect(mockLogPeriodStart).toHaveBeenCalledWith('test-user-id', '2026-03-01');
    });

    it('stores tags when provided', async () => {
      await getState().addPeriodLog('2026-03-01', undefined, ['stress', 'travel']);
      const state = getState();

      expect(state.periodLogs[0].tags).toEqual(['stress', 'travel']);
    });

    it('stores endDate when provided', async () => {
      await getState().addPeriodLog('2026-03-01', '2026-03-05');
      const state = getState();

      expect(state.periodLogs[0].endDate).toBe('2026-03-05');
    });

    it('replaces existing log with same startDate', async () => {
      seedStore({
        periodLogs: [{ startDate: '2026-03-01', endDate: '2026-03-04' }],
      });

      await getState().addPeriodLog('2026-03-01', '2026-03-06');
      const state = getState();

      expect(state.periodLogs).toHaveLength(1);
      expect(state.periodLogs[0].endDate).toBe('2026-03-06');
    });

    it('recomputes predictionWindow after adding', async () => {
      // Seed with existing logs so we have enough for prediction
      seedStore({
        periodLogs: [
          { startDate: '2026-02-01', endDate: '2026-02-05' },
        ],
      });

      await getState().addPeriodLog('2026-03-01', '2026-03-05');
      const state = getState();

      // With 2 logs, prediction should be computed
      expect(state.predictionWindow).not.toBeNull();
      expect(state.predictionWindow!.predictedDate).toBeDefined();
    });

    it('detects deviation from previous cycle', async () => {
      seedStore({
        cycleSettings: {
          avgCycleLength: 28,
          avgPeriodLength: 5,
          lastPeriodStartDate: '2026-02-01',
        },
        periodLogs: [
          { startDate: '2026-02-01', endDate: '2026-02-05' },
        ],
      });

      // Log a period 5 days late (predicted: 2026-03-01, actual: 2026-03-06)
      await getState().addPeriodLog('2026-03-06');
      const state = getState();

      expect(state.lastDeviation).not.toBeNull();
      expect(state.lastDeviation!.type).toBe('late');
      expect(state.lastDeviation!.daysDifference).toBe(5);
      expect(state.lastDeviation!.isSignificant).toBe(true);
    });

    it('does nothing if userId is null', async () => {
      seedStore({ userId: null });
      await getState().addPeriodLog('2026-03-01');
      expect(mockLogPeriodStart).not.toHaveBeenCalled();
    });

    it('maintains sorted order (newest first) and caps at 24', async () => {
      const existingLogs: PeriodRecord[] = [];
      for (let i = 0; i < 23; i++) {
        const month = String(12 - Math.floor(i / 2)).padStart(2, '0');
        const day = i % 2 === 0 ? '01' : '15';
        existingLogs.push({ startDate: `2025-${month}-${day}` });
      }
      seedStore({ periodLogs: existingLogs });

      await getState().addPeriodLog('2026-03-01');
      const state = getState();

      // Should cap at 24
      expect(state.periodLogs.length).toBeLessThanOrEqual(24);
      // Newest first
      expect(state.periodLogs[0].startDate).toBe('2026-03-01');
    });
  });

  // -----------------------------------------------------------------------
  // updatePeriodTags
  // -----------------------------------------------------------------------
  describe('updatePeriodTags', () => {
    it('optimistically updates tags on existing log', async () => {
      seedStore({
        periodLogs: [
          { startDate: '2026-03-01', endDate: '2026-03-05' },
          { startDate: '2026-02-01', endDate: '2026-02-05' },
        ],
      });

      await getState().updatePeriodTags('2026-03-01', ['stress']);
      const state = getState();

      expect(state.periodLogs[0].tags).toEqual(['stress']);
      // Other logs unchanged
      expect(state.periodLogs[1].tags).toBeUndefined();
    });

    it('calls updatePeriodLogTags DB function', async () => {
      seedStore({
        periodLogs: [{ startDate: '2026-03-01' }],
      });

      await getState().updatePeriodTags('2026-03-01', ['illness', 'medication']);
      expect(mockUpdatePeriodLogTags).toHaveBeenCalledWith(
        'test-user-id',
        '2026-03-01',
        ['illness', 'medication'],
      );
    });

    it('recomputes predictionWindow after tag update', async () => {
      seedStore({
        periodLogs: [
          { startDate: '2026-03-01', endDate: '2026-03-05' },
          { startDate: '2026-02-01', endDate: '2026-02-05' },
        ],
      });

      await getState().updatePeriodTags('2026-03-01', ['stress']);
      const state = getState();

      // With 2 logs, prediction should be recomputed
      expect(state.predictionWindow).not.toBeNull();
    });

    it('does nothing if userId is null', async () => {
      seedStore({ userId: null, periodLogs: [{ startDate: '2026-03-01' }] });
      await getState().updatePeriodTags('2026-03-01', ['stress']);
      expect(mockUpdatePeriodLogTags).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // setPeriodEndDate
  // -----------------------------------------------------------------------
  describe('setPeriodEndDate', () => {
    it('optimistically updates endDate on existing log', async () => {
      seedStore({
        periodLogs: [{ startDate: '2026-03-01' }],
      });

      await getState().setPeriodEndDate('2026-03-01', '2026-03-06');
      const state = getState();

      expect(state.periodLogs[0].endDate).toBe('2026-03-06');
    });

    it('calls updatePeriodEndDate DB function', async () => {
      seedStore({
        periodLogs: [{ startDate: '2026-03-01' }],
      });

      await getState().setPeriodEndDate('2026-03-01', '2026-03-06');
      expect(mockUpdatePeriodEndDate).toHaveBeenCalledWith(
        'test-user-id',
        '2026-03-01',
        '2026-03-06',
      );
    });

    it('recomputes cycleSettings and predictionWindow', async () => {
      seedStore({
        periodLogs: [
          { startDate: '2026-03-01' },
          { startDate: '2026-02-01', endDate: '2026-02-05' },
        ],
      });

      await getState().setPeriodEndDate('2026-03-01', '2026-03-06');
      const state = getState();

      // cycleSettings should be recomputed (lastPeriodStartDate = newest log)
      expect(state.cycleSettings.lastPeriodStartDate).toBe('2026-03-01');
      expect(state.predictionWindow).not.toBeNull();
    });

    it('does nothing if userId is null', async () => {
      seedStore({ userId: null, periodLogs: [{ startDate: '2026-03-01' }] });
      await getState().setPeriodEndDate('2026-03-01', '2026-03-06');
      expect(mockUpdatePeriodEndDate).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // removePeriodLog
  // -----------------------------------------------------------------------
  describe('removePeriodLog', () => {
    it('removes the specified log from state', async () => {
      seedStore({
        periodLogs: [
          { startDate: '2026-03-01', endDate: '2026-03-05' },
          { startDate: '2026-02-01', endDate: '2026-02-05' },
        ],
      });

      await getState().removePeriodLog('2026-03-01');
      const state = getState();

      expect(state.periodLogs).toHaveLength(1);
      expect(state.periodLogs[0].startDate).toBe('2026-02-01');
    });

    it('calls deletePeriodLog DB function', async () => {
      seedStore({
        periodLogs: [{ startDate: '2026-03-01' }],
      });

      await getState().removePeriodLog('2026-03-01');
      expect(mockDeletePeriodLog).toHaveBeenCalledWith('test-user-id', '2026-03-01');
    });

    it('recomputes cycleSettings and predictionWindow', async () => {
      seedStore({
        periodLogs: [
          { startDate: '2026-03-01', endDate: '2026-03-05' },
          { startDate: '2026-02-01', endDate: '2026-02-05' },
          { startDate: '2026-01-04', endDate: '2026-01-08' },
        ],
      });

      await getState().removePeriodLog('2026-03-01');
      const state = getState();

      // After removal, newest log is '2026-02-01'
      expect(state.cycleSettings.lastPeriodStartDate).toBe('2026-02-01');
      // With 2 remaining logs, prediction should still work
      expect(state.predictionWindow).not.toBeNull();
    });

    it('sets predictionWindow to null when fewer than 2 logs remain', async () => {
      seedStore({
        periodLogs: [
          { startDate: '2026-03-01' },
          { startDate: '2026-02-01' },
        ],
      });

      await getState().removePeriodLog('2026-03-01');
      const state = getState();

      // Only 1 log remains — prediction requires >= 2
      expect(state.predictionWindow).toBeNull();
    });

    it('does nothing if userId is null', async () => {
      seedStore({ userId: null, periodLogs: [{ startDate: '2026-03-01' }] });
      await getState().removePeriodLog('2026-03-01');
      expect(mockDeletePeriodLog).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Period Day Logs
// ---------------------------------------------------------------------------
describe('appStore period day log actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seedStore({
      periodDayLogs: {},
      selectedCalendarDay: null,
      isSavingDayLog: false,
      periodLogs: [
        { startDate: '2026-03-01', endDate: '2026-03-05' },
        { startDate: '2026-02-01', endDate: '2026-02-05' },
      ],
    });
  });

  // -----------------------------------------------------------------------
  // savePeriodDayLog
  // -----------------------------------------------------------------------
  describe('savePeriodDayLog', () => {
    it('saves day log with optimistic update', async () => {
      await getState().savePeriodDayLog('2026-03-02', 'medium', ['cramps', 'fatigue'], 'test note');
      const state = getState();

      expect(state.periodDayLogs['2026-03-02']).toEqual({
        logDate: '2026-03-02',
        flowIntensity: 'medium',
        symptoms: ['cramps', 'fatigue'],
        notes: 'test note',
      });
      expect(mockUpsertPeriodDayLog).toHaveBeenCalledWith(
        'test-user-id',
        '2026-03-02',
        'medium',
        ['cramps', 'fatigue'],
        'test note',
      );
    });

    it('rolls back on failure', async () => {
      mockUpsertPeriodDayLog.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        getState().savePeriodDayLog('2026-03-02', 'heavy', ['headache']),
      ).rejects.toThrow('DB error');

      const state = getState();
      // Should rollback to original empty map
      expect(state.periodDayLogs['2026-03-02']).toBeUndefined();
      expect(state.isSavingDayLog).toBe(false);
    });

    it('auto-creates period_log when day is not within existing period', async () => {
      // 2026-03-15 is outside both existing period ranges
      await getState().savePeriodDayLog('2026-03-15', 'light', []);
      const state = getState();

      // addPeriodLog should have been called internally, adding a new period starting 2026-03-15
      expect(mockLogPeriodStart).toHaveBeenCalledWith('test-user-id', '2026-03-15');
      expect(state.periodLogs.some((l) => l.startDate === '2026-03-15')).toBe(true);
    });

    it('does not create a period_log when day is within existing period', async () => {
      // 2026-03-02 is within the 03-01 to 03-05 period
      await getState().savePeriodDayLog('2026-03-02', 'medium', []);
      expect(mockLogPeriodStart).not.toHaveBeenCalled();
    });

    it('does nothing if userId is null', async () => {
      seedStore({ userId: null });
      await getState().savePeriodDayLog('2026-03-02', 'light', []);
      expect(mockUpsertPeriodDayLog).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // loadPeriodDayLogs
  // -----------------------------------------------------------------------
  describe('loadPeriodDayLogs', () => {
    it('loads records into state keyed by logDate', async () => {
      const records: PeriodDayRecord[] = [
        { logDate: '2026-03-01', flowIntensity: 'heavy', symptoms: ['cramps'] },
        { logDate: '2026-03-02', flowIntensity: 'medium', symptoms: ['fatigue'] },
        { logDate: '2026-03-03', flowIntensity: 'light', symptoms: [] },
      ];
      mockFetchPeriodDayLogs.mockResolvedValueOnce(records);

      await getState().loadPeriodDayLogs('2026-03-01', '2026-03-05');
      const state = getState();

      expect(mockFetchPeriodDayLogs).toHaveBeenCalledWith('test-user-id', '2026-03-01', '2026-03-05');
      expect(state.periodDayLogs['2026-03-01']).toEqual(records[0]);
      expect(state.periodDayLogs['2026-03-02']).toEqual(records[1]);
      expect(state.periodDayLogs['2026-03-03']).toEqual(records[2]);
    });

    it('merges with existing day logs', async () => {
      seedStore({
        periodDayLogs: {
          '2026-02-28': { logDate: '2026-02-28', flowIntensity: 'spotting', symptoms: [] },
        },
        periodLogs: [],
      });

      mockFetchPeriodDayLogs.mockResolvedValueOnce([
        { logDate: '2026-03-01', flowIntensity: 'heavy', symptoms: ['cramps'] },
      ]);

      await getState().loadPeriodDayLogs('2026-03-01', '2026-03-05');
      const state = getState();

      // Existing entry preserved
      expect(state.periodDayLogs['2026-02-28']).toBeDefined();
      // New entry added
      expect(state.periodDayLogs['2026-03-01']).toBeDefined();
    });

    it('does nothing if userId is null', async () => {
      seedStore({ userId: null });
      await getState().loadPeriodDayLogs('2026-03-01', '2026-03-05');
      expect(mockFetchPeriodDayLogs).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // removePeriodDayLog
  // -----------------------------------------------------------------------
  describe('removePeriodDayLog', () => {
    it('removes record from state optimistically', async () => {
      seedStore({
        periodDayLogs: {
          '2026-03-01': { logDate: '2026-03-01', flowIntensity: 'heavy', symptoms: ['cramps'] },
          '2026-03-02': { logDate: '2026-03-02', flowIntensity: 'medium', symptoms: [] },
        },
        periodLogs: [],
      });

      await getState().removePeriodDayLog('2026-03-01');
      const state = getState();

      expect(state.periodDayLogs['2026-03-01']).toBeUndefined();
      expect(state.periodDayLogs['2026-03-02']).toBeDefined();
      expect(mockDeletePeriodDayLog).toHaveBeenCalledWith('test-user-id', '2026-03-01');
    });

    it('rolls back on failure', async () => {
      const originalLogs: Record<string, PeriodDayRecord> = {
        '2026-03-01': { logDate: '2026-03-01', flowIntensity: 'heavy', symptoms: ['cramps'] },
      };
      seedStore({ periodDayLogs: originalLogs, periodLogs: [] });

      mockDeletePeriodDayLog.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        getState().removePeriodDayLog('2026-03-01'),
      ).rejects.toThrow('DB error');

      const state = getState();
      // Should rollback
      expect(state.periodDayLogs['2026-03-01']).toEqual(originalLogs['2026-03-01']);
    });

    it('does nothing if userId is null', async () => {
      seedStore({ userId: null });
      await getState().removePeriodDayLog('2026-03-01');
      expect(mockDeletePeriodDayLog).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // selectCalendarDay
  // -----------------------------------------------------------------------
  describe('selectCalendarDay', () => {
    it('sets selectedCalendarDay', () => {
      getState().selectCalendarDay('2026-03-15');
      expect(getState().selectedCalendarDay).toBe('2026-03-15');
    });

    it('clears selection when passed null', () => {
      seedStore({ selectedCalendarDay: '2026-03-15' });
      getState().selectCalendarDay(null);
      expect(getState().selectedCalendarDay).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // receivePeriodDayLog
  // -----------------------------------------------------------------------
  describe('receivePeriodDayLog', () => {
    it('INSERT adds record to state', () => {
      const record: PeriodDayRecord = {
        logDate: '2026-03-02',
        flowIntensity: 'medium',
        symptoms: ['bloating'],
      };

      getState().receivePeriodDayLog('INSERT', '2026-03-02', record);
      expect(getState().periodDayLogs['2026-03-02']).toEqual(record);
    });

    it('UPDATE updates existing record', () => {
      seedStore({
        periodDayLogs: {
          '2026-03-02': { logDate: '2026-03-02', flowIntensity: 'light', symptoms: [] },
        },
        periodLogs: [],
      });

      const updated: PeriodDayRecord = {
        logDate: '2026-03-02',
        flowIntensity: 'heavy',
        symptoms: ['cramps', 'nausea'],
      };

      getState().receivePeriodDayLog('UPDATE', '2026-03-02', updated);
      expect(getState().periodDayLogs['2026-03-02']).toEqual(updated);
    });

    it('DELETE removes record from state', () => {
      seedStore({
        periodDayLogs: {
          '2026-03-02': { logDate: '2026-03-02', flowIntensity: 'medium', symptoms: [] },
          '2026-03-03': { logDate: '2026-03-03', flowIntensity: 'light', symptoms: [] },
        },
        periodLogs: [],
      });

      getState().receivePeriodDayLog('DELETE', '2026-03-02', null);
      const state = getState();

      expect(state.periodDayLogs['2026-03-02']).toBeUndefined();
      expect(state.periodDayLogs['2026-03-03']).toBeDefined();
    });
  });
});
