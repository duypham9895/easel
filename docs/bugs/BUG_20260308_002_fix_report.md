# BUG_20260308_002 — Fix Report

**Bug ID:** BUG_20260308_002
**Phase:** 6 — Fix Report
**Role:** Technical Program Manager
**Date:** 2026-03-08

---

## Bug Summary

The `notify-cycle` Supabase Edge Function returned HTTP 404 on every daily cron invocation because it was never deployed to Supabase production. The `deploy-functions` job in `.github/workflows/supabase.yml` used a fragile `contains(toJson(github.event.commits.*.modified), ...)` conditional that only triggered when function source files appeared in the commit metadata. Since the edge functions were last modified in large multi-file commits, and no subsequent function-only commits were made, the deploy job was effectively dead — skipped on every push to `main`.

**Severity:** High
**Frequency:** Always (every scheduled run since function creation)
**Users affected:** 100% — all Moon and Sun users
**Features broken:** Daily cycle notifications (confirmed), SOS/Whisper background push notifications (same deployment gap)

---

## Root Cause Confirmed

The `deploy-functions` job (lines 54-60 of `supabase.yml`) had a three-part `if` condition:

```yaml
if: |
  github.event_name == 'workflow_dispatch' ||
  contains(toJson(github.event.commits.*.modified), 'app/supabase/functions/') ||
  contains(toJson(github.event.commits.*.added), 'app/supabase/functions/')
```

This condition was always false for normal pushes because:

1. **No function-only commits existed.** Edge functions were added/modified in large multi-file commits (`8ac72e3`, `2eb1eea`), and GitHub's webhook payload may truncate file lists for large pushes, causing `contains()` to miss them.
2. **No developer ever ran `workflow_dispatch` manually** because the assumption was CI handled deployment automatically.
3. **The condition checked `modified` and `added` but not `removed`**, meaning deleted functions would also never be cleaned up — a secondary latent defect.

The result: both `notify-cycle` and `notify-sos` edge functions existed in the repo but were never deployed to Supabase, causing HTTP 404 on every invocation.

---

## Fix Approach and Rationale

**Approach selected:** Remove the `if` condition entirely (Approach A from root cause analysis).

**Rationale:**

1. **Idempotent deployment.** `supabase functions deploy` checksums function source and only re-deploys if code changed. This is the same reasoning already applied to the `migrate` job, which runs unconditionally on every push.
2. **Minimal change, maximum reliability.** Removing 4 lines of YAML eliminates the fragile JSON-parsing conditional without introducing new logic.
3. **Low overhead.** Adds approximately 30-60 seconds per CI run for 2 functions — negligible compared to the cost of silently broken notifications.
4. **Alternative approaches rejected:**
   - **Approach B** (add `paths` filter to workflow trigger) would break the `migrate` job, which must run on every push.
   - **Approach C** (split into two workflows + scheduled redeploy) is over-engineered for 2 edge functions.

---

## Files Changed

| File | Lines Changed | Description |
|------|---------------|-------------|
| `.github/workflows/supabase.yml` | -4 lines removed, 2 comment lines updated | Removed `if` condition from `deploy-functions` job; updated header comment to reflect unconditional deployment |

**Total diff:** 6 lines changed in 1 file. No application code modified.

---

## Test Coverage Summary

| Category | Total | PASS | UNTESTED |
|----------|-------|------|----------|
| Bug Fix (P0) | 2 | 1 | 1 |
| Bug Fix (P1) | 1 | 0 | 1 |
| Regression (P0) | 2 | 2 | 0 |
| Regression (P1) | 2 | 1 | 1 |
| Non-Regression (P1) | 2 | 0 | 2 |
| Non-Regression (P2) | 2 | 2 | 0 |
| **Total** | **12** | **6** | **6** |

### PASS (6 cases — all code-inspection and build-check)

| ID | Title | Method |
|----|-------|--------|
| TC-001 | deploy-functions job runs on docs-only push | code-inspection |
| TC-004 | migrate job still runs on every push | code-inspection |
| TC-006 | TypeScript compiles clean | build-check |
| TC-008 | Other workflows unaffected | code-inspection |
| TC-011 | Edge function auth rejects invalid keys | code-inspection |
| TC-012 | Notification preferences saved correctly | code-inspection |

