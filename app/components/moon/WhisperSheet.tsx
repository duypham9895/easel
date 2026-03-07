import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CyclePhase, SOSOption } from '@/types';
import { Spacing, Radii, Typography } from '@/constants/theme';
import { useAIWhisperOptions } from '@/hooks/useAIWhisperOptions';

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
  visible: boolean;
  onClose: () => void;
  onSend: (option: SOSOption) => void;
  phase: CyclePhase;
  dayInCycle: number;
}

export function WhisperSheet({ visible, onClose, onSend, phase, dayInCycle }: Props) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [customInput, setCustomInput] = useState('');
  const [sent, setSent] = useState(false);
  const [sentOption, setSentOption] = useState<SOSOption | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!visible) {
      setSent(false);
      setSentOption(null);
      setCustomInput('');
      pulseAnim.setValue(1);
      checkOpacity.setValue(0);
    }
  }, [visible]);

  const { options, isAI } = useAIWhisperOptions(phase, dayInCycle);

  function animateSentState() {
    Animated.timing(checkOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }

  function handleClose() {
    setSent(false);
    setSentOption(null);
    setCustomInput('');
    pulseAnim.setValue(1);
    checkOpacity.setValue(0);
    onClose();
  }

  function handleSend(option: SOSOption) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSentOption(option);
    setSent(true);
    animateSentState();
    onSend(option);
    setTimeout(() => {
      handleClose();
    }, 2500);
  }

  function handleSendCustom() {
    if (!customInput.trim()) return;
    const customOption: SOSOption = {
      id: `custom_${Date.now()}`,
      title: customInput.trim(),
      icon: 'message-circle',
      color: MOON.accentPrimary,
      description: customInput.trim(),
    };
    handleSend(customOption);
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable>
            {/* Handle */}
            <View style={styles.handle} />

            {sent && sentOption ? (
              /* ── Success state ──────────────────────────────── */
              <View style={styles.successContainer}>
                <Animated.View
                  style={[
                    styles.successCircle,
                    {
                      backgroundColor: sentOption.color + '22',
                      borderColor: sentOption.color + '55',
                      transform: [{ scale: pulseAnim }],
                      opacity: checkOpacity,
                    },
                  ]}
                >
                  <Feather name="check" size={48} color={sentOption.color} />
                </Animated.View>

                <Animated.View style={[styles.successTextGroup, { opacity: checkOpacity }]}>
                  <Text style={styles.successTitle}>Whispered to your Sun</Text>
                  <View style={[styles.sentOptionChip, { backgroundColor: sentOption.color + '20' }]}>
                    <Feather name={sentOption.icon as any} size={14} color={sentOption.color} />
                    <Text style={[styles.sentOptionText, { color: sentOption.color }]}>
                      {sentOption.title}
                    </Text>
                  </View>
                  <Text style={styles.successHint}>He'll know what to do.</Text>
                </Animated.View>
              </View>
            ) : (
              /* ── Normal content ─────────────────────────────── */
              <>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>What do you need?</Text>
                  <Text style={styles.subtitle}>
                    {isAI ? 'Personalized for your phase ✦ AI' : 'Whisper it to your Sun'}
                  </Text>
                </View>

                {/* Options grid */}
                <View style={styles.grid}>
                  {options.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.optionCard}
                      onPress={() => handleSend(option)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.optionIconBg,
                          { backgroundColor: option.color + '18' },
                        ]}
                      >
                        <Feather name={option.icon as any} size={28} color={option.color} />
                      </View>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom input row */}
                <View style={styles.customRow}>
                  <View style={styles.customInputContainer}>
                    <TextInput
                      style={styles.customInput}
                      placeholder="Something else..."
                      placeholderTextColor={MOON.textHint}
                      value={customInput}
                      onChangeText={setCustomInput}
                      returnKeyType="send"
                      onSubmitEditing={handleSendCustom}
                    />
                    {customInput.length > 0 && (
                      <TouchableOpacity
                        onPress={handleSendCustom}
                        activeOpacity={0.75}
                      >
                        <Feather name="send" size={18} color={MOON.accentPrimary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Cancel */}
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelText}>Maybe later</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: MOON.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingBottom: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: MOON.accentPrimary + '40',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: MOON.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: MOON.textSecondary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '47%',
    backgroundColor: MOON.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
    textAlign: 'center',
  },
  customRow: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  customInputContainer: {
    flexDirection: 'row',
    backgroundColor: MOON.background,
    borderRadius: Radii.md,
    height: 52,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  customInput: {
    flex: 1,
    color: MOON.textPrimary,
    fontSize: 16,
  },
  cancelButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    color: MOON.textHint,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
    minHeight: 280,
    justifyContent: 'center',
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTextGroup: {
    alignItems: 'center',
    gap: 6,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: MOON.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sentOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sentOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  successHint: {
    ...Typography.body,
    color: MOON.textHint,
    textAlign: 'center',
  },
});
