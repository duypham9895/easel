import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MoonColors, Spacing, Radii, Typography } from '@/constants/theme';
import { CyclePhase } from '@/types';
import { useAIDailyInsight } from '@/hooks/useAIDailyInsight';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/lib/supabase';

interface Props {
  phase: CyclePhase;
  dayInCycle: number;
  accentColor: string;
}

export function DailyCheckIn({ phase, dayInCycle, accentColor }: Props) {
  const { t } = useTranslation('checkin');
  const { userId } = useAppStore();

  const MOOD_OPTIONS = [
    { value: 1, label: t('moodLow') },
    { value: 2, label: t('moodMeh') },
    { value: 3, label: t('moodOkay') },
    { value: 4, label: t('moodGood') },
    { value: 5, label: t('moodGreat') },
  ];

  const SYMPTOM_OPTIONS = [
    { key: 'Cramps', label: t('cramps') },
    { key: 'Bloating', label: t('bloating') },
    { key: 'Headache', label: t('headache') },
    { key: 'Fatigue', label: t('fatigue') },
    { key: 'Tender', label: t('tender') },
    { key: 'Mood swings', label: t('moodSwings') },
    { key: 'Spotting', label: t('spotting') },
    { key: 'Cravings', label: t('cravings') },
  ];

  const [mood, setMood] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { insight, isLoading: insightLoading, fetchInsight } = useAIDailyInsight(phase, dayInCycle);

  // On mount, check if user already logged today — restore their state + fetch insight
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const today = new Date().toISOString().split('T')[0];
    (async () => {
      const { data } = await supabase
        .from('daily_logs')
        .select('mood, symptoms')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle();

      if (isMounted && data) {
        setMood(data.mood ?? null);
        setSymptoms(data.symptoms ?? []);
        setSubmitted(true);
        // Fetch insight for the restored log so returning users see it too
        await fetchInsight(data.mood ?? null, data.symptoms ?? []);
      }
    })();
    return () => { isMounted = false; };
  }, [userId, fetchInsight]);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit() {
    if (!userId) {
      setSaveError(t('sessionError'));
      return;
    }
    setSaving(true);
    setSaveError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('daily_logs').upsert(
        {
          user_id: userId,
          log_date: today,
          mood: mood ?? null,
          symptoms: symptoms.length > 0 ? symptoms : null,
        },
        { onConflict: 'user_id,log_date' }
      );

      if (error) throw error;

      setSubmitted(true);
      // Fetch AI insight immediately after saving
      await fetchInsight(mood, symptoms);
    } catch (err) {
      console.warn('[DailyCheckIn] save failed:', err);
      setSaveError(t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('title')}</Text>

      {!submitted ? (
        <>
          {/* Mood row */}
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.moodButton,
                  mood === opt.value && { borderColor: accentColor, borderWidth: 2 },
                ]}
                onPress={() => setMood(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.moodValue}>{opt.value}</Text>
                <Text style={styles.moodLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Symptom chips */}
          <View style={styles.symptomsGrid}>
            {SYMPTOM_OPTIONS.map((s) => {
              const active = symptoms.includes(s.key);
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.symptomChip,
                    active && { backgroundColor: accentColor + '22', borderColor: accentColor },
                  ]}
                  onPress={() => toggleSymptom(s.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.symptomText, active && { color: accentColor, fontWeight: '700' }]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: accentColor }, !mood && styles.disabled]}
            onPress={handleSubmit}
            disabled={!mood || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={MoonColors.white} />
            ) : (
              <Text style={styles.submitText}>{t('logAndInsight')}</Text>
            )}
          </TouchableOpacity>

          {saveError !== null && (
            <Text style={styles.errorText}>{saveError}</Text>
          )}
        </>
      ) : (
        <View style={styles.insightBlock}>
          {insightLoading ? (
            <View style={styles.insightLoading}>
              <ActivityIndicator color={accentColor} />
              <Text style={styles.insightLoadingText}>{t('thinkingAboutDay')}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.insightLabel}>{t('aiInsight')}</Text>
              <Text style={styles.insightText}>{insight ?? t('thanksForLogging')}</Text>
              <TouchableOpacity onPress={() => { setSubmitted(false); setMood(null); setSymptoms([]); }}>
                <Text style={[styles.relogText, { color: accentColor }]}>{t('updateLog')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MoonColors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: MoonColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    ...Typography.bodyBold,
    color: MoonColors.textPrimary,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: MoonColors.inputBg,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    flex: 1,
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodValue: {
    fontSize: 20,
    fontWeight: '700',
    color: MoonColors.textPrimary,
  },
  moodLabel: {
    ...Typography.tiny,
    color: MoonColors.textHint,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  symptomChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: MoonColors.inputBg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  symptomText: {
    ...Typography.tiny,
    color: MoonColors.textSecondary,
    letterSpacing: 0.3,
  },
  submitButton: {
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  submitText: {
    ...Typography.bodyBold,
    color: MoonColors.white,
  },
  disabled: {
    opacity: 0.4,
  },
  insightBlock: {
    gap: Spacing.sm,
  },
  insightLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  insightLoadingText: {
    ...Typography.caption,
    color: MoonColors.textHint,
  },
  insightLabel: {
    ...Typography.tiny,
    color: MoonColors.textHint,
    letterSpacing: 1,
  },
  insightText: {
    ...Typography.body,
    color: MoonColors.textPrimary,
    lineHeight: 24,
  },
  relogText: {
    ...Typography.caption,
    fontWeight: '700',
    marginTop: 4,
  },
  errorText: {
    ...Typography.caption,
    color: '#EF5350',
    textAlign: 'center',
  },
});