### UNTESTED (6 cases — require push to main + CI + device verification)

| ID | Title | Method | Why Untested |
|----|-------|--------|--------------|
| TC-002 | notify-cycle returns 200 after deployment | ci-check | Requires push to main and workflow execution |
| TC-003 | notify-sos returns 200 after deployment | device-test | Requires deployment + Database Webhook verification |
| TC-005 | deploy-functions works with workflow_dispatch | ci-check | Requires manual trigger after push |
| TC-007 | notify-cycle.yml workflow succeeds | ci-check | Requires push + function deployment |
| TC-009 | Realtime SOS listener still works | device-test | Requires device verification |
| TC-010 | Realtime Whisper listener still works | device-test | Requires device verification |

### Deferred P1 Cases — Justification

TC-003, TC-009, and TC-010 are device-test cases that cannot be executed in this pipeline phase. They require a deployed function, a configured Database Webhook, and two paired devices. These are deferred to post-push verification and do not block the fix itself because:

- The fix is isolated to CI/CD configuration (no app code changes).
- The foreground Realtime path (TC-009, TC-010) is completely independent of the deployment fix.
- TC-003 depends on Supabase Dashboard webhook configuration, which is a manual step documented in the fix notes.

---

## Regression Status

**CLEAN** — Zero regressions detected.

- The `migrate` job is unchanged and continues to run on every push.
- All other workflows (`.github/workflows/proxy.yml`, `notify-cycle.yml`, `pages.yml`) are unaffected (`git diff --name-only .github/` shows only `supabase.yml` modified).
- No application code was modified — the fix is entirely within CI/CD configuration.
- TypeScript compilation passes (`npx tsc --noEmit` clean, excluding pre-existing unrelated test file issue).

---

## Fix Confidence Level

**Low-Medium**

### Reasoning

Per pipeline testing standards:
- **Cannot claim High confidence** because 6 of 12 test cases are UNTESTED, including the P0 bug fix verification (TC-002) and device-test cases (TC-003, TC-009, TC-010).
- **Not Low** because all code-inspection and build-check tests pass, the fix is minimal (6 lines in 1 file), follows an established pattern (mirrors the `migrate` job), and carries no application code risk.

### What raises confidence to High

Confidence upgrades to **High** once the following are confirmed after push:

1. TC-002: `Edge Functions` job runs and succeeds in the Supabase workflow.
2. TC-007: `notify-cycle.yml` returns HTTP 200 (not 404).
3. TC-003: `notify-sos` is accessible (HTTP 200) and Database Webhook is configured.
4. TC-009/TC-010: Realtime SOS and Whisper listeners still function on device.

---

## Post-Push Verification Checklist

After merging to `main`, the following actions are required:

1. **Verify CI deployment:** Confirm the `Supabase` workflow's `Edge Functions` job runs and succeeds.
2. **Test notify-cycle:** Manually trigger `notify-cycle.yml` via `workflow_dispatch` and verify HTTP 200.
3. **Test notify-sos:** Check Supabase Dashboard for the `sos_signals` Database Webhook. If missing, create it (Table: `sos_signals`, Event: INSERT, Type: Supabase Edge Functions, Function: `notify-sos`).
4. **Device verification:** Test SOS and Whisper flows on paired devices to confirm both Realtime (foreground) and Push (background) paths work.
5. **Monitor next daily cron:** Confirm `notify-cycle.yml` succeeds at 8:00 AM UTC the following day without manual intervention.

---

## Recommendation

**Ship the fix.** The change is minimal, follows established CI patterns, and addresses a High-severity bug that has been silently breaking core notifications for all users since the edge functions were first written. The risk of deploying is near-zero (idempotent deploy, no app code changes), while the risk of not deploying is continued 100% notification failure.

Immediately after push, execute the post-push verification checklist above. Upgrade confidence to High once TC-002 and TC-007 are confirmed.
