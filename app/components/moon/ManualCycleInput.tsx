import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { MoonColors } from '@/constants/theme';
import type { SyncResult } from '@/hooks/useHealthSyncOnboarding';

const M = MoonColors;

interface Props {
  onSubmit: (data: { lastPeriodStartDate: string; avgCycleLength: number; avgPeriodLength: number }) => void;
  prefill?: SyncResult | null;
}

function formatDateDisplay(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function computePreviewDate(lastPeriodStartDate: string, avgCycleLength: number): string {
  const start = new Date(lastPeriodStartDate);
  start.setHours(12, 0, 0, 0);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let nextDate = new Date(start);
  while (nextDate <= today) {
    nextDate.setDate(nextDate.getDate() + avgCycleLength);
  }
  return nextDate.toISOString().split('T')[0];
}

export function ManualCycleInput({ onSubmit, prefill }: Props) {
  const { t, i18n } = useTranslation('health');
  const { t: tCommon } = useTranslation('common');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const defaultDate = twoWeeksAgo.toISOString().split('T')[0];

  const [lastPeriod, setLastPeriod] = useState(prefill?.lastPeriodStartDate ?? defaultDate);
  const [cycleLength, setCycleLength] = useState(prefill?.avgCycleLength ?? 28);
  const [periodLength, setPeriodLength] = useState(prefill?.avgPeriodLength ?? 5);
  const [notSure, setNotSure] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const previewDate = computePreviewDate(lastPeriod, cycleLength);

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setLastPeriod(`${yyyy}-${mm}-${dd}`);
    }
  }

  function handleNotSureToggle() {
    const next = !notSure;
    setNotSure(next);
    if (next) {
      setCycleLength(28);
      setPeriodLength(5);
    }
  }

  function validate(): boolean {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const selected = new Date(lastPeriod + 'T12:00:00');

    if (selected > today) {
      Alert.alert(t('manualInput.validation.dateFuture'));
      return false;
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    if (selected < ninetyDaysAgo) {
      Alert.alert(t('manualInput.validation.dateTooOld'));
      return false;
    }

    return true;
  }

  function handleContinue() {
    if (!validate()) return;
    onSubmit({
      lastPeriodStartDate: lastPeriod,
      avgCycleLength: cycleLength,
      avgPeriodLength: periodLength,
    });
  }

  const maxDate = new Date();
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 90);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headline} accessibilityRole="header">
          {t('manualInput.headline')}
        </Text>

        <View style={styles.gap24} />

        {/* Date picker */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>{t('manualInput.lastPeriodLabel')}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('manualInput.lastPeriodLabel')}
          >
            <Feather name="calendar" size={18} color={M.accentPrimary} />
            <Text style={styles.dateText}>
              {formatDateDisplay(lastPeriod, locale)}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(lastPeriod + 'T12:00:00')}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={maxDate}
              minimumDate={minDate}
              onChange={handleDateChange}
              themeVariant="dark"
            />
          )}
          {showDatePicker && Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.doneDateButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.doneDateText}>{tCommon('done')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.gap16} />

        {/* Cycle length */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>{t('manualInput.cycleLengthLabel')}</Text>
          <Text style={styles.fieldHelper}>{t('manualInput.cycleLengthHelper')}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              onPress={() => setCycleLength(Math.max(21, cycleLength - 1))}
              style={styles.stepperButton}
              disabled={notSure}
              accessibilityLabel="Decrease cycle length"
            >
              <Feather name="minus" size={20} color={notSure ? M.textHint : M.textPrimary} />
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={[styles.stepperNumber, notSure && styles.dimmed]}>{cycleLength}</Text>
              <Text style={[styles.stepperUnit, notSure && styles.dimmed]}>{t('manualInput.daysUnit')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setCycleLength(Math.min(45, cycleLength + 1))}
              style={styles.stepperButton}
              disabled={notSure}
              accessibilityLabel="Increase cycle length"
            >
              <Feather name="plus" size={20} color={notSure ? M.textHint : M.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.gap16} />

        {/* Period length */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>{t('manualInput.periodLengthLabel')}</Text>
          <Text style={styles.fieldHelper}>{t('manualInput.periodLengthHelper')}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              onPress={() => setPeriodLength(Math.max(2, periodLength - 1))}
              style={styles.stepperButton}
              disabled={notSure}
              accessibilityLabel="Decrease period length"
            >
              <Feather name="minus" size={20} color={notSure ? M.textHint : M.textPrimary} />
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={[styles.stepperNumber, notSure && styles.dimmed]}>{periodLength}</Text>
              <Text style={[styles.stepperUnit, notSure && styles.dimmed]}>{t('manualInput.daysUnit')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setPeriodLength(Math.min(10, periodLength + 1))}
              style={styles.stepperButton}
              disabled={notSure}
              accessibilityLabel="Increase period length"
            >
              <Feather name="plus" size={20} color={notSure ? M.textHint : M.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.gap16} />

        {/* Not sure toggle */}
        <TouchableOpacity
          style={styles.notSureRow}
          onPress={handleNotSureToggle}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: notSure }}
        >
          <View style={[styles.checkbox, notSure && styles.checkboxChecked]}>
            {notSure && <Feather name="check" size={14} color={M.white} />}
          </View>
          <Text style={styles.notSureText}>{t('manualInput.notSureToggle')}</Text>
        </TouchableOpacity>
        {notSure && (
          <Text style={styles.notSureExplanation}>
            {t('manualInput.notSureExplanation')}
          </Text>
        )}

        <View style={styles.gap24} />

        {/* Prediction preview */}
        <View style={styles.previewCard}>
          <Feather name="calendar" size={16} color={M.accentPrimary} />
          <Text style={styles.previewText}>
            {t('manualInput.predictionPreview', {
              date: formatDateDisplay(previewDate, locale),
            })}
          </Text>
        </View>

        <View style={styles.gap24} />

        {/* Continue */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContinue}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>{t('manualInput.continueButton')}</Text>
        </TouchableOpacity>

        <View style={styles.gap32} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: M.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: M.textPrimary,
    letterSpacing: -0.5,
  },
  gap16: { height: 16 },
  gap24: { height: 24 },
  gap32: { height: 32 },
  fieldCard: {
    backgroundColor: M.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: M.textPrimary,
  },
  fieldHelper: {
    fontSize: 13,
    fontWeight: '400',
    color: M.textSecondary,
    lineHeight: 18,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: M.inputBg,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: M.textPrimary,
  },
  doneDateButton: {
    alignSelf: 'flex-end',
    backgroundColor: M.accentPrimary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  doneDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: M.white,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: M.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    alignItems: 'center',
    minWidth: 60,
  },
  stepperNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: M.textPrimary,
  },
  stepperUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: M.textSecondary,
  },
  dimmed: {
    opacity: 0.4,
  },
  notSureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: M.textHint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: M.accentPrimary,
    borderColor: M.accentPrimary,
  },
  notSureText: {
    fontSize: 15,
    fontWeight: '500',
    color: M.textSecondary,
  },
  notSureExplanation: {
    fontSize: 13,
    fontWeight: '400',
    color: M.textHint,
    lineHeight: 18,
    paddingLeft: 34,
    marginTop: 4,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: M.accentPrimary + '14',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: M.accentPrimary + '30',
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: M.accentPrimary,
    lineHeight: 20,
  },
  primaryButton: {
    height: 56,
    backgroundColor: M.accentPrimary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: M.white,
  },
});
