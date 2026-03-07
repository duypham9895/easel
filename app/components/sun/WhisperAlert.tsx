import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CyclePhase, SOSOption } from '@/types';
import { Spacing, Radii, Typography } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';
import { useAISOSTip } from '@/hooks/useAISOSTip';

interface Props {
  whisper: SOSOption;
  phase: CyclePhase;
  dayInCycle: number;
}

export function WhisperAlert({ whisper, phase, dayInCycle }: Props) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const clearWhisper = useAppStore((s) => s.clearWhisper ?? s.clearSOS);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const { tip, isAI: tipIsAI } = useAISOSTip(whisper, phase, dayInCycle);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: whisper.color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Left row */}
      <View style={styles.left}>
        <View style={styles.iconCircle}>
          <Feather name={whisper.icon as any} size={22} color="white" />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.badge}>
            {`${t('whisper')}${tipIsAI ? ' · ✦ AI' : ''}`}
          </Text>
          <Text style={styles.title}>{t('moonNeeds', { title: whisper.title })}</Text>
          <Text style={styles.description}>{tip}</Text>
        </View>
      </View>

      {/* Dismiss */}
      <TouchableOpacity onPress={clearWhisper} style={styles.dismissButton}>
        <Feather name="check" size={14} color="white" />
        <Text style={styles.dismissText}>{tCommon('gotIt')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  badge: {
    ...Typography.tiny,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
  },
  title: {
    ...Typography.bodyBold,
    color: 'white',
  },
  description: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  dismissButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dismissText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '700',
  },
});
