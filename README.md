# Easel

A couples period tracking app. The girlfriend tracks her cycle and daily wellbeing. The boyfriend receives phase-aware guidance and real-time SOS signals so he always knows how to show up.

## Monorepo Structure

```
easel/
├── app/        Expo / React Native app (iOS + Android)
├── proxy/      Vercel serverless proxy (MiniMax AI key protection)
└── docs/       Product, design, and operational documentation
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

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the full setup guide.

```bash
# App
cd app && npm install && npx expo start

# Proxy (local dev)
cd proxy && npm install && vercel dev
```

## Documentation

| File | Description |
|---|---|
| [docs/PRD.md](./docs/PRD.md) | Product requirements document |
| [docs/UX_DESIGN.md](./docs/UX_DESIGN.md) | UX/UI design concept and visual identity |
| [docs/USER_JOURNEYS.md](./docs/USER_JOURNEYS.md) | Customer journeys, use cases, and system diagrams |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Step-by-step deployment guide (Supabase, Vercel, EAS) |
