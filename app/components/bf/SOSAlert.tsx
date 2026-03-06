import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { CyclePhase, SOSOption } from '@/types';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useAppStore } from '@/store/appStore';
import { useAISOSTip } from '@/hooks/useAISOSTip';

interface Props {
  sos: SOSOption;
  phase: CyclePhase;
  dayInCycle: number;
}

export function SOSAlert({ sos, phase, dayInCycle }: Props) {
  const clearSOS = useAppStore((s) => s.clearSOS);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // AI-generated specific action tip — replaces static sos.description
  const { tip, isAI: tipIsAI } = useAISOSTip(sos, phase, dayInCycle);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 14 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: sos.color, transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={styles.left}>
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{sos.emoji}</Text>
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.badge}>SOS SIGNAL{tipIsAI ? ' · ✦ AI' : ''}</Text>
          <Text style={styles.title}>She needs: {sos.title}</Text>
          <Text style={styles.description}>{tip}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={clearSOS} style={styles.dismissButton}>
        <Text style={styles.dismissText}>✓ Got it</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
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
    color: Colors.white,
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
  },
  dismissText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
});
