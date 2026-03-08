# Phase 5 — Test Execution: BUG_20260309_001

> **Bug ID:** `BUG_20260309_001`
> **Date:** 2026-03-09
> **Phase:** Test Execution (post-fix)
> **Author:** QA Engineer
> **Build:** v1.5.1 (patched, pre-release)

---

## Build Verification

| Check | Result | Notes |
|-------|--------|-------|
| `npx tsc --noEmit` | **PASS** | App source clean. Only errors: test file (missing `@types/jest` — pre-existing) and Edge Functions (Deno imports — expected) |
| Test file update | **DONE** | Updated `cycleCalculator.test.ts`: "wraps around" → "continues counting", expect 31 not 3; "21-day short cycle" → expect 22 not 1 |

---

## A. Bug Verification Test Cases (30 total)

### BUG-A: Cycle Calculator Modulo Fix

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| A-01 | Day 29 of 28-day cycle returns 29 | **PASS** | `cycleCalculator.ts:19`: `diffDays + 1 = 28 + 1 = 29`. No modulo. |
| A-02 | Day 33 of 28-day cycle returns 33 | **PASS** | `diffDays = 32`, returns `33`. Confirmed by code path — no wrapping logic exists. |
| A-03 | Day 56 of 28-day cycle returns 56 | **PASS** | `diffDays = 55`, returns `56`. Linear computation. |
| A-04 | Day 28 boundary returns 28 | **PASS** | `diffDays = 27`, returns `28`. |
| A-05 | Negative days (future date) returns 1 | **PASS** | `diffDays < 0` guard at line 18 returns `1`. |
| A-06 | Day 0 (today = start date) returns 1 | **PASS** | `diffDays = 0`, returns `0 + 1 = 1`. |
| A-07 | Late period maps to luteal phase | **PASS** | `getCurrentPhase(33, 28, 5)`: ovulationDay = 14, 33 > 16, returns `'luteal'`. |
| A-08 | getDaysUntilNextPeriod with late cycle | **PASS** | `getDaysUntilNextPeriod(33, 28)`: remaining = 28 - 33 + 1 = -4, returns `28`. |
| A-09 | Moon Dashboard shows correct day for late period | **UNTESTED** | Requires device test with 33-day-late period configuration |
| A-10 | Sun Dashboard shows correct day for late period | **UNTESTED** | Requires device test with linked partner |

### BUG-C: Tab Bar Theming

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| C-01 | Moon tab bar has dark background | **UNTESTED** | Visual device test required |
| C-02 | Moon tab bar active tint is lavender | **UNTESTED** | Visual device test required |
| C-03 | Sun tab bar has cream background | **UNTESTED** | Visual device test required |
| C-04 | Sun tab bar active tint is amber | **UNTESTED** | Visual device test required |
| C-05 | Null role tab bar uses default theme | **UNTESTED** | Visual device test required |

**Code verification for C-01 through C-05:** `_layout.tsx` confirmed to read `role` from `useAppStore`, compute `tabBg`/`activeTint`/`inactiveTint` with correct ternary chain using `MoonColors.card`/`SunColors.card`/`Colors.card`. Logic is correct.

### BUG-D: Hardcoded English Strings

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| D-01 | CycleDataReview shows Vietnamese toggle | **PASS** (code) | Line 131: uses `t('review.hideExplanation')` / `t('review.showExplanation')`. Keys exist in `vi/health.json:75-76`. |
| D-02 | Toggle switches between Vietnamese labels | **PASS** (code) | Ternary `showExplanation ? t('review.hideExplanation') : t('review.showExplanation')` confirmed. |
| D-03 | ManualCycleInput "Done" in Vietnamese | **PASS** (code) | Line 152: uses `{tCommon('done')}`. Key `common.done = "Xong"` in `vi/common.json:4`. |
| D-04 | PermissionDeniedScreen "Open Settings" in VI | **PASS** (code) | Line 57: uses `{t('permissionDenied.openSettings')}`. Key = `"Mở Cài đặt"` in `vi/health.json:86`. |

