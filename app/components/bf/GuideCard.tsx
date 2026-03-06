import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';

interface Props {
  emoji: string;
  title: string;
  text: string;
  accent: string;
}

export function GuideCard({ emoji, title, text, accent }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBg, { backgroundColor: accent + '18' }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 22,
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  text: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
