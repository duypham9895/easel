import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MoonColors } from '@/constants/theme';

const M = MoonColors;

interface Props {
  onEnterManually: () => void;
}

export function PermissionDeniedScreen({ onEnterManually }: Props) {
  const { t } = useTranslation('health');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.spacerTop} />

      <View style={styles.iconContainer}>
        <Feather name="shield-off" size={40} color={M.textSecondary} />
      </View>

      <View style={styles.gap24} />

      <Text style={styles.headline} accessibilityRole="header">
        {t('permissionDenied.headline')}
      </Text>

      <View style={styles.gap12} />

      <Text style={styles.body}>
        {t('permissionDenied.body')}
      </Text>

      <View style={styles.gap32} />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onEnterManually}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Feather name="edit-2" size={18} color={M.white} style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>{t('permissionDenied.ctaButton')}</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <>
          <View style={styles.gap12} />
          <TouchableOpacity
            onPress={() => Linking.openURL('app-settings:')}
            style={styles.settingsLink}
            accessibilityRole="button"
          >
            <Feather name="settings" size={14} color={M.textHint} />
            <Text style={styles.settingsLinkText}>Open Settings</Text>
          </TouchableOpacity>
        </>
      )}

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
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  settingsLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: M.textHint,
    textDecorationLine: 'underline',
  },
});
