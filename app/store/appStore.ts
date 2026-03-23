import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole, SOSOption, CycleSettings, NotificationPreferences, PeriodRecord, CycleDeviation, PredictionWindow } from '@/types';
import { detectDeviation, computePredictionWindow } from '@/utils/cycleCalculator';
import { supabase } from '@/lib/supabase';
import { getProfile, upsertProfile } from '@/lib/db/profiles';
import { getCycleSettings, upsertCycleSettings, fetchPeriodLogs, logPeriodStart, deletePeriodLog, updatePeriodLogTags, updatePeriodEndDate } from '@/lib/db/cycle';
import { upsertPeriodDayLog, fetchPeriodDayLogs, deletePeriodDayLog } from '@/lib/db/periodDayLogs';
import type { FlowIntensity, PeriodSymptom, PeriodDayRecord } from '@/types';
import { createOrRefreshLinkCode, linkToPartnerByCode, getMyCouple } from '@/lib/db/couples';
import { sendSOSSignal } from '@/lib/db/sos';
import { upsertPushToken } from '@/lib/db/pushTokens';
import i18n from '@/i18n/config';
import type { SupportedLanguage } from '@/i18n/config';

interface AppState {
  // Auth
  isLoggedIn: boolean;
  email: string;
  role: UserRole;
  isPartnerLinked: boolean;
  linkCode: string | null;

  // Supabase identifiers (not persisted across sign-out)
  userId: string | null;
  coupleId: string | null;

  // Cycle data
  cycleSettings: CycleSettings;
  periodLogs: PeriodRecord[];
  // Sun-only: girlfriend's cycle settings fetched after linking
  partnerCycleSettings: CycleSettings | null;

  // Active SOS (transient — not persisted)
  activeSOS: SOSOption | null;

  avatarUrl: string | null;
  displayName: string | null;
  notificationPrefs: NotificationPreferences;
  activeWhisper: SOSOption | null;

  // Deviation detection (transient — not persisted)
  lastDeviation: CycleDeviation | null;

  // Prediction window (transient — not persisted)
  predictionWindow: PredictionWindow | null;

  // Period day logs (Flo-style per-day tracking)
  periodDayLogs: Record<string, PeriodDayRecord>;
  selectedCalendarDay: string | null;
  isSavingDayLog: boolean;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Profile
  setRole: (role: UserRole) => Promise<void>;
  bootstrapSession: () => Promise<void>;

  // Partner
  setPartnerLinked: (linked: boolean) => void;
  generateLinkCode: () => Promise<string>;
  linkToPartner: (code: string) => Promise<void>;
  setLinked: (coupleId: string) => void;

  // Cycle
  updateCycleSettings: (settings: Partial<CycleSettings>) => Promise<void>;
  loadPeriodLogs: () => Promise<void>;
  addPeriodLog: (startDate: string, endDate?: string | null, tags?: string[]) => Promise<void>;
  removePeriodLog: (startDate: string) => Promise<void>;
  updatePeriodTags: (startDate: string, tags: string[]) => Promise<void>;
  setPeriodEndDate: (startDate: string, endDate: string) => Promise<void>;
  clearDeviation: () => void;

  // SOS
  sendSOS: (option: SOSOption) => Promise<void>;
  receiveSOS: (option: SOSOption) => void;   // local-only: called by Realtime listener
  clearSOS: () => void;

