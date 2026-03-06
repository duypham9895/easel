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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const SUN = {
  background: '#FFF8F0',
  surface: '#FFFFFF',
  accentPrimary: '#F59E0B',
  accentSecondary: '#FF7043',
  textPrimary: '#1A1008',
  textSecondary: '#6B5B45',
  textHint: '#9C8B7A',
  card: '#FFFFFF',
  inputBg: '#FFF3E0',
  border: '#FFE0B2',
};

interface Props {
  onLink: (code: string) => Promise<void>;
  onInvite: () => void;
}

const BENEFITS = [
  'See their cycle in real time',
  'Know how to show up each day',
  'Get AI advice tailored to their phase',
  'Receive Whispers when they need you',
] as const;

export function UnlinkedScreen({ onLink, onInvite }: Props) {
  const [code, setCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    if (code.length !== 6 || linking) return;
    setError(null);
    setLinking(true);
    try {
      await onLink(code);
    } catch {
      setError('Invalid code. Please try again.');
    } finally {
      setLinking(false);
    }
  }

  function handleInvite() {
    Share.share({
      message:
        "I'm using Easel to understand and support you better. Download it and let's connect: https://easel.app",
    });
    onInvite();
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Feather name="link-2" size={48} color={SUN.accentPrimary} />
        </View>

        {/* Heading */}
        <View style={styles.headingGroup}>
          <Text style={styles.heading}>Find your Moon</Text>
          <Text style={styles.subheading}>
            Ask your partner to share their code with you
          </Text>
        </View>

        {/* Code input section */}
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>PARTNER CODE</Text>
          <TextInput
            style={[
              styles.codeInput,
              {
                borderColor:
                  code.length === 6 ? SUN.accentPrimary : SUN.border,
              },
            ]}
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              setError(null);
            }}
            maxLength={6}
            autoCapitalize="characters"
            keyboardType="default"
            placeholder="ABC123"
            placeholderTextColor={SUN.textHint}
          />
          {error !== null && (
            <Text style={styles.errorText}>{error}</Text>
          )}
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
        >
          {linking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.connectButtonText}>Connect</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Invite button */}
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={handleInvite}
          activeOpacity={0.85}
        >
          <Feather name="user-plus" size={16} color={SUN.accentPrimary} />
          <Text style={styles.inviteButtonText}>Invite your Moon</Text>
        </TouchableOpacity>

        {/* Benefits section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsLabel}>What linking unlocks</Text>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Feather name="check" size={14} color={SUN.accentPrimary} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
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
    paddingTop: 48,
    paddingBottom: 40,
    gap: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: SUN.accentPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headingGroup: {
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: SUN.textPrimary,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    fontWeight: '400',
    color: SUN.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  codeSection: {
    gap: 8,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: SUN.textHint,
    letterSpacing: 1,
  },
  codeInput: {
    height: 64,
    backgroundColor: SUN.surface,
    borderRadius: 20,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    borderWidth: 1.5,
    color: SUN.textPrimary,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF5350',
    textAlign: 'center',
  },
  connectButton: {
    height: 60,
    backgroundColor: SUN.accentPrimary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonDisabled: {
    opacity: 0.4,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: SUN.border,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
    color: SUN.textHint,
  },
  inviteButton: {
    height: 52,
    borderWidth: 1.5,
    borderColor: SUN.accentPrimary,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: SUN.accentPrimary,
  },
  benefitsSection: {
    gap: 8,
  },
  benefitsLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: SUN.textHint,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '500',
    color: SUN.textSecondary,
  },
});
