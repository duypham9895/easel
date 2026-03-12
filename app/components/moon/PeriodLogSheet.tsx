import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Animated, Alert, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { MoonColors, Spacing, Radii, Typography, Colors } from '@/constants/theme';
import { notificationSuccess, impactMedium } from '@/utils/haptics';
import type { PeriodRecord, OverrideTag, CalendarMarker } from '@/types';

const MOON = MoonColors;
const DAY_MS = 86_400_000;
const MAX_PAST_DAYS = 30;
const DEDUP_WINDOW_DAYS = 2;
const MAX_NOTE_LENGTH = 200;

/* ── Tag definitions ─────────────────────────────────────────────────── */

interface TagDef {
  id: OverrideTag;
  icon: React.ComponentProps<typeof Feather>['name'];
}

const TAG_DEFS: readonly TagDef[] = [
  { id: 'stress', icon: 'zap' },
  { id: 'illness', icon: 'thermometer' },
  { id: 'travel', icon: 'map-pin' },
  { id: 'medication', icon: 'activity' },
  { id: 'other', icon: 'more-horizontal' },
] as const;

/* ── Props ───────────────────────────────────────────────────────────── */

interface Props {
  visible: boolean;
  selectedDate: string; // ISO date YYYY-MM-DD
  existingLog?: PeriodRecord;
  markers: Record<string, CalendarMarker>;
  onClose: () => void;
  onSave: () => void;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function formatDateDisplay(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function validateDate(
  selectedDate: string,
  periodLogs: ReadonlyArray<{ startDate: string; endDate?: string }>,
  existingLog?: PeriodRecord,
): 'futureDate' | 'tooFarBack' | 'overlap' | null {
  const selectedMs = new Date(selectedDate + 'T00:00:00').getTime();
  const todayMs = new Date();
  todayMs.setHours(0, 0, 0, 0);

  if (selectedMs > todayMs.getTime()) {
    return 'futureDate';
  }

  const daysDiff = Math.round((todayMs.getTime() - selectedMs) / DAY_MS);
  if (daysDiff > MAX_PAST_DAYS) {
    return 'tooFarBack';
  }

  // Skip overlap check if editing an existing log
  if (!existingLog) {
    for (const log of periodLogs) {
      const logMs = new Date(log.startDate + 'T00:00:00').getTime();
      const distance = Math.abs(selectedMs - logMs) / DAY_MS;
      if (distance <= DEDUP_WINDOW_DAYS) {
        return 'overlap';
      }
    }
  }

  return null;
}

function isWithinActivePeriod(
  dateString: string,
  periodLogs: ReadonlyArray<PeriodRecord>,
): PeriodRecord | null {
  const dateMs = new Date(dateString + 'T00:00:00').getTime();
  for (const log of periodLogs) {
    const startMs = new Date(log.startDate + 'T00:00:00').getTime();
    if (!log.endDate && dateMs >= startMs) {
      return log;
    }
    if (log.endDate) {
      const endMs = new Date(log.endDate + 'T00:00:00').getTime();
      if (dateMs >= startMs && dateMs <= endMs) {
        return log;
      }
    }
  }
  return null;
}

/* ── Component ───────────────────────────────────────────────────────── */

export function PeriodLogSheet({
  visible,
  selectedDate,
  existingLog,
  markers,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation('calendar');
  const { t: tHealth } = useTranslation('health');
  const { t: tCommon } = useTranslation('common');
  const { i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const slideAnim = useRef(new Animated.Value(600)).current;
  const periodLogs = useAppStore((s) => s.periodLogs);
  const addPeriodLog = useAppStore((s) => s.addPeriodLog);
  const removePeriodLog = useAppStore((s) => s.removePeriodLog);

  // Local editing state — tags and notes
  const [selectedTags, setSelectedTags] = useState<OverrideTag[]>([]);
  const [note, setNote] = useState('');

  // Reset local state when sheet opens with new date
  useEffect(() => {
    if (visible) {
      setSelectedTags(
        existingLog?.tags
          ? (existingLog.tags.filter((t): t is OverrideTag =>
              TAG_DEFS.some((d) => d.id === t),
            ))
          : [],
      );
      setNote('');
    }
  }, [visible, existingLog, selectedDate]);

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
  }, [visible, slideAnim]);

  const formattedDate = useMemo(
    () => formatDateDisplay(selectedDate, locale),
    [selectedDate, locale],
  );

  const validationError = useMemo(
    () => validateDate(selectedDate, periodLogs, existingLog),
    [selectedDate, periodLogs, existingLog],
  );

  const activePeriod = useMemo(
    () => isWithinActivePeriod(selectedDate, periodLogs),
    [selectedDate, periodLogs],
  );

  const marker = markers[selectedDate] ?? null;
  const isExistingPeriod = !!existingLog || !!activePeriod;

  const toggleTag = useCallback((tag: OverrideTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag],
    );
  }, []);

