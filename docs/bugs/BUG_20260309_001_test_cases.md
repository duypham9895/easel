# Phase 3 — Test Cases: BUG_20260309_001

> **Bug ID:** `BUG_20260309_001`
> **Date:** 2026-03-09
> **Phase:** Test Case Writing (pre-fix)
> **Author:** QA Engineer
> **Input:** `BUG_20260309_001_triage.md`, `BUG_20260309_001_impact_map.md`, `BUG_20260309_001_root_cause.md`

---

## A. Bug Verification Test Cases

These tests confirm each bug is fixed. All must FAIL before the fix and PASS after.

### BUG-A: Cycle Calculator Modulo Fix

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| A-01 | Day 29 of 28-day cycle returns 29 (not 2) | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(dateString, 28)` where `dateString` is 28 days ago | Returns `29` (period is 1 day late) | P0 |
| A-02 | Day 33 of 28-day cycle returns 33 (not 6) | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(dateString, 28)` where `dateString` is 32 days ago | Returns `33` (period is 5 days late) | P0 |
| A-03 | Day 56 of 28-day cycle returns 56 (not 1) | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(dateString, 28)` where `dateString` is 55 days ago | Returns `56` (very late period — nearly 2 full cycles overdue) | P0 |
| A-04 | Day 28 boundary returns 28 (not wrapping to 1) | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(dateString, 28)` where `dateString` is 27 days ago | Returns `28` (last day of cycle, not wrapped) | P0 |
| A-05 | Negative days (future date) returns 1 | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(tomorrowDateStr, 28)` | Returns `1` (guard for future dates preserved) | P0 |
| A-06 | Day 0 (today = start date) returns 1 | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(todayDateStr, 28)` | Returns `1` | P0 |
| A-07 | Late period maps to luteal phase | cycleCalculator | Unit | code-inspection | None | Call `getCurrentPhase(33, 28, 5)` | Returns `'luteal'` (the final else branch catches day > ovulatory window) | P0 |
| A-08 | getDaysUntilNextPeriod with late cycle returns overdue value | cycleCalculator | Unit | code-inspection | None | Call `getDaysUntilNextPeriod(33, 28)` | Returns `28` (remaining = 28 - 33 + 1 = -4, which is <= 0, so returns avgCycleLength) | P0 |
| A-09 | Moon Dashboard shows correct day for late period | MoonDashboard | Integration | device-test | Moon user, period started 33 days ago, 28-day cycle | Open Moon Dashboard | Phase wheel shows Day 33, phase displays as luteal | P0 |
| A-10 | Sun Dashboard shows correct day for partner's late period | SunDashboard | Integration | device-test | Sun user linked to Moon with 33-day-late period | Open Sun Dashboard | Phase orb shows Day 33, phase name = luteal | P0 |

