# QA Test Plan: iOS Health Sync + Period Prediction Onboarding

**Version:** 1.0
**Date:** 2026-03-08
**Feature:** iOS HealthKit Sync Enhancement + Guided Period Prediction Onboarding
**Environments:** iOS Simulator (iPhone 15 Pro, iOS 17+), Physical Device (iPhone 13+)

---

## 1. Test Plan Overview

### Scope
This test plan covers the end-to-end iOS Health Sync onboarding feature including:
- Pre-permission education screen
- HealthKit permission grant/deny flows
- HealthKit data sync and import summary
- Manual period data input (fallback)
- Data review and prediction confirmation
- Settings re-sync and update flows
- Regression on existing features

### Approach
- **Functional testing**: All user flows and edge cases
- **UI/UX testing**: Layout, theming, animations, copy correctness
- **Accessibility testing**: VoiceOver, Dynamic Type
- **i18n testing**: EN and VI translations
- **Regression testing**: Existing period tracking, calendar, notifications, SOS/whisper
- **Performance testing**: Sync speed, animation frame rate

### Prerequisites
- iOS Simulator with Health app data (menstrual flow records)
- Physical iOS device with HealthKit access
- Supabase backend running
- Proxy server running (for AI prediction)
- Test accounts: Moon (new user), Moon (returning user), Sun

---

## 2. Functional Test Cases

### 2.1 Pre-Permission Education Screen

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-001 | Education screen renders after role selection | New Moon user, no prior HealthKit prompt | 1. Sign up → Select Moon role | Pre-permission education screen displays with headline, body, bullet points, "Continue with Apple Health" button, "Enter manually" link, privacy badge | P0 |
| TC-002 | Continue button triggers HealthKit dialog | On education screen | 1. Tap "Continue with Apple Health" | iOS system HealthKit permission dialog appears | P0 |
| TC-003 | Manual entry link skips HealthKit | On education screen | 1. Tap "Enter manually instead" | Navigates directly to manual input screen without HealthKit prompt | P0 |
| TC-004 | Privacy badge displays correctly | On education screen | 1. Observe privacy badge at bottom | Shield icon + privacy text visible and correctly styled | P1 |
| TC-005 | Back navigation not available | On education screen | 1. Try to swipe back or press back | No back navigation available (clean forward flow) | P1 |

### 2.2 HealthKit Permission Grant Flow

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-010 | Permission granted with data | HealthKit has 6+ months of menstrual data | 1. Tap "Continue" → 2. Grant HealthKit permission | Loading/sync state shown → Import summary with period count, date range, avg cycle length | P0 |
| TC-011 | Permission granted with no data | HealthKit has no menstrual flow records | 1. Tap "Continue" → 2. Grant HealthKit permission | Empty state shown → Automatically redirects to manual input | P0 |
| TC-012 | Permission granted with partial data | HealthKit has 1-2 menstrual records | 1. Tap "Continue" → 2. Grant HealthKit permission | Import summary shows with low/medium confidence | P0 |
| TC-013 | Sync loading state visible | During HealthKit sync | 1. Grant permission | Loading animation and "Syncing your cycle data..." text visible during sync | P1 |
| TC-014 | Sync completes within 5 seconds | HealthKit has < 100 samples | 1. Grant permission → Observe timing | Sync completes and shows import summary within 5 seconds | P1 |

### 2.3 HealthKit Permission Denied Flow

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-020 | Permission denied redirects to manual | On education screen | 1. Tap "Continue" → 2. Deny HealthKit permission | Friendly message shown → CTA to enter data manually | P0 |
| TC-021 | No degraded experience after denial | Permission was denied | 1. Complete manual input → 2. Use app | All features work identically as with synced data | P0 |
| TC-022 | Permission previously denied (system level) | User denied HealthKit in iOS Settings | 1. Tap "Continue" | Message explaining how to enable in Settings, or skip to manual input | P1 |

