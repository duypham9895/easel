# Easel — Architecture Reference

This document describes the system architecture, component responsibilities, data flow, and key design decisions.

> For user-facing flows, see [USER_JOURNEYS.md](./USER_JOURNEYS.md).
> For deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).
> For the change log, see [CHANGELOG.md](../CHANGELOG.md).

---

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Devices                             │
│                                                                     │
│   ┌──────────────────┐              ┌──────────────────┐            │
│   │   Moon (GF)      │              │   Sun (BF)       │            │
│   │   Easel App      │              │   Easel App      │            │
│   └────────┬─────────┘              └────────┬─────────┘            │
└────────────┼────────────────────────────────┼─────────────────────-┘
             │  HTTPS / WebSocket             │
             ▼                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                          Supabase                                  │
│                                                                    │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Auth        │  │  PostgreSQL DB    │  │  Realtime (WS)       │  │
│  │  (email/pwd) │  │  8 tables + RLS   │  │  sos_signals,        │  │
│  └─────────────┘  └──────────────────┘  │  cycle_settings       │  │
│                           │              └──────────────────────┘  │
│                    DB Webhook                                       │
│                           │              ┌──────────────────────┐  │
│                           └─────────────►│  Edge Functions (Deno)│  │
│                                          │  notify-sos           │  │
│                                          │  notify-cycle         │  │
│                                          └──────────┬───────────┘  │
│                                                     │              │
└─────────────────────────────────────────────────────┼──────────────┘
                                                      │ Expo Push API
┌─────────────────────────────────────────────────────┼──────────────┐
│                         Vercel                      │              │
│                                                     ▼              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Serverless Proxy (7 endpoints)                              │  │
│  │  Guards MiniMax API key; validates X-Client-Token;           │  │
│  │  IP rate-limits; validates inputs; calls MiniMax             │  │
│  └──────────────────────────────────────────────────┬───────────┘  │
└─────────────────────────────────────────────────────┼──────────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │  MiniMax M2.5    │
                                            │  LLM API         │
                                            └──────────────────┘
