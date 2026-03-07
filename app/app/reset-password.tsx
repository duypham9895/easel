import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';

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

export default function ResetPasswordScreen() {
  const { t } = useTranslation('auth');
  const bootstrapSession = useAppStore((s) => s.bootstrapSession);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const strength = getPasswordStrength(password);
  const isValid = password.length >= 8 && password === confirm;

  async function handleReset() {
    if (!isValid) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      // Re-hydrate store with fresh session
      await bootstrapSession();
      setTimeout(() => {
        const role = useAppStore.getState().role;
        router.replace(role ? '/(tabs)' : '/onboarding');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : i18n.t('auth:passwordUpdateFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[Colors.menstrual + '22', 'transparent']}
          style={styles.ambientGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
        <View style={styles.doneContainer}>
          <View style={styles.doneCircle}>
            <Feather name="check" size={40} color={Colors.menstrual} />
          </View>
          <Text style={styles.doneTitle}>{t('passwordUpdated')}</Text>
          <Text style={styles.doneBody}>{t('takingYouBack')}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[Colors.menstrual + '22', 'transparent']}
        style={styles.ambientGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Feather name="lock" size={36} color={Colors.menstrual} />
          </View>
          <Text style={styles.title}>{t('setNewPassword')}</Text>
          <Text style={styles.subtitle}>{t('chooseStrongPassword')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color={Colors.textHint} />
            <TextInput
              style={styles.input}
              placeholder={t('newPassword')}
              placeholderTextColor={Colors.textHint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={8}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textHint} />
            </TouchableOpacity>
          </View>

          {password.length > 0 && (() => {
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

          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color={Colors.textHint} />
            <TextInput
              style={styles.input}
              placeholder={t('confirmPassword')}
              placeholderTextColor={Colors.textHint}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />
          </View>

          {confirm.length > 0 && password !== confirm && (
            <Text style={styles.mismatchText}>{t('passwordsDontMatch')}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
            onPress={handleReset}
            disabled={!isValid || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>{t('updatePassword')}</Text>
            )}
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}
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
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.menstrual + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.titleBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
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
  strengthContainer: {
    gap: 4,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  mismatchText: {
    ...Typography.caption,
    color: '#EF5350',
    textAlign: 'center',
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
  errorText: {
    ...Typography.caption,
    color: '#EF5350',
    textAlign: 'center',
  },
  doneContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  doneCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.menstrual + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    ...Typography.titleBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  doneBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
