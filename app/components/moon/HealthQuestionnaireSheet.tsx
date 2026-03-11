import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { impactMedium } from '@/utils/haptics';
import { MoonColors, Spacing, Radii, Typography, Colors } from '@/constants/theme';
import type { UserHealthContext } from '@/hooks/useCycleHealthInsight';

const MOON = MoonColors;
const ACCENT = Colors.menstrual;

interface Props {
  visible: boolean;
  onComplete: (context: UserHealthContext) => void;
  onClose: () => void;
}

type StressLevel = 'low' | 'moderate' | 'high' | null;

interface LifestyleToggles {
  sleepChanges: boolean;
  dietChanges: boolean;
  exerciseChanges: boolean;
  travelRecent: boolean;
}

const INITIAL_LIFESTYLE: LifestyleToggles = {
  sleepChanges: false,
  dietChanges: false,
  exerciseChanges: false,
  travelRecent: false,
};

export function HealthQuestionnaireSheet({ visible, onComplete, onClose }: Props) {
  const { t } = useTranslation('health');
  const { t: tCommon } = useTranslation('common');
  const slideAnim = useRef(new Animated.Value(600)).current;

  const [stress, setStress] = useState<StressLevel>(null);
  const [lifestyle, setLifestyle] = useState<LifestyleToggles>({ ...INITIAL_LIFESTYLE });

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

  // Reset when sheet closes
  useEffect(() => {
    if (!visible) {
      setStress(null);
      setLifestyle({ ...INITIAL_LIFESTYLE });
    }
  }, [visible]);

  function handleStressSelect(level: StressLevel) {
    impactMedium();
    setStress(level);
  }

  function handleToggleLifestyle(key: keyof LifestyleToggles) {
    impactMedium();
    setLifestyle((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSubmit() {
    impactMedium();
    const context: UserHealthContext = {
      recentStress: stress,
      sleepChanges: lifestyle.sleepChanges,
      dietChanges: lifestyle.dietChanges,
      exerciseChanges: lifestyle.exerciseChanges,
      travelRecent: lifestyle.travelRecent,
    };
    onComplete(context);
  }

  function handleSkip() {
    const context: UserHealthContext = {
      recentStress: null,
      sleepChanges: false,
      dietChanges: false,
      exerciseChanges: false,
      travelRecent: false,
    };
    onComplete(context);
  }

  const stressOptions: Array<{ value: StressLevel; label: string; icon: string }> = [
    { value: 'low', label: t('questionnaire.stressLow'), icon: 'smile' },
    { value: 'moderate', label: t('questionnaire.stressMedium'), icon: 'meh' },
    { value: 'high', label: t('questionnaire.stressHigh'), icon: 'frown' },
  ];

  const lifestyleChips: Array<{ key: keyof LifestyleToggles; label: string; icon: string }> = [
    { key: 'sleepChanges', label: t('questionnaire.sleepChanges'), icon: 'moon' },
    { key: 'dietChanges', label: t('questionnaire.dietChanges'), icon: 'coffee' },
    { key: 'exerciseChanges', label: t('questionnaire.exerciseChanges'), icon: 'activity' },
    { key: 'travelRecent', label: t('questionnaire.travelYes'), icon: 'map-pin' },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
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
                <Text style={styles.title}>{t('questionnaire.headline')}</Text>
                <Text style={styles.subtitle}>{t('questionnaire.subtitle')}</Text>
              </View>

              {/* Stress question */}
              <View style={styles.questionSection}>
                <Text style={styles.questionLabel}>
                  {t('questionnaire.stressQuestion')}
                </Text>
                <View style={styles.stressRow}>
                  {stressOptions.map((opt) => {
                    const isSelected = stress === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.stressChip,
                          isSelected && styles.stressChipSelected,
                        ]}
                        onPress={() => handleStressSelect(opt.value)}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name={opt.icon as any}
                          size={20}
                          color={isSelected ? MOON.textPrimary : MOON.textSecondary}
                        />
                        <Text
                          style={[
                            styles.stressLabel,
                            isSelected && styles.stressLabelSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Lifestyle changes */}
              <View style={styles.questionSection}>
                <Text style={styles.questionLabel}>
                  {t('questionnaire.lifestyleQuestion')}
                </Text>
                <View style={styles.chipGrid}>
                  {lifestyleChips.map((chip) => {
                    const isActive = lifestyle[chip.key];
                    return (
                      <TouchableOpacity
                        key={chip.key}
                        style={[
                          styles.lifestyleChip,
                          isActive && styles.lifestyleChipActive,
                        ]}
                        onPress={() => handleToggleLifestyle(chip.key)}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name={chip.icon as any}
                          size={16}
                          color={isActive ? MOON.textPrimary : MOON.textSecondary}
                        />
                        <Text
                          style={[
                            styles.chipLabel,
                            isActive && styles.chipLabelActive,
                          ]}
                        >
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Submit button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <Text style={styles.submitText}>
                  {t('questionnaire.submitButton')}
                </Text>
                <Feather name="arrow-right" size={18} color={MOON.textPrimary} />
              </TouchableOpacity>

              {/* Skip */}
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>{t('questionnaire.skipButton')}</Text>
              </TouchableOpacity>
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
    maxHeight: '85%',
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
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: MOON.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: MOON.textSecondary,
    textAlign: 'center',
  },
  questionSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  questionLabel: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
    marginBottom: Spacing.md,
  },
  stressRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stressChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: MOON.card,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: MOON.border,
  },
  stressChipSelected: {
    backgroundColor: ACCENT + '20',
    borderColor: ACCENT,
  },
  stressLabel: {
    ...Typography.caption,
    color: MOON.textSecondary,
    textAlign: 'center',
  },
  stressLabelSelected: {
    color: MOON.textPrimary,
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  lifestyleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: MOON.card,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: MOON.border,
  },
  lifestyleChipActive: {
    backgroundColor: ACCENT + '20',
    borderColor: ACCENT,
  },
  chipLabel: {
    ...Typography.caption,
    color: MOON.textSecondary,
  },
  chipLabelActive: {
    color: MOON.textPrimary,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: ACCENT,
    borderRadius: Radii.md,
  },
  submitText: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
  },
  skipButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  skipText: {
    ...Typography.body,
    color: MOON.textHint,
    textAlign: 'center',
  },
});
