# Easel

A couples period tracking app built with empathy. **Moon** (girlfriend) tracks her cycle and daily wellbeing. **Sun** (boyfriend) receives phase-aware guidance, Whisper signals, and real-time SOS alerts — so he always knows how to show up.

**Current version:** v1.4.0 | **Languages:** English, Vietnamese | **Platform:** iOS (Android planned)

## Features

### Moon (Her)
- Menstrual cycle tracking with phase wheel visualization
- Apple HealthKit sync for automatic period data import
- Daily check-in (mood + symptoms) with AI-generated insights
- SOS signals (Sweet Tooth, Need a Hug, Cramps Alert, Quiet Time)
- Whisper system — 16 phase-aware intimate signals to send Sun
- AI daily greeting personalized to current cycle phase
- Calendar with cycle markers (period, fertile window, ovulation)
- Avatar upload and display name

### Sun (Him)
- Partner dashboard showing Moon's current phase and countdown
- AI-generated phase-specific action tips
- Real-time Whisper and SOS alert notifications
- Phase overview with "how to support" guidance
- AI-powered SOS response tips

### Shared
- Partner linking via 6-digit code (24h expiry, real-time confirmation)
- Bilingual UI (English + Vietnamese) with auto-detection
- Push notifications for cycle events, whispers, and SOS
- AI cycle prediction with confidence scoring

## Monorepo Structure

```
easel/
├── app/            Expo / React Native mobile app (iOS + Android)
│   ├── app/        Expo Router v4 screens (file-based routing)
│   ├── components/ UI components organized by role (moon/, sun/, shared/)
│   ├── constants/  Theme, phases, SOS options, whisper options
│   ├── hooks/      Custom hooks (AI, health sync, notifications, listeners)
│   ├── i18n/       Translation files (en/, vi/ — 11 namespaces each)
│   ├── lib/        Supabase client + pure database functions
│   ├── screens/    Dashboard screens (MoonDashboard, SunDashboard)
│   ├── store/      Zustand state management
│   ├── supabase/   Migrations, edge functions, config
│   ├── types/      TypeScript interfaces
│   └── utils/      Pure utility functions (cycle calculator)
├── proxy/          Vercel serverless proxy (MiniMax AI key protection)
│   ├── api/        7 serverless endpoints
│   └── lib/        Auth, rate limiting, MiniMax prompt functions
├── landing/        Static landing page (deployed via GitHub Pages)
├── docs/           Product, architecture, and operational documentation
│   └── plans/      Design documents for completed features
└── .github/        CI/CD workflows
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
| CI/CD | GitHub Actions (Vercel, Supabase, GitHub Pages) |

## Quick Start

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the full setup guide.

```bash
# Mobile app
cd app && npm install && npx expo start

# Proxy (local dev)
cd proxy && npm install && vercel dev
```

### Environment Variables

Both `app/` and `proxy/` require `.env` files. See `.env.example` in each directory for required variables.

| Variable | Location | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | app | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | app | Supabase anonymous key |
| `EXPO_PUBLIC_PROXY_URL` | app | Vercel proxy base URL |
| `MINIMAX_API_KEY` | proxy | MiniMax M2.5 API key |
| `CLIENT_TOKEN` | proxy | Shared secret for app-proxy auth |

## Key Concepts

- **Moon** = Girlfriend. Dark blue theme (`#0D1B2A`). Tracks cycle, logs mood/symptoms, sends Whispers.
- **Sun** = Boyfriend. Warm cream theme (`#FFF8F0`). Reads phase status, receives Whispers and SOS.
- **Whisper** = An intimate signal Moon sends Sun (e.g., "Need a hug", "Bring chocolate"). Phase-aware — 4 options per phase, 16 total. AI-personalizable.
- **Cycle phases**: Menstrual → Follicular → Ovulatory → Luteal. All UI, AI prompts, and advice adapt per phase.
- **Partner linking**: Moon generates a 6-digit code (24h expiry). Sun enters it to link. Real-time update when link completes.

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
| `GET`  | `/api/health` | Health check (no auth) |

All endpoints (except health) require `X-Client-Token` header. Rate limited to 10 req/min per IP.

See [docs/API.md](./docs/API.md) for full request/response formats.

## Database

10 tables with Row Level Security on every table:

`profiles` · `couples` · `cycle_settings` · `period_logs` · `daily_logs` · `sos_signals` · `push_tokens` · `user_preferences` · `whisper_history` · `notification_preferences`

5 migrations to date. Schema lives in `app/supabase/migrations/`.

## CI/CD Pipelines

| Workflow | Trigger | Action |
|---|---|---|
| `supabase.yml` | Push to `main` | DB migrations + edge function deploy |
| `proxy.yml` | Push to `main` (proxy/** changes) | Vercel production deploy |
| `notify-cycle.yml` | Daily 08:00 UTC | Invoke `notify-cycle` edge function |
| `pages.yml` | Push to `main` (landing/** changes) | Deploy landing page to GitHub Pages |

## Documentation

| File | Description |
|---|---|
| [docs/PRD.md](./docs/PRD.md) | Product requirements and feature list |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture, component map, security model |
| [docs/API.md](./docs/API.md) | Proxy API endpoint reference (request/response formats) |
| [docs/UX_DESIGN.md](./docs/UX_DESIGN.md) | UX/UI design concept and visual identity |
| [docs/USER_JOURNEYS.md](./docs/USER_JOURNEYS.md) | Customer journeys and Mermaid sequence diagrams |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Step-by-step deployment guide (Supabase, Vercel, EAS) |
| [CHANGELOG.md](./CHANGELOG.md) | Version history with detailed release notes |

## Security

- MiniMax API key **never** ships in the app binary — stored only in Vercel environment variables
- App authenticates to proxy via `X-Client-Token` shared secret
- Proxy applies 5-layer security: method check → token validation → rate limiting → input validation → AI call
- All database tables enforce Row Level Security with `my_couple_id()` / `my_partner_id()` helper functions
- Passwords validated client-side with strength meter; auth handled by Supabase (bcrypt + JWT)

## License

Private — all rights reserved.
