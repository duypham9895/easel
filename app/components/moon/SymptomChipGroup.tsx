import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CycleCalendarTokens, Colors, Spacing, Typography } from '@/constants/theme';
import type { PeriodSymptom } from '@/types';
import { impactLight } from '@/utils/haptics';

// ---------------------------------------------------------------------------
// Symptom definitions
// ---------------------------------------------------------------------------

const SYMPTOM_DEFS: ReadonlyArray<{
  id: PeriodSymptom;
  icon: React.ComponentProps<typeof Feather>['name'];
  labelKey: string;
}> = [
  { id: 'cramps', icon: 'zap', labelKey: 'cramps' },
  { id: 'fatigue', icon: 'battery', labelKey: 'fatigue' },
  { id: 'headache', icon: 'cloud-lightning', labelKey: 'headache' },
  { id: 'bloating', icon: 'circle', labelKey: 'bloating' },
  { id: 'mood_swings', icon: 'trending-up', labelKey: 'moodSwings' },
  { id: 'nausea', icon: 'frown', labelKey: 'nausea' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SymptomChipGroupProps {
  readonly selected: ReadonlySet<PeriodSymptom>;
  readonly onToggle: (symptom: PeriodSymptom) => void;
  readonly disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SymptomChipGroup({
  selected,
  onToggle,
  disabled = false,
}: SymptomChipGroupProps) {
  const { t } = useTranslation('calendar');

  const handlePress = useCallback(
    (symptom: PeriodSymptom) => {
      if (disabled) return;
      impactLight();
      onToggle(symptom);
    },
    [disabled, onToggle],
  );

  return (
    <View style={styles.container}>
      {SYMPTOM_DEFS.map(({ id, icon, labelKey }) => {
        const active = selected.has(id);
        return (
          <TouchableOpacity
            key={id}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
            activeOpacity={0.7}
            disabled={disabled}
            onPress={() => handlePress(id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            accessibilityLabel={t(labelKey)}
          >
            <Feather
              name={icon}
              size={14}
              color={
                active
                  ? CycleCalendarTokens.chipActiveForeground
                  : Colors.textSecondary
              }
            />
            <Text
              style={[
                styles.label,
                { color: active
                    ? CycleCalendarTokens.chipActiveForeground
                    : Colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {t(labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: CycleCalendarTokens.chipMinWidth,
    height: CycleCalendarTokens.chipHeight,
    borderRadius: CycleCalendarTokens.chipBorderRadius,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  chipActive: {
    backgroundColor: CycleCalendarTokens.chipActiveBackground,
  },
  chipInactive: {
    backgroundColor: CycleCalendarTokens.chipInactiveBackground,
  },
  label: {
    ...Typography.body,
    fontSize: 14,
  },
});
