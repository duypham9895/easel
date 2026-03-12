# Period Calendar — PRD v2

**Feature:** Period Calendar with Prediction, Manual Override, and Partner View
**Date:** 2026-03-12
**Status:** Reviewed (post-debate)

---

## Debate Transcript

### Head of Product (HP)

**Challenge 1:** Storing override tags in the `notes` column as a structured prefix is fragile. If users type `[tags:...]` manually, parsing breaks. This is a data integrity risk that will haunt us in analytics.

**Challenge 2:** Sun seeing Moon's full calendar raises privacy concerns. Some users may not want their partner to see their complete period history — only current/upcoming cycle info. We need a consent toggle.

**Challenge 3:** The "±ceil(variability)" prediction window can become absurdly wide (e.g., ±8 days) for irregular users, making the feature feel useless. We need a cap.

**Proposal:** Cap prediction window at ±4 days. Add a one-time consent prompt when Moon links with Sun: "Share your cycle calendar with your partner?" Default yes, toggleable in settings.

### Principal Engineer (PE)

**Challenge 1:** Parsing structured tags from a text column is an anti-pattern. It's not queryable, not indexable, and breaks if the notes format changes. We should add a `tags` JSONB column to `period_logs` instead — it's a single ALTER TABLE, no new migration complexity.