  // Whisper
  sendWhisper: (option: SOSOption) => Promise<void>;
  receiveWhisper: (option: SOSOption) => void;
  clearWhisper: () => void;
  updateAvatarUrl: (url: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => void;

  // Period day logs
  savePeriodDayLog: (
    logDate: string,
    flowIntensity: FlowIntensity,
    symptoms: PeriodSymptom[],
    notes?: string,
  ) => Promise<void>;
  loadPeriodDayLogs: (startDate: string, endDate: string) => Promise<void>;
  removePeriodDayLog: (logDate: string) => Promise<void>;
  selectCalendarDay: (dateString: string | null) => void;
  receivePeriodDayLog: (
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    logDate: string,
    data: PeriodDayRecord | null,
  ) => void;

  // Push notifications
  registerPushToken: (token: string) => Promise<void>;

  // Language
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  periodApproaching: true, periodStarted: true, periodEnded: true,
  whisperAlerts: true, useAiTiming: true, manualDaysBefore: 3,
};

function makeDefaultCycleSettings(): CycleSettings {
  return {
    avgCycleLength: 28,
    avgPeriodLength: 5,
    lastPeriodStartDate: new Date().toISOString().split('T')[0],
  };
}

/** Compute lastPeriodStartDate, avgCycleLength, and avgPeriodLength from log history. */
function recomputeCycleFromLogs(logs: PeriodRecord[], current: CycleSettings): CycleSettings {
  const lastPeriodStartDate = logs[0]?.startDate ?? current.lastPeriodStartDate;
  const gaps: number[] = [];
  for (let i = 0; i < logs.length - 1; i++) {
    const a = new Date(logs[i].startDate).getTime();
    const b = new Date(logs[i + 1].startDate).getTime();
    const days = Math.round((a - b) / 86_400_000);
    if (days >= 21 && days <= 45) gaps.push(days);
  }
  const avgCycleLength = gaps.length > 0
    ? Math.round(gaps.reduce((sum, d) => sum + d, 0) / gaps.length)
    : current.avgCycleLength;

  const durations: number[] = [];
  for (const log of logs) {
    if (log.endDate) {
      const d = Math.round(
        (new Date(log.endDate).getTime() - new Date(log.startDate).getTime()) / 86_400_000,
      ) + 1;
      if (d >= 1 && d <= 14) durations.push(d);
    }
  }
  const avgPeriodLength = durations.length > 0
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : current.avgPeriodLength;

  return { ...current, lastPeriodStartDate, avgCycleLength, avgPeriodLength };
}

// Module-level timer refs so they can be cleared without adding to persisted state
let _sosTimer: ReturnType<typeof setTimeout> | null = null;
let _whisperTimer: ReturnType<typeof setTimeout> | null = null;

async function retryAsync<T>(
  fn: () => Promise<T> | PromiseLike<T>,
  maxRetries = 3,
  baseDelay = 500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // -----------------------------------------------------------------------
      // Initial state
      // -----------------------------------------------------------------------
      isLoggedIn: false,
      email: '',
      role: null,
      isPartnerLinked: false,
      linkCode: null,
      userId: null,
      coupleId: null,
      cycleSettings: makeDefaultCycleSettings(),
      periodLogs: [],
      partnerCycleSettings: null,
      activeSOS: null,
      avatarUrl: null,
      displayName: null,
      notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      activeWhisper: null,
      lastDeviation: null,
      predictionWindow: null,
      periodDayLogs: {},
      selectedCalendarDay: null,
      isSavingDayLog: false,
      language: (i18n.language as SupportedLanguage) ?? 'en',

      // -----------------------------------------------------------------------
      // Auth
      // -----------------------------------------------------------------------
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Sign in failed — no user returned');

        const userId = data.user.id;

        // Hydrate profile from DB
        const profile = await getProfile(userId);
        const cycleSettings = profile?.role === 'moon'
          ? await getCycleSettings(userId) ?? makeDefaultCycleSettings()
          : makeDefaultCycleSettings();

        const couple = await getMyCouple();

        // Sun users see girlfriend's real cycle data, not the default placeholder
        const partnerCycleSettings =
          profile?.role === 'sun' && couple?.status === 'linked' && couple.girlfriend_id
            ? await getCycleSettings(couple.girlfriend_id) ?? null
            : null;

        const periodLogs = profile?.role === 'moon'
          ? await fetchPeriodLogs(userId)
          : [];

        // Load period day logs for Moon users
        let periodDayLogsMap: Record<string, PeriodDayRecord> = {};
        if (profile?.role === 'moon' && periodLogs.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          const startDate = threeMonthsAgo.toISOString().split('T')[0];
          try {
            const dayLogRecords = await fetchPeriodDayLogs(userId, startDate, today);
            for (const r of dayLogRecords) {
              periodDayLogsMap[r.logDate] = r;
            }
          } catch (err) {
            console.warn('[signIn] period day logs load failed:', err);
          }
        }

        set({
          isLoggedIn: true,
          email: data.user.email ?? email,
          userId,
          role: profile?.role ?? null,
          isPartnerLinked: couple?.status === 'linked',
          coupleId: couple?.id ?? null,
          cycleSettings,
          periodLogs,
          periodDayLogs: periodDayLogsMap,
          partnerCycleSettings,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        });
      },

      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Sign up failed — no user returned');

        // When email confirmation is enabled, data.session is null.
        // Do NOT set isLoggedIn until the user confirms their email.
        if (!data.session) return;

