import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole, SOSOption, CycleSettings } from '@/types';
import { supabase } from '@/lib/supabase';
import { getProfile, upsertProfile } from '@/lib/db/profiles';
import { getCycleSettings, upsertCycleSettings } from '@/lib/db/cycle';
import { createOrRefreshLinkCode, linkToPartnerByCode, getMyCouple } from '@/lib/db/couples';
import { sendSOSSignal } from '@/lib/db/sos';
import { upsertPushToken } from '@/lib/db/pushTokens';

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

  // Active SOS (transient — not persisted)
  activeSOS: SOSOption | null;

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

  // Cycle
  updateCycleSettings: (settings: Partial<CycleSettings>) => Promise<void>;

  // SOS
  sendSOS: (option: SOSOption) => Promise<void>;
  receiveSOS: (option: SOSOption) => void;   // local-only: called by Realtime listener
  clearSOS: () => void;

  // Push notifications
  registerPushToken: (token: string) => Promise<void>;
}

const DEFAULT_CYCLE_SETTINGS: CycleSettings = {
  avgCycleLength: 28,
  avgPeriodLength: 5,
  lastPeriodStartDate: new Date().toISOString().split('T')[0],
};

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
      cycleSettings: DEFAULT_CYCLE_SETTINGS,
      activeSOS: null,

      // -----------------------------------------------------------------------
      // Auth
      // -----------------------------------------------------------------------
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const userId = data.user.id;

        // Hydrate profile from DB
        const profile = await getProfile(userId);
        const cycleSettings = profile?.role === 'girlfriend'
          ? await getCycleSettings(userId) ?? DEFAULT_CYCLE_SETTINGS
          : DEFAULT_CYCLE_SETTINGS;

        const couple = await getMyCouple();

        set({
          isLoggedIn: true,
          email: data.user.email ?? email,
          userId,
          role: profile?.role ?? null,
          isPartnerLinked: couple?.status === 'linked',
          coupleId: couple?.id ?? null,
          cycleSettings,
        });
      },

      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Sign up failed — no user returned');

        // Profile row is auto-created by the DB trigger.
        // Role is set in onboarding.
        set({
          isLoggedIn: true,
          email: data.user.email ?? email,
          userId: data.user.id,
          role: null,
          isPartnerLinked: false,
          coupleId: null,
          cycleSettings: DEFAULT_CYCLE_SETTINGS,
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
          cycleSettings: DEFAULT_CYCLE_SETTINGS,
        });
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
        const cycleSettings = profile?.role === 'girlfriend'
          ? await getCycleSettings(userId) ?? DEFAULT_CYCLE_SETTINGS
          : DEFAULT_CYCLE_SETTINGS;
        const couple = await getMyCouple();

        set({
          isLoggedIn: true,
          email: session.user.email ?? '',
          userId,
          role: profile?.role ?? null,
          isPartnerLinked: couple?.status === 'linked',
          coupleId: couple?.id ?? null,
          cycleSettings,
        });
      },

      // -----------------------------------------------------------------------
      // Partner linking
      // -----------------------------------------------------------------------
      setPartnerLinked: (linked) => set({ isPartnerLinked: linked }),

      generateLinkCode: async () => {
        const { userId } = get();
        if (!userId) throw new Error('Not signed in');

        const code = await createOrRefreshLinkCode(userId);
        set({ linkCode: code });
        return code;
      },

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

        set({ activeSOS: option });
        setTimeout(() => get().clearSOS(), 10_000);

        // Persist to DB so BF's Realtime subscription triggers
        if (userId && coupleId) {
          await sendSOSSignal(coupleId, userId, option);
        }
      },

      // Called by useSOSListener when BF receives via Realtime — no DB write needed
      receiveSOS: (option) => {
        set({ activeSOS: option });
        setTimeout(() => get().clearSOS(), 10_000);
      },

      clearSOS: () => set({ activeSOS: null }),

      // -----------------------------------------------------------------------
      // Push notifications
      // -----------------------------------------------------------------------
      registerPushToken: async (token) => {
        const { userId } = get();
        if (userId) {
          await upsertPushToken(userId, token);
        }
      },
    }),
    {
      name: 'easel-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // activeSOS is transient; userId/coupleId are re-hydrated via bootstrapSession
      partialize: ({ activeSOS, userId, coupleId, ...rest }) => rest,
    },
  ),
);
