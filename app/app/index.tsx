import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store/appStore';
import { Colors } from '@/constants/theme';

// Entry point — re-hydrates the Supabase session, then routes to the correct screen
export default function Index() {
  const { isLoggedIn, role, bootstrapSession } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapSession().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace('/auth');
    } else if (!role) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [ready, isLoggedIn, role]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.menstrual} />
    </View>
  );
}
