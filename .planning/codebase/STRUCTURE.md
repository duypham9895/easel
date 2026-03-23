# Codebase Structure

**Analysis Date:** 2026-03-22

## Directory Layout

```
easel/
├── app/                    Expo React Native mobile app (iOS + Android)
│   ├── app/                Expo Router screens (file-based routing)
│   │   ├── _layout.tsx     Root layout, auth listener, deep link handler
│   │   ├── index.tsx       Entry point (splash/routing logic)
│   │   ├── auth.tsx        Login/signup screen
│   │   ├── onboarding.tsx  Role selection (Moon/Sun)
│   │   ├── health-sync.tsx HealthKit/HealthConnect sync flow
│   │   ├── reset-password.tsx Password recovery
│   │   └── (tabs)/         Tab navigation (3 tabs: today, calendar, settings)
│   │       ├── _layout.tsx Tab structure with role-aware styling
│   │       ├── index.tsx   Dashboard selector (routes to MoonDashboard or SunDashboard)
│   │       ├── calendar.tsx Calendar view (Flo-style cycle timeline for Moon, partner cycle for Sun)
│   │       └── settings.tsx Settings/profile/preferences
│   ├── screens/            Full dashboard views
│   │   ├── MoonDashboard.tsx Girlfriend dashboard (322 lines)
│   │   └── SunDashboard.tsx Boyfriend dashboard (315 lines)
│   ├── components/
│   │   ├── gf/             Moon UI (legacy naming) — PhaseWheel, DailyCheckIn, SOSSheet
│   │   ├── bf/             Sun UI (legacy naming) — GuideCard, SOSAlert, GuideSheet
│   │   ├── moon/           Moon UI (current) — redesigned components, Whisper sheet, health sync
│   │   ├── sun/            Sun UI (current) — redesigned components, Whisper alert
│   │   └── shared/         Shared components (HeaderButton, modal helpers)
│   ├── store/
│   │   └── appStore.ts     Zustand global store (428 lines, single file, only place that mutates state)
│   ├── lib/
│   │   ├── supabase.ts     Supabase client singleton (RLS-aware initialization)
│   │   └── db/             Data access layer (pure async functions, no React)
│   │       ├── profiles.ts User profile CRUD (getProfile, upsertProfile)
│   │       ├── couples.ts  Partner linking (createOrRefreshLinkCode, linkToPartnerByCode, subscribeToCoupleLinked)
│   │       ├── cycle.ts    Cycle settings (getCycleSettings, upsertCycleSettings, logPeriodStart, fetchPeriodLogs)
│   │       ├── periodDayLogs.ts Flo-style per-day logs (upsertPeriodDayLog, fetchPeriodDayLogs, deletePeriodDayLog)
│   │       ├── sos.ts      SOS/Whisper signals (sendSOSSignal, subscribeToSOS)
│   │       ├── pushTokens.ts Push token management (upsertPushToken)
│   │       └── dailyLogs.ts Daily mood/energy/symptoms logs
│   ├── hooks/              Custom React hooks (side effects, external integrations)
│   │   ├── useAIGreeting.ts Moon's daily phase-aware greeting (fallback + AI)
│   │   ├── useAIDailyInsight.ts Moon's post-checkin AI insight
│   │   ├── useAIPartnerAdvice.ts Sun's actionable phase tip
│   │   ├── useAISOSTip.ts Sun's immediate SOS response tip
│   │   ├── useAIWhisperOptions.ts AI-generated whisper options (4 per phase)
│   │   ├── useAIPhaseInsight.ts Phase-based insights
│   │   ├── useAISelfCare.ts Self-care recommendations
│   │   ├── useCycleHealthInsight.ts Health data insights
│   │   ├── useHealthSync.ts HealthKit/HealthConnect sync (pull health data)
│   │   ├── useNotifications.ts Push registration + tap listener (native + web)
│   │   ├── useSOSListener.ts Realtime SOS/Whisper listener (Sun only)
│   │   ├── useCoupleLinkedListener.ts Realtime couple linked status (Moon only)
│   │   ├── usePeriodListener.ts Period log Realtime listener
│   │   ├── usePeriodDayLogListener.ts Period day log Realtime listener (Sun sees partner's data)
│   │   ├── useDeviationDetection.ts Cycle deviation alerts
│   │   ├── useLocalAuth.ts Biometric auth (expo-local-authentication)
│   │   ├── useAvatarUpload.ts Avatar upload to Supabase Storage
│   │   └── useWhisper.ts Whisper history + autocomplete
│   ├── constants/          Design tokens, phase metadata, signal options
│   │   ├── theme.ts        Colors (Moon indigo, Sun cream, phase colors), spacing, typography, radii
│   │   ├── phases.ts       Phase metadata (tags, descriptions, static content)
│   │   ├── sos.ts          SOS options (4 types: sweet_tooth, need_a_hug, cramps_alert, quiet_time)
│   │   └── whisper.ts      Whisper options (4 per phase: menstrual, follicular, ovulatory, luteal)
│   ├── types/
│   │   └── index.ts        TypeScript interfaces (UserRole, CyclePhase, SOSOption, CycleSettings, DbProfile, etc.)
│   ├── utils/
│   │   └── cycleCalculator.ts Pure cycle math (getCurrentPhase, getCurrentDayInCycle, detectDeviation, computePredictionWindow, computeCycleStats)
│   ├── i18n/               Internationalization
│   │   ├── config.ts       i18next initialization + language setup
│   │   ├── en/             English translations (11 namespace JSON files)
│   │   └── vi/             Vietnamese translations (11 namespace JSON files)
│   ├── supabase/           Database migrations + Edge Functions
│   │   ├── config.toml     Supabase project config
│   │   ├── migrations/     SQL migrations (001-008, applied sequentially)
│   │   └── functions/      Deno Edge Functions
│   │       ├── notify-cycle/ Daily cycle notifications (cron trigger)
│   │       └── notify-sos/   Real-time SOS push notifications (webhook trigger)
│   ├── assets/             Images, fonts
│   ├── __tests__/          Test files
│   └── package.json        Dependencies + scripts

├── proxy/                  Vercel serverless AI proxy
│   ├── api/                Serverless endpoint handlers (POST-only, auth-required)
│   │   ├── greeting.ts     Moon's daily greeting
│   │   ├── partner-advice.ts Sun's phase tip
│   │   ├── sos-tip.ts      Sun's SOS response tip
│   │   ├── daily-insight.ts Moon's post-checkin insight
│   │   ├── whisper-options.ts AI whisper menu (4 options)
│   │   ├── phase-insight.ts Phase-based insights
│   │   ├── self-care.ts    Self-care recommendations
│   │   ├── predict-cycle.ts Next period prediction
│   │   ├── health.ts       Health check (no auth required)
│   │   └── cycle-health-insight.ts Health data analysis
│   ├── lib/                Shared utilities
│   │   ├── minimax.ts      MiniMax API calls + all prompt functions (most critical file)
│   │   ├── auth.ts         Token validation (timingSafeEqual)
│   │   ├── rateLimit.ts    Sliding window rate limiter (30 req/min per IP)
│   │   └── sanitize.ts     Input sanitization
│   ├── vercel.json         Vercel configuration + security headers
│   └── package.json        Dependencies + scripts

├── landing/                Static landing page
│   ├── index.html          Main page
│   └── vi/                 Vietnamese version
│       └── index.html

├── docs/                   All documentation
│   ├── project/            Core project docs
│   ├── features/           Feature documentation
│   ├── releases/           Release notes (v1.6.0/, etc.)
│   ├── reviews/            Expert audits
│   ├── plans/              Design plans
│   ├── bugs/               Bug investigations
│   └── skills/             Pipeline definitions

├── .github/                CI/CD workflows
│   └── workflows/
│       ├── supabase.yml    Deploy Supabase migrations
│       ├── proxy.yml       Deploy proxy to Vercel
│       ├── notify-cycle.yml Deploy Edge Function (cycle notifications)
│       └── pages.yml       Deploy landing page to GitHub Pages

├── .planning/codebase/     Codebase analysis documents (generated)
│   ├── ARCHITECTURE.md     Architecture & data flow
│   ├── STRUCTURE.md        This file
│   ├── STACK.md            Technology stack (for tech focus)
│   ├── INTEGRATIONS.md     External services (for tech focus)
│   ├── CONVENTIONS.md      Coding conventions (for quality focus)
│   ├── TESTING.md          Testing patterns (for quality focus)
│   └── CONCERNS.md         Technical debt (for concerns focus)

└── README.md               Project overview
```

