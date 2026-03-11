import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { MoonColors } from '@/constants/theme';
import {
  computeCycleLengthFromPeriods,
  computePeriodLengthFromEntries,
  sortPeriodsDesc,
  validatePeriods,
  TWO_YEARS_MS,
} from './periodHistoryLogic';

export type { PeriodEntry } from './periodHistoryLogic';
import type { PeriodEntry } from './periodHistoryLogic';

const M = MoonColors;

function toDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props {
  onSubmit: (data: {
    periods: PeriodEntry[];
    avgCycleLength: number;
    avgPeriodLength: number;
  }) => void;
  initialPeriods?: PeriodEntry[];
}

export function PeriodHistoryInput({ onSubmit, initialPeriods }: Props) {
  const { t, i18n } = useTranslation('health');
  const { t: tCommon } = useTranslation('common');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const [periods, setPeriods] = useState<PeriodEntry[]>(
    initialPeriods?.length ? initialPeriods : [{ startDate: toDateStr(twoWeeksAgo) }],
  );
  const [expanded, setExpanded] = useState((initialPeriods?.length ?? 0) > 1);
  const [periodLength, setPeriodLength] = useState(5);
  const [activePicker, setActivePicker] = useState<{ index: number; field: 'startDate' | 'endDate' } | null>(null);

  const computedCycleLen = computeCycleLengthFromPeriods(periods);
  const computedPeriodLen = computePeriodLengthFromEntries(periods);
  const [manualCycleLen, setManualCycleLen] = useState(28);

  const effectiveCycleLen = computedCycleLen ?? manualCycleLen;
  const effectivePeriodLen = computedPeriodLen ?? periodLength;

  const today = new Date();
  const minDate = new Date(today.getTime() - TWO_YEARS_MS);

  const sortedPeriods = sortPeriodsDesc(periods);

  const handleDateChange = useCallback(
    (index: number, field: 'startDate' | 'endDate') =>
      (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') setActivePicker(null);
        if (event.type !== 'set' || !selectedDate) return;

        const dateStr = toDateStr(selectedDate);
        setPeriods(prev => {
          const updated = [...prev];
          const entry = { ...updated[index] };
          if (field === 'startDate') {
            entry.startDate = dateStr;
            if (entry.endDate && new Date(entry.endDate) < new Date(dateStr)) {
              entry.endDate = undefined;
            }
          } else {
            entry.endDate = dateStr;
          }
          updated[index] = entry;
          return updated;
        });
      },
    [],
  );

  function addPeriod() {
    const lastStart = new Date(sortedPeriods[sortedPeriods.length - 1]?.startDate ?? toDateStr(today));
    lastStart.setDate(lastStart.getDate() - 28);
    if (lastStart < minDate) {
      Alert.alert(t('periodHistory.maxReached'));
      return;
    }
    setPeriods(prev => [...prev, { startDate: toDateStr(lastStart) }]);
    setExpanded(true);
  }

  function removePeriod(index: number) {
    if (periods.length <= 1) return;
    setPeriods(prev => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    const error = validatePeriods(periods);
    if (error === 'future') {
      Alert.alert(t('manualInput.validation.dateFuture'));
      return false;
    }
    if (error === 'tooOld') {
      Alert.alert(t('periodHistory.tooOld'));
      return false;
    }
    if (error === 'endBeforeStart') {
      Alert.alert(t('periodHistory.endBeforeStart'));
      return false;
    }
    if (error === 'overlap') {
      Alert.alert(t('periodHistory.overlap'));
      return false;
    }
    return true;
  }

  function handleContinue() {
    if (!validate()) return;
    onSubmit({
      periods: sortedPeriods,
      avgCycleLength: effectiveCycleLen,
      avgPeriodLength: effectivePeriodLen,
    });
  }

  const isPickerActive = (index: number, field: 'startDate' | 'endDate') =>
    activePicker?.index === index && activePicker?.field === field;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headline} accessibilityRole="header">
          {t('periodHistory.headline')}
        </Text>
        <Text style={styles.subtitle}>{t('periodHistory.subtitle')}</Text>

        <View style={styles.gap24} />

        {/* Most recent period (always visible) */}
        <PeriodRow
          entry={sortedPeriods[0]}
          index={0}
          locale={locale}
          isFirst
          activePicker={activePicker}
          onShowPicker={(field) => setActivePicker({ index: 0, field })}
          onDismissPicker={() => setActivePicker(null)}
          onDateChange={handleDateChange(
            periods.indexOf(sortedPeriods[0]),
            activePicker?.field ?? 'startDate',
          )}
          onRemove={() => {}}
          canRemove={false}
          maxDate={today}
          minDate={minDate}
          t={t}
          tCommon={tCommon}
          isPickerActive={isPickerActive}
          handleDateChangeForField={(field: 'startDate' | 'endDate') =>
            handleDateChange(periods.indexOf(sortedPeriods[0]), field)
          }
        />

        {/* Expandable: additional periods */}
        {!expanded && periods.length <= 1 && (
          <>
            <View style={styles.gap16} />
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => { addPeriod(); }}
              activeOpacity={0.7}
            >
              <Feather name="plus-circle" size={18} color={M.accentPrimary} />
              <Text style={styles.expandText}>{t('periodHistory.rememberMore')}</Text>
            </TouchableOpacity>
          </>
        )}

        {expanded && sortedPeriods.slice(1).map((entry) => {
          const realIndex = periods.indexOf(entry);
          return (
            <View key={`period-${realIndex}`}>
              <View style={styles.gap12} />
              <PeriodRow
                entry={entry}
                index={realIndex}
                locale={locale}
                isFirst={false}
                activePicker={activePicker}
                onShowPicker={(field) => setActivePicker({ index: realIndex, field })}
                onDismissPicker={() => setActivePicker(null)}
                onDateChange={handleDateChange(realIndex, activePicker?.field ?? 'startDate')}
                onRemove={() => removePeriod(realIndex)}
                canRemove
                maxDate={today}
                minDate={minDate}
                t={t}
                tCommon={tCommon}
                isPickerActive={(idx, field) =>
                  activePicker?.index === idx && activePicker?.field === field
                }
                handleDateChangeForField={(field: 'startDate' | 'endDate') =>
                  handleDateChange(realIndex, field)
                }
              />
            </View>
          );
        })}

        {expanded && (
          <>
            <View style={styles.gap12} />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addPeriod}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={16} color={M.accentPrimary} />
              <Text style={styles.addText}>{t('periodHistory.addAnother')}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.gap24} />

        {/* Cycle length: computed or manual */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>{t('manualInput.cycleLengthLabel')}</Text>
          {computedCycleLen ? (
            <View style={styles.computedRow}>
              <Feather name="zap" size={14} color={M.accentPrimary} />
              <Text style={styles.computedText}>
                {t('periodHistory.autoComputed', { days: computedCycleLen })}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.fieldHelper}>{t('manualInput.cycleLengthHelper')}</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => setManualCycleLen(Math.max(21, manualCycleLen - 1))}
                  style={styles.stepperButton}
                  accessibilityLabel="Decrease cycle length"
                >
                  <Feather name="minus" size={20} color={M.textPrimary} />
                </TouchableOpacity>
                <View style={styles.stepperValue}>
                  <Text style={styles.stepperNumber}>{manualCycleLen}</Text>
                  <Text style={styles.stepperUnit}>{t('manualInput.daysUnit')}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setManualCycleLen(Math.min(45, manualCycleLen + 1))}
                  style={styles.stepperButton}
                  accessibilityLabel="Increase cycle length"
                >
                  <Feather name="plus" size={20} color={M.textPrimary} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.gap16} />

        {/* Period length: computed or manual */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>{t('manualInput.periodLengthLabel')}</Text>
          {computedPeriodLen ? (
            <View style={styles.computedRow}>
              <Feather name="zap" size={14} color={M.accentPrimary} />
              <Text style={styles.computedText}>
                {t('periodHistory.autoComputed', { days: computedPeriodLen })}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.fieldHelper}>{t('manualInput.periodLengthHelper')}</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => setPeriodLength(Math.max(2, periodLength - 1))}
                  style={styles.stepperButton}
                  accessibilityLabel="Decrease period length"
                >
                  <Feather name="minus" size={20} color={M.textPrimary} />
                </TouchableOpacity>
                <View style={styles.stepperValue}>
                  <Text style={styles.stepperNumber}>{periodLength}</Text>
                  <Text style={styles.stepperUnit}>{t('manualInput.daysUnit')}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPeriodLength(Math.min(10, periodLength + 1))}
                  style={styles.stepperButton}
                  accessibilityLabel="Increase period length"
                >
                  <Feather name="plus" size={20} color={M.textPrimary} />
                </TouchableOpacity>
              </View>
            </>
          )}
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