        // Profile row is auto-created by the DB trigger.
        // Role is set in onboarding.
        set({
          isLoggedIn: true,
          email: data.user.email ?? email,
          userId: data.user.id,
          role: null,
          isPartnerLinked: false,
          coupleId: null,
          cycleSettings: makeDefaultCycleSettings(),
        });
      },

      signOut: async () => {
        if (_sosTimer) { clearTimeout(_sosTimer); _sosTimer = null; }
        if (_whisperTimer) { clearTimeout(_whisperTimer); _whisperTimer = null; }
        await supabase.auth.signOut();
        set({
          isLoggedIn: false,
          email: '',
          role: null,
          isPartnerLinked: false,
          linkCode: null,
          userId: null,
          coupleId: null,
          activeSOS: null,
          activeWhisper: null,
          lastDeviation: null,
          predictionWindow: null,
          cycleSettings: makeDefaultCycleSettings(),
          periodLogs: [],
          partnerCycleSettings: null,
          displayName: null,
          avatarUrl: null,
          notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
          periodDayLogs: {},
          selectedCalendarDay: null,
          isSavingDayLog: false,
          language: 'en',
        });
        i18n.changeLanguage('en');
      },

      // -----------------------------------------------------------------------
      // Profile
      // -----------------------------------------------------------------------
      setRole: async (role) => {
        const { userId } = get();
        set({ role }); // Optimistic local update — ensures immediate availability
        if (userId) {
          await upsertProfile(userId, { role });
        }
      },

      /**
       * Called on app start (index.tsx) to re-hydrate from Supabase when a
       * persisted session exists. Keeps local cache fresh without a full sign-in.
       */
      bootstrapSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          set({ isLoggedIn: false, role: null, email: '', isPartnerLinked: false, linkCode: null });
          return;
        }

        const userId = session.user.id;
        const profile = await getProfile(userId);
        const cycleSettings = profile?.role === 'moon'
          ? await getCycleSettings(userId) ?? makeDefaultCycleSettings()
          : makeDefaultCycleSettings();
        const couple = await getMyCouple();

        const partnerCycleSettings =
          profile?.role === 'sun' && couple?.status === 'linked' && couple.girlfriend_id
            ? await getCycleSettings(couple.girlfriend_id) ?? null
            : null;

        // Load period logs for Moon users
        const periodLogs = profile?.role === 'moon'
          ? await fetchPeriodLogs(userId)
          : [];

        // Load period day logs (Flo-style per-day data) for Moon users
        let periodDayLogsMap: Record<string, PeriodDayRecord> = {};
        if (profile?.role === 'moon' && periodLogs.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          const startDate = threeMonthsAgo.toISOString().split('T')[0];
          try {
            const dayLogRecords = await fetchPeriodDayLogs(userId, startDate, today);
            for (const r of dayLogRecords) {
              periodDayLogsMap[r.logDate] = r;
            }
          } catch (err) {
            console.warn('[bootstrapSession] period day logs load failed:', err);
          }
        }

        // Restore language preference from DB
        const { data: prefData } = await supabase
          .from('user_preferences')
          .select('language')
          .eq('user_id', userId)
          .maybeSingle();
        const dbLang = (prefData?.language as SupportedLanguage) ?? undefined;
        if (dbLang && dbLang !== i18n.language) {
          i18n.changeLanguage(dbLang);
        }

        set({
          isLoggedIn: true,
          email: session.user.email ?? '',
          userId,
          role: profile?.role ?? null,
          isPartnerLinked: couple?.status === 'linked',
          coupleId: couple?.id ?? null,
          cycleSettings,
          periodLogs,
          periodDayLogs: periodDayLogsMap,
          partnerCycleSettings,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          // Restore a pending link code so GF can see it without regenerating.
          // Clear stale persisted code if the couple is already linked.
          linkCode: couple?.status === 'pending' ? (couple.link_code ?? null) : null,
          ...(dbLang ? { language: dbLang } : {}),
        });
      },

      // -----------------------------------------------------------------------
      // Partner linking
      // -----------------------------------------------------------------------
      setPartnerLinked: (linked) => set({ isPartnerLinked: linked }),

      generateLinkCode: async () => {
        const { userId } = get();
        if (!userId) throw new Error('Not signed in');

        const { code, coupleId } = await createOrRefreshLinkCode(userId);
        set({ linkCode: code, coupleId });
        return code;
      },

      setLinked: (coupleId) => set({ isPartnerLinked: true, coupleId, linkCode: null }),

      linkToPartner: async (code) => {
        const { userId } = get();
        if (!userId) throw new Error('Not signed in');

        const coupleId = await linkToPartnerByCode(userId, code);
        set({ isPartnerLinked: true, coupleId });

        // Fetch partner's cycle settings so Sun sees correct phase immediately
        const couple = await getMyCouple();
        if (couple?.girlfriend_id) {
          const partnerCycle = await getCycleSettings(couple.girlfriend_id);
          if (partnerCycle) set({ partnerCycleSettings: partnerCycle });
        }
      },

      // -----------------------------------------------------------------------
      // Cycle
      // -----------------------------------------------------------------------
      updateCycleSettings: async (partial) => {
        const merged = { ...get().cycleSettings, ...partial };
        set({ cycleSettings: merged });  // optimistic update

        const { userId } = get();
        if (userId) {
          await upsertCycleSettings(userId, merged);
        }
      },

      loadPeriodLogs: async () => {
        const { userId, cycleSettings } = get();
        if (!userId) return;
        const logs = await fetchPeriodLogs(userId);
        set({
          periodLogs: logs,
          predictionWindow: computePredictionWindow(logs, cycleSettings),
        });
      },

      addPeriodLog: async (startDate, endDate, tags) => {
        const { userId, periodLogs, cycleSettings } = get();
        if (!userId) return;

        const entry: PeriodRecord = {
          startDate,
          ...(endDate ? { endDate } : {}),
          ...(tags && tags.length > 0 ? { tags } : {}),
        };
        const updated = [entry, ...periodLogs.filter((l) => l.startDate !== startDate)]
          .sort((a, b) => b.startDate.localeCompare(a.startDate))
          .slice(0, 24);

        const deviation = cycleSettings.lastPeriodStartDate
          ? detectDeviation(startDate, cycleSettings.lastPeriodStartDate, cycleSettings.avgCycleLength)
          : null;

        const newCycleSettings = recomputeCycleFromLogs(updated, cycleSettings);
        set({
          periodLogs: updated,
          cycleSettings: newCycleSettings,
          lastDeviation: deviation,
          predictionWindow: computePredictionWindow(updated, newCycleSettings),
        });

        try {
          await logPeriodStart(userId, startDate);
        } catch (error) {
          set({
            periodLogs,
            cycleSettings,
            lastDeviation: null,
            predictionWindow: computePredictionWindow(periodLogs, cycleSettings),
          });
          throw error;
        }
      },

      clearDeviation: () => set({ lastDeviation: null }),

      updatePeriodTags: async (startDate, tags) => {
        const { userId, periodLogs, cycleSettings } = get();
        if (!userId) return;

        const updated = periodLogs.map((l) =>
          l.startDate === startDate ? { ...l, tags } : l,
        );
        set({
          periodLogs: updated,
          predictionWindow: computePredictionWindow(updated, cycleSettings),
        });

        try {
          await updatePeriodLogTags(userId, startDate, tags);
        } catch (error) {
          set({
            periodLogs,
            predictionWindow: computePredictionWindow(periodLogs, cycleSettings),
          });
          throw error;
        }
      },

      setPeriodEndDate: async (startDate, endDate) => {
        const { userId, periodLogs, cycleSettings } = get();
        if (!userId) return;

        const updated = periodLogs.map((l) =>
          l.startDate === startDate ? { ...l, endDate } : l,
        );
        const newCycleSettings = recomputeCycleFromLogs(updated, cycleSettings);
        set({
          periodLogs: updated,
          cycleSettings: newCycleSettings,
          predictionWindow: computePredictionWindow(updated, newCycleSettings),
        });

        try {
          await updatePeriodEndDate(userId, startDate, endDate);
        } catch (error) {
          set({
            periodLogs,
            cycleSettings,
            predictionWindow: computePredictionWindow(periodLogs, cycleSettings),
          });
          throw error;
        }
      },

      removePeriodLog: async (startDate) => {
        const { userId, cycleSettings } = get();
        if (!userId) return;
        const prevLogs = get().periodLogs;
        const updated = prevLogs.filter((l) => l.startDate !== startDate);
        const newCycleSettings = recomputeCycleFromLogs(updated, cycleSettings);
        set({
          periodLogs: updated,
          cycleSettings: newCycleSettings,
          predictionWindow: computePredictionWindow(updated, newCycleSettings),
        });
        try {
          await deletePeriodLog(userId, startDate);
        } catch (error) {
          set({
            periodLogs: prevLogs,
            cycleSettings,
            predictionWindow: computePredictionWindow(prevLogs, cycleSettings),
          });
          throw error;
        }
      },

      // -----------------------------------------------------------------------
      // SOS
      // -----------------------------------------------------------------------
      sendSOS: async (option) => {
        const { userId, coupleId } = get();
        if (!userId || !coupleId) {
          throw new Error('NOT_PAIRED');
        }

        if (_sosTimer) clearTimeout(_sosTimer);
        set({ activeSOS: option });
        _sosTimer = setTimeout(() => get().clearSOS(), 300_000);

        await sendSOSSignal(coupleId, userId, option);
      },

      // Called by useSOSListener when BF receives via Realtime — no DB write needed
      receiveSOS: (option) => {
        if (_sosTimer) clearTimeout(_sosTimer);
        set({ activeSOS: option });
        _sosTimer = setTimeout(() => get().clearSOS(), 300_000); // 5 min
      },

      clearSOS: () => {
        if (_sosTimer) { clearTimeout(_sosTimer); _sosTimer = null; }
        set({ activeSOS: null });
      },

      // -----------------------------------------------------------------------
      // Whisper
      // -----------------------------------------------------------------------
      sendWhisper: async (option) => {
        const { userId, coupleId } = get();
        if (!userId || !coupleId) {
          throw new Error('NOT_PAIRED');
        }

        if (_whisperTimer) clearTimeout(_whisperTimer);
        set({ activeWhisper: option });
        _whisperTimer = setTimeout(() => get().clearWhisper(), 300_000);

        await sendSOSSignal(coupleId, userId, option);
      },
      receiveWhisper: (option) => {
        if (_whisperTimer) clearTimeout(_whisperTimer);
        set({ activeWhisper: option });
        _whisperTimer = setTimeout(() => get().clearWhisper(), 300_000); // 5 min
      },
      clearWhisper: () => {
        if (_whisperTimer) { clearTimeout(_whisperTimer); _whisperTimer = null; }
        set({ activeWhisper: null });
      },
      updateAvatarUrl: async (url) => {
        set({ avatarUrl: url });
        const { userId } = get();
        if (userId) {
          await upsertProfile(userId, { avatar_url: url });
        }
      },
      updateDisplayName: async (name) => {
        set({ displayName: name });
        const { userId } = get();
        if (userId) {
          await upsertProfile(userId, { display_name: name });
        }
      },
      updateNotificationPrefs: (partial) => {
        const merged = { ...get().notificationPrefs, ...partial };
        set({ notificationPrefs: merged });
        // Background sync to DB with retry
        const { userId } = get();
        if (userId) {
          retryAsync(async () => {
            const { error } = await supabase
              .from('notification_preferences')
              .upsert({
                user_id: userId,
                period_approaching: merged.periodApproaching,
                period_started: merged.periodStarted,
                period_ended: merged.periodEnded,
                whisper_alerts: merged.whisperAlerts,
                use_ai_timing: merged.useAiTiming,
                manual_days_before: merged.manualDaysBefore,
              }, { onConflict: 'user_id' });
            if (error) throw error;
          }).catch((err) => {
            console.error('[updateNotificationPrefs] sync failed after retries:', err);
          });
        }
      },

      // -----------------------------------------------------------------------
      // Period day logs (Flo-style per-day tracking)
      // -----------------------------------------------------------------------
      savePeriodDayLog: async (logDate, flowIntensity, symptoms, notes) => {
        const { userId, periodDayLogs, periodLogs, cycleSettings } = get();
        if (!userId) return;

        set({ isSavingDayLog: true });

        const newRecord: PeriodDayRecord = {
          logDate,
          flowIntensity,
          symptoms,
          ...(notes ? { notes } : {}),
        };
        const updatedDayLogs = { ...periodDayLogs, [logDate]: newRecord };
        set({ periodDayLogs: updatedDayLogs });

        try {
          await upsertPeriodDayLog(userId, logDate, flowIntensity, symptoms, notes);

          // Auto-create or extend period_log for this day
          const logMs = new Date(logDate + 'T00:00:00').getTime();
          const containingPeriod = periodLogs.find((log) => {
            const startMs = new Date(log.startDate + 'T00:00:00').getTime();
            const endMs = log.endDate
              ? new Date(log.endDate + 'T00:00:00').getTime()
              : startMs + (cycleSettings.avgPeriodLength - 1) * 86_400_000;
            return logMs >= startMs && logMs <= endMs;
          });

          if (!containingPeriod) {
            // Auto-create or extend period_log — best-effort, don't fail the day log save
            try {
              const adjacentPeriod = periodLogs.find((log) => {
                const startMs = new Date(log.startDate + 'T00:00:00').getTime();
                const endMs = log.endDate
                  ? new Date(log.endDate + 'T00:00:00').getTime()
                  : startMs + (cycleSettings.avgPeriodLength - 1) * 86_400_000;
                const dayBefore = startMs - 86_400_000;
                const dayAfter = endMs + 86_400_000;
                return logMs === dayBefore || logMs === dayAfter;
              });

              if (adjacentPeriod) {
                const newEnd = logDate > (adjacentPeriod.endDate ?? adjacentPeriod.startDate)
                  ? logDate
                  : adjacentPeriod.endDate ?? adjacentPeriod.startDate;
                await get().setPeriodEndDate(adjacentPeriod.startDate, newEnd);
              } else {
                await get().addPeriodLog(logDate);
              }
            } catch (periodError) {
              console.warn('[savePeriodDayLog] auto-period-create failed:', periodError);
            }
          }
        } catch (error) {
          const current = get().periodDayLogs;
          const { [logDate]: _drop, ...withoutThisDay } = current;
          set({ periodDayLogs: periodDayLogs[logDate]
            ? { ...withoutThisDay, [logDate]: periodDayLogs[logDate] }
            : withoutThisDay,
          });
          throw error;
        } finally {
          set({ isSavingDayLog: false });
        }
      },

      loadPeriodDayLogs: async (startDate, endDate) => {
        const { userId } = get();
        if (!userId) return;

        const records = await fetchPeriodDayLogs(userId, startDate, endDate);
        const dayLogs = { ...get().periodDayLogs };
        for (const record of records) {
          dayLogs[record.logDate] = record;
        }
        set({ periodDayLogs: dayLogs });
      },

      removePeriodDayLog: async (logDate) => {
        const { userId, periodDayLogs } = get();
        if (!userId) return;

        const removedEntry = periodDayLogs[logDate];
        const { [logDate]: _removed, ...remaining } = periodDayLogs;
        set({ periodDayLogs: remaining });

        try {
          await deletePeriodDayLog(userId, logDate);
        } catch (error) {
          const current = get().periodDayLogs;
          set({ periodDayLogs: removedEntry
            ? { ...current, [logDate]: removedEntry }
            : current,
          });
          throw error;
        }
      },

      selectCalendarDay: (dateString) => {
        set({ selectedCalendarDay: dateString });
      },

      receivePeriodDayLog: (event, logDate, data) => {
        const { periodDayLogs } = get();
        if (event === 'DELETE') {
          const { [logDate]: _removed, ...remaining } = periodDayLogs;
          set({ periodDayLogs: remaining });
        } else if (data) {
          set({ periodDayLogs: { ...periodDayLogs, [logDate]: data } });
        }
      },

      // -----------------------------------------------------------------------
      // Push notifications
      // -----------------------------------------------------------------------
      registerPushToken: async (token) => {
        const { userId } = get();
        if (userId) {
          await upsertPushToken(userId, token);
        }
      },

      // -----------------------------------------------------------------------
      // Language
      // -----------------------------------------------------------------------
      setLanguage: (lang) => {
        set({ language: lang });
        i18n.changeLanguage(lang);
        // Background sync to Supabase with retry
        const { userId } = get();
        if (userId) {
          retryAsync(async () => {
            const { error } = await supabase
              .from('user_preferences')
              .upsert({ user_id: userId, language: lang }, { onConflict: 'user_id' });
            if (error) throw error;
          }).catch((err) => {
            console.error('[setLanguage] sync failed after retries:', err);
          });
        }
      },
    }),
    {
      name: 'easel-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // activeSOS/activeWhisper are transient; userId/coupleId are re-hydrated via bootstrapSession
      partialize: ({ activeSOS, activeWhisper, lastDeviation, predictionWindow, userId, coupleId, selectedCalendarDay, isSavingDayLog, ...rest }) => rest,
    },
  ),
);
