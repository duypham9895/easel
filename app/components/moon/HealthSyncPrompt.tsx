import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const MOON = {
  background: '#0D1B2A',
  surface: '#1A2B3C',
  accentPrimary: '#B39DDB',
  accentSecondary: '#E0E0F0',
  textPrimary: '#F0F0FF',
  textSecondary: '#8899AA',
  textHint: '#4A5568',
  card: '#162233',
  inputBg: '#1E3045',
  border: '#2D4A6B',
};

interface Props {
  onSync: () => Promise<void>;
  onSkip: () => void;
}

export function HealthSyncPrompt({ onSync, onSkip }: Props) {
  const { t } = useTranslation('health');
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      await onSync();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.spacerTop} />

      {/* Icon */}
      <View style={styles.iconContainer}>
        <Feather name="moon" size={60} color={MOON.accentPrimary} />
      </View>

      <View style={styles.gap32} />

      {/* Headline */}
      <Text style={styles.headline}>
        {t('headline')}
      </Text>

      <View style={styles.gap16} />

      {/* Body */}
      <Text style={styles.body}>
        {t('body')}
      </Text>

      <View style={styles.gap48} />

      {/* Primary button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSync}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>{t('syncButton')}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.gap12} />

      {/* Skip */}
      <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>{t('skip')}</Text>
      </TouchableOpacity>

      <View style={styles.spacerBottom} />

      {/* Privacy note */}
      <View style={styles.privacyRow}>
        <Feather name="shield" size={12} color={MOON.textHint} />
        <Text style={styles.privacyText}>
          {t('privacy')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MOON.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spacerTop: {
    flex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: MOON.accentPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap12: {
    height: 12,
  },
  gap16: {
    height: 16,
  },
  gap32: {
    height: 32,
  },
  gap48: {
    height: 48,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: MOON.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: MOON.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryButton: {
    height: 60,
    backgroundColor: MOON.accentPrimary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '400',
    color: MOON.textHint,
    textAlign: 'center',
  },
  spacerBottom: {
    flex: 1,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 8,
  },
  privacyText: {
    fontSize: 11,
    fontWeight: '600',
    color: MOON.textHint,
  },
});
