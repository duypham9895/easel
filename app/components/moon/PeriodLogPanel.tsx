import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ScrollView, Modal, Pressable,
  Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/store/appStore';
import { FlowIntensitySelector } from '@/components/moon/FlowIntensitySelector';
import { SymptomChipGroup } from '@/components/moon/SymptomChipGroup';
import { TagPillGroup } from '@/components/moon/TagPillGroup';
import {
  Colors, CycleCalendarTokens, MoonColors, Spacing, Radii, Typography,
} from '@/constants/theme';
import { PHASE_INFO } from '@/constants/phases';
import { getCurrentPhase } from '@/utils/cycleCalculator';
import { notificationSuccess, impactMedium } from '@/utils/haptics';
import type {
  PeriodDayRecord, PeriodRecord, CalendarMarker,
  CycleSettings, FlowIntensity, PeriodSymptom, OverrideTag,
} from '@/types';

/* ── Constants ──────────────────────────────────────────────────────── */

const MOON = MoonColors;
const MAX_NOTE_LENGTH = 200;
const NOTE_MIN_HEIGHT = 88;
const MAX_PAST_DAYS = 30;
const NOTE_WARNING_THRESHOLD = 180;
const DAY_MS = 86_400_000;

const TAG_IDS: readonly OverrideTag[] = ['stress', 'illness', 'travel', 'medication', 'other'];

/* ── Props ──────────────────────────────────────────────────────────── */

