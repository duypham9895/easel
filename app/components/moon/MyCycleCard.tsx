import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import type { CycleSettings, PeriodRecord } from '@/types';

const MAX_VISIBLE_PERIODS = 6;
const DAY_MS = 86_400_000;

interface MyCycleCardProps {
  cycleSettings: CycleSettings;
  periodLogs: readonly PeriodRecord[];
  language: string;
  onLogPeriod: () => void;
  onEditSettings: () => void;
  onViewAllPeriods: () => void;
}

export function MyCycleCard({
  cycleSettings,
  periodLogs,
  language,
  onLogPeriod,
  onEditSettings,
  onViewAllPeriods,
}: MyCycleCardProps) {
  const { t } = useTranslation('calendar');
  const { avgCycleLength, avgPeriodLength, lastPeriodStartDate } = cycleSettings;

  const nextPeriodDate = computeNextPeriodDate(lastPeriodStartDate, avgCycleLength);
  const formattedNextDate = nextPeriodDate ? formatShortDate(nextPeriodDate, language) : '—';
  const visibleLogs = periodLogs.slice(0, MAX_VISIBLE_PERIODS);
  const hasMoreLogs = periodLogs.length > MAX_VISIBLE_PERIODS;

  return (
    <View style={styles.card}>
      {/* Section Header */}
      <Text style={styles.sectionLabel}>{t('myCycle')}</Text>

      {/* Cycle Summary — 3 stat pills */}
      <View style={styles.statsRow}>
        <StatPill
          value={String(avgCycleLength)}
          label={t('cycleLengthStat', { count: avgCycleLength })}
        />
        <StatPill
          value={String(avgPeriodLength)}
          label={t('periodLengthStat', { count: avgPeriodLength })}
        />
        <StatPill
          value={`~${formattedNextDate}`}
          label={t('nextPeriodLabel')}
        />
      </View>

      {/* Period History */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{t('periodHistoryTitle')}</Text>
          {periodLogs.length > 0 && (
            <Text style={styles.historyCount}>{periodLogs.length}</Text>
          )}
        </View>

        {periodLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={20} color={Colors.textHint} />
            <Text style={styles.emptyText}>{t('noPeriods')}</Text>
            <Text style={styles.emptyHint}>{t('noPeriodsHint')}</Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {visibleLogs.map((log, index) => (
              <PeriodRow
                key={`${log.startDate}-${index}`}
                log={log}
                avgPeriodLength={avgPeriodLength}
                language={language}
              />
            ))}
            {hasMoreLogs && (
              <TouchableOpacity onPress={onViewAllPeriods} activeOpacity={0.7}>
                <Text style={styles.seeAllText}>
                  {t('seeAllPeriods', { count: periodLogs.length })}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Log Period CTA */}
      <TouchableOpacity
        style={styles.logButton}
        onPress={onLogPeriod}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={16} color={Colors.menstrual} />
        <Text style={styles.logButtonText}>{t('logPeriod')}</Text>
      </TouchableOpacity>

      {/* Edit Settings Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>{t('cyclePeriodSummary')}</Text>
        <TouchableOpacity onPress={onEditSettings} activeOpacity={0.7}>
          <View style={styles.editLink}>
            <Text style={styles.editText}>{t('editCycleSettings')}</Text>
            <Feather name="chevron-right" size={14} color={Colors.menstrual} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.pillLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function PeriodRow({
  log,
  avgPeriodLength,
  language,
}: {
  log: PeriodRecord;
  avgPeriodLength: number;
  language: string;
}) {
  const duration = computePeriodDuration(log, avgPeriodLength);
  const startFormatted = formatShortDate(log.startDate, language);
  const endFormatted = log.endDate
    ? formatShortDate(log.endDate, language)
    : null;

  return (
    <View style={styles.periodRow}>
      <View style={styles.periodDot} />
      <Text style={styles.periodDate} numberOfLines={1}>
        {endFormatted ? `${startFormatted} – ${endFormatted}` : startFormatted}
      </Text>
      <Text style={styles.periodDuration}>{duration}d</Text>
    </View>
  );
}

/* ── Pure helpers ─────────────────────────────────────────────────────── */

function computeNextPeriodDate(lastPeriodStart: string, avgCycleLength: number): string | null {
  if (!lastPeriodStart || avgCycleLength < 1) return null;
  const parts = lastPeriodStart.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;

  const [y, m, d] = parts;
  const start = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Walk forward until we find the next predicted start after today
  let predicted = new Date(start.getTime());
  let safety = 0;
  while (predicted <= today && safety < 100) {
    predicted = new Date(predicted.getTime());
    predicted.setDate(predicted.getDate() + avgCycleLength);
    safety++;
  }

  const py = predicted.getFullYear();
  const pm = String(predicted.getMonth() + 1).padStart(2, '0');
  const pd = String(predicted.getDate()).padStart(2, '0');
  return `${py}-${pm}-${pd}`;
}

function computePeriodDuration(log: PeriodRecord, fallback: number): number {
  if (!log.endDate) return fallback;
  const start = new Date(log.startDate + 'T00:00:00');
  const end = new Date(log.endDate + 'T00:00:00');
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  return days >= 1 ? days : fallback;
}

function formatShortDate(dateStr: string, language: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}


/* ── Styles ──────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionLabel: {
    ...Typography.tiny,
    color: Colors.textHint,
    letterSpacing: 1,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pill: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  pillValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  pillLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },

  // History section
  historySection: {
    gap: Spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  historyCount: {
    ...Typography.caption,
    color: Colors.textHint,
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 1,
    overflow: 'hidden',
    minWidth: 24,
    textAlign: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  emptyHint: {
    ...Typography.caption,
    color: Colors.textHint,
    textAlign: 'center',
  },

  // Period log list
  logList: {
    gap: Spacing.xs,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  periodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.menstrual,
  },
  periodDate: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 14,
  },
  periodDuration: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  seeAllText: {
    ...Typography.caption,
    color: Colors.menstrual,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.xs,
  },

  // Log button
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.menstrual + '18',
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  logButtonText: {
    ...Typography.bodyBold,
    color: Colors.menstrual,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.inputBg,
    paddingTop: Spacing.sm,
  },
  footerLabel: {
    ...Typography.caption,
    color: Colors.textHint,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editText: {
    ...Typography.caption,
    color: Colors.menstrual,
    fontWeight: '600',
  },
});