### 2.4 Import Summary Screen

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-030 | Import summary shows correct stats | HealthKit synced successfully with 8 periods | 1. Observe import summary | Shows "8 periods found", date range (e.g., "Jul 2025 – Mar 2026"), and calculated avg cycle length | P0 |
| TC-031 | Continue from import summary | On import summary screen | 1. Tap "Continue" | Navigates to data review/prediction screen | P0 |
| TC-032 | "Doesn't look right" link | On import summary | 1. Tap "This doesn't look right" | Navigates to manual input with HealthKit values pre-filled | P1 |
| TC-033 | Single period found displays correctly | HealthKit has 1 period record | 1. Observe summary | Shows "1 period found" with appropriate messaging about limited data | P1 |

### 2.5 Manual Period Data Input

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-040 | Manual input form renders | Navigated to manual input (via skip or denied) | 1. Observe screen | Headline, date picker, cycle length slider (21-45, default 28), period length slider (2-10, default 5), prediction preview, continue button | P0 |
| TC-041 | Date picker works correctly | On manual input | 1. Tap date field → 2. Select date 2 weeks ago | Date picker opens, selected date appears in field, prediction preview updates | P0 |
| TC-042 | Cannot select future date | On manual input | 1. Try to select tomorrow's date | Date picker prevents future date selection (maximumDate = today) | P0 |
| TC-043 | Cannot select date > 90 days ago | On manual input | 1. Try to select date 100 days ago | Date picker prevents or shows validation error | P1 |
| TC-044 | Cycle length slider works | On manual input | 1. Adjust cycle length slider to 32 | Slider moves, number displays "32", prediction preview updates | P0 |
| TC-045 | Period length slider works | On manual input | 1. Adjust period length slider to 7 | Slider moves, number displays "7", prediction preview updates | P0 |
| TC-046 | Cycle length bounds enforced | On manual input | 1. Try to set cycle length below 21 or above 45 | Slider stops at 21 and 45 | P0 |
| TC-047 | Period length bounds enforced | On manual input | 1. Try to set period length below 2 or above 10 | Slider stops at 2 and 10 | P0 |
| TC-048 | "I'm not sure" toggle | On manual input | 1. Toggle "I'm not sure" on | Sets defaults (28/5), shows explanation text, lowers confidence indicator | P1 |
| TC-049 | Live prediction preview | On manual input | 1. Set last period to 20 days ago, cycle length to 28 | Preview shows "Next period expected around [date 8 days from now]" | P0 |
| TC-050 | Continue with valid data | On manual input, all fields filled | 1. Tap "Continue" | Navigates to data review screen with entered values | P0 |
| TC-051 | Continue with no date selected | On manual input, date empty | 1. Tap "Continue" without selecting date | Validation error shown for date field | P0 |

### 2.6 Data Review & Prediction Screen

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-060 | Review screen shows synced data | Came from HealthKit sync | 1. Observe review screen | "From Apple Health" badge, cycle stats, prediction with high/medium confidence | P0 |
| TC-061 | Review screen shows manual data | Came from manual input | 1. Observe review screen | "Entered manually" badge, cycle stats, prediction with low confidence | P0 |
| TC-062 | Prediction date is correct | Review screen with known inputs | 1. Verify prediction math | Prediction = lastPeriodStartDate + avgCycleLength (or AI prediction if 3+ cycles synced) | P0 |
| TC-063 | Confidence label correct (high) | Synced 6+ cycles from HealthKit | 1. Observe confidence | "High confidence" label with green indicator | P0 |
| TC-064 | Confidence label correct (medium) | Synced 2-5 cycles from HealthKit | 1. Observe confidence | "Medium confidence" label with yellow/amber indicator | P0 |
| TC-065 | Confidence label correct (low) | Manual input only | 1. Observe confidence | "Low confidence" label with explanation | P0 |
| TC-066 | Edit button returns to manual input | On review screen | 1. Tap "Edit" | Returns to manual input with current values pre-filled | P1 |
| TC-067 | Confirm proceeds to dashboard | On review screen | 1. Tap "Looks good, let's go!" | Navigates to main dashboard, cycle data persisted | P0 |
| TC-068 | Prediction explanation expandable | On review screen | 1. Tap info/tooltip icon | Explanation of how prediction works displayed | P2 |

