import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/appStore';
import { UserRole } from '@/types';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';

interface RoleCard {
  role: UserRole;
  icon: string; // Feather icon name
  title: string;
  subtitle: string;
  color: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    role: 'moon',
    icon: 'moon',
    title: 'I am the Moon',
    subtitle: 'Track your cycle & whisper to your Sun when you need them',
    color: Colors.menstrual,
  },
  {
    role: 'sun',
    icon: 'sun',
    title: 'I am the Sun',
    subtitle: 'Stay in tune & know exactly how to show up for your Moon',
    color: Colors.follicular,
  },
];

export default function OnboardingScreen() {
  const setRole = useAppStore((s) => s.setRole);

  async function handleSelectRole(role: UserRole) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setRole(role);
    if (role === 'moon') {
      router.replace('/health-sync');
    } else {
      router.replace('/(tabs)');
    }
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
                <Feather name={card.icon as any} size={26} color={card.color} />
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
