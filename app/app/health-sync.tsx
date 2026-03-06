import { View } from 'react-native';
import { router } from 'expo-router';
import { HealthSyncPrompt } from '@/components/moon/HealthSyncPrompt';
import { useHealthSync } from '@/hooks/useHealthSync';

export default function HealthSyncScreen() {
  const { sync } = useHealthSync();

  async function handleSync() {
    await sync();
    router.replace('/(tabs)');
  }

  function handleSkip() {
    router.replace('/(tabs)');
  }

  return (
    <View style={{ flex: 1 }}>
      <HealthSyncPrompt onSync={handleSync} onSkip={handleSkip} />
    </View>
  );
}
