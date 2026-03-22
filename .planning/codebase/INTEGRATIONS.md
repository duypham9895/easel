# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

**AI Model:**
- MiniMax M2.5 - Phase-aware, personalized text generation (greetings, advice, tips, predictions)
  - SDK/Client: REST API via `proxy/lib/minimax.ts`
  - Endpoint: `https://api.minimax.io/v1/chat/completions`
  - Auth: Bearer token in `Authorization` header
  - Use Cases:
    - Moon daily greeting (`/api/greeting`)
    - Sun partner advice (`/api/partner-advice`)
    - Sun SOS response tips (`/api/sos-tip`)
    - Moon post-checkin insights (`/api/daily-insight`)
    - AI-generated whisper options (`/api/whisper-options`)
    - Cycle prediction with confidence (`/api/predict-cycle`)

**Proxy Service (Vercel Serverless):**
- Service: Vercel Functions
- Purpose: Protect MiniMax API key, implement rate limiting, add request validation
- Endpoints: 7 POST endpoints under `/api/*` (see `proxy/api/`)
- Auth: Static `X-Client-Token` header with timing-safe comparison
- Rate Limit: 30 requests/minute per client IP (in-memory sliding window)
- Security Headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy (via `proxy/vercel.json`)

## Data Storage

**Primary Database:**
- Supabase PostgreSQL
  - Connection: `EXPO_PUBLIC_SUPABASE_URL`
  - Client: `@supabase/supabase-js` 2.98.0
  - Schema location: `app/supabase/migrations/` (001-008, applied sequentially)
  - Row Level Security: Enabled on all tables via RLS helper functions `my_couple_id()` and `my_partner_id()`
  - Tables (10 total):
    - `profiles` - User profile + role (Moon/Sun)
    - `couples` - Couple linking + sync status
    - `cycle_settings` - Average cycle length, period length
    - `period_logs` - Menstrual periods (start/end dates)
    - `daily_logs` - Daily checkins (mood, symptoms, notes)
    - `sos_signals` - SOS alerts (emergency support signals)
    - `push_tokens` - Native push notification tokens
    - `user_preferences` - Notification preferences + dark mode
    - `whisper_history` - Whisper signal log + metadata
    - `notification_preferences` - Cycle reminder toggles

**File Storage:**
- Supabase Storage
  - Use: Avatar image uploads
  - Bucket: `avatars` (public read, authenticated write)
  - Integration: `hooks/useAvatarUpload.ts`

**Cache/Session:**
- AsyncStorage (device local storage)
  - Persists: Session tokens, user state, recent data (via Zustand hydration)
  - Implementation: `@react-native-async-storage/async-storage` 2.2.0
  - Store: `app/store/appStore.ts` with `persist()` middleware

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (PostgreSQL-backed)
  - Implementation: `app/lib/supabase.ts` (Supabase client singleton)
  - Flows:
    - Email/password sign-up and login
    - PKCE deep link flow for OAuth redirects
    - JWT token with 1-hour expiry + refresh token rotation
  - Session Persistence: AsyncStorage
  - Auto Token Refresh: `autoRefreshToken: true` in Supabase config
  - Session Detection: `detectSessionInUrl: false` (React Native, no URL-based OAuth)

**Biometric Authentication:**
- expo-local-authentication 17.0.8 - Face ID / Touch ID unlock
  - Integration: `hooks/useLocalAuth.ts`
  - Fallback: PIN authentication when biometric unavailable

## Health Data Integration

**Apple HealthKit (iOS):**
- Library: react-native-health 1.7.0
- Purpose: Read menstrual cycle history for period prediction accuracy
- Permissions: NSHealthShareUsageDescription (read-only)
- Integration: `hooks/useHealthSync.ts`
- Platform: iOS only (conditional in hook)

**Android Health Connect:**
- Library: react-native-health-connect 3.1.0
- Purpose: Read menstrual cycle history (Android equivalent to HealthKit)
- Permissions: Health Connect data access (read-only)
- Integration: `hooks/useHealthSync.ts`
- Platform: Android only (conditional in hook)

## Push Notifications

**Native Push (iOS & Android):**
- Service: Expo Push API (managed by Expo)
- Token Type: EAS format (obtained via `expo-notifications` + EAS project ID)
- Implementation:
  - Token registration: `hooks/useNotifications.ts`
  - Token storage: `lib/db/pushTokens.ts`
  - Token retrieval: `EXPO_PUBLIC_EAS_PROJECT_ID` environment variable
- Delivery:
  - Foreground: Realtime via Supabase websocket
  - Background: Supabase Edge Function (`app/supabase/functions/notify-sos/`)

