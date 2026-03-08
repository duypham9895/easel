# BUG_20260308_002 — Impact Map

**Bug ID:** BUG_20260308_002
**Phase:** 1 — Impact Mapping
**Date:** 2026-03-08

---

## 1. Directly Involved Files

### Primary (bug source)

| File | Role | Why it matters |
|------|------|----------------|
| `.github/workflows/supabase.yml` | Deployment pipeline | The `deploy-functions` job (lines 54-77) has a conditional `if` that only triggers when `app/supabase/functions/` files are modified or added in the commit. This is the root gate that prevents deployment. |
| `.github/workflows/notify-cycle.yml` | Daily cron invoker | Sends `POST` to `functions/v1/notify-cycle` at 8 AM UTC daily. Fails with 404 because the target function was never deployed. |
| `app/supabase/functions/notify-cycle/index.ts` | Edge function code | The function itself is correct (217 lines, tested logic). It exists in the repo but not on Supabase production. |

### Secondary (same deployment path, same bug class)

| File | Role | Why it matters |
|------|------|----------------|
| `app/supabase/functions/notify-sos/index.ts` | SOS/Whisper push notification function | Shares the exact same deployment gate in `supabase.yml`. If `notify-cycle` was never deployed, `notify-sos` is almost certainly also undeployed. |
| `app/supabase/functions/tsconfig.json` | Shared config for both functions | Changes here would trigger `deploy-functions` but would not indicate which function actually changed. |

### Supporting (notification infrastructure)

| File | Role |
|------|------|
| `app/hooks/useNotifications.ts` | Registers Expo push tokens, sets up notification channels (`cycle`, `whisper`, `sos`). Tokens are saved but never receive pushes. |
| `app/hooks/useSOSListener.ts` | Realtime (foreground) SOS listener. Works independently of edge functions — not broken, but only covers foreground case. |
| `app/lib/db/sos.ts` | `sendSOSSignal()` inserts into `sos_signals` table. The INSERT triggers a Supabase Database Webhook pointing to `notify-sos`. If `notify-sos` is undeployed, the webhook call also returns 404. |
| `app/lib/db/pushTokens.ts` | Saves push tokens to DB. Tokens exist but are never used because edge functions are not deployed. |
| `app/store/appStore.ts` | `updateNotificationPrefs()` (line 390) syncs preferences to `notification_preferences` table. `notify-cycle` reads these prefs to decide what to send — but the function never runs. |

---

## 2. Shared Code / Cross-Feature Impact

### The `deploy-functions` gate affects ALL edge functions

The `supabase.yml` conditional (lines 57-60) applies to the **entire** `deploy-functions` job, which deploys **all** functions via `supabase functions deploy`. This means:

- **`notify-cycle`** — daily cycle notifications (confirmed broken, HTTP 404)
- **`notify-sos`** — SOS/Whisper background push notifications (likely broken, same deployment path)
- **Any future edge function** added to `app/supabase/functions/` will also be silently undeployed if the initial commit includes other non-function files

### The conditional has three failure modes

1. **No function files in commit** — job skipped entirely (current bug)
2. **Function files in a merge commit** — `github.event.commits` may not enumerate all files correctly for merge commits or squash merges
3. **Manual workflow_dispatch works** — but nobody runs it because they assume CI handles deployment

---

## 3. Affected User Flows

### Flow 1: Daily Cycle Notifications (BROKEN — all users)

```
cron (8 AM UTC) → notify-cycle.yml → POST /functions/v1/notify-cycle → 404
```

**Who is affected:** Every Moon user and their linked Sun partner.

**What they lose:**
- Moon does not receive "Your period is approaching" (N days before)
- Moon does not receive "Your period may have started" (day 0)
- Moon does not receive "Your period is ending" (after avg period length)
- Sun does not receive corresponding partner notifications ("Moon's period is approaching", etc.)

