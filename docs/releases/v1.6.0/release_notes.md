# Release Notes — iOS Health Sync + Period Prediction Onboarding

**Version:** v1.6.0
**Feature:** iOS Health Sync + Period Prediction Onboarding
**Platform:** iOS (Android unchanged)

---

## 1. User-Facing Release Notes (App Store)

**Better predictions from day one.** Easel v1.6.0 introduces a redesigned onboarding experience for cycle tracking. When you first set up your profile, Easel now walks you through a clear, step-by-step guide to importing your existing cycle data from Apple Health — or entering it manually if you prefer. Either way, you get accurate period predictions right from the start, with a confidence indicator so you always know how reliable your forecast is.

**Your data stays yours.** Before requesting any health permissions, Easel explains exactly what data it reads and why. If you choose not to share Apple Health data, no problem — a friendly manual input screen lets you enter your last period date and typical cycle length in seconds. Nothing is shared without your explicit consent, and you can change your mind at any time in Settings.

**A smoother start for couples.** Whether you import six months of history or type in a single date, Easel calculates your upcoming phases and shows a clear summary before you continue. Your partner (Sun) benefits too — phase-aware guidance and whisper signals are powered by the same predictions, so both of you are in sync from the very first day.

---

## 2. Internal Release Notes (Team / Stakeholders)

### Feature Scope

- **6 new UI components** under `components/moon/`: HealthSyncEducation, HealthSyncLoading, HealthImportSummary, ManualCycleInput, CycleDataReview, PermissionDeniedScreen.
- **1 orchestrator hook** (`useHealthSyncOnboarding`): manages a step-based state machine, drives the multi-step wizard, computes average cycle length from imported data, and assigns a prediction confidence score (low / medium / high) based on data quantity and consistency.
- **Expanded i18n**: 60+ new translation keys added to both `en/health.json` and `vi/health.json`. All user-facing strings are fully localized in English and Vietnamese.

### What Changed

| Area | Detail |
|------|--------|
| `app/health-sync.tsx` | Rewritten from a simple single-screen wrapper into a multi-step wizard that delegates to the new components via `useHealthSyncOnboarding`. |
| `i18n/en/health.json` | 60+ new keys covering education, loading, import summary, manual input, review, and permission-denied screens. |
| `i18n/vi/health.json` | Matching Vietnamese translations for all new keys. |

### What Did Not Change

- **No database schema changes.** No new migration required.
- **No proxy changes.** All existing AI endpoints are unaffected.
- **No new dependencies.** All components use existing libraries (react-native-health, react-native-calendars, etc.).
- **`HealthSyncPrompt.tsx`** (in `components/moon/`) is retained in the codebase but is no longer used during the onboarding flow. It may still be referenced from the Settings screen.
- **Android is unchanged.** The new onboarding wizard is iOS-only; Android health sync remains as-is.

### Test Plan

- **65 test cases** documented in the QA test plan covering HealthKit permission grant/deny, manual input validation, import edge cases (empty data, single cycle, 12+ cycles), confidence scoring thresholds, and localization spot checks.
- **Unit tests** added for `cycleCalculator.ts` prediction logic (`__tests__/cycleCalculator.test.ts`).

---

## 3. Developer Changelog (Engineering)

### Files Created

| File | Purpose |
|------|---------|
| `hooks/useHealthSyncOnboarding.ts` | Orchestrator hook: step state machine, confidence scoring, average cycle length computation from imported HealthKit records. |
| `components/moon/HealthSyncEducation.tsx` | Pre-permission education screen explaining what data Easel reads and why, with a prominent "Continue" CTA and a "Skip" option. |
| `components/moon/HealthSyncLoading.tsx` | Animated loading state displayed while HealthKit data is being fetched and processed. |
| `components/moon/HealthImportSummary.tsx` | Post-import summary showing number of cycles found, date range, average cycle length, and average period length. |
| `components/moon/ManualCycleInput.tsx` | Fallback form with a date picker for last period start and a stepper for typical cycle length (21-45 days). |
| `components/moon/CycleDataReview.tsx` | Review screen showing predicted next period, current phase, and a confidence badge (low/medium/high) before finalizing. |
| `components/moon/PermissionDeniedScreen.tsx` | Friendly screen shown when the user denies HealthKit access, redirecting to manual input. |
| `__tests__/cycleCalculator.test.ts` | Unit tests for cycle prediction functions: average computation, phase determination, edge cases. |

### Files Modified

| File | Change |
|------|--------|
| `app/health-sync.tsx` | Replaced single-screen HealthKit prompt with multi-step wizard driven by `useHealthSyncOnboarding`. |
| `i18n/en/health.json` | Added 60+ new translation keys for all onboarding wizard screens. |
| `i18n/vi/health.json` | Added 60+ corresponding Vietnamese translations. |

### Files Verified Unchanged

- `store/appStore.ts` — No state shape changes.
- `hooks/useHealthSync.ts` — Existing hook untouched; new hook is separate.
- `utils/cycleCalculator.ts` — Pure functions unchanged; new tests validate existing behavior.
- `lib/db/cycle.ts` — Data access layer unchanged.
- `constants/cycle.ts` — No new constants needed.
- `types/index.ts` — No type additions.
- All proxy endpoints (`proxy/api/*`) — No changes.
- All Supabase migrations (`supabase/migrations/*`) — No new migration.

### Breaking Changes

None.

### New Dependencies

None.