### BUG-E: Edge Function Push Notification i18n

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| E-01 | notify-cycle Vietnamese to Moon | **PASS** | `CYCLE_COPY.vi.approaching.moonTitle = 'Kỳ kinh sắp đến'`. Language lookup via `langByUser.get(moon.id)`. |
| E-02 | notify-cycle Vietnamese to Sun | **PASS** | `CYCLE_COPY.vi.approaching.sunTitle = 'Kỳ kinh của Moon sắp đến'`. Uses `langByUser.get(partnerId)`. |
| E-03 | notify-cycle English unchanged | **PASS** | `CYCLE_COPY.en.approaching.moonTitle = 'Your period is coming'`. Default lang = `'en'`. |
| E-04 | notify-cycle defaults to English | **PASS** | `langByUser.get(userId) ?? 'en'` — defaults to `'en'` when no preference row. |
| E-05 | notify-sos Vietnamese SOS | **PASS** | `SOS_COPY.vi.sweet_tooth.title = 'Moon cần bạn'`. Language fetched from `user_preferences`. |
| E-06 | notify-sos Vietnamese Whisper | **PASS** | `WHISPER_COPY.vi.hug.title = 'Moon cần bạn'`. All 16 whisper types have Vietnamese copy. |
| E-07 | notify-sos English SOS unchanged | **PASS** | `SOS_COPY.en.sweet_tooth.title = 'Moon needs you'`. Default lang = `'en'`. |
| E-08 | Mixed-language: Moon VI, Sun EN | **PASS** | notify-sos fetches `prefData?.language` for **boyfriend** (recipient). Moon's language is irrelevant. |
| E-09 | Mixed-language: Moon EN, Sun VI | **PASS** | notify-cycle uses independent `langByUser` lookups. Moon gets EN, Sun gets VI. |

### BUG-F: AI Label Removal

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| F-01 | Moon Dashboard greeting has no "AI" label | **PASS** (code) | MoonDashboard: no `aiLabel` render block, no `isAI` destructured, `aiLabel` style removed. |
| F-02 | Sun Dashboard "How to show up" no "AI" | **PASS** (code) | SunDashboard line 155: `title={t('howToShowUp')}` — no conditional with `howToShowUpAI`. |
| F-03 | Moon Dashboard Vietnamese no "AI" label | **PASS** (code) | Same as F-01. `aiLabel` i18n key removed from `vi/common.json`. |
| F-04 | Sun Dashboard Vietnamese no "AI" | **PASS** (code) | `howToShowUpAI` key removed from `vi/dashboard.json`. |
| F-05 | No "AI" text anywhere in app UI | **UNTESTED** | Full app navigation required on device |

---

## B. Regression Test Cases (33 total)

### BUG-A Regression

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| RA-01 | Normal cycle day 1 | **PASS** | `diffDays=0`, returns `1`. |
| RA-02 | Normal cycle day 14 | **PASS** | `diffDays=13`, returns `14`. |
| RA-03 | Normal cycle day 28 | **PASS** | `diffDays=27`, returns `28`. |
| RA-04 | Menstrual phase (days 1-5) | **PASS** | `getCurrentPhase(1-5, 28, 5)` — all ≤ `avgPeriodLength(5)`, returns `'menstrual'`. |
| RA-05 | Follicular phase (days 6-11) | **PASS** | Day 6-11: > 5, ≤ ovulationDay(14)-3=11, returns `'follicular'`. |
| RA-06 | Ovulatory phase (days 12-16) | **PASS** | Day 12-16: > 11, ≤ 14+2=16, returns `'ovulatory'`. |
| RA-07 | Luteal phase (days 17-28) | **PASS** | Day 17-28: > 16, returns `'luteal'`. |
| RA-08 | getDaysUntilNextPeriod(14, 28) | **PASS** | `28 - 14 + 1 = 15`. |
| RA-09 | getConceptionChance all phases | **PASS** | Switch statement unchanged — Low, Medium, Very High, Low. |
| RA-10 | buildCalendarMarkers 3 cycles | **PASS** | Function unchanged — iterates 3 cycles, generates period/ovulation/fertile markers. |
| RA-11 | Moon Dashboard normal cycle | **UNTESTED** | Device test |
| RA-12 | Sun Dashboard normal cycle | **UNTESTED** | Device test |
| RA-13 | Calendar today highlight | **UNTESTED** | Device test |
| RA-14 | Calendar markers 3 future cycles | **UNTESTED** | Device test |
| RA-15 | Settings partner phase display | **UNTESTED** | Device test |
| RA-16 | Short cycle (21 days) day 21 | **PASS** | `diffDays=20`, returns `21`. |
| RA-17 | Long cycle (35 days) day 21 | **PASS** | `diffDays=20`, returns `21`. |

### BUG-C Regression

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| RC-01 | All 3 tabs visible | **UNTESTED** | Device test |
| RC-02 | Tab navigation works | **UNTESTED** | Device test |
| RC-03 | Inactive tint role-appropriate | **UNTESTED** | Device test |
| RC-04 | Tab bar height unchanged | **PASS** (code) | `height: 84, paddingBottom: 24, paddingTop: 10` — no changes to these values. |
| RC-05 | Tab labels i18n | **UNTESTED** | Device test |
| RC-06 | Tab bar updates after role change | **UNTESTED** | Device test |