  const handleLogStart = useCallback(() => {
    if (validationError) {
      Alert.alert(
        tCommon('error'),
        tHealth(`periodLog.validation.${validationError}`),
      );
      return;
    }

    impactMedium();
    Alert.alert(
      tHealth('periodLog.periodStarted'),
      tHealth('periodLog.confirmStart', { date: formattedDate }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: async () => {
            await addPeriodLog(
              selectedDate,
              undefined,
              selectedTags.length > 0 ? selectedTags : undefined,
            );
            notificationSuccess();
            onSave();
          },
        },
      ],
    );
  }, [validationError, t, tCommon, tHealth, formattedDate, addPeriodLog, selectedDate, selectedTags, onSave]);

  const handleEndPeriod = useCallback(() => {
    const target = activePeriod ?? existingLog;
    if (!target) return;

    impactMedium();
    Alert.alert(
      tHealth('periodLog.periodEnded'),
      tHealth('periodLog.confirmEnd', { date: formattedDate }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: async () => {
            await addPeriodLog(target.startDate, selectedDate);
            notificationSuccess();
            onSave();
          },
        },
      ],
    );
  }, [activePeriod, existingLog, t, tHealth, formattedDate, addPeriodLog, selectedDate, onSave]);

  const handleDelete = useCallback(() => {
    const target = existingLog ?? activePeriod;
    if (!target) return;

    impactMedium();
    Alert.alert(
      t('confirmDelete'),
      t('confirmDeleteMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await removePeriodLog(target.startDate);
            notificationSuccess();
            onSave();
          },
        },
      ],
    );
  }, [existingLog, activePeriod, t, removePeriodLog, onSave]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <Pressable>
              {/* Handle */}
              <View style={styles.handle} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Selected date header */}
                <View style={styles.header}>
                  <Feather name="calendar" size={22} color={Colors.menstrual} />
                  <Text style={styles.dateText}>{formattedDate}</Text>
                </View>

                {/* Marker info if present */}
                {marker && (
                  <View style={[styles.markerBadge, { backgroundColor: markerColor(marker.type) + '18' }]}>
                    <Feather name="info" size={13} color={markerColor(marker.type)} />
                    <Text style={[styles.markerText, { color: markerColor(marker.type) }]}>
                      {getMarkerLabel(marker, t)}
                    </Text>
                  </View>
                )}

                {/* Period logging actions */}
                <View style={styles.actionsRow}>
                  {!isExistingPeriod && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleLogStart}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.actionIconBg, { backgroundColor: Colors.menstrual + '18' }]}>
                        <Feather name="droplet" size={22} color={Colors.menstrual} />
                      </View>
                      <Text style={styles.actionLabel}>{t('logPeriodStart')}</Text>
                    </TouchableOpacity>
                  )}

                  {isExistingPeriod && !(existingLog?.endDate ?? activePeriod?.endDate) && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleEndPeriod}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.actionIconBg, { backgroundColor: Colors.follicular + '18' }]}>
                        <Feather name="check-circle" size={22} color={Colors.follicular} />
                      </View>
                      <Text style={styles.actionLabel}>{t('endPeriodHere')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Override Tags */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('factors')}</Text>
                  <Text style={styles.sectionSubtitle}>{t('factorsSubtitle')}</Text>
                  <View style={styles.tagsRow}>
                    {TAG_DEFS.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <TouchableOpacity
                          key={tag.id}
                          style={[
                            styles.tagPill,
                            isSelected ? styles.tagPillSelected : styles.tagPillUnselected,
                          ]}
                          onPress={() => toggleTag(tag.id)}
                          activeOpacity={0.7}
                        >
                          <Feather
                            name={tag.icon}
                            size={14}
                            color={isSelected ? Colors.white : Colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.tagLabel,
                              isSelected ? styles.tagLabelSelected : styles.tagLabelUnselected,
                            ]}
                          >
                            {t(tag.id)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('addNote')}</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder={t('notePlaceholder')}
                    placeholderTextColor={MOON.textHint}
                    value={note}
                    onChangeText={(text) => setNote(text.slice(0, MAX_NOTE_LENGTH))}
                    maxLength={MAX_NOTE_LENGTH}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>
                    {note.length}/{MAX_NOTE_LENGTH}
                  </Text>
                </View>

                {/* Action buttons */}
                <View style={styles.bottomActions}>
                  {isExistingPeriod && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={handleDelete}
                      activeOpacity={0.85}
                    >
                      <Feather name="trash-2" size={16} color={Colors.menstrual} />
                      <Text style={styles.deleteButtonText}>{t('delete')}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.cancelText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/* ── Label helpers ───────────────────────────────────────────────────── */

type TFn = (key: string) => string;

function getMarkerLabel(marker: CalendarMarker, t: TFn): string {
  if (marker.type === 'period') {
    return marker.source === 'logged' ? t('periodLogged') : t('predictedPeriodDay');
  }
  if (marker.type === 'ovulation') return t('ovulationDay');
  return t('fertileWindow');
}

function markerColor(type: 'period' | 'ovulation' | 'fertile'): string {
  if (type === 'period') return Colors.menstrual;
  if (type === 'ovulation') return Colors.ovulatory;
  return Colors.follicular;
}

/* ── Styles ──────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: MOON.overlay,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: MOON.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingBottom: 40,
    maxHeight: '85%',
    shadowColor: MOON.black,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: MOON.accentPrimary + '40',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  dateText: {
    ...Typography.headlineBold,
    color: MOON.textPrimary,
    textAlign: 'center',
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  markerText: {
    ...Typography.caption,
    fontWeight: '600',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: MOON.card,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
    textAlign: 'center',
    fontSize: 14,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: MOON.textSecondary,
    marginBottom: Spacing.xs,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    height: 36,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
  },
  tagPillSelected: {
    backgroundColor: Colors.accent,
  },
  tagPillUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: MOON.textHint + '60',
  },
  tagLabel: {
    ...Typography.caption,
  },
  tagLabelSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  tagLabelUnselected: {
    color: MOON.textSecondary,
  },

  // Notes
  noteInput: {
    backgroundColor: MOON.inputBg,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    ...Typography.body,
    color: MOON.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    ...Typography.tiny,
    color: MOON.textHint,
    textAlign: 'right',
  },

  // Bottom actions
  bottomActions: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.menstrual + '18',
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  deleteButtonText: {
    ...Typography.bodyBold,
    color: Colors.menstrual,
  },
  cancelButton: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    color: MOON.textHint,
    textAlign: 'center',
  },
});
