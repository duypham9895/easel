import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MoonColors } from '@/constants/theme';

const M = MoonColors;

interface Props {
  onContinueWithHealth: () => void;
  onEnterManually: () => void;
  isHealthKitAvailable: boolean;
  isSyncing?: boolean;
}

function BulletItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletIcon}>
        <Feather name={icon as any} size={16} color={M.accentPrimary} />
      </View>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export function HealthSyncEducation({ onContinueWithHealth, onEnterManually, isHealthKitAvailable, isSyncing = false }: Props) {
  const { t } = useTranslation('health');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.spacerTop} />

      {/* Hero icon */}
      <View style={styles.iconContainer}>
        <Feather name="heart" size={36} color={M.accentPrimary} />
        <View style={styles.iconBadge}>
          <Feather name="smartphone" size={14} color={M.white} />
        </View>
      </View>

      <View style={styles.gap24} />

      {/* Headline */}
      <Text style={styles.headline} accessibilityRole="header">
        {t('education.headline')}
      </Text>

      <View style={styles.gap12} />

      {/* Body */}
      <Text style={styles.body}>
        {t('education.body')}
      </Text>

      <View style={styles.gap24} />

      {/* Bullet points */}
      <View style={styles.bulletList}>
        <BulletItem icon="check-circle" text={t('education.bullet1')} />
        <BulletItem icon="lock" text={t('education.bullet2')} />
        <BulletItem icon="settings" text={t('education.bullet3')} />
      </View>

      <View style={styles.gap32} />

      {/* Primary CTA */}
      {isHealthKitAvailable && (
        <TouchableOpacity
          style={[styles.primaryButton, isSyncing && { opacity: 0.6 }]}
          onPress={onContinueWithHealth}
          activeOpacity={0.85}
          disabled={isSyncing}
          accessibilityRole="button"
          accessibilityLabel={t('education.continueButton')}
        >
          {isSyncing ? (
            <ActivityIndicator color={M.white} />
          ) : (
            <>
              <Feather name="heart" size={18} color={M.white} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>{t('education.continueButton')}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.gap12} />

      {/* Secondary CTA */}
      <TouchableOpacity
        onPress={onEnterManually}
        style={styles.secondaryButton}
        accessibilityRole="button"
        accessibilityLabel={t('education.manualButton')}
      >
        <Text style={styles.secondaryButtonText}>{t('education.manualButton')}</Text>
      </TouchableOpacity>

      <View style={styles.spacerBottom} />

      {/* Privacy badge */}
      <View style={styles.privacyRow} accessibilityRole="text">
        <Feather name="shield" size={12} color={M.textHint} />
        <Text style={styles.privacyText}>{t('education.privacyBadge')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: M.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spacerTop: { flex: 1 },
  spacerBottom: { flex: 1 },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: M.accentPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: M.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap12: { height: 12 },
  gap24: { height: 24 },
  gap32: { height: 32 },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: M.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: M.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bulletList: {
    alignSelf: 'stretch',
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  bulletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: M.accentPrimary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: M.textPrimary,
    lineHeight: 22,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: M.accentPrimary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: M.white,
  },
  secondaryButton: {
    padding: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: M.textHint,
    textDecorationLine: 'underline',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 8,
  },
  privacyText: {
    fontSize: 11,
    fontWeight: '600',
    color: M.textHint,
  },
});
