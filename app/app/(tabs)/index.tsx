import { useAppStore } from '@/store/appStore';
import { MoonDashboard } from '@/screens/MoonDashboard';
import { SunDashboard } from '@/screens/SunDashboard';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/theme';

export default function DashboardTab() {
  const role = useAppStore((s) => s.role);

  if (role === 'moon') return <MoonDashboard />;
  if (role === 'sun') return <SunDashboard />;

  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>No role selected.</Text>
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
