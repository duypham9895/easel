import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type AuthMode = 'signIn' | 'signUp';

export default function AuthScreen() {
  const signIn = useAppStore((s) => s.signIn);
  const signUp = useAppStore((s) => s.signUp);

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = isValidEmail && password.length >= 6;

  const isValidResetEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim());

  async function handleSendResetLink() {
    if (!isValidResetEmail) return;
    setIsSendingReset(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());
      if (resetError) throw resetError;
      setSuccessMsg('Check your email for a reset link.');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link.');
    } finally {
      setIsSendingReset(false);
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
        setError('Check your email to confirm your account before signing in.');
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
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
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
              ? 'Welcome back.'
              : 'Start your journey together.'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputRow}>
            <Feather name="mail" size={18} color={Colors.textHint} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={Colors.textHint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color={Colors.textHint} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textHint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

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
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              {showForgotPassword && (
                <View style={styles.forgotPasswordContainer}>
                  <View style={styles.inputRow}>
                    <Feather name="mail" size={18} color={Colors.textHint} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
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
                      <Text style={styles.resetButtonText}>Send reset link</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
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
                {mode === 'signIn' ? 'Sign In' : 'Create Account'}
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
            {mode === 'signIn' ? "Don't have an account? " : 'Already have one? '}
          </Text>
          <TouchableOpacity onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
            <Text style={styles.footerLink}>
              {mode === 'signIn' ? 'Sign Up' : 'Sign In'}
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
});
