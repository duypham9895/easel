import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { impactMedium } from '@/utils/haptics';
import { MoonColors, Spacing, Radii, Typography, SharedColors, Colors } from '@/constants/theme';
import type { HealthInsightResult } from '@/hooks/useCycleHealthInsight';

const MOON = MoonColors;
const ACCENT = Colors.menstrual;
const DOCTOR_AMBER = '#F5A623';

interface Props {
  visible: boolean;
  result: HealthInsightResult | null;
  loading: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error?: string | null;
}

export function HealthInsightSheet({
  visible,
  result,
  loading,
  onClose,
  onRetry,
  error,
}: Props) {
  const { t } = useTranslation('health');
  const slideAnim = useRef(new Animated.Value(600)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Slide animation
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Loading pulse animation
  useEffect(() => {
    if (loading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulseAnim.setValue(1);
  }, [loading]);

  function handleClose() {
    impactMedium();
    onClose();
  }

  function mapIconName(icon: string): string {
    // Map common icon names to Feather equivalents
    const iconMap: Record<string, string> = {
      sleep: 'moon',
      rest: 'moon',
      exercise: 'activity',
      fitness: 'activity',
      stress: 'heart',
      relax: 'wind',
      food: 'coffee',
      diet: 'coffee',
      water: 'droplet',
      hydration: 'droplet',
      meditation: 'wind',
      yoga: 'activity',
    };
    return iconMap[icon.toLowerCase()] ?? icon;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable>
            {/* Handle */}
            <View style={styles.handle} />

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{t('insight.headline')}</Text>
              </View>

              {loading ? (
                /* ── Loading state ──────────────────────────────── */
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={MOON.accentPrimary} />
                  <Animated.View style={{ opacity: pulseAnim }}>
                    <Text style={styles.loadingTitle}>
                      {t('insight.loadingTitle')}
                    </Text>
                    <Text style={styles.loadingSubtitle}>
                      {t('insight.loadingSubtitle')}
                    </Text>
                  </Animated.View>

                  {/* Skeleton cards */}
                  {[1, 2, 3].map((i) => (
                    <Animated.View
                      key={i}
                      style={[styles.skeletonCard, { opacity: pulseAnim }]}
                    >
                      <View style={styles.skeletonIcon} />
                      <View style={styles.skeletonTextGroup}>
                        <View style={styles.skeletonTitle} />
                        <View style={styles.skeletonDesc} />
                      </View>
                    </Animated.View>
                  ))}
                </View>
              ) : error && !result ? (
                /* ── Error state (no fallback) ─────────────────── */
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={48} color={SharedColors.warning} />
                  <Text style={styles.errorTitle}>{t('insight.errorTitle')}</Text>
                  <Text style={styles.errorBody}>{t('insight.errorBody')}</Text>
                  {onRetry && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={onRetry}
                      activeOpacity={0.85}
                    >
                      <Feather name="refresh-cw" size={16} color={MOON.textPrimary} />
                      <Text style={styles.retryText}>{t('insight.retryButton')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : result ? (
                /* ── Result state ──────────────────────────────── */
                <>
                  {/* Explanation card */}
                  <View style={styles.explanationCard}>
                    <View style={styles.explanationHeader}>
                      <Feather name="info" size={18} color={MOON.accentPrimary} />
                      <Text style={styles.explanationHeaderText}>
                        {t('insight.explanationTitle')}
                      </Text>
                    </View>
                    <Text style={styles.explanationText}>
                      {result.explanation}
                    </Text>
                  </View>

                  {/* Suggestion cards */}
                  {result.suggestions.length > 0 && (
                    <View style={styles.suggestionsSection}>
                      <Text style={styles.sectionTitle}>
                        {t('insight.suggestionsTitle')}
                      </Text>
                      {result.suggestions.map((suggestion, index) => (
                        <View key={index} style={styles.suggestionCard}>
                          <View style={styles.suggestionIconBg}>
                            <Feather
                              name={mapIconName(suggestion.icon) as any}
                              size={24}
                              color={ACCENT}
                            />
                          </View>
                          <View style={styles.suggestionContent}>
                            <Text style={styles.suggestionTitle}>
                              {suggestion.title}
                            </Text>
                            <Text style={styles.suggestionDesc}>
                              {suggestion.description}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Doctor nudge (conditional) */}
                  {result.shouldSuggestDoctor && (
                    <View style={styles.doctorCard}>
                      <View style={styles.doctorHeader}>
                        <View style={styles.doctorIconBg}>
                          <Feather name="user-plus" size={20} color={DOCTOR_AMBER} />
                        </View>
                        <Text style={styles.doctorTitle}>
                          {t('insight.doctorNudgeTitle')}
                        </Text>
                      </View>
                      <Text style={styles.doctorBody}>
                        {result.doctorReason ?? t('insight.doctorNudgeBody')}
                      </Text>
                    </View>
                  )}

                  {/* Disclaimer */}
                  <Text style={styles.disclaimer}>
                    {t('insight.disclaimer')}
                  </Text>

                  {/* Done button */}
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleClose}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.doneText}>{t('insight.doneButton')}</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: MOON.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: MOON.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingBottom: 40,
    maxHeight: '90%',
    shadowColor: MOON.black,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: MOON.accentPrimary + '40',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: MOON.textPrimary,
    textAlign: 'center',
  },

  // Loading state
  loadingContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    minHeight: 300,
  },
  loadingTitle: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  loadingSubtitle: {
    ...Typography.body,
    color: MOON.textSecondary,
    textAlign: 'center',
  },
  skeletonCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: MOON.card,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MOON.inputBg,
  },
  skeletonTextGroup: {
    flex: 1,
    gap: Spacing.xs,
  },
  skeletonTitle: {
    width: '60%',
    height: 14,
    borderRadius: 7,
    backgroundColor: MOON.inputBg,
  },
  skeletonDesc: {
    width: '90%',
    height: 10,
    borderRadius: 5,
    backgroundColor: MOON.inputBg,
  },

  // Error state
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
    textAlign: 'center',
  },
  errorBody: {
    ...Typography.body,
    color: MOON.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: MOON.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: MOON.border,
    marginTop: Spacing.sm,
  },
  retryText: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
  },

  // Result state
  explanationCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: MOON.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: MOON.border,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  explanationHeaderText: {
    ...Typography.bodyBold,
    color: MOON.accentPrimary,
  },
  explanationText: {
    ...Typography.body,
    color: MOON.textPrimary,
    lineHeight: 24,
  },

  suggestionsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
    marginBottom: Spacing.xs,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: MOON.card,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: MOON.border,
  },
  suggestionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  suggestionTitle: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
  },
  suggestionDesc: {
    ...Typography.body,
    color: MOON.textSecondary,
    lineHeight: 22,
  },

  // Doctor nudge
  doctorCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: DOCTOR_AMBER + '10',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: DOCTOR_AMBER + '30',
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  doctorIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DOCTOR_AMBER + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorTitle: {
    ...Typography.bodyBold,
    color: DOCTOR_AMBER,
    flex: 1,
  },
  doctorBody: {
    ...Typography.body,
    color: MOON.textSecondary,
    lineHeight: 22,
  },

  // Disclaimer
  disclaimer: {
    ...Typography.caption,
    color: MOON.textHint,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },

  // Done button
  doneButton: {
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: ACCENT,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  doneText: {
    ...Typography.bodyBold,
    color: '#FFFFFF',
  },
});
