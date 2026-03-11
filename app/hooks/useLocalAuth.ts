import { Platform } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LocalAuthentication: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LocalAuthentication = require('expo-local-authentication');
}

export async function checkBiometricAvailability(): Promise<boolean> {
  if (!LocalAuthentication) return false;
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function promptBiometric(message = 'Authenticate to continue'): Promise<boolean> {
  if (!LocalAuthentication) return false;
  const available = await checkBiometricAvailability();
  if (!available) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: message,
    fallbackLabel: 'Use password',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}
