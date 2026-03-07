import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type AuthMode = 'signIn' | 'signUp';

function getPasswordStrength(pwd: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pwd.length === 0) return { level: 0, label: '', color: 'transparent' };
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = (pwd.length >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (score <= 1) return { level: 1, label: i18n.t('auth:weak'), color: '#EF5350' };
  if (score === 2) return { level: 2, label: i18n.t('auth:fair'), color: '#FFB347' };
  return { level: 3, label: i18n.t('auth:strong'), color: '#4CAF50' };
}

function mapAuthError(msg: string): string {
  if (/rate.limit|too many/i.test(msg)) return i18n.t('auth:errorRateLimit');
  if (/invalid.*credentials|invalid login/i.test(msg)) return i18n.t('auth:errorInvalidCredentials');
  if (/email not confirmed/i.test(msg)) return i18n.t('auth:errorEmailNotConfirmed');
  if (/user not found/i.test(msg)) return i18n.t('auth:errorUserNotFound');
  return msg;
}

export default function AuthScreen() {
  const { t } = useTranslation('auth');
  const signIn = useAppStore((s) => s.signIn);
  const signUp = useAppStore((s) => s.signUp);
  const bootstrapSession = useAppStore((s) => s.bootstrapSession);

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = isValidEmail && password.length >= 6;

  const isValidResetEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim());

  useEffect(() => {
    if (mode !== 'signIn') { setShowBiometric(false); return; }
    (async () => {
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHw || !enrolled) return;
      const { data: { session } } = await supabase.auth.getSession();
      setShowBiometric(!!session);
    })();
  }, [mode]);

  async function handleSendResetLink() {
    if (!isValidResetEmail) return;
    setIsSendingReset(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
      if (resetError) throw resetError;
      setSuccessMsg(i18n.t('auth:resetLinkSent'));
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : i18n.t('auth:errorResetFailed');
      setError(mapAuthError(raw));
    } finally {
      setIsSendingReset(false);
    }
  }

  async function handleResendVerification() {
    setIsResending(true);
    setResendSuccess(false);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      if (error) throw error;
      setResendSuccess(true);
    } catch {
      // Silently fail — user can try again
    } finally {
      setIsResending(false);
    }
  }

  async function handleSubmit() {
    if (!isValid) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (mode === 'signIn') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      // If signUp returned but the user isn't logged in, email confirmation is pending
      if (mode === 'signUp' && !useAppStore.getState().isLoggedIn) {
        setPendingVerification(true);
        return;
      }
      // Read fresh role from store after signIn/signUp mutates it
      const freshRole = useAppStore.getState().role;
      if (freshRole) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : i18n.t('auth:errorGeneric');
      const msg = mapAuthError(raw);
      if (mode === 'signUp' && /already registered|already exists/i.test(msg)) {
        setError(i18n.t('auth:errorAlreadyExists'));
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBiometricSignIn() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: i18n.t('auth:biometricPrompt'),
      fallbackLabel: i18n.t('auth:biometricFallback'),
      cancelLabel: i18n.t('common:cancel'),
    });
    if (!result.success) return;
    setIsLoading(true);
    try {
      await bootstrapSession();
      const freshRole = useAppStore.getState().role;
      if (useAppStore.getState().isLoggedIn) {
        router.replace(freshRole ? '/(tabs)' : '/onboarding');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[Colors.menstrual + '22', 'transparent']}
          style={styles.ambientGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
        <View style={styles.verifyContainer}>
          <View style={styles.verifyIconCircle}>
            <Feather name="mail" size={40} color={Colors.menstrual} />
          </View>
          <Text style={styles.verifyTitle}>{t('checkInbox')}</Text>
          <Text style={styles.verifyBody}>
            {t('confirmationSent')}{'\n'}
            <Text style={styles.verifyEmail}>{email}</Text>
          </Text>
          <Text style={styles.verifyHint}>
            {t('confirmHint')}
          </Text>
          {resendSuccess ? (
            <Text style={styles.resendSuccessText}>{t('resendSuccess')}</Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendVerification}
              disabled={isResending}
              activeOpacity={0.7}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={Colors.menstrual} />
              ) : (
                <Text style={styles.resendLinkText}>{t('resend')}</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => {
              setPendingVerification(false);
              setMode('signIn');
              setPassword('');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.verifyButtonText}>{t('goToSignIn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Ambient glow */}
      <LinearGradient
        colors={[Colors.menstrual + '22', 'transparent']}
        style={styles.ambientGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Feather name="heart" size={36} color={Colors.menstrual} />
          </View>
          <Text style={styles.appName}>Easel</Text>
          <Text style={styles.tagline}>
            {mode === 'signIn'
              ? t('welcomeBack')
              : t('startJourney')}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputRow}>
            <Feather name="mail" size={18} color={Colors.textHint} />
            <TextInput
              style={styles.input}
              placeholder={t('emailAddress')}
              placeholderTextColor={Colors.textHint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color={Colors.textHint} />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder={t('password')}
              placeholderTextColor={Colors.textHint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={8}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textHint} />
            </TouchableOpacity>
          </View>

          {mode === 'signUp' && password.length > 0 && (() => {
            const strength = getPasswordStrength(password);
            return (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarRow}>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        { backgroundColor: i <= strength.level ? strength.color : Colors.inputBg },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            );
          })()}

          {mode === 'signIn' && (
            <>
              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => {
                  setShowForgotPassword(!showForgotPassword);
                  setError(null);
                  setSuccessMsg(null);
                  setResetEmail('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
              </TouchableOpacity>

              {showForgotPassword && (
                <View style={styles.forgotPasswordContainer}>
                  <View style={styles.inputRow}>
                    <Feather name="mail" size={18} color={Colors.textHint} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('enterEmail')}
                      placeholderTextColor={Colors.textHint}
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.resetButton, !isValidResetEmail && styles.submitButtonDisabled]}
                    onPress={handleSendResetLink}
                    disabled={!isValidResetEmail || isSendingReset}
                    activeOpacity={0.85}
                  >
                    {isSendingReset ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.resetButtonText}>{t('sendResetLink')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {showBiometric && mode === 'signIn' && (
            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricSignIn} activeOpacity={0.8}>
              <Feather name="shield" size={20} color={Colors.menstrual} />
              <Text style={styles.biometricText}>{t('biometricSignIn')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'signIn' ? t('signIn') : t('createAccount')}
              </Text>
            )}
          </TouchableOpacity>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          {successMsg && (
            <Text style={styles.successText}>{successMsg}</Text>
          )}
        </View>

        {/* Toggle mode */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {mode === 'signIn' ? t('noAccount') : t('hasAccount')}
          </Text>
          <TouchableOpacity onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
            <Text style={styles.footerLink}>
              {mode === 'signIn' ? t('signUp') : t('signIn')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  ambientGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    top: -100,
    left: -80,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.menstrual + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...Typography.displayBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 56,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  submitButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: Radii.lg,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  footerLink: {
    ...Typography.caption,
    color: Colors.menstrual,
    fontWeight: '700',
  },
  errorText: {
    ...Typography.caption,
    color: '#EF5350',
    textAlign: 'center',
  },
  successText: {
    ...Typography.caption,
    color: '#4CAF50',
    textAlign: 'center',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    ...Typography.caption,
    color: Colors.textHint,
  },
  forgotPasswordContainer: {
    gap: Spacing.sm,
  },
  resetButton: {
    backgroundColor: Colors.menstrual,
    borderRadius: Radii.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  verifyContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  verifyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.menstrual + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  verifyTitle: {
    ...Typography.titleBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  verifyBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  verifyEmail: {
    ...Typography.bodyBold,
    color: Colors.menstrual,
  },
  verifyHint: {
    ...Typography.caption,
    color: Colors.textHint,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  verifyButton: {
    backgroundColor: Colors.menstrual,
    borderRadius: Radii.lg,
    height: 60,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.menstrual,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  verifyButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
  },
  resendLinkText: {
    ...Typography.caption,
    color: Colors.menstrual,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  resendSuccessText: {
    ...Typography.caption,
    color: '#4CAF50',
    textAlign: 'center',
  },
  strengthContainer: {
    gap: Spacing.xs,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    ...Typography.tiny,
    textAlign: 'right',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  biometricText: {
    ...Typography.body,
    color: Colors.menstrual,
  },
});