interface PeriodLogPanelProps {
  visible: boolean;
  selectedDate: string;
  existingDayLog: PeriodDayRecord | null;
  existingPeriodLog: PeriodRecord | null;
  markers: Record<string, CalendarMarker>;
  cycleSettings: CycleSettings;
  onSave: () => void;
  onClose: () => void;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function computeDayInfo(
  dateString: string,
  lastPeriodStartDate: string,
  avgCycleLength: number,
  avgPeriodLength: number,
): { dayInCycle: number; phase: ReturnType<typeof getCurrentPhase> } {
  const start = new Date(lastPeriodStartDate);
  const target = new Date(dateString + 'T00:00:00');
  start.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const dayInCycle = diffDays < 0 ? 1 : diffDays + 1;
  const phase = getCurrentPhase(dayInCycle, avgCycleLength, avgPeriodLength);

  return { dayInCycle, phase };
}

function isFutureDate(dateString: string): boolean {
  const selected = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected.getTime() > today.getTime();
}

function isTooFarBack(dateString: string): boolean {
  const selected = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysDiff = Math.round((today.getTime() - selected.getTime()) / DAY_MS);
  return daysDiff > MAX_PAST_DAYS;
}

/* ── Component ──────────────────────────────────────────────────────── */

export function PeriodLogPanel({
  visible,
  selectedDate,
  existingDayLog,
  existingPeriodLog,
  markers: _markers,
  cycleSettings,
  onSave,
  onClose,
}: PeriodLogPanelProps) {
  const { t } = useTranslation('calendar');
  const { t: tCommon } = useTranslation('common');
  const { i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const slideAnim = useRef(new Animated.Value(600)).current;

  const savePeriodDayLog = useAppStore((s) => s.savePeriodDayLog);
  const removePeriodDayLog = useAppStore((s) => s.removePeriodDayLog);

  // ── Slide animation ──────────────────────────────────────────────
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

  // ── Local state ────────────────────────────────────────────────────
  const [selectedFlow, setSelectedFlow] = useState<FlowIntensity | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<PeriodSymptom>>(new Set());
  const [selectedTags, setSelectedTags] = useState<OverrideTag[]>([]);
  const [note, setNote] = useState('');

  // ── Initialize from existing day log ───────────────────────────────
  useEffect(() => {
    if (!visible) return;
    if (existingDayLog) {
      setSelectedFlow(existingDayLog.flowIntensity);
      setSelectedSymptoms(new Set(existingDayLog.symptoms));
      setNote(existingDayLog.notes ?? '');
    } else {
      setSelectedFlow('medium');
      setSelectedSymptoms(new Set());
      setNote('');
    }
    setSelectedTags(
      existingPeriodLog?.tags
        ? existingPeriodLog.tags.filter((t): t is OverrideTag =>
            TAG_IDS.includes(t as OverrideTag),
          )
        : [],
    );
  }, [visible, selectedDate, existingDayLog, existingPeriodLog]);

  // ── Derived values ─────────────────────────────────────────────────
  const formattedDate = useMemo(
    () => formatDate(selectedDate, locale),
    [selectedDate, locale],
  );

  const dayInfo = useMemo(
    () => computeDayInfo(
      selectedDate,
      cycleSettings.lastPeriodStartDate,
      cycleSettings.avgCycleLength,
      cycleSettings.avgPeriodLength,
    ),
    [selectedDate, cycleSettings],
  );

  const phaseInfo = PHASE_INFO[dayInfo.phase];
  const isFuture = isFutureDate(selectedDate);
  const tooFarBack = isTooFarBack(selectedDate);
  const hasDateError = isFuture || tooFarBack;
  const canSave = selectedFlow !== null && !hasDateError;
  const isEditing = existingDayLog !== null;

  // ── Handlers ───────────────────────────────────────────────────────
  const toggleTag = useCallback((tag: OverrideTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const toggleSymptom = useCallback((symptom: PeriodSymptom) => {
    setSelectedSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(symptom)) {
        next.delete(symptom);
      } else {
        next.add(symptom);
      }
      return next;
    });
  }, []);

  const updatePeriodTags = useAppStore((s) => s.updatePeriodTags);

  const handleSave = useCallback(async () => {
    if (!canSave || selectedFlow === null) return;

    impactMedium();
    try {
      await savePeriodDayLog(
        selectedDate,
        selectedFlow,
        Array.from(selectedSymptoms),
        note.trim() || undefined,
      );

      // Persist override tags to the period_log that contains this date
      if (selectedTags.length > 0 && existingPeriodLog) {
        await updatePeriodTags(existingPeriodLog.startDate, selectedTags);
      }

      notificationSuccess();
      onSave();
    } catch (error) {
      console.error('[PeriodLogPanel] save failed:', error);
      Alert.alert(tCommon('error'), tCommon('errorGeneric'));
    }
  }, [canSave, selectedFlow, selectedDate, selectedSymptoms, selectedTags, note, savePeriodDayLog, updatePeriodTags, onSave, tCommon, existingPeriodLog]);

  const handleDelete = useCallback(() => {
    if (!isEditing) return;

    impactMedium();
    Alert.alert(
      t('confirmDeleteDay'),
      t('confirmDeleteDayMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('deleteDay'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removePeriodDayLog(selectedDate);
              notificationSuccess();
              onSave();
            } catch (error) {
              console.error('[PeriodLogPanel] delete failed:', error);
              Alert.alert(tCommon('error'), tCommon('errorGeneric'));
            }
          },
        },
      ],
    );
  }, [isEditing, t, tCommon, selectedDate, removePeriodDayLog, onSave]);

  // ── Render ─────────────────────────────────────────────────────────
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
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.cycleBadge, { backgroundColor: phaseInfo.color + '22' }]}>
                        <Text style={[styles.cycleBadgeText, { color: phaseInfo.color }]}>
                          {t('cycleDay', { day: dayInfo.dayInCycle })}
                        </Text>
                      </View>
                      <Text style={[styles.phaseName, { color: phaseInfo.color }]}>
                        {phaseInfo.name}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={20} color={MOON.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Date validation error */}
                {hasDateError && (
                  <View style={styles.errorBanner}>
                    <Feather name="alert-circle" size={14} color={Colors.menstrual} />
                    <Text style={styles.errorText}>
                      {isFuture ? t('futureDateError') : t('tooFarBackError')}
                    </Text>
                  </View>
                )}

                {/* Flow Intensity */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('flowIntensity')}</Text>
                  <FlowIntensitySelector
                    selected={selectedFlow}
                    onSelect={setSelectedFlow}
                    disabled={hasDateError}
                  />
                </View>

                {/* Symptoms */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('symptoms')}</Text>
                  <SymptomChipGroup
                    selected={selectedSymptoms}
                    onToggle={toggleSymptom}
                    disabled={hasDateError}
                  />
                </View>

                {/* Factors */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('factors')}</Text>
                  <TagPillGroup
                    selected={selectedTags}
                    onToggle={toggleTag}
                    disabled={hasDateError}
                  />
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
                    editable={!hasDateError}
                  />
                  <Text style={[
                    styles.charCount,
                    note.length >= NOTE_WARNING_THRESHOLD && styles.charCountWarning,
                  ]}>
                    {note.length}/{MAX_NOTE_LENGTH}
                  </Text>
                </View>

                {/* Save button */}
                <View style={styles.saveSection}>
                  <TouchableOpacity
                    style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    activeOpacity={0.85}
                    disabled={!canSave}
                  >
                    <Text style={styles.saveButtonText}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Delete + Cancel row */}
                <View style={styles.bottomActions}>
                  {isEditing && (
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

/* ── Styles ─────────────────────────────────────────────────────────── */

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
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: MOON.accentPrimary + '40',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  dateText: {
    ...Typography.headlineBold,
    color: MOON.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cycleBadge: {
    borderRadius: Radii.full,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  cycleBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  phaseName: {
    ...Typography.caption,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MOON.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.menstrual + '14',
    borderRadius: Radii.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.menstrual,
    fontWeight: '600',
  },

  // Sections
  section: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: MOON.textPrimary,
  },

  // Notes
  noteInput: {
    backgroundColor: MOON.inputBg,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    ...Typography.body,
    color: MOON.textPrimary,
    minHeight: NOTE_MIN_HEIGHT,
    textAlignVertical: 'top',
  },
  charCount: {
    ...Typography.tiny,
    color: MOON.textHint,
    textAlign: 'right',
  },
  charCountWarning: {
    color: Colors.menstrual,
  },

  // Save
  saveSection: {
    paddingTop: Spacing.xs,
  },
  saveButton: {
    height: CycleCalendarTokens.saveButtonHeight,
    borderRadius: CycleCalendarTokens.saveButtonHeight / 2,
    backgroundColor: CycleCalendarTokens.saveButtonColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: CycleCalendarTokens.saveButtonDisabledOpacity,
  },
  saveButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 16,
  },

  // Bottom actions
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  deleteButtonText: {
    ...Typography.bodyBold,
    color: Colors.menstrual,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  cancelText: {
    ...Typography.body,
    color: MOON.textHint,
  },
});
