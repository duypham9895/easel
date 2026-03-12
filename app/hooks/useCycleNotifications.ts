import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAppStore } from '@/store/appStore';
import i18n from '@/i18n/config';

const isWeb = Platform.OS === 'web';

// Native-only import — skip on web where expo-notifications is unavailable
let Notifications: typeof import('expo-notifications') | null = null;
if (!isWeb) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
}

/** Stable identifier used to cancel/replace the period-approaching notification. */
const PERIOD_APPROACHING_ID = 'period-approaching';

const DAY_MS = 86_400_000;

/**
 * Parse a YYYY-MM-DD string as local midnight.
 * Avoids the UTC date-only parsing pitfall.
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Cancels any previously scheduled period-approaching notification.
 */
async function cancelPeriodNotification(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(PERIOD_APPROACHING_ID);
  } catch {
    // Notification may not exist — safe to ignore
  }
}

/**
 * Schedules a local push notification for period approaching.
 *
 * The notification fires at 9:00 AM local time on the computed date:
 *   nextPeriodDate - manualDaysBefore days
 *
 * If the computed trigger date is in the past, scheduling is skipped.
 */
async function schedulePeriodNotification(
  lastPeriodStartDate: string,
  avgCycleLength: number,
  manualDaysBefore: number,
): Promise<void> {
  if (!Notifications) return;

  // Compute the next predicted period start date
  const lastStart = parseLocalDate(lastPeriodStartDate);
  const nextPeriodDate = new Date(lastStart.getTime());
  nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycleLength);

  // Compute notification trigger date
  const notifyDate = new Date(nextPeriodDate.getTime());
  notifyDate.setDate(notifyDate.getDate() - manualDaysBefore);
  // Fire at 9:00 AM local time
  notifyDate.setHours(9, 0, 0, 0);

  const now = new Date();

  // Skip scheduling if the trigger date is in the past
  if (notifyDate.getTime() <= now.getTime()) return;

  const secondsUntilTrigger = Math.round((notifyDate.getTime() - now.getTime()) / 1000);

  // Determine the correct day count for the notification body
  const daysUntil = Math.round((nextPeriodDate.getTime() - notifyDate.getTime()) / DAY_MS);
  const effectiveDays = daysUntil > 0 ? daysUntil : manualDaysBefore;

  const title = i18n.t('calendar:notificationPeriodApproachingTitle');
  const body = i18n.t('calendar:notificationPeriodApproachingBody', { days: effectiveDays });

  // Cancel any existing notification before scheduling a new one
  await cancelPeriodNotification();

  await Notifications.scheduleNotificationAsync({
    identifier: PERIOD_APPROACHING_ID,
    content: {
      title,
      body,
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'cycle' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilTrigger,
      repeats: false,
    },
  });
}

/**
 * Schedules / reschedules local push notifications for period prediction.
 *
 * Runs on app start and whenever prediction data or notification prefs change.
 * Only active for Moon users with periodApproaching enabled.
 */
export function useCycleNotifications() {
  const role = useAppStore((s) => s.role);
  const cycleSettings = useAppStore((s) => s.cycleSettings);
  const notificationPrefs = useAppStore((s) => s.notificationPrefs);

  useEffect(() => {
    if (isWeb) return;

    // Only Moon gets cycle notifications
    if (role !== 'moon' || !notificationPrefs.periodApproaching) {
      cancelPeriodNotification();
      return;
    }

    // Need valid cycle settings to compute next period date
    if (!cycleSettings.lastPeriodStartDate || !cycleSettings.avgCycleLength) {
      cancelPeriodNotification();
      return;
    }

    schedulePeriodNotification(
      cycleSettings.lastPeriodStartDate,
      cycleSettings.avgCycleLength,
      notificationPrefs.manualDaysBefore,
    ).catch((err) => {
      console.warn('[useCycleNotifications] failed to schedule notification:', err);
    });
  }, [
    role,
    cycleSettings.lastPeriodStartDate,
    cycleSettings.avgCycleLength,
    notificationPrefs.periodApproaching,
    notificationPrefs.manualDaysBefore,
  ]);
}
