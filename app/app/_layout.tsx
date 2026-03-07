import '@/i18n/config';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/appStore';

function AppWithHooks() {
  // Register for push notifications after login; saves token to DB
  useNotifications();

  const bootstrapSession = useAppStore((s) => s.bootstrapSession);
  const signOut = useAppStore((s) => s.signOut);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Token expired or remote sign-out — clear local state and redirect
        signOut();
        router.replace('/auth');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function handleDeepLink(url: string) {
      // Token hash flow (Supabase PKCE)
      const parsed = Linking.parse(url);
      const token_hash = parsed.queryParams?.token_hash as string | undefined;
      const type = parsed.queryParams?.type as string | undefined;
      if (token_hash && type) {
        if (type === 'recovery') {
          // Verify OTP then send user to the reset-password screen to enter new password
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' });
          if (!error) {
            await bootstrapSession();
            router.replace('/reset-password');
          }
        } else {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
          if (!error) await bootstrapSession();
        }
        return;
      }

      // Implicit flow (#access_token=...&refresh_token=...)
      const fragment = url.split('#')[1];
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          await bootstrapSession();
        }
      }
    }

    // App opened from closed state via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // App brought from background via deep link
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <AppWithHooks />
    </GestureHandlerRootView>
  );
}