### 2.7 Dashboard Integration

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-070 | Dashboard uses synced data | Completed onboarding with HealthKit | 1. Observe dashboard | Phase wheel, days until period, and phase name reflect synced cycle data | P0 |
| TC-071 | Dashboard uses manual data | Completed onboarding with manual input | 1. Observe dashboard | Phase wheel, days until period, and phase name reflect manual input | P0 |
| TC-072 | Calendar reflects synced data | Completed onboarding | 1. Navigate to Calendar tab | Period markers, ovulation markers, fertile window markers align with synced/manual cycle data | P0 |

### 2.8 Settings Integration

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-080 | Health data section in Settings | Moon user, completed onboarding | 1. Navigate to Settings | "Health Data" section visible with sync status | P1 |
| TC-081 | Re-sync from Apple Health | In Settings, previously synced | 1. Tap "Re-sync" button | Fresh HealthKit fetch, updated import summary, cycle settings updated | P1 |
| TC-082 | Update cycle info from Settings | In Settings | 1. Tap "Update cycle info" | Opens manual input form with current values, saves on confirm | P1 |

### 2.9 Offline Behavior

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-090 | Manual input works offline | No network connection | 1. Complete manual input → 2. Tap Continue | Data saved locally in Zustand/AsyncStorage, proceeds to dashboard | P0 |
| TC-091 | HealthKit sync works offline | No network, HealthKit available | 1. Sync from HealthKit | HealthKit data synced (on-device), prediction falls back to client-side calculator | P0 |
| TC-092 | AI prediction fallback offline | No network, after sync | 1. Complete sync flow | Client-side cycleCalculator used instead of AI endpoint, app continues normally | P0 |

### 2.10 Edge Cases

| ID | Title | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|-------|-----------------|----------|
| TC-100 | Very irregular cycles in HealthKit | HealthKit data with cycles ranging 20-45 days | 1. Sync | Average computed correctly, confidence lowered, warning about irregular cycles | P1 |
| TC-101 | Last period was today | Manual input | 1. Select today as last period start | Prediction shows next period in ~28 days, phase shows "menstrual day 1" | P1 |
| TC-102 | Last period was 89 days ago | Manual input | 1. Select date 89 days ago | Accepted (within 90-day limit), prediction calculates correctly | P1 |
| TC-103 | HealthKit returns very old data only | Only menstrual records from 2+ years ago | 1. Sync | Empty state shown (data too old), redirect to manual input | P2 |
| TC-104 | App killed during sync | HealthKit sync in progress | 1. Force-kill app → 2. Reopen | App returns to education screen (sync not completed), no corrupted state | P1 |
| TC-105 | Double-tap Continue button | On education screen | 1. Rapidly tap "Continue" twice | Only one HealthKit permission dialog appears (button disabled during loading) | P1 |

---

## 3. Accessibility Test Cases

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-A01 | VoiceOver navigation on education screen | 1. Enable VoiceOver → 2. Navigate screen | All elements read in logical order: headline → body → bullets → Continue button → Manual link → Privacy badge | P0 |
| TC-A02 | VoiceOver on manual input | 1. Navigate manual input with VoiceOver | Labels, sliders, date picker all accessible and announced correctly | P0 |
| TC-A03 | Dynamic Type large text | 1. Set iOS Dynamic Type to largest | All text scales, no truncation, layout doesn't break | P1 |
| TC-A04 | Touch targets 44x44pt minimum | 1. Inspect all interactive elements | All buttons and tappable areas are at least 44x44pt | P1 |
| TC-A05 | Color contrast | 1. Check text contrast ratios | Body text: 4.5:1 minimum, headings: 3:1 minimum | P1 |

