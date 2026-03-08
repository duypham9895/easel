import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MoonColors, SharedColors } from '@/constants/theme';
import type { SyncResult } from '@/hooks/useHealthSyncOnboarding';

const M = MoonColors;

interface Props {
  syncResult: SyncResult;
  onContinue: () => void;
  onReject: () => void;
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Feather name={icon as any} size={18} color={M.accentPrimary} />
      </View>
      <View style={styles.statText}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
}

export function HealthImportSummary({ syncResult, onContinue, onReject }: Props) {
  const { t, i18n } = useTranslation('health');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const dateRange = syncResult.dateRange
    ? t('importSummary.dateRange', {
        start: formatDate(syncResult.dateRange.start, locale),
        end: formatDate(syncResult.dateRange.end, locale),
      })
    : '';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.spacerTop} />

      {/* Success icon */}
      <View style={styles.successIcon}>
        <Feather name="check" size={40} color={M.white} />
      </View>

      <View style={styles.gap24} />

      <Text style={styles.headline} accessibilityRole="header">
        {t('importSummary.headline')}
      </Text>

      <View style={styles.gap24} />

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="calendar"
          label={dateRange}
          value={t('importSummary.periodsFound', { count: syncResult.periodsFound })}
        />
        <StatCard
          icon="repeat"
          label={t('importSummary.avgCycle', { days: syncResult.avgCycleLength })}
          value={`${syncResult.avgCycleLength}`}
        />
      </View>

      <View style={styles.gap32} />

      {/* Continue */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onContinue}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>{t('importSummary.continueButton')}</Text>
      </TouchableOpacity>

      <View style={styles.gap12} />

      {/* Reject */}
      <TouchableOpacity
        onPress={onReject}
        style={styles.rejectButton}
        accessibilityRole="button"
      >
        <Text style={styles.rejectText}>{t('importSummary.rejectLink')}</Text>
      </TouchableOpacity>

      <View style={styles.spacerBottom} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: M.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spacerTop: { flex: 1 },
  spacerBottom: { flex: 1 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SharedColors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap12: { height: 12 },
  gap24: { height: 24 },
  gap32: { height: 32 },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: M.textPrimary,
    textAlign: 'center',
  },
  statsContainer: {
    alignSelf: 'stretch',
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: M.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: M.accentPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: M.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: M.textSecondary,
  },
  primaryButton: {
    height: 56,
    backgroundColor: M.accentPrimary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: M.white,
  },
  rejectButton: {
    padding: 12,
  },
  rejectText: {
    fontSize: 15,
    fontWeight: '500',
    color: M.textHint,
    textDecorationLine: 'underline',
  },
});
