import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/appStore';
import { UserRole } from '@/types';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';

interface RoleCard {
  role: UserRole;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    role: 'girlfriend',
    emoji: '🌸',
    title: 'I am the Girlfriend',
    subtitle: 'Track my cycle & send signals to my partner',
    color: Colors.menstrual,
  },
  {
    role: 'boyfriend',
    emoji: '💙',
    title: 'I am the Boyfriend',
    subtitle: 'Stay informed & know how to care for her',
    color: Colors.follicular,
  },
];

export default function OnboardingScreen() {
  const setRole = useAppStore((s) => s.setRole);

  async function handleSelectRole(role: UserRole) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setRole(role);
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.menstrual + '14', 'transparent']}
        style={styles.bgGlow}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>Easel</Text>
          <Text style={styles.description}>
            Choose your role to personalize your experience. Understanding each other starts here.
          </Text>
        </View>

        <View style={styles.cards}>
          {ROLE_CARDS.map((card) => (
            <TouchableOpacity
              key={card.role}
              style={styles.card}
              onPress={() => handleSelectRole(card.role)}
              activeOpacity={0.9}
            >
              <View style={[styles.cardIconBg, { backgroundColor: card.color + '18' }]}>
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </View>
              <Text style={[styles.cardChevron, { color: card.color }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footerNote}>
          You can change your role anytime in Settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgGlow: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    top: -150,
    right: -150,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
  },
  welcomeText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  cards: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  cardIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  cardChevron: {
    fontSize: 24,
    fontWeight: '700',
  },
  footerNote: {
    ...Typography.caption,
    color: Colors.textHint,
    textAlign: 'center',
  },
});
