import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { CycleCalendarTokens, Spacing, Typography } from '@/constants/theme';

interface SaveToastProps {
  visible: boolean;
  variant: 'success' | 'error';
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

const AUTO_DISMISS_MS = 2500;

export function SaveToast({ visible, variant, message, onDismiss, onRetry }: SaveToastProps) {
  useEffect(() => {
    if (!visible || variant !== 'success') return;

    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible, variant, onDismiss]);

  const handlePress = useCallback(() => {
    if (variant === 'error' && onRetry) {
      onRetry();
    } else {
      onDismiss();
    }
  }, [variant, onRetry, onDismiss]);

  if (!visible) return null;

  const isSuccess = variant === 'success';
  const backgroundColor = isSuccess
    ? CycleCalendarTokens.toastSuccessBackground
    : CycleCalendarTokens.toastErrorBackground;
  const iconName = isSuccess ? 'check-circle' : 'alert-circle';

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={SlideOutUp.duration(300)}
      style={[styles.container, { backgroundColor }]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Feather name={iconName} size={20} color={CycleCalendarTokens.toastTextColor as string} style={styles.icon} />
        <Text style={styles.message} numberOfLines={1}>
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    maxWidth: '90%',
    borderRadius: 24,
    height: 48,
    zIndex: 9999,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  message: {
    ...Typography.bodyBold,
    color: CycleCalendarTokens.toastTextColor,
    flexShrink: 1,
  },
});
