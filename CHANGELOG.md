# Changelog

All notable changes to Easel are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Versioning: `MAJOR.MINOR.PATCH`
- MAJOR — breaking schema or API changes
- MINOR — new features
- PATCH — bug fixes, dependency bumps

---

## [Unreleased]

### Known Issues
- **`DbCouple` type duplication** — The interface is defined in both `app/types/index.ts` and `app/lib/db/couples.ts`. The `types/index.ts` version is the canonical one; the `couples.ts` copy should be removed and imported instead.

### Fixed
- **MEDIUM: `notify-cycle` GitHub Actions workflow broken** — Supabase CLI removed `functions invoke` subcommand in newer versions, causing the daily notification cron to fail. Replaced CLI-based invocation with direct HTTP `curl` to the Edge Function URL. Removes CLI install step and eliminates future CLI version drift.
- **CRITICAL: Ovulation day formula** — Changed from `avgCycleLength / 2` to `avgCycleLength - 14` (medical standard: luteal phase is ~14 days). Previously off by 2+ days for non-28-day cycles, causing incorrect phase calculations, calendar markers, and fertility estimates.
- **HIGH: DailyCheckIn dark theme** — Component used light-theme `Colors` tokens (white card, dark text) inside the dark MoonDashboard. Now uses `MoonColors` for proper contrast.
- **HIGH: Theme color consolidation** — Removed duplicated `MOON`/`SUN` color objects from `MoonDashboard.tsx`, `SunDashboard.tsx`, `WhisperSheet.tsx`, `UnlinkedScreen.tsx`, `SOSSheet.tsx`, `InsightCard.tsx`. All now reference canonical `MoonColors`/`SunColors` from `constants/theme.ts`.
- **MEDIUM: Profile upsert** — `upsertProfile()` in `lib/db/profiles.ts` used `.update()` which silently failed if the profile row didn't exist. Changed to `.upsert()` with `onConflict: 'id'` so role and display name are always persisted.
- **LOW: Calendar date locale** — `DayDetailSheet` date format was hardcoded to `en-US`. Now respects the user's language setting (Vietnamese or English).

---

## [1.5.0] — 2026-03-07

### Security Hardening (Pre-Publishing Audit)

#### Database (migration 006)
- **CRITICAL: Added `UNIQUE(boyfriend_id)` constraint** on `couples` table — prevents a Sun user from being linked to multiple Moon partners, which could leak health data between couples.
- **CRITICAL: RLS policy optimization** — wrapped all `my_couple_id()` / `my_partner_id()` calls in `(SELECT ...)` subqueries so PostgreSQL executes them once per query instead of once per row. Prevents DoS on large tables.
- **CRITICAL: `sos_signals.type` constraint restored** — regex pattern `^[a-z][a-z0-9_]{0,49}$` replaces the dropped CHECK, allowing whisper IDs while blocking arbitrary strings.
- **HIGH: `sos_signals` UPDATE restriction** — new `guard_sos_update` trigger prevents modifying any column except `acknowledged_at`. Previously the UPDATE policy allowed changing `type`, `sender_id`, or `message`.
- **MEDIUM: `SECURITY DEFINER` functions** — added `SET search_path = public` to `my_couple_id()`, `my_partner_id()`, `handle_new_user()`, `set_updated_at()` to prevent schema-poisoning attacks.
- **MEDIUM: FK indexes added** — `sos_signals(couple_id)`, `sos_signals(sender_id)`, `period_logs(user_id)`, `daily_logs(user_id)`, `push_tokens(user_id)`, `couples(boyfriend_id)` for RLS and JOIN performance.
- **MEDIUM: Couples link expiry guard** — new `guard_couple_link` trigger rejects linking if `link_code_expires_at < NOW()` at the database level, closing a TOCTOU race window.
- **HIGH: `display_name` length constraint** — max 100 characters on `profiles.display_name`.

#### Edge Functions
- **CRITICAL: `notify-cycle` authentication** — added `Authorization: Bearer` header validation against `SUPABASE_SERVICE_ROLE_KEY`. Previously anyone who discovered the URL could trigger mass push notifications.
- **HIGH: Error response sanitization** — both `notify-cycle` and `notify-sos` now return generic `"Internal server error"` instead of `String(err)` which could leak query context or stack traces.
- **MEDIUM: Push token logging removed** — `notify-sos` no longer logs full Expo Push API response (which contained device tokens).

