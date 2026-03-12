import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Radii, Typography, CalendarTokens } from '@/constants/theme';
import { buildCalendarMarkers, getCurrentPhase } from '@/utils/cycleCalculator';
import { PHASE_INFO } from '@/constants/phases';
import type { CycleSettings, PredictionWindow } from '@/types';

interface Props {
  partnerCycleSettings: CycleSettings;
  predictionWindow: PredictionWindow | null;
  language: string;
}

function formatDateRange(startDate: string, endDate: string, language: string): string {
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  const startStr = start.toLocaleDateString(locale, { month: 'long', day: 'numeric' });

  if (start.getMonth() === end.getMonth()) {
    const endStr = end.toLocaleDateString(locale, { day: 'numeric' });
    return `${startStr}\u2013${endStr}`;
  }
  const endFull = end.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
  return `${startStr} \u2013 ${endFull}`;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: Colors.luteal,
  medium: Colors.ovulatory,
  low: Colors.menstrual,
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function PartnerCalendarView({ partnerCycleSettings, predictionWindow, language }: Props) {
  const { t } = useTranslation('calendar');
  const { lastPeriodStartDate, avgCycleLength, avgPeriodLength } = partnerCycleSettings;

  // Compute phase for theming
  const startNorm = new Date(lastPeriodStartDate);
  startNorm.setHours(0, 0, 0, 0);
  const todayNorm = new Date();
  todayNorm.setHours(0, 0, 0, 0);
  const todayDiff = Math.floor((todayNorm.getTime() - startNorm.getTime()) / (1000 * 60 * 60 * 24));
  const todayDayInCycle = todayDiff < 0 ? 1 : (todayDiff % avgCycleLength) + 1;
  const phase = getCurrentPhase(todayDayInCycle, avgCycleLength, avgPeriodLength);
  const phaseInfo = PHASE_INFO[phase];

  // Build markers (read-only, no period logs for Sun)
  const markers = buildCalendarMarkers(lastPeriodStartDate, avgCycleLength, avgPeriodLength, []);

  const markedDates: Record<string, object> = {};
  const today = new Date().toISOString().split('T')[0];

  for (const [date, data] of Object.entries(markers)) {
    let color: string = Colors.menstrual;
    if (data.type === 'ovulation') color = Colors.ovulatory;
    if (data.type === 'fertile') color = Colors.follicular;

    const opacity = data.source === 'logged'
      ? CalendarTokens.loggedPeriodOpacity
      : CalendarTokens.predictedPeriodOpacity;
    const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0').toUpperCase();
    const selectedColor = data.source === 'logged'
      ? color + 'CC'
      : color + alphaHex;

    markedDates[date] = {
      marked: true,
      dotColor: color,
      selected: data.type === 'period' || data.type === 'ovulation' || data.type === 'fertile',
      selectedColor,
      selectedTextColor: Colors.white,
    };
  }

  markedDates[today] = {
    ...markedDates[today],
    today: true,
    selected: true,
    selectedColor: Colors.textPrimary,
    selectedTextColor: Colors.white,
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{t('partnerCalendar')}</Text>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: Colors.background,
          calendarBackground: Colors.card,
          textSectionTitleColor: Colors.textHint,
          selectedDayBackgroundColor: phaseInfo.color,
          selectedDayTextColor: Colors.white,
          todayTextColor: phaseInfo.color,
          dayTextColor: Colors.textPrimary,
          textDisabledColor: Colors.textHint,
          dotColor: Colors.menstrual,
          selectedDotColor: Colors.white,
          arrowColor: Colors.menstrual,
          monthTextColor: Colors.textPrimary,
          indicatorColor: Colors.menstrual,
          textDayFontWeight: '600',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 14,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 13,
        }}
        markedDates={markedDates}
        markingType="dot"
        enableSwipeMonths
      />

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={Colors.menstrual} label={t('periodPredicted')} opacity={CalendarTokens.predictedPeriodOpacity} />
        <LegendItem color={Colors.follicular} label={t('fertileWindow')} />
        <LegendItem color={Colors.ovulatory} label={t('ovulationDay')} />
        <LegendItem color={Colors.textPrimary} label={t('today')} />
      </View>

      {/* Prediction window card */}
      {predictionWindow && (
        <View style={styles.predictionCard}>
          <View style={styles.predictionRow}>
            <Feather name="calendar" size={18} color={Colors.menstrual} />
            <View style={styles.predictionTextCol}>
              <Text style={styles.predictionLabel}>{t('predictionWindow')}</Text>
              <Text style={styles.predictionRange}>
                {t('periodExpected', { range: formatDateRange(predictionWindow.startDate, predictionWindow.endDate, language) })}
              </Text>
            </View>
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: (CONFIDENCE_COLORS[predictionWindow.confidenceLabel] ?? Colors.textHint) + '22' },
            ]}>
              <Text style={[
                styles.confidenceText,
                { color: CONFIDENCE_COLORS[predictionWindow.confidenceLabel] ?? Colors.textHint },
              ]}>
                {t(`confidence${capitalize(predictionWindow.confidenceLabel)}`)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function LegendItem({ color, label, opacity }: { color: string; label: string; opacity?: number }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color, opacity: opacity ?? 1.0 }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.md,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  calendar: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  legend: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // Prediction card
  predictionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  predictionTextCol: {
    flex: 1,
    gap: 2,
  },
  predictionLabel: {
    ...Typography.caption,
    color: Colors.textHint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  predictionRange: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  confidenceBadge: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  confidenceText: {
    ...Typography.tiny,
    fontWeight: '700',
  },
});
