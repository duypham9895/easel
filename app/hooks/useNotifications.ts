import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAppStore } from '@/store/appStore';

/**
 * Set the global notification handler once (module level).
 * Controls how notifications behave when the app is in the foreground:
 * - shouldShowAlert: show the banner even if app is open
 * - shouldPlaySound: play the default SOS chime
 * - shouldSetBadge: we manage badge count ourselves
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register for push notifications, save the Expo push token to the DB,
 * and wire up a tap listener so tapping a notification when the app is
 * closed/backgrounded routes the user to the right screen.
 *
 * Call this once at the root layout — it runs after login.
 */
export function useNotifications() {
  const { isLoggedIn, registerPushToken } = useAppStore();
  const tapListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    (async () => {
      const token = await requestPermissionsAndGetToken();
      if (!cancelled && token) {
        await registerPushToken(token).catch((err) =>
          console.warn('[useNotifications] failed to save token:', err)
        );
      }
    })();

    // Handle notification tap — app was in background or closed
    tapListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // The `data` field comes from the Edge Function payload
        const data = response.notification.request.content.data as {
          type?: string;
          coupleId?: string;
        };
        // You can use expo-router here to deep-link into the SOS screen:
        // router.replace('/(tabs)'); — keep it simple for now
        console.log('[useNotifications] notification tapped:', data);
      }
    );

    return () => {
      cancelled = true;
      tapListenerRef.current?.remove();
    };
  }, [isLoggedIn]);
}

async function requestPermissionsAndGetToken(): Promise<string | null> {
  // Push notifications don't work on simulators — real device only
  if (!Device.isDevice) {
    console.warn('[useNotifications] Push notifications require a real device.');
    return null;
  }

  // Set up the SOS notification channel on Android (required for Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sos', {
      name: 'SOS Signals',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F28B82',
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[useNotifications] Push permission denied.');
    return null;
  }

  // projectId is required for the modern Expo push token format.
  // Get it from: Expo Dashboard → Project → Project ID
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) {
    console.warn('[useNotifications] EXPO_PUBLIC_EAS_PROJECT_ID is not set.');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}
