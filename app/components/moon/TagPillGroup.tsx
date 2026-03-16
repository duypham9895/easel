import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, MoonColors, Spacing, Radii, Typography } from '@/constants/theme';
import type { OverrideTag } from '@/types';

const MOON = MoonColors;

interface TagDef {
  readonly id: OverrideTag;
  readonly icon: React.ComponentProps<typeof Feather>['name'];
}

const TAG_DEFS: readonly TagDef[] = [
  { id: 'stress', icon: 'zap' },
  { id: 'illness', icon: 'thermometer' },
  { id: 'travel', icon: 'map-pin' },
  { id: 'medication', icon: 'activity' },
  { id: 'other', icon: 'more-horizontal' },
] as const;

interface TagPillGroupProps {
  selected: readonly OverrideTag[];
  onToggle: (tag: OverrideTag) => void;
  disabled?: boolean;
}

export function TagPillGroup({ selected, onToggle, disabled }: TagPillGroupProps) {
  const { t } = useTranslation('calendar');

  return (
    <View style={styles.tagsRow}>
      {TAG_DEFS.map((tag) => {
        const isSelected = selected.includes(tag.id);
        return (
          <TouchableOpacity
            key={tag.id}
            style={[
              styles.tagPill,
              isSelected ? styles.tagPillSelected : styles.tagPillUnselected,
            ]}
            onPress={() => onToggle(tag.id)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Feather
              name={tag.icon}
              size={14}
              color={isSelected ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tagLabel,
                isSelected ? styles.tagLabelSelected : styles.tagLabelUnselected,
              ]}
            >
              {t(tag.id)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    height: 36,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
  },
  tagPillSelected: {
    backgroundColor: Colors.accent,
  },
  tagPillUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: MOON.textHint + '60',
  },
  tagLabel: {
    ...Typography.caption,
  },
  tagLabelSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  tagLabelUnselected: {
    color: MOON.textSecondary,
  },
});
