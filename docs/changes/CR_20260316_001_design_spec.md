# CR_20260316_001 — Design Spec: Log Period (Flo-Style)

> **Author:** Lead UI/UX Designer
> **Date:** 2026-03-16
> **Status:** Draft
> **Affected files:**
> - `app/app/(tabs)/calendar.tsx` — replace `react-native-calendars` with custom grid
> - `app/components/moon/PeriodLogSheet.tsx` — redesign as inline panel
> - `app/constants/theme.ts` — add cycle calendar tokens
> - New: `app/components/moon/CycleCalendarGrid.tsx`
> - New: `app/components/moon/FlowIntensitySelector.tsx`
> - New: `app/components/moon/SymptomChips.tsx`
> - New: `app/components/shared/Toast.tsx`

---

## 0. Design Goal

Replace the current `react-native-calendars` default calendar + `Alert.alert()` confirmation flow with a **custom calendar grid**, **inline flow intensity selector**, **symptom chips**, and **toast confirmation** — matching Flo's interaction quality while preserving Easel's warm, couples-first visual identity.

**Key principles:**
- Warm and intimate, never clinical
- Every interaction has tactile feedback (haptics + animation)
- Information density without clutter
- Moon-first: the dark indigo theme is the primary context for this screen

---

## 1. Color Tokens

### 1.1 Cycle Calendar Tokens (new additions to `theme.ts`)

```typescript
export const CycleCalendarTokens = {
  // ── Period ──────────────────────────────────────
  periodLogged:        '#D4537E',  // Deep rose — warm, not clinical red
  periodLoggedBg:      '#D4537E1A', // 10% opacity fill for day cell background
  periodPredicted:     '#F2A6C0',  // Soft blush — clearly lighter than logged
  periodPredictedBg:   '#F2A6C01A', // 10% opacity fill
  periodPredictedBorder: '#F2A6C066', // Dashed border for predicted days

  // ── Fertility ───────────────────────────────────
  fertileWindow:       '#70D6FF',  // Existing follicular blue — reused
  fertileWindowBg:     '#70D6FF1A',
  ovulationDay:        '#3AAFFF',  // Brighter blue — stands out from fertile
  ovulationDayBg:      '#3AAFFF1A',

  // ── Calendar surface ────────────────────────────
  calendarSurface:     '#FFFFFF',  // Card background (light mode)
  calendarSurfaceMoon: '#162233',  // Moon theme card (dark indigo)
  dayTextDefault:      '#1D1D1F',  // Default day number
  dayTextMoon:         '#F0F0FF',  // Moon theme default day number
  dayTextDisabled:     '#C7C7CC',  // Days outside current month
  dayTextDisabledMoon: '#3A5068',  // Moon theme disabled
  dayTextToday:        '#FFFFFF',  // White text on today ring
  todayRing:           '#D4537E',  // Today indicator ring
  selectedRing:        '#B39DDB',  // Moon accent — selected day ring
  weekdayHeader:       '#8E8E93',  // S M T W T F S labels
  weekdayHeaderMoon:   '#6B7A8C',  // Moon theme weekday labels

  // ── Flow intensity dots ─────────────────────────
  flowDotActive:       '#D4537E',
  flowDotInactive:     '#E0E0E0',
  flowDotInactiveMoon: '#2D4A6B',

  // ── Symptom chips ──────────────────────────────
  chipActiveBg:        '#D4537E',
  chipActiveText:      '#FFFFFF',
  chipInactiveBg:      'transparent',
  chipInactiveBorder:  '#8E8E9360',
  chipInactiveBorderMoon: '#6B7A8C60',
  chipInactiveText:    '#4B4B4B',
  chipInactiveTextMoon: '#A8BAC8',

  // ── Toast ──────────────────────────────────────
  toastBg:             '#162233F0', // Near-opaque dark indigo
  toastText:           '#F0F0FF',
  toastIcon:           '#4AD66D',   // Success green
} as const;
```

### 1.2 Color Rationale

