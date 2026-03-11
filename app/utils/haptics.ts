import { Platform } from 'react-native';

/**
 * Web-safe haptics wrapper.
 * On native, delegates to expo-haptics. On web, silently no-ops.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Haptics: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics');
}

export function notificationSuccess(): void {
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
}

export function impactMedium(): void {
  Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);
}
