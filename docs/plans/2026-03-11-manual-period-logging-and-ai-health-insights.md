# Feature Plan: Manual Period Logging + Cycle Recalculation + AI Health Insights

**ID:** FEAT_20260311_001
**Status:** Planning
**Date:** 2026-03-11
**Priority:** High

---

## 1. Problem Statement

Moon's body doesn't always follow the predicted cycle. Stress, travel, diet changes, sleep disruption, and medical conditions like PCOS or thyroid disorders can delay or shift her period. Currently, Easel predicts the next period but provides no way for Moon to say "my period actually started today" and have the system adjust. When her period deviates from predictions, the app's calendar, phase calculations, and Sun's guidance all become inaccurate.

### What We Need

1. **Manual period logging on the calendar** — Moon taps a date to say "my period started here"
2. **Automatic cycle recalculation** — predictions update immediately based on actual data
3. **AI health conversation** — when a period arrives early/late, AI asks what's going on and provides personalized health suggestions

---

## 2. Research Summary

### 2.1 Why Periods Get Delayed (Medical Research)

| Category | Details |
|----------|---------|
| **Stress** (#1 lifestyle cause) | Cortisol suppresses GnRH → blocks ovulation → delays period. Emotional, physical, and environmental stress all qualify. |
| **PCOS** (10-13% of women) | Excess androgens prevent regular ovulation. 72% of PCOS patients have cycle disorders. 70% are undiagnosed. |
| **Thyroid disorders** | Hypothyroidism → heavy/frequent periods. Hyperthyroidism → infrequent/absent periods. Simple TSH test screens for this. |
| **Weight changes** | Both underweight and overweight disrupt estrogen/progesterone balance. |
| **Excessive exercise** | Lowers body fat below threshold for reproductive hormone production ("Female Athlete Triad"). |
| **Travel / jet lag** | Circadian disruption → melatonin shifts → reproductive hormone changes. |
| **Sleep disruption** | Even 1 week of irregular sleep measurably affects hormone levels. |
| **Diet changes** | Extreme dieting, insufficient healthy fats, high sugar all affect hormone synthesis. |
| **Hormonal contraception** | Starting/stopping can take up to 6 months to normalize. |
| **Perimenopause** (40s+) | Natural transition; 5% of women experience it at 40-45. |

**Normal variation:** Cycles 24-38 days are normal. Only ~13% of cycles are exactly 28 days. Cycle-to-cycle variation of up to 7-9 days is within normal range.

**Red flags (suggest seeing a doctor):** Period absent 90+ days, cycles consistently <24 or >38 days, period >7 days, extremely heavy flow, severe pain.

### 2.2 How Apps Like Flo Handle This (Competitive Research)

| Aspect | Industry Pattern |
|--------|-----------------|
| **Period logging UX** | Prominent "Log Period" button on main screen + calendar tap to retroactively log. Single-tap to start, auto-end based on average. |
| **Prediction algorithm** | Weighted rolling average of last 3-6 cycles. Default to 28 days until enough data. Flo's neural network achieves 2.6-day MAE; simple weighted average is sufficient for non-clinical use. |
| **Recalculation** | Instant: when a new period is logged, ALL future predictions (next period, phases, fertile window) recalculate immediately. |
| **Late period handling** | 2-3 day grace period before showing "period may be late." Never alarm — use gentle language. |
| **Irregular cycles** | After 3+ cycles with >7-day variance, surface gentle health suggestion. Wider prediction windows for variable cycles. |
| **Calendar visual** | Solid fills for actual/logged days, translucent/dashed for predictions. Clear predicted-vs-actual distinction. |
| **AI/educational** | Phase-aware educational content. No "AI" terminology in UI. Warm, human language. |

### 2.3 Current Easel Architecture (Codebase Analysis)

**What already exists:**
- `cycleCalculator.ts` — Pure math engine with weighted averages (recent periods 2x weight), confidence levels (high/medium/low), variability tracking
- `appStore.ts` — `addPeriodLog()` triggers `recomputeCycleFromLogs()` automatically
- `lib/db/cycle.ts` — CRUD for `cycle_settings` + `period_logs` tables with RLS
- `PeriodHistoryInput.tsx` — Allows up to 24 historical period entries (used during onboarding)
- `buildCalendarMarkers()` — Generates calendar data with historical + predicted dates
- Phase calculation uses `ovulationDay = max(avgPeriodLength + 1, avgCycleLength - 14)`
- 1,567+ tests across 5 test suites

**What's missing:**
1. No way to log a period from the calendar/dashboard post-onboarding
2. No "period started" quick-action on Moon's dashboard
3. No visual distinction between predicted vs actual periods on calendar
4. No AI endpoint for health conversation when period deviates
5. No deviation detection (early/late awareness)
6. No proxy endpoint for cycle health insights

---

## 3. Feature Design

### 3.1 Manual Period Logging (Calendar + Dashboard)

**Entry Points (2):**

1. **Moon Dashboard — "Period Started" button**
   - Prominent button visible when Moon is in predicted "period approaching" or "period due" zone
   - Single tap → confirms "My period started today"
   - Also shows during predicted period window + 7 days after
   - Button changes to "Period Ended" once a period is active

2. **Calendar — Tap-to-Log**
   - Moon taps any date on the calendar within the last 30 days
   - Bottom sheet appears: "Did your period start on [date]?"
   - Can also mark period end date
   - Can edit/delete previously logged periods

**Data Model Changes:**
- Existing `period_logs` table already supports this (`start_date`, `end_date`, `source`)
- Add `source` value: `'manual_calendar'` (alongside existing `'onboarding'`, `'health_kit'`)
- No schema migration needed — `period_logs` table structure is sufficient

**Validation Rules:**
- Cannot log future periods
- Cannot overlap with existing logged periods (±2 day dedup, matching HealthKit pattern)
- Cannot log more than 30 days in the past from calendar (use PeriodHistoryInput for older)
- Period length: 2-10 days (existing constraint)

### 3.2 Automatic Cycle Recalculation

**Flow:**

```
Moon logs period → addPeriodLog() → recomputeCycleFromLogs() → UI updates everywhere
        ↓                                    ↓
  detectDeviation()                   updateCalendarMarkers()
        ↓                                    ↓
  deviation found?              Sun's dashboard also updates
        ↓ yes                         (via Realtime)
  triggerHealthInsight()
```

**Recalculation Logic (already exists in `recomputeCycleFromLogs`):**
1. Sort all period_logs by start_date
2. Calculate gaps between consecutive periods → cycle lengths
3. Weighted average (recent 2x weight) → new `avgCycleLength`
4. Average period durations → new `avgPeriodLength`
5. Compute variability (stddev × 10)
6. Update confidence level (high=6+ gaps, medium=3+, low=<3)
7. Save to `cycle_settings` + update Zustand store

**What's new — Deviation Detection:**

```typescript
interface CycleDeviation {
  type: 'early' | 'late' | 'on_time';
  daysDifference: number;          // positive = late, negative = early
  predictedDate: string;           // ISO date
  actualDate: string;              // ISO date
  isSignificant: boolean;          // |daysDifference| > 3
  possibleReasons: string[];       // for AI context
}
```

- `'on_time'`: actual within ±2 days of predicted
- `'early'`: actual 3+ days before predicted
- `'late'`: actual 3+ days after predicted
- Deviation is `significant` when |daysDifference| > 3

### 3.3 AI Health Conversation

**Trigger:** When Moon logs a period that deviates significantly (±3+ days) from the prediction.

**UX Flow:**

1. Moon logs period → recalculation happens → deviation detected
2. Gentle bottom sheet appears: "Your period came [X days early/late]. Would you like to explore why?"
3. If Moon taps "Tell me more" → opens AI health insight screen
4. AI asks 2-3 contextual questions about recent lifestyle:
   - "Have you been more stressed than usual lately?"
   - "Any changes in sleep, diet, or exercise?"
   - "Have you been traveling or changed time zones?"
5. Based on answers, AI provides:
   - Personalized explanation of why period may have shifted
   - 2-3 actionable suggestions to support cycle regularity
   - Gentle nudge to see a doctor if pattern is concerning (3+ consecutive irregular cycles)

**Proxy Endpoint:**

```
POST /api/cycle-health-insight
```

**Request body:**
```json
{
  "deviation": {
    "type": "late",
    "daysDifference": 5,
    "cycleHistory": {
      "avgCycleLength": 29,
      "variability": 3,
      "confidence": "medium",
      "recentCycleLengths": [28, 31, 34]
    }
  },
  "userContext": {
    "recentStress": "high",
    "sleepChanges": true,
    "dietChanges": false,
    "exerciseChanges": false,
    "travelRecent": false
  },
  "language": "en"
}
```

**Response:**
```json
{
  "explanation": "Your period arrived 5 days later than expected...",
  "suggestions": [
    { "icon": "🧘", "title": "...", "description": "..." },
    { "icon": "😴", "title": "...", "description": "..." }
  ],
  "shouldSuggestDoctor": false,
  "doctorReason": null
}
```

**AI Prompt Design:**
- Warm, empathetic tone (not clinical)
- No "AI" terminology — frame as "personalized insight"
- Reference medical facts from our research (stress → cortisol → GnRH suppression) but explain in simple language
- Always include disclaimer: "This is not medical advice"
- Vietnamese translation support
- Token-optimized: use structured output format, shared system prompt

**Knowledge Base for AI (embedded in prompt):**
- 10 key facts about period irregularity (from research section 6)
- Mapping of user-reported factors → likely explanations
- Suggestion templates based on reported factors
- Red flag detection rules (when to suggest seeing a doctor)

### 3.4 Calendar Visual Updates

**Current:** All periods shown the same way (phase-colored dots).

**New distinction:**

| Type | Visual |
|------|--------|
| **Logged/actual period** | Solid fill with phase color (`#FF5F7E` menstrual) |
| **Predicted period** | Translucent/dashed outline with phase color |
| **Today (during predicted period)** | Pulsing outline ring |

Add a `CalendarMarker.source` field: `'logged' | 'predicted'` to distinguish in the UI.

### 3.5 Sun-Side Updates

When Moon logs her period manually:
1. Sun's dashboard updates via Supabase Realtime (existing channel)
2. If deviation is significant, Sun gets a gentle notification: "Moon's cycle updated — check in with her"
3. Sun's phase-aware guidance recalculates automatically

---

## 4. Implementation Plan

### Phase 1: Manual Period Logging (Core)
**Tickets: 5 | Effort: Medium**

| # | Ticket | Assignee | Description |
|---|--------|----------|-------------|
| 1.1 | Add `detectDeviation()` to cycleCalculator | Backend Engineer | Pure function: compare actual vs predicted, return `CycleDeviation` |
| 1.2 | Add "Period Started/Ended" button to MoonDashboard | Frontend Engineer | Conditional button based on cycle phase, calls `addPeriodLog()` |
| 1.3 | Add calendar tap-to-log | Frontend Engineer | Bottom sheet on date tap, period start/end logging, validation |
| 1.4 | Calendar visual distinction | Frontend Engineer | Solid vs translucent markers for logged vs predicted |
| 1.5 | Tests for deviation detection | QA Lead | Unit tests for `detectDeviation()`, integration tests for log→recalculate flow |

### Phase 2: AI Health Insights
**Tickets: 5 | Effort: Medium-High**

| # | Ticket | Assignee | Description |
|---|--------|----------|-------------|
| 2.1 | Create `/api/cycle-health-insight` proxy endpoint | Backend Engineer | MiniMax prompt with medical knowledge, structured response |
| 2.2 | Build health context questionnaire UI | Frontend Engineer | 3-question bottom sheet after deviation detected |
| 2.3 | Build AI insight display screen | Frontend Engineer | Show explanation + suggestions + doctor nudge |
| 2.4 | Deviation trigger flow | Frontend Engineer | Connect deviation detection → questionnaire → AI call → display |
| 2.5 | i18n for health insights | Content Writer | English + Vietnamese translations for all static copy |

### Phase 3: Sun-Side Integration
**Tickets: 2 | Effort: Low**

| # | Ticket | Assignee | Description |
|---|--------|----------|-------------|
| 3.1 | Update Sun dashboard for manual period events | Frontend Engineer | Realtime listener for period_logs changes, recalculate Sun's view |
| 3.2 | Sun notification on significant deviation | Backend Engineer | Edge function: notify Sun when Moon's cycle shifts significantly |

### Phase 4: Testing & Polish
**Tickets: 3 | Effort: Medium**

| # | Ticket | Assignee | Description |
|---|--------|----------|-------------|
| 4.1 | Full test suite | QA Lead | Unit (deviation, recalculation), integration (log→AI flow), E2E (calendar logging) |
| 4.2 | Edge cases | QA Lead | Very irregular cycles, first-time logging, overlapping periods, HealthKit conflicts |
| 4.3 | UX review | UX Designer | Calendar visual polish, bottom sheet animations, accessibility |

---

## 5. Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `app/components/moon/PeriodLogSheet.tsx` | Bottom sheet for calendar tap-to-log |
| `app/components/moon/PeriodStartButton.tsx` | Dashboard "Period Started/Ended" button |
| `app/components/moon/HealthInsightSheet.tsx` | AI health conversation UI (questionnaire + results) |
| `proxy/api/cycle-health-insight.ts` | New proxy endpoint for AI health insights |
| `app/hooks/useDeviationDetection.ts` | Hook: detects deviation after period log, triggers AI flow |
| `app/i18n/en/health.json` | English translations for health insights |
| `app/i18n/vi/health.json` | Vietnamese translations for health insights |

### Modified Files
| File | Changes |
|------|---------|
| `app/utils/cycleCalculator.ts` | Add `detectDeviation()` function |
| `app/store/appStore.ts` | Add deviation state, trigger detection after `addPeriodLog()` |
| `app/screens/MoonDashboard.tsx` | Add PeriodStartButton, wire up deviation flow |
| `app/components/moon/MoonCalendar.tsx` (or equivalent) | Add tap-to-log handler, visual distinction for predicted vs logged |
| `app/constants/theme.ts` | Add predicted period opacity/dash style tokens |
| `proxy/lib/minimax.ts` | Add health insight prompt template |

### Test Files
| File | Coverage Target |
|------|-----------------|
| `app/utils/__tests__/cycleCalculator.test.ts` | `detectDeviation()` — all edge cases |
| `app/hooks/__tests__/useDeviationDetection.test.ts` | Hook logic + trigger flow |
| `proxy/api/__tests__/cycle-health-insight.test.ts` | Proxy endpoint validation + response format |

---

## 6. Technical Decisions to Make

### Decision 1: Deviation Threshold
**Options:**
- A) ±2 days (tighter, more AI conversations triggered)
- B) ±3 days (balanced — matches Flo's approach)
- C) ±5 days (looser, fewer triggers)

