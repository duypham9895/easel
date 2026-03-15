# Easel

A couples period tracking app built with empathy. **Moon** (girlfriend) tracks her cycle and daily wellbeing. **Sun** (boyfriend) receives phase-aware guidance, Whisper signals, and real-time SOS alerts — so he always knows how to show up.

**Current version:** v1.7.0 | **Languages:** English, Vietnamese | **Platform:** iOS (Android planned)

## Features

### Moon (Her)
- Menstrual cycle tracking with phase wheel visualization
- **Period calendar** with logged/predicted period markers, ovulation, and fertile window
- **Manual period logging** — tap any day to log/end period, add override tags (stress, illness, travel, medication), and notes
- **Prediction algorithm** — weighted rolling average with confidence scoring (low/medium/high) and ±4-day prediction window
- Apple HealthKit sync for automatic period data import
- Daily check-in (mood + symptoms) with AI-generated insights
- SOS signals (Sweet Tooth, Need a Hug, Cramps Alert, Quiet Time)
- Whisper system — 16 phase-aware intimate signals to send Sun
- AI daily greeting personalized to current cycle phase
- Avatar upload and display name

### Sun (Him)
- Partner dashboard showing Moon's current phase and countdown
- **Read-only partner calendar** showing Moon's cycle data, predictions, and legend
- AI-generated phase-specific action tips
- Real-time Whisper and SOS alert notifications
- Phase overview with "how to support" guidance
- AI-powered SOS response tips

### Shared
- Partner linking via 6-digit code (24h expiry, real-time confirmation)
- Bilingual UI (English + Vietnamese) with auto-detection
- Push notifications for cycle events, whispers, and SOS
- AI cycle prediction with confidence scoring
- Real-time updates via Supabase Realtime (period logs, SOS, whispers)

## Monorepo Structure

```
easel/
├── app/            Expo / React Native mobile app (iOS + Android)
│   ├── app/        Expo Router v4 screens (file-based routing)
│   ├── components/ UI components organized by role (moon/, sun/, shared/)
│   ├── constants/  Theme, phases, SOS options, whisper options
│   ├── hooks/      Custom hooks (AI, health sync, notifications, listeners)
│   ├── i18n/       Translation files (en/, vi/ — 11 namespaces each)
│   ├── lib/        Supabase client + pure database functions (db/)
│   ├── screens/    Dashboard screens (MoonDashboard, SunDashboard)
│   ├── store/      Zustand state management (single store)
│   ├── supabase/   Migrations (001–007), Edge Functions (notify-cycle, notify-sos)
│   ├── types/      TypeScript interfaces
│   └── utils/      Pure utility functions (cycle calculator)
├── proxy/          Vercel serverless proxy (10 AI endpoints, MiniMax key protection)
│   ├── api/        Serverless endpoint handlers
│   └── lib/        Auth, rate limiting, MiniMax prompt functions
├── landing/        Static landing page (deployed via GitHub Pages)
├── docs/           Documentation (see docs/README.md for structure rules)
│   ├── project/    Core project docs (PRD, Architecture, API, Deployment, UX)
│   ├── features/   One subfolder per feature with all related docs
│   ├── releases/   One subfolder per version (v1.7.0/, etc.)
│   ├── reviews/    Expert reviews and audits
│   ├── advisory/   Expert advisor panel sessions
│   ├── plans/      Design plans and proposals
│   ├── bugs/       Bug investigations
│   └── skills/     Pipeline and workflow definitions
└── .github/        CI/CD workflows (6 pipelines)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | Expo SDK 52, React Native 0.76, TypeScript |
| Navigation | Expo Router v4 (file-based) |
| State | Zustand 5 + AsyncStorage (persisted) |
| Database + Auth | Supabase (PostgreSQL + RLS + Realtime + Edge Functions) |
| AI | MiniMax M2.5 via Vercel serverless proxy |
| Push notifications | Expo Push API + Supabase Edge Functions (Deno) |
| Health data | Apple HealthKit via react-native-health |
| Internationalization | i18next + react-i18next + expo-localization |
| Landing page | Static HTML/CSS/JS (no framework) |
| CI/CD | GitHub Actions (TypeScript CI, TestFlight, Vercel, Supabase, GitHub Pages) |
| Distribution | EAS Build + EAS Submit → TestFlight |

## Quick Start

See [docs/project/DEPLOYMENT.md](./docs/project/DEPLOYMENT.md) for the full setup guide.

```bash
# Mobile app (requires .env — see app/.env.example)
cd app && npm install && npx expo start

# Proxy (requires .env — see proxy/.env.example)
cd proxy && npm install && vercel dev

