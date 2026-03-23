# Codebase Concerns

**Analysis Date:** 2026-03-22

## Tech Debt

### 1. Component Naming Duplication (Moon/GF, Sun/BF)
- **Issue:** Two parallel naming schemes coexist in the codebase: `gf/bf` (v1.0) and `moon/sun` (v1.1+)
- **Files:**
  - Old: `app/components/gf/`, `app/components/bf/`
  - New: `app/components/moon/`, `app/components/sun/`
- **Impact:** Confusion during development, harder to find components, inconsistent import paths
- **Fix approach:** Standardize on `moon/sun` naming and migrate existing `gf/bf` components or deprecate them. Delete unused `MyCycleCard.tsx` component (already unused post-CR_002 calendar rebuild).

### 2. DbCouple Type Defined in Multiple Locations
- **Issue:** `DbCouple` interface duplicated in both `app/types/index.ts` and `app/lib/db/couples.ts` — must be kept in sync manually
- **Files:**
  - `app/types/index.ts`
  - `app/lib/db/couples.ts`
- **Impact:** Type drift over time, inconsistent contract definitions
- **Fix approach:** Source of truth should be `app/lib/db/couples.ts` (where DB logic lives), and import it in `app/types/index.ts`. Currently this creates coupling but reduces duplication.

### 3. Unused Translation Keys Accumulating
- **Issue:** After CR_002 calendar rebuild, `MyCycleCard` translation keys remain in `app/i18n/en/` and `app/i18n/vi/` but component is not used
- **Files:**
  - `app/i18n/en/*.json`
  - `app/i18n/vi/*.json`
- **Impact:** Bloated translation files, confusion about what's actually used
- **Fix approach:** Audit and remove unused `myCard` or `logPeriod` keys. Consider setting up a linting rule to detect orphaned i18n keys.

### 4. Rate Limiter is Per-Instance, Not Distributed
- **Issue:** The proxy's in-memory rate limiter (`proxy/lib/rateLimit.ts`) resets on Vercel cold start and doesn't share state across instances
- **Files:** `proxy/lib/rateLimit.ts`
- **Limit:** 30 req/min per IP, but an attacker can spawn multiple requests across instances during cold start windows
- **Impact:** Current scale (low traffic) is acceptable, but DDoS window during scale-up
- **Fix approach:** Upgrade to Vercel KV for distributed rate limiting when traffic increases. For now, acceptable risk given user base size.

## Security Considerations

### 1. Environment Variable Exposure Risk in Proxy
- **Risk:** `MINIMAX_API_KEY` is an environment variable — if Vercel logs request/error details, API key could leak
- **Files:** `proxy/lib/minimax.ts` (callMinimax function)
- **Current mitigation:**
  - Error responses to client are generic ("AI service unavailable"), not detailed
  - `console.error` logs include error details, but only visible to Vercel logs (not client)
  - API key is never passed in request headers from app (static token used instead)
- **Recommendations:**
  - Consider masking API key in console.error logs (show only first 3 chars)
  - Rotate MINIMAX_API_KEY regularly (quarterly recommended)
  - Enable Vercel environment variable protection (already done via .env file)

### 2. User Linking Without Email Verification
- **Risk:** The partner linking flow (`app/lib/db/couples.ts:linkToPartnerByCode`) allows Moon to generate a code and Sun to link via that code without verifying Sun's email
- **Files:** `app/lib/db/couples.ts:linkToPartnerByCode()`
- **Current mitigation:**
  - Supabase RLS prevents unlinked users from seeing each other's data
  - Expiration check on link code (if implemented, verify in DB schema)
  - One code per couple status (pending/linked)
- **Recommendations:**
  - Verify link code expiration is implemented in migration (check 001_initial_schema.sql)
  - Consider adding a confirmation step on Sun's side (e.g., "You are linking to Moon's account — continue?")
  - Log all linking attempts for audit trail

### 3. Deep Link Verification for Password Reset
- **Risk:** Deep links for password reset/OTP verification are handled in `app/app/_layout.tsx` but error handling is logged with `console.warn`
- **Files:** `app/app/_layout.tsx` (deep link handler)
- **Current mitigation:**
  - Supabase handles OTP verification server-side
  - Invalid tokens are rejected at Supabase level
- **Recommendations:**
  - Test that expired/invalid OTP links fail gracefully and show user-friendly error
  - Ensure OTP tokens are single-use and time-limited (Supabase default is 60min)

### 4. Period Day Log RLS Check
- **Risk:** Period day logs can be read by both user and partner via `my_partner_id()` RLS function, but no additional checks for couple status
- **Files:** `app/supabase/migrations/008_period_day_logs.sql` (RLS policies)
- **Current mitigation:** `my_partner_id()` helper function checks couple status implicitly
- **Recommendations:**
  - Verify `my_partner_id()` in migration 006 does NOT return a partner ID if couple status is "pending"
  - Test that unlinking immediately revokes partner's read access to new day logs

## Performance Bottlenecks

