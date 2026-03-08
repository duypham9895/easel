# BUG_20260308_002 — Test Cases

**Bug ID:** BUG_20260308_002
**Phase:** 3 — Test Case Writing
**Date:** 2026-03-08

---

## A. Bug Verification Test Cases

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|---------------------|--------------|-------|-----------------|----------|
| TC-001 | deploy-functions job runs on docs-only push | CI/CD | Bug Fix | `code-inspection` | Fix applied to `supabase.yml` | 1. Read the `deploy-functions` job in `supabase.yml` 2. Verify the `if` condition is removed | No `if` condition on the `deploy-functions` job — it runs unconditionally on every push to main | P0 |
| TC-002 | notify-cycle returns 200 after deployment | Edge Functions | Bug Fix | `ci-check` | Functions deployed to Supabase | 1. Trigger `Supabase` workflow via `workflow_dispatch` 2. Verify `Edge Functions` job runs and succeeds 3. Trigger `notify-cycle.yml` via `workflow_dispatch` 4. Check HTTP status | HTTP 200 (not 404) | P0 |
| TC-003 | notify-sos returns 200 after deployment | Edge Functions | Bug Fix | `device-test` | Functions deployed to Supabase, webhook configured | 1. Send SOS from Moon 2. Check if Sun receives push (app backgrounded) | Sun receives SOS push notification | P1 |

## B. Regression Test Cases

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|---------------------|--------------|-------|-----------------|----------|
| TC-004 | migrate job still runs on every push | CI/CD | Regression | `code-inspection` | Fix applied | 1. Read `supabase.yml` 2. Verify `migrate` job has no conditional | `migrate` job runs unconditionally (same as before) | P0 |
| TC-005 | deploy-functions job still works with workflow_dispatch | CI/CD | Regression | `ci-check` | Fix applied | 1. Trigger `Supabase` workflow manually 2. Check both jobs run | Both `migrate` and `deploy-functions` jobs succeed | P1 |
| TC-006 | TypeScript compiles clean | Build | Regression | `build-check` | N/A | Run `npx tsc --noEmit` | No type errors | P0 |
| TC-007 | notify-cycle.yml workflow succeeds | CI/CD | Regression | `ci-check` | Functions deployed | 1. Trigger `notify-cycle.yml` manually 2. Check result | Workflow succeeds with HTTP 200 | P0 |
| TC-008 | Other workflows unaffected | CI/CD | Regression | `code-inspection` | Fix applied | 1. Verify `proxy.yml` unchanged 2. Verify `pages.yml` unchanged 3. Verify `notify-cycle.yml` unchanged | Only `supabase.yml` modified | P1 |

## C. Non-Regression Confirmation Cases

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|---------------------|--------------|-------|-----------------|----------|
| TC-009 | Realtime SOS listener still works (foreground) | Notifications | Non-Regression | `device-test` | Both users online | 1. Moon sends SOS 2. Sun has app open | Sun sees SOS alert in-app via Realtime | P1 |
| TC-010 | Realtime Whisper listener still works | Notifications | Non-Regression | `device-test` | Both users online | 1. Moon sends Whisper 2. Sun has app open | Sun sees Whisper alert in-app | P1 |
| TC-011 | Edge function auth rejects invalid keys | Security | Non-Regression | `code-inspection` | Functions deployed | 1. Read `notify-cycle/index.ts` auth check 2. Verify it returns 401 for missing/invalid auth | Auth validation logic present and correct | P2 |
| TC-012 | Notification preferences saved correctly | Settings | Non-Regression | `code-inspection` | N/A | 1. Read `appStore.ts` `updateNotificationPrefs` 2. Verify it writes to `notification_preferences` table | Preferences stored in DB (unchanged by this fix) | P2 |