// ── Period Row ──────────────────────────────────────────────────────────

interface PeriodRowProps {
  entry: PeriodEntry;
  index: number;
  locale: string;
  isFirst: boolean;
  activePicker: { index: number; field: 'startDate' | 'endDate' } | null;
  onShowPicker: (field: 'startDate' | 'endDate') => void;
  onDismissPicker: () => void;
  onDateChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onRemove: () => void;
  canRemove: boolean;
  maxDate: Date;
  minDate: Date;
  t: (key: string) => string;
  tCommon: (key: string) => string;
  isPickerActive: (index: number, field: 'startDate' | 'endDate') => boolean;
  handleDateChangeForField: (field: 'startDate' | 'endDate') => (event: DateTimePickerEvent, selectedDate?: Date) => void;
}

function PeriodRow({
  entry, index, locale, isFirst,
  onShowPicker, onDismissPicker,
  canRemove, onRemove, maxDate, minDate,
  t, tCommon, isPickerActive, handleDateChangeForField,
}: PeriodRowProps) {
  return (
    <View style={styles.fieldCard}>
      <View style={styles.rowHeader}>
        <Text style={styles.fieldLabel}>
          {isFirst ? t('periodHistory.mostRecent') : t('periodHistory.olderPeriod')}
        </Text>
        {canRemove && (
          <TouchableOpacity onPress={onRemove} hitSlop={8} accessibilityLabel="Remove period">
            <Feather name="x-circle" size={20} color={M.textHint} />
          </TouchableOpacity>
        )}
      </View>

      {/* Start date */}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => onShowPicker('startDate')}
        activeOpacity={0.7}
        accessibilityLabel={t('periodHistory.startDate')}
      >
        <Feather name="calendar" size={16} color={M.accentPrimary} />
        <Text style={styles.dateLabel}>{t('periodHistory.started')}</Text>
        <Text style={styles.dateText}>{formatDateDisplay(entry.startDate, locale)}</Text>
      </TouchableOpacity>

      {isPickerActive(index, 'startDate') && (
        <>
          <DateTimePicker
            value={new Date(entry.startDate + 'T12:00:00')}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maxDate}
            minimumDate={minDate}
            onChange={handleDateChangeForField('startDate')}
            themeVariant="dark"
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.doneDateButton} onPress={onDismissPicker}>
              <Text style={styles.doneDateText}>{tCommon('done')}</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* End date (optional) */}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => onShowPicker('endDate')}
        activeOpacity={0.7}
        accessibilityLabel={t('periodHistory.endDate')}
      >
        <Feather name="calendar" size={16} color={M.textHint} />
        <Text style={styles.dateLabel}>{t('periodHistory.ended')}</Text>
        <Text style={[styles.dateText, !entry.endDate && styles.datePlaceholder]}>
          {entry.endDate ? formatDateDisplay(entry.endDate, locale) : t('periodHistory.optional')}
        </Text>
      </TouchableOpacity>

      {isPickerActive(index, 'endDate') && (
        <>
          <DateTimePicker
            value={entry.endDate ? new Date(entry.endDate + 'T12:00:00') : new Date(entry.startDate + 'T12:00:00')}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maxDate}
            minimumDate={new Date(entry.startDate + 'T12:00:00')}
            onChange={handleDateChangeForField('endDate')}
            themeVariant="dark"
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.doneDateButton} onPress={onDismissPicker}>
              <Text style={styles.doneDateText}>{tCommon('done')}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M.background },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  headline: { fontSize: 28, fontWeight: '700', color: M.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: M.textSecondary, lineHeight: 22, marginTop: 8 },
  gap12: { height: 12 },
  gap16: { height: 16 },
  gap24: { height: 24 },
  gap32: { height: 32 },
  fieldCard: { backgroundColor: M.surface, borderRadius: 16, padding: 16, gap: 8 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 15, fontWeight: '600', color: M.textPrimary },
  fieldHelper: { fontSize: 13, color: M.textSecondary, lineHeight: 18 },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: M.inputBg, borderRadius: 12, padding: 12,
  },
  dateLabel: { fontSize: 13, fontWeight: '500', color: M.textSecondary, minWidth: 54 },
  dateText: { fontSize: 15, fontWeight: '600', color: M.textPrimary, flex: 1, textAlign: 'right' },
  datePlaceholder: { color: M.textHint, fontWeight: '400' },
  doneDateButton: {
    alignSelf: 'flex-end', backgroundColor: M.accentPrimary,
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16,
  },
  doneDateText: { fontSize: 14, fontWeight: '600', color: M.white },
  expandButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: M.accentPrimary + '14', borderRadius: 12,
    borderWidth: 1, borderColor: M.accentPrimary + '30',
  },
  expandText: { fontSize: 15, fontWeight: '600', color: M.accentPrimary },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderStyle: 'dashed', borderColor: M.accentPrimary + '50',
  },
  addText: { fontSize: 14, fontWeight: '600', color: M.accentPrimary },
  computedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: M.accentPrimary + '14', borderRadius: 10, padding: 10,
  },
  computedText: { fontSize: 14, fontWeight: '600', color: M.accentPrimary },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 8,
  },
  stepperButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: M.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: { alignItems: 'center', minWidth: 60 },
  stepperNumber: { fontSize: 32, fontWeight: '700', color: M.textPrimary },
  stepperUnit: { fontSize: 12, fontWeight: '500', color: M.textSecondary },
  primaryButton: {
    height: 56, backgroundColor: M.accentPrimary,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: M.white },
});
