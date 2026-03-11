import { useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MoonColors, Spacing, Radii, Typography, Colors } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';
import { notificationSuccess, impactMedium } from '@/utils/haptics';

const MOON = MoonColors;

interface PeriodStartButtonProps {
  dayInCycle: number;
  avgCycleLength: number;
  avgPeriodLength: number;
}

/**
 * Determines whether the "Period Started/Ended" button should be visible.
 *
 * Visible when Moon is within:
 * - The predicted period window (menstrual phase), OR
 * - Up to 7 days after the predicted period end (early follicular), OR
 * - Late luteal phase (period approaching — last 7 days of cycle)
 * - Past due: cycle day exceeds expected cycle length
 */
function shouldShowButton(
  dayInCycle: number,
  avgCycleLength: number,
  avgPeriodLength: number,
): boolean {
  const isLateLuteal = dayInCycle > avgCycleLength - 7;
  const isDuringPeriod = dayInCycle <= avgPeriodLength;
  const isShortlyAfterPeriod =
    dayInCycle > avgPeriodLength && dayInCycle <= avgPeriodLength + 7;
  const isPastDue = dayInCycle > avgCycleLength;

  return isLateLuteal || isDuringPeriod || isShortlyAfterPeriod || isPastDue;
}

/**
 * Checks whether Moon has an active (unended) period right now.
 * An active period is the most recent log whose startDate is within
 * the current predicted period window and has no endDate.
 */
function hasActivePeriod(
  periodLogs: ReadonlyArray<{ startDate: string; endDate?: string }>,
  avgPeriodLength: number,
): boolean {
  if (periodLogs.length === 0) return false;

  const latest = periodLogs[0]; // sorted descending by startDate
  if (latest.endDate) return false;

  const startMs = new Date(latest.startDate).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor(
    (today.getTime() - startMs) / 86_400_000,
  );

  return daysSinceStart >= 0 && daysSinceStart <= avgPeriodLength + 3;
}

export function PeriodStartButton({
  dayInCycle,
  avgCycleLength,
  avgPeriodLength,
}: PeriodStartButtonProps) {
  const { t } = useTranslation('dashboard');
  const periodLogs = useAppStore((s) => s.periodLogs);
  const addPeriodLog = useAppStore((s) => s.addPeriodLog);

  const isVisible = useMemo(
    () => shouldShowButton(dayInCycle, avgCycleLength, avgPeriodLength),
    [dayInCycle, avgCycleLength, avgPeriodLength],
  );

  const isActive = useMemo(
    () => hasActivePeriod(periodLogs, avgPeriodLength),
    [periodLogs, avgPeriodLength],
  );

  const getToday = useCallback(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }, []);

  const handlePeriodStarted = useCallback(() => {
    impactMedium();
    Alert.alert(
      t('periodStartedTitle'),
      t('periodStartedMessage'),
      [
        { text: t('periodCancel'), style: 'cancel' },
        {
          text: t('periodConfirm'),
          onPress: async () => {
            await addPeriodLog(getToday());
            notificationSuccess();
          },
        },
      ],
    );
  }, [t, addPeriodLog, getToday]);

  const handlePeriodEnded = useCallback(() => {
    const latestLog = periodLogs[0];
    if (!latestLog) return;

    impactMedium();
    Alert.alert(
      t('periodEndedTitle'),
      t('periodEndedMessage'),
      [
        { text: t('periodCancel'), style: 'cancel' },
        {
          text: t('periodConfirm'),
          onPress: async () => {
            const freshLog = useAppStore.getState().periodLogs[0];
            if (!freshLog) return;
            await addPeriodLog(freshLog.startDate, getToday());
            notificationSuccess();
          },
        },
      ],
    );
  }, [t, addPeriodLog, periodLogs, getToday]);

  if (!isVisible) return null;

  const buttonLabel = isActive
    ? t('periodEndedButton')
    : t('periodStartedButton');
  const buttonIcon = isActive ? 'check-circle' : 'droplet';
  const buttonColor = isActive ? Colors.follicular : Colors.menstrual;

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={isActive ? handlePeriodEnded : handlePeriodStarted}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
      >
        <Feather name={buttonIcon} size={20} color={MOON.white} />
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radii.full,
    height: 52,
    paddingHorizontal: Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    ...Typography.bodyBold,
    color: MOON.white,
  },
});