**Recommendation:** B (±3 days) — matches industry standard, avoids over-alerting

### Decision 2: AI Conversation Trigger
**Options:**
- A) Auto-show bottom sheet every time deviation detected
- B) Show notification dot, Moon opens when ready
- C) Only show after 2+ consecutive deviations

**Recommendation:** A for first deviation, then B for subsequent (avoid fatigue)

### Decision 3: Period End Logging
**Options:**
- A) Require Moon to manually end period
- B) Auto-end based on average period length, Moon can adjust
- C) Ask Moon to confirm end after average period length passes

**Recommendation:** B with option to adjust — matches Flo, reduces friction

### Decision 4: Calendar Lookback Window
**Options:**
- A) 7 days (minimal retroactive logging)
- B) 30 days (reasonable window)
- C) Unlimited (use PeriodHistoryInput for older)

**Recommendation:** B (30 days) — covers most "forgot to log" scenarios

---

## 7. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| AI gives medical advice | High | Strong disclaimer in every response, prompt engineering to avoid diagnostic language |
| Over-alerting Moon about deviations | Medium | ±3 day threshold, max 1 AI prompt per cycle |
| Calendar logging conflicts with HealthKit sync | Medium | Dedup logic (±2 days) already exists, add source priority: manual > healthkit |
| Token cost for AI health insights | Low | Structured prompts, shared system sections (Paperclip optimization pattern) |
| Incorrect recalculation after manual log | Medium | Existing 1,567+ tests + new deviation tests provide safety net |