#### App Code
- **HIGH: Avatar URL persistence** — `updateAvatarUrl` now writes to `profiles.avatar_url` in Supabase, not just local Zustand state. Avatar survives re-login and multi-device use.
- **HIGH: Avatar MIME type validation** — upload now reads actual `asset.mimeType` from image picker and validates against allowlist (`image/jpeg`, `image/png`, `image/webp`) instead of hardcoding `image/jpeg`.
- **MEDIUM: Explicit `select()` columns** — replaced `select('*')` in `profiles.ts`, `couples.ts`, `cycle.ts` with named columns to prevent PII leakage from future column additions.
- **MEDIUM: `avatarUrl` restored on session hydration** — `signIn` and `bootstrapSession` now set `avatarUrl` from the DB profile.
- **MEDIUM: Deep link `verifyOtp` safety** — replaced unsafe `type as any` cast with an allowlist of valid OTP types (`recovery`, `signup`, `magiclink`, `invite`, `email`). Errors are now logged instead of silently ignored.
- **CRITICAL: Removed real database password** from `app/.env.example` (was committed to git). Credential rotation required.

### Changed
- `app.json` version synced to `1.5.0` with `ios.buildNumber: "1"` and `android.versionCode: 1`.
- Added `ITSAppUsesNonExemptEncryption: false` to iOS config (HTTPS only, no custom crypto).
- Created `eas.json` with `development`, `preview`, and `production` build profiles for EAS Build.

---

## [1.4.1] — 2026-03-07

### Changed — Documentation & Project Hygiene
- **README.md rewritten** — Comprehensive update reflecting current v1.4.0 state: added Features section (Moon/Sun/Shared), detailed monorepo structure with subdirectory descriptions, expanded tech stack table (HealthKit, i18n, landing page), environment variables reference, API endpoints table, database overview (10 tables), security summary, and all 4 CI/CD pipelines including GitHub Pages.
- **GitHub Releases created** — Retroactively created detailed GitHub Releases for v1.3.0 and v1.4.0 with full changelog bodies (previously only lightweight git tags existed).
- **Release workflow updated** — Future releases will include detailed change descriptions in GitHub Release notes, not just tag names.

---

## [1.4.0] — 2026-03-07

### Added — Bilingual Support (Vietnamese + English)
- **i18next integration** — `i18next` + `react-i18next` + `expo-localization` for full internationalization.
- **11 translation namespaces** — `common`, `auth`, `onboarding`, `dashboard`, `settings`, `calendar`, `checkin`, `signals`, `phases`, `partner`, `health`. Each has both `en` and `vi` JSON files (`app/i18n/en/`, `app/i18n/vi/`).
- **Language auto-detection** — Device locale detected via `expo-localization`; falls back to `'en'` if not Vietnamese.
- **Language picker in Settings** — Toggle between English and Vietnamese with flag display (🇬🇧 / 🇻🇳). Persisted locally (Zustand + AsyncStorage) and synced to Supabase `user_preferences.language`.
- **All UI strings translated** — 17 files updated to replace hardcoded English with `t()` / `useTranslation()` calls:
  - Auth: `auth.tsx`, `reset-password.tsx`
  - Onboarding: `onboarding.tsx`
  - Tabs: `index.tsx`, `calendar.tsx`, `settings.tsx`
  - Moon: `MoonDashboard.tsx`, `DailyCheckIn.tsx`, `SOSSheet.tsx`, `PhaseWheel.tsx`, `InsightCard.tsx`, `WhisperSheet.tsx`, `HealthSyncPrompt.tsx`
  - Sun: `SunDashboard.tsx`, `SOSAlert.tsx`, `WhisperAlert.tsx`, `UnlinkedScreen.tsx`
- **Vietnamese translations** — Natural, culturally appropriate Vietnamese copy for all UI strings, phase names, symptom labels, whisper/SOS options, error messages, and onboarding flows. Moon/Sun kept as brand names.
- **Locale-aware date formatting** — Calendar and Settings use `toLocaleDateString()` with `vi-VN` or `en-US` based on selected language.

