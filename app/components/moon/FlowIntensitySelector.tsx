import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { CycleCalendarTokens, Colors, Spacing, Radii, Typography } from '@/constants/theme';
import type { FlowIntensity } from '@/types';
import { impactMedium } from '@/utils/haptics';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FLOW_OPTIONS: ReadonlyArray<{
  id: FlowIntensity;
  dotCount: number;
  dotSize: number;
}> = [
  { id: 'spotting', dotCount: 1, dotSize: 6 },
  { id: 'light', dotCount: 2, dotSize: 8 },
  { id: 'medium', dotCount: 3, dotSize: 10 },
  { id: 'heavy', dotCount: 4, dotSize: 12 },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FlowIntensitySelectorProps {
  selected: FlowIntensity | null;
  onSelect: (intensity: FlowIntensity) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FlowIntensitySelector({
  selected,
  onSelect,
  disabled = false,
}: FlowIntensitySelectorProps) {
  const { t } = useTranslation('calendar');

  const handlePress = (id: FlowIntensity) => {
    if (disabled) return;
    impactMedium();
    onSelect(id);
  };

  return (
    <View style={styles.row}>
      {FLOW_OPTIONS.map((option) => {
        const isActive = selected === option.id;

        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.button,
              isActive ? styles.buttonActive : styles.buttonInactive,
            ]}
            activeOpacity={0.7}
            disabled={disabled}
            onPress={() => handlePress(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled }}
            accessibilityLabel={t(option.id)}
          >
            <View style={styles.dotsContainer}>
              {Array.from({ length: option.dotCount }, (_, i) => (
                <View
                  key={i}
                  style={[
                    {
                      width: option.dotSize,
                      height: option.dotSize,
                      borderRadius: option.dotSize / 2,
                    },
                    isActive ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>

            <Text
              style={[
                styles.label,
                isActive ? styles.labelActive : styles.labelInactive,
              ]}
              numberOfLines={1}
            >
              {t(option.id)}
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
  row: {
    flexDirection: 'row',
    gap: Spacing.sm ?? 8,
  },

  button: {
    flex: 1,
    height: 72,
    borderRadius: Radii.md ?? 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  buttonActive: {
    backgroundColor: CycleCalendarTokens.periodLogged,
  },

  buttonInactive: {
    backgroundColor: Colors.inputBg,
  },

  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  dotActive: {
    backgroundColor: '#FFFFFF',
  },

  dotInactive: {
    backgroundColor: Colors.textSecondary,
  },

  label: {
    ...Typography.caption,
    textAlign: 'center',
  },

  labelActive: {
    color: '#FFFFFF',
  },

  labelInactive: {
    color: Colors.textSecondary,
  },
});
