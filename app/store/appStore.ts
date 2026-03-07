import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole, SOSOption, CycleSettings, NotificationPreferences } from '@/types';
import { supabase } from '@/lib/supabase';
import { getProfile, upsertProfile } from '@/lib/db/profiles';
import { getCycleSettings, upsertCycleSettings } from '@/lib/db/cycle';
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
  // Sun-only: girlfriend's cycle settings fetched after linking
  partnerCycleSettings: CycleSettings | null;

  // Active SOS (transient — not persisted)
  activeSOS: SOSOption | null;

  avatarUrl: string | null;
  displayName: string | null;
  notificationPrefs: NotificationPreferences;
  activeWhisper: SOSOption | null;

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

// Module-level timer refs so they can be cleared without adding to persisted state
let _sosTimer: ReturnType<typeof setTimeout> | null = null;
let _whisperTimer: ReturnType<typeof setTimeout> | null = null;

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
      partnerCycleSettings: null,
      activeSOS: null,
      avatarUrl: null,
      displayName: null,
      notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      activeWhisper: null,
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

        set({
          isLoggedIn: true,
          email: data.user.email ?? email,
          userId,
          role: profile?.role ?? null,
          isPartnerLinked: couple?.status === 'linked',
          coupleId: couple?.id ?? null,
          cycleSettings,
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
          cycleSettings: makeDefaultCycleSettings(),
          partnerCycleSettings: null,
          displayName: null,
          avatarUrl: null,
          notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
          language: 'en',
        });
        i18n.changeLanguage('en');
      },

      // -----------------------------------------------------------------------
      // Profile
      // -----------------------------------------------------------------------
      setRole: async (role) => {
        set({ role });
        const { userId } = get();
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
        if (!session) return;

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

        set({
          isLoggedIn: true,
          email: session.user.email ?? '',
          userId,
          role: profile?.role ?? null,
          isPartnerLinked: couple?.status === 'linked',
          coupleId: couple?.id ?? null,
          cycleSettings,
          partnerCycleSettings,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          // Restore a pending link code so GF can see it without regenerating.
          // Clear stale persisted code if the couple is already linked.
          linkCode: couple?.status === 'pending' ? (couple.link_code ?? null) : null,
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

      // -----------------------------------------------------------------------
      // SOS
      // -----------------------------------------------------------------------
      sendSOS: async (option) => {
        const { userId, coupleId } = get();

        if (_sosTimer) clearTimeout(_sosTimer);
        set({ activeSOS: option });
        _sosTimer = setTimeout(() => get().clearSOS(), 300_000); // 5 min — enough time to notice

        // Persist to DB so BF's Realtime subscription triggers
        if (userId && coupleId) {
          await sendSOSSignal(coupleId, userId, option);
        }
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
        if (_whisperTimer) clearTimeout(_whisperTimer);
        set({ activeWhisper: option });
        _whisperTimer = setTimeout(() => get().clearWhisper(), 300_000); // 5 min
        if (userId && coupleId) {
          await sendSOSSignal(coupleId, userId, option);
        }
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
      updateNotificationPrefs: (partial) => set(state => ({
        notificationPrefs: { ...state.notificationPrefs, ...partial },
      })),

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
        // Background sync to Supabase
        const { userId } = get();
        if (userId) {
          supabase
            .from('user_preferences')
            .upsert({ user_id: userId, language: lang }, { onConflict: 'user_id' })
            .then(({ error }) => {
              if (error) console.warn('[setLanguage] sync failed:', error.message);
            });
        }
      },
    }),
    {
      name: 'easel-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // activeSOS/activeWhisper are transient; userId/coupleId are re-hydrated via bootstrapSession
      partialize: ({ activeSOS, activeWhisper, userId, coupleId, ...rest }) => rest,
    },
  ),
);
