import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MoonColors } from '@/constants/theme';

const M = MoonColors;

export function HealthSyncLoading() {
  const { t } = useTranslation('health');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <View style={styles.loadingCircle}>
          <ActivityIndicator size="large" color={M.accentPrimary} />
        </View>
        <View style={styles.gap24} />
        <Text style={styles.title} accessibilityRole="header">
          {t('syncing.title')}
        </Text>
        <View style={styles.gap8} />
        <Text style={styles.subtitle}>
          {t('syncing.subtitle')}
        </Text>
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
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: M.accentPrimary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap8: { height: 8 },
  gap24: { height: 24 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: M.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: M.textSecondary,
    textAlign: 'center',
  },
});
