# Easel — First-Session Onboarding Guide for Claude

## Read These Files First (In Order)

1. **`CLAUDE.md`** (root) — Monorepo overview, structure, conventions, how to trace features
2. **`app/store/appStore.ts`** — The heart of the app: all state, all actions, all side effects
3. **`app/constants/theme.ts`** — Design system (understand Moon vs Sun theming)
4. **`proxy/lib/minimax.ts`** — All AI prompt engineering (the core differentiator)
5. **`app/lib/db/couples.ts`** — Partner linking logic (most complex DB operation)
6. **`app/utils/cycleCalculator.ts`** — Pure cycle math (phases, days, calendar)
7. **`app/types/index.ts`** — All TypeScript types
8. **`README.md`** — High-level project context and API reference

## Assume These Things Are Always True

1. The app has exactly **two roles**: Moon (girlfriend) and Sun (boyfriend)
2. **Cycle phases** always follow: menstrual → follicular → ovulatory → luteal
3. **Ovulation day** = `avgCycleLength - 14` (never `/2`)
4. **All state mutations** happen in `app/store/appStore.ts` — nowhere else
5. **All DB queries** go through `app/lib/db/*.ts` — never called directly from components
6. **AI is always optional** — every AI feature has a static fallback
7. **All Supabase tables have RLS** — queries must work within RLS policies
8. **The proxy never touches the database** — it only calls MiniMax AI
9. **Edge Functions are Deno** — not Node.js (different import syntax, APIs)
10. **Both `gf/`+`bf/` and `moon/`+`sun/` component folders are active** — historical artifact
11. **Translations must be mirrored** in both `en/` and `vi/` folders
12. **Whisper IDs use `whisper_` prefix** to distinguish from SOS IDs in the shared table

## Never Do These Things

1. **Never call MiniMax API directly from the app** — always go through `proxy/`
2. **Never use `select('*')` in Supabase queries** — always specify columns explicitly
3. **Never mutate state outside `appStore.ts`** — components are read-only consumers
4. **Never hardcode secrets** in source code — use environment variables
5. **Never use simple `===` for token comparison** in the proxy — use `timingSafeEqual`
6. **Never skip RLS** when adding tables — every table must have policies
7. **Never add AI features without a static fallback** — the app must work without the proxy
8. **Never use `avgCycleLength / 2` for ovulation** — it's `avgCycleLength - 14`
9. **Never add signal types that violate the DB regex** — must match `^[a-z][a-z0-9_]{0,49}$`
10. **Never import React or Zustand in `lib/db/` files** — they must be pure async functions

## Ask the User to Clarify These Things

1. **Which role is affected?** — Moon and Sun have different features, themes, and data access
2. **Does this need AI?** — Determine if the feature needs a proxy endpoint or works with static data
3. **Does this need real-time?** — Determine if Supabase Realtime subscription is needed
4. **Does this need push notifications?** — Determine if an Edge Function needs updating
5. **Which languages?** — Confirm if the change needs translations in both EN and VI
6. **Is this a new table or modifying existing?** — New tables need migration + RLS + types + DB functions
7. **Production or dev?** — Some changes (migrations, proxy deploy) auto-deploy on push to main

## Quick Reference: File Location by Task

| Task | Files to Read/Modify |
|------|---------------------|
| UI change (Moon) | `screens/MoonDashboard.tsx`, `components/gf/` or `components/moon/` |
| UI change (Sun) | `screens/SunDashboard.tsx`, `components/bf/` or `components/sun/` |
| State change | `store/appStore.ts` |
| Database change | `supabase/migrations/`, `lib/db/`, `types/index.ts` |
| AI feature | `proxy/lib/minimax.ts`, `proxy/api/`, `hooks/useAI*.ts` |
| Styling | `constants/theme.ts` |
| Translations | `i18n/en/`, `i18n/vi/`, `i18n/config.ts` |
| Notifications | `hooks/useNotifications.ts`, `supabase/functions/` |
| Auth flow | `app/_layout.tsx`, `app/auth.tsx`, `lib/supabase.ts` |
| Health sync | `hooks/useHealthSync.ts` |
| Cycle math | `utils/cycleCalculator.ts` |
| Partner linking | `lib/db/couples.ts`, `hooks/useCoupleLinkedListener.ts` |
| Proxy endpoint | `proxy/api/`, `proxy/lib/minimax.ts`, `proxy/lib/auth.ts` |
| CI/CD | `.github/workflows/` |
| Landing page | `landing/index.html` |
