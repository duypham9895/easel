# CR_20260316_002 — Technical Impact Assessment

## Change ID
`CR_20260316_002`

## Summary
Rebuild Calendar screen as a focused Cycle Timeline: remove MyCycleCard, convert PeriodLogPanel from inline card to Modal bottom sheet, and change tap behavior to first-tap-marks / second-tap-opens-sheet.

---

## Files to Change

### 1. `app/app/(tabs)/calendar.tsx` (MAJOR — 374 lines)

**Imports to remove:**
- `MyCycleCard` import (line 13)
- `useRouter` from `expo-router` (line 7) — only used by MyCycleCard callbacks (`router.push('/health-sync')`)

**Imports to add:**
- None required — `useState` already imported

**State changes:**
- Add `sheetOpen` state: `const [sheetOpen, setSheetOpen] = useState(false)`
- `selectedDay` stays but its role changes — it now tracks which day the sheet is editing, not which day has the inline panel open

**`handleDayPress` logic change (line 141-143):**
Current behavior: toggles `selectedDay` (shows/hides inline panel for any tapped day).
New behavior:
```
1. If dateString is in the future → no-op (return early)
2. If periodDayLogs[dateString] exists → set selectedDay, open sheet (setSheetOpen(true))
3. Otherwise → call savePeriodDayLog(dateString, 'medium', [], undefined) for auto-mark
   - Show success toast after auto-mark
```
Future date check: compare `new Date(dateString + 'T00:00:00')` against `new Date()` with hours zeroed. This logic already exists in `PeriodLogPanel.isFutureDate()` — extract to a shared util or inline it.

**Render changes:**
- Remove the inline `{selectedDay && <PeriodLogPanel ... />}` block (lines 227-237)
- Replace with `<PeriodLogPanel visible={sheetOpen} ... onClose={() => setSheetOpen(false)} />`
  - Render outside the ScrollView (Modal is portal-like, but logically cleaner to place at root)
- Remove `<MyCycleCard ... />` block (lines 250-257)
- Keep: Legend, PredictionWindowCard, tap hint, SaveToast, Calendar grid

**Estimated diff:** ~30 lines removed, ~25 lines added. Net reduction ~5 lines.

### 2. `app/components/moon/PeriodLogPanel.tsx` (MAJOR — 522 lines)

**Props interface change:**
- Add `visible: boolean` prop
- Add `onDismiss?: () => void` (or reuse `onClose`)
- Remove `markers` prop (unused internally — already received as `_markers`)
- Keep: `selectedDate`, `existingDayLog`, `existingPeriodLog`, `cycleSettings`, `onSave`, `onClose`

**Structural change — wrap in Modal:**
- Replace outer `<Animated.View entering={FadeIn}>` + `<Animated.View entering={SlideInDown}>` with:
  - `<Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>`
  - `<Pressable style={styles.backdrop} onPress={onClose}>` (semi-transparent overlay)
  - `<KeyboardAvoidingView>` (for notes TextInput)
  - `<Animated.View style={styles.sheet}>` with spring slide-up (same pattern as PeriodLogSheet.tsx lines 149-164)
  - `<Pressable>` (inner, to prevent backdrop dismiss when tapping sheet content)

**Animation change:**
- Remove `react-native-reanimated` FadeIn/SlideInDown entering animations
- Add `useRef(new Animated.Value(600))` slide animation (RN core Animated, matching PeriodLogSheet)
- Add `useEffect` to animate `slideAnim` on `visible` change (spring up / timing down)

**Add handle bar:**
- Insert `<View style={styles.handle} />` at top of sheet (40x4 rounded bar, matching PeriodLogSheet line 284-285)

**Style changes:**
- Replace `styles.card` with `styles.backdrop` + `styles.sheet` (bottom sheet styling from PeriodLogSheet)
- Add `backdrop`, `keyboardAvoid`, `sheet`, `handle` styles
- Remove `card` style (current inline card appearance)
- Adjust `scrollContent` padding for bottom sheet context (add `paddingBottom: 40` for safe area)

**No logic changes needed:**
- Flow selector, symptom chips, tag pills, notes, save, delete, cancel — all stay as-is
- `isFutureDate` / `isTooFarBack` validation stays (sheet can still show errors if opened for edge-case dates)
- `handleSave` / `handleDelete` callbacks unchanged

