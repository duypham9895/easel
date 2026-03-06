import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { CyclePhase } from '@/types';
import { useAIDailyInsight } from '@/hooks/useAIDailyInsight';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/lib/supabase';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😔', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😊', label: 'Okay' },
  { value: 4, emoji: '😄', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Great' },
];

const SYMPTOM_OPTIONS = [
  'Cramps', 'Bloating', 'Headache', 'Fatigue',
  'Tender', 'Mood swings', 'Spotting', 'Cravings',
];

interface Props {
  phase: CyclePhase;
  dayInCycle: number;
  accentColor: string;
}

export function DailyCheckIn({ phase, dayInCycle, accentColor }: Props) {
  const { userId } = useAppStore();

  const [mood, setMood] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const { insight, isLoading: insightLoading, fetchInsight } = useAIDailyInsight(phase, dayInCycle);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit() {
    if (!userId) return;
    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Save to daily_logs in Supabase
      await supabase.from('daily_logs').upsert(
        {
          user_id: userId,
          log_date: today,
          mood: mood ?? null,
          symptoms: symptoms.length > 0 ? symptoms : null,
        },
        { onConflict: 'user_id, log_date' }
      );

      setSubmitted(true);
      // Fetch AI insight immediately after saving
      await fetchInsight(mood, symptoms);
    } catch (err) {
      console.warn('[DailyCheckIn] save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>How are you feeling today?</Text>

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
                <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                <Text style={styles.moodLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Symptom chips */}
          <View style={styles.symptomsGrid}>
            {SYMPTOM_OPTIONS.map((s) => {
              const active = symptoms.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.symptomChip,
                    active && { backgroundColor: accentColor + '22', borderColor: accentColor },
                  ]}
                  onPress={() => toggleSymptom(s)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.symptomText, active && { color: accentColor, fontWeight: '700' }]}
                  >
                    {s}
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
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitText}>Log & get insight ✦</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.insightBlock}>
          {insightLoading ? (
            <View style={styles.insightLoading}>
              <ActivityIndicator color={accentColor} />
              <Text style={styles.insightLoadingText}>Thinking about your day…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.insightLabel}>✦ AI Insight</Text>
              <Text style={styles.insightText}>{insight ?? 'Thanks for logging today.'}</Text>
              <TouchableOpacity onPress={() => { setSubmitted(false); setMood(null); setSymptoms([]); }}>
                <Text style={[styles.relogText, { color: accentColor }]}>Update today's log</Text>
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
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    flex: 1,
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    ...Typography.tiny,
    color: Colors.textHint,
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
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  symptomText: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  submitButton: {
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  submitText: {
    ...Typography.bodyBold,
    color: Colors.white,
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
    color: Colors.textHint,
  },
  insightLabel: {
    ...Typography.tiny,
    color: Colors.textHint,
    letterSpacing: 1,
  },
  insightText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  relogText: {
    ...Typography.caption,
    fontWeight: '700',
    marginTop: 4,
  },
});