### Changed
- `appStore.ts` — Added `language` state + `setLanguage` action with background Supabase sync. Language resets to `'en'` on sign out.
- `_layout.tsx` — Imports `@/i18n/config` to initialize i18n before any component renders.
- `DailyCheckIn.tsx` — Symptom options refactored from `string[]` to `{key, label}[]` so DB stores English keys while UI shows translated labels.

### Database (migration 005)
- New column: `user_preferences.language` — `TEXT NOT NULL DEFAULT 'en'` with `CHECK (language IN ('en', 'vi'))`.

### Documentation
- `docs/plans/2026-03-07-bilingual-i18n-design.md` — Design doc covering architecture, namespace structure, translation scope, and Phase 2 AI content localization plan.

---

## [1.3.0] — 2026-03-07

### Added
- **Whisper success confirmation UI** — After Moon sends a whisper, the bottom sheet transforms into a celebration view with a pulsing check circle, the whisper option chip, and "Whispered to your Sun / He'll know what to do." Auto-dismisses after 2.5 s.
- **Whisper-specific push notification copy** — `notify-sos` edge function now includes warm, phase-aware copy for all 16 whisper types (e.g., "Moon needs you — She needs a hug right now"). Custom whispers fall back to "Moon whispered to you".

### Fixed
- **`sos_signals.type` CHECK constraint** — Migration `004_relax_sos_type_constraint.sql` drops the restrictive constraint that was silently blocking all whisper inserts and preventing Sun from receiving push notifications.

---

## [1.2.0] — 2026-03-07

### Added — Landing Page (`landing/index.html`)
- **Complete single-file static landing page** — Pure HTML + CSS + JS, no frameworks, no build tools. Loads only Google Fonts (Cormorant Garamond + DM Sans) externally.
- **10 fully designed sections**:
  1. **Hero** — "When you understand her cycle, you understand her." Moon + Sun orbit animation with floating phase dots, CTA buttons, social proof.
  2. **What Is Easel** — Concept intro with stat callouts (28 days, 4 phases, 2 people, 1 relationship) and animated cycle wheel (canvas with auto-rotation).
  3. **Benefits** — 6-card grid on dark background covering self-awareness, emotional regulation, intimacy planning, conflict reduction, health monitoring, and couple bonding. Hover-activated top border accent.
  4. **Moon & Sun Whispers** — Split layout: Moon panel (purple/lavender) with 3 poetic whisper examples; Sun panel (amber/gold) with 3 practical whisper examples.
  5. **For Him** — 5 reasons why he should invite her, with mock phone showing Sun Whisper notification driving a sweet text exchange.
  6. **For Her** — 5 reasons why she should ask him to join, with pull-quote card: "Feeling seen by the person you love — that's Easel."
  7. **The 4 Phases** — Horizontal-scrollable phase cards (Menstrual / Follicular / Ovulation / Luteal) with "How she feels" + "How he can support" per phase.
  8. **Relationship Score** — Gamified couple metric widget (canvas-drawn ring at 87/100) with animated progress bars for her logs, his whisper reads, and shared calendar usage.
  9. **Testimonials** — 3 couple stories (her POV, his POV, joint) with avatar initials and star ratings.
  10. **Final CTA** — Full-width dark section with Moon/Sun radial glow decorations and dual CTAs ("Download for Her" / "Share with Him").
- **Refined organic luxury aesthetic** — Premium wellness brand feel with custom color palette (ivory, blush, rose, moon purple, sun amber, ink, sage), serif display headings, and warm tones throughout.
- **Custom cursor** — Dot + ring following mouse with smooth lag; expands on interactive elements; hidden on mobile.
- **Scroll animations** — IntersectionObserver triggers staggered fade-up reveals (`.reveal` → `.visible`) with configurable delays.
- **Moon & Sun animations** — Moon orbits and floats (7s ease-in-out); Sun orbits in reverse and pulses with warm glow (5s); 3 concentric orbit rings rotate at different speeds (25s/40s/60s).
- **Animated cycle wheel** — Canvas-drawn donut chart with 4 color-coded segments, auto-rotating slowly. Phase labels rendered at arc midpoints.
- **Relationship Score canvas** — Animated circular progress ring with gradient stroke (sage → moon), fills to 87% on scroll intersection.
- **Mobile responsive** — Full mobile-first design with 768px breakpoint. Hamburger menu with slide-in navigation. Touch-friendly 44px tap targets. `clamp()` font sizing.
- **Sticky navigation** — Blur backdrop with logo, section links, and "Start Together" CTA. Shadow appears on scroll.
- **Inline SVG favicon** — Gradient circle (moon-deep → rose-deep) with italic serif "e", embedded as data URI.
- **Accessible** — Semantic HTML (`nav`, `section`, `article`, `header`, `footer`), proper heading hierarchy (h1 → h2 → h3 → h4), `aria-label` on decorative elements, `aria-expanded` on hamburger toggle.
- **Smooth scroll** — Anchor links scroll smoothly between sections.