**Severity:** High. These notifications are the app's core value proposition for proactive cycle awareness. Users who rely on push notifications to prepare for upcoming periods get zero alerts.

### Flow 2: SOS Background Push Notifications (LIKELY BROKEN — all coupled users)

```
Moon sends SOS → INSERT sos_signals → Database Webhook → POST /functions/v1/notify-sos → 404?
```

**Who is affected:** Every Sun user whose Moon partner sends an SOS or Whisper while the app is backgrounded/closed.

**What they lose:**
- SOS push notifications (sweet_tooth, need_a_hug, cramps_alert, quiet_time)
- Whisper push notifications (16 options across 4 phases: hug, warmth, chocolate, quiet, plan, cook, walk, movie, date, compliment, dance, kiss, snacks, space, cuddle, kind)

**Mitigation:** The **foreground** path still works — `useSOSListener` uses Supabase Realtime (WebSocket) to detect new `sos_signals` rows in real time. So if Sun has the app open, they see the alert. But if the app is closed or backgrounded, no push notification arrives.

**Severity:** High. SOS is a time-sensitive feature ("Moon needs you"). Missing background pushes defeats the purpose — Sun may not see the SOS for hours.

### Flow 3: Notification Preferences (DEGRADED — wasted settings)

```
Moon configures prefs in Settings → saved to notification_preferences table → never read by notify-cycle
```

**Who is affected:** Moon users who customize notification preferences.

**What they experience:** The Settings UI allows toggling period approaching/started/ended and configuring AI timing vs manual days-before. These preferences are correctly saved to the database but are never consumed because `notify-cycle` never runs.

**Severity:** Medium. No data loss, but user trust is eroded — they configure settings that appear to work but have no effect.

### Flow 4: Push Token Registration (WASTED — tokens stored but unused)

```
App launch → useNotifications → registers Expo push token → saved to push_tokens table → never queried
```

**Who is affected:** All users.

**What happens:** Push tokens are correctly registered and stored in the database. Both `notify-cycle` and `notify-sos` query `push_tokens` to deliver pushes — but since neither function is deployed, these tokens are never used.

**Severity:** Low (no user-visible impact beyond the missing notifications already described).

---

## 4. Edge Cases That Could Break During the Fix

### EC-1: Deploying functions for the first time may require Supabase project configuration

The `supabase functions deploy` command requires:
- `SUPABASE_ACCESS_TOKEN` secret (used by `supabase.yml` — already configured for migrations)
- `SUPABASE_PROJECT_ID` secret (used in the deploy command — already configured)
- The functions runtime must be enabled on the Supabase project

**Risk:** If functions were never deployed, the Supabase project may not have the functions runtime initialized. First deploy might fail with a project configuration error.

### EC-2: notify-sos Database Webhook may not be configured

`notify-sos` is triggered by a **Supabase Database Webhook** (configured in the Supabase Dashboard, not in code). The webhook must point to:
- Table: `sos_signals`
- Event: `INSERT`
- Type: Supabase Edge Functions
- Function: `notify-sos`

