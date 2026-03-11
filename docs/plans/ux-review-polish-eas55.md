# UX Review + Polish Spec — EAS-55

> Parent: [EAS-40] FEAT: Manual Period Logging + Cycle Recalculation + AI Health Insights
> Author: UX Designer | Date: 2026-03-11

---

## 1. Calendar Visual Polish

### 1.1 Legend Accessibility

**Current:** Legend dots and labels have no semantic roles.
**Spec:**

| Element | accessibilityRole | accessibilityLabel |
|---------|------------------|--------------------|
| Legend container | `"header"` | `"Cycle phase legend"` |
| Each legend item | `"text"` | `"{phase} phase — {color description}"` |

### 1.2 Calendar Cell Descriptions

**Current:** Calendar day cells have no accessibility labels.
**Spec:** Each marked date cell must include:

```
accessibilityLabel={`${formattedDate}, ${phaseName} phase, cycle day ${dayNumber}`}
accessibilityRole="button"
accessibilityHint="Double tap to view day details"
```

### 1.3 Day Detail Sheet Transition

**Current:** `animationType="slide"` — abrupt iOS slide.
**Spec:** Replace with spring animation matching SOSSheet/WhisperSheet pattern:

| Property | Value |
|----------|-------|
| Type | `Animated.spring` |
| Damping | `20` |
| Stiffness | `180` |
| useNativeDriver | `true` |
| Direction | Slide up from bottom |

### 1.4 Close Button

**Current:** Has `hitSlop` but no accessibility props.
**Spec:**

```
accessibilityRole="button"
accessibilityLabel={t('close')}
accessibilityHint="Dismiss day details"
```

### 1.5 Logged vs. Predicted Period Distinction

For the new period logging feature, calendar marks need visual differentiation:

| State | Fill | Border | Opacity |
|-------|------|--------|---------|
| **Logged period** | Solid `#FF5F7E` | None | `1.0` |
| **Predicted period** | `#FF5F7E` + `'22'` | 1px dashed `#FF5F7E` | `0.5` |
| **Today** | Phase color | 2px pulsing ring (see 1.6) | `1.0` |

### 1.6 Today Pulsing Ring

**Animation:**

| Property | Value |
|----------|-------|
| Type | `Animated.loop(Animated.sequence)` |
| Scale | `1.0 → 1.12 → 1.0` |
| Duration | `1400ms` per cycle |
| Easing | `Easing.inOut(Easing.ease)` |
| useNativeDriver | `true` |
| Ring color | Current phase color at `55` opacity |
| Ring width | `2px` |

### 1.7 Date Selection Haptic

**Current:** No haptic on calendar date tap.
**Spec:** `impactLight()` on date selection — subtle, non-intrusive.

---

## 2. Bottom Sheet Animation Specs

### 2.1 Shared Sheet Pattern

All bottom sheets (SOSSheet, WhisperSheet, future PeriodLogSheet, HealthInsightSheet) must follow this animation pattern:

| Phase | Type | Config |
|-------|------|--------|
| **Enter** | `Animated.spring` | `damping: 20, stiffness: 180, useNativeDriver: true` |
| **Exit** | `Animated.timing` | `duration: 280, useNativeDriver: true` |
| **Backdrop** | `Animated.timing` | `duration: 250, opacity: 0 → 0.5` |

Sheet dimensions:

| Property | Value | Token |
|----------|-------|-------|
| Top border radius | `36px` | `Radii.xl` |
| Handle width | `40px` | — |
| Handle height | `4px` | — |
| Handle radius | `2px` | — |
| Handle color | `textHint` at `40%` opacity | — |
| Handle top margin | `12px` | — |
| Header padding | `24px` horizontal | `Spacing.lg` |
| Content padding | `16px` horizontal | `Spacing.md` |

### 2.2 Option Card Press Animation

**Current:** `activeOpacity={0.85}` only — no scale or color feedback.
**Spec:** Add micro-interaction on press:

| Property | Rest | Pressed | Duration |
|----------|------|---------|----------|
| Scale | `1.0` | `0.97` | `100ms` spring |
| Background opacity | `+ '18'` | `+ '28'` | `100ms` |
| Haptic | — | `impactMedium()` | — |

