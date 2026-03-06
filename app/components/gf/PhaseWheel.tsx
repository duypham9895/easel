import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CyclePhase } from '@/types';
import { PHASE_INFO } from '@/constants/phases';
import { Colors, Typography } from '@/constants/theme';

interface Props {
  phase: CyclePhase;
  dayInCycle: number;
  daysUntilPeriod: number;
  totalCycleDays: number;
}

export function PhaseWheel({ phase, dayInCycle, daysUntilPeriod, totalCycleDays }: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.15);
  const phaseInfo = PHASE_INFO[phase];

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.22, { duration: 2500 }),
        withTiming(0.12, { duration: 2500 }),
      ),
      -1,
      false,
    );
  }, [phase]);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const progressFraction = dayInCycle / totalCycleDays;

  return (
    <View style={styles.container}>
      {/* Outer pulsating glow ring */}
      <Animated.View
        style={[
          styles.outerRing,
          { backgroundColor: phaseInfo.color },
          outerRingStyle,
        ]}
      />

      {/* Progress ring visual (SVG-free approach: arc segments) */}
      <View style={[styles.progressRing, { borderColor: phaseInfo.color + '30' }]}>
        <View
          style={[
            styles.progressFill,
            {
              borderColor: phaseInfo.color,
              // Simulate arc progress with border trick
              borderTopColor: progressFraction > 0.75 ? phaseInfo.color : 'transparent',
              borderRightColor: progressFraction > 0.25 ? phaseInfo.color : 'transparent',
              borderBottomColor: progressFraction > 0.5 ? phaseInfo.color : 'transparent',
              borderLeftColor: phaseInfo.color,
            },
          ]}
        />
      </View>

      {/* Inner filled circle */}
      <View style={[styles.innerCircle, { backgroundColor: phaseInfo.color }]}>
        <Text style={styles.phaseLabel}>{phaseInfo.name}</Text>
        <Text style={styles.dayNumber}>{dayInCycle}</Text>
        <View style={[styles.pillBadge, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
          <Text style={styles.pillText}>
            {daysUntilPeriod === 1 ? '1 day left' : `${daysUntilPeriod} days left`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  progressRing: {
    position: 'absolute',
    width: 276,
    height: 276,
    borderRadius: 138,
    borderWidth: 3,
  },
  progressFill: {
    position: 'absolute',
    width: 276,
    height: 276,
    borderRadius: 138,
    borderWidth: 3,
  },
  innerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dayNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 76,
    letterSpacing: -2,
  },
  pillBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillText: {
    ...Typography.tiny,
    color: Colors.white,
  },
});