**Estimated diff:** ~40 lines changed (wrapper structure + styles), ~15 lines added (Modal + animation). Core content (~300 lines) untouched.

### 3. `app/components/moon/MyCycleCard.tsx` (NO CHANGE)

The component file itself is not modified. It is only removed from `calendar.tsx`'s import and render. The file stays in the codebase for potential future use (e.g., a dedicated history screen).

**Usage audit:** MyCycleCard is imported only in `calendar.tsx` (confirmed via grep). No other consumers exist.

### 4. `app/components/moon/CalendarDayCell.tsx` (NO CHANGE)

No structural changes needed. The `onPress` callback signature remains `(dateString: string) => void`. The new tap behavior is handled entirely in `calendar.tsx`'s `handleDayPress` — CalendarDayCell just forwards the press event.

The `disabled` state handling (line 91-92, 105) already prevents interaction on disabled days. Future date blocking is done at the parent level (handleDayPress), not in the cell.

---

## Files NOT Changed

| File | Reason |
|------|--------|
| `app/store/appStore.ts` | `savePeriodDayLog` already handles auto-creating `period_logs` entries. No new actions needed. |
| `app/lib/db/periodDayLogs.ts` | Data access layer unchanged — existing `upsertPeriodDayLog` is sufficient. |
| `app/utils/cycleCalculator.ts` | No formula changes. |
| `app/constants/theme.ts` | No new tokens needed — reusing existing `MoonColors.overlay`, `Radii.xl`, etc. |
| `app/i18n/en/*.json` / `app/i18n/vi/*.json` | All required translation keys already exist in `calendar.json`. |
| `app/types/index.ts` | No new types needed. |
| `app/components/moon/PeriodLogSheet.tsx` | Reference only — not modified. Pattern is copied into PeriodLogPanel. |
| `app/components/moon/FlowIntensitySelector.tsx` | Used by PeriodLogPanel, unchanged. |
| `app/components/moon/SymptomChipGroup.tsx` | Used by PeriodLogPanel, unchanged. |
| `app/components/moon/TagPillGroup.tsx` | Used by PeriodLogPanel, unchanged. |
| `app/components/moon/PredictionWindowCard.tsx` | Stays on Calendar screen, unchanged. |
| `app/components/sun/PartnerCalendarView.tsx` | Sun's view unchanged. |
| `app/supabase/migrations/*` | No schema changes — existing `period_day_logs` and `period_logs` tables are sufficient. |

---

## Side Effects

### Positive
- Removes misleading "Log a period" button that redirected to `/health-sync`
- Simplifies Calendar screen from 5 sections to 3 (calendar + legend + prediction)
- Tap-to-mark reduces period logging from 4 taps (tap day -> select flow -> save -> close) to 1 tap

### Negative / Risks
- **Auto-mark defaults to `medium` flow** — user cannot choose flow on first tap. They must tap again to edit. This is the intended Flo-style UX but may surprise users who expect to choose flow first.
- **No undo for auto-mark** — tapping an unlogged day immediately creates a `period_day_log` with `medium` flow. User must tap again and delete to undo. Consider adding a brief undo toast (out of scope for this CR but worth noting).
- **Toast timing** — auto-mark success toast and sheet open could collide if user taps a just-marked day quickly. The toast auto-dismisses, so this is cosmetic only.

### Data Flow
```
User taps unlogged day
  → calendar.tsx handleDayPress
    → appStore.savePeriodDayLog(date, 'medium', [], undefined)
      → upsertPeriodDayLog (DB write)
      → auto-creates period_log if needed (existing logic)
    → show success toast
    → periodDayLogs state updates → CalendarDayCell re-renders with flow dots

User taps logged day
  → calendar.tsx handleDayPress
    → setSelectedDay(date), setSheetOpen(true)
    → PeriodLogPanel Modal opens with existing day log data
    → user edits flow/symptoms/notes → handleSave
      → appStore.savePeriodDayLog (update)
      → sheet closes, toast shows
```

---

## Dependency Analysis

