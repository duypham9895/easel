# CR_20260316_002 — Implementation Notes

## Changes Made

### 1. `app/app/(tabs)/calendar.tsx` — Calendar Screen (Major)

**Removed:**
- `MyCycleCard` import and all usage (cycle stats, period history, "Log a period" redirect, "Edit settings" link)
- `useRouter` import — was only used for MyCycleCard's `router.push('/health-sync')` callbacks
- Inline `PeriodLogPanel` rendering (was rendered inside ScrollView when `selectedDay` was set)
- `PeriodLogSheet` import (not needed)

**Added:**
- `impactLight` import from `@/utils/haptics` for tap feedback on auto-mark
- `savePeriodDayLog` store selector for auto-marking unlogged days
- `sheetOpen` state to control bottom sheet visibility
- Two-tap logic in `handleDayPress`:
  - Future date → no-op (guard at top)
  - Day has existing log (`periodDayLogs[dateString]`) → set selectedDay + open sheet
  - Day has no log → call `savePeriodDayLog(dateString, 'medium', [])` + show toast
- `handleSheetSave` / `handleSheetClose` callbacks for bottom sheet
- Modal-based `PeriodLogPanel` rendered outside ScrollView (as overlay)

**Unchanged:**
- All Sun/PartnerCalendarView paths
- Calendar grid, CalendarDayCell, Legend, PredictionWindowCard
- First-time tap hint (now visible when `periodLogs.length === 0`, without requiring `!selectedDay`)
- Month navigation and day log loading

### 2. `app/components/moon/PeriodLogPanel.tsx` — Period Log Panel (Major)

**Converted from inline card to bottom sheet Modal:**

Before:
```
Animated.View (FadeIn) → Animated.View (SlideInDown) → ScrollView → content
```

After:
```
Modal (transparent, fade) → Pressable (backdrop) → KeyboardAvoidingView → Animated.View (spring slide-up) → Pressable (content trap) → handle bar → ScrollView → content
```

**Changed props:**
- Added: `visible: boolean` (controls Modal visibility)
- Removed: none (all existing props preserved)

**Changed dependencies:**
- Removed: `react-native-reanimated` (`FadeIn`, `SlideInDown`)
- Added: `react-native` (`Modal`, `Pressable`, `Animated`, `KeyboardAvoidingView`, `Platform`)

**Internal logic unchanged:**
- Flow/symptom/tag/note state management: identical
- Save/delete handlers: identical
- Date validation (future/too-far-back): identical
- Effect for initializing from existing log: added `visible` dependency to reset state on open

### 3. Files NOT changed
- `app/components/moon/MyCycleCard.tsx` — component file preserved (may be used elsewhere)
- `app/components/moon/CalendarDayCell.tsx` — no changes
- `app/components/moon/PeriodLogSheet.tsx` — no changes (existing sheet, separate use case)
- `app/store/appStore.ts` — no changes
- `app/i18n/en/calendar.json` — no changes (unused MyCycleCard keys left for now)
- `app/i18n/vi/calendar.json` — no changes

## Scope Discipline
- Only Calendar screen modified (calendar.tsx + PeriodLogPanel.tsx)
- No Homepage changes
- No navigation pattern changes
- No database/migration changes
- No new design tokens (all existing tokens sufficient)

## Self-Review Checklist
- [x] MyCycleCard removed from Calendar
- [x] "Log a period" redirect gone
- [x] Future days blocked in handleDayPress
- [x] Unlogged days auto-mark on tap
- [x] Logged days open bottom sheet
- [x] Bottom sheet has flow/symptoms/factors/notes/save/delete
- [x] Build passes (`npx tsc --noEmit` — zero errors)
- [x] No hardcoded secrets
- [x] All state mutations through appStore
- [x] Immutable patterns used (no mutation)
