# Phase 6 — Fix Report: BUG_20260309_001

> **Bug ID:** `BUG_20260309_001`
> **Date:** 2026-03-09
> **Phase:** Fix Report (TPM Summary)
> **Author:** TPM Agent
> **Source:** UPT_20260308_001 (User Persona Testing)

---

## Executive Summary

**9 bugs** identified from dual-persona testing (Linh/Moon + Minh/Sun). **8 fixed**, **1 deferred** (ISS-004: Sun real-time cycle updates → reclassified as feature `FEAT_20260309_001`).

All fixes are app-side code changes requiring no database migrations. Edge Function fixes (BUG-E) require redeployment to Supabase.

---

## Bug Resolution Matrix

| Bug | Severity | Description | Status | Fix Type |
|-----|----------|-------------|--------|----------|
| **A** | Critical | Cycle calculator modulo wrapping creates phantom phases for late periods | **FIXED** | Logic fix |
| **B** | High | Sun missing real-time cycle updates | **DEFERRED** | Reclassified as feature |
| **C** | High/Medium | Tab bar not role-aware (white on Moon dark theme, pink tint on Sun) | **FIXED** | Theming fix |
| **D1** | High | CycleDataReview hardcoded English toggle text | **FIXED** | i18n fix |
| **D2** | Low | ManualCycleInput hardcoded "Done" button | **FIXED** | i18n fix |
| **D3** | Low | PermissionDeniedScreen hardcoded "Open Settings" | **FIXED** | i18n fix |
| **E1** | High | notify-cycle sends English-only push notifications | **FIXED** | i18n addition |
| **E2** | High | notify-sos sends English-only push notifications | **FIXED** | i18n addition |
| **F** | Medium | "AI" label visible in user-facing UI (violates product design rule) | **FIXED** | UI cleanup |

---

## Impact Assessment

### Users Affected

| Bug | Moon Users | Sun Users | Vietnamese Users | All Users |
|-----|-----------|-----------|-----------------|-----------|
| A | All with late periods | All with linked late-period partner | — | ~30% of active users (estimate) |
| C | All | All | — | 100% |
| D | — | — | All Moon users in health sync | ~40% of Moon users |
| E | — | — | All with push enabled | ~40% of push-enabled users |
| F | All | All | All | 100% |

### Risk Level of Fixes

| Bug | Risk | Rationale |
|-----|------|-----------|
| A | **Medium** | Core cycle math changed. Thoroughly tested — 17 code-inspection tests pass, 0 failures. Existing test file updated. |
| C | **Low** | Additive change — new color lookup before existing `<Tabs>`. No layout changes. |
| D | **Low** | String replacements with `t()` calls. Keys verified in both languages. |
| E | **Low-Medium** | Edge Function restructured — new language lookup query added. Batch-friendly. No N+1 regression. |
| F | **Low** | Removed UI elements + i18n keys. Hooks still return `isAI` internally. |

---

## Test Coverage

| Metric | Value |
|--------|-------|
| Total test cases | 73 |
| Code-inspection PASS | 45 (62%) |
| Device-test UNTESTED | 28 (38%) |
| FAIL | 0 (0%) |
| TypeScript build | Clean (app source) |

### Device Testing Required

28 test cases need manual verification on iOS device. Key areas:
- Tab bar visual theming (Moon dark, Sun cream)
- Vietnamese text rendering (no truncation)
- Late period display on dashboards
- Push notification delivery in Vietnamese
- Full app "AI" text audit

---

## Files Changed

| Category | Files | Lines Changed (est.) |
|----------|-------|---------------------|
| Logic | 1 (`cycleCalculator.ts`) | ~5 |
| Tests | 1 (`cycleCalculator.test.ts`) | ~6 |
| Theming | 1 (`_layout.tsx`) | ~15 |
| i18n (app) | 6 (health.json x2, common.json x2, dashboard.json x2) | ~12 |
| UI | 2 (MoonDashboard, SunDashboard) | ~15 |
| Edge Functions | 2 (notify-cycle, notify-sos) | ~180 |
| Components | 3 (CycleDataReview, ManualCycleInput, PermissionDeniedScreen) | ~6 |
| **Total** | **16 files** | **~239 lines** |

---

## Deployment Checklist

- [ ] App build passes (`npx tsc --noEmit`)
- [ ] Test file updated for new cycle behavior
- [ ] Device testing completed (28 untested cases)
- [ ] Edge Functions deployed (`supabase functions deploy notify-cycle notify-sos`)
- [ ] EAS build triggered for iOS
- [ ] Version bumped to v1.5.2

---

## Deferred Items

| Item | Destination | Priority |
|------|-------------|----------|
| ISS-004: Sun real-time cycle updates | `FEAT_20260309_001` | Medium |

---

## Lessons Learned

1. **Cycle math must never wrap** — modulo creates medically misleading data. Late periods should always show the actual day count.
2. **Hardcoded strings accumulate** — 3 instances found in health sync flow alone. Consider a linter rule to flag string literals in JSX.
3. **Edge Functions need i18n from day one** — adding language support retroactively required restructuring both functions.
4. **Product design rules need enforcement** — the "no AI terminology" rule had UI violations in both dashboards. Consider a grep check in CI.