**Challenge 2:** The confidence score formula has magic numbers with no empirical basis. The `-10 per override` penalty is arbitrary and could tank confidence even when overrides are legitimate (e.g., one travel cycle shouldn't drop confidence by 10 points). We should use a simpler approach: confidence = f(cycle_count, variability) only, and override weight reduction handles the accuracy side.

**Challenge 3:** Scheduling local notifications "N days before predicted period" requires computing the predicted date at notification-schedule time. If the user logs a new period that shifts the prediction, the scheduled notification becomes stale. We need a daily re-scheduling mechanism.

**Proposal:** Add `tags TEXT[]` column to `period_logs` (Postgres array, not JSONB — simpler for our use case). Simplify confidence to cycle_count + variability only. Use `expo-notifications` daily trigger to re-evaluate and reschedule.

### Lead QA (QA)

**Challenge 1:** Testing prediction accuracy requires historical data spanning 3–12 months. We need a test fixture generator that creates realistic period log sequences with known patterns, irregularities, and overrides.

**Challenge 2:** The partner view relies on `subscribeToPeriodLogs` Realtime channel, which only fires on INSERT. If Moon edits an existing log (add end_date, add tags), Sun's view won't update. We need UPDATE events too.

**Challenge 3:** Edge case: Moon deletes a period log that was the basis for the current prediction. The recalculation might produce a past prediction date, causing the calendar to show "predicted period" in the past. We need a guard: predicted dates must be ≥ today.

**Proposal:** Add UPDATE to the Realtime subscription filter. Create a `generateTestPeriodLogs(months, avgCycle, variability, overrideRate)` test utility. Add guard in `buildCalendarMarkers` to skip predicted dates before today.

---

### PM Response

All three sets of feedback are valid. Incorporating:

---

## 1. Problem Statement

*(unchanged from v1)*

Moon needs a single, intuitive surface to log periods, view predictions, and annotate cycle irregularities — today she must navigate between dashboard and settings. Sun has no calendar visibility into Moon's cycle, forcing him to rely on text-based phase indicators that lack temporal context. Without manual override inputs (stress, illness, travel), the prediction algorithm treats all cycles equally, degrading accuracy for irregular months.

## 2. User Stories

*(unchanged from v1)*

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

## 3. Functional Requirements [UPDATED]

1. **FR-1:** Calendar day press opens a log/edit sheet for Moon; shows read-only detail for Sun.
2. **FR-2:** Period logging from calendar upserts `period_logs` and triggers `recomputeCycleFromLogs`.
3. **FR-3:** Predicted period days display as a date range (window) based on cycle variability, capped at ±4 days. [UPDATED]
4. **FR-4:** Manual override tags stored in a new `tags TEXT[]` column on `period_logs`; reduce tagged cycle's weight to 0.5× in predictions. [UPDATED]
5. **FR-5:** Sun's calendar shows Moon's data in read-only mode. Moon controls sharing via a consent toggle (default: enabled). [UPDATED]
6. **FR-6:** Confidence score computed from cycle count and variability only (not override frequency). Displayed as high/medium/low. [UPDATED]
7. **FR-7:** Local notification re-evaluated and rescheduled daily via `expo-notifications` daily trigger. [UPDATED]
8. **FR-8:** Period end date can be set by tapping the last day of the period on the calendar.
9. **FR-9:** Grace period: "late" label only shown after prediction window end + 2 days.
10. **FR-10:** All new UI strings added to both `en/` and `vi/` i18n namespaces.
11. **FR-11:** Realtime subscription for Sun includes both INSERT and UPDATE events on `period_logs`. [NEW]
12. **FR-12:** Predicted period markers must be ≥ today; past predictions are not rendered. [NEW]

## 4. Prediction Algorithm Spec [UPDATED]

### Inputs
- Last 7 period log start dates (existing `computeCycleStats`)
- Override tags per log (new `tags` column)
- Average period length from end_date data

### Logic
1. **Cycle gaps:** Calculate days between consecutive period starts (existing).
2. **Override weighting:** Cycles with non-empty tags get weight 0.5× instead of normal weight (2× for recent, 1× for older). [UPDATED]
3. **Weighted average:** `Σ(gap × weight) / Σ(weight)` → predicted cycle length.
4. **Prediction window:** `predicted_date ± min(ceil(variability), 4)` days, minimum ±1 day. [UPDATED — capped at ±4]
5. **Confidence score:** [UPDATED — simplified]
   - Base: 40
   - +20 if ≥6 cycles logged
   - +15 if ≥3 cycles logged
   - +25 if variability < 3 days
   - +15 if variability < 5 days
   - Clamped to [10, 100]
6. **Confidence label:** high ≥ 70, medium ≥ 40, low < 40.

### Confidence Display
- Calendar: predicted days at `CalendarTokens.predictedPeriodOpacity` (unchanged — opacity already communicates uncertainty).
- MyCycleCard: "Period expected March 15–18 · High confidence" or "Period expected ~March 15 · Low confidence".

## 5. Manual Override Spec [UPDATED]

### Data Model
- **New column:** `ALTER TABLE period_logs ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[];` [UPDATED — dedicated column instead of notes prefix]
- Valid tags: `stress`, `illness`, `travel`, `medication`, `other`
- `notes` column remains for free-text only (no structured prefix). [UPDATED]

### UX Flow
1. Moon opens calendar → taps a logged period start day.
2. Day detail sheet shows period info + "Factors affecting this cycle" section.
3. Moon selects one or more override tags (pill-style toggles) → optional note → taps Save.
4. Tags saved to `period_logs.tags`, note saved to `period_logs.notes`.
5. Calendar day dot gets a small indicator icon for overridden cycles.
6. Next `recomputeCycleFromLogs` uses reduced weight (0.5×) for tagged cycles.

### Partner Privacy [NEW]
- On first link, Moon sees a one-time prompt: "Share your cycle calendar with [partner name]?"
- Default: enabled. Toggleable in Settings > Privacy.
- When disabled, Sun's calendar tab shows "Moon has chosen to keep her calendar private" with phase-only info (no dates).

## 6. Out of Scope

*(unchanged from v1)*

- Temperature/BBT tracking
- Flow intensity logging
- ML/neural network predictions
- PCOS/condition detection
- Symptom-based prediction improvement
- Calendar widget for home screen
- Export cycle data to PDF/CSV

## 7. Success Metrics

*(unchanged from v1)*

| KPI | Target | Measurement |
|-----|--------|-------------|
| Calendar tab daily active usage | +30% vs current | Analytics: screen view count |
| Period logs with override tags | ≥15% of all logs within 30 days | DB query on tags column |
| Sun calendar tab engagement | ≥3 views/week per active Sun user | Analytics |
| Prediction accuracy (MAE) | ≤3 days within 3 months of use | Computed: predicted vs actual |
| Notification-to-open rate | ≥40% | Push notification analytics |
