import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MoonColors } from '@/constants/theme';

const M = MoonColors;

interface Props {
  onEnterManually: () => void;
}

export function HealthEmptyState({ onEnterManually }: Props) {
  const { t } = useTranslation('health');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.spacerTop} />

      <View style={styles.iconContainer}>
        <Feather name="calendar" size={40} color={M.textSecondary} />
        <View style={styles.zeroBadge}>
          <Text style={styles.zeroText}>0</Text>
        </View>
      </View>

      <View style={styles.gap24} />

      <Text style={styles.headline} accessibilityRole="header">
        {t('emptyState.headline')}
      </Text>

      <View style={styles.gap12} />

      <Text style={styles.body}>
        {t('emptyState.body')}
      </Text>

      <View style={styles.gap32} />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onEnterManually}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Feather name="edit-2" size={18} color={M.white} style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>{t('emptyState.ctaButton')}</Text>
      </TouchableOpacity>

      <View style={styles.spacerBottom} />
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
    backgroundColor: M.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zeroBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: M.textHint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zeroText: {
    fontSize: 14,
    fontWeight: '700',
    color: M.white,
  },
  gap12: { height: 12 },
  gap24: { height: 24 },
  gap32: { height: 32 },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: M.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: M.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: M.accentPrimary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: M.white,
  },
});
