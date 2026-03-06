import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { getCurrentPhase, buildCalendarMarkers } from '@/utils/cycleCalculator';
import { PHASE_INFO } from '@/constants/phases';
import type { CyclePhase } from '@/types';

export default function CalendarTab() {
  const { cycleSettings, role, isPartnerLinked } = useAppStore();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Unauthenticated / onboarding-incomplete users have no cycle yet
  if (!role) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Cycle Calendar</Text>
        </View>
        <View style={styles.sunEmptyCard}>
          <Text style={styles.sunEmptyBody}>Complete onboarding to view your cycle calendar.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Sun users don't have their own cycle — show partner info instead
  if (role === 'sun') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Cycle Calendar</Text>
          <Text style={styles.subtitle}>Your Moon's cycle at a glance</Text>
        </View>
        <View style={styles.sunEmptyCard}>
          <Feather name="moon" size={40} color={Colors.menstrual} />
          <Text style={styles.sunEmptyTitle}>
            {isPartnerLinked ? "Moon's cycle is synced" : 'Not linked yet'}
          </Text>
          <Text style={styles.sunEmptyBody}>
            {isPartnerLinked
              ? "Your Moon's predictions and phase calendar will appear here once she logs her cycle in Settings."
              : "Link with your Moon first. Ask her to generate a code in Settings and enter it on your Sun dashboard."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Guard against corrupted persisted state to avoid NaN/undefined crashes
  if (!cycleSettings.lastPeriodStartDate || cycleSettings.avgCycleLength < 1) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Cycle Calendar</Text>
        </View>
        <View style={styles.sunEmptyCard}>
          <Text style={styles.sunEmptyBody}>Please set your cycle settings in the Settings tab to view your calendar.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { lastPeriodStartDate, avgCycleLength, avgPeriodLength } = cycleSettings;

  // Compute today's phase for theme coloring
  const startNorm = new Date(lastPeriodStartDate);
  startNorm.setHours(0, 0, 0, 0);
  const todayNorm = new Date();
  todayNorm.setHours(0, 0, 0, 0);
  const todayDiff = Math.floor((todayNorm.getTime() - startNorm.getTime()) / (1000 * 60 * 60 * 24));
  const todayDayInCycle = todayDiff < 0 ? 1 : (todayDiff % avgCycleLength) + 1;
  const phase = getCurrentPhase(todayDayInCycle, avgCycleLength, avgPeriodLength);
  const phaseInfo = PHASE_INFO[phase];
  const markers = buildCalendarMarkers(lastPeriodStartDate, avgCycleLength, avgPeriodLength);

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

  // Highlight selected day (ring border via custom marking)
  if (selectedDay && selectedDay !== today) {
    markedDates[selectedDay] = {
      ...markedDates[selectedDay],
      selected: true,
      selectedColor: Colors.accent + '33',
      selectedTextColor: Colors.textPrimary,
    };
  }

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
        onDayPress={(day: { dateString: string }) => setSelectedDay(day.dateString)}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={Colors.menstrual} label="Period (predicted)" />
        <LegendItem color={Colors.follicular} label="Fertile window" />
        <LegendItem color={Colors.ovulatory} label="Ovulation day" />
        <LegendItem color={Colors.textPrimary} label="Today" />
      </View>

      <DayDetailSheet
        dateString={selectedDay}
        markers={markers}
        lastPeriodStartDate={lastPeriodStartDate}
        avgCycleLength={avgCycleLength}
        avgPeriodLength={avgPeriodLength}
        onClose={() => setSelectedDay(null)}
      />
    </SafeAreaView>
  );
}

interface DayDetailSheetProps {
  dateString: string | null;
  markers: Record<string, { type: 'period' | 'ovulation' | 'fertile' }>;
  lastPeriodStartDate: string;
  avgCycleLength: number;
  avgPeriodLength: number;
  onClose: () => void;
}

function computeDayInfo(
  dateString: string,
  lastPeriodStartDate: string,
  avgCycleLength: number,
  avgPeriodLength: number,
): { dayInCycle: number; phase: CyclePhase } {
  const start = new Date(lastPeriodStartDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const dayInCycle = diffDays < 0 ? 1 : ((diffDays % avgCycleLength) + avgCycleLength) % avgCycleLength + 1;
  const phase = getCurrentPhase(dayInCycle, avgCycleLength, avgPeriodLength);
  return { dayInCycle, phase };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function markerLabel(type: 'period' | 'ovulation' | 'fertile'): string {
  if (type === 'period') return 'Predicted period day';
  if (type === 'ovulation') return 'Ovulation day';
  return 'Fertile window';
}

function markerColor(type: 'period' | 'ovulation' | 'fertile'): string {
  if (type === 'period') return Colors.menstrual;
  if (type === 'ovulation') return Colors.ovulatory;
  return Colors.follicular;
}

function DayDetailSheet({ dateString, markers, lastPeriodStartDate, avgCycleLength, avgPeriodLength, onClose }: DayDetailSheetProps) {
  if (!dateString) return null;

  const { dayInCycle, phase } = computeDayInfo(dateString, lastPeriodStartDate, avgCycleLength, avgPeriodLength);
  const info = PHASE_INFO[phase];
  const marker = markers[dateString] ?? null;

  return (
    <Modal
      visible={!!dateString}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={sheetStyles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={sheetStyles.sheet}>
        {/* Handle */}
        <View style={sheetStyles.handle} />

        {/* Header row */}
        <View style={sheetStyles.headerRow}>
          <View>
            <Text style={sheetStyles.dateText}>{formatDate(dateString)}</Text>
            <Text style={sheetStyles.cycleDayText}>Cycle Day {dayInCycle}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sheetStyles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={20} color={Colors.textHint} />
          </TouchableOpacity>
        </View>

        {/* Phase badge */}
        <View style={[sheetStyles.phaseBadge, { backgroundColor: info.color + '22' }]}>
          <View style={[sheetStyles.phaseDot, { backgroundColor: info.color }]} />
          <Text style={[sheetStyles.phaseName, { color: info.color }]}>{info.name} Phase</Text>
          <Text style={sheetStyles.phaseTagline}>{info.tagline}</Text>
        </View>

        {/* Special marker label */}
        {marker && (
          <View style={[sheetStyles.markerBadge, { backgroundColor: markerColor(marker.type) + '18' }]}>
            <Feather name="info" size={13} color={markerColor(marker.type)} />
            <Text style={[sheetStyles.markerText, { color: markerColor(marker.type) }]}>
              {markerLabel(marker.type)}
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={sheetStyles.section}>
          <Text style={sheetStyles.sectionLabel}>What's happening</Text>
          <Text style={sheetStyles.sectionBody}>{info.moodDescription}</Text>
        </View>

        {/* Self-care tip */}
        <View style={sheetStyles.section}>
          <Text style={sheetStyles.sectionLabel}>Self-care tip</Text>
          <Text style={sheetStyles.sectionBody}>{info.selfCareTip}</Text>
        </View>
      </View>
    </Modal>
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
  sunEmptyCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  sunEmptyTitle: {
    ...Typography.headlineBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sunEmptyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textHint + '55',
    marginBottom: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateText: {
    ...Typography.headlineBold,
    color: Colors.textPrimary,
  },
  cycleDayText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  phaseName: {
    ...Typography.bodyBold,
  },
  phaseTagline: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'flex-start',
  },
  markerText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textHint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
});
