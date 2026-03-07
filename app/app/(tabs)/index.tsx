import { useAppStore } from '@/store/appStore';
import { MoonDashboard } from '@/screens/MoonDashboard';
import { SunDashboard } from '@/screens/SunDashboard';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function DashboardTab() {
  const { t } = useTranslation('common');
  const role = useAppStore((s) => s.role);

  if (role === 'moon') return <MoonDashboard />;
  if (role === 'sun') return <SunDashboard />;

  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>{t('noRoleSelected')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    ...Typography.body,
    color: Colors.textHint,
  },
});
