/**
 * Tests for periodLogs store actions + recomputeCycleFromLogs.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn().mockReturnValue([{ languageCode: 'en' }]),
}));

jest.mock('@/i18n/config', () => ({
  __esModule: true,
  default: { language: 'en', changeLanguage: jest.fn(), use: jest.fn().mockReturnThis(), init: jest.fn().mockReturnThis() },
  SUPPORTED_LANGUAGES: ['en', 'vi'],
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: jest.fn(), signUp: jest.fn(), signOut: jest.fn(), getSession: jest.fn().mockResolvedValue({ data: { session: null } }) }, from: jest.fn() },
}));

jest.mock('@/lib/db/profiles', () => ({ getProfile: jest.fn(), upsertProfile: jest.fn() }));
jest.mock('@/lib/db/couples', () => ({ createOrRefreshLinkCode: jest.fn(), linkToPartnerByCode: jest.fn(), getMyCouple: jest.fn().mockResolvedValue(null) }));
jest.mock('@/lib/db/sos', () => ({ sendSOSSignal: jest.fn() }));
jest.mock('@/lib/db/pushTokens', () => ({ upsertPushToken: jest.fn() }));

const mockLogPeriodStart = jest.fn();
const mockFetchPeriodLogs = jest.fn();
const mockDeletePeriodLog = jest.fn();

jest.mock('@/lib/db/cycle', () => ({
  getCycleSettings: jest.fn(),
  upsertCycleSettings: jest.fn(),
  logPeriodStart: mockLogPeriodStart,
  fetchPeriodLogs: mockFetchPeriodLogs,
  deletePeriodLog: mockDeletePeriodLog,
}));

import { useAppStore } from '@/store/appStore';

function resetStore() {
  useAppStore.setState({
    isLoggedIn: true,
    userId: 'test-user-id',
    periodLogs: [],
    cycleSettings: { avgCycleLength: 28, avgPeriodLength: 5, lastPeriodStartDate: '2026-01-01' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ---------------------------------------------------------------------------
// loadPeriodLogs
// ---------------------------------------------------------------------------

describe('loadPeriodLogs', () => {
  it('fetches and sets period logs', async () => {
    const logs = [
      { startDate: '2026-03-01', endDate: '2026-03-05' },
      { startDate: '2026-02-01' },
    ];
    mockFetchPeriodLogs.mockResolvedValue(logs);

    await useAppStore.getState().loadPeriodLogs();

    expect(mockFetchPeriodLogs).toHaveBeenCalledWith('test-user-id');
    expect(useAppStore.getState().periodLogs).toEqual(logs);
  });

  it('does nothing when userId is null', async () => {
    useAppStore.setState({ userId: null });
    await useAppStore.getState().loadPeriodLogs();
    expect(mockFetchPeriodLogs).not.toHaveBeenCalled();
  });

  it('sets empty array when fetch returns empty', async () => {
    mockFetchPeriodLogs.mockResolvedValue([]);
    await useAppStore.getState().loadPeriodLogs();
    expect(useAppStore.getState().periodLogs).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// addPeriodLog
// ---------------------------------------------------------------------------

describe('addPeriodLog', () => {
  it('calls logPeriodStart and adds to state', async () => {
    mockLogPeriodStart.mockResolvedValue(undefined);

    await useAppStore.getState().addPeriodLog('2026-03-01');

    expect(mockLogPeriodStart).toHaveBeenCalledWith('test-user-id', '2026-03-01');
    expect(useAppStore.getState().periodLogs[0].startDate).toBe('2026-03-01');
  });

  it('sorts DESC and includes endDate', async () => {
    mockLogPeriodStart.mockResolvedValue(undefined);
    useAppStore.setState({ periodLogs: [{ startDate: '2026-02-01' }] });

    await useAppStore.getState().addPeriodLog('2026-03-01', '2026-03-05');

    const logs = useAppStore.getState().periodLogs;
    expect(logs).toHaveLength(2);
    expect(logs[0]).toEqual({ startDate: '2026-03-01', endDate: '2026-03-05' });
    expect(logs[1].startDate).toBe('2026-02-01');
  });

  it('replaces existing entry with same startDate', async () => {
    mockLogPeriodStart.mockResolvedValue(undefined);
    useAppStore.setState({ periodLogs: [{ startDate: '2026-03-01' }] });

    await useAppStore.getState().addPeriodLog('2026-03-01', '2026-03-05');

    expect(useAppStore.getState().periodLogs).toHaveLength(1);
    expect(useAppStore.getState().periodLogs[0].endDate).toBe('2026-03-05');
  });

  it('does not mutate existing array (immutable)', async () => {
    mockLogPeriodStart.mockResolvedValue(undefined);
    const original = [{ startDate: '2026-02-01' }];
    useAppStore.setState({ periodLogs: original });

    await useAppStore.getState().addPeriodLog('2026-03-01');

    expect(useAppStore.getState().periodLogs).not.toBe(original);
  });

  it('updates lastPeriodStartDate via recompute', async () => {
    mockLogPeriodStart.mockResolvedValue(undefined);

    await useAppStore.getState().addPeriodLog('2026-03-15');

    expect(useAppStore.getState().cycleSettings.lastPeriodStartDate).toBe('2026-03-15');
  });

  it('does nothing when userId is null', async () => {
    useAppStore.setState({ userId: null });
    await useAppStore.getState().addPeriodLog('2026-03-01');
    expect(mockLogPeriodStart).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// removePeriodLog
// ---------------------------------------------------------------------------

describe('removePeriodLog', () => {
  it('removes matching log from state', async () => {
    mockDeletePeriodLog.mockResolvedValue(undefined);
    useAppStore.setState({
      periodLogs: [{ startDate: '2026-03-01' }, { startDate: '2026-02-01' }],
    });

    await useAppStore.getState().removePeriodLog('2026-03-01');

    expect(mockDeletePeriodLog).toHaveBeenCalledWith('test-user-id', '2026-03-01');
    expect(useAppStore.getState().periodLogs).toHaveLength(1);
    expect(useAppStore.getState().periodLogs[0].startDate).toBe('2026-02-01');
  });

  it('recomputes lastPeriodStartDate after removal', async () => {
    mockDeletePeriodLog.mockResolvedValue(undefined);
    useAppStore.setState({
      periodLogs: [{ startDate: '2026-03-01' }, { startDate: '2026-02-01' }],
      cycleSettings: { avgCycleLength: 28, avgPeriodLength: 5, lastPeriodStartDate: '2026-03-01' },
    });

    await useAppStore.getState().removePeriodLog('2026-03-01');

    expect(useAppStore.getState().cycleSettings.lastPeriodStartDate).toBe('2026-02-01');
  });

  it('does nothing when userId is null', async () => {
    useAppStore.setState({ userId: null, periodLogs: [{ startDate: '2026-03-01' }] });
    await useAppStore.getState().removePeriodLog('2026-03-01');
    expect(mockDeletePeriodLog).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// avgCycleLength recomputation
// ---------------------------------------------------------------------------

describe('avgCycleLength recomputation', () => {
  it('keeps default when fewer than 2 logs', async () => {
    mockLogPeriodStart.mockResolvedValue(undefined);
    await useAppStore.getState().addPeriodLog('2026-03-01');
    expect(useAppStore.getState().cycleSettings.avgCycleLength).toBe(28);
  });

  it('computes average gap between consecutive dates', async () => {
    mockLogPeriodStart.mockResolvedValue(undefined);
    useAppStore.setState({
      periodLogs: [
        { startDate: '2026-02-01' },
        { startDate: '2026-01-04' }, // 28 days gap
      ],
    });

    // Add log 30 days after most recent → gaps: 30, 28 → avg 29
    await useAppStore.getState().addPeriodLog('2026-03-03');

    expect(useAppStore.getState().cycleSettings.avgCycleLength).toBe(29);
  });

  it('ignores gaps outside 21-45 range', async () => {
    mockLogPeriodStart.mockResolvedValue(undefined);
    useAppStore.setState({
      periodLogs: [
        { startDate: '2026-02-01' },
        { startDate: '2025-11-23' }, // 70 days — invalid
      ],
    });

    // After add: gap 28 (valid) + gap 70 (filtered) → avg = 28
    await useAppStore.getState().addPeriodLog('2026-03-01');

    expect(useAppStore.getState().cycleSettings.avgCycleLength).toBe(28);
  });
});
