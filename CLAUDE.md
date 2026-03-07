# Easel — Couples Period Tracking App

## Monorepo Overview
Easel is a couples menstrual cycle tracking app. **Moon** (girlfriend) tracks her cycle, mood, and symptoms; **Sun** (boyfriend) receives phase-aware guidance, whisper signals, and SOS alerts. The app emphasizes empathy, privacy, and AI personalization. Built with Expo/React Native, Supabase, and MiniMax AI via a Vercel proxy.

**Current version:** v1.5.1 | **Languages:** English, Vietnamese | **Platform:** iOS (Android planned)

## Repo Structure
```
easel/
├── app/            Expo React Native mobile app (iOS + Android)
│   ├── app/        Expo Router v4 screens (file-based routing)
│   ├── components/ UI components (gf/, bf/, moon/, sun/, shared/)
│   ├── constants/  Theme, phases, SOS options, whisper options
│   ├── hooks/      Custom hooks (AI, health sync, notifications, listeners)
│   ├── i18n/       Translations (en/, vi/ — 11 namespaces)
│   ├── lib/        Supabase client + db/ data access layer
│   ├── screens/    MoonDashboard, SunDashboard
│   ├── store/      Zustand state (appStore.ts — single source of truth)
│   ├── supabase/   Migrations (001-006), Edge Functions (notify-cycle, notify-sos)
│   ├── types/      TypeScript interfaces
│   └── utils/      cycleCalculator.ts (pure math)
├── proxy/          Vercel serverless proxy (7 AI endpoints, MiniMax key protection)
│   ├── api/        Serverless handlers (greeting, partner-advice, sos-tip, etc.)
│   └── lib/        auth.ts, rateLimit.ts, minimax.ts (prompt engineering)
├── landing/        Static landing page (single index.html, GitHub Pages)
├── docs/           PRD, Architecture, API, UX, User Journeys, Deployment
│   └── plans/      Feature design documents
└── .github/        CI/CD workflows (supabase, proxy, notify-cycle, pages)
```

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Mobile | Expo SDK 52, React Native 0.76, TypeScript |
| Navigation | Expo Router v4 (file-based) |
| State | Zustand 5 + AsyncStorage persistence |
| Database + Auth | Supabase (PostgreSQL + RLS + Realtime + Edge Functions) |
| AI | MiniMax M2.5 via Vercel serverless proxy |
| Push | Expo Push API + Supabase Edge Functions (Deno) |
| Health | Apple HealthKit, Android Health Connect |
| i18n | i18next + react-i18next + expo-localization |
| Landing | Static HTML/CSS/JS |
| CI/CD | GitHub Actions |

## How to Run

```bash
# Mobile app (requires .env — see app/.env.example)
cd app && npm install && npx expo start

# Proxy (requires .env — see proxy/.env.example)
cd proxy && npm install && vercel dev

# Landing page — just open landing/index.html
```

### Environment Variables
| Variable | Location | Purpose |
|----------|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | app | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | app | Supabase anon key |
| `EXPO_PUBLIC_PROXY_URL` | app | Vercel proxy base URL |
| `EXPO_PUBLIC_CLIENT_TOKEN` | app | Shared secret for proxy auth |
| `MINIMAX_API_KEY` | proxy | MiniMax API key |
| `MINIMAX_MODEL` | proxy | Model name (default: MiniMax-M2.5) |
| `CLIENT_TOKEN` | proxy | Must match app's CLIENT_TOKEN |

## Inter-package Dependencies
```
app/ ──HTTPS──> proxy/ ──HTTPS──> MiniMax API
app/ ──WSS────> Supabase Realtime (couples, sos_signals)
app/ ──HTTPS──> Supabase (auth, DB, storage)
app/ ──HTTPS──> Expo Push API
proxy/ ──────── standalone (no cross-package imports)
landing/ ────── standalone (no dependencies)
.github/ ────── orchestrates: supabase migrations, proxy deploy, edge functions, landing page
```

## Database (Supabase PostgreSQL)
10 tables with Row Level Security on every table:
- `profiles`, `couples`, `cycle_settings`, `period_logs`, `daily_logs`
- `sos_signals`, `push_tokens`, `user_preferences`, `whisper_history`, `notification_preferences`

RLS helper functions: `my_couple_id()`, `my_partner_id()` (SECURITY DEFINER + SET search_path)

Migrations in `app/supabase/migrations/` (001-006, applied sequentially).

## Development Conventions

### Architecture
- **Single Zustand store** (`app/store/appStore.ts`) — only place that mutates state
- **Data access layer** (`app/lib/db/*.ts`) — pure async functions, no React/Zustand
- **AI fallback pattern** — static content shown immediately, AI replaces on success, silent fallback on error
- **Optimistic updates** — UI changes immediately, DB sync is async
- **Dual-path notifications** — Realtime (foreground) + Push (background)

### Naming
- Components: PascalCase | Hooks: `use` prefix | DB types: `Db` prefix
- Constants: UPPER_SNAKE_CASE | Screen files: kebab-case
- Path alias: `@/*` → `./` in app

### Styling
- Moon theme: dark indigo `#0D1B2A` | Sun theme: warm cream `#FFF8F0`
- Phase colors: menstrual `#FF5F7E`, follicular `#70D6FF`, ovulatory `#FFB347`, luteal `#4AD66D`
- Design tokens in `app/constants/theme.ts`

### Domain Vocabulary
- **Moon** = girlfriend (cycle tracker) | **Sun** = boyfriend (support partner)
- **Whisper** = intimate signal Moon sends Sun (16 options, 4 per phase)
- **SOS** = urgent signal (sweet_tooth, need_a_hug, cramps_alert, quiet_time)
- **Phases**: menstrual → follicular → ovulatory → luteal

### Commit Style
`<type>: <description>` — types: feat, fix, refactor, docs, test, chore, perf, ci

## For Claude Agents

### Where to look first
1. `app/store/appStore.ts` — understand all state and actions
2. `app/constants/theme.ts` — understand the design system
3. `proxy/lib/minimax.ts` — understand AI prompt engineering
4. `app/lib/db/*.ts` — understand data access patterns
5. `README.md` — project overview and architecture

### How to trace a feature end-to-end
1. **Screen** (`app/app/` or `screens/`) → identifies the UI
2. **Store action** (`store/appStore.ts`) → identifies the state mutation
3. **DB function** (`lib/db/*.ts`) → identifies the Supabase query
4. **Hook** (`hooks/`) → identifies side effects (AI, realtime, notifications)
5. **Proxy endpoint** (`proxy/api/`) → identifies AI prompt (if applicable)

### What to avoid
- Never call MiniMax API directly from the app — always go through the proxy
- Never use `select('*')` in Supabase queries — always specify columns
- Never mutate state outside of `appStore.ts`
- Never hardcode secrets — use environment variables
- Never skip RLS testing — test queries as both Moon and Sun roles
