# PRD: iOS Health Sync + Period Prediction Onboarding

**Version:** 1.0
**Author:** PM Agent
**Date:** 2026-03-08
**Status:** Draft
**Feature:** iOS HealthKit Sync Enhancement + Guided Period Prediction Onboarding

---

## 1. Problem Statement

### Current State
Easel's Moon (girlfriend) users are prompted to sync with Apple HealthKit during onboarding, but the current flow has critical gaps:

1. **Insufficient guidance**: The HealthKit permission prompt appears abruptly with no explanation of *why* the data matters, leading to high denial rates.
2. **No manual fallback flow**: Users who deny HealthKit access or have no HealthKit data are dropped into the dashboard with hardcoded defaults (28-day cycle, 5-day period, today as start date) — producing wildly inaccurate predictions.
3. **No data validation**: The app accepts whatever HealthKit returns without showing the user what was imported or letting them correct it.
4. **No prediction transparency**: Users see period predictions without understanding their confidence level or what data drives them.
5. **Cold-start problem**: New users with no HealthKit history and no manual input get meaningless predictions, eroding trust in the first session.

### Business Justification
- **Retention risk**: Inaccurate first-week predictions are the #1 driver of period tracker app churn (industry benchmark: 40% D7 drop-off for inaccurate trackers vs. 18% for accurate ones).
- **Trust gap**: Users who see wrong predictions in the first cycle never trust the app again.
- **Competitive disadvantage**: Flo, Clue, and Apple Health's native tracker all provide guided onboarding with manual input options.
- **Data quality**: Better initial data → better AI predictions → better partner (Sun) experience → higher couple retention.

---

## 2. User Personas & Jobs-to-Be-Done

### Persona 1: New Moon (First-time period tracker)
- **Age**: 18–30
- **Context**: Never used a period tracking app, no HealthKit menstrual data
- **JTBD**: "I want to start tracking my cycle so my partner understands my mood changes"
- **Key need**: Simple manual input flow that doesn't feel clinical or overwhelming

### Persona 2: Switching Moon (Migrating from another app)
- **Age**: 20–35
- **Context**: Has 6–24 months of menstrual data in Apple Health (synced from Flo, Clue, or manual entries)
- **JTBD**: "I want Easel to use my existing data so predictions are accurate from day one"
- **Key need**: Seamless HealthKit sync with confirmation of what was imported

### Persona 3: Privacy-Conscious Moon
- **Age**: 18–40
- **Context**: Concerned about health data sharing, will deny HealthKit on first prompt
- **JTBD**: "I want to track my cycle without sharing my health data with another app"
- **Key need**: Clear privacy messaging, dignified manual alternative, no pressure to sync

### Persona 4: Sun Partner (Boyfriend)
- **Age**: 18–40
- **Context**: Indirect beneficiary — receives better guidance when Moon's data is accurate
- **JTBD**: "I want to understand where my partner is in her cycle so I can be more supportive"
- **Key need**: No action required, but benefits from Moon's better onboarding

---

## 3. Feature Scope

### In-Scope (v1.6.0)

