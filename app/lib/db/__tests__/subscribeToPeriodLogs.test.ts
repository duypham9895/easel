/**
 * Tests for subscribeToPeriodLogs Realtime subscription.
 * Mocks the Supabase channel to verify subscription setup and cleanup.
 */

const mockSubscribe = jest.fn().mockReturnThis();
const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannel = jest.fn().mockReturnValue({ on: mockOn });
const mockRemoveChannel = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

import { subscribeToPeriodLogs } from '@/lib/db/cycle';

beforeEach(() => jest.clearAllMocks());

describe('subscribeToPeriodLogs', () => {
  const MOON_ID = 'moon-user-123';

  it('creates a channel with the correct name', () => {
    subscribeToPeriodLogs(MOON_ID, jest.fn());
    expect(mockChannel).toHaveBeenCalledWith(`period-logs:${MOON_ID}`);
  });

  it('subscribes to postgres_changes INSERT events on period_logs', () => {
    subscribeToPeriodLogs(MOON_ID, jest.fn());
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'period_logs',
        filter: `user_id=eq.${MOON_ID}`,
      },
      expect.any(Function),
    );
  });

  it('calls subscribe() on the channel', () => {
    subscribeToPeriodLogs(MOON_ID, jest.fn());
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('returns a cleanup function that removes the channel', () => {
    const channelRef = { on: mockOn };
    mockChannel.mockReturnValueOnce(channelRef);
    mockOn.mockReturnValueOnce({ subscribe: jest.fn().mockReturnValue(channelRef) });

    const cleanup = subscribeToPeriodLogs(MOON_ID, jest.fn());
    expect(typeof cleanup).toBe('function');

    cleanup();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it('forwards payload to onNewPeriod callback with correct shape', () => {
    const onNewPeriod = jest.fn();
    subscribeToPeriodLogs(MOON_ID, onNewPeriod);

    // Extract the callback passed to .on()
    const callback = mockOn.mock.calls[0][2];
    const payload = {
      new: {
        id: 'log-1',
        user_id: MOON_ID,
        start_date: '2026-03-01',
        end_date: '2026-03-05',
        notes: null,
        created_at: '2026-03-01T00:00:00Z',
      },
    };

    callback(payload);

    expect(onNewPeriod).toHaveBeenCalledWith({
      start_date: '2026-03-01',
      end_date: '2026-03-05',
    });
  });

  it('handles null end_date in payload', () => {
    const onNewPeriod = jest.fn();
    subscribeToPeriodLogs(MOON_ID, onNewPeriod);

    const callback = mockOn.mock.calls[0][2];
    callback({
      new: {
        id: 'log-2',
        user_id: MOON_ID,
        start_date: '2026-03-10',
        end_date: null,
        notes: null,
        created_at: '2026-03-10T00:00:00Z',
      },
    });

    expect(onNewPeriod).toHaveBeenCalledWith({
      start_date: '2026-03-10',
      end_date: null,
    });
  });
});
