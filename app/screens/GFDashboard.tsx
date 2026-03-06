import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAppStore } from '@/store/appStore';
import { PhaseWheel } from '@/components/gf/PhaseWheel';
import { InsightCard } from '@/components/gf/InsightCard';
import { SOSSheet } from '@/components/gf/SOSSheet';
import { HeaderButton } from '@/components/shared/HeaderButton';
import { PHASE_INFO } from '@/constants/phases';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import {
  getCurrentDayInCycle,
  getCurrentPhase,
  getDaysUntilNextPeriod,
  getConceptionChance,
} from '@/utils/cycleCalculator';
import { useAIGreeting } from '@/hooks/useAIGreeting';
import { DailyCheckIn } from '@/components/gf/DailyCheckIn';

export function GFDashboard() {
  const { cycleSettings } = useAppStore();
  const [sosVisible, setSOSVisible] = useState(false);
  const sendSOS = useAppStore((s) => s.sendSOS);

  const dayInCycle = getCurrentDayInCycle(
    cycleSettings.lastPeriodStartDate,
    cycleSettings.avgCycleLength,
  );
  const phase = getCurrentPhase(dayInCycle, cycleSettings.avgCycleLength, cycleSettings.avgPeriodLength);
  const daysUntilPeriod = getDaysUntilNextPeriod(dayInCycle, cycleSettings.avgCycleLength);
  const phaseInfo = PHASE_INFO[phase];
  const conceptionChance = getConceptionChance(phase);

  const { greeting, isAI, isLoading: greetingLoading } = useAIGreeting(phase, dayInCycle);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Phase-colored ambient gradient header */}
      <LinearGradient
        colors={[phaseInfo.color + '28', 'transparent']}
        style={styles.headerGlow}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View style={styles.greetingBlock}>
            {greetingLoading ? (
              <ActivityIndicator size="small" color={phaseInfo.color} style={styles.greetingLoader} />
            ) : (
              <Text style={styles.headlineTitle}>{greeting}</Text>
            )}
            {isAI && !greetingLoading && (
              <Text style={styles.aiLabel}>✦ AI</Text>
            )}
          </View>
          <HeaderButton emoji="⚙️" onPress={() => router.navigate('/(tabs)/settings')} />
        </View>

        {/* Phase tagline chip */}
        <View style={[styles.taglineChip, { backgroundColor: phaseInfo.color + '18' }]}>
          <View style={[styles.taglineDot, { backgroundColor: phaseInfo.color }]} />
          <Text style={[styles.taglineText, { color: phaseInfo.color }]}>
            {phaseInfo.name} · {phaseInfo.tagline}
          </Text>
        </View>

        {/* Phase Wheel */}
        <PhaseWheel
          phase={phase}
          dayInCycle={dayInCycle}
          daysUntilPeriod={daysUntilPeriod}
          totalCycleDays={cycleSettings.avgCycleLength}
        />

        {/* SOS CTA Button */}
        <TouchableOpacity
          style={[styles.sosButton, { backgroundColor: phaseInfo.color }]}
          onPress={() => setSOSVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.sosButtonText}>Send a signal to him</Text>
          <Text style={styles.sosButtonEmoji}>💗</Text>
        </TouchableOpacity>

        {/* Insight row */}
        <View style={styles.insightRow}>
          <InsightCard
            emoji="✨"
            label="Conception Chance"
            value={conceptionChance}
            accent={phaseInfo.color}
          />
          <InsightCard
            emoji="💆"
            label="Self-Care Tip"
            value={phaseInfo.selfCareTip}
            accent={phaseInfo.color}
          />
        </View>

        {/* Phase description card */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>About this phase</Text>
          <Text style={styles.descriptionText}>{phaseInfo.moodDescription}</Text>
        </View>

        {/* Daily check-in + AI insight */}
        <DailyCheckIn phase={phase} dayInCycle={dayInCycle} accentColor={phaseInfo.color} />
      </ScrollView>

      <SOSSheet
        visible={sosVisible}
        onClose={() => setSOSVisible(false)}
        onSend={sendSOS}
      />
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
    height: 340,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.md,
  },
  greetingBlock: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 4,
  },
  greetingLoader: {
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  aiLabel: {
    ...Typography.tiny,
    color: Colors.textHint,
    letterSpacing: 1,
  },
  headlineTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  taglineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  taglineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  taglineText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.lg,
    height: 60,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  sosButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  sosButtonEmoji: {
    fontSize: 22,
  },
  insightRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  descriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  descriptionTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
});