### 1. Three-Month Period Day Log Load on Sign-In
- **Problem:** On sign-in, Moon's app loads 3 months of period day logs (`app/store/appStore.ts:signIn()`, lines 225-237)
- **Files:** `app/store/appStore.ts` (signIn, bootstrapSession)
- **Cause:** Eager-load for calendar display; if user has many symptoms or notes, payload grows
- **Current data:** Expected <100 rows (30 days × 3 months), but symptom array + notes could add up
- **Improvement path:**
  - Lazy-load day logs when calendar is first displayed (not at login)
  - Implement pagination: load current month + ±1 month, fetch more on scroll
  - Consider caching in AsyncStorage to avoid re-fetch

### 2. Cycle Settings Recomputation on Every Period Log Update
- **Problem:** `app/store/appStore.ts:addPeriodLog()` calls `recomputeCycleFromLogs()` which iterates through all logs to calculate average cycle length
- **Files:** `app/store/appStore.ts` (lines 129-142, 467-472)
- **Cause:** Each period log addition triggers full recomputation (O(n) where n = number of periods)
- **Impact:** Negligible for current data size (max 24 periods cached), but becomes slow with many years of data
- **Improvement path:**
  - Cache computed average on DB (store `avg_cycle_length` at `cycle_settings` level, already done)
  - Only recompute if new log is significantly different from average
  - Consider storing last 12 cycle gaps in DB instead of recalculating

### 3. MiniMax API Calls Have No Caching
- **Problem:** Every request to proxy endpoints hits the MiniMax API, even if same inputs are requested twice
- **Files:** All `proxy/api/*.ts` endpoints call `minimax.ts` functions directly
- **Impact:** Higher API costs, slower response times, unnecessary network round-trip
- **Improvement path:**
  - Add Redis/Vercel KV caching layer for commonly requested inputs
  - Cache key: hash of (phase, dayInCycle, language)
  - TTL: 1 day (cycle data rarely changes within 24hr)

## Fragile Areas

### 1. Period Day Log Auto-Create/Extend Logic
- **Files:** `app/store/appStore.ts:savePeriodDayLog()` (lines 636-667)
- **Why fragile:** Complex logic to find containing or adjacent period logs; if date boundaries don't align, could create duplicate or orphaned period logs
- **Safe modification:**
  - Write tests first covering: exact match, adjacent day before, adjacent day after, gap of 2+ days
  - Test with cycleSettings.avgPeriodLength = 3, 5, 7 (variable period lengths)
  - Consider adding a "period_log_id" foreign key to period_day_logs instead of relying on date ranges
- **Test coverage:** Gaps exist for edge cases (sparse periods, 2-day periods, period crossing month boundary)

### 2. Realtime Subscription Channel Management
- **Files:**
  - `app/hooks/usePeriodListener.ts`
  - `app/hooks/useSOSListener.ts`
  - `app/__tests__/realtimeSync.test.ts`
- **Why fragile:** Multiple subscriptions to the same Supabase channel could cause duplicate message handling or orphaned channels if unsubscribe fails
- **Safe modification:**
  - Ensure every `supabase.channel()` call has a matching `removeChannel()` in cleanup
  - Test unsubscribe behavior when component unmounts mid-request
  - Add logging for channel lifecycle (subscribe → receive → unsubscribe)
- **Test coverage:** `realtimeSync.test.ts` covers basic insert/update/delete, but doesn't test rapid subscribe/unsubscribe or concurrent messages

### 3. Optimistic Updates Without Rollback in Some Cases
- **Files:** `app/store/appStore.ts` (lines 431, 482-489)
- **Why fragile:** Some optimistic updates (e.g., `updateCycleSettings`) update local state before DB write; if DB fails, state is stale but UI doesn't know
- **Safe modification:**
  - Wrap all optimistic updates in try/catch
  - On error, immediately roll back state to previous value
  - Show error toast to user
- **Test coverage:** Most cases have error handling, but `setLanguage()` and `updateNotificationPrefs()` background sync with only `catch((err) => console.error)` — no user notification

## Scaling Limits

### 1. AsyncStorage Persistence on Mobile
- **Current capacity:** AsyncStorage has a 5-10MB limit on iOS, varies on Android
- **Current usage:** ~1-2MB estimated (100 period logs + settings + preferences)
- **Limit:** If user has 5+ years of history (200+ period logs), could approach limit
- **Scaling path:**
  - Implement periodic cleanup (delete logs older than 3 years)
  - Move only last 24 months to AsyncStorage, fetch older data on-demand from Supabase
  - Test with intentionally large payloads

### 2. Supabase Realtime Connections
- **Current:** App maintains 2-3 concurrent Realtime subscriptions (periods, SOS, whisper)
- **Limit:** Supabase has per-project limits on concurrent connections
- **Impact:** If app goes viral, may hit Supabase limits (upgrade plan required)
- **Scaling path:**
  - Monitor realtime connection count in Supabase dashboard
  - Consider consolidating subscriptions to single channel with event type filter
  - Add connection retry logic with exponential backoff

## Missing Critical Features

