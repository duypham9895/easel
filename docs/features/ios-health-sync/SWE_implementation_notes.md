# SWE Implementation Notes: iOS Health Sync + Period Prediction Onboarding

**Date:** 2026-03-08
**Engineer:** SWE Agent

---

## Architecture Decisions

### 1. Multi-Step Wizard in Single Route

**Decision:** Implemented the onboarding flow as a state machine within a single route (`/health-sync`) rather than multiple routes.

**Rationale:**
- Avoids polluting the Expo Router file-based routing with 6 new screen files
- State is naturally shared between steps via the `useHealthSyncOnboarding` hook
- No deep-linking needed for onboarding steps (users should always start from step 1)
- Simpler back-navigation handling (no need to manage stack history)

**Trade-off:** Cannot use Expo Router's built-in transitions between steps. Compensated with React state transitions.

### 2. Custom Hook for Onboarding State (`useHealthSyncOnboarding`)

**Decision:** Created `hooks/useHealthSyncOnboarding.ts` as an orchestrator hook that manages the entire onboarding flow state.

**What it does:**
- Tracks current step (`education` → `syncing` → `import-summary` → `manual-input` → `review` → `permission-denied`)
- Computes average cycle length and period length from HealthKit records
- Computes prediction confidence based on data source and quantity
- Provides all action handlers for step transitions
- Computes predicted date using the same formula as `cycleCalculator.ts`

**Why a hook (not store):** Onboarding state is ephemeral — it doesn't need to persist in Zustand or AsyncStorage. Once the user confirms, only the final `cycleSettings` are persisted via the existing `appStore.updateCycleSettings()`.

### 3. Confidence Scoring

**Implementation:**
| Data Source | Periods Found | Confidence |
|-------------|--------------|------------|
| HealthKit | 6+ | High |
| HealthKit | 2-5 | Medium |
| HealthKit | 1 | Low |
| Manual input | 0 | Low |

**Rationale:** 6+ cycles provides a statistically meaningful average (6+ data points). 2-5 gives directional accuracy. Manual/single-cycle is essentially a guess. This aligns with the PRD's notification timing scaling (high=2d, medium=4d, low=7d).

### 4. Average Cycle Length Computation

**Algorithm:**
```
1. Sort period records chronologically
2. Compute gaps between consecutive startDates
3. Filter to valid range (21-45 days)
4. Average the valid gaps
5. Default to 28 if no valid gaps
```

**Key filtering:** Gaps outside 21-45 days are excluded as they likely indicate missed tracking periods (e.g., a 60-day gap means the user forgot to log one period, not that their cycle is 60 days).

### 5. Component Decomposition

| Component | File | Purpose |
|-----------|------|---------|
| `HealthSyncEducation` | `components/moon/HealthSyncEducation.tsx` | Pre-permission education with bullet points |
| `HealthSyncLoading` | `components/moon/HealthSyncLoading.tsx` | Sync loading state |
| `HealthImportSummary` | `components/moon/HealthImportSummary.tsx` | Shows synced data stats |
| `ManualCycleInput` | `components/moon/ManualCycleInput.tsx` | Date picker + stepper inputs |
| `CycleDataReview` | `components/moon/CycleDataReview.tsx` | Final review with prediction |
| `PermissionDeniedScreen` | `components/moon/PermissionDeniedScreen.tsx` | Friendly denial message |

All components are in `components/moon/` following the existing convention.

### 6. Preserved Existing Code

- `useHealthSync.ts` — unchanged. The new `useHealthSyncOnboarding` wraps it.
- `HealthSyncPrompt.tsx` — kept for backward compatibility but no longer used in the main onboarding flow. Can be removed in a future cleanup.
- `appStore.ts` — unchanged. The hook calls existing `updateCycleSettings()`.
- `cycleCalculator.ts` — unchanged. Prediction logic reused.
- `lib/db/cycle.ts` — unchanged. Data layer untouched.

### 7. Date Validation

**Manual input constraints:**
- Cannot select future dates (`maximumDate={new Date()}`)
- Cannot select dates > 90 days ago (`minimumDate` set to 90 days back)
- Default: 2 weeks ago (statistically common "recent" period start)

### 8. i18n

**Expanded `health.json`** namespace with nested keys:
- `education.*` — pre-permission screen
- `syncing.*` — loading state
- `importSummary.*` — import results
- `emptyState.*` — no data found
- `manualInput.*` — manual form
- `review.*` — data review
- `permissionDenied.*` — denial screen
- `settings.*` — settings integration
- `tooltips.*` — help text

Both EN and VI translations provided.

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `app/health-sync.tsx` | Modified | Replaced simple wrapper with multi-step wizard |
| `hooks/useHealthSyncOnboarding.ts` | Created | Orchestrator hook for onboarding flow |
| `components/moon/HealthSyncEducation.tsx` | Created | Education screen |
| `components/moon/HealthSyncLoading.tsx` | Created | Loading state |
| `components/moon/HealthImportSummary.tsx` | Created | Import summary |
| `components/moon/ManualCycleInput.tsx` | Created | Manual input form |
| `components/moon/CycleDataReview.tsx` | Created | Review & prediction |
| `components/moon/PermissionDeniedScreen.tsx` | Created | Permission denied |
| `i18n/en/health.json` | Modified | Added all new copy keys |
| `i18n/vi/health.json` | Modified | Added all new Vietnamese copy |
| `__tests__/cycleCalculator.test.ts` | Created | Unit tests for prediction logic |

---

## What Was NOT Changed

- **Android flow** — untouched. Android Health Connect sync still works via the existing `useHealthSync` hook.
- **Sun user flow** — untouched. Sun still goes directly to dashboard after role selection.
- **Store (`appStore.ts`)** — no state shape changes. `cycleSettings` interface unchanged.
- **Database schema** — no migrations needed. Uses existing `cycle_settings` table.
- **Proxy endpoints** — no changes. Uses existing `/api/predict-cycle`.
- **Notifications** — no changes. `notifyDaysBefore` set via existing flow.

---

## Clarifications

- `[CLARIFICATION NEEDED]` — The PRD mentions a "Settings screen to re-trigger HealthKit sync." The existing Settings screen already has a health sync button (line 335-356 in `settings.tsx`). This was left as-is since it already covers the requirement. The copy was updated in i18n to match the new design language.

---

## Test Coverage

- Unit tests for `cycleCalculator.ts` — all 5 functions tested
- Tests cover: day-in-cycle calculation, phase determination, days-until-period, conception chance, calendar markers
- Edge cases: future dates, cycle wrap-around, short cycles, date boundary conditions
