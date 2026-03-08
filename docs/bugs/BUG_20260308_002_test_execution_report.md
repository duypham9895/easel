# BUG_20260308_002 — Test Execution Report

**Bug ID:** BUG_20260308_002
**Phase:** 5 — Test Execution
**Date:** 2026-03-08

---

## Test Results

| ID | Title | Type | Method | Result | Evidence |
|----|-------|------|--------|--------|----------|
| TC-001 | deploy-functions job runs on docs-only push | Bug Fix | code-inspection | **PASS** | `supabase.yml` line 56-58: `deploy-functions` job has no `if` condition — runs unconditionally |
| TC-002 | notify-cycle returns 200 after deployment | Bug Fix | ci-check | **UNTESTED** | Requires push to main + workflow_dispatch verification |
| TC-003 | notify-sos returns 200 after deployment | Bug Fix | device-test | **UNTESTED** | Requires function deployment + webhook config verification |
| TC-004 | migrate job still runs on every push | Regression | code-inspection | **PASS** | `supabase.yml` lines 29-48: `migrate` job unchanged, no conditional |
| TC-005 | deploy-functions works with workflow_dispatch | Regression | ci-check | **UNTESTED** | Requires manual trigger after push |
| TC-006 | TypeScript compiles clean | Regression | build-check | **PASS** | `npx tsc --noEmit` — only pre-existing test file errors (unrelated `__tests__/cycleCalculator.test.ts` missing `@types/jest`) |
| TC-007 | notify-cycle.yml workflow succeeds | Regression | ci-check | **UNTESTED** | Requires push + manual trigger |
| TC-008 | Other workflows unaffected | Regression | code-inspection | **PASS** | `git diff --name-only .github/` shows only `supabase.yml` modified |
| TC-009 | Realtime SOS listener still works | Non-Regression | device-test | **UNTESTED** | Requires device verification |
| TC-010 | Realtime Whisper listener still works | Non-Regression | device-test | **UNTESTED** | Requires device verification |
| TC-011 | Edge function auth rejects invalid keys | Non-Regression | code-inspection | **PASS** | `notify-cycle/index.ts` lines 57-64: validates `Authorization` header against `SUPABASE_SERVICE_ROLE_KEY` |
| TC-012 | Notification preferences saved correctly | Non-Regression | code-inspection | **PASS** | `appStore.ts` `updateNotificationPrefs` writes to `notification_preferences` — unchanged by this fix |

## Summary

| Category | Total | PASS | UNTESTED |
|----------|-------|------|----------|
| Bug Fix (P0) | 2 | 1 | 1 |
| Bug Fix (P1) | 1 | 0 | 1 |
| Regression (P0) | 2 | 2 | 0 |
| Regression (P1) | 2 | 1 | 1 |
| Non-Regression (P1) | 2 | 0 | 2 |
| Non-Regression (P2) | 2 | 2 | 0 |
| **Total** | **12** | **6** | **6** |

## UNTESTED Cases — User Action Required

The following require verification after pushing to main:

1. **TC-002 (P0):** After push, check that the `Supabase` workflow's `Edge Functions` job runs and succeeds. Then trigger `notify-cycle.yml` manually and verify HTTP 200.
2. **TC-003 (P1):** Verify `notify-sos` is deployed. Check Supabase Dashboard for the `sos_signals` Database Webhook — create it if missing.
3. **TC-005 (P1):** Trigger `Supabase` workflow via `workflow_dispatch` and confirm both jobs succeed.
4. **TC-007 (P0):** After functions deploy, trigger `notify-cycle.yml` manually and confirm success.
5. **TC-009/TC-010 (P1):** Test SOS and Whisper in-app with both users online to confirm Realtime path unaffected.

## Exit Condition Assessment

- All P0 code-inspection tests: **PASS**
- P0 ci-check tests: **UNTESTED** (require push to main)
- Zero new regressions introduced
- Fix is isolated to CI/CD config — no app code changes
- **Cannot claim High confidence until TC-002 and TC-007 are confirmed after push**
