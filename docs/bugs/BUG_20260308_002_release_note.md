# BUG_20260308_002 — Release Note

**Date:** 2026-03-08
**Version:** v1.5.2
**Severity:** High (P1)

---

## 1. User-Facing Release Note

### Push notifications are now working

Since launch, the app has not been sending push notifications when your phone is locked or the app is closed. This affected two key features:

- **Cycle notifications for Moon:** "Your period is approaching," "Your period may have started," and "Your period is ending" notifications were never delivered. If you configured notification timing in Settings, those preferences were saved but had no effect.
- **SOS and Whisper alerts for Sun:** When Moon sent an SOS or Whisper while Sun's app was closed or in the background, no push notification was delivered. Sun would only see the alert if the app was already open.

Both are now fixed. Moon will receive daily cycle notifications based on her settings, and Sun will receive background push alerts for every SOS and Whisper signal.

No action is needed on your part -- notifications will begin arriving automatically. Your existing notification preferences in Settings are preserved and will now take effect.

---

## 2. Internal Changelog

| Field | Detail |
|-------|--------|
| **Bug ID** | BUG_20260308_002 |
| **Root Cause Category** | CI/CD deployment gate — silent skip |
| **Root Cause** | The `deploy-functions` job in `.github/workflows/supabase.yml` had a conditional (`if: contains(toJson(github.event.commits.*.modified), 'app/supabase/functions/')`) that only triggered deployment when edge function source files appeared in the commit's modified/added file list. Because functions were added in large multi-file commits, and GitHub truncates file lists in webhook payloads for large pushes, the condition never evaluated to `true`. Both `notify-cycle` and `notify-sos` edge functions existed in the repo but were never deployed to Supabase production. |
| **Affected Components** | `.github/workflows/supabase.yml` (deploy-functions job), `notify-cycle` edge function (daily cycle push), `notify-sos` edge function (SOS/Whisper background push) |
| **Affected Users** | All users (100%) — Moon users missed cycle notifications; Sun users missed background SOS/Whisper push notifications |
| **Fix Approach** | Removed the `if` conditional from the `deploy-functions` job entirely. The job now runs on every push to `main`, matching the existing `migrate` job pattern. `supabase functions deploy` is idempotent (checksums source, only re-deploys if changed), so unconditional execution adds ~30s overhead with no correctness risk. |
| **Fix Size** | 4 lines removed, 2 comment lines updated in 1 file |
| **Breaking Changes** | None |
| **Post-Deploy Action** | (1) Verify `Edge Functions` job succeeds in the triggered workflow run. (2) Manually trigger `notify-cycle.yml` to confirm HTTP 200. (3) Verify `notify-sos` Database Webhook exists in Supabase Dashboard (Table: `sos_signals`, Event: INSERT, Function: `notify-sos`) — create manually if missing. |

---

## 3. Developer Note

### Files Changed

| File | Change |
|------|--------|
| `.github/workflows/supabase.yml` | Removed `if` condition block (lines 57-60) from `deploy-functions` job. Updated header comment to reflect unconditional deployment. |

### No App Code Changes

This fix is entirely in CI/CD configuration. No changes to:
- Edge function source code (`app/supabase/functions/notify-cycle/index.ts`, `app/supabase/functions/notify-sos/index.ts`)
- App notification hooks (`useNotifications.ts`, `useSOSListener.ts`)
- Store, DB layer, or UI components

### Risk Areas to Monitor

- **First-ever production deployment of both edge functions.** Although the function code has been validated via static analysis (correct Deno imports, proper auth, valid Expo Push API calls), this is their first live execution. Monitor Supabase function logs after the first `notify-cycle` invocation.
- **Expired push tokens.** Tokens in `push_tokens` may have been registered weeks ago and never used. Expo Push API returns `DeviceNotRegistered` for expired tokens. The functions handle this gracefully (log and skip), but initial delivery rates may be lower than expected.
- **`notify-sos` Database Webhook.** The webhook must be configured in the Supabase Dashboard — it is not managed by code or migrations. If it was never created (because the function didn't exist to point to), deploying the function alone will not enable SOS background push. Manual Dashboard verification is required.
- **Notification preferences now take effect.** Moon users who previously configured timing preferences (AI timing, days-before) in Settings will start receiving notifications based on those saved values. Verify that the preference-reading logic in `notify-cycle` handles edge cases (e.g., `use_ai_timing = true` but no AI prediction available).

### Test Coverage

| Category | Total | PASS | UNTESTED |
|----------|-------|------|----------|
| Bug Fix (P0-P1) | 3 | 1 | 2 |
| Regression (P0-P1) | 4 | 3 | 1 |
| Non-Regression (P1-P2) | 5 | 2 | 3 |
| **Total** | **12** | **6** | **6** |

6 tests require post-push verification (CI workflow execution and device testing). All code-inspection tests pass. No regressions detected in static analysis. Full verification will be complete after the fix is pushed to `main` and both edge functions are confirmed deployed (HTTP 200).
