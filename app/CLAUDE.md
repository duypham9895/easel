# app/ — Expo React Native Mobile App

## Purpose
The Easel mobile app is a couples period tracking app built with Expo SDK 52 and React Native 0.76. It serves two roles: **Moon** (girlfriend — tracks cycle, sends whispers/SOS) and **Sun** (boyfriend — receives phase-aware guidance and alerts). Single binary, role-based theming at login.

## Tech Stack
- **Framework**: Expo SDK 52, React Native 0.76, TypeScript (strict)
- **Navigation**: Expo Router v4 (file-based routing)
- **State**: Zustand 5 + AsyncStorage persistence
- **Backend**: Supabase (PostgreSQL + RLS + Realtime + Edge Functions)
- **AI**: MiniMax M2.5 via Vercel proxy (see `../proxy/`)
- **Health**: Apple HealthKit (`react-native-health`), Android Health Connect (`react-native-health-connect`)
- **i18n**: i18next + react-i18next + expo-localization (EN + VI)
- **Notifications**: Expo Push API
- **Auth**: Supabase Auth (email/password, PKCE deep links)
- **Biometric**: expo-local-authentication

## Key Entry Points
1. `app/_layout.tsx` — Root layout, auth state listener, deep link handler, notification setup
2. `app/index.tsx` — Entry: splash → route based on auth/role state
3. `store/appStore.ts` — **Single source of truth** (428 lines, all state + actions)
4. `lib/supabase.ts` — Supabase client singleton
5. `lib/db/*.ts` — Data access layer (profiles, couples, cycle, sos, pushTokens)
6. `constants/theme.ts` — Design system (colors, spacing, typography)
7. `utils/cycleCalculator.ts` — Pure cycle phase math

## How to Run
```bash
cd app
npm install
npx expo start          # Dev server (Expo Go or dev client)
npx expo run:ios        # Native iOS build
npx expo run:android    # Native Android build
eas build --platform ios --profile production  # Production build
```

Required `.env` (see `.env.example`):
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_PROXY_URL`, `EXPO_PUBLIC_CLIENT_TOKEN`
- `EXPO_PUBLIC_EAS_PROJECT_ID`

## Key Dependencies
| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Backend client (auth, DB, realtime, storage) |
| `zustand` | Global state management |
| `expo-router` | File-based navigation |
| `react-native-health` | Apple HealthKit integration |
| `react-native-health-connect` | Android Health Connect integration |
| `react-native-calendars` | Calendar UI with cycle markers |
| `react-native-reanimated` | Advanced animations |
| `i18next` / `react-i18next` | Internationalization |
| `expo-notifications` | Push notification handling |
| `expo-local-authentication` | Biometric unlock |

## Directory Structure
```
app/
├── app/                    Expo Router screens
│   ├── _layout.tsx         Root layout + auth bootstrap
│   ├── index.tsx           Entry point (splash/routing)
│   ├── auth.tsx            Login/signup
│   ├── onboarding.tsx      Role selection (Moon/Sun)
│   ├── health-sync.tsx     HealthKit/HealthConnect sync
│   ├── reset-password.tsx  Password recovery
│   └── (tabs)/             Tab navigation
│       ├── index.tsx       Dashboard (role-aware)
│       ├── calendar.tsx    Calendar view
│       └── settings.tsx    Settings/profile
├── screens/                Full dashboard views
│   ├── MoonDashboard.tsx   Girlfriend dashboard (322 lines)
│   └── SunDashboard.tsx    Boyfriend dashboard (315 lines)
├── components/
│   ├── gf/                 Moon UI (PhaseWheel, DailyCheckIn, SOSSheet)
│   ├── moon/               Moon extras (WhisperSheet, HealthSyncPrompt)
│   ├── bf/                 Sun UI (GuideCard, SOSAlert)
│   ├── sun/                Sun extras (WhisperAlert, UnlinkedScreen)
│   └── shared/             Shared components (HeaderButton)
├── store/appStore.ts       Zustand global store (single file)
├── lib/
│   ├── supabase.ts         Client singleton
│   └── db/                 Data access layer
│       ├── profiles.ts     User profile CRUD
│       ├── couples.ts      Partner linking + Realtime
│       ├── cycle.ts        Cycle settings CRUD
│       ├── sos.ts          SOS/Whisper signals
│       └── pushTokens.ts   Push token management
├── hooks/                  Custom React hooks
│   ├── useAIGreeting.ts    AI greeting with fallback
│   ├── useAIDailyInsight.ts AI post-checkin insight
│   ├── useAIPartnerAdvice.ts AI partner advice
│   ├── useAISOSTip.ts      AI SOS response tip
│   ├── useAIWhisperOptions.ts AI whisper suggestions
│   ├── useHealthSync.ts    HealthKit/HealthConnect
│   ├── useNotifications.ts Push notification lifecycle
│   ├── useSOSListener.ts   Realtime SOS listener (Sun)
│   ├── useCoupleLinkedListener.ts Realtime couple linking (Moon)
│   ├── useWhisper.ts       Whisper history + autocomplete
│   ├── useAvatarUpload.ts  Avatar upload to Storage
│   └── useLocalAuth.ts     Biometric auth
├── constants/
│   ├── theme.ts            Colors, spacing, typography, radii
│   ├── phases.ts           Phase metadata + static content
│   ├── sos.ts              SOS option definitions
│   └── whisper.ts          Phase-based whisper options (4 per phase)
├── types/index.ts          TypeScript interfaces
├── utils/cycleCalculator.ts Pure cycle math
├── i18n/
│   ├── config.ts           i18next setup
│   ├── en/                 English (11 namespace JSON files)
│   └── vi/                 Vietnamese (11 namespace JSON files)
└── supabase/
    ├── config.toml         Supabase project config
    ├── migrations/         SQL migrations (001-006)
    └── functions/          Deno Edge Functions
        ├── notify-cycle/   Daily cycle notifications (cron)
        └── notify-sos/     Real-time SOS push notifications (webhook)
