# Period Calendar — PRD v1

**Feature:** Period Calendar with Prediction, Manual Override, and Partner View
**Date:** 2026-03-12
**Status:** Draft

---

## 1. Problem Statement

Moon needs a single, intuitive surface to log periods, view predictions, and annotate cycle irregularities — today she must navigate between dashboard and settings. Sun has no calendar visibility into Moon's cycle, forcing him to rely on text-based phase indicators that lack temporal context. Without manual override inputs (stress, illness, travel), the prediction algorithm treats all cycles equally, degrading accuracy for irregular months.

## 2. User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| US-1 | Moon | tap any calendar day to log or edit my period start/end | I can retroactively correct entries without leaving the calendar |
| US-2 | Moon | see predicted period days with a confidence window (e.g., "March 15–18") | I understand prediction uncertainty and plan accordingly |
| US-3 | Moon | mark a cycle as affected by stress, illness, or travel | the algorithm reduces this cycle's weight in future predictions |
| US-4 | Moon | view my last 12 months of logged periods on the calendar | I can spot patterns and share history with my doctor |
| US-5 | Sun | see a read-only version of Moon's calendar with phase colors | I understand her cycle timeline without asking |
| US-6 | Sun | see when Moon's next predicted period is and the confidence level | I can prepare and be supportive proactively |
| US-7 | Moon | receive a local notification "Period may start in N days" | I'm not caught off-guard even if I haven't opened the app |
| US-8 | Moon | end my period early or extend it from the calendar | my period length data stays accurate for future predictions |

## 3. Functional Requirements

1. **FR-1:** Calendar day press opens a log/edit sheet for Moon; shows read-only detail for Sun.
2. **FR-2:** Period logging from calendar upserts `period_logs` and triggers `recomputeCycleFromLogs`.
3. **FR-3:** Predicted period days display as a date range (window) based on cycle variability, not a single date.
4. **FR-4:** Manual override tags (stress, illness, travel, medication, other) are stored per period log and reduce that cycle's weight in prediction calculations.
5. **FR-5:** Sun's calendar tab shows Moon's logged + predicted data in read-only mode when linked.
6. **FR-6:** Confidence score (0–100) computed from cycle count, variability, and override frequency; displayed as "high/medium/low" label.
7. **FR-7:** Local push notification scheduled when predicted period is N days away (configurable, default 3).
8. **FR-8:** Period end date can be set by tapping the last day of the period on the calendar.
9. **FR-9:** Grace period: "late" label only shown after prediction window + 2 days.
10. **FR-10:** All new UI strings added to both `en/` and `vi/` i18n namespaces.

## 4. Prediction Algorithm Spec

### Inputs
- Last 7 period log start dates (existing `computeCycleStats`)
- Override tags per log (new)
- Average period length from end_date data

### Logic
1. **Cycle gaps:** Calculate days between consecutive period starts (existing).
2. **Override weighting:** Cycles tagged with overrides get weight 0.5 instead of normal weight (2 for recent, 1 for older).
3. **Weighted average:** `Σ(gap × weight) / Σ(weight)` → predicted cycle length.
4. **Prediction window:** `predicted_date ± ceil(variability)` days, minimum ±1 day.
5. **Confidence score:**
   - Base: 50
   - +15 if ≥6 cycles logged
   - +10 if ≥3 cycles logged
   - +15 if variability < 3 days
   - +10 if variability < 5 days
   - -10 per override in last 3 cycles
   - Clamped to [10, 100]
6. **Confidence label:** high ≥ 70, medium ≥ 40, low < 40.

### Confidence Display
- Calendar: prediction days shown with opacity proportional to confidence (existing `CalendarTokens.predictedPeriodOpacity` as baseline, scaled by confidence).
- MyCycleCard: "Period expected March 15–18 (High confidence)" or "Period expected ~March 15 (Low confidence)".

## 5. Manual Override Spec

### Trigger Conditions
- Moon taps a logged period day → day detail sheet shows "Mark this cycle" section.
- Override options: `stress`, `illness`, `travel`, `medication`, `other` (multi-select).
- Optional free-text note (max 200 chars).

### UX Flow
1. Moon opens calendar → taps a logged period start day.
2. Day detail sheet shows period info + "Factors affecting this cycle" section.
3. Moon selects one or more override tags → taps Save.
4. Tags stored in `period_logs.notes` as structured JSON prefix: `[tags:stress,illness] Free text note`.
5. Calendar day dot gets a small indicator (⚡) for overridden cycles.
6. Next prediction recalculation uses reduced weight for this cycle.

### Data Model Impact
- **No new table.** Override tags stored in existing `period_logs.notes` column as structured prefix.
- Format: `[tags:stress,travel] User's optional note` or `null` if no overrides.
- Parse function extracts tags and free text from notes field.

## 6. Out of Scope

- Temperature/BBT tracking (Natural Cycles approach)
- Flow intensity logging (Flo/Clue feature — future release)
- ML/neural network predictions (Flo approach — future release)
- PCOS/condition detection
- Symptom-based prediction improvement
- Calendar widget for home screen
- Export cycle data to PDF/CSV

## 7. Success Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Calendar tab daily active usage | +30% vs current | Analytics: screen view count |
| Period logs with override tags | ≥15% of all logs within 30 days | DB query on notes field |
| Sun calendar tab engagement | ≥3 views/week per active Sun user | Analytics |
| Prediction accuracy (MAE) | ≤3 days within 3 months of use | Computed: predicted vs actual |
| Notification-to-open rate | ≥40% | Push notification analytics |