Use `Animated.spring` with `damping: 15, stiffness: 300` for snappy feel.

### 2.3 Success State Enhancement (WhisperSheet)

**Current:** Check opacity fades in 350ms + pulse loop.
**Spec — Enhanced sequence:**

| Step | Animation | Duration | Delay |
|------|-----------|----------|-------|
| 1 | Check mark scale `0 → 1.15 → 1.0` | `400ms` spring | `0ms` |
| 2 | Check opacity `0 → 1` | `300ms` timing | `0ms` |
| 3 | Success text fade in | `250ms` timing | `200ms` |
| 4 | Pulse loop starts | `700ms` per cycle | `400ms` |
| 5 | Haptic `notificationSuccess()` | — | `0ms` |

### 2.4 Sheet Handle Accessibility

All sheet handles must include:

```
accessibilityRole="adjustable"
accessibilityLabel="Sheet handle — swipe down to dismiss"
```

---

## 3. Accessibility Audit — Required Fixes

### 3.1 Priority 1 — Interactive Elements (CRITICAL)

Every pressable card in SOSSheet and WhisperSheet:

```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel={t(`${option.id}_title`)}
  accessibilityHint={t(`${option.id}_hint`)}  // e.g., "Send sweet tooth signal to your partner"
  accessibilityState={{ selected: selectedId === option.id }}
>
```

### 3.2 Priority 1 — Text Inputs

WhisperSheet custom input:

```tsx
<TextInput
  accessibilityLabel={t('customWhisperInput')}
  accessibilityHint={t('customWhisperInputHint')}  // "Type a custom message to send"
/>
```

Send button (icon-only):

```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel={t('sendCustomWhisper')}
>
```

### 3.3 Priority 1 — Cancel/Close Buttons

All cancel and close buttons across sheets:

```tsx
accessibilityRole="button"
accessibilityLabel={t('cancel')}  // or t('close')
```

### 3.4 Priority 2 — Section Headers

"WHAT'S HAPPENING" in calendar, category labels in sheets:

```tsx
accessibilityRole="header"
```

### 3.5 Priority 2 — Contrast Validation

| Element | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| Menstrual text on card | `#FF5F7E` | `#FFFFFF` | ~3.5:1 | FAIL AA |
| Cancel text (Moon) | `#6B7A8C` | `#1A2B3C` | ~2.8:1 | FAIL AA |
| Follicular badge | `#70D6FF` | `#FFFFFF` | ~2.1:1 | FAIL AA |

**Fix:** Phase colors should only be used as decorative fills/dots, not as standalone text. For text labels, use `textPrimary` or `textSecondary` alongside a phase-colored dot/icon.

Cancel button text: upgrade from `textHint` to `textSecondary` (`#A0AEC0` on Moon, `#4B4B4B` on Sun).

---

## 4. Haptic Feedback Specification

### 4.1 Expand haptics.ts

Add these functions to `app/utils/haptics.ts`:

| Function | expo-haptics Type | Use Case |
|----------|------------------|----------|
| `impactLight()` | `ImpactFeedbackStyle.Light` | Calendar date tap, toggle switches |
| `impactMedium()` | `ImpactFeedbackStyle.Medium` | Option card press (already exists) |
| `notificationSuccess()` | `NotificationFeedbackType.Success` | Send whisper/SOS (already exists) |
| `notificationWarning()` | `NotificationFeedbackType.Warning` | Period deviation detected |
| `notificationError()` | `NotificationFeedbackType.Error` | Failed action |
| `selectionChanged()` | `selectionAsync()` | Phase selector, tab switch |

### 4.2 Haptic Mapping by Interaction

| Interaction | Haptic | Component |
|------------|--------|-----------|
| Calendar date tap | `impactLight()` | Calendar tab |
| SOS option card press | `impactMedium()` | SOSSheet |
| Whisper option card press | `impactMedium()` | WhisperSheet |
| Whisper/SOS sent | `notificationSuccess()` | SOSSheet, WhisperSheet |
| Period logged | `notificationSuccess()` | PeriodLogSheet (new) |
| Period deviation alert | `notificationWarning()` | HealthInsightSheet (new) |
| Bottom sheet open | `impactLight()` | All sheets |
| Toggle switch | `selectionChanged()` | Settings |