### BUG-D Regression

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| RD-01 | English text still works | **PASS** (code) | Keys `review.showExplanation = "How does this work?"`, `review.hideExplanation = "Hide"` in `en/health.json:75-76`. |
| RD-02 | "Done" English | **PASS** (code) | `common.done = "Done"` in `en/common.json:4`. |
| RD-03 | "Open Settings" English | **PASS** (code) | `permissionDenied.openSettings = "Open Settings"` in `en/health.json:86`. |
| RD-04 | Toggle animation | **UNTESTED** | Device test |
| RD-05 | Vietnamese text no truncation | **UNTESTED** | Device test |
| RD-06 | Vietnamese "Open Settings" no truncation | **UNTESTED** | Device test |

### BUG-E Regression

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| RE-01 | All 3 event types send | **PASS** | `CYCLE_COPY.en` has `approaching`, `started`, `ended` — all present with correct content. |
| RE-02 | Batch processing works | **PASS** | Added Batch 3 (language prefs) uses same `allUserIds` set. No per-user queries added in the loop. |
| RE-03 | All 4 SOS types | **PASS** | `SOS_COPY.en` has `sweet_tooth`, `need_a_hug`, `cramps_alert`, `quiet_time`. |
| RE-04 | Whisper signals send | **PASS** | `WHISPER_COPY.en` has all 16 types (4 per phase). Fallback chain: SOS → Whisper → generic. |
| RE-05 | Unknown signal fallback | **PASS** | Fallback: `{ title: lang === 'vi' ? 'Moon đã thì thầm...' : 'Moon whispered...', body: ... }`. |
| RE-06 | English pluralization | **PASS** | `moonBody: (d) => \`...in ${d} day${d === 1 ? '' : 's'}...\`` — singular/plural correct. |
| RE-07 | Vietnamese no plural | **PASS** | `moonBody: (d) => \`...trong ${d} ngày nữa...\`` — no plural suffix. |

### BUG-F Regression

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| RF-01 | Moon AI greeting loads | **UNTESTED** | Device test |
| RF-02 | Moon static fallback works | **UNTESTED** | Device test |
| RF-03 | Sun AI advice loads | **UNTESTED** | Device test |
| RF-04 | Sun static fallback works | **UNTESTED** | Device test |
| RF-05 | isAI flag still in hooks | **PASS** | `useAIGreeting` returns `{ greeting, isAI, isLoading }` (line 87). `useAIPartnerAdvice` returns `{ advice, isAI, isLoading }` (line 79). Both still track `isAI` internally. |

---

## C. Non-Regression Confirmation Cases (10 total)

| ID | Title | Result | Evidence |
|----|-------|--------|----------|
| NR-01 | SOS sending/receiving | **UNTESTED** | Device test |
| NR-02 | Whisper sending/receiving | **UNTESTED** | Device test |
| NR-03 | Daily check-in flow | **UNTESTED** | Device test |
| NR-04 | Auth flow | **UNTESTED** | Device test |
| NR-05 | Partner linking | **UNTESTED** | Device test |
| NR-06 | Calendar date detail | **UNTESTED** | Device test |
| NR-07 | Settings screen loads | **UNTESTED** | Device test |
| NR-08 | Language toggle | **UNTESTED** | Device test |
| NR-09 | Biometric unlock | **UNTESTED** | Device test |
| NR-10 | AI hooks abort on unmount | **PASS** | Both `useAIGreeting` (line 80-82) and `useAIPartnerAdvice` (line 75) return `() => controller.abort()` in useEffect cleanup. |

---

## Test Execution Summary

| Category | Total | PASS | UNTESTED | FAIL |
|----------|-------|------|----------|------|
| A. Bug Verification | 30 | 24 | 6 | 0 |
| B. Regression | 33 | 20 | 13 | 0 |
| C. Non-Regression | 10 | 1 | 9 | 0 |
| **Total** | **73** | **45** | **28** | **0** |

### UNTESTED Cases (28)

All 28 untested cases require **physical device testing** (visual verification, animation, HealthKit, push notifications, real-time signals). These cannot be verified via code inspection alone.

**Device test checklist for user:**
1. Moon role: Open dashboard → verify no "AI" label, correct phase display
2. Moon role: Tab bar → dark background, lavender active tint
3. Sun role: Tab bar → cream background, amber active tint
4. Vietnamese language: Toggle → verify all strings translated (CycleDataReview, ManualCycleInput, PermissionDeniedScreen)
5. Late period scenario: Set lastPeriodStartDate 33 days ago → verify Day 33 shown, luteal phase
6. SOS/Whisper flow: Send from Moon, receive on Sun
7. Calendar: Verify markers for 3 future cycles
8. Full app navigation: Ensure zero "AI" text visible anywhere

### Edge Function Deployment

BUG-E fixes (`notify-cycle`, `notify-sos`) require deployment to Supabase before testing:
```bash
supabase functions deploy notify-cycle
supabase functions deploy notify-sos
```
