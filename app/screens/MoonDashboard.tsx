import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/store/appStore';
import { PhaseWheel } from '@/components/gf/PhaseWheel';
import { InsightCard } from '@/components/gf/InsightCard';
import { DailyCheckIn } from '@/components/gf/DailyCheckIn';
import { PHASE_INFO } from '@/constants/phases';
import { MoonColors, Spacing, Radii, Typography } from '@/constants/theme';
import {
  getCurrentDayInCycle,
  getCurrentPhase,
  getDaysUntilNextPeriod,
  getConceptionChance,
} from '@/utils/cycleCalculator';
import { useAIGreeting } from '@/hooks/useAIGreeting';
import { WhisperSheet } from '@/components/moon/WhisperSheet';
import { useCoupleLinkedListener } from '@/hooks/useCoupleLinkedListener';
import { useTranslation } from 'react-i18next';

const MOON = MoonColors;

export function MoonDashboard() {
  const { t } = useTranslation('dashboard');
  const { t: tPhases } = useTranslation('phases');
  const cycleSettings = useAppStore(s => s.cycleSettings);
  const sendWhisper = useAppStore(s => s.sendWhisper ?? s.sendSOS);
  const isPartnerLinked = useAppStore(s => s.isPartnerLinked);
  const [whisperVisible, setWhisperVisible] = useState(false);
  const openWhisper = useCallback(() => setWhisperVisible(true), []);
  const closeWhisper = useCallback(() => setWhisperVisible(false), []);
  const navigateSettings = useCallback(() => router.navigate('/(tabs)/settings'), []);
  const navigateSettingsFromBanner = useCallback(() => router.navigate('/(tabs)/settings'), []);

  // Real-time: update GF's store the moment BF links
  useCoupleLinkedListener();

  const dayInCycle = getCurrentDayInCycle(
    cycleSettings.lastPeriodStartDate,
    cycleSettings.avgCycleLength,
  );
  const phase = getCurrentPhase(
    dayInCycle,
    cycleSettings.avgCycleLength,
    cycleSettings.avgPeriodLength,
  );
  const daysUntilPeriod = getDaysUntilNextPeriod(
    dayInCycle,
    cycleSettings.avgCycleLength,
  );
  const phaseInfo = PHASE_INFO[phase];
  const conceptionChance = getConceptionChance(phase);

  const { greeting, isAI, isLoading: greetingLoading } = useAIGreeting(
    phase,
    dayInCycle,
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Ambient phase-colored gradient header */}
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
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.greetingBlock}>
            {greetingLoading ? (
              <ActivityIndicator
                size="small"
                color={phaseInfo.color}
                style={styles.greetingLoader}
              />
            ) : (
              <Text style={styles.headlineTitle}>{greeting}</Text>
            )}
            {isAI && !greetingLoading && (
              <Text style={styles.aiLabel}>✦ AI</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={navigateSettings}
            activeOpacity={0.75}
          >
            <Feather name="settings" size={20} color={MOON.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Phase tagline chip */}
        <View
          style={[styles.taglineChip, { backgroundColor: phaseInfo.color + '18' }]}
        >
          <View
            style={[styles.taglineDot, { backgroundColor: phaseInfo.color }]}
          />
          <Text style={[styles.taglineText, { color: phaseInfo.color }]}>
            {tPhases(`${phase}_name`)} · {tPhases(`${phase}_tagline`)}
          </Text>
        </View>

        {/* Invite Sun banner — shown when partner not yet linked */}
        {!isPartnerLinked && (
          <TouchableOpacity
            style={styles.inviteBanner}
            onPress={navigateSettingsFromBanner}
            activeOpacity={0.85}
          >
            <Feather name="link-2" size={16} color={MOON.accentPrimary} />
            <Text style={styles.inviteBannerText}>
              {t('shareCodeBanner')}
            </Text>
            <Feather name="chevron-right" size={14} color={MOON.textHint} />
          </TouchableOpacity>
        )}

        {/* Phase Wheel */}
        <PhaseWheel
          phase={phase}
          dayInCycle={dayInCycle}
          daysUntilPeriod={daysUntilPeriod}
          totalCycleDays={cycleSettings.avgCycleLength}
        />

        {/* Whisper CTA button */}
        <TouchableOpacity
          style={[styles.whisperButton, { backgroundColor: phaseInfo.color }]}
          onPress={openWhisper}
          activeOpacity={0.85}
        >
          <Text style={styles.whisperButtonText}>{t('whisperToSun')}</Text>
          <Feather name="send" size={20} color="white" />
        </TouchableOpacity>

        {/* Insight row */}
        <View style={styles.insightRow}>
          <InsightCard
            icon="sun"
            label={t('conceptionChance')}
            value={conceptionChance}
            accent={phaseInfo.color}
          />
          <InsightCard
            icon="heart"
            label={t('selfCare')}
            value={tPhases(`${phase}_selfCare`)}
            accent={phaseInfo.color}
          />
        </View>

        {/* Phase description card */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>{t('aboutPhase')}</Text>
          <Text style={styles.descriptionText}>{tPhases(`${phase}_mood`)}</Text>
        </View>

        {/* Daily check-in */}
        <DailyCheckIn
          phase={phase}
          dayInCycle={dayInCycle}
          accentColor={phaseInfo.color}
        />
      </ScrollView>

      {/* Whisper bottom sheet */}
      <WhisperSheet
        visible={whisperVisible}
        onClose={closeWhisper}
        onSend={sendWhisper}
        phase={phase}
        dayInCycle={dayInCycle}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MOON.background,
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
    paddingHorizontal: 24,
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
  headlineTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: MOON.textPrimary,
    letterSpacing: -0.5,
  },
  aiLabel: {
    ...Typography.tiny,
    color: MOON.textHint,
    letterSpacing: 1,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: MOON.card,
    alignItems: 'center',
    justifyContent: 'center',
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
  whisperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 28,
    paddingHorizontal: Spacing.lg,
    height: 60,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  whisperButtonText: {
    ...Typography.bodyBold,
    color: MOON.white,
  },
  insightRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  descriptionCard: {
    backgroundColor: MOON.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  descriptionTitle: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
  },
  descriptionText: {
    ...Typography.body,
    color: MOON.textSecondary,
    lineHeight: 24,
  },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: MOON.card,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: MOON.accentPrimary + '30',
  },
  inviteBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: MOON.accentPrimary,
  },
});