**Web Push (Future):**
- API: Web Push API (VAPID keys)
- Implementation: Registered in `hooks/useNotifications.ts` (partial, conditional on web platform)
- Status: Partially implemented for future web support

**Notification Scheduling:**
- Cron Delivery: Daily cycle reminder via `app/supabase/functions/notify-cycle/` (scheduled Edge Function)
- Webhook Delivery: Real-time SOS alert via `app/supabase/functions/notify-sos/` (DB trigger → webhook)
- Functions: Deno-based, deployed via Supabase CLI

## Realtime Communication

**WebSocket (Supabase Realtime):**
- Purpose: Real-time couple linking and SOS signal sync
- Client: `@supabase/supabase-js` (Realtime module)
- Channels:
  - `couples:{coupleId}` - Couple linking updates
  - `sos_signals:{recipientId}` - Real-time SOS alerts (Sun receives)
- Implementation:
  - Couple linking: `hooks/useCoupleLinkedListener.ts`
  - SOS alerts: `hooks/useSOSListener.ts`
- Authentication: RLS via JWT role claim (Moon vs Sun)

## CI/CD & Deployment

**Mobile (iOS):**
- Build Service: EAS Build (Expo's cloud CI)
- Distribution: Apple TestFlight (internal testing)
- Workflow: `.github/workflows/testflight.yml` - Manual trigger for TestFlight builds
- Source: `app/app.json` → EAS project reference

**Mobile (Android):**
- Build Service: EAS Build (planned)
- Distribution: Google Play Store (not yet live)
- Status: Build infrastructure ready, app not yet released

**Proxy:**
- Hosting: Vercel Serverless
- Deployment: Automatic on push to `master` (production) or `develop` (preview)
- Workflow: `.github/workflows/proxy.yml`
- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Command: `vercel deploy --prod` for production

**Database:**
- Hosting: Supabase Cloud (PostgreSQL 15)
- Migrations: Automatic on push to `master`
- Workflow: `.github/workflows/supabase.yml`
- Tool: Supabase CLI (`supabase db push`)
- Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_URL`

**Landing Page:**
- Hosting: GitHub Pages
- Deployment: Automatic on push to `master`
- Workflow: `.github/workflows/pages.yml`
- Source: `landing/index.html`

## Monitoring & Observability

**Error Tracking:**
- Not detected - Console logs used for troubleshooting
- Error logging pattern: `console.error('[component-name] message:', error)`

**Logging:**
- Client: `console` (browsers/Expo Go) and app logs (native builds)
- Server (Proxy): `console.log()` / `console.error()` in Vercel Functions
- Database: Supabase query logs (accessible via Dashboard)

**Analytics:**
- Not detected - No third-party analytics integrated

## Environment & Secrets

**Secret Management:**
- Approach: Environment variables (GitHub Secrets for CI/CD)
- GitHub Secrets Location: Repository Settings → Secrets → Actions
- Sensitive Variables:
  - `SUPABASE_ACCESS_TOKEN` - Supabase CLI auth
  - `SUPABASE_DB_URL` - Direct DB access (contains password)
  - `MINIMAX_API_KEY` - MiniMax API key (proxy only, never in app)
  - `VERCEL_TOKEN` - Vercel CLI auth
  - `CLIENT_TOKEN` - Shared secret for app ↔ proxy auth

**Local Development:**
- `.env` files (app/ and proxy/) — git-ignored, use `.env.example` as template
- Supabase local emulator: Started via `supabase start` (PostgreSQL 15, API, Auth, Storage, Functions)

## Webhooks & Callbacks

**Incoming (App ← Services):**
- Expo Push Notification - Delivered to app via `expo-notifications`
- Supabase Realtime - WebSocket messages on subscribed channels
- Deep Links - OAuth redirects handled by `expo-linking` in `app/_layout.tsx`

**Outgoing (Supabase Edge Functions):**
- notify-sos webhook - Triggered by `sos_signals` table insert (fires push notification)
- notify-cycle webhook - Scheduled cron job (fires daily cycle reminders)
- Both functions: `POST` to Expo Push API (`https://exp.host/--/api/v2/push/send`)

## Data Sync & Offline

**Optimistic Updates:**
- Pattern: UI updates immediately, DB sync is async best-effort
- Location: Store actions in `app/store/appStore.ts`
- Fallback: If DB sync fails, in-memory state persists (async retry on next screen visit)

**Realtime Sync:**
- Couple linking: Realtime via `useCoupleLinkedListener` (WebSocket channel)
- SOS alerts: Realtime via `useSOSListener` (WebSocket channel)
- Health data: Manual sync via `useHealthSync` (pull-based, on-demand)

---

*Integration audit: 2026-03-22*
