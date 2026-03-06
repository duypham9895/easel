import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';

interface Props {
  icon: string; // Feather icon name
  label: string;
  value: string;
  accent?: string;
}

export function InsightCard({ icon, label, value, accent = Colors.menstrual }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBg, { backgroundColor: accent + '14' }]}>
        <Feather name={icon as any} size={20} color={accent} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  value: {
    ...Typography.bodyBold,
    lineHeight: 22,
    flexShrink: 1,
  },
});
