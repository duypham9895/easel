# UX Review: Period Logging & AI Health Insights (EAS-65)

**Reviewer:** UX Designer
**Date:** 2026-03-11
**Components:** PeriodStartButton, PeriodLogSheet, Calendar (predicted vs logged), HealthQuestionnaireSheet
**Status:** Visual review — suggestions only, no implementation changes

---

## 1. PeriodStartButton

**File:** `app/components/moon/PeriodStartButton.tsx` (173 lines)

### What works well
- Fade animation (FadeIn/FadeOut) is smooth and intimate — good UX for a contextual button
- Pill shape (`borderRadius: full`) with subtle shadow — consistent with Easel soft-curve language
- State transition (droplet → check-circle) is clear and intuitive
- 52pt height meets the 44pt minimum tap target
- `accessibilityRole="button"` and `accessibilityLabel` present — VoiceOver ready

### Issues

| # | Severity | Issue | Recommendation |
|---|----------|-------|----------------|
| 1.1 | **Medium** | Button uses `Colors.menstrual` / `Colors.follicular` (Light theme palette) instead of `MoonColors` — Moon always uses dark theme, so these bright colors on `#0D1B2A` background work visually, but are semantically inconsistent with other Moon components that use `MOON.accentPrimary` | Consider using `Colors.menstrual` for the "Period Started" state (it's already the canonical menstrual color) but add a subtle border or glow using `MOON.accentPrimary + '30'` to tie it into Moon's surface language |
| 1.2 | **Low** | `Alert.alert()` is used for confirmation — this is a system dialog that breaks the immersive Moon dark theme | Replace with an in-app confirmation modal using Moon surface colors (`#1A2B3C` bg, `#F0F0FF` text). A custom `ConfirmSheet` bottom sheet would feel more intimate. Lower priority — system Alerts work fine functionally. |
| 1.3 | **Low** | Vietnamese button labels `"Kinh nguyệt đã bắt đầu"` (22 chars) and `"Kinh nguyệt đã kết thúc"` (23 chars) are ~40% longer than English. At `bodyBold` (16px) with `paddingHorizontal: 24`, this should fit on most screens (≥360dp) but may clip on small SE-class devices (320dp). | Add `numberOfLines={1}` and `adjustsFontSizeToFit` to the `Text` or allow the button to wrap gracefully with `flexShrink: 1`. Test on 320dp simulator. |
| 1.4 | **Medium** | No disabled/loading state after tapping confirm. If `addPeriodLog()` takes time (slow network), the user can double-tap. | Add a brief `isSubmitting` guard. Disable the button or show a subtle pulse animation during the async call. |

### Placement (MoonDashboard)
Button renders after `PhaseWheel` at line 170–174 — good visual hierarchy. The PhaseWheel gives context ("you're in day X"), and the button provides the action. Placement is correct.

---

## 2. PeriodLogSheet

**File:** `app/components/moon/PeriodLogSheet.tsx` (300 lines)

### What works well
- Spring animation (`damping: 20, stiffness: 180`) matches other Moon bottom sheets (WhisperSheet uses the same params) — consistent motion language
- Two-card option layout (Start / End) with large 64px icon circles — excellent scanability, zero cognitive load
- Date formatting respects locale (`vi-VN` / `en-US`) — bilingual-ready
- Validation catches future dates, too-far-back, and overlapping periods — comprehensive

### Issues

| # | Severity | Issue | Recommendation |
|---|----------|-------|----------------|
| 2.1 | **High** | No accessibility labels on the two option cards. Screen reader users won't know what the cards do. | Add `accessibilityRole="button"` and `accessibilityLabel={t('periodLog.periodStarted')}` / `accessibilityLabel={t('periodLog.periodEnded')}` to each `TouchableOpacity`. |
| 2.2 | **Medium** | Validation errors use `Alert.alert()` which disrupts the bottom sheet flow — user taps a card, gets a system alert, and the sheet is still visible behind it. | Show validation errors inline below the date header as a subtle red text badge: `<Text style={{ color: SharedColors.error, ...Typography.caption }}>`. Hide the option cards when there's a validation error. |
| 2.3 | **Medium** | The "Period Ended" option card appears even when there's no active period to end. Tapping it falls through to `handleLogStart()` — confusing mental model for the user. | Conditionally dim/disable the "Period Ended" card when `periodLogs.find(log => !log.endDate)` is undefined. Use `opacity: 0.4` and disable touch. Or better: only show the relevant option based on current state. |
| 2.4 | **Low** | Cancel button label `tCommon('maybeLater')` feels non-specific for a period logging action. | Use `tCommon('cancel')` or a softer variant like "Not now" — `maybeLater` implies the app will remind you later, which it doesn't. |
| 2.5 | **Low** | The sheet backdrop uses `MOON.overlay` (`rgba(0,0,0,0.6)`) — appropriate for Moon theme. But the inner `Pressable` on line 178 has no `onStartShouldSetResponder` — taps inside the sheet could propagate to the backdrop dismissal. | The nested `<Pressable>` without `onPress` already stops event propagation in React Native. Verified — this is fine. No change needed. |
| 2.6 | **Medium** | Sheet has no explicit `maxHeight` — on small screens or landscape, the sheet could overflow. | Add `maxHeight: '60%'` to the sheet style, consistent with HealthQuestionnaireSheet's `maxHeight: '85%'`. |

---

## 3. Calendar — Predicted vs Logged Distinction

**File:** `app/app/(tabs)/calendar.tsx` (461 lines)

### Critical gap

The calendar currently shows **only predicted** cycle markers via `buildCalendarMarkers()`. There is **no visual distinction between predicted and actually-logged periods**. When Moon logs a period via PeriodStartButton or PeriodLogSheet, the calendar does not reflect logged data differently from predictions.

| # | Severity | Issue | Recommendation |
|---|----------|-------|----------------|
| 3.1 | **Critical** | No visual difference between predicted period days and logged (confirmed) period days. Users cannot see which periods actually happened vs which are predicted. This undermines trust in the tracking system. | **Two-tier marking system:** Predicted periods → dot markers (current behavior). Logged periods → solid circle fill with a subtle checkmark or different marking style. Use `markingType="multi-dot"` or custom day rendering to layer logged (solid) vs predicted (outline/dot). |
| 3.2 | **High** | Legend has no entry for "Logged Period" — only "Predicted Period" | Add a 5th legend item: `LegendItem color={Colors.menstrual} label={t('periodLogged')}` with a filled circle (vs dot for predicted). Suggest: predicted = outline circle `◯`, logged = filled `●`. |
| 3.3 | **Medium** | Calendar uses Light theme (`Colors.background`, `Colors.card`) but Moon users would expect Moon dark theme on their calendar. | Conditionally apply `MoonColors` when `role === 'moon'`. This is a broader theming task — flag for Frontend. |
| 3.4 | **Low** | `DayDetailSheet` doesn't show whether a period on that day was predicted or logged. | Add a badge in `DayDetailSheet` showing "Predicted" or "Logged ✓" next to the period marker label. |

---

## 4. HealthQuestionnaireSheet

**File:** `app/components/moon/HealthQuestionnaireSheet.tsx` (387 lines)

### What works well
- Clean two-section flow (Stress → Lifestyle) — not overwhelming, quick to complete
- Chip-based selection with border+fill toggle — familiar pattern, low cognitive friction
- Skip option available (`handleSkip`) — respects user autonomy, doesn't force completion
- State resets on close (`useEffect` with `visible`) — clean UX, no stale state on re-open
- Scroll container with `maxHeight: '85%'` — handles small screens gracefully
- Vietnamese strings are well-crafted — warm tone, non-clinical ("Cùng tìm hiểu điều gì đang xảy ra")

### Issues

| # | Severity | Issue | Recommendation |
|---|----------|-------|----------------|
| 4.1 | **High** | Submit button text color is `MOON.textPrimary` (`#F0F0FF` — near-white) on `Colors.menstrual` (`#FF5F7E` — rose) background. WCAG contrast ratio: ~3.2:1. **Fails AA** (requires 4.5:1 for normal text). | Change submit text color to `MOON.white` (`#FFFFFF`) for a 3.9:1 ratio — still borderline. Better: use `MOON.black` or `#1D1D1F` on the rose button for 5.8:1 ratio. Or darken the button to `#E04466` for better contrast with white text. |
| 4.2 | **Medium** | Stress chips use `flex: 1` in a row — Vietnamese labels `"Không hẳn"`, `"Hơi hơi"`, `"Khá nhiều"` are short enough, but if translations get longer, text will truncate. | Add `minHeight: 72` to stress chips and allow `flexWrap: 'wrap'` on labels. Add `numberOfLines={2}` to stress label text. |
| 4.3 | **Medium** | No accessibility labels on stress chips or lifestyle chips. | Add `accessibilityRole="button"` and `accessibilityState={{ selected: isSelected/isActive }}` to each chip `TouchableOpacity`. |
| 4.4 | **Low** | Lifestyle chips use `Feather` icon `"moon"` for sleep — could be confused with the Moon role identity. | Use `"moon"` with a subtle z-index sleep metaphor, or switch to `"sunset"` / `"cloud"` to avoid conceptual collision with the Moon persona. Minor issue. |
| 4.5 | **Low** | The `handleStressSelect` and `handleToggleLifestyle` both trigger `impactMedium()` haptics. Medium haptic on every chip toggle feels heavy — this is a questionnaire, not an action. | Use `impactLight()` for chip toggles. Reserve `impactMedium()` for the submit button. |
| 4.6 | **Medium** | No loading state is shown after submit. After `onComplete(context)` is called, the hook `useCycleHealthInsight` fetches AI data. The questionnaire closes but there's no indication that something is loading. | The loading state belongs to the **parent** component (MoonDashboard or deviation card) that displays the insight result. Ensure the parent shows a skeleton/shimmer card after the questionnaire closes and before the AI result arrives. Flag this for Frontend: "After questionnaire completes, show a gentle loading card with `insight.loadingTitle` and `insight.loadingSubtitle`." |

---

## 5. Cross-Component Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| Moon theme colors | ⚠️ Mixed | PeriodStartButton and Calendar use Light theme colors in a Moon context. PeriodLogSheet and HealthQuestionnaireSheet correctly use `MoonColors`. |
| Bottom sheet animation | ✅ Consistent | All sheets use identical spring params (`damping: 20, stiffness: 180`). |
| Handle bar | ✅ Consistent | All sheets: `width: 40, height: 4, borderRadius: 2, backgroundColor: accentPrimary + '40'`. |
| Sheet border radius | ✅ Consistent | All use `borderTopLeftRadius/Right: Radii.xl` (36px). |
| Typography system | ✅ Consistent | All use `Typography.*` tokens. One deviation: `PeriodLogSheet.dateText` uses raw `fontSize: 18` instead of `Typography.headlineBold` (19px). Minor. |
| Tap targets | ✅ Pass | All interactive elements ≥ 44pt. PeriodStartButton = 52pt, option cards = 64pt icon + padding, chips ≥ 44pt with padding. |
| i18n Vietnamese overflow | ⚠️ Potential | PeriodStartButton labels may clip on 320dp devices. Questionnaire chips are safe. Calendar legend labels are short. |
| Warm non-clinical tone | ✅ Excellent | Vietnamese copy is empathetic: "Mỗi cơ thể có nhịp điệu riêng", "Cùng tìm hiểu điều gì đang xảy ra". English copy follows same tone. Doctor nudge is gentle, not alarming. |
| Loading/Empty/Error states | ⚠️ Partial | HealthInsight hook has fallback + error states. But no loading indicator between questionnaire close and AI result display. PeriodLogSheet has no loading state during `addPeriodLog`. |
| Haptics | ⚠️ Inconsistent | All components use `impactMedium()` for everything. Should differentiate: `impactLight` for selections, `impactMedium` for confirms, `notificationSuccess` for completions (PeriodStartButton already does this correctly). |

---

## 6. Priority Summary

### Must Fix (before release)
1. **3.1** — Predicted vs logged period distinction on calendar (critical trust issue)
2. **4.1** — Submit button contrast ratio fails WCAG AA
3. **2.1** — Missing accessibility labels on PeriodLogSheet option cards

### Should Fix
4. **3.2** — Add "Logged Period" to calendar legend
5. **2.3** — Disable "Period Ended" card when no active period exists
6. **1.4** — Add double-tap guard on PeriodStartButton
7. **4.3** — Add accessibility labels on questionnaire chips
8. **2.2** — Inline validation errors instead of Alert.alert()
9. **4.6** — Loading state between questionnaire and AI result
10. **2.6** — Add maxHeight to PeriodLogSheet

### Nice to Have
11. **1.2** — Replace system Alerts with themed confirmation sheets
12. **1.3** — Test Vietnamese button labels on 320dp devices
13. **3.3** — Moon dark theme on calendar
14. **4.4** — Sleep icon collision with Moon persona
15. **4.5** — Lighter haptics for chip toggles
