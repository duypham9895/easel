import * as LocalAuthentication from 'expo-local-authentication';

export async function checkBiometricAvailability(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function promptBiometric(message = 'Authenticate to continue'): Promise<boolean> {
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