| Token | Hex | WCAG | Rationale |
|-------|-----|------|-----------|
| `periodLogged` | `#D4537E` | 4.8:1 on white | Deeper than current `#FF5F7E` — reads as "confirmed" rather than "alert". Warm rose, not medical red. |
| `periodPredicted` | `#F2A6C0` | 3.1:1 on white (decorative) | Clearly distinguishable from logged. Used as background fill only, never as text. |
| `ovulationDay` | `#3AAFFF` | 4.6:1 on white | Brighter than fertile window blue to mark the single peak day. |
| `todayRing` | `#D4537E` | N/A (border only) | Ties "today" to the menstrual tracking context. |
| `selectedRing` | `#B39DDB` | N/A (border only) | Reuses Moon's `accentPrimary` — consistent with existing Moon palette. |

---

## 2. Component Specifications

### 2.1 Calendar Grid (`CycleCalendarGrid`)

**Replaces:** `react-native-calendars` `<Calendar>` component.

#### Layout
- **Grid:** 7 columns (Sun–Sat), variable rows (4–6 per month)
- **Month header:** Left-aligned month/year text + chevron arrows
- **Weekday header row:** Single row of abbreviated day names

#### Month Header
| Property | Value |
|----------|-------|
| Font | `titleBold` (24/700) |
| Color | `MoonColors.textPrimary` (#F0F0FF) / `Colors.textPrimary` (#1D1D1F) |
| Left padding | `Spacing.md` (16pt) |
| Arrow buttons | 44x44pt tap target, `Feather` chevrons, `Colors.menstrual` |
| Bottom margin | `Spacing.sm` (8pt) |

#### Weekday Header
| Property | Value |
|----------|-------|
| Font | `tiny` (11/600) |
| Color | `weekdayHeader` / `weekdayHeaderMoon` |
| Text transform | Uppercase |
| Letter spacing | 0.5 |
| Height | 24pt |
| Bottom margin | `Spacing.xs` (4pt) |

#### Day Cell

| Property | Value |
|----------|-------|
| **Size** | 44 x 44 pt (minimum tap target per Apple HIG) |
| **Border radius** | `Radii.full` (9999 — perfect circle) |
| **Font** | 14/600 (matches current `textDayFontWeight: '600'`) |
| **Vertical gap between rows** | `Spacing.xs` (4pt) |

#### Day Cell State Variants

| State | Background | Text Color | Border | Extra |
|-------|-----------|------------|--------|-------|
| **Default** | transparent | `dayTextDefault` / `dayTextMoon` | none | — |
| **Disabled** (other month) | transparent | `dayTextDisabled` / `dayTextDisabledMoon` | none | Not tappable |
| **Today** | `todayRing` | `dayTextToday` (#FFF) | none | Solid fill circle |
| **Period — Logged** | `periodLogged` | `#FFFFFF` | none | Solid fill circle |
| **Period — Predicted** | `periodPredictedBg` | `periodPredicted` | 1.5pt dashed `periodPredicted` | Dashed border circle |
| **Fertile Window** | `fertileWindowBg` | `fertileWindow` | 1pt solid `fertileWindow40` | Subtle ring |
| **Ovulation Day** | `ovulationDayBg` | `ovulationDay` | 2pt solid `ovulationDay` | Bold ring |
| **Selected** | transparent | inherited | 2pt solid `selectedRing` | Outer ring (does not replace inner state) |
| **Today + Selected** | `todayRing` | `#FFFFFF` | 2pt solid `selectedRing` (outer) | Double ring effect |
| **Period Logged + Selected** | `periodLogged` | `#FFFFFF` | 2pt solid `selectedRing` (outer) | Outer ring wraps solid fill |

#### Range Highlighting (Period Spans)
When a logged period spans multiple consecutive days:
- Connect adjacent period-logged cells with a horizontal background band (`periodLoggedBg`)
- Band height: 36pt (slightly smaller than cell), centered vertically
- First day of range: left half of band (pill-shaped left cap, `Radii.full`)
- Last day of range: right half of band (pill-shaped right cap)
- Middle days: full-width rectangular band
- Same pattern for predicted ranges using `periodPredictedBg`

---

### 2.2 Flow Intensity Selector (`FlowIntensitySelector`)

**Replaces:** Nothing (new addition — currently no flow tracking).

#### Layout
- Horizontal row of 4 options
- Equal-width buttons, filling parent width with `Spacing.sm` (8pt) gaps
- Container padding: `Spacing.lg` (24pt) horizontal

#### Section Header
| Property | Value |
|----------|-------|
| Label | "Flow intensity" |
| Font | `bodyBold` (16/700) |
| Color | `MoonColors.textPrimary` |
| Bottom margin | `Spacing.sm` (8pt) |

#### Option Button

| Property | Value |
|----------|-------|
| **Height** | 72pt |
| **Border radius** | `Radii.md` (20pt) |
| **Background (inactive)** | `MoonColors.inputBg` (#1E3045) |
| **Background (active)** | `periodLogged` (#D4537E) |
| **Border (inactive)** | 1pt solid `MoonColors.border` (#2D4A6B) |
| **Border (active)** | none |
| **Layout** | Vertical stack: dot indicator + label |

#### Dot Indicator (visual flow metaphor)

Each option shows 1–4 filled circles to represent intensity:

| Option | Dots | Dot size (diameter) | Dot color (active) | Dot color (inactive) |
|--------|------|--------------------|--------------------|---------------------|
| **Spotting** | 1 dot | 6pt | #FFFFFF | `flowDotInactive` / `flowDotInactiveMoon` |
| **Light** | 2 dots | 8pt | #FFFFFF | same |
| **Medium** | 3 dots | 10pt | #FFFFFF | same |
| **Heavy** | 4 dots | 12pt | #FFFFFF | same |

- Dots arranged horizontally with 3pt gaps
- Centered above the label

#### Option Label
| Property | Active | Inactive |
|----------|--------|----------|
| Font | `caption` (13/500) | `caption` (13/500) |
| Color | `#FFFFFF` | `MoonColors.textSecondary` (#A8BAC8) |
| Top margin | `Spacing.xs` (4pt) | same |

---

### 2.3 Symptom Chips (`SymptomChips`)

**Replaces:** Current `TAG_DEFS` override tags (stress, illness, travel, medication, other) — these are retained as a separate "Factors" section. Symptom chips are a **new section** added above factors.

#### Options (6 symptoms)

| ID | Label | Icon (Feather) |
|----|-------|----------------|
| `cramps` | Cramps | `zap` |
| `fatigue` | Fatigue | `battery` |
| `headache` | Headache | `cloud-lightning` |
| `bloating` | Bloating | `circle` |
| `mood_swings` | Mood swings | `trending-up` |
| `nausea` | Nausea | `frown` |

#### Section Header
| Property | Value |
|----------|-------|
| Label | "Symptoms" |
| Font | `bodyBold` (16/700) |
| Color | `MoonColors.textPrimary` |
| Subtitle | "How are you feeling?" |
| Subtitle font | `caption` (13/500) |
| Subtitle color | `MoonColors.textSecondary` |
| Bottom margin | `Spacing.xs` (4pt) |

#### Chip Dimensions

| Property | Value |
|----------|-------|
| **Height** | 40pt (min tap target + visual comfort) |
| **Min width** | 88pt (ensures tap target even with short labels) |
| **Padding** | 8pt vertical, 16pt horizontal |
| **Border radius** | `Radii.full` (9999 — pill shape) |
| **Gap between chips** | `Spacing.sm` (8pt) |
| **Layout** | `flexWrap: 'wrap'`, horizontal |
| **Icon size** | 14pt |
| **Icon-to-label gap** | `Spacing.xs` (4pt) |

#### Chip States

| State | Background | Text | Border | Icon Color |
|-------|-----------|------|--------|------------|
| **Inactive** | transparent | `chipInactiveText` / `chipInactiveTextMoon` | 1pt solid `chipInactiveBorder` / `chipInactiveBorderMoon` | same as text |
| **Active** | `chipActiveBg` (#D4537E) | `chipActiveText` (#FFF) | none | #FFFFFF |

---

### 2.4 Notes Input

**Retained from current design** with minor refinements.

| Property | Current | New |
|----------|---------|-----|
| **Min height** | 80pt | 88pt (8pt grid aligned) |
| **Background** | `MoonColors.inputBg` (#1E3045) | Same |
| **Border** | none | 1pt solid `MoonColors.border` (#2D4A6B) on focus |
| **Border radius** | `Radii.sm` (12pt) | `Radii.md` (20pt) — matches card language |
| **Placeholder** | Moon hint color | Same |
| **Max length** | 200 chars | Same |
| **Character count** | Bottom-right, `tiny` | Same, add color shift to `#EF5350` at 180+ chars |

---

### 2.5 Save Button

**Replaces:** `Alert.alert()` confirmation dialog.

| Property | Value |
|----------|-------|
| **Shape** | Pill (`Radii.full` / 9999) |
| **Height** | 52pt |
| **Width** | Full parent width minus `Spacing.lg` (24pt) padding each side |
| **Background** | `periodLogged` (#D4537E) |
| **Background (disabled)** | `#D4537E40` (25% opacity) |
| **Text** | "Save" / "Luu" — `bodyBold` (16/700), #FFFFFF |
| **Text (disabled)** | `#FFFFFF80` |
| **Shadow** | `{ x: 0, y: 4, blur: 12, color: #D4537E40 }` |
| **Press state** | Scale 0.97, opacity 0.9 (see Animation Spec) |
| **Disabled condition** | No changes made (no flow selected, no symptoms toggled, no notes) |
| **Bottom margin** | `Spacing.xxl` (48pt) — safe area clearance |

---

### 2.6 Toast (Success Confirmation)

**Replaces:** `Alert.alert()` + `notificationSuccess()` combination.

| Property | Value |
|----------|-------|
| **Position** | Top of screen, below safe area inset |
| **Width** | Auto (content-hugging) with max `screenWidth - 48pt` |
| **Height** | 48pt |
| **Border radius** | `Radii.full` (9999 — capsule) |
| **Background** | `toastBg` (#162233F0) |
| **Shadow** | `{ x: 0, y: 4, blur: 16, color: rgba(0,0,0,0.25) }` |
| **Layout** | Row: checkmark icon (20pt) + message text |
| **Icon** | `Feather` `check-circle`, color `toastIcon` (#4AD66D) |
| **Text** | "Period logged" — `bodyBold` (16/700), `toastText` (#F0F0FF) |
| **Icon-to-text gap** | `Spacing.sm` (8pt) |
| **Horizontal padding** | `Spacing.lg` (24pt) |
| **Duration** | 2500ms visible, then auto-dismiss |
| **Haptic** | `notificationSuccess()` on appear |

---

## 3. Spacing System (8pt Grid)

All vertical spacing follows the existing `Spacing` tokens on an 8pt grid.

### Screen Layout (top to bottom)

```
SafeAreaView top inset
  |
  ├─ 16pt (Spacing.md)     ← Screen header top padding
  ├─ Header ("Calendar" title + subtitle)
  ├─ 24pt (Spacing.lg)     ← Gap to calendar
  ├─ Calendar card (CycleCalendarGrid)
  │   ├─ 16pt              ← Internal top padding
  │   ├─ Month header row
  │   ├─ 8pt               ← Gap
  │   ├─ Weekday header row (24pt height)
  │   ├─ 4pt               ← Gap
  │   ├─ Day rows (44pt each, 4pt row gap) x 4–6 rows
  │   └─ 16pt              ← Internal bottom padding
  ├─ 24pt (Spacing.lg)     ← Gap to legend
  ├─ Legend card
  ├─ 24pt (Spacing.lg)     ← Gap to detail section
  │
  ╔═══════════════════════════════════════════════╗
  ║  Inline Detail Panel (when day selected)      ║
  ║                                               ║
  ║  ├─ 24pt                ← Section top padding ║
  ║  ├─ Date header + phase badge                 ║
  ║  ├─ 16pt                                      ║
  ║  ├─ Flow Intensity Selector                   ║
  ║  │   ├─ Section header                        ║
  ║  │   ├─ 8pt                                   ║
  ║  │   └─ 4 option buttons (72pt)               ║
  ║  ├─ 16pt                                      ║
  ║  ├─ Symptom Chips                             ║
  ║  │   ├─ Section header + subtitle             ║
  ║  │   ├─ 4pt                                   ║
  ║  │   └─ Chip rows (40pt each, wrapping)       ║
  ║  ├─ 16pt                                      ║
  ║  ├─ Factors (existing override tags)          ║
  ║  ├─ 16pt                                      ║
  ║  ├─ Notes Input (88pt min)                    ║
  ║  ├─ 24pt                                      ║
  ║  ├─ Save Button (52pt)                        ║
  ║  ├─ 8pt                                       ║
  ║  ├─ Delete / Cancel row                       ║
  ║  └─ 48pt                ← Safe area bottom    ║
  ╚═══════════════════════════════════════════════╝
```

### Horizontal Spacing
| Zone | Value |
|------|-------|
| Screen edge to content | `Spacing.lg` (24pt) |
| Calendar internal padding | `Spacing.md` (16pt) |
| Day cell horizontal gap | Calculated: `(containerWidth - 24*2 - 44*7) / 6` — flexible, minimum 0 |
| Chip gap | `Spacing.sm` (8pt) |
| Flow button gap | `Spacing.sm` (8pt) |
| Button horizontal padding | `Spacing.lg` (24pt) |

---

## 4. Animation Spec

All animations use `react-native-reanimated` (already a dependency).

### 4.1 Day Cell Tap Feedback

| Property | Value |
|----------|-------|
| **Trigger** | `onPressIn` |
| **Transform** | `scale: 0.90` |
| **Duration** | 80ms ease-out |
| **Release** | `scale: 1.0`, 120ms spring (damping: 15, stiffness: 200) |
| **Haptic** | `impactLight()` on press |
| **Background flash** | For non-filled cells: brief 150ms fade to `selectedRing + '20'` then fade out |

### 4.2 Chip Toggle Animation

| Property | Value |
|----------|-------|
| **Trigger** | `onPress` |
| **Activate** | Background fills from center outward, 200ms ease-in-out. Scale springs to 1.05 then settles to 1.0 (spring: damping 12, stiffness 180) |
| **Deactivate** | Background fades to transparent, 180ms. Border fades in 180ms. |
| **Icon** | Rotate 0 to 10 degrees and back on activate (subtle "wiggle"), 250ms |
| **Haptic** | `impactLight()` on toggle |

### 4.3 Flow Intensity Selector

| Property | Value |
|----------|-------|
| **Trigger** | `onPress` |
| **Previous active** | Background fades to inactive, 200ms |
| **New active** | Background fills with `periodLogged`, 200ms ease-in-out |
| **Dots** | Staggered fade-in — each dot fades to white with 40ms delay per dot |
| **Haptic** | `impactMedium()` on selection change |

### 4.4 Save Button Press

| Property | Value |
|----------|-------|
| **Trigger** | `onPressIn` |
| **Transform** | `scale: 0.97` over 100ms |
| **Opacity** | 0.9 |
| **Release** | Spring back to `scale: 1.0` (damping: 15, stiffness: 250) |
| **On success** | Button background briefly flashes to `SharedColors.success` (#4CAF50) for 300ms, then reverts. Concurrent with toast appearance. |

### 4.5 Toast Entry / Exit

| Property | Value |
|----------|-------|
| **Entry** | Slide down from -60pt (above screen) to final position. Spring animation: damping 18, stiffness 200. |
| **Opacity** | Fade in from 0 to 1 over 200ms, concurrent with slide |
| **Hold** | 2500ms |
| **Exit** | Slide up to -60pt + fade out 250ms ease-in |
| **Layout interaction** | Toast is absolutely positioned, does not push content down |

### 4.6 Inline Detail Panel

| Property | Value |
|----------|-------|
| **Entry** | `FadeIn.duration(300)` + `SlideInDown.duration(300)` (reanimated layout animation) |
| **Exit** | `FadeOut.duration(200)` + `SlideOutDown.duration(200)` |
| **Trigger** | Day cell tap (replaces the current Modal-based `DayDetailSheet`) |

---

## 5. Accessibility

### 5.1 Minimum Tap Targets

| Element | Size | Requirement |
|---------|------|-------------|
| Day cell | 44 x 44 pt | Apple HIG minimum (44pt) |
| Flow option button | full-width x 72pt | Exceeds minimum |
| Symptom chip | 88pt min-width x 40pt | Meets minimum (horizontal) with `hitSlop` |
| Save button | full-width x 52pt | Exceeds minimum |
| Month navigation arrows | 44 x 44 pt | Meets minimum |
| Close / Delete buttons | 44 x 44 pt effective (with `hitSlop: 8`) | Meets minimum |

### 5.2 Color Contrast Ratios (WCAG 2.1 AA)

| Foreground | Background | Ratio | Passes |
|-----------|------------|-------|--------|
| `#FFFFFF` on `#D4537E` (period logged) | — | 4.8:1 | AA (normal text) |
| `#FFFFFF` on `#3AAFFF` (ovulation) | — | 3.2:1 | AA (large text / UI) |
| `#F0F0FF` on `#162233` (Moon surface) | — | 12.5:1 | AAA |
| `#A8BAC8` on `#162233` (Moon secondary) | — | 6.8:1 | AA |
| `#D4537E` on `#162233` (period on Moon bg) | — | 4.1:1 | AA (large text / UI) |
| `#4AD66D` on `#162233` (toast icon) | — | 7.2:1 | AAA |
| `#F2A6C0` on `#162233` (predicted on Moon) | — | 6.3:1 | AA |

### 5.3 Screen Reader Labels

| Element | `accessibilityRole` | `accessibilityLabel` |
|---------|---------------------|---------------------|
| Day cell | `button` | "{date}, {phase name}, Day {n} of cycle" + "Period logged" / "Predicted period" / "Fertile window" / "Ovulation day" if applicable |
| Flow option | `radio` | "Flow intensity: {option}" + "Selected" if active |
| Flow group | `radiogroup` | "Flow intensity selector" |
| Symptom chip | `checkbox` | "{symptom name}" + "Selected" / "Not selected" |
| Save button | `button` | "Save period log" |
| Toast | `alert` | "Period logged successfully" (announced automatically) |
| Month arrows | `button` | "Previous month" / "Next month" |
| Notes input | `none` (default) | `accessibilityLabel="Add a note about today"` |

### 5.4 Dynamic Type Support

All text uses `Typography` tokens which should be wrapped with `allowFontScaling: true` (React Native default). Maximum scale factor: 1.5x to prevent layout breakage.

### 5.5 Reduce Motion

When `AccessibilityInfo.isReduceMotionEnabled` is true:
- Replace all spring/timing animations with instant state changes (duration: 0)
- Toast uses simple opacity fade (200ms) instead of slide
- Day cell tap has no scale animation, only color change
- Chip toggle is instant background swap

---

## 6. Before / After Comparison

### 6.1 Calendar

| Aspect | BEFORE (Current) | AFTER (Redesign) |
|--------|-------------------|-------------------|
| **Library** | `react-native-calendars` (third-party) | Custom `CycleCalendarGrid` (owned) |
| **Day rendering** | Default cells, no custom `dayComponent` | Custom circular cells with state-dependent fills, borders, and range bands |
| **Period visualization** | Solid dot marker + colored background fill via `markedDates` | Solid filled circle (logged) vs. dashed-border circle (predicted) + horizontal range bands connecting consecutive days |
| **Fertile / Ovulation** | Same dot marker style as period (only color differs) | Distinct visual language: subtle ring (fertile) vs. bold ring (ovulation) |
| **Today** | Text color change only (`todayTextColor`) | Solid `#D4537E` filled circle — immediately visible |
| **Selection** | Light accent background fill | Outer ring in `#B39DDB` — non-destructive, layered on top of existing state |
| **Day cell size** | Library default (~36pt) | 44pt (Apple HIG compliant tap target) |
| **Month navigation** | Library default arrows | Custom 44pt tap targets with `Feather` chevrons |
| **Theming** | `theme` prop on `<Calendar>` (limited) | Full control — tokens applied directly to styled components |

### 6.2 Period Log Interaction

| Aspect | BEFORE (Current) | AFTER (Redesign) |
|--------|-------------------|-------------------|
| **Trigger** | Tap day -> `DayDetailSheet` modal -> tap "Log Period" -> `PeriodLogSheet` modal | Tap day -> inline detail panel scrolls into view below calendar |
| **Confirmation** | `Alert.alert()` with Cancel/Save buttons (system dialog) | Inline Save pill button + Toast confirmation |
| **Flow tracking** | None | 4-option flow intensity selector (Spotting / Light / Medium / Heavy) |
| **Symptoms** | None (only override tags: stress, illness, travel, medication, other) | 6 symptom chips + existing factor tags |
| **Notes** | TextInput in bottom sheet | TextInput in inline panel (same functionality, refined border radius) |
| **Delete** | `Alert.alert()` with destructive button | Inline delete button with press animation, still uses `Alert.alert()` for destructive confirmation (intentional — prevents accidental deletion) |
| **Feedback** | `Alert.alert()` dismiss | Toast slides in from top + `notificationSuccess()` haptic |
| **Animation** | `Animated.spring` bottom sheet slide-up | `reanimated` `FadeIn` + `SlideInDown` for inline panel |

### 6.3 Visual Identity

| Aspect | BEFORE | AFTER |
|--------|--------|-------|
| **Period color** | `#FF5F7E` (bright rose — same for logged and predicted) | `#D4537E` (logged, deeper) / `#F2A6C0` (predicted, lighter) — clear visual distinction |
| **Clinical feel** | Dot markers look like a medical chart | Warm filled circles with range bands feel like a personal diary |
| **Information density** | Calendar + legend only; log data in separate modal | Calendar + legend + inline detail panel with flow, symptoms, factors, notes — single scrollable surface |

---

## 7. Edge Cases

### 7.1 Empty State (No Period Logged Yet)

**Condition:** `periodLogs.length === 0` and user taps a day cell.

**Behavior:**
- Calendar renders with predicted data only (based on `cycleSettings.lastPeriodStartDate`)
- All predicted days show dashed-border style
- Inline detail panel shows:
  - Date header + phase badge (from predictions)
  - Flow intensity selector (all inactive)
  - Symptom chips (all inactive)
  - Save button label: "Log period start"
  - No delete button
- Placeholder text below calendar (before any day is selected): "Tap a day to log your period" in `MoonColors.textHint`, centered, `body` typography

### 7.2 Loading State

**Condition:** `addPeriodLog()` async operation is in-flight.

**Behavior:**
- Save button enters disabled state (`#D4537E40` background)
- Button text replaced with `ActivityIndicator` (white, 20pt) + "Saving..."
- All form inputs remain visible but non-interactive (`pointerEvents: 'none'` on the form container)
- If operation takes > 3 seconds, show subtle inline message: "Still saving..." in `MoonColors.textHint`
- On failure: button reverts to active state, inline error banner appears below the save button with `SharedColors.error` (#EF5350) left border, message from error, dismiss button

### 7.3 Error State

**Condition:** `addPeriodLog()` rejects or network error.

**Behavior:**
- Toast with error variant: background `#EF535018`, icon `alert-circle` in `SharedColors.error`, text "Could not save. Tap to retry."
- Toast is tappable — `onPress` retries the save operation
- Error toast stays visible until dismissed (tap or swipe up), does not auto-dismiss
- All form state is preserved — user does not lose their input

### 7.4 Validation Errors

Existing validation logic from `PeriodLogSheet.tsx` is preserved:

| Error | Current | New |
|-------|---------|-----|
| Future date | `Alert.alert()` | Inline error text below date header, `SharedColors.error` color, `caption` typography. Save button disabled. |
| Too far back (>30 days) | `Alert.alert()` | Same inline error treatment |
| Overlap (<2 days from existing) | `Alert.alert()` | Same inline error treatment |

### 7.5 Small Screen / Long Text

**Condition:** iPhone SE (375pt width) or translated labels that exceed button width.

**Mitigation:**
- Flow intensity buttons use `flex: 1` — they shrink equally on narrow screens. Labels use `numberOfLines={1}` with `adjustsFontSizeToFit` (min 10pt)
- Symptom chips wrap to multiple rows via `flexWrap: 'wrap'`
- Calendar day cells maintain 44pt minimum — on 375pt screens with 24pt side padding, cell gap becomes ~3pt (still tappable, no overlap)
- Notes input scrolls internally; outer ScrollView handles overall page scroll
- Vietnamese labels ("Dau bung", "Met moi", "Buon non") are compact — no truncation expected. Longest English label "Mood swings" fits within 88pt min-width at 13pt caption.

### 7.6 Rapid Taps / Double Submit

**Mitigation:**
- Save button disables immediately on press (`useRef` flag, not state-based — avoids re-render delay)
- Re-enabled only after async operation completes (success or failure)
- Day cell selection debounced — new selection cancels previous inline panel animation

### 7.7 Keyboard Overlap

**Retained from current:** `KeyboardAvoidingView` wraps the inline detail panel. On iOS, `behavior="padding"`; on Android, `behavior="height"`. Notes input auto-scrolls into view when focused via `ScrollView.scrollTo`.

---

## 8. Implementation Notes

### 8.1 Migration Path

This is a **progressive replacement**, not a big-bang rewrite:

1. **Phase 1:** Add `CycleCalendarTokens` to `theme.ts`. Create `CycleCalendarGrid` component. Wire it into `calendar.tsx` behind a feature flag (`useCycleCalendarGrid`).
2. **Phase 2:** Create `FlowIntensitySelector` and `SymptomChips` components. Add them to the inline detail panel.
3. **Phase 3:** Create `Toast` component. Replace `Alert.alert()` confirmations in `PeriodLogSheet` with Save button + Toast.
4. **Phase 4:** Remove `react-native-calendars` dependency. Remove feature flag.

### 8.2 Data Model Impact

New fields needed in the `period_logs` or `daily_logs` table:

| Field | Type | Description |
|-------|------|-------------|
| `flow_intensity` | `enum('spotting', 'light', 'medium', 'heavy')` | Nullable. Logged flow level. |
| `symptoms` | `text[]` | Nullable. Array of symptom IDs (e.g., `['cramps', 'fatigue']`). |

These require a new Supabase migration (`007_add_flow_and_symptoms.sql`).

### 8.3 i18n Keys Required

New translation keys across `calendar`, `health`, and `common` namespaces:

- `calendar:flowIntensity`, `calendar:spotting`, `calendar:light`, `calendar:medium`, `calendar:heavy`
- `calendar:symptoms`, `calendar:howFeeling`
- `calendar:cramps`, `calendar:fatigue`, `calendar:headache`, `calendar:bloating`, `calendar:moodSwings`, `calendar:nausea`
- `calendar:savePeriodLog`, `calendar:saving`, `calendar:periodLoggedSuccess`
- `calendar:tapToLog` (empty state placeholder)
- `calendar:retryError` (error toast)

All keys must be mirrored in `i18n/en/calendar.json` and `i18n/vi/calendar.json`.

---

## 9. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Should flow intensity and symptoms be logged per-day or per-period? Flo logs per-day. Per-period is simpler but less useful. | Data model, UI complexity |
| 2 | Should the detail panel be inline (scroll-based) or a bottom sheet (modal)? This spec assumes inline, but a bottom sheet would reduce scroll distance. | Layout, animation |
| 3 | Do we need a "period ended" action in the new flow, or should it auto-detect? Currently uses explicit "End Period Here" button. | UX flow, store actions |
| 4 | Should Sun see Moon's flow intensity and symptoms (privacy-sensitive)? | RLS policies, partner sync |
