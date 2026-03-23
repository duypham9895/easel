# Architecture

**Analysis Date:** 2026-03-22

## Pattern Overview

**Overall:** Layered monorepo with strict separation between mobile client, serverless proxy, and static assets. Single-source-of-truth state management with pessimistic data synchronization between local store and Supabase.

**Key Characteristics:**
- **Zustand single store** as the only state mutation point
- **Pure data access layer** (`lib/db/*.ts`) with no React/state dependencies
- **Realtime-first architecture** for couples communication (SOS, Whisper, linked status)
- **AI fallback pattern** where static content displays immediately, AI replaces on success, silently falls back on error
- **Role-aware UI** with single binary (Moon = girlfriend/tracker, Sun = boyfriend/supporter)
- **Optimistic updates** for responsive UX with async database synchronization

## Layers

**Presentation (UI Components):**
- Purpose: Render role-aware screens with real-time updates
- Location: `app/components/`, `app/screens/`
- Contains: React Native components, screens (MoonDashboard, SunDashboard), role-specific UI (gf/, bf/, moon/, sun/, shared/)
- Depends on: Store (read-only selectors), Hooks (side effects), Constants (theme, phases)
- Used by: Expo Router screens (`app/app/(tabs)/`)

**Business Logic & State (Zustand Store):**
- Purpose: Centralized state management with optimistic updates, cycle calculations, signal management
- Location: `app/store/appStore.ts` (428 lines, single file)
- Contains: All application state (auth, cycle, signals, preferences), all mutation actions, cycle recomputation logic
- Depends on: Data access layer (`lib/db/`), TypeScript types, i18n
- Used by: All components via `useAppStore()` hook, all side-effect hooks

**Side Effects & Data Synchronization (Custom Hooks):**
- Purpose: Bridge between store and external systems (AI, Realtime, HealthKit, Push notifications)
- Location: `app/hooks/`
- Contains: AI hooks (useAIGreeting, useAIDailyInsight, etc.), Realtime listeners (useSOSListener, useCoupleLinkedListener), health sync hooks, notification hooks
- Depends on: Store (read/write), Data access layer (fetch operations), Proxy (HTTP calls)
- Used by: Root layout (`app/_layout.tsx`), screens, components

**Data Access Layer (Pure Async Functions):**
- Purpose: Encapsulate all Supabase operations without React/state logic
- Location: `app/lib/db/*.ts` (profiles, couples, cycle, sos, pushTokens, periodDayLogs)
- Contains: CRUD functions, Realtime subscriptions, RLS-aware queries
- Depends on: Supabase client (`lib/supabase.ts`)
- Used by: Store actions, hooks

**Supabase Client:**
- Purpose: PostgreSQL database connection, auth, Realtime, Storage
- Location: `app/lib/supabase.ts`
- Contains: Singleton client initialization with RLS row-level security
- Depends on: Environment variables (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)
- Used by: All data access functions

**AI Proxy (Vercel Serverless):**
- Purpose: Protect MiniMax API key, implement 5-layer security, sophisticated prompt engineering
- Location: `proxy/api/*.ts`, `proxy/lib/minimax.ts`
- Contains: 10 AI endpoints (greeting, partner-advice, sos-tip, daily-insight, whisper-options, phase-insight, self-care, predict-cycle, health, cycle-health-insight)
- Depends on: Environment variables (MINIMAX_API_KEY), Rate limiter, Token auth
- Used by: Mobile app via HTTP POST to `EXPO_PUBLIC_PROXY_URL`

**Navigation (Expo Router v4):**
- Purpose: File-based routing with role-aware branching
- Location: `app/app/`
- Contains: Root layout (`_layout.tsx`), entry point (`index.tsx`), auth flow (auth.tsx), onboarding (onboarding.tsx), tab navigation (`(tabs)/_layout.tsx`), screens
- Depends on: Store for role/auth state, deep link handler for PKCE flow
- Used by: All screen navigation

**Constants & Design System:**
- Purpose: Centralized design tokens, cycle phases, signal options
- Location: `app/constants/` (theme.ts, phases.ts, sos.ts, whisper.ts)
- Contains: Colors (Moon dark indigo, Sun warm cream, phase colors), spacing, typography, phase metadata, SOS options (4 types), Whisper options (4 per phase)
- Depends on: None
- Used by: All components, screens, constants

**Utilities:**
- Purpose: Pure functions for cycle math, date calculations
- Location: `app/utils/cycleCalculator.ts`
- Contains: Phase detection, day-in-cycle calculation, cycle stats, deviation detection, prediction window calculation
- Depends on: Type definitions
- Used by: Store actions, components

**Internationalization:**
- Purpose: Multi-language support (English, Vietnamese)
- Location: `app/i18n/` (config, en/, vi/)
- Contains: i18next setup, 11 namespace JSON files per language
- Depends on: react-i18next, expo-localization
- Used by: All text-rendering components

## Data Flow

**Authentication & Session Bootstrap:**

