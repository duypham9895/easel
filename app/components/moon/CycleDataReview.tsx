import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MoonColors, SharedColors } from '@/constants/theme';
import type { SyncResult, ConfidenceLevel } from '@/hooks/useHealthSyncOnboarding';

const M = MoonColors;

interface Props {
  syncResult: SyncResult;
  predictedDate: string;
  onEdit: () => void;
  onConfirm: () => void;
}

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, {
  color: string;
  icon: string;
  labelKey: string;
  descKey: string;
}> = {
  high: {
    color: SharedColors.success,
    icon: 'check-circle',
    labelKey: 'review.confidenceHigh',
    descKey: 'review.confidenceHighDesc',
  },
  medium: {
    color: SharedColors.warning,
    icon: 'alert-circle',
    labelKey: 'review.confidenceMedium',
    descKey: 'review.confidenceMediumDesc',
  },
  low: {
    color: '#FF5F7E',
    icon: 'info',
    labelKey: 'review.confidenceLow',
    descKey: 'review.confidenceLowDesc',
  },
};

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function CycleDataReview({ syncResult, predictedDate, onEdit, onConfirm }: Props) {
  const { t, i18n } = useTranslation('health');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [showExplanation, setShowExplanation] = useState(false);

  const confidence = CONFIDENCE_CONFIG[syncResult.confidenceLevel];
  const sourceLabel = syncResult.source === 'healthkit'
    ? t('review.sourceHealthKit')
    : t('review.sourceManual');

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headline} accessibilityRole="header">
          {t('review.headline')}
        </Text>

        <View style={styles.gap8} />

        {/* Source badge */}
        <View style={styles.sourceBadge}>
          <Feather
            name={syncResult.source === 'healthkit' ? 'heart' : 'edit-2'}
            size={12}
            color={M.accentPrimary}
          />
          <Text style={styles.sourceBadgeText}>{sourceLabel}</Text>
        </View>

        <View style={styles.gap24} />

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <SummaryRow
            label={t('review.lastPeriod')}
            value={formatDate(syncResult.lastPeriodStartDate, locale)}
          />
          <View style={styles.divider} />
          <SummaryRow
            label={t('review.cycleLength')}
            value={t('review.daysUnit', { count: syncResult.avgCycleLength })}
          />
          <View style={styles.divider} />
          <SummaryRow
            label={t('review.periodLength')}
            value={t('review.daysUnit', { count: syncResult.avgPeriodLength })}
          />
        </View>

        <View style={styles.gap16} />

        {/* Prediction card */}
        <View style={styles.predictionCard}>
          <Text style={styles.predictionLabel}>{t('review.prediction')}</Text>
          <Text style={styles.predictionDate}>{formatDate(predictedDate, locale)}</Text>

          <View style={styles.gap12} />

          {/* Confidence indicator */}
          <View style={[styles.confidenceBadge, { backgroundColor: confidence.color + '18' }]}>
            <Feather name={confidence.icon as any} size={16} color={confidence.color} />
            <View style={styles.confidenceText}>
              <Text style={[styles.confidenceLabel, { color: confidence.color }]}>
                {t(confidence.labelKey)}
              </Text>
              <Text style={styles.confidenceDesc}>
                {t(confidence.descKey, { count: syncResult.periodsFound })}
              </Text>
            </View>
          </View>

          {/* Explanation toggle */}
          <TouchableOpacity
            style={styles.explanationToggle}
            onPress={() => setShowExplanation(!showExplanation)}
            accessibilityRole="button"
          >
            <Feather name="info" size={14} color={M.textHint} />
            <Text style={styles.explanationToggleText}>
              {showExplanation ? t('review.hideExplanation') : t('review.showExplanation')}
            </Text>
            <Feather name={showExplanation ? 'chevron-up' : 'chevron-down'} size={14} color={M.textHint} />
          </TouchableOpacity>

          {showExplanation && (
            <Text style={styles.explanationText}>
              {t('review.predictionExplanation', { cycleLength: syncResult.avgCycleLength })}
            </Text>
          )}
        </View>

        <View style={styles.gap24} />

        {/* Edit button */}
        <TouchableOpacity
          onPress={onEdit}
          style={styles.editButton}
          accessibilityRole="button"
        >
          <Feather name="edit-2" size={14} color={M.textHint} />
          <Text style={styles.editButtonText}>{t('review.editButton')}</Text>
        </TouchableOpacity>

        <View style={styles.gap16} />

        {/* Confirm button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onConfirm}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>{t('review.confirmButton')}</Text>
        </TouchableOpacity>

        <View style={styles.gap32} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: M.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: M.textPrimary,
    letterSpacing: -0.5,
  },
  gap8: { height: 8 },
  gap12: { height: 12 },
  gap16: { height: 16 },
  gap24: { height: 24 },
  gap32: { height: 32 },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: M.accentPrimary + '14',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sourceBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: M.accentPrimary,
  },
  summaryCard: {
    backgroundColor: M.surface,
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: M.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: M.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: M.border + '40',
  },
  predictionCard: {
    backgroundColor: M.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: M.accentPrimary + '30',
  },
  predictionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: M.textSecondary,
  },
  predictionDate: {
    fontSize: 22,
    fontWeight: '700',
    color: M.accentPrimary,
    marginTop: 4,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  confidenceText: {
    flex: 1,
    gap: 2,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  confidenceDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: M.textSecondary,
    lineHeight: 16,
  },
  explanationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  explanationToggleText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: M.textHint,
  },
  explanationText: {
    fontSize: 13,
    fontWeight: '400',
    color: M.textSecondary,
    lineHeight: 20,
    marginTop: 8,
    paddingLeft: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: M.textHint,
    textDecorationLine: 'underline',
  },
  primaryButton: {
    height: 56,
    backgroundColor: M.accentPrimary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: M.white,
  },
});
