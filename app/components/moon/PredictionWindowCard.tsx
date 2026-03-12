import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import type { PredictionWindow } from '@/types';

interface Props {
  prediction: PredictionWindow;
  language: string;
}

const CONFIDENCE_COLORS: Record<PredictionWindow['confidenceLabel'], string> = {
  high: Colors.luteal,
  medium: Colors.ovulatory,
  low: Colors.menstrual,
};

function formatDateRange(startDate: string, endDate: string, language: string): string {
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  const startStr = start.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
  const endStr = end.toLocaleDateString(locale, { day: 'numeric' });

  // If same month, show "March 15–18"; otherwise "March 28 – April 2"
  if (start.getMonth() === end.getMonth()) {
    return `${startStr}\u2013${endStr}`;
  }
  const endFull = end.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
  return `${startStr} \u2013 ${endFull}`;
}

export function PredictionWindowCard({ prediction, language }: Props) {
  const { t } = useTranslation('calendar');

  const dateRange = formatDateRange(prediction.startDate, prediction.endDate, language);
  const confidenceColor = CONFIDENCE_COLORS[prediction.confidenceLabel];
  const confidenceKey = `confidence${capitalize(prediction.confidenceLabel)}` as const;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Feather name="calendar" size={18} color={Colors.menstrual} />
        <View style={styles.textCol}>
          <Text style={styles.label}>{t('predictionWindow')}</Text>
          <Text style={styles.dateRange}>{t('periodExpected', { range: dateRange })}</Text>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '22' }]}>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            {t(confidenceKey)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...Typography.caption,
    color: Colors.textHint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRange: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  confidenceBadge: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  confidenceText: {
    ...Typography.tiny,
    fontWeight: '700',
  },
});
