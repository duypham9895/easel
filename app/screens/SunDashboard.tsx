import { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/store/appStore';
import { GuideCard } from '@/components/bf/GuideCard';
import { WhisperAlert } from '@/components/sun/WhisperAlert';
import { UnlinkedScreen } from '@/components/sun/UnlinkedScreen';
import { PHASE_INFO } from '@/constants/phases';
import { Colors, SunColors, Spacing, Radii, Typography } from '@/constants/theme';
import {
  getCurrentDayInCycle,
  getCurrentPhase,
  getDaysUntilNextPeriod,
} from '@/utils/cycleCalculator';
import { useAIPartnerAdvice } from '@/hooks/useAIPartnerAdvice';
import { useSOSListener } from '@/hooks/useSOSListener';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';

const SUN = SunColors;

const PHASE_KEYS = ['menstrual', 'follicular', 'ovulatory', 'luteal'] as const;

export function SunDashboard() {
  const { t } = useTranslation('dashboard');
  const { t: tPhases } = useTranslation('phases');
  const { t: tCommon } = useTranslation('common');
  const isPartnerLinked = useAppStore(s => s.isPartnerLinked);
  const linkToPartner = useAppStore(s => s.linkToPartner);
  const displayName = useAppStore(s => s.displayName);
  // Use girlfriend's real cycle data when linked; fall back to defaults only if unavailable
  const partnerCycleSettings = useAppStore((s) => s.partnerCycleSettings);
  const cycleSettings = useAppStore((s) => s.cycleSettings);
  const activeCycle = partnerCycleSettings ?? cycleSettings;
  const activeWhisper = useAppStore((s) => s.activeWhisper);

  useSOSListener();

  const dayInCycle = getCurrentDayInCycle(
    activeCycle.lastPeriodStartDate,
    activeCycle.avgCycleLength,
  );
  const phase = getCurrentPhase(
    dayInCycle,
    activeCycle.avgCycleLength,
    activeCycle.avgPeriodLength,
  );
  const daysUntilPeriod = getDaysUntilNextPeriod(
    dayInCycle,
    activeCycle.avgCycleLength,
  );
  const phaseInfo = PHASE_INFO[phase];

  const {
    advice,
    isAI: adviceIsAI,
    isLoading: adviceLoading,
  } = useAIPartnerAdvice(phase, dayInCycle);

  const shareInvite = useCallback(() => {
    Share.share({
      message: i18n.t('dashboard:inviteShareMessage'),
    });
  }, []);

  if (!isPartnerLinked) {
    return (
      <UnlinkedScreen
        onLink={linkToPartner}
        onInvite={shareInvite}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Ambient phase-colored gradient header */}
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
          <Text style={styles.greeting}>{t('heySun', { name: displayName ?? tCommon('sun') })}</Text>
          <Text style={styles.headlineTitle}>{t('beThereForMoon')}</Text>
        </View>

        {/* Moon Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            {/* Phase orb */}
            <View
              style={[styles.phaseOrb, { backgroundColor: phaseInfo.color }]}
            >
              <Text style={styles.phaseOrbDay}>{dayInCycle}</Text>
            </View>
            {/* Text group */}
            <View style={styles.statusText}>
              <Text style={[styles.phaseName, { color: phaseInfo.color }]}>
                {tPhases(`${phase}_name`)}
              </Text>
              <Text style={styles.phaseTagline}>{tPhases(`${phase}_tagline`)}</Text>
              <Text style={styles.cycleDay}>
                {tCommon('dayOfCycle', { day: dayInCycle })}
              </Text>
            </View>
          </View>

          {/* Countdown badge */}
          <View
            style={[
              styles.countdownBadge,
              { backgroundColor: phaseInfo.color + '14' },
            ]}
          >
            <Text
              style={[styles.countdownNumber, { color: phaseInfo.color }]}
            >
              {daysUntilPeriod}
            </Text>
            <Text
              style={[styles.countdownLabel, { color: phaseInfo.color }]}
            >
              {tCommon('daysUntilPeriod')}
            </Text>
          </View>
        </View>

        {/* Active Whisper alert */}
        {activeWhisper && (
          <WhisperAlert
            whisper={activeWhisper}
            phase={phase}
            dayInCycle={dayInCycle}
          />
        )}

        {/* Guide section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('todaysGuide')}</Text>
          <GuideCard
            icon="activity"
            title={t('moonMoodNow')}
            text={tPhases(`${phase}_mood`)}
            accent={phaseInfo.color}
          />
          <GuideCard
            icon="star"
            title={adviceIsAI ? t('howToShowUpAI') : t('howToShowUp')}
            text={adviceLoading ? '…' : advice}
            accent={phaseInfo.color}
          />
        </View>

        {/* Phases overview row */}
        <View style={styles.phasesRow}>
          {PHASE_KEYS.map((p) => {
            const info = PHASE_INFO[p];
            const isActive = p === phase;
            return (
              <View
                key={p}
                style={[
                  styles.phaseChip,
                  {
                    backgroundColor: isActive
                      ? info.color
                      : info.color + '22',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.phaseChipText,
                    { color: isActive ? Colors.white : info.color },
                  ]}
                >
                  {tPhases(`${p}_name`)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SUN.background,
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
    color: SUN.textSecondary,
  },
  headlineTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: SUN.textPrimary,
    letterSpacing: -0.5,
  },
  statusCard: {
    backgroundColor: SUN.card,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
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
    shadowColor: '#000000',
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
    color: SUN.textSecondary,
  },
  cycleDay: {
    ...Typography.tiny,
    color: SUN.textHint,
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
    color: SUN.textPrimary,
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