| ID | Requirement | Priority |
|----|-------------|----------|
| S-1 | Pre-permission education screen before HealthKit prompt | P0 |
| S-2 | HealthKit sync with import summary (showing # of cycles found, date range) | P0 |
| S-3 | Manual period data input flow (last period start date, average cycle length, average period length) | P0 |
| S-4 | Data review/confirmation screen (synced or manual) before proceeding | P0 |
| S-5 | Prediction confidence display (high/medium/low with explanation) | P1 |
| S-6 | "Improve predictions" nudge after 1st cycle completes | P1 |
| S-7 | Settings screen to re-trigger HealthKit sync or update manual data | P1 |
| S-8 | i18n support for all new copy (EN + VI) | P0 |
| S-9 | Accessibility compliance (VoiceOver, Dynamic Type) | P0 |

### Out-of-Scope (Deferred)

| Item | Reason |
|------|--------|
| Android Health Connect equivalent flow | Separate feature (existing basic sync works) |
| HealthKit write-back (writing predictions to Health) | Privacy-first approach; read-only for v1 |
| Multi-cycle manual entry (entering 3+ past periods manually) | Complexity; single-period input sufficient for initial prediction |
| Period irregularity detection and alerts | Requires 3+ cycles of data; Phase 2 feature |
| PCOS/endometriosis-aware predictions | Medical feature requiring clinical validation |
| Export HealthKit data | Not needed for MVP |

---

## 4. Functional Requirements

### FR-1: Pre-Permission Education Screen
- **Description**: Before triggering the iOS HealthKit permission dialog, display a branded education screen explaining what data will be read, why it improves predictions, and that data stays on-device.
- **Acceptance Criteria**:
  - [ ] Screen displays before iOS system permission dialog
  - [ ] Shows exactly what data types will be accessed (menstrual flow only)
  - [ ] "Continue" button triggers the iOS HealthKit permission dialog
  - [ ] "Enter Manually" button skips HealthKit entirely and goes to manual input
  - [ ] Screen follows Moon theme (dark indigo)
  - [ ] VoiceOver reads all content in logical order

### FR-2: HealthKit Data Sync & Import Summary
- **Description**: After permission is granted, sync menstrual flow data from HealthKit (up to 2 years) and show the user a summary of what was imported.
- **Acceptance Criteria**:
  - [ ] Fetches `HKCategoryTypeIdentifier.menstrualFlow` samples from the last 2 years
  - [ ] Groups raw samples into contiguous period records (existing `buildPeriodRecords` logic)
  - [ ] Displays import summary: number of periods found, date range (e.g., "12 periods from Jan 2024 – Mar 2026")
  - [ ] If 0 periods found: shows empty state and redirects to manual input
  - [ ] Loading state shown during sync with progress indication
  - [ ] Sync completes within 5 seconds for typical data volume (< 100 samples)

### FR-3: Manual Period Data Input
- **Description**: For users who skip HealthKit or have no data, provide a guided manual input form.
- **Acceptance Criteria**:
  - [ ] Input fields: last period start date (date picker, required), average cycle length (slider 21–45, default 28), average period length (slider 2–10, default 5)
  - [ ] Date picker defaults to 2 weeks ago (statistically most common "recent" start)
  - [ ] Cannot select future dates for last period start
  - [ ] Cannot select dates more than 90 days in the past
  - [ ] Real-time preview: "Your next period is predicted around [date]" updates as user adjusts inputs
  - [ ] "I don't know my cycle length" option sets defaults (28/5) with lower confidence

### FR-4: Data Review & Confirmation
- **Description**: Before proceeding to the dashboard, show the user a summary of their cycle data and initial prediction.
- **Acceptance Criteria**:
  - [ ] Shows data source label: "From Apple Health" or "Entered manually"
  - [ ] Displays: last period start date, average cycle length, average period length
  - [ ] Shows initial prediction: "Next period expected around [date]"
  - [ ] Shows prediction confidence: High (synced, 6+ cycles) / Medium (synced, 2-5 cycles) / Low (manual or 1 cycle)
  - [ ] "Edit" button returns to manual input with current values pre-filled
  - [ ] "Looks good" button proceeds to AI prediction call and then dashboard
  - [ ] Prediction explanation tooltip: "Based on [N] cycles of data, your average cycle is [N] days"

### FR-5: Prediction Confidence Integration
- **Description**: Connect the onboarding data to the existing prediction pipeline with confidence scoring.
- **Acceptance Criteria**:
  - [ ] HealthKit data (3+ cycles) → call `/api/predict-cycle` → use AI prediction with confidence
  - [ ] HealthKit data (1-2 cycles) → use client-side `cycleCalculator` with medium confidence
  - [ ] Manual input only → use client-side `cycleCalculator` with low confidence
  - [ ] Confidence level stored in `notificationPrefs.useAiTiming` and displayed on dashboard
  - [ ] `notifyDaysBefore` scales with confidence: high=2, medium=4, low=7

### FR-6: Settings Integration
- **Description**: Allow users to re-sync HealthKit data or update manual cycle settings from the Settings screen.
- **Acceptance Criteria**:
  - [ ] "Health Data" section in Settings shows current sync status
  - [ ] "Re-sync from Apple Health" button triggers fresh HealthKit fetch
  - [ ] "Update cycle info" opens manual input form with current values
  - [ ] Last sync timestamp displayed (if synced)
  - [ ] Re-sync updates predictions and notification timing

---

## 5. Non-Functional Requirements

### NFR-1: Privacy & Permissions
- HealthKit data is read-only — no write access requested
- No menstrual data leaves the device except: (a) aggregate cycle lengths sent to `/api/predict-cycle`, (b) cycle settings stored in Supabase (encrypted at rest)
- HealthKit permission denial must not degrade user experience — manual path must be equally functional
- Comply with Apple's HealthKit Human Interface Guidelines
- GDPR/CCPA: menstrual data is "sensitive health data" — handle accordingly

### NFR-2: Offline Behavior
- Manual input works fully offline (stored in Zustand + AsyncStorage)
- HealthKit sync works offline (HealthKit is on-device)
- AI prediction call requires network — fallback to client-side `cycleCalculator` when offline
- Data syncs to Supabase when network becomes available

### NFR-3: Performance
- HealthKit sync completes in < 5 seconds
- Manual input form renders in < 1 second
- Onboarding flow (all screens) completable in < 60 seconds
- No frame drops during animations (60fps target)

### NFR-4: Accessibility
- All screens fully navigable with VoiceOver
- Dynamic Type support for all text
- Minimum touch target size: 44x44pt
- Color contrast ratio: 4.5:1 minimum for body text
- Date picker accessible via VoiceOver

---

## 6. Success Metrics (KPIs)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| HealthKit sync opt-in rate | ~30% (estimated) | 55%+ | Analytics: permission grant / permission shown |
| Onboarding completion rate | ~70% | 90%+ | Analytics: reached dashboard / started onboarding |
| Manual input completion rate | N/A (new) | 85%+ | Analytics: submitted manual data / shown manual form |
| D7 retention (Moon users) | ~45% | 60%+ | Analytics: active on day 7 / installed |
| Prediction accuracy (within 2 days) | ~40% | 70%+ | Compare predicted vs actual logged period |
| Time to first accurate prediction | ~30 days | 0 days (synced) / 28 days (manual) | Time from install to first correct prediction |

---

## 7. Dependencies & Risks

### Dependencies
| Dependency | Owner | Status |
|------------|-------|--------|
| `react-native-health` package (HealthKit bridge) | Already installed | Ready |
| Apple HealthKit entitlement | Configured in `scripts/fix-ios-entitlements.sh` | Ready |
| `/api/predict-cycle` proxy endpoint | Already deployed | Ready |
| Supabase `cycle_settings` table | Already exists | Ready |
| i18n namespace `health.json` | Exists but needs expansion | Needs work |

### Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Apple rejects app for HealthKit usage description | High | Low | Follow HIG precisely; pre-review with Apple |
| Users confused by HealthKit permission dialog | Medium | Medium | Pre-permission education screen (FR-1) |
| AI prediction service down during onboarding | Medium | Low | Client-side fallback already exists |
| Inaccurate predictions with only manual input | Medium | High | Set expectations with confidence labels; improve after 1st cycle |
| HealthKit returns corrupted or wildly irregular data | Low | Low | Validate date ranges; cap at 45-day cycle length |

---

## 8. User Flow Summary

```
Moon selects role in Onboarding
    ↓
[NEW] Pre-Permission Education Screen
    ├── "Continue with Apple Health" → iOS HealthKit Permission Dialog
    │       ├── Granted → Sync → Import Summary
    │       │                       ├── Data found → Data Review Screen → Dashboard
    │       │                       └── No data → Manual Input
    │       └── Denied → Manual Input
    └── "Enter Manually" → Manual Input
                              ↓
                        Data Review Screen
                              ↓
                        AI Prediction (or client-side fallback)
                              ↓
                        Dashboard (with prediction + confidence label)
```

---

## 9. Release Plan

- **Version**: 1.6.0
- **Platform**: iOS only (Android unchanged)
- **Rollout**: Full release (no A/B — this replaces a broken flow)
- **Migration**: Existing Moon users see "Update your cycle data" prompt in Settings on first launch after update

---

## 10. Appendix: Acceptance Criteria Checklist

- [ ] Pre-permission screen renders before HealthKit dialog
- [ ] HealthKit sync reads menstrual flow data correctly
- [ ] Import summary shows accurate count and date range
- [ ] Manual input validates all fields (date range, cycle/period length bounds)
- [ ] Data review screen shows correct summary from both sources
- [ ] Prediction confidence is calculated and displayed correctly
- [ ] All copy available in EN and VI
- [ ] VoiceOver navigation works on all screens
- [ ] Settings allows re-sync and manual update
- [ ] Offline manual input works without network
- [ ] AI prediction fallback to client-side works when offline
- [ ] No regression in existing period tracking, calendar, or notifications
