import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import i18n from '@/i18n/config';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography, CalendarTokens } from '@/constants/theme';
import { getCurrentPhase, buildCalendarMarkers } from '@/utils/cycleCalculator';
import { PHASE_INFO } from '@/constants/phases';
import { MyCycleCard } from '@/components/moon/MyCycleCard';
import { PeriodLogSheet } from '@/components/moon/PeriodLogSheet';
import { PredictionWindowCard } from '@/components/moon/PredictionWindowCard';
import { PartnerCalendarView } from '@/components/sun/PartnerCalendarView';
import type { CyclePhase, CalendarMarker } from '@/types';

export default function CalendarTab() {
  const cycleSettings = useAppStore(s => s.cycleSettings);
  const periodLogs = useAppStore(s => s.periodLogs);
  const role = useAppStore(s => s.role);
  const isPartnerLinked = useAppStore(s => s.isPartnerLinked);
  const language = useAppStore(s => s.language);
  const partnerCycleSettings = useAppStore(s => s.partnerCycleSettings);
  const predictionWindow = useAppStore(s => s.predictionWindow);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showPeriodLogSheet, setShowPeriodLogSheet] = useState(false);
  const { t } = useTranslation('calendar');
  const router = useRouter();

  // Unauthenticated / onboarding-incomplete users have no cycle yet
  if (!role) {
    return (
      <SafeAreaView style={[styles.root, styles.rootPadded]} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('title')}</Text>
        </View>
        <View style={styles.sunEmptyCard}>
          <Text style={styles.sunEmptyBody}>{t('completeOnboarding')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Sun users don't have their own cycle — show partner info instead
  if (role === 'sun') {
    // Partner linked and has cycle data — show read-only calendar
    if (isPartnerLinked && partnerCycleSettings && partnerCycleSettings.lastPeriodStartDate) {
      return (
        <SafeAreaView style={styles.root} edges={['top']}>
          <PartnerCalendarView
            partnerCycleSettings={partnerCycleSettings}
            predictionWindow={predictionWindow}
            language={language}
          />
        </SafeAreaView>
      );
    }

    // Partner linked but calendar sharing disabled or no data
    if (isPartnerLinked && !partnerCycleSettings) {
      return (
        <SafeAreaView style={[styles.root, styles.rootPadded]} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('title')}</Text>
            <Text style={styles.subtitle}>{t('moonCycleAtGlance')}</Text>
          </View>
          <View style={styles.sunEmptyCard}>
            <Feather name="lock" size={40} color={Colors.textHint} />
            <Text style={styles.sunEmptyTitle}>{t('moonCycleSynced')}</Text>
            <Text style={styles.sunEmptyBody}>{t('calendarPrivate')}</Text>
          </View>
        </SafeAreaView>
      );
    }

    // Not linked
    return (
      <SafeAreaView style={[styles.root, styles.rootPadded]} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('title')}</Text>
          <Text style={styles.subtitle}>{t('moonCycleAtGlance')}</Text>
        </View>
        <View style={styles.sunEmptyCard}>
          <Feather name="moon" size={40} color={Colors.menstrual} />
          <Text style={styles.sunEmptyTitle}>{t('notLinked')}</Text>
          <Text style={styles.sunEmptyBody}>{t('linkFirst')}</Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Feather name="link-2" size={16} color={Colors.white} />
            <Text style={styles.connectButtonText}>{t('connectNow')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Guard against corrupted persisted state to avoid NaN/undefined crashes
  if (!cycleSettings.lastPeriodStartDate || cycleSettings.avgCycleLength < 1) {
    return (
      <SafeAreaView style={[styles.root, styles.rootPadded]} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('title')}</Text>
        </View>
        <View style={styles.sunEmptyCard}>
          <Text style={styles.sunEmptyBody}>{t('setCycleSettings')}</Text>
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
  const markers = buildCalendarMarkers(lastPeriodStartDate, avgCycleLength, avgPeriodLength, periodLogs);

  // Build react-native-calendars markedDates format
  const markedDates: Record<string, object> = {};
  const today = new Date().toISOString().split('T')[0];

  for (const [date, data] of Object.entries(markers)) {
    let color: string = Colors.menstrual;
    if (data.type === 'ovulation') color = Colors.ovulatory;
    if (data.type === 'fertile') color = Colors.follicular;

    // Apply opacity based on whether data is logged (solid) or predicted (translucent)
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('title')}</Text>
          <Text style={styles.subtitle}>{t('subtitle')}</Text>
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
          <LegendItem color={Colors.menstrual} label={t('periodLogged')} />
          <LegendItem color={Colors.menstrual} label={t('periodPredicted')} opacity={CalendarTokens.predictedPeriodOpacity} />
          <LegendItem color={Colors.follicular} label={t('fertileWindow')} />
          <LegendItem color={Colors.ovulatory} label={t('ovulationDay')} />
          <LegendItem color={Colors.textPrimary} label={t('today')} />
        </View>

        {/* Prediction Window — Moon only */}
        {predictionWindow && (
          <PredictionWindowCard prediction={predictionWindow} language={language} />
        )}

        {/* My Cycle Card — Moon only */}
        <MyCycleCard
          cycleSettings={cycleSettings}
          periodLogs={periodLogs}
          language={language}
          onLogPeriod={() => router.push('/health-sync')}
          onEditSettings={() => router.push('/health-sync')}
          onViewAllPeriods={() => router.push('/health-sync')}
        />
      </ScrollView>

      {/* Read-only detail sheet (phase info) */}
      <DayDetailSheet
        dateString={selectedDay && !showPeriodLogSheet ? selectedDay : null}
        markers={markers}
        lastPeriodStartDate={lastPeriodStartDate}
        avgCycleLength={avgCycleLength}
        avgPeriodLength={avgPeriodLength}
        onClose={() => setSelectedDay(null)}
        onEditDay={() => setShowPeriodLogSheet(true)}
      />

      {/* Period log editing sheet — Moon only */}
      {selectedDay && (
        <PeriodLogSheet
          visible={showPeriodLogSheet}
          selectedDate={selectedDay}
          existingLog={periodLogs.find(l => l.startDate === selectedDay)}
          markers={markers}
          onClose={() => setShowPeriodLogSheet(false)}
          onSave={() => {
            setShowPeriodLogSheet(false);
            setSelectedDay(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

interface DayDetailSheetProps {
  dateString: string | null;
  markers: Record<string, CalendarMarker>;
  lastPeriodStartDate: string;
  avgCycleLength: number;
  avgPeriodLength: number;
  onClose: () => void;
  onEditDay?: () => void;
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

function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const loc = locale === 'vi' ? 'vi-VN' : 'en-US';
  return date.toLocaleDateString(loc, { weekday: 'long', month: 'long', day: 'numeric' });
}

function markerLabel(marker: CalendarMarker): string {
  if (marker.type === 'period') {
    return marker.source === 'logged'
      ? i18n.t('calendar:periodLogged')
      : i18n.t('calendar:predictedPeriodDay');
  }
  if (marker.type === 'ovulation') return i18n.t('calendar:ovulationDay');
  return i18n.t('calendar:fertileWindow');
}

function markerColor(type: 'period' | 'ovulation' | 'fertile'): string {
  if (type === 'period') return Colors.menstrual;
  if (type === 'ovulation') return Colors.ovulatory;
  return Colors.follicular;
}

function DayDetailSheet({ dateString, markers, lastPeriodStartDate, avgCycleLength, avgPeriodLength, onClose, onEditDay }: DayDetailSheetProps) {
  const { t: tCal } = useTranslation('calendar');
  const { t: tPhases } = useTranslation('phases');

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
            <Text style={sheetStyles.dateText}>{formatDate(dateString, i18n.language)}</Text>
            <Text style={sheetStyles.cycleDayText}>{tCal('cycleDay', { day: dayInCycle })}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sheetStyles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={20} color={Colors.textHint} />
          </TouchableOpacity>
        </View>

        {/* Phase badge */}
        <View style={[sheetStyles.phaseBadge, { backgroundColor: info.color + '22' }]}>
          <View style={[sheetStyles.phaseDot, { backgroundColor: info.color }]} />
          <Text style={[sheetStyles.phaseName, { color: info.color }]}>{tCal('phaseLabel', { name: tPhases(`${phase}_name`) })}</Text>
          <Text style={sheetStyles.phaseTagline}>{tPhases(`${phase}_tagline`)}</Text>
        </View>

        {/* Special marker label */}
        {marker && (
          <View style={[sheetStyles.markerBadge, { backgroundColor: markerColor(marker.type) + '18' }]}>
            <Feather name="info" size={13} color={markerColor(marker.type)} />
            <Text style={[sheetStyles.markerText, { color: markerColor(marker.type) }]}>
              {markerLabel(marker)}
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={sheetStyles.section}>
          <Text style={sheetStyles.sectionLabel}>{tCal('whatsHappening')}</Text>
          <Text style={sheetStyles.sectionBody}>{tPhases(`${phase}_mood`)}</Text>
        </View>

        {/* Self-care tip */}
        <View style={sheetStyles.section}>
          <Text style={sheetStyles.sectionLabel}>{tCal('selfCareTip')}</Text>
          <Text style={sheetStyles.sectionBody}>{tPhases(`${phase}_selfCare`)}</Text>
        </View>

        {/* Edit button — opens PeriodLogSheet */}
        {onEditDay && (
          <TouchableOpacity
            style={sheetStyles.editButton}
            onPress={onEditDay}
            activeOpacity={0.85}
          >
            <Feather name="edit-2" size={16} color={Colors.menstrual} />
            <Text style={sheetStyles.editButtonText}>{tCal('logPeriodStart')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
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
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  rootPadded: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
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
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.menstrual,
    borderRadius: Radii.full,
    height: 48,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  connectButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.menstrual + '18',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  editButtonText: {
    ...Typography.bodyBold,
    color: Colors.menstrual,
  },
});