---

## 8. Success Metrics

1. **Adoption:** >60% of Moon users log at least one manual period within 30 days
2. **Accuracy:** Prediction error (MAE) decreases by >15% after 3+ manual logs
3. **Engagement:** >40% of deviation-triggered AI conversations are completed (all 3 questions answered)
4. **Retention:** DAU/MAU ratio increases by >5% within 60 days
5. **Health:** <1% of AI responses trigger "see a doctor" suggestion (indicates the app is helping manage normal variation)

---

## 9. Paperclip Tickets Summary

| Ticket ID | Title | Assignee | Phase |
|-----------|-------|----------|-------|
| FEAT_20260311_001 | Parent: Manual Period Logging + AI Health Insights | CEO | — |
| FEAT_20260311_001-1.1 | Add `detectDeviation()` to cycleCalculator | Backend Engineer | 1 |
| FEAT_20260311_001-1.2 | "Period Started/Ended" dashboard button | Frontend Engineer | 1 |
| FEAT_20260311_001-1.3 | Calendar tap-to-log with bottom sheet | Frontend Engineer | 1 |
| FEAT_20260311_001-1.4 | Calendar visual: predicted vs logged distinction | Frontend Engineer | 1 |
| FEAT_20260311_001-1.5 | Tests for deviation detection + recalculation | QA Lead | 1 |
| FEAT_20260311_001-2.1 | `/api/cycle-health-insight` proxy endpoint | Backend Engineer | 2 |
| FEAT_20260311_001-2.2 | Health context questionnaire bottom sheet | Frontend Engineer | 2 |
| FEAT_20260311_001-2.3 | AI insight display screen | Frontend Engineer | 2 |
| FEAT_20260311_001-2.4 | Deviation trigger flow (detect → ask → AI → show) | Frontend Engineer | 2 |
| FEAT_20260311_001-2.5 | i18n: health insight translations (en + vi) | Content Writer | 2 |
| FEAT_20260311_001-3.1 | Sun dashboard: react to manual period events | Frontend Engineer | 3 |
| FEAT_20260311_001-3.2 | Sun notification on significant deviation | Backend Engineer | 3 |
| FEAT_20260311_001-4.1 | Full test suite (unit + integration + E2E) | QA Lead | 4 |
| FEAT_20260311_001-4.2 | Edge case testing | QA Lead | 4 |
| FEAT_20260311_001-4.3 | UX review + polish | UX Designer | 4 |
