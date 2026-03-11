import { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Animated, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { MoonColors, Spacing, Radii, Typography, Colors } from '@/constants/theme';
import { notificationSuccess, impactMedium } from '@/utils/haptics';

const MOON = MoonColors;
const DAY_MS = 86_400_000;
const MAX_PAST_DAYS = 30;
const DEDUP_WINDOW_DAYS = 2;

interface Props {
  visible: boolean;
  selectedDate: string; // ISO date YYYY-MM-DD from calendar tap
  onClose: () => void;
}

function formatDateDisplay(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Validates that the selected date is acceptable for period logging.
 * Returns null if valid, or an i18n key suffix for the error.
 */
function validateDate(
  selectedDate: string,
  periodLogs: ReadonlyArray<{ startDate: string; endDate?: string }>,
): 'futureDate' | 'tooFarBack' | 'overlap' | null {
  const selectedMs = new Date(selectedDate + 'T00:00:00').getTime();
  const todayMs = new Date();
  todayMs.setHours(0, 0, 0, 0);

  // Cannot log future dates
  if (selectedMs > todayMs.getTime()) {
    return 'futureDate';
  }

  // Cannot log more than 30 days in the past
  const daysDiff = Math.round((todayMs.getTime() - selectedMs) / DAY_MS);
  if (daysDiff > MAX_PAST_DAYS) {
    return 'tooFarBack';
  }

  // Cannot overlap with existing periods (within +/-2 day dedup window)
  for (const log of periodLogs) {
    const logMs = new Date(log.startDate + 'T00:00:00').getTime();
    const distance = Math.abs(selectedMs - logMs) / DAY_MS;
    if (distance <= DEDUP_WINDOW_DAYS) {
      return 'overlap';
    }
  }

  return null;
}

export function PeriodLogSheet({ visible, selectedDate, onClose }: Props) {
  const { t } = useTranslation('health');
  const { t: tCommon } = useTranslation('common');
  const { i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const slideAnim = useRef(new Animated.Value(600)).current;
  const periodLogs = useAppStore((s) => s.periodLogs);
  const addPeriodLog = useAppStore((s) => s.addPeriodLog);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const formattedDate = useMemo(
    () => formatDateDisplay(selectedDate, locale),
    [selectedDate, locale],
  );

  const validationError = useMemo(
    () => validateDate(selectedDate, periodLogs),
    [selectedDate, periodLogs],
  );

  const handleLogStart = useCallback(() => {
    if (validationError) {
      Alert.alert(
        tCommon('error'),
        t(`periodLog.validation.${validationError}`),
      );
      return;
    }

    impactMedium();
    Alert.alert(
      t('periodLog.periodStarted'),
      t('periodLog.confirmStart', { date: formattedDate }),
      [
        { text: t('periodLog.no'), style: 'cancel' },
        {
          text: t('periodLog.yes'),
          onPress: async () => {
            await addPeriodLog(selectedDate);
            notificationSuccess();
            onClose();
          },
        },
      ],
    );
  }, [validationError, t, tCommon, formattedDate, addPeriodLog, selectedDate, onClose]);

  const handleLogEnd = useCallback(() => {
    if (validationError) {
      Alert.alert(
        tCommon('error'),
        t(`periodLog.validation.${validationError}`),
      );
      return;
    }

    // Find the most recent period without an end date to close it
    const activePeriod = periodLogs.find((log) => !log.endDate);
    if (!activePeriod) {
      // No active period to end — treat as a start instead
      handleLogStart();
      return;
    }

    impactMedium();
    Alert.alert(
      t('periodLog.periodEnded'),
      t('periodLog.confirmEnd', { date: formattedDate }),
      [
        { text: t('periodLog.no'), style: 'cancel' },
        {
          text: t('periodLog.yes'),
          onPress: async () => {
            await addPeriodLog(activePeriod.startDate, selectedDate);
            notificationSuccess();
            onClose();
          },
        },
      ],
    );
  }, [validationError, t, tCommon, formattedDate, periodLogs, addPeriodLog, selectedDate, onClose, handleLogStart]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Selected date header */}
            <View style={styles.header}>
              <Feather name="calendar" size={22} color={Colors.menstrual} />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleLogStart}
                activeOpacity={0.85}
              >
                <View style={[styles.optionIconBg, { backgroundColor: Colors.menstrual + '18' }]}>
                  <Feather name="droplet" size={28} color={Colors.menstrual} />
                </View>
                <Text style={styles.optionTitle}>{t('periodLog.periodStarted')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleLogEnd}
                activeOpacity={0.85}
              >
                <View style={[styles.optionIconBg, { backgroundColor: Colors.follicular + '18' }]}>
                  <Feather name="check-circle" size={28} color={Colors.follicular} />
                </View>
                <Text style={styles.optionTitle}>{t('periodLog.periodEnded')}</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel */}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>{tCommon('maybeLater')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: MOON.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: MOON.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingBottom: 40,
    shadowColor: MOON.black,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: MOON.accentPrimary + '40',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: MOON.textPrimary,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  optionCard: {
    flex: 1,
    backgroundColor: MOON.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    color: MOON.textHint,
    textAlign: 'center',
  },
});