```

## Conventions & Patterns

### State Management
- **Single Zustand store** (`appStore.ts`) is the only place that mutates state
- **Optimistic updates**: UI changes immediately, DB sync is async best-effort
- **Transient fields** (`activeSOS`, `activeWhisper`, `userId`, `coupleId`) excluded from AsyncStorage
- **Module-level timers** (`_sosTimer`, `_whisperTimer`) live outside Zustand to avoid serialization

### AI Integration
- Every AI hook follows: **static fallback shown immediately → AI replaces on success → silent fallback on error**
- All AI hooks use `AbortController` to cancel in-flight requests on unmount
- AI responses marked with `isAI: true/false` flag for UI badging

### Data Layer
- `lib/db/*.ts` are **pure async functions** (no React, no Zustand) — 1:1 with Supabase operations
- Store actions call DB functions, never the other way around
- Use upserts for idempotent operations

### Component Organization
- Components split by role: `gf/` (Moon), `bf/` (Sun), `moon/`, `sun/`, `shared/`
- `gf/` and `bf/` are the original naming; `moon/` and `sun/` are the redesigned additions
- Screens in `screens/` are full-page views; `components/` are reusable pieces

### Styling
- `StyleSheet.create()` at bottom of every component file
- Design tokens centralized in `constants/theme.ts`
- Moon theme: dark indigo (`#0D1B2A`), Sun theme: warm cream (`#FFF8F0`)
- Phase colors: menstrual `#FF5F7E`, follicular `#70D6FF`, ovulatory `#FFB347`, luteal `#4AD66D`

### Path Aliases
- `@/*` maps to `./` (e.g., `@/store/appStore`, `@/hooks/useHealthSync`)

### Naming
- Components: PascalCase files and exports
- Hooks: `use` prefix, camelCase
- DB types: `Db` prefix (e.g., `DbProfile`, `DbCouple`)
- Constants: UPPER_SNAKE_CASE
- Screen files: kebab-case (e.g., `health-sync.tsx`)

## Gotchas
- **DbCouple type duplication**: Defined in both `types/index.ts` and `lib/db/couples.ts` — keep them in sync
- **Component folder naming**: `gf/`/`bf/` (v1.0) and `moon/`/`sun/` (v1.1+) coexist — both are active
- **Ovulation formula**: `avgCycleLength - 14` (not `/2`) — this was a critical bug fix in v1.5.1
- **Whisper vs SOS IDs**: Whisper IDs prefixed with `whisper_` to avoid collision with SOS IDs (e.g., `whisper_hug` vs `hug`)
- **SOS type constraint**: DB regex `^[a-z][a-z0-9_]{0,49}$` — new signal types must match this
- **Edge Functions are Deno**: Use Deno APIs, not Node.js — imports use URL syntax
- **HealthKit is iOS-only**: `useHealthSync` has platform-specific branching
- **Rate limiter**: Proxy rate limit is per-instance (in-memory), resets on cold start

## Notes for Claude
- Always read `store/appStore.ts` first — it's the heart of the app
- The app has two personas (Moon/Sun) with different themes, features, and AI content
- Cycle phases are: menstrual → follicular → ovulatory → luteal (always this order)
- Database changes require a new migration in `supabase/migrations/` (numbered sequentially)
- AI proxy calls go through `../proxy/` — never call MiniMax directly from the app
- All Supabase tables have RLS — test new queries with both roles
- Translations live in `i18n/en/` and `i18n/vi/` — changes must be mirrored in both
- Use `@/` path alias for imports (configured in tsconfig.json)
