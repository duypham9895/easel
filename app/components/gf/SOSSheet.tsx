import { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SOS_OPTIONS } from '@/constants/sos';
import { SOSOption } from '@/types';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSend: (option: SOSOption) => void;
}

export function SOSSheet({ visible, onClose, onSend }: Props) {
  const slideAnim = useRef(new Animated.Value(600)).current;

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

  function handleSend(option: SOSOption) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSend(option);
    onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable>
            {/* Handle */}
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>What do you need right now?</Text>
              <Text style={styles.subtitle}>
                Send a signal — he will know exactly how to show up for you.
              </Text>
            </View>

            <View style={styles.grid}>
              {SOS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionCard}
                  onPress={() => handleSend(option)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.optionIconBg, { backgroundColor: option.color + '18' }]}>
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Maybe later</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingBottom: 40,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textHint + '60',
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
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  optionIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textHint,
  },
});
