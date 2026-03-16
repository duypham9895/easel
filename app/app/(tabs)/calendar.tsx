import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography, CycleCalendarTokens } from '@/constants/theme';
import { getCurrentPhase, buildCalendarMarkers, enrichMarkersWithRangeInfo } from '@/utils/cycleCalculator';
import { PHASE_INFO } from '@/constants/phases';
import { CalendarDayCell } from '@/components/moon/CalendarDayCell';
import { MyCycleCard } from '@/components/moon/MyCycleCard';
import { PeriodLogPanel } from '@/components/moon/PeriodLogPanel';
import { PredictionWindowCard } from '@/components/moon/PredictionWindowCard';
import { SaveToast } from '@/components/shared/SaveToast';
import { PartnerCalendarView } from '@/components/sun/PartnerCalendarView';

export default function CalendarTab() {
  const cycleSettings = useAppStore(s => s.cycleSettings);
  const periodLogs = useAppStore(s => s.periodLogs);
  const periodDayLogs = useAppStore(s => s.periodDayLogs);
  const role = useAppStore(s => s.role);
  const isPartnerLinked = useAppStore(s => s.isPartnerLinked);
  const language = useAppStore(s => s.language);
  const partnerCycleSettings = useAppStore(s => s.partnerCycleSettings);
  const predictionWindow = useAppStore(s => s.predictionWindow);
  const loadPeriodDayLogs = useAppStore(s => s.loadPeriodDayLogs);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; variant: 'success' | 'error'; message: string }>({
    visible: false, variant: 'success', message: '',
  });
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

  // Guard against corrupted persisted state
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

  // Build markers with range info for custom day cells
  const baseMarkers = useMemo(
    () => buildCalendarMarkers(lastPeriodStartDate, avgCycleLength, avgPeriodLength, periodLogs),
    [lastPeriodStartDate, avgCycleLength, avgPeriodLength, periodLogs],
  );
  const markers = useMemo(
    () => enrichMarkersWithRangeInfo(baseMarkers),
    [baseMarkers],
  );

  const handleDayPress = useCallback((dateString: string) => {
    setSelectedDay(prev => prev === dateString ? null : dateString);
  }, []);

  const handleMonthChange = useCallback((month: { dateString: string }) => {
    const [year, m] = month.dateString.split('-').map(Number);
    const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(year, m, 0).getDate();
    const endDate = `${year}-${String(m).padStart(2, '0')}-${lastDay}`;
    loadPeriodDayLogs(startDate, endDate);
  }, [loadPeriodDayLogs]);

  const handleSave = useCallback(() => {
    setToast({ visible: true, variant: 'success', message: t('periodLoggedSuccess') });
    setSelectedDay(null);
  }, [t]);

  // Existing log for selected day
  const existingPeriodLog = selectedDay
    ? periodLogs.find(l => l.startDate === selectedDay) ?? null
    : null;
  const existingDayLog = selectedDay
    ? periodDayLogs[selectedDay] ?? null
    : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SaveToast
        visible={toast.visible}
        variant={toast.variant}
        message={toast.message}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />

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
            arrowColor: CycleCalendarTokens.periodLogged,
            monthTextColor: Colors.textPrimary,
            indicatorColor: CycleCalendarTokens.periodLogged,
            textDayFontWeight: '600',
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 14,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 13,
          }}
          dayComponent={(props: any) => (
            <CalendarDayCell
              date={props.date}
              state={props.state}
              marking={markers[props.date?.dateString ?? '']}
              isSelected={props.date?.dateString === selectedDay}
              flowIntensity={periodDayLogs[props.date?.dateString ?? '']?.flowIntensity ?? null}
              onPress={handleDayPress}
            />
          )}
          enableSwipeMonths
          onMonthChange={handleMonthChange}
          hideExtraDays={false}
        />

        {/* Legend */}
        <View style={styles.legend}>
          <LegendItem color={CycleCalendarTokens.periodLogged} label={t('periodLogged')} />
          <LegendItem color={CycleCalendarTokens.periodPredicted} label={t('periodPredicted')} />
          <LegendItem color={CycleCalendarTokens.fertileWindow} label={t('fertileWindow')} />
          <LegendItem color={CycleCalendarTokens.ovulationDay} label={t('ovulationDay')} />
          <LegendItem color={Colors.textPrimary} label={t('today')} />
        </View>

        {/* Inline Period Log Panel */}
        {selectedDay && (
          <PeriodLogPanel
            selectedDate={selectedDay}
            existingDayLog={existingDayLog}
            existingPeriodLog={existingPeriodLog}
            markers={markers}
            cycleSettings={cycleSettings}
            onSave={handleSave}
            onClose={() => setSelectedDay(null)}
          />
        )}

        {/* Tap hint when no day selected */}
        {!selectedDay && periodLogs.length === 0 && (
          <Text style={styles.tapHint}>{t('tapToLog')}</Text>
        )}

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
  tapHint: {
    ...Typography.body,
    color: Colors.textHint,
    textAlign: 'center',
    paddingVertical: Spacing.md,
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
