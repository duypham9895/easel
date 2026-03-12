/**
 * Tests for cycle.ts DB functions.
 * All Supabase calls are mocked — no real DB connections.
 */

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { getCycleSettings, upsertCycleSettings, logPeriodStart, fetchPeriodLogs, deletePeriodLog } from '@/lib/db/cycle';

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// fetchPeriodLogs
// ---------------------------------------------------------------------------

describe('fetchPeriodLogs', () => {
  const USER_ID = 'user-abc-123';

  it('queries with correct columns, ordering, and limit', async () => {
    const mockData = [
      { start_date: '2026-03-01', end_date: '2026-03-05' },
      { start_date: '2026-02-01', end_date: '2026-02-05' },
    ];
    const limitMock = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
    const eqMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const result = await fetchPeriodLogs(USER_ID);

    expect(mockFrom).toHaveBeenCalledWith('period_logs');
    expect(selectMock).toHaveBeenCalledWith('start_date, end_date, tags');
    expect(eqMock).toHaveBeenCalledWith('user_id', USER_ID);
    expect(orderMock).toHaveBeenCalledWith('start_date', { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(24);
    expect(result).toEqual([
      { startDate: '2026-03-01', endDate: '2026-03-05' },
      { startDate: '2026-02-01', endDate: '2026-02-05' },
    ]);
  });

  it('omits endDate when end_date is null', async () => {
    const mockData = [{ start_date: '2026-03-01', end_date: null }];
    const limitMock = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
    const eqMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const result = await fetchPeriodLogs(USER_ID);
    expect(result[0].endDate).toBeUndefined();
    expect(result[0].startDate).toBe('2026-03-01');
  });

  it('returns empty array when no logs exist', async () => {
    const limitMock = jest.fn().mockResolvedValue({ data: [], error: null });
    const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
    const eqMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    expect(await fetchPeriodLogs(USER_ID)).toEqual([]);
  });

  it('throws when supabase returns an error', async () => {
    const limitMock = jest.fn().mockResolvedValue({ data: null, error: new Error('DB failed') });
    const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
    const eqMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    await expect(fetchPeriodLogs(USER_ID)).rejects.toThrow('DB failed');
  });

  it('handles null data response gracefully', async () => {
    const limitMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
    const eqMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    expect(await fetchPeriodLogs(USER_ID)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// deletePeriodLog
// ---------------------------------------------------------------------------

describe('deletePeriodLog', () => {
  it('deletes with correct filters', async () => {
    const innerEq = jest.fn().mockResolvedValue({ data: null, error: null });
    const outerEq = jest.fn().mockReturnValue({ eq: innerEq });
    const del = jest.fn().mockReturnValue({ eq: outerEq });
    mockFrom.mockReturnValue({ delete: del });

    await deletePeriodLog('user-1', '2026-03-01');

    expect(mockFrom).toHaveBeenCalledWith('period_logs');
    expect(outerEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(innerEq).toHaveBeenCalledWith('start_date', '2026-03-01');
  });

  it('throws on error', async () => {
    const innerEq = jest.fn().mockResolvedValue({ data: null, error: new Error('fail') });
    const outerEq = jest.fn().mockReturnValue({ eq: innerEq });
    mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: outerEq }) });

    await expect(deletePeriodLog('user-1', '2026-03-01')).rejects.toThrow('fail');
  });
});

// ---------------------------------------------------------------------------
// getCycleSettings (regression)
// ---------------------------------------------------------------------------

describe('getCycleSettings', () => {
  it('returns mapped CycleSettings', async () => {
    const dbRow = {
      id: 'cs-1', user_id: 'u1', avg_cycle_length: 29, avg_period_length: 6,
      last_period_start_date: '2026-03-01', created_at: '', updated_at: '',
    };
    const singleMock = jest.fn().mockResolvedValue({ data: dbRow, error: null });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eqMock }) });

    expect(await getCycleSettings('u1')).toEqual({ avgCycleLength: 29, avgPeriodLength: 6, lastPeriodStartDate: '2026-03-01' });
  });

  it('returns null for PGRST116', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eqMock }) });

    expect(await getCycleSettings('u1')).toBeNull();
  });

  it('throws on unexpected error', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: null, error: new Error('bad') });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eqMock }) });

    await expect(getCycleSettings('u1')).rejects.toThrow('bad');
  });
});

// ---------------------------------------------------------------------------
// upsertCycleSettings + logPeriodStart (regression)
// ---------------------------------------------------------------------------

describe('upsertCycleSettings', () => {
  it('upserts correct payload', async () => {
    const upsertMock = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    await upsertCycleSettings('u1', { avgCycleLength: 28, avgPeriodLength: 5, lastPeriodStartDate: '2026-03-01' });

    expect(upsertMock).toHaveBeenCalledWith(
      { user_id: 'u1', avg_cycle_length: 28, avg_period_length: 5, last_period_start_date: '2026-03-01' },
      { onConflict: 'user_id' }
    );
  });
});

describe('logPeriodStart', () => {
  it('upserts into period_logs', async () => {
    const upsertMock = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    await logPeriodStart('u1', '2026-03-01', 'cramps');

    expect(upsertMock).toHaveBeenCalledWith(
      { user_id: 'u1', start_date: '2026-03-01', notes: 'cramps' },
      { onConflict: 'user_id, start_date' }
    );
  });
});