If this webhook was never created in the Dashboard (because the function didn't exist to point to), then deploying `notify-sos` alone will not fix SOS background pushes — the webhook must also be manually created.

**Risk:** High — this is a silent failure. The function could deploy successfully but never be invoked.

### EC-3: Removing the conditional entirely may cause unnecessary deploys

If the fix removes the `if` condition from `deploy-functions`, every push to main will redeploy all edge functions even when only docs or UI files changed. This adds ~30-60 seconds to every CI run.

**Risk:** Low (cost/time only, no correctness issue). Could be mitigated by using `workflow_dispatch` triggers from `notify-cycle.yml` or by always deploying (functions deploy is idempotent).

### EC-4: The `contains()` condition may also miss renamed or deleted function files

The current condition checks `commits.*.modified` and `commits.*.added` but does NOT check `commits.*.removed`. If a function file is deleted, the deploy job would not run and the function would remain active on Supabase — a ghost function that should have been removed.

**Risk:** Low (no current impact, but a latent defect in the workflow logic).

### EC-5: Rate of notifications on first successful deploy

If `notify-cycle` is deployed and immediately invoked, it will process ALL Moon users and send notifications based on today's date. If a Moon user's period happens to be approaching/starting/ending today, they'll get a notification — which is correct. But if the function has never run before, there's no "catch-up" issue (it's stateless, date-based).

**Risk:** None — the function is stateless and idempotent for a given day.

### EC-6: Deno runtime version compatibility

Edge functions use Deno runtime. If the Supabase Deno runtime has been updated since the function code was written, there could be import compatibility issues with `jsr:@supabase/supabase-js@2`.

**Risk:** Low — but should be verified on first deploy.

---

## 5. Regression Test Plan

### Must Test (Critical Path)

| ID | Test | Why |
|----|------|-----|
| RT-1 | Deploy both edge functions via `supabase functions deploy` and verify they return 200 (not 404) | Validates the core fix |
| RT-2 | Invoke `notify-cycle` with service role key and verify it processes Moon users correctly | End-to-end cycle notification flow |
| RT-3 | Insert a row into `sos_signals` and verify `notify-sos` receives the webhook and sends a push | End-to-end SOS/Whisper background push flow |
| RT-4 | Verify `supabase.yml` `deploy-functions` job triggers on commits that modify function files | Existing behavior preserved |
| RT-5 | Verify `supabase.yml` `deploy-functions` job triggers on `workflow_dispatch` | Manual deploy escape hatch works |
| RT-6 | Verify `supabase.yml` `deploy-functions` job triggers on commits that do NOT modify function files (if the fix changes the condition) | New behavior validated |

### Should Test (Adjacent Features)

| ID | Test | Why |
|----|------|-----|
| RT-7 | Verify `migrate` job in `supabase.yml` still runs on every push (not broken by fix) | Ensure migrations are not regressed |
| RT-8 | Verify `proxy.yml` deployment still works (path-filtered, similar pattern) | Similar CI pattern — confirm no cross-contamination |
| RT-9 | Verify notification preferences (period_approaching, period_started, period_ended, use_ai_timing) are correctly read by `notify-cycle` | Preferences were saved but never consumed — first time this code path executes in production |
| RT-10 | Verify push tokens stored in `push_tokens` table are valid Expo push tokens | Tokens may have expired if they were registered weeks/months ago and never used |
| RT-11 | Verify `useSOSListener` (Realtime foreground path) still works after `notify-sos` is deployed | Ensure the two notification paths don't conflict |

### Could Test (Defensive)

| ID | Test | Why |
|----|------|-----|
| RT-12 | Verify `pages.yml` workflow still triggers correctly on `landing/**` changes | Similar path-filtered pattern — confirm no accidental changes |
| RT-13 | Verify edge function authorization (401 for missing/invalid service role key) | Security check — first time these functions run in production |
| RT-14 | Verify edge function error handling (500 response with `{ error: "Internal server error" }`) | Robustness check |

---

## 6. Impact Summary

| Dimension | Assessment |
|-----------|------------|
| **Users affected** | All users (100%) — every Moon and Sun user |
| **Features broken** | 2 — daily cycle notifications (confirmed), SOS/Whisper background push (likely) |
| **Features degraded** | 2 — notification preferences (saved but unused), push token registration (stored but unused) |
| **Data loss** | None — all data (tokens, preferences, signals) is correctly stored |
| **Security impact** | None — no secrets exposed, no auth bypass |
| **Fix complexity** | Low — workflow YAML change + manual deploy or workflow_dispatch |
| **Regression risk** | Low-Medium — fix is isolated to CI config, but first-ever function deploy needs verification |
| **Blast radius of fix** | Contained to `.github/workflows/supabase.yml` and Supabase Dashboard (webhook config) |