### Import Graph (affected area only)
```
calendar.tsx
  ├── CalendarDayCell (unchanged)
  ├── PeriodLogPanel (changed: inline → Modal)
  │   ├── FlowIntensitySelector (unchanged)
  │   ├── SymptomChipGroup (unchanged)
  │   └── TagPillGroup (unchanged)
  ├── PredictionWindowCard (unchanged)
  ├── SaveToast (unchanged)
  ├── PartnerCalendarView (unchanged, Sun-only)
  └── MyCycleCard (REMOVED from import)
```

### Store Dependencies
- `savePeriodDayLog` — used by new auto-mark behavior (already exists)
- `periodDayLogs` — read for determining logged/unlogged state (already used)
- `removePeriodDayLog` — used by PeriodLogPanel delete (already exists)
- No new store actions or state fields required

---

## Test Impact

### Existing E2E Tests (Maestro)
| Test File | Impact |
|-----------|--------|
| `calendar-period-log.yaml` | **MUST UPDATE** — currently tests inline panel flow. Needs to test: (1) tap unlogged day -> auto-mark, (2) tap logged day -> sheet opens, (3) edit in sheet, (4) future day no-op |
| `calendar-full-suite.yaml` | **REVIEW** — may reference MyCycleCard elements that no longer exist |
| `calendar-validation.yaml` | **REVIEW** — validation errors now appear inside Modal sheet instead of inline |

### Unit Tests
No existing unit tests for `PeriodLogPanel` or `calendar.tsx` (components are tested via E2E). The Modal wrapper change does not affect internal logic, so no new unit tests are strictly required for this CR.

### Manual Test Plan
- [ ] Tap unlogged past day → period dot appears immediately (auto-mark with medium flow)
- [ ] Tap unlogged today → same auto-mark behavior
- [ ] Tap future day → nothing happens (no sheet, no mark)
- [ ] Tap already-logged day → bottom sheet opens with correct flow/symptoms/notes
- [ ] Edit flow in sheet → save → sheet closes, calendar reflects new flow dots
- [ ] Delete day log in sheet → sheet closes, period dot removed
- [ ] Cancel/backdrop press → sheet closes without changes
- [ ] Month navigation → loads day logs for new month (existing behavior, regression check)
- [ ] MyCycleCard is NOT visible on Calendar screen
- [ ] PredictionWindowCard still visible
- [ ] Legend still visible with all 5 items
- [ ] Sun's PartnerCalendarView unchanged
- [ ] Keyboard avoidance works when editing notes in sheet
- [ ] Realtime sync: Moon logs day → Sun sees update on partner calendar

---

## Complexity Assessment

**Estimated effort:** Small-Medium (2-4 hours)

| Task | Estimate |
|------|----------|
| Modify `calendar.tsx` (remove MyCycleCard, new handleDayPress) | 30 min |
| Convert `PeriodLogPanel.tsx` to Modal bottom sheet | 1-1.5 hrs |
| Update E2E tests | 30-45 min |
| Manual testing across scenarios | 30-45 min |

**No new patterns introduced** — reuses the exact Modal + Animated spring pattern from `PeriodLogSheet.tsx` (lines 112-419). The pattern is proven and handles keyboard avoidance, backdrop dismiss, and slide animation.

---

## Technical Debt

1. **PeriodLogSheet.tsx becomes partially redundant** — both PeriodLogSheet (period start/end logging) and PeriodLogPanel (per-day flow/symptom logging) are now Modal bottom sheets with similar structure. Could consolidate into a single configurable sheet component in a future CR.

2. **MyCycleCard.tsx becomes orphaned** — no imports after this change. Options: (a) delete it, (b) move to a future "Cycle History" screen, (c) leave as dead code. Recommendation: leave for now, clean up in a maintenance CR.

3. **`isFutureDate` duplication** — the future date check will exist in both `handleDayPress` (calendar.tsx) and `PeriodLogPanel.tsx`. Could extract to `utils/dateHelpers.ts` but not worth a separate file for one function. Acceptable duplication for now.

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auto-mark creates unintended period logs | Medium | Low | User can tap again to open sheet and delete |
| Modal animation jank on low-end devices | Low | Low | Using RN core Animated (not Reanimated) — proven performant in PeriodLogSheet |
| E2E tests break due to removed MyCycleCard | High | Low | Update tests as part of this CR |
| Keyboard obscures notes field in sheet | Low | Medium | KeyboardAvoidingView handles this (proven in PeriodLogSheet) |
| Realtime sync regression | Low | High | No changes to sync logic — regression test only |