# Landing page — just open landing/index.html
```

### Environment Variables

Both `app/` and `proxy/` require `.env` files. See `.env.example` in each directory for required variables.

| Variable | Location | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | app | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | app | Supabase anonymous key |
| `EXPO_PUBLIC_PROXY_URL` | app | Vercel proxy base URL |
| `EXPO_PUBLIC_CLIENT_TOKEN` | app | Shared secret for proxy auth |
| `MINIMAX_API_KEY` | proxy | MiniMax M2.5 API key |
| `MINIMAX_MODEL` | proxy | Model name (default: MiniMax-M2.5) |
| `CLIENT_TOKEN` | proxy | Must match app's CLIENT_TOKEN |

## Key Concepts

- **Moon** = Girlfriend. Dark blue theme (`#0D1B2A`). Tracks cycle, logs mood/symptoms, sends Whispers.
- **Sun** = Boyfriend. Warm cream theme (`#FFF8F0`). Reads phase status, receives Whispers and SOS.
- **Whisper** = An intimate signal Moon sends Sun (e.g., "Need a hug", "Bring chocolate"). Phase-aware — 4 options per phase, 16 total. AI-personalizable.
- **SOS** = Urgent signal (Sweet Tooth, Need a Hug, Cramps Alert, Quiet Time). Always-on, never toggleable.
- **Cycle phases**: Menstrual → Follicular → Ovulatory → Luteal. All UI, AI prompts, and advice adapt per phase.
- **Partner linking**: Moon generates a 6-digit code (24h expiry). Sun enters it to link. Real-time update when link completes.
- **Override tags**: Moon can tag period logs with context (stress, illness, travel, medication) — tagged cycles receive reduced weight in predictions.

## API Endpoints

The proxy protects the MiniMax API key and provides these endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/greeting` | Moon's daily phase-aware greeting |
| `POST` | `/api/partner-advice` | Sun's daily action tip |
| `POST` | `/api/sos-tip` | Sun's immediate SOS response tip |
| `POST` | `/api/daily-insight` | Moon's post-check-in insight |
| `POST` | `/api/whisper-options` | AI-generated whisper menu |
| `POST` | `/api/predict-cycle` | Next period prediction with confidence |
| `POST` | `/api/phase-insight` | Phase-specific educational insight |
| `POST` | `/api/self-care` | Personalized self-care recommendation |
| `POST` | `/api/cycle-health-insight` | AI health insight based on cycle data |
| `GET`  | `/api/health` | Health check (no auth) |

All endpoints (except health) require `X-Client-Token` header. Rate limited to 10 req/min per IP.

See [docs/project/API.md](./docs/project/API.md) for full request/response formats.

## Database

10 tables with Row Level Security on every table:

`profiles` · `couples` · `cycle_settings` · `period_logs` · `daily_logs` · `sos_signals` · `push_tokens` · `user_preferences` · `whisper_history` · `notification_preferences`

7 migrations in `app/supabase/migrations/` (001–007). Key schema highlights:
- `UNIQUE(boyfriend_id)` on couples — prevents multi-partner data leaks
- `period_logs.tags` (`TEXT[]` with GIN index) — override tags for prediction weighting
- `SECURITY DEFINER` functions with `SET search_path` — RLS helpers hardened against schema poisoning
- FK indexes on all foreign key columns for RLS and JOIN performance

## CI/CD Pipelines

| Workflow | Trigger | Action |
|---|---|---|
| `ci.yml` | Push/PR to `master` | TypeScript type checking (app + proxy) |
| `testflight.yml` | Push to `master` (app/** changes) | EAS Build → TestFlight auto-deploy |
| `supabase.yml` | Push to `master` | DB migrations + edge function deploy |
| `proxy.yml` | Push to `master` (proxy/** changes) | Vercel production deploy |
| `notify-cycle.yml` | Daily 08:00 UTC | Invoke `notify-cycle` edge function |
| `pages.yml` | Push to `master` (landing/** changes) | Deploy landing page to GitHub Pages |

## Documentation

All documentation lives in `docs/` — see [docs/README.md](./docs/README.md) for structure rules.

| Location | Description |
|---|---|
| [docs/project/PRD.md](./docs/project/PRD.md) | Product requirements and feature list |
| [docs/project/ARCHITECTURE.md](./docs/project/ARCHITECTURE.md) | System architecture, component map, security model |
| [docs/project/API.md](./docs/project/API.md) | Proxy API endpoint reference (request/response formats) |
| [docs/project/UX_DESIGN.md](./docs/project/UX_DESIGN.md) | UX/UI design concept and visual identity |
| [docs/project/USER_JOURNEYS.md](./docs/project/USER_JOURNEYS.md) | Customer journeys and Mermaid sequence diagrams |
| [docs/project/DEPLOYMENT.md](./docs/project/DEPLOYMENT.md) | Step-by-step deployment guide (Supabase, Vercel, EAS) |
| [CHANGELOG.md](./CHANGELOG.md) | Version history with detailed release notes |

## Security

- MiniMax API key **never** ships in the app binary — stored only in Vercel environment variables
- App authenticates to proxy via `X-Client-Token` shared secret
- Proxy applies 5-layer security: method check → token validation → rate limiting → input validation → AI call
- All database tables enforce Row Level Security with `my_couple_id()` / `my_partner_id()` helper functions (SECURITY DEFINER + SET search_path)
- `UNIQUE(boyfriend_id)` constraint prevents multi-partner data leaks
- Expired link codes rejected at database level via `guard_couple_link` trigger
- SOS update trigger restricts modifications to `acknowledged_at` only
- Edge functions require `Authorization: Bearer` header — no unauthenticated invocation
- Error responses sanitized — no stack traces or query context leaked
- Passwords validated client-side with strength meter; auth handled by Supabase (bcrypt + JWT)

## License

Private — all rights reserved.
