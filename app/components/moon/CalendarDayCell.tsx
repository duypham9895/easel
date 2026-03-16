import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CycleCalendarTokens, Colors } from '@/constants/theme';
import { impactLight } from '@/utils/haptics';
import type { CalendarMarker, FlowIntensity } from '@/types';

interface CalendarDayCellProps {
  date: { dateString: string; day: number; month: number; year: number };
  state: 'disabled' | 'today' | '';
  marking: CalendarMarker | undefined;
  isSelected: boolean;
  flowIntensity: FlowIntensity | null;
  onPress: (dateString: string) => void;
}

const FLOW_DOT_CONFIG: Record<FlowIntensity, { count: number; size: number }> = {
  spotting: { count: 1, size: CycleCalendarTokens.flowDotSpotting },
  light: { count: 2, size: CycleCalendarTokens.flowDotLight },
  medium: { count: 3, size: CycleCalendarTokens.flowDotMedium },
  heavy: { count: 4, size: CycleCalendarTokens.flowDotHeavy },
};

function getDayCellStyle(marking: CalendarMarker | undefined) {
  if (!marking) return { bg: 'transparent', textColor: Colors.textPrimary, borderColor: '', borderStyle: 'solid' as const };

  if (marking.type === 'period' && marking.source === 'logged') {
    return { bg: CycleCalendarTokens.periodLogged, textColor: Colors.white, borderColor: '', borderStyle: 'solid' as const };
  }
  if (marking.type === 'period' && marking.source === 'predicted') {
    return { bg: 'transparent', textColor: CycleCalendarTokens.periodPredicted, borderColor: CycleCalendarTokens.periodPredicted, borderStyle: 'dashed' as const };
  }
  if (marking.type === 'fertile') {
    return { bg: CycleCalendarTokens.fertileWindow + '25', textColor: CycleCalendarTokens.fertileWindow, borderColor: '', borderStyle: 'solid' as const };
  }
  if (marking.type === 'ovulation') {
    return { bg: 'transparent', textColor: CycleCalendarTokens.ovulationDay, borderColor: '', borderStyle: 'solid' as const };
  }

  return { bg: 'transparent', textColor: Colors.textPrimary, borderColor: '', borderStyle: 'solid' as const };
}

function getRangeBandStyle(marking: CalendarMarker | undefined) {
  if (!marking) return null;
  const { isRangeStart, isRangeMid, isRangeEnd } = marking;
  if (!isRangeStart && !isRangeMid && !isRangeEnd) return null;

  const color = marking.type === 'period'
    ? (marking.source === 'logged' ? CycleCalendarTokens.periodLogged : CycleCalendarTokens.periodPredicted)
    : CycleCalendarTokens.fertileWindow;

  return {
    backgroundColor: color,
    opacity: CycleCalendarTokens.rangeBandOpacity,
    borderTopLeftRadius: isRangeStart ? CycleCalendarTokens.dayCellRadius : 0,
    borderBottomLeftRadius: isRangeStart ? CycleCalendarTokens.dayCellRadius : 0,
    borderTopRightRadius: isRangeEnd ? CycleCalendarTokens.dayCellRadius : 0,
    borderBottomRightRadius: isRangeEnd ? CycleCalendarTokens.dayCellRadius : 0,
    left: isRangeStart ? '50%' : 0,
    right: isRangeEnd ? '50%' : 0,
  } as const;
}

function FlowDots({ intensity }: { intensity: FlowIntensity }) {
  const { count, size } = FLOW_DOT_CONFIG[intensity];
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.flowDot,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ))}
    </View>
  );
}

function CalendarDayCellInner({
  date,
  state,
  marking,
  isSelected,
  flowIntensity,
  onPress,
}: CalendarDayCellProps) {
  const { bg, textColor, borderColor, borderStyle } = getDayCellStyle(marking);
  const rangeBand = getRangeBandStyle(marking);
  const isToday = state === 'today';
  const isDisabled = state === 'disabled';
  const isOvulation = marking?.type === 'ovulation';

  const handlePress = () => {
    if (!isDisabled) {
      impactLight();
      onPress(date.dateString);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={isDisabled ? 1 : 0.6}
      onPress={handlePress}
      style={[styles.wrapper, isDisabled && styles.disabled]}
    >
      {rangeBand && (
        <View
          style={[styles.rangeBand, rangeBand]}
          pointerEvents="none"
        />
      )}

      <View
        style={[
          styles.cell,
          { backgroundColor: bg },
          borderColor !== '' && { borderWidth: 2, borderColor, borderStyle },
          isToday && styles.todayRing,
          isSelected && styles.selectedRing,
        ]}
      >
        <Text style={[styles.dayText, { color: textColor }]}>
          {date.day}
        </Text>
      </View>

      {isOvulation && <View style={styles.ovulationDot} />}
      {flowIntensity && <FlowDots intensity={flowIntensity} />}
    </TouchableOpacity>
  );
}

function areEqual(prev: CalendarDayCellProps, next: CalendarDayCellProps): boolean {
  return (
    prev.date.dateString === next.date.dateString &&
    prev.isSelected === next.isSelected &&
    prev.state === next.state &&
    prev.flowIntensity === next.flowIntensity &&
    prev.marking?.type === next.marking?.type &&
    prev.marking?.source === next.marking?.source &&
    prev.marking?.isRangeStart === next.marking?.isRangeStart &&
    prev.marking?.isRangeMid === next.marking?.isRangeMid &&
    prev.marking?.isRangeEnd === next.marking?.isRangeEnd
  );
}

export const CalendarDayCell = React.memo(CalendarDayCellInner, areEqual);

const SIZE = CycleCalendarTokens.dayCellSize;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE + 8,
    height: SIZE + 18,
  },
  disabled: {
    opacity: 0.3,
  },
  cell: {
    width: SIZE,
    height: SIZE,
    borderRadius: CycleCalendarTokens.dayCellRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: {
    borderWidth: 2,
    borderColor: CycleCalendarTokens.todayRingColor,
  },
  selectedRing: {
    borderWidth: CycleCalendarTokens.selectedRingWidth,
    borderColor: CycleCalendarTokens.selectedRingColor,
  },
  dayText: {
    fontSize: CycleCalendarTokens.dayCellFontSize,
    fontWeight: '500',
  },
  ovulationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CycleCalendarTokens.ovulationDay,
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: 1,
    height: 12,
  },
  flowDot: {
    backgroundColor: CycleCalendarTokens.flowDotColor,
  },
  rangeBand: {
    position: 'absolute',
    top: (SIZE + 18 - CycleCalendarTokens.rangeBandHeight) / 2,
    height: CycleCalendarTokens.rangeBandHeight,
  },
});