---

## 5. Design System Enhancements (theme.ts)

### 5.1 Animation Presets

```typescript
export const AnimationPresets = {
  sheetEnter: { damping: 20, stiffness: 180 },
  sheetExit: { duration: 280 },
  cardPress: { damping: 15, stiffness: 300 },
  pulse: { duration: 700 },
  fadeIn: { duration: 250 },
} as const;
```

### 5.2 Opacity Tokens

```typescript
export const OpacityHex = {
  '5': '0D',
  '10': '1A',
  '15': '26',
  '20': '33',
  '30': '4D',
  '40': '66',
  '50': '80',
} as const;
```

**Usage:** Replace hardcoded `+ '18'`, `+ '22'`, `+ '55'` with `+ OpacityHex['10']`, etc.

### 5.3 Shadow Presets

```typescript
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;
```

---

## 6. New Component Specs (for EAS-40 Feature)

### 6.1 PeriodLogSheet

Follow WhisperSheet pattern:

| Property | Value |
|----------|-------|
| Radius | `Radii.xl` (36px) |
| Background | Moon: `#1A2B3C`, Sun: n/a (Moon-only) |
| Title | `"Log Period"` — 22px bold |
| Options | "Period Started" / "Period Ended" — 2 cards, full width |
| Card radius | `Radii.lg` (28px) |
| Card icon bg | `#FF5F7E` + `OpacityHex['15']` |
| Haptic on log | `notificationSuccess()` |
| Animation | Standard sheet enter/exit (see 2.1) |

### 6.2 HealthInsightSheet

| Property | Value |
|----------|-------|
| Radius | `Radii.xl` (36px) |
| Background | Moon: `#1A2B3C` |
| Title | `"Your cycle shifted"` — 22px bold |
| Subtitle | `"Let's understand why"` — 16px, `textSecondary` |
| Content | Lifestyle question cards (stress, sleep, exercise, diet) |
| Card layout | 2-column grid, `Spacing.md` (16px) gap |
| Card radius | `Radii.lg` (28px) |
| Submit button | Full width, `accent` bg, `Radii.md` (20px) |
| Haptic on open | `notificationWarning()` (signals attention needed) |
| AI insight area | Card with `Radii.md`, subtle `Shadows.sm`, body text |
| AI label | `"Personalized insight"` — NOT "AI-generated" |

---

## 7. Implementation Priority

| Priority | Task | Effort | Owner |
|----------|------|--------|-------|
| **P0** | Accessibility labels on all interactive elements | Medium | Frontend |
| **P0** | Contrast fixes (phase color text → dot+text) | Low | Frontend |
| **P1** | Option card press animation | Low | Frontend |
| **P1** | Calendar date haptic feedback | Low | Frontend |
| **P1** | Expand haptics.ts with new types | Low | Frontend |
| **P1** | Day detail sheet spring animation | Low | Frontend |
| **P2** | Animation/opacity/shadow presets in theme.ts | Medium | Frontend |
| **P2** | Whisper success state enhanced sequence | Low | Frontend |
| **P2** | Input focus ring styling | Low | Frontend |
| **P3** | Cancel button contrast improvement | Low | Frontend |
| **P3** | Today pulsing ring animation | Low | Frontend |

---

## 8. Design Principles Verification

| Principle | Status | Notes |
|-----------|--------|-------|
| **Intimate** (soft curves) | PASS | All radii use 12-36px, consistent curves |
| **Trustworthy** (clear hierarchy) | PASS | Good type scale, consistent spacing |
| **Couples-first** | PASS | Moon/Sun theme separation maintained |
| **Asymmetric** (Moon reflective, Sun actionable) | PASS | Sheets correctly themed per role |
| **Warm & human** | NEEDS WORK | Cancel buttons too subtle, contrast issues |
| **Accessible** | FAIL | Missing labels, roles, hints across all sheets |