### 1. Offline-First Data Sync
- **Problem:** App relies on continuous network connection; if network drops during sync, data loss risk
- **Impact:** Period logs saved optimistically but not persisted to DB could be lost
- **Blocks:** Better UX for low-bandwidth users, airplane mode support
- **Fix approach:**
  - Implement offline queue in store (persist pending writes to AsyncStorage)
  - On reconnect, replay queued writes to Supabase
  - Show "syncing..." indicator during catch-up

### 2. Data Export/Backup
- **Problem:** Users have no way to export their cycle data or back it up independently
- **Impact:** Data loss if account is deleted or compromised; no audit trail for personal health data
- **Blocks:** User privacy compliance, data portability (GDPR/CCPA)
- **Fix approach:**
  - Add "Export as CSV" endpoint that requires email verification
  - Store encrypted backup copies user requests (30-day retention)
  - Consider FHIR/HL7 export format for health data portability

### 3. Couple Session Management
- **Problem:** No way to see linked partners' activity or revoke access without deleting the couple record
- **Impact:** If relationship ends, data is still shared; no audit of who accessed what
- **Blocks:** Privacy controls, trust/safety features
- **Fix approach:**
  - Add "Session History" view showing partner's last login + activity
  - Implement "Unlink" action (soft-delete couple, archive instead of cascade delete)
  - Add invitation workflow instead of code-based linking (email verification)

## Test Coverage Gaps

### 1. Period Log Deletion with Active Day Logs
- **What's not tested:** Deleting a period_log that has associated period_day_logs; verify cascade or orphaning behavior
- **Files:** `app/__tests__/appStore.test.ts`, `app/__tests__/e2e/dataIntegrity.e2e.test.ts`
- **Risk:** Orphaned day logs could accumulate if period deletion is broken
- **Priority:** High

### 2. Concurrent SOS/Whisper Sends from Partner
- **What's not tested:** Moon sends SOS while Sun simultaneously sends SOS; verify both are received correctly
- **Files:** `app/__tests__/realtimeSync.test.ts`
- **Risk:** Message loss or duplication if Realtime event ordering is broken
- **Priority:** Medium

### 3. Partner Linking Edge Cases
- **What's not tested:**
  - Expired link codes (if expiration is implemented)
  - Sun tries to link with already-expired code
  - Moon generates multiple codes in sequence (overwrites old code)
  - Sun tries to link as both Moon and Sun in same account
- **Files:** `app/__tests__/appStore.test.ts`
- **Risk:** Silent failures or data corruption
- **Priority:** High

### 4. Health Sync Termination
- **What's not tested:** HealthKit/HealthConnect sync is interrupted mid-sync (user backs out, network drop)
- **Files:** `app/hooks/useHealthSync.test.ts`
- **Risk:** Partial state, inconsistent period logs
- **Priority:** Medium

### 5. AI Fallback Behavior Under Load
- **What's not tested:** MiniMax API timeout (>30sec); verify graceful fallback to static content shown
- **Files:** `app/hooks/useAI*.ts` files (all AI hooks)
- **Risk:** User sees loading spinner forever if proxy is slow
- **Priority:** Medium

## Known Limitations & Workarounds

### 1. Whisper and SOS ID Collision Risk
- **Limitation:** Whisper IDs are prefixed with `whisper_` to avoid collision with SOS IDs (e.g., `whisper_hug` vs `hug`), but this is convention, not enforced
- **Files:** `app/constants/whisper.ts`, `app/constants/sos.ts`
- **Workaround:** Manual code review when adding new signals; consider enforcing in DB with separate tables

### 2. Ovulation Formula Hardcoded as `avgCycleLength - 14`
- **Limitation:** Assumes ovulation occurs 14 days before next period (standard for 28-day cycles); inaccurate for irregular cycles
- **Files:** `app/utils/cycleCalculator.ts`
- **Workaround:** User can manually adjust cycle length; AI prediction endpoint (`proxy/api/predict-cycle`) could improve accuracy with historical data
- **Impact:** Phase predictions may be off by ±3 days for irregular cycles

### 3. HealthKit/HealthConnect Sync is One-Way
- **Limitation:** Period data flows from HealthKit → Easel, but Easel periods don't sync back to HealthKit
- **Files:** `app/hooks/useHealthSync.ts`
- **Workaround:** None; users must manually confirm imported data
- **Impact:** HealthKit remains source of truth; Easel is read-only from HealthKit perspective

## Recommended Next Steps

1. **High Priority (Breaking):**
   - Audit RLS policies to confirm couple status check in `my_partner_id()` function
   - Add test coverage for period log deletion cascading
   - Implement error user notification for failed optimistic updates

2. **Medium Priority (Quality):**
   - Migrate `gf/bf` components to `moon/sun` naming
   - Implement lazy-load for period day logs (remove 3-month eager-load on sign-in)
   - Add caching layer to MiniMax API calls in proxy

3. **Low Priority (UX):**
   - Remove unused `MyCycleCard` component and associated i18n keys
   - Add offline-first data sync queue
   - Implement couple unlinking (soft-delete couples table)

---

*Concerns audit: 2026-03-22*