```

---

## Monorepo Structure

```
easel/
├── app/                     Expo React Native app (iOS + Android)
│   ├── app/                 Expo Router screens
│   │   ├── _layout.tsx      Root layout — deep link handling, push setup
│   │   ├── index.tsx        Entry point — bootstrapSession, routing guard
│   │   ├── auth.tsx         Sign in / Sign up / Forgot password
│   │   ├── onboarding.tsx   Role selection + cycle setup
│   │   └── (tabs)/          Tab navigator
│   │       ├── index.tsx    Today — renders MoonDashboard or SunDashboard
│   │       ├── calendar.tsx Calendar — cycle markers
│   │       └── settings.tsx Settings — profile, cycle, partner, notifications
│   │
│   ├── screens/             Full-screen view components (non-route)
│   │   ├── MoonDashboard.tsx  GF main view
│   │   └── SunDashboard.tsx   BF main view
│   │
│   ├── components/          UI components grouped by role
│   │   ├── gf/              Moon-exclusive (PhaseWheel, InsightCard, DailyCheckIn, SOSSheet)
│   │   ├── bf/              Sun-exclusive (GuideCard, SOSAlert)
│   │   ├── moon/            Shared Moon-themed (WhisperSheet, HealthSyncPrompt)
│   │   ├── sun/             Shared Sun-themed (WhisperAlert, UnlinkedScreen)
│   │   └── shared/          Role-agnostic (HeaderButton)
│   │
│   ├── hooks/               Custom React hooks
│   │   ├── useAIGreeting.ts           Moon: fetches AI greeting on dashboard load
│   │   ├── useAIPartnerAdvice.ts      Sun: fetches AI partner advice card
│   │   ├── useAISOSTip.ts             Sun: fetches AI SOS action tip on alert
│   │   ├── useAIDailyInsight.ts       Moon: fetches AI insight after check-in
│   │   ├── useAIWhisperOptions.ts     Moon: fetches AI whisper menu options
│   │   ├── useAvatarUpload.ts         Handles photo pick + Supabase Storage upload
│   │   ├── useCoupleLinkedListener.ts Moon: Realtime listener for partner link
│   │   ├── useHealthSync.ts           Moon (iOS): reads from HealthKit
│   │   ├── useNotifications.ts        Both: registers push token, tap handler
│   │   ├── useSOSListener.ts          Sun: Realtime listener for incoming signals
│   │   └── useWhisper.ts              Moon: Whisper send flow
│   │
│   ├── lib/                 Data access layer (no business logic)
│   │   ├── supabase.ts      Singleton Supabase client
│   │   └── db/              Per-table data functions
│   │       ├── profiles.ts  getProfile, upsertProfile
│   │       ├── couples.ts   createOrRefreshLinkCode, linkToPartnerByCode, getMyCouple, subscribeToCoupleLinked
│   │       ├── cycle.ts     getCycleSettings, upsertCycleSettings
│   │       ├── sos.ts       sendSOSSignal, acknowledgeSOSSignal, subscribeToSOS
│   │       └── pushTokens.ts upsertPushToken
│   │
│   ├── store/
│   │   └── appStore.ts      Zustand store — global state + all async actions
│   │
│   ├── constants/
│   │   ├── theme.ts         Colors, Spacing, Radii, Typography, MoonColors, SunColors, getTheme()
│   │   ├── phases.ts        PHASE_INFO — per-phase content for all 4 phases
│   │   ├── sos.ts           SOS_OPTIONS — 4 classic signal types
│   │   └── whisper.ts       WHISPER_OPTIONS — 16 phase-specific whisper options (4 per phase)
│   │
│   ├── types/
│   │   └── index.ts         Shared TypeScript types — UserRole, CyclePhase, DB row shapes
│   │
│   ├── utils/
│   │   └── cycleCalculator.ts  Pure date/phase math — no side effects
│   │
│   └── supabase/            Supabase project config (run CLI from app/)
│       ├── config.toml
│       ├── migrations/      Applied in order on push to main
│       │   ├── 001_initial_schema.sql    Core 8 tables + RLS + triggers
│       │   ├── 002_moon_sun_schema.sql   Moon/Sun roles, whisper_history, notification_preferences
│       │   └── 003_avatars_storage.sql   Avatars Storage bucket + policies
│       └── functions/
│           ├── notify-sos/   Triggered by DB webhook on sos_signals INSERT
│           └── notify-cycle/ Invoked by daily GitHub Actions cron
│
├── proxy/                   Vercel serverless proxy
│   ├── api/                 One file per endpoint
│   │   ├── greeting.ts      POST /api/greeting
│   │   ├── partner-advice.ts POST /api/partner-advice
│   │   ├── sos-tip.ts       POST /api/sos-tip
│   │   ├── daily-insight.ts POST /api/daily-insight
│   │   ├── whisper-options.ts POST /api/whisper-options
│   │   ├── predict-cycle.ts POST /api/predict-cycle
│   │   └── health.ts        GET /api/health
│   └── lib/
│       ├── minimax.ts       All 6 MiniMax prompt functions
│       ├── auth.ts          X-Client-Token validation
│       └── rateLimit.ts     In-memory IP rate limiter (10 req/min)
│
├── docs/                    Product + technical documentation
│   ├── PRD.md               Product requirements document
│   ├── UX_DESIGN.md         Visual identity and UX concept
│   ├── USER_JOURNEYS.md     Use cases + Mermaid sequence diagrams
│   ├── DEPLOYMENT.md        Step-by-step setup guide
│   ├── ARCHITECTURE.md      (this file) System architecture reference
│   └── API.md               Proxy API endpoint reference
│
├── .github/workflows/
│   ├── supabase.yml         DB migrations + edge function deploy on push to main
│   ├── proxy.yml            Vercel deploy on proxy/** changes
│   └── notify-cycle.yml     Daily cron at 08:00 UTC
│
├── CHANGELOG.md             Version history (update with every release)
└── README.md                Project overview and quick start
```

---

## Component Responsibilities

### `app/store/appStore.ts` — Single Source of Truth

The Zustand store is the only place that holds application state and triggers side effects (DB writes). All components and hooks read from the store and call store actions — they never call Supabase directly for mutations.

**Persisted fields** (AsyncStorage via `zustand/middleware/persist`):
- `isLoggedIn`, `email`, `role`, `isPartnerLinked`, `linkCode`
- `cycleSettings`, `partnerCycleSettings`
- `avatarUrl`, `displayName`, `notificationPrefs`

**Excluded from persistence** (reset on sign-out, re-hydrated from DB):
- `userId`, `coupleId` — re-hydrated by `bootstrapSession`
- `activeSOS`, `activeWhisper` — transient UI state

### `app/lib/db/` — Data Access Layer

Pure async functions. No React, no store references. Each function maps 1:1 to a Supabase operation. Business rules live in `appStore.ts` (e.g., "guard against re-linking an already-linked couple").

### `app/hooks/useAI*.ts` — AI Fetcher Hooks

Each hook manages one proxy call lifecycle: loading state, fallback text, abort-on-unmount. They never throw — proxy failures silently fall back to static `PHASE_INFO` content, keeping `isAI` false.

### `app/utils/cycleCalculator.ts` — Pure Math

No imports from React or Supabase. All functions are pure (deterministic, no side effects). Safe to call anywhere including outside components.

### `proxy/lib/minimax.ts` — AI Prompt Library

All 6 MiniMax prompt functions live here. Each function constructs a system + user message pair with strict output format rules. The `<think>` block stripping regex handles MiniMax M2.5's reasoning chain output.

---

## State Management Patterns

### Optimistic Updates

`updateCycleSettings` immediately writes to Zustand state (optimistic), then persists to Supabase. The UI never waits for the network round-trip.

```
User input → set({ cycleSettings: merged }) → upsertCycleSettings(userId, merged)
                      ↑ instant                        ↑ async, best-effort
```

### Transient Timers (Module-Level)

`_sosTimer` and `_whisperTimer` are module-level refs, not inside Zustand state. This prevents them from being accidentally serialised to AsyncStorage and allows them to be cleared across re-renders without causing re-renders themselves.

### Realtime → Store Pattern

Realtime events are received in hooks (`useSOSListener`, `useCoupleLinkedListener`), which call store actions (`receiveWhisper`, `setLinked`). The hook is pure infrastructure; the store action handles the state transition.

---

## Security Model

### API Key Protection

The MiniMax API key is **never in the mobile app binary**. The app calls the Vercel proxy with a `X-Client-Token` header. The proxy validates the token, then calls MiniMax server-side.

### Proxy Security Layers (in order)

1. **Method check** — `POST` only (405 otherwise)
2. **X-Client-Token** — constant-time comparison against `CLIENT_TOKEN` env var (401 otherwise)
3. **IP rate limiting** — 10 requests/minute per IP (429 otherwise)
4. **Input validation** — strict type + range checks on every field (400 otherwise)
5. **MiniMax call** — only reached after all above pass

### Database Security (RLS)

Every table has Row Level Security enabled. Policies are enforced at the PostgreSQL layer — not application code. Key policies:

| Table | Read | Write |
|---|---|---|
| `profiles` | Own + partner | Own only |
| `couples` | Own couple | GF inserts; BF updates to link |
| `cycle_settings` | Own + partner (via `my_partner_id()`) | Own only |
| `sos_signals` | Couple members | Sender inserts; recipient acknowledges |
| `push_tokens` | Own only | Own only |

`SECURITY DEFINER` helper functions (`my_couple_id()`, `my_partner_id()`) resolve couple membership without causing infinite recursion in RLS policies.

### Auth Token Handling

- JWT refresh is automatic via `supabase-js` `autoRefreshToken: true`
- Sessions persist across app restarts via `AsyncStorage` (encrypted on device)
- Deep link PKCE + implicit token flows handled in `_layout.tsx`

---

## Real-Time Architecture

### SOS / Whisper Delivery (Dual Path)

When Moon sends a signal, TWO delivery mechanisms fire in parallel:

**Foreground (Realtime WebSocket)**
```
INSERT sos_signals → supabase_realtime publication → WebSocket to Sun's app
→ useSOSListener receives event → receiveWhisper() in Zustand → WhisperAlert renders
```

**Background (Push Notification)**
```
INSERT sos_signals → DB Webhook → notify-sos Edge Function → Expo Push API → device push
→ Sun taps notification → app opens → dashboard renders → WhisperAlert shows
```

### Partner Link Real-Time

When Sun links using Moon's code:
```
UPDATE couples SET status='linked' → subscribeToCoupleLinked Realtime subscription
→ useCoupleLinkedListener in Moon's app → setLinked() → isPartnerLinked=true
→ invite banner disappears from Moon Dashboard instantly
```

---

## AI Personalization Layer

### Prompt Design Principles

All prompts in `proxy/lib/minimax.ts` follow consistent rules:
1. **Output format first** — system prompt specifies exact format (e.g., "ONLY the greeting text — no quotes, no label")
2. **Word/token caps** — kept tight to control costs and prevent verbose output
3. **No medical advice** — explicit prohibition in every prompt
4. **Warm friend voice** — not a health app, not a doctor

### Reasoning Model Compatibility

MiniMax M2.5 is a reasoning model that may emit `<think>...</think>` blocks before the answer. The proxy strips these before returning to the client:

```typescript
const output = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
```

### Fallback Strategy

Every AI hook in the app has a static fallback:
- `useAIGreeting` → returns phase tagline if proxy fails
- `useAIPartnerAdvice` → returns `PHASE_INFO[phase].partnerAdvice`
- `useAISOSTip` → returns generic action tip
- `useAIDailyInsight` → returns empty / no insight card

`isAI: false` suppresses the `✦ AI` badge so users know they're seeing static content.

---

## Database Schema Summary

```
profiles ──────── auth.users (1:1, CASCADE)
    ↑ 1
    │
    ├── couples (GF creates; BF links via 6-digit code; 24h expiry)
    │     ├── girlfriend_id → profiles
    │     └── boyfriend_id  → profiles (nullable until linked)
    │
    ├── cycle_settings (1:1 with GF profile)
    ├── period_logs (1:N — one per period entry)
    ├── daily_logs (1:N — one per day per user)
    ├── push_tokens (1:N — one per device)
    ├── user_preferences (1:1)
    ├── whisper_history (1:N — frequency tracking per whisper text)
    └── notification_preferences (1:1, auto-created on signup)

sos_signals (N:N — couple_id + sender_id)
    ├── couple_id → couples
    └── sender_id → profiles
```

**Date type decision**: Cycle dates use `DATE` (not `TIMESTAMPTZ`) because a period start date has no meaningful time component and timezone conversion would corrupt it.

---

## Naming Conventions

| Concept | DB column | TypeScript type | UI label |
|---|---|---|---|
| Girlfriend | `girlfriend_id`, `role = 'moon'` | `UserRole = 'moon'` | Moon |
| Boyfriend | `boyfriend_id`, `role = 'sun'` | `UserRole = 'sun'` | Sun |
| SOS signal | `sos_signals.type` | `SOSOption.id` | Whisper / Signal |
| Phase | `cycle_settings` + calculator | `CyclePhase` | Menstrual/Follicular/Ovulatory/Luteal |

> Note: The DB still uses `girlfriend`/`boyfriend` terminology from v1.0. The UI and TypeScript types use `moon`/`sun`. Both are valid role values in the DB constraint (migration 002 expanded the check).

---

## Adding a New Feature — Checklist

When adding a feature that touches any layer:

- [ ] **Types**: Add to `app/types/index.ts`
- [ ] **DB**: Write migration `00N_feature_name.sql` (idempotent — use `IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`)
- [ ] **RLS**: Add policies for the new table; test with both roles
- [ ] **Data layer**: Add function to `app/lib/db/`
- [ ] **Store**: Add state fields + action to `appStore.ts`
- [ ] **Hook**: If async/AI, create `useFeature.ts` with loading + fallback
- [ ] **Component**: Build in appropriate `components/` subdirectory
- [ ] **Screen**: Wire into `screens/` or `app/(tabs)/`
- [ ] **Proxy**: If AI, add endpoint in `proxy/api/` + function in `proxy/lib/minimax.ts`
- [ ] **CHANGELOG.md**: Document in `[Unreleased]` section
- [ ] **Docs**: Update `ARCHITECTURE.md` structure map if files added
