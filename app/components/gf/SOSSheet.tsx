import { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { notificationSuccess } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';
import { SOS_OPTIONS } from '@/constants/sos';
import { SOSOption } from '@/types';
import { MoonColors, Spacing, Radii, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSend: (option: SOSOption) => void;
}

export function SOSSheet({ visible, onClose, onSend }: Props) {
  const { t } = useTranslation('signals');
  const { t: tCommon } = useTranslation('common');
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
    notificationSuccess();
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
              <Text style={styles.title}>{t('whatDoYouNeed')}</Text>
              <Text style={styles.subtitle}>
                {t('sendSignal')}
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
                    <Feather name={option.icon as any} size={28} color={option.color} />
                  </View>
                  <Text style={styles.optionTitle}>{t(`sos_${option.id}_title`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>{tCommon('maybeLater')}</Text>
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
    backgroundColor: MoonColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: MoonColors.background,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingBottom: 40,
    shadowColor: MoonColors.black,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: MoonColors.textHint + '60',
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
    color: MoonColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: MoonColors.textSecondary,
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
    backgroundColor: MoonColors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: MoonColors.black,
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
  optionTitle: {
    ...Typography.bodyBold,
    color: MoonColors.textPrimary,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.body,
    color: MoonColors.textHint,
  },
});
