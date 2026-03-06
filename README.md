# Easel

A couples period tracking app. The girlfriend tracks her cycle and daily wellbeing. The boyfriend receives phase-aware guidance and real-time SOS signals so he always knows how to show up.

## Monorepo Structure

```
easel/
├── app/        Expo / React Native app (iOS + Android)
├── proxy/      Vercel serverless proxy (MiniMax AI key protection)
├── DEPLOYMENT.md
└── USER_JOURNEYS.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | Expo SDK 52, React Native 0.76, TypeScript |
| State | Zustand + AsyncStorage |
| Database + Auth | Supabase (PostgreSQL + RLS + Realtime) |
| Push notifications | Expo Push API + Supabase Edge Functions (Deno) |
| AI personalization | MiniMax M25 via Vercel proxy |

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full setup guide.

```bash
# App
cd app && npm install && npx expo start

# Proxy (local dev)
cd proxy && npm install && vercel dev
```

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) — step-by-step deploy guide (Supabase, Vercel, EAS)
- [USER_JOURNEYS.md](./USER_JOURNEYS.md) — customer journeys and use case diagrams
