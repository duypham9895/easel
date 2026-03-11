import { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MoonColors, Spacing, Radii, Typography, Colors } from '@/constants/theme';
import type { CycleDeviation } from '@/types';

const MOON = MoonColors;

interface Props {
  visible: boolean;
  deviation: CycleDeviation | null;
  onDismiss: () => void;
  onExplore: () => void;
}

/**
 * A gentle bottom sheet that appears when Moon's period deviates significantly
 * from the prediction. Asks if she wants to explore why.
 */
export function DeviationPromptSheet({ visible, deviation, onDismiss, onExplore }: Props) {
  const { t } = useTranslation('health');
  const slideAnim = useRef(new Animated.Value(600)).current;

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
  }, [visible, slideAnim]);

  if (!deviation || !deviation.isSignificant) return null;

  const isEarly = deviation.type === 'early';
  const headline = isEarly
    ? t('deviation.earlyHeadline')
    : t('deviation.lateHeadline');
  const body = isEarly
    ? t('deviation.earlyBody', { days: Math.abs(deviation.daysDifference) })
    : t('deviation.lateBody', { days: Math.abs(deviation.daysDifference) });
  const accentColor = isEarly ? Colors.menstrual : Colors.luteal;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: accentColor + '18' }]}>
                <Feather
                  name={isEarly ? 'clock' : 'alert-circle'}
                  size={32}
                  color={accentColor}
                />
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.headline}>{headline}</Text>
              <Text style={styles.body}>{body}</Text>
              <Text style={styles.updatedNote}>
                {t('deviation.updatedPredictions')}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.exploreButton, { backgroundColor: accentColor }]}
                onPress={onExplore}
                activeOpacity={0.85}
              >
                <Text style={styles.exploreText}>{t('deviation.exploreButton')}</Text>
                <Feather name="arrow-right" size={18} color={MOON.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismiss}
                activeOpacity={0.75}
              >
                <Text style={styles.dismissText}>{t('deviation.dismissButton')}</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: MOON.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: MOON.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  updatedNote: {
    ...Typography.caption,
    color: MOON.textHint,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radii.full,
  },
  exploreText: {
    ...Typography.bodyBold,
    color: MOON.white,
  },
  dismissButton: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  dismissText: {
    ...Typography.body,
    color: MOON.textHint,
  },
});
