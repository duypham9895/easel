import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/store/appStore';
import { useSOSListener } from '@/hooks/useSOSListener';
import { useAIPartnerAdvice } from '@/hooks/useAIPartnerAdvice';
import { GuideCard } from '@/components/bf/GuideCard';
import { SOSAlert } from '@/components/bf/SOSAlert';
import { PHASE_INFO } from '@/constants/phases';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import {
  getCurrentDayInCycle,
  getCurrentPhase,
  getDaysUntilNextPeriod,
} from '@/utils/cycleCalculator';

export function BFDashboard() {
  const { cycleSettings, activeSOS } = useAppStore();

  // Subscribe to real-time SOS signals from GF (foreground/in-app case)
  useSOSListener();

  const dayInCycle = getCurrentDayInCycle(
    cycleSettings.lastPeriodStartDate,
    cycleSettings.avgCycleLength,
  );
  const phase = getCurrentPhase(dayInCycle, cycleSettings.avgCycleLength, cycleSettings.avgPeriodLength);
  const daysUntilPeriod = getDaysUntilNextPeriod(dayInCycle, cycleSettings.avgCycleLength);
  const phaseInfo = PHASE_INFO[phase];

  // AI-generated BF advice — replaces static partnerAdvice text
  const { advice, isAI: adviceIsAI, isLoading: adviceLoading } = useAIPartnerAdvice(phase, dayInCycle);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LinearGradient
        colors={[phaseInfo.color + '20', 'transparent']}
        style={styles.headerGlow}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Hey, partner 💙</Text>
            <Text style={styles.headlineTitle}>Be there for her</Text>
          </View>
        </View>

        {/* Active SOS alert */}
        {activeSOS && <SOSAlert sos={activeSOS} phase={phase} dayInCycle={dayInCycle} />}

        {/* Her Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View style={[styles.phaseOrb, { backgroundColor: phaseInfo.color }]}>
              <Text style={styles.phaseOrbDay}>{dayInCycle}</Text>
            </View>
            <View style={styles.statusText}>
              <Text style={[styles.phaseName, { color: phaseInfo.color }]}>
                {phaseInfo.name}
              </Text>
              <Text style={styles.phaseTagline}>{phaseInfo.tagline}</Text>
              <Text style={styles.cycleDay}>Day {dayInCycle} of her cycle</Text>
            </View>
          </View>

          <View style={[styles.countdownBadge, { backgroundColor: phaseInfo.color + '14' }]}>
            <Text style={[styles.countdownNumber, { color: phaseInfo.color }]}>
              {daysUntilPeriod}
            </Text>
            <Text style={[styles.countdownLabel, { color: phaseInfo.color }]}>
              days until{'\n'}next period
            </Text>
          </View>
        </View>

        {/* Guide section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Her Survival Guide</Text>
          <GuideCard
            emoji="🧠"
            title="Her mood right now"
            text={phaseInfo.moodDescription}
            accent={phaseInfo.color}
          />
          <GuideCard
            emoji="⭐️"
            title={adviceIsAI ? 'What you can do ✦ AI' : 'What you can do'}
            text={adviceLoading ? '…' : advice}
            accent={phaseInfo.color}
          />
        </View>

        {/* Phases overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The 4 Phases</Text>
          <View style={styles.phasesRow}>
            {(['menstrual', 'follicular', 'ovulatory', 'luteal'] as const).map((p) => {
              const info = PHASE_INFO[p];
              const isActive = p === phase;
              return (
                <View
                  key={p}
                  style={[
                    styles.phaseChip,
                    { backgroundColor: info.color + (isActive ? 'FF' : '22') },
                  ]}
                >
                  <Text style={[styles.phaseChipText, { color: isActive ? Colors.white : info.color }]}>
                    {info.name.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.lg,
  },
  topBar: {
    paddingTop: Spacing.md,
  },
  greeting: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  headlineTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  phaseOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  phaseOrbDay: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  statusText: {
    flex: 1,
    gap: 2,
  },
  phaseName: {
    ...Typography.bodyBold,
  },
  phaseTagline: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  cycleDay: {
    ...Typography.tiny,
    color: Colors.textHint,
    marginTop: 2,
  },
  countdownBadge: {
    alignItems: 'center',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    minWidth: 60,
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headlineBold,
    color: Colors.textPrimary,
  },
  phasesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  phaseChip: {
    flex: 1,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  phaseChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
