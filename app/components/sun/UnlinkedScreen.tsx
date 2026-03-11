import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Share,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { notificationSuccess } from '@/utils/haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import { SunColors, SharedColors } from '@/constants/theme';

const SUN = SunColors;

interface Props {
  onLink: (code: string) => Promise<void>;
  onInvite: () => void;
}

export function UnlinkedScreen({ onLink, onInvite }: Props) {
  const { t } = useTranslation('partner');

  const BENEFITS = [
    { icon: 'eye' as const, title: t('benefitEyeTitle'), description: t('benefitEyeDesc') },
    { icon: 'zap' as const, title: t('benefitZapTitle'), description: t('benefitZapDesc') },
    { icon: 'bell' as const, title: t('benefitBellTitle'), description: t('benefitBellDesc') },
    { icon: 'heart' as const, title: t('benefitHeartTitle'), description: t('benefitHeartDesc') },
  ];
  const [code, setCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    if (code.length !== 6 || linking) return;
    setError(null);
    setLinking(true);
    try {
      await onLink(code);
      // Success — celebrate with a strong haptic before the dashboard replaces this screen
      notificationSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
        setError(t('errorNetwork'));
      } else if (msg.includes('expired')) {
        setError(t('errorExpired'));
      } else if (msg.includes('already been used')) {
        setError(t('errorAlreadyUsed'));
      } else if (msg.includes('yourself')) {
        setError(t('errorOwnCode'));
      } else {
        setError(t('errorInvalidCode'));
      }
    } finally {
      setLinking(false);
    }
  }

  function handleInvite() {
    Share.share({
      message: i18n.t('partner:inviteMessage'),
    });
    onInvite();
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Feather name="sun" size={44} color={SUN.accentPrimary} />
          </View>
          <Text style={styles.heading}>{t('bePartner')}</Text>
          <Text style={styles.subheading}>
            {t('heroSubtitle')}
          </Text>
        </View>

        {/* Benefit cards */}
        <View style={styles.benefitsSection}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.title} style={styles.benefitCard}>
              <View style={styles.benefitIconWrap}>
                <Feather name={benefit.icon} size={20} color={SUN.accentPrimary} />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('connectWithPartner')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Partner code input */}
        <View style={styles.codeSection}>
          <View style={styles.codeLabelRow}>
            <Feather name="link-2" size={13} color={SUN.textHint} />
            <Text style={styles.codeLabel}>{t('enterCode')}</Text>
          </View>
          <TextInput
            style={[
              styles.codeInput,
              { borderColor: code.length === 6 ? SUN.accentPrimary : SUN.border },
            ]}
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/\D/g, ''));
              setError(null);
            }}
            maxLength={6}
            autoCapitalize="none"
            keyboardType="number-pad"
            placeholder="000000"
            placeholderTextColor={SUN.textHint}
            accessibilityLabel={t('enterCode')}
          />
          <Text style={styles.codeHint}>
            {t('codeHint')}
          </Text>
          {error !== null && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Connect button */}
        <TouchableOpacity
          style={[
            styles.connectButton,
            (code.length !== 6 || linking) && styles.connectButtonDisabled,
          ]}
          onPress={handleConnect}
          activeOpacity={0.85}
          disabled={code.length !== 6 || linking}
          accessible={true}
          accessibilityRole="button"
        >
          {linking ? (
            <ActivityIndicator color={SUN.white} />
          ) : (
            <>
              <Feather name="link-2" size={16} color={SUN.white} />
              <Text style={styles.connectButtonText}>{t('connectToHer')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Invite section */}
        <View style={styles.inviteSection}>
          <Text style={styles.inviteHint}>
            {t('noEaselYet')}
          </Text>
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={handleInvite}
            activeOpacity={0.85}
            accessible={true}
            accessibilityRole="button"
          >
            <Feather name="user-plus" size={16} color={SUN.accentPrimary} />
            <Text style={styles.inviteButtonText}>{t('inviteHer')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SUN.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
    gap: 28,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: SUN.accentPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: SUN.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '400',
    color: SUN.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsSection: {
    gap: 12,
  },
  benefitCard: {
    backgroundColor: SUN.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: SUN.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SUN.accentPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitText: {
    flex: 1,
    gap: 3,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: SUN.textPrimary,
  },
  benefitDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: SUN.textSecondary,
    lineHeight: 19,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: SUN.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: SUN.textHint,
    letterSpacing: 0.3,
  },
  codeSection: {
    gap: 8,
  },
  codeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SUN.textHint,
    letterSpacing: 1,
  },
  codeInput: {
    height: 68,
    backgroundColor: SUN.surface,
    borderRadius: 20,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
    borderWidth: 1.5,
    color: SUN.textPrimary,
  },
  codeHint: {
    fontSize: 12,
    fontWeight: '400',
    color: SUN.textHint,
    textAlign: 'center',
    lineHeight: 17,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: SharedColors.error,
    textAlign: 'center',
  },
  connectButton: {
    height: 60,
    backgroundColor: SUN.accentPrimary,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectButtonDisabled: {
    opacity: 0.4,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: SUN.white,
  },
  inviteSection: {
    alignItems: 'center',
    gap: 10,
  },
  inviteHint: {
    fontSize: 13,
    fontWeight: '400',
    color: SUN.textHint,
  },
  inviteButton: {
    height: 52,
    paddingHorizontal: 28,
    borderWidth: 1.5,
    borderColor: SUN.accentPrimary,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: SUN.accentPrimary,
  },
});
