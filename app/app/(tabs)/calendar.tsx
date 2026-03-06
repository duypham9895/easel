import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { getCurrentDayInCycle, getCurrentPhase, buildCalendarMarkers } from '@/utils/cycleCalculator';
import { PHASE_INFO } from '@/constants/phases';

export default function CalendarTab() {
  const { cycleSettings } = useAppStore();

  const dayInCycle = getCurrentDayInCycle(
    cycleSettings.lastPeriodStartDate,
    cycleSettings.avgCycleLength,
  );
  const phase = getCurrentPhase(dayInCycle, cycleSettings.avgCycleLength, cycleSettings.avgPeriodLength);
  const phaseInfo = PHASE_INFO[phase];
  const markers = buildCalendarMarkers(
    cycleSettings.lastPeriodStartDate,
    cycleSettings.avgCycleLength,
    cycleSettings.avgPeriodLength,
  );

  // Build react-native-calendars markedDates format
  const markedDates: Record<string, object> = {};
  const today = new Date().toISOString().split('T')[0];

  for (const [date, data] of Object.entries(markers)) {
    let color: string = Colors.menstrual;
    if (data.type === 'ovulation') color = Colors.ovulatory;
    if (data.type === 'fertile') color = Colors.follicular;

    markedDates[date] = {
      marked: true,
      dotColor: color,
      selected: data.type === 'period' || data.type === 'ovulation',
      selectedColor: color + 'CC',
      selectedTextColor: Colors.white,
    };
  }

  // Highlight today
  markedDates[today] = {
    ...markedDates[today],
    today: true,
    selected: true,
    selectedColor: Colors.textPrimary,
    selectedTextColor: Colors.white,
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Cycle Calendar</Text>
        <Text style={styles.subtitle}>Predictions for the next 3 cycles</Text>
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
        <LegendItem color={Colors.menstrual} label="Period (predicted)" />
        <LegendItem color={Colors.follicular} label="Fertile window" />
        <LegendItem color={Colors.ovulatory} label="Ovulation day" />
        <LegendItem color={Colors.textPrimary} label="Today" />
      </View>
    </SafeAreaView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
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
});