## Directory Purposes

**app/app/ (Expo Router Screens):**
- Purpose: File-based routing with role-aware branching
- Contains: Entry point, auth flow, onboarding, dashboard, calendar, settings
- Key files: `_layout.tsx` (root), `index.tsx` (entry), `(tabs)/_layout.tsx` (tab structure)

**app/screens/ (Full Dashboard Views):**
- Purpose: Role-specific full-page dashboards
- Contains: MoonDashboard.tsx (girlfriend cycle tracking), SunDashboard.tsx (boyfriend support)
- Pattern: No sub-routing, rendered directly from tab index

**app/components/ (Reusable UI):**
- Purpose: Composable UI pieces organized by role and purpose
- Contains: gf/, bf/ (legacy role naming), moon/, sun/ (current), shared/
- Pattern: PascalCase files, small focused components (<300 lines), StyleSheet.create() at bottom

**app/store/appStore.ts (Single Source of Truth):**
- Purpose: Centralized state + mutations, prevents scattered updates
- Contains: All application state, all state-changing actions, optimistic update logic
- Pattern: Zustand with `persist()` middleware, AsyncStorage for mobile persistence
- Critical: This is the ONLY place state is mutated

**app/lib/db/ (Data Access Layer):**
- Purpose: Pure async functions for Supabase operations
- Contains: CRUD functions, Realtime subscriptions, RLS-aware queries
- Pattern: No React, no state, explicit error handling, return transformed types
- Usage: Called from store actions and hooks

