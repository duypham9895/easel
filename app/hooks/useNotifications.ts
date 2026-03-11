import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store/appStore';

const isWeb = Platform.OS === 'web';

// Native-only imports — skip on web where expo-notifications is unavailable
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

if (!isWeb) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Device = require('expo-device');

  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Register for push notifications (native or web), save the token/subscription
 * to the DB, and wire up tap listeners.
 *
 * - Native: Expo Push via expo-notifications
 * - Web: Web Push API via service worker + VAPID
 */
export function useNotifications() {
  const { isLoggedIn, registerPushToken } = useAppStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tapListenerRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    if (isWeb) {
      // Web Push registration
      (async () => {
        const subscription = await registerWebPush();
        if (!cancelled && subscription) {
          // Store the full subscription JSON as the "token"
          await registerPushToken(JSON.stringify(subscription)).catch((err) =>
            console.warn('[useNotifications] failed to save web push subscription:', err)
          );
        }
      })();
    } else if (Notifications) {
      // Native Push registration
      (async () => {
        const token = await requestNativeToken();
        if (!cancelled && token) {
          await registerPushToken(token).catch((err) =>
            console.warn('[useNotifications] failed to save token:', err)
          );
        }
      })();

      tapListenerRef.current = Notifications.addNotificationResponseReceivedListener(
        () => { router.replace('/(tabs)'); }
      );
    }

    return () => {
      cancelled = true;
      tapListenerRef.current?.remove();
    };
  }, [isLoggedIn]);
}

// ── Web Push ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerWebPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[useNotifications] Web Push not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('[useNotifications] VAPID public key not set.');
      return null;
    }

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) return subscription;

    // Request new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    console.log('[useNotifications] Web Push subscription created.');
    return subscription;
  } catch (err) {
    console.warn('[useNotifications] Web Push registration failed:', err);
    return null;
  }
}

// ── Native Push (Expo) ────────────────────────────────────────────────────────

async function requestNativeToken(): Promise<string | null> {
  if (!Notifications || !Device) return null;

  if (!Device.isDevice) {
    console.warn('[useNotifications] Push notifications require a real device.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Promise.all([
      Notifications.setNotificationChannelAsync('whisper', {
        name: 'Whisper',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#B39DDB',
        sound: 'default',
      }),
      Notifications.setNotificationChannelAsync('cycle', {
        name: 'Cycle Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150],
        lightColor: '#F48FB1',
        sound: 'default',
      }),
      Notifications.setNotificationChannelAsync('sos', {
        name: 'SOS Signals',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F28B82',
        sound: 'default',
      }),
    ]);
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

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) {
    console.warn('[useNotifications] EXPO_PUBLIC_EAS_PROJECT_ID is not set.');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}