### BUG-C: Tab Bar Theming

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| C-01 | Moon tab bar has dark background | Tab Layout | Visual | device-test + screenshot | Logged in as Moon | Navigate to any tab, observe tab bar background | Tab bar background is `MoonColors.card` (#162233), dark — not white | P0 |
| C-02 | Moon tab bar active tint is lavender | Tab Layout | Visual | device-test + screenshot | Logged in as Moon | Tap a tab, observe active icon color | Active tab icon is `MoonColors.accentPrimary` (#B39DDB), lavender — not pink | P0 |
| C-03 | Sun tab bar has cream background | Tab Layout | Visual | device-test + screenshot | Logged in as Sun | Navigate to any tab, observe tab bar background | Tab bar background matches Sun theme (cream/white, `SunColors.card`) — not dark | P0 |
| C-04 | Sun tab bar active tint is amber | Tab Layout | Visual | device-test + screenshot | Logged in as Sun | Tap a tab, observe active icon color | Active tab icon is `SunColors.accentPrimary` (#F59E0B), amber — not pink | P0 |
| C-05 | Null role tab bar uses default theme | Tab Layout | Visual | device-test + screenshot | Not logged in / no role selected | View tab bar (if visible during onboarding) | Tab bar uses default `Colors.card` (#FFFFFF) and `Colors.menstrual` (#FF5F7E) as fallback | P1 |

### BUG-D: Hardcoded English Strings (i18n)

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| D-01 | CycleDataReview shows Vietnamese toggle text | CycleDataReview | i18n | device-test | Language set to Vietnamese, Moon user | Go through health sync, reach review screen, observe toggle button text | Shows Vietnamese text (e.g., "Cach hoat dong?" / "An") — not English "How does this work?" / "Hide" | P0 |
| D-02 | CycleDataReview toggle switches between Vietnamese show/hide text | CycleDataReview | i18n | device-test | Language set to Vietnamese, Moon user | Tap the toggle button on review screen | Text toggles between Vietnamese "show explanation" and "hide" labels | P0 |
| D-03 | ManualCycleInput "Done" button shows Vietnamese | ManualCycleInput | i18n | device-test | Language set to Vietnamese, Moon user, iOS | Open manual cycle input, open date picker, observe dismiss button | Shows "Xong" — not "Done" | P1 |
| D-04 | PermissionDeniedScreen shows Vietnamese "Open Settings" | PermissionDeniedScreen | i18n | device-test | Language set to Vietnamese, Moon user, HealthKit denied | Deny HealthKit permission, observe settings link text | Shows "Mo Cai dat" — not "Open Settings" | P1 |

### BUG-E: Edge Function Push Notification i18n

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| E-01 | notify-cycle sends Vietnamese to Vietnamese Moon user | notify-cycle | Push i18n | code-inspection | Moon user has `user_preferences.language = 'vi'` | Trigger cycle notification for approaching period | Push title and body are Vietnamese (e.g., "Ky kinh sap den") | P0 |
| E-02 | notify-cycle sends Vietnamese to Vietnamese Sun user | notify-cycle | Push i18n | code-inspection | Sun user has `user_preferences.language = 'vi'`, linked to Moon | Trigger cycle notification for approaching period | Sun receives Vietnamese text (e.g., "Ky kinh cua Moon sap den") | P0 |
| E-03 | notify-cycle sends English to English user (unchanged) | notify-cycle | Push i18n | code-inspection | User has `user_preferences.language = 'en'` | Trigger cycle notification | English text as before (e.g., "Your period is coming") | P0 |
| E-04 | notify-cycle defaults to English when no language preference | notify-cycle | Push i18n | code-inspection | User has no row in `user_preferences` | Trigger cycle notification | Defaults to English text | P0 |
| E-05 | notify-sos sends Vietnamese SOS to Vietnamese Sun | notify-sos | Push i18n | code-inspection | Sun user has `language = 'vi'` | Moon sends SOS (sweet_tooth) | Sun receives Vietnamese SOS push (e.g., "Moon can ban") | P0 |
| E-06 | notify-sos sends Vietnamese Whisper to Vietnamese Sun | notify-sos | Push i18n | code-inspection | Sun user has `language = 'vi'` | Moon sends Whisper signal | Sun receives Vietnamese Whisper push | P0 |
| E-07 | notify-sos sends English SOS to English Sun (unchanged) | notify-sos | Push i18n | code-inspection | Sun user has `language = 'en'` | Moon sends SOS | Sun receives English SOS push (e.g., "Moon needs you") | P0 |
| E-08 | Mixed-language couple: Moon VI, Sun EN | notify-sos | Push i18n | code-inspection | Moon `language = 'vi'`, Sun `language = 'en'` | Moon sends SOS | Sun receives English notification (recipient's language, not sender's) | P1 |
| E-09 | Mixed-language couple: Moon EN, Sun VI | notify-cycle | Push i18n | code-inspection | Moon `language = 'en'`, Sun `language = 'vi'` | Trigger cycle notification | Moon gets English, Sun gets Vietnamese | P1 |

### BUG-F: AI Label Removal

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| F-01 | Moon Dashboard greeting has no "AI" label | MoonDashboard | Visual | device-test + screenshot | Moon user, AI greeting loaded | Open Moon Dashboard, wait for AI greeting to load | No "AI" text or badge visible near greeting | P0 |
| F-02 | Sun Dashboard "How to show up" card has no "AI" in title | SunDashboard | Visual | device-test + screenshot | Sun user, AI advice loaded | Open Sun Dashboard, wait for AI advice to load | Card title is "How to show up" — no "AI" suffix | P0 |
| F-03 | Moon Dashboard greeting in Vietnamese has no "AI" label | MoonDashboard | Visual | device-test | Moon user, Vietnamese, AI greeting loaded | Open Moon Dashboard in Vietnamese | No "AI" text visible anywhere near greeting | P0 |
| F-04 | Sun Dashboard "How to show up" in Vietnamese has no "AI" | SunDashboard | Visual | device-test | Sun user, Vietnamese, AI advice loaded | Open Sun Dashboard in Vietnamese | Card title is "Cach the hien" — no "AI" suffix | P0 |
| F-05 | No "AI" text visible anywhere in app UI | Full app | Visual | device-test | Both Moon and Sun roles tested | Navigate through all screens: dashboards, SOS alert, whisper alert, check-in, whisper sheet | Zero occurrences of "AI" text visible to the user | P1 |

---

## B. Regression Test Cases

These tests cover features in the blast radius that must still work correctly after the fix.

### BUG-A Regression: Cycle Calculator Consumers

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| RA-01 | Normal cycle day 1 still works | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(todayDateStr, 28)` | Returns `1` | P0 |
| RA-02 | Normal cycle day 14 still works | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(dateStr, 28)` where dateStr is 13 days ago | Returns `14` | P0 |
| RA-03 | Normal cycle day 28 still works | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(dateStr, 28)` where dateStr is 27 days ago | Returns `28` | P0 |
| RA-04 | Phase calculation for normal menstrual (day 1-5) | cycleCalculator | Unit | code-inspection | None | Call `getCurrentPhase(1, 28, 5)` through `getCurrentPhase(5, 28, 5)` | All return `'menstrual'` | P0 |
| RA-05 | Phase calculation for normal follicular | cycleCalculator | Unit | code-inspection | None | Call `getCurrentPhase(6, 28, 5)` through `getCurrentPhase(11, 28, 5)` | All return `'follicular'` | P0 |
| RA-06 | Phase calculation for normal ovulatory | cycleCalculator | Unit | code-inspection | None | Call `getCurrentPhase(12, 28, 5)` through `getCurrentPhase(16, 28, 5)` | All return `'ovulatory'` | P0 |
| RA-07 | Phase calculation for normal luteal | cycleCalculator | Unit | code-inspection | None | Call `getCurrentPhase(17, 28, 5)` through `getCurrentPhase(28, 28, 5)` | All return `'luteal'` | P0 |
| RA-08 | getDaysUntilNextPeriod for normal cycle | cycleCalculator | Unit | code-inspection | None | Call `getDaysUntilNextPeriod(14, 28)` | Returns `15` | P0 |
| RA-09 | getConceptionChance still returns correct values | cycleCalculator | Unit | code-inspection | None | Call for all 4 phases | Returns Low, Medium, Very High, Low respectively | P1 |
| RA-10 | buildCalendarMarkers still generates 3 cycles of markers | cycleCalculator | Unit | code-inspection | None | Call `buildCalendarMarkers('2026-01-01', 28, 5)` | 15 period markers, 3 ovulation markers, fertile window markers present | P0 |
| RA-11 | Moon Dashboard displays correctly for normal cycle | MoonDashboard | Integration | device-test | Moon user, period started 10 days ago, 28-day cycle | Open Moon Dashboard | Shows Day 11, follicular phase, correct phase wheel position | P0 |
| RA-12 | Sun Dashboard displays correctly for normal cycle | SunDashboard | Integration | device-test | Sun user linked to Moon, normal cycle | Open Sun Dashboard | Phase orb shows correct day, phase name, countdown badge | P0 |
| RA-13 | Calendar today highlight uses correct phase color | Calendar | Integration | device-test | Moon user, normal cycle day 14 | Open Calendar tab, observe today's cell | Today highlighted with ovulatory phase color (#FFB347) | P1 |
| RA-14 | Calendar markers project 3 future cycles correctly | Calendar | Integration | device-test | Moon user with cycle settings | Open Calendar tab, scroll to next 2 months | Period markers, ovulation markers, fertile window markers visible for 3 cycles | P1 |
| RA-15 | Settings partner phase display (Sun) shows correct data | Settings | Integration | device-test | Sun user, linked to Moon | Open Settings tab | Partner phase info shows correct phase name and day | P1 |
| RA-16 | Short cycle (21 days) still calculates correctly | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(dateStr, 21)` where dateStr is 20 days ago | Returns `21` | P1 |
| RA-17 | Long cycle (35 days) still calculates correctly | cycleCalculator | Unit | code-inspection | None | Call `getCurrentDayInCycle(dateStr, 35)` where dateStr is 20 days ago | Returns `21` (within normal range) | P1 |

### BUG-C Regression: Tab Bar Layout

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| RC-01 | Tab bar shows all 3 tabs (Today, Calendar, Settings) | Tab Layout | Functional | device-test | Logged in | View tab bar | All 3 tabs visible with correct icons and labels | P0 |
| RC-02 | Tab navigation works after theming change | Tab Layout | Functional | device-test | Logged in as Moon | Tap each tab sequentially | Each screen loads correctly, tab bar stays visible | P0 |
| RC-03 | Tab bar inactive tint is role-appropriate | Tab Layout | Visual | device-test + screenshot | Logged in as Moon, then Sun | Observe inactive tab icon colors | Moon: `MoonColors.textHint` (#6B7A8C); Sun: `SunColors.textHint` (#9C8B7A) | P1 |
| RC-04 | Tab bar height and padding unchanged | Tab Layout | Visual | device-test + screenshot | Logged in | Observe tab bar dimensions | Height 84, paddingBottom 24, paddingTop 10 — no layout shift | P1 |
| RC-05 | Tab bar labels show correct i18n text | Tab Layout | i18n | device-test | Vietnamese language | View tab labels | Labels show Vietnamese translations for Today, Calendar, Settings | P1 |
| RC-06 | Tab bar updates after role change | Tab Layout | Functional | device-test | Logged in as Moon | Go to Settings > Change Role to Sun | Tab bar background changes from dark to cream, tint from lavender to amber — no app restart needed | P1 |

### BUG-D Regression: Health Sync Flow

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| RD-01 | CycleDataReview English text still works | CycleDataReview | i18n | device-test | Language set to English | Reach review screen, tap toggle | Shows "How does this work?" / "Hide" in English | P0 |
| RD-02 | ManualCycleInput "Done" button works in English | ManualCycleInput | i18n | device-test | Language set to English, iOS | Open date picker in manual input | Shows "Done" in English | P1 |
| RD-03 | PermissionDeniedScreen "Open Settings" works in English | PermissionDeniedScreen | i18n | device-test | Language set to English | Deny HealthKit permission | Shows "Open Settings" in English | P1 |
| RD-04 | CycleDataReview explanation toggle expand/collapse animation | CycleDataReview | Functional | device-test | Any language | Tap toggle repeatedly | Explanation section expands and collapses smoothly, no layout jank | P1 |
| RD-05 | Vietnamese text does not truncate in CycleDataReview | CycleDataReview | Visual | device-test + screenshot | Vietnamese language | Observe toggle button | Full Vietnamese text visible, no truncation or overflow | P1 |
| RD-06 | Vietnamese text does not truncate in PermissionDeniedScreen | PermissionDeniedScreen | Visual | device-test + screenshot | Vietnamese language | Observe "Open Settings" link | "Mo Cai dat" fully visible, no truncation | P2 |

### BUG-E Regression: Push Notification Delivery

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| RE-01 | notify-cycle still sends all 3 event types (approaching, started, ended) | notify-cycle | Push | code-inspection | English user | Trigger each notification type | All 3 types send correct English text | P0 |
| RE-02 | notify-cycle batch processing still works | notify-cycle | Performance | code-inspection | Multiple users | Trigger batch cycle notification run | All users receive notifications; no N+1 query regression | P1 |
| RE-03 | notify-sos still sends for all 4 SOS types | notify-sos | Push | code-inspection | English Sun user | Moon sends each SOS type | Sun receives correct push for sweet_tooth, need_a_hug, cramps_alert, quiet_time | P0 |
| RE-04 | notify-sos still sends for whisper signals | notify-sos | Push | code-inspection | English Sun user | Moon sends a whisper signal | Sun receives correct whisper notification | P0 |
| RE-05 | notify-sos fallback for unknown signal type | notify-sos | Push | code-inspection | Any language | Unknown signal type passed | Fallback generic text used, no crash | P1 |
| RE-06 | notify-cycle pluralization correct in English | notify-cycle | Push i18n | code-inspection | English user | Period approaching in 1 day vs 3 days | "1 day" (singular) vs "3 days" (plural) | P1 |
| RE-07 | notify-cycle Vietnamese does not pluralize | notify-cycle | Push i18n | code-inspection | Vietnamese user | Period approaching in 1 day vs 3 days | Both use "ngay" without plural suffix | P1 |

### BUG-F Regression: Dashboard Functionality

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| RF-01 | Moon Dashboard AI greeting still loads and displays | MoonDashboard | Functional | device-test | Moon user | Open dashboard, wait for AI greeting | Greeting text appears (personalized), no visible change indicator for AI vs static | P0 |
| RF-02 | Moon Dashboard static fallback greeting still works | MoonDashboard | Functional | device-test | Moon user, network disabled | Open dashboard | Static fallback greeting appears immediately | P0 |
| RF-03 | Sun Dashboard AI advice card still loads | SunDashboard | Functional | device-test | Sun user | Open dashboard, wait for AI advice | Advice card shows content with title "How to show up" | P0 |
| RF-04 | Sun Dashboard static fallback advice still works | SunDashboard | Functional | device-test | Sun user, network disabled | Open dashboard | Static fallback advice appears with title "How to show up" | P0 |
| RF-05 | isAI flag still available in hooks for internal use | Hooks | Unit | code-inspection | None | Inspect `useAIGreeting`, `useAIPartnerAdvice` return values | `isAI` boolean still returned (for analytics/fallback logic) — only UI rendering removed | P1 |

---

## C. Non-Regression Confirmation Cases

These tests verify that working behavior is not accidentally broken by the fix.

### Cross-Cutting: Features Not Involved in Bug Groups

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|----|-------|-------------|------|-------------------|--------------|-------|-----------------|----------|
| NR-01 | SOS signal sending and receiving still works | SOS | Functional | device-test | Moon + Sun linked | Moon sends SOS (sweet_tooth) | Sun receives SOS alert in real-time; Moon sees "sent" confirmation | P0 |
| NR-02 | Whisper signal sending and receiving still works | Whisper | Functional | device-test | Moon + Sun linked | Moon sends whisper | Sun receives whisper alert; whisper history updated | P0 |
| NR-03 | Daily check-in flow completes successfully | DailyCheckIn | Functional | device-test | Moon user | Open check-in, select mood + symptoms, submit | Check-in saved, insight card appears (no "AI" label on it) | P0 |
| NR-04 | Auth flow (login/logout) still works | Auth | Functional | device-test | Valid credentials | Log out, log back in | Session restored, dashboard loads with correct role | P0 |
| NR-05 | Partner linking flow still works | Couples | Functional | device-test | Two accounts, not linked | Moon generates code, Sun enters code | Couple linked, both dashboards show partner data | P1 |
| NR-06 | Calendar date detail sheet shows correct info | Calendar | Functional | device-test | Moon user with cycle data | Tap any date on calendar | Date detail sheet shows cycle day, phase, and symptoms (if logged) | P1 |
| NR-07 | Settings screen loads all sections | Settings | Functional | device-test | Any logged-in user | Open Settings tab | Profile, preferences, partner info, and actions all visible | P1 |
| NR-08 | Language toggle switches all UI text | Settings | i18n | device-test | English default | Settings > Language > Vietnamese | All visible UI text (tabs, dashboard, settings) switches to Vietnamese | P1 |
| NR-09 | Biometric unlock still works if enabled | Auth | Functional | device-test | Biometric enabled | Close app, reopen | Biometric prompt appears, successful unlock shows dashboard | P2 |
| NR-10 | AI hooks abort on unmount (no memory leak) | Hooks | Unit | code-inspection | None | Inspect AbortController usage in AI hooks after fix | AbortController still cancels in-flight requests on component unmount | P2 |

---

## Test Summary

| Category | Count | P0 | P1 | P2 |
|----------|-------|----|----|-----|
| A. Bug Verification | 30 | 24 | 5 | 1 |
| B. Regression | 33 | 15 | 16 | 2 |
| C. Non-Regression | 10 | 4 | 4 | 2 |
| **Total** | **73** | **43** | **25** | **5** |

## Test Execution Notes

### Pre-Fix Expectations
- All **Category A** tests should FAIL (confirming the bugs exist)
- All **Category B** and **Category C** tests should PASS (confirming no pre-existing regressions)

### Post-Fix Expectations
- All **Category A** tests should PASS (confirming bugs are fixed)
- All **Category B** and **Category C** tests should PASS (confirming no regressions introduced)

### Existing Test File to Update
- `app/__tests__/cycleCalculator.test.ts` — The existing test `'wraps around after cycle completes'` (line 23-29) asserts `getCurrentDayInCycle(30daysAgo, 28) === 3`. This test must be **updated** to expect `31` instead of `3`, reflecting the removal of modulo wrapping. The test name should also be updated to reflect that late periods are no longer wrapped.

### Device Test Environment
- **Primary:** iOS 18 Simulator + Physical iPhone (for HealthKit tests)
- **Languages:** English (default) + Vietnamese (for all i18n tests)
- **Roles:** Moon and Sun (test both for all shared features)
- **Edge Functions:** Deploy to Supabase staging before testing BUG-E cases