---

## [1.1.0] — 2026-03-06

### Added — Sun/Moon UX Overhaul
- **Partner linking real-time**: `useCoupleLinkedListener` hook updates Moon's store the moment Sun links via Supabase Realtime, without requiring a page refresh.
- **Whisper system** (Moon → Sun): Phase-aware intimate signals Moon can send Sun beyond the original 4 SOS types. `WHISPER_OPTIONS` provides 4 options per phase (16 total). `WhisperSheet` bottom sheet on Moon Dashboard. `WhisperAlert` banner on Sun Dashboard.
- **AI Whisper options** (`POST /api/whisper-options`): Proxy endpoint generates personalised 4-option whisper menus via MiniMax based on phase + past selections.
- **AI cycle prediction** (`POST /api/predict-cycle`): MiniMax analyses historical period logs to predict next period date with confidence score (`high`/`medium`/`low`) and adaptive notification timing.
- **Apple Health sync** (`useHealthSync`): Reads menstrual cycle history from HealthKit on iOS and syncs into `cycle_settings` and `period_logs`.
- **Avatar upload** (`useAvatarUpload`): Profile photo stored in Supabase Storage `avatars` bucket (5 MB max, JPEG/PNG/WebP).
- **Display name** persisted to `profiles.display_name` and shown on Sun Dashboard greeting.
- **Notification preferences UI**: Moon can independently toggle period approaching/started/ended, whisper alerts, and choose AI vs manual timing (1–7 days before).
- **Sun partner card in Settings**: Shows Moon's current phase, day in cycle, and days until next period. Includes Whisper notification toggle.
- **Password strength meter** on Sign Up screen (3-segment bar: Weak/Fair/Strong).
- **Forgot password flow**: In-line inline form on Sign In screen; sends Supabase reset-link email.
- **Email verification pending screen**: After Sign Up, shows "Check your inbox" with resend capability.
- **Unlinked Sun screen** (`UnlinkedScreen`): Dedicated full-screen prompt for Sun users before they link; includes manual code entry + partner invite share sheet.
- **Moon invite banner**: Shown on Moon Dashboard when partner not yet linked; taps through to Settings.
- **Daily notify-cycle CI job** (`.github/workflows/notify-cycle.yml`): GitHub Actions cron at 8 AM UTC invokes the `notify-cycle` edge function to send period approach/start/end push notifications.
- **`notify-cycle` edge function**: Calculates each Moon's current cycle day, fires Expo push notifications for period lifecycle events.
- **`MoonColors` / `SunColors`** exported from `constants/theme.ts` along with `getTheme(role)` helper.

### Changed
- Profiles `role` constraint expanded from `('girlfriend', 'boyfriend')` to `('moon', 'sun', 'girlfriend', 'boyfriend')` (migration 002 — backward compatible).
- UI terminology renamed Moon (girlfriend) / Sun (boyfriend) throughout.
- SOS flow now shared with Whisper — both use `sendSOSSignal` → `sos_signals` table.
- Auth screen: PKCE token-hash deep link handling + implicit fragment flow both supported in `_layout.tsx`.

### Database (migration 002)
- New table: `whisper_history` — tracks Moon's selection frequency for AI personalisation.
- New table: `notification_preferences` — per-user granular notification toggles.
- New trigger: `on_profile_created_notif_prefs` — auto-provisions notification_preferences on signup.
- New column: `profiles.avatar_url`, `profiles.display_name` (idempotent `ADD COLUMN IF NOT EXISTS`).