1. App starts → `app/index.tsx` calls `bootstrapSession()`
2. `bootstrapSession()` queries Supabase auth state
3. If session exists: fetch profile, cycle settings, couple status, period logs, period day logs
4. Hydrate store with user state (isLoggedIn, userId, role, coupleId, cycleSettings, periodLogs)
5. Deep link handler (PKCE flow) intercepts auth tokens and calls `setSession()` + `bootstrapSession()`
6. Router conditionally branches: `/auth` (not logged in) → `/onboarding` (no role) → `/(tabs)` (dashboard)

**Period Logging & Cycle Recalculation:**

1. User logs period start in calendar UI
2. Component calls `store.addPeriodLog(startDate)` (optimistic)
3. Store action immediately updates local state, sets `isSavingDayLog: true`
4. Async: calls `logPeriodStart()` (DB write), recomputes cycle stats from logs
5. Store recalculates `cycleSettings` (avgCycleLength via weighted gaps, avgPeriodLength), detects deviations, computes prediction window
6. Returns updated state to UI
7. If Flo-style per-day log added: auto-creates/extends period log if adjacent to existing period

**SOS/Whisper Signal Flow (Realtime):**

1. **Send (Sender initiates):**
   - User taps SOS button in UI
   - Component calls `store.sendSOS(option)` (optimistic)
   - Store sets `activeSOS: option`, starts 5-min timeout timer
   - Async: calls `sendSOSSignal(coupleId, userId, option)` → inserts `sos_signals` row
   - Supabase Realtime triggers for partner's subscription

2. **Receive (Foreground - in-app):**
   - `useSOSListener()` hook subscribed to `sos_signals` changes for this couple
   - When row inserted: `subscribeToSOS()` callback fires, calls `store.receiveWhisper(option)`
   - Store sets `activeWhisper: option`, displays alert banner, starts 5-min timeout

3. **Receive (Background - app closed):**
   - Supabase Edge Function `notify-sos` webhook triggered on `sos_signals` INSERT
   - Edge Function calls Expo Push API with push token
   - Expo notification delivered to device
   - User taps notification → routes to home tab, shows alert

**AI Fallback Pattern:**

1. Component mounts, calls `useAIGreeting()` hook
2. Hook immediately sets fallback greeting from i18n (deterministic per day/phase)
3. If proxy configured: async POST to `${EXPO_PUBLIC_PROXY_URL}/api/greeting`
4. On success: replace fallback with AI response, set `isAI: true` flag
5. On error: log warning, keep fallback, set `isAI: false`
6. Component shows fallback immediately, AI badge appears when AI loads

**State Management:**

- **Persistent state:** All fields except `activeSOS`, `activeWhisper`, `lastDeviation`, `predictionWindow`, `userId`, `coupleId`, `selectedCalendarDay`, `isSavingDayLog`
- **AsyncStorage serialization:** Zustand middleware with `persist()` handles async/sync to device storage
- **Optimistic updates:** UI updates immediately (e.g., period log added), DB sync is async best-effort
- **Transient timers:** Module-level refs (`_sosTimer`, `_whisperTimer`) outside Zustand to prevent serialization issues

**Realtime Subscriptions:**

- **Couple linking:** `useCoupleLinkListener()` → `subscribeToCoupleLinked()` → updates store when girlfriend's couple status changes to 'linked'
- **Period day logs:** `usePeriodDayLogListener()` → `subscribeToPeriodDayLogs()` → syncs partner's period day logs for Sun users
- **SOS/Whisper signals:** `useSOSListener()` → `subscribeToSOS()` → receives partner's SOS/Whisper, updates store
- **Unsubscribe on unmount:** All listeners return cleanup functions, called on component unmount

## Key Abstractions

**AppStore (Single Source of Truth):**
- Purpose: Centralized state + mutations, prevents scattered state updates
- Examples: `app/store/appStore.ts`
- Pattern: Zustand store with `(set, get) => ({ ...state, ...actions })` factory
- Usage: `const { isLoggedIn, email, role } = useAppStore(s => ({ isLoggedIn: s.isLoggedIn, email: s.email, role: s.role }))`

**Data Access Layer (Repository Pattern):**
- Purpose: Encapsulate Supabase operations, enable easy testing with mocks
- Examples: `app/lib/db/profiles.ts`, `app/lib/db/couples.ts`, `app/lib/db/cycle.ts`
- Pattern: Async functions (getProfile, upsertProfile, fetchPeriodLogs, etc.), RLS-aware filters
- Usage: `const profile = await getProfile(userId)` (no React, no state)

**Realtime Subscription Helpers:**
- Purpose: Return unsubscribe functions, enable cleanup on unmount
- Examples: `subscribeToCoupleLinked()`, `subscribeToSOS()`
- Pattern: Create RealtimeChannel, return cleanup function
- Usage: `const unsubscribe = subscribeToSOS(coupleId, callback); return () => unsubscribe();`

