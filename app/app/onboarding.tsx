import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { impactMedium } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';
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

export default function OnboardingScreen() {
  const { t } = useTranslation('onboarding');
  const setRole = useAppStore((s) => s.setRole);

  const ROLE_CARDS: RoleCard[] = [
    {
      role: 'moon',
      icon: 'moon',
      title: t('iAmMoon'),
      subtitle: t('moonSubtitle'),
      color: Colors.menstrual,
    },
    {
      role: 'sun',
      icon: 'sun',
      title: t('iAmSun'),
      subtitle: t('sunSubtitle'),
      color: Colors.follicular,
    },
  ];

  const bootstrapSession = useAppStore((s) => s.bootstrapSession);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSelectRole(role: UserRole) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    impactMedium();
    try {
      await setRole(role);
      await bootstrapSession();
      router.replace(role === 'moon' ? '/health-sync' : '/(tabs)');
    } catch {
      Alert.alert(t('errorTitle'), t('errorRetry'));
    } finally {
      setIsSubmitting(false);
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
          <Text style={styles.welcomeText}>{t('welcomeTo')}</Text>
          <Text style={styles.appName}>Easel</Text>
          <Text style={styles.description}>
            {t('chooseRole')}
          </Text>
        </View>

        <View style={styles.cards}>
          {ROLE_CARDS.map((card) => (
            <TouchableOpacity
              key={card.role}
              style={[styles.card, isSubmitting && styles.cardDisabled]}
              onPress={() => handleSelectRole(card.role)}
              activeOpacity={0.9}
              disabled={isSubmitting}
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
          {t('changeRoleHint')}
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
  cardDisabled: {
    opacity: 0.5,
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