**app/hooks/ (Side Effects):**
- Purpose: Bridge between React component lifecycle and external systems
- Contains: AI integration, Realtime listeners, health sync, notifications
- Pattern: useEffect with AbortController, store updates, cleanup on unmount
- Activation: Mounted once in root layout or specific screens

**app/constants/ (Design Tokens):**
- Purpose: Centralized styling, phase info, signal definitions
- Contains: Colors (role-aware), spacing, typography, PHASE_INFO, SOS_OPTIONS, WHISPER_OPTIONS
- Pattern: `export const X = { ... } as const` for type safety
- Changes: Update once, reflect everywhere

**app/types/index.ts (TypeScript Definitions):**
- Purpose: Single source of truth for all interfaces
- Contains: UserRole, CyclePhase, SOSOption, CycleSettings, all Db* types
- Pattern: Keep in sync with Supabase schema
- Duplication: Some types defined in both types/index.ts and lib/db/*.ts (keep in sync)

**app/utils/cycleCalculator.ts (Pure Math):**
- Purpose: Deterministic cycle calculations without side effects
- Contains: Phase detection, day-in-cycle, deviation detection, prediction window
- Pattern: No I/O, no state, pure input → output
- Reused by: Store actions, components, proxy (cycle-health-insight)

**app/i18n/ (Internationalization):**
- Purpose: Multi-language support (English, Vietnamese)
- Contains: i18next setup, 11 JSON namespace files per language
- Pattern: Always mirror changes in both en/ and vi/ directories
- Namespaces: dashboard, common, checkin, phases, signals, onboarding, settings, health, auth, cycle, calendar

**app/supabase/ (Database & Edge Functions):**
- Purpose: Database schema (migrations), RLS policies, backend logic
- Contains: 8 migrations (001-008), 2 Edge Functions (Deno)
- Pattern: Migrations numbered sequentially, functions use Deno APIs (not Node.js)
- RLS: Every table has RLS with `my_couple_id()` or `my_partner_id()` helper functions

**proxy/api/ (Serverless Endpoints):**
- Purpose: HTTPS endpoints for AI and health features
- Contains: 10 endpoint handlers, each follows 5-layer security pattern
- Pattern: POST-only, token auth, rate limit, validate, call MiniMax, respond
- Response format: `{ greeting: "..." }` on success, `{ error: "..." }` on error

**proxy/lib/minimax.ts (Prompt Engineering):**
- Purpose: All MiniMax API integration and prompt engineering
- Contains: 6+ prompt functions (generateGreeting, generatePartnerAdvice, etc.)
- Pattern: Centralized to enable easy tweaking
- Temperature tuning: Creative (0.85-0.9) for greetings/options, practical (0.75-0.8) for advice, deterministic (0.1) for predictions

**docs/ (Documentation):**
- Purpose: All project, feature, and audit documentation
- Contains: PRD, architecture notes, API specs, feature docs, expert reviews, release notes
- Pattern: One subfolder per feature or release, markdown files

**.github/workflows/ (CI/CD):**
- Purpose: Automated deployment of app, proxy, migrations, landing page
- Contains: 4 workflows for Supabase, Vercel proxy, Edge Functions, GitHub Pages
- Pattern: Triggered on push to main/specific branches

**.planning/codebase/ (Codebase Analysis):**
- Purpose: Generated analysis documents for orchestrator reference
- Contains: ARCHITECTURE.md, STRUCTURE.md, STACK.md, INTEGRATIONS.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- Pattern: Refreshed periodically to keep current

## Key File Locations

**Entry Points:**
- `app/app/index.tsx`: App bootstrap, session re-hydration, conditional routing
- `app/app/_layout.tsx`: Root layout, auth listener, deep link handler, notification setup
- `app/app/(tabs)/index.tsx`: Dashboard selector (Moon or Sun)
- `proxy/api/health.ts`: Proxy health check, environment validation

**Configuration:**
- `app/.env` (environment file — never committed): Supabase keys, proxy URL, client token
- `app/tsconfig.json`: TypeScript config, path aliases (`@/*` → `./`)
- `app/app.json`: Expo config (app name, icon, permissions, entrypoints)
- `proxy/.env` (environment file): MiniMax API key, model name, client token
- `proxy/vercel.json`: Vercel config, security headers

**Core Logic:**
- `app/store/appStore.ts`: Zustand store (auth, cycle, signals, preferences, all mutations)
- `app/lib/supabase.ts`: Supabase client singleton
- `app/utils/cycleCalculator.ts`: Cycle phase math
- `proxy/lib/minimax.ts`: MiniMax prompts and API calls

**Database & Backend:**
- `app/supabase/migrations/`: SQL migrations (001-008)
- `app/supabase/functions/notify-cycle/`: Daily cycle notifications (cron)
- `app/supabase/functions/notify-sos/`: Real-time SOS push (webhook)

**Testing:**
- `app/__tests__/`: Unit and integration tests
- `app/jest.config.js`: Jest configuration
- Maestro E2E tests in separate repo or linked via CI

## Naming Conventions

**Files:**
- Screen files: kebab-case (e.g., `health-sync.tsx`, `reset-password.tsx`)
- Component files: PascalCase (e.g., `PhaseWheel.tsx`, `DailyCheckIn.tsx`)
- Hook files: camelCase with `use` prefix (e.g., `useAIGreeting.ts`)
- DB access files: camelCase by entity (e.g., `profiles.ts`, `couples.ts`, `cycle.ts`)
- Constant files: camelCase (e.g., `theme.ts`, `phases.ts`)
- Utility files: camelCase (e.g., `cycleCalculator.ts`)
- Type files: lowercase plural or `index` (e.g., `types/index.ts`)

**Directories:**
- Feature screens: kebab-case (e.g., `(tabs)`, `(auth)`)
- Component folders: lowercase (e.g., `gf/`, `bf/`, `moon/`, `sun/`, `shared/`)
- State management: lowercase singular (`store/`)
- Data access: lowercase singular (`lib/db/`)
- Side effects: lowercase singular (`hooks/`)
- Design: lowercase singular (`constants/`)
- i18n: lowercase dual (e.g., `i18n/en/`, `i18n/vi/`)
- Migrations: numbered prefixes (`001-`, `002-`, etc.)

**Exports:**
- Components: PascalCase (e.g., `export function PhaseWheel() { ... }`)
- Functions: camelCase (e.g., `export async function getProfile() { ... }`)
- Interfaces/Types: PascalCase (e.g., `export interface DbProfile { ... }`)
- Constants: UPPER_SNAKE_CASE (e.g., `export const SOS_OPTIONS = [...]`)
- Enums: PascalCase singular (e.g., `export enum CyclePhase { ... }`)

**Import Paths:**
- Path alias: `@/` → `./` (configured in tsconfig.json)
- Pattern: `import { X } from '@/store/appStore'`, `import { useAI } from '@/hooks/useAI'`
- Never use: relative paths like `../../../` — use `@/` alias instead

**Database:**
- DB column names: snake_case (e.g., `user_id`, `last_period_start_date`)
- TypeScript DB types: `Db` prefix (e.g., `DbProfile`, `DbCouple`, `DbPeriodLog`)
- App types: camelCase (e.g., `CycleSettings`, `PeriodRecord`)
- RLS functions: snake_case (e.g., `my_couple_id()`, `my_partner_id()`)

**Constants:**
- Color tokens: PascalCase in objects (e.g., `Colors.menstrual`, `MoonColors.accentPrimary`)
- Phase: lowercase (e.g., `'menstrual'`, `'follicular'`)
- Role: lowercase (e.g., `'moon'`, `'sun'`)
- SOS/Whisper IDs: snake_case (e.g., `'sweet_tooth'`, `'need_a_hug'`, `'whisper_hug'`)

## Where to Add New Code

**New Feature (Complete Flow):**
- Primary code: `app/app/(tabs)/index.tsx` or new screen file + `app/screens/NewFeature.tsx`
- State: Add properties/actions to `app/store/appStore.ts`
- DB: Add functions to `app/lib/db/newEntity.ts`
- UI: Components in `app/components/moon/` or `app/components/sun/`
- Types: Add interfaces to `app/types/index.ts`
- Tests: `app/__tests__/newFeature.test.ts`
- Translations: `app/i18n/en/*`, `app/i18n/vi/*` (mirror in both languages)
- Constants: Add to `app/constants/` if design tokens or metadata

**New Component/Module:**
- Implementation: `app/components/{moon|sun|shared}/NewComponent.tsx`
- Pattern: Function component, TypeScript props, StyleSheet.create() at bottom
- Exports: Single default export (component function)
- Size: Keep <300 lines; extract utilities if larger
- Testing: Co-located `NewComponent.test.tsx`

**New Hook (Side Effect):**
- Location: `app/hooks/useNewEffect.ts`
- Pattern: useEffect with AbortController, store updates, cleanup on unmount
- Return type: Interface describing the hook result (e.g., `{ data, loading, error }`)
- Activation: Call in root layout (`_layout.tsx`) for app-wide effects, or specific screens for local effects
- Testing: Mock store and external dependencies

**New API Endpoint (Proxy):**
- Implementation: `proxy/api/newEndpoint.ts`
- Pattern: Copy existing endpoint, follow 5-layer security (method, auth, rate limit, validate, call minimax)
- Prompt function: Add to `proxy/lib/minimax.ts` (e.g., `export async function generateNewContent() { ... }`)
- Response: `{ fieldName: "..." }` on success, `{ error: "..." }` on error
- Testing: Unit test for prompt function, manual test via curl

**Database Migration:**
- Location: `app/supabase/migrations/00X-description.sql` (numbered sequentially)
- Pattern: Include RLS policies, helper functions, create indexes
- Deployment: Push to main branch, GitHub Actions runs migration
- Rollback: Create new migration with DROP/ALTER statements (don't revert old migration)

**New Type/Interface:**
- Location: `app/types/index.ts`
- Pattern: Centralized, exported, used everywhere
- DB types: Keep mirror in DB files (`DbNewEntity` pattern)
- Usage: Reference in store, hooks, components

**Shared Utility:**
- Location: `app/utils/utilName.ts` or create new file
- Pattern: Pure function (no side effects), TypeScript, thoroughly commented
- Testing: Unit tests in `app/utils/__tests__/utilName.test.ts`
- Reuse: Imported from multiple places, no duplication

**Constant/Design Token:**
- Location: `app/constants/{theme|phases|sos|whisper}.ts`
- Pattern: `export const X = { ... } as const` for tree-shaking
- Usage: Imported and referenced, never hardcoded values
- Changes: Update once, used everywhere automatically

**Test File:**
- Location: Co-located with source or `app/__tests__/`
- Pattern: `.test.ts` or `.spec.ts` suffix, Jest + React Native Testing Library
- Coverage: 80%+ target, unit + integration + E2E
- Pattern: RED (write test first, fail) → GREEN (implement) → IMPROVE (refactor)

**Documentation:**
- Location: `docs/features/{featureName}/` or `docs/project/`
- Pattern: Markdown files, include code examples, diagrams where helpful
- Linked from: `docs/README.md` (index)
- Maintained: Update when feature changes

## Special Directories

**app/.expo/ (Expo Build Cache):**
- Purpose: Build artifacts and caching
- Generated: Yes (by `expo prebuild`, `expo run:ios`)
- Committed: No (in .gitignore)

**app/.vercel/ (Vercel Build Cache):**
- Purpose: Vercel build artifacts
- Generated: Yes (by `vercel` CLI)
- Committed: No

**app/dist/ (Web Build Output):**
- Purpose: Production build for web export
- Generated: Yes (by `expo export --platform web`)
- Committed: No

**app/ios/ (Native iOS Code):**
- Purpose: iOS-specific native code, Pods, CocoaPods
- Generated: Partially (Pods generated by `pod install`)
- Committed: Some (XcodeProj, xcconfig) but not Pods
- Pattern: Use `npx expo run:ios` or Xcode for builds

**app/coverage/ (Test Coverage Reports):**
- Purpose: Jest coverage output
- Generated: Yes (by `npm run test:coverage`)
- Committed: No

**app/supabase/migrations/ (Database Migrations):**
- Purpose: Versioned SQL migrations applied sequentially
- Generated: No (hand-written)
- Committed: Yes (source of truth)
- Pattern: Numbered 001, 002, etc.; never modified after applied

**app/__tests__/ (Test Files):**
- Purpose: Unit, integration, and component tests
- Generated: No (hand-written)
- Committed: Yes
- Pattern: Mirror src structure or flat with descriptive names

---

*Structure analysis: 2026-03-22*