### Database (migration 003)
- New Supabase Storage bucket: `avatars` (public read, 5 MB limit, JPEG/PNG/WebP).
- RLS policies: `avatars_public_read`, `avatars_authenticated_upload`, `avatars_owner_manage`.

---

## [1.0.0] — 2026-03-05

Initial release.

### Added — Core App
- **Expo / React Native app** (SDK 52, RN 0.76, TypeScript, Expo Router v4).
- **Supabase Auth** (email/password, persistent session via AsyncStorage, auto-refresh JWT).
- **Onboarding**: role selection (Moon / Sun), cycle settings entry for Moon, partner link code entry for Sun.
- **Moon Dashboard**: phase wheel (`PhaseWheel`), AI greeting, phase tagline chip, insight cards (conception chance, self-care tip), phase description, daily check-in with mood + symptom logging and AI daily insight.
- **Sun Dashboard**: Moon's status card (phase orb + countdown), AI partner advice card (`GuideCard`), 4-phase overview chips.
- **SOS system**: 4 fixed signal types (Sweet Tooth, Need a Hug, Cramps Alert, Quiet Time). `SOSSheet` on Moon, `SOSAlert` on Sun. Realtime delivery via Supabase WebSocket + push notification fallback via `notify-sos` edge function.
- **Calendar tab**: cycle markers (period / fertile / ovulation) rendered 3 cycles ahead via `buildCalendarMarkers`.
- **Settings tab**: cycle settings editor (length, period length, last period date picker), partner link code display + share, Sign Out.
- **Cycle calculator** (`utils/cycleCalculator.ts`): `getCurrentDayInCycle`, `getCurrentPhase`, `getDaysUntilNextPeriod`, `getConceptionChance`, `buildCalendarMarkers`.
- **Zustand store** (`store/appStore.ts`) with AsyncStorage persistence. Transient fields (`activeSOS`, `activeWhisper`, `userId`, `coupleId`) excluded from persistence.
- **Push notifications** (`useNotifications`): registers Expo push token on login, saves to `push_tokens` table. Android notification channels: whisper, cycle, sos.

### Added — Vercel Proxy
- **7 serverless endpoints** protecting the MiniMax API key:
  - `POST /api/greeting` — GF daily greeting
  - `POST /api/partner-advice` — BF phase-specific action tip
  - `POST /api/sos-tip` — BF immediate SOS action tip
  - `POST /api/daily-insight` — GF post-check-in personalised insight
  - `POST /api/whisper-options` — AI-generated Whisper menu for current phase
  - `POST /api/predict-cycle` — AI cycle prediction with confidence scoring
  - `GET /api/health` — health check
- **5-layer security**: method check → `X-Client-Token` validation → IP rate limiting (10 req/min) → input validation → MiniMax call.
- **MiniMax `<think>` block stripping** — removes reasoning chain output from M2.5 responses before returning to client.
- **`lib/rateLimit.ts`**: in-memory sliding window, 10 requests/minute per IP, auto-prune every 5 minutes.
- **`lib/auth.ts`**: `validateClientToken` constant-time comparison.

### Added — Supabase
- **8 tables** (migration 001): `profiles`, `couples`, `cycle_settings`, `period_logs`, `daily_logs`, `sos_signals`, `push_tokens`, `user_preferences`.
- **RLS on every table** — data isolation enforced at the database layer.
- **Helper functions**: `my_couple_id()`, `my_partner_id()` — `SECURITY DEFINER` to avoid RLS recursion.
- **Realtime publications**: `sos_signals`, `cycle_settings`.
- **Edge functions**: `notify-sos` (instant push on SOS INSERT), `notify-cycle` (daily cycle lifecycle notifications).
- **Database webhook**: `sos-signal-push` → `notify-sos` on `sos_signals INSERT`.

### Added — CI/CD
- `.github/workflows/supabase.yml`: DB migrations on push to `main`; edge function deploy on `app/supabase/functions/**` change.
- `.github/workflows/proxy.yml`: Vercel deploy on `proxy/**` change.
- `.github/workflows/notify-cycle.yml`: Daily cron at 08:00 UTC to invoke `notify-cycle`.