---

## 4. i18n Test Cases

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-I01 | English copy on all screens | 1. Set language to EN → 2. Go through entire flow | All screens show English copy as specified | P0 |
| TC-I02 | Vietnamese copy on all screens | 1. Set language to VI → 2. Go through entire flow | All screens show Vietnamese copy, no missing keys | P0 |
| TC-I03 | No truncated translations | 1. Switch to VI → 2. Check all screens | Vietnamese text (often longer) fits within UI bounds | P1 |
| TC-I04 | Dynamic date formatting | 1. Check prediction date in both languages | Date formatted per locale (EN: "March 15, 2026", VI: "15 tháng 3, 2026") | P1 |

---

## 5. Regression Test Cases

### 5.1 Existing Period Tracking

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-R01 | Existing cycle settings preserved | 1. Returning Moon user logs in | Existing cycle settings loaded from DB, not overwritten by defaults | P0 |
| TC-R02 | Manual period logging still works | 1. Log a new period start from dashboard | Period logged correctly, cycle day resets | P0 |
| TC-R03 | Daily check-in still works | 1. Complete daily mood/symptom check-in | Data saved correctly | P0 |

### 5.2 Calendar View

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-R10 | Calendar markers accurate | 1. Open Calendar tab after onboarding | Period, ovulation, fertile markers match cycle settings | P0 |
| TC-R11 | Calendar updates after settings change | 1. Update cycle settings in Settings → 2. Check Calendar | Markers recalculated with new settings | P1 |

### 5.3 Notifications

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-R20 | Period approaching notification | 1. Set cycle data so period is in 3 days → 2. Wait for notification | Notification fires at correct time | P0 |
| TC-R21 | Notification timing uses AI prediction | 1. Sync with HealthKit (3+ cycles) → 2. Check notifyDaysBefore | AI-set notifyDaysBefore used for notification scheduling | P1 |

### 5.4 SOS & Whisper

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-R30 | SOS still works after onboarding | 1. Complete new onboarding → 2. Send SOS | SOS signal sent and received by Sun | P0 |
| TC-R31 | Whisper still works after onboarding | 1. Complete new onboarding → 2. Send Whisper | Whisper signal sent and received by Sun | P0 |

### 5.5 Sun User (No Regression)

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-R40 | Sun onboarding unchanged | 1. Sign up as Sun | No health sync screen shown, direct to dashboard | P0 |
| TC-R41 | Sun sees partner's synced data | 1. Moon syncs HealthKit → 2. Sun checks Settings | Sun's partner phase info reflects Moon's synced cycle data | P1 |

---

## 6. Performance Test Cases

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-P01 | Onboarding flow under 60 seconds | 1. Time entire flow from role selection to dashboard | Completes in < 60 seconds (including sync) | P1 |
| TC-P02 | No frame drops in animations | 1. Monitor FPS during transitions and animations | Consistent 60fps, no jank | P2 |
| TC-P03 | Memory usage during sync | 1. Monitor memory during HealthKit sync | No memory spikes > 50MB above baseline | P2 |

---

## 7. Test Data Requirements

| Dataset | Description | How to Create |
|---------|-------------|---------------|
| HK-FULL | 12 months of menstrual data (12 periods, ~28 day cycles) | Add via Health app or Xcode Health Data simulator |
| HK-PARTIAL | 2 periods only | Add 2 menstrual flow records in Health |
| HK-EMPTY | No menstrual flow data | Fresh simulator or clear Health data |
| HK-IRREGULAR | 8 periods with cycles ranging 22-40 days | Add irregular records in Health |
| HK-OLD | Menstrual data only from 2+ years ago | Add old-dated records, clear recent ones |
| MANUAL-DEFAULT | No prior data | New user account |