**Custom Hooks (Side Effects Coordination):**
- Purpose: Bridge between store and external systems
- Examples: `useAIGreeting`, `useNotifications`, `useSOSListener`
- Pattern: useEffect with AbortController for cancellation, store updates, Realtime subscriptions
- Usage: Call once in root layout or screen to activate side effects

**AI Prompt Functions (MiniMax Integration):**
- Purpose: Centralized prompt engineering with temperature/token tuning
- Examples: `generateGreeting()`, `generatePartnerAdvice()`, `generateSOSTip()`
- Pattern: `lib/minimax.ts` functions with explicit system prompt, user message, max tokens, temperature
- Usage: Called from proxy endpoints via `await generateGreeting(phase, dayInCycle, phaseTagline, language)`

**Cycle Calculator (Pure Math):**
- Purpose: Deterministic cycle phase/day detection, deviation detection, prediction
- Examples: `getCurrentDayInCycle()`, `detectDeviation()`, `computePredictionWindow()`
- Pattern: No side effects, pure input → output
- Usage: `const phase = getCurrentPhase(lastPeriodStart, cycleLength)`, `const window = computePredictionWindow(logs, settings)`

**Constants (Design Tokens & Metadata):**
- Purpose: Single source of truth for UI styling, phase info, signal options
- Examples: `Colors`, `MoonColors`, `SunColors`, `PHASE_INFO`, `SOS_OPTIONS`, `WHISPER_OPTIONS`
- Pattern: `export const X = { ... } as const` for tree-shaking and strict typing
- Usage: `import { Colors } from '@/constants/theme'`, `const phaseInfo = PHASE_INFO[phase]`

## Entry Points

**Mobile App Entry:**
- Location: `app/app/index.tsx`
- Triggers: App launch
- Responsibilities: Bootstrap session, route based on auth/role state

**Root Layout:**
- Location: `app/app/_layout.tsx`
- Triggers: All screens
- Responsibilities: Set up auth state listener, deep link handler, gesture handler, notification hooks, period day log listener

**Dashboard (Role-aware):**
- Location: `app/app/(tabs)/index.tsx`
- Triggers: Authenticated user taps "Today" tab
- Responsibilities: Render MoonDashboard or SunDashboard based on role

**Proxy Health Check:**
- Location: `proxy/api/health.ts`
- Triggers: External monitoring, app startup verification
- Responsibilities: Validate environment variables, return status

## Error Handling

**Strategy:** Explicit handling at every layer with user-friendly messages in UI, detailed logging server-side.

**Patterns:**

- **Store actions:** Throw on DB error, catch in UI component, display toast/alert
- **Hooks:** Catch in useEffect, log warning, use fallback value, continue gracefully
- **Data access functions:** Throw on query error, caller decides recovery strategy (retry, fallback, alert)
- **Proxy endpoints:** Return JSON with `error` field (never throw HTTP error), log detailed context server-side
- **Realtime subscriptions:** Silent catch of subscription errors, no crash, user sees stale data temporarily
- **AI requests:** AbortError silently ignored (component unmounted), other errors logged, fallback shown

**Examples:**

- Period log save fails → show "Failed to save. Try again?" button, keep optimistic UI
- AI greeting fetch times out → keep static greeting visible, no visual error
- Partner link code expires → show "Code expired. Generate a new one" message
- Proxy rate limited → return 429 with `error: "Try again in a few seconds"`, no crash

## Cross-Cutting Concerns

**Logging:**
- App: `console.log()` for info, `console.warn()` for recoverable errors, `console.error()` for critical failures
- Proxy: `console.error('[endpoint-name] error:', err)` pattern for server-side debugging
- Pattern: Include context (function name, operation type, error details)

**Validation:**
- App: Client-side validation on user input (date ranges, enum values, string lengths)
- Proxy: 5-layer validation (enum whitelist, range checks, array bounds, string caps)
- Pattern: Fail fast with clear error messages, never trust external data (API responses, user input)

**Authentication:**
- App: Supabase Auth (email/password, PKCE deep links), RLS on every table
- Proxy: `X-Client-Token` header with timing-safe comparison (SHA256 + timingSafeEqual)
- Pattern: All Supabase queries respect RLS — test as both Moon and Sun roles

**Rate Limiting:**
- App: No rate limiting (Supabase handles auth rate limit)
- Proxy: 30 req/min per IP (sliding window, in-memory, resets on cold start)
- Pattern: Return 429 on limit exceeded, log IP + endpoint

**Internationalization:**
- App: i18next + react-i18next + expo-localization
- Pattern: `const { t } = useTranslation('namespace')`, all strings in JSON files (en/, vi/)
- Changes: Mirror all text updates in both English and Vietnamese (11 namespaces each)

**Realtime Consistency:**
- Pattern: Optimistic updates on send, wait for Realtime callback to confirm
- Fallback: If Realtime silent for 5 seconds, UI still shows sent state (not reverted)
- Concern: Couple linking can race if both tap link button simultaneously (database constraint prevents)

---

*Architecture analysis: 2026-03-22*
