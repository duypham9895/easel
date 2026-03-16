# CR_20260316_001 — Frontend Implementation Spec

**Author:** Senior Frontend Engineering
**Date:** 2026-03-16
**Status:** Draft
**Stack:** React Native, Expo SDK 52, Zustand 5, TypeScript, Supabase JS client
**Depends on:** [Backend Spec](./CR_20260316_001_backend_spec.md), [Design Spec](./CR_20260316_001_design_spec.md), [Architecture Notes](./CR_20260316_001_architecture_notes.md)

---

## Table of Contents

1. [Component Tree](#1-component-tree)
2. [Zustand Store Additions](#2-zustand-store-additions)
3. [Supabase Integration](#3-supabase-integration)
4. [Calendar Render Logic](#4-calendar-render-logic)
5. [New Types](#5-new-types)
6. [i18n Keys](#6-i18n-keys)
7. [Known Risks / Edge Cases](#7-known-risks--edge-cases)

---

## 1. Component Tree

### 1.1 Full Component Inventory

| Component | File Path | Status | Lines (est.) | Description |
|-----------|-----------|--------|-------------|-------------|
| `CalendarTab` | `app/app/(tabs)/calendar.tsx` | **MODIFY** | ~350 | Replace `<Calendar>` with custom `DayComponent`, wire inline panel, remove `DayDetailSheet` modal |
| `CalendarDayCell` | `app/components/moon/CalendarDayCell.tsx` | **NEW** | ~180 | Custom `DayComponent` for `react-native-calendars` with phase fills, flow dots, selection ring, range bands |
| `FlowIntensitySelector` | `app/components/moon/FlowIntensitySelector.tsx` | **NEW** | ~200 | 4-option horizontal picker (spotting/light/medium/heavy) with dot indicators and haptic feedback |
| `SymptomChipGroup` | `app/components/moon/SymptomChipGroup.tsx` | **NEW** | ~150 | 6 symptom chips (cramps, fatigue, headache, bloating, mood_swings, nausea) with multi-select toggle |
| `PeriodLogPanel` | `app/components/moon/PeriodLogPanel.tsx` | **NEW** | ~350 | Inline detail panel replacing both `DayDetailSheet` and `PeriodLogSheet` modals. Contains flow selector, symptom chips, factors, notes, save/delete actions |
| `SaveToast` | `app/components/shared/SaveToast.tsx` | **NEW** | ~120 | Animated toast notification (success/error variants) with auto-dismiss and retry-on-tap for errors |
| `PeriodLogSheet` | `app/components/moon/PeriodLogSheet.tsx` | **DEPRECATE** | — | Replaced by `PeriodLogPanel`. Keep file for one release cycle, then remove |
| `DayDetailSheet` (inline in calendar.tsx) | `app/app/(tabs)/calendar.tsx` | **REMOVE** | — | The `DayDetailSheet` function and `sheetStyles` are removed; functionality absorbed by `PeriodLogPanel` |
| `MyCycleCard` | `app/components/moon/MyCycleCard.tsx` | **UNCHANGED** | — | Continues to render below the calendar |
| `PredictionWindowCard` | `app/components/moon/PredictionWindowCard.tsx` | **UNCHANGED** | — | Continues to render between legend and MyCycleCard |
| `PartnerCalendarView` | `app/components/sun/PartnerCalendarView.tsx` | **MODIFY** | ~+40 | Add flow intensity indicator on period day cells (read-only) |
| `LegendItem` (inline in calendar.tsx) | `app/app/(tabs)/calendar.tsx` | **MODIFY** | ~+10 | Add legend entry for "Period (logged)" vs "Period (predicted)" visual distinction per design spec |

### 1.2 Component Dependency Graph

```
CalendarTab (modify)
├── Calendar (react-native-calendars — keep library, use dayComponent prop)
│   └── CalendarDayCell (new) — custom DayComponent
├── LegendItem (modify — add logged/predicted distinction)
├── PeriodLogPanel (new) — replaces DayDetailSheet + PeriodLogSheet
│   ├── FlowIntensitySelector (new)
│   ├── SymptomChipGroup (new)
│   ├── Tag pills (reuse existing TAG_DEFS pattern from PeriodLogSheet)
│   └── Notes TextInput (reuse existing pattern)
├── SaveToast (new) — absolutely positioned, portal-like
├── PredictionWindowCard (unchanged)
└── MyCycleCard (unchanged)
```

### 1.3 Component Specifications

#### CalendarDayCell

**Props:**
```typescript
interface CalendarDayCellProps {
  date: DateData;                    // from react-native-calendars
  state: 'disabled' | 'today' | '';  // from react-native-calendars
  marking: DayCellMarking | undefined;
  isSelected: boolean;
  flowIntensity: FlowIntensity | null; // from periodDayLogs store
  onPress: (dateString: string) => void;
}

interface DayCellMarking {
  type: 'period' | 'ovulation' | 'fertile';
  source: 'logged' | 'predicted';
  isRangeStart?: boolean;  // first day of consecutive period range
  isRangeEnd?: boolean;    // last day of consecutive period range
  isRangeMid?: boolean;    // middle day of consecutive period range
}
```

**Rendering rules:** Follow Design Spec section 2.1 day cell state variants. Use `Animated.spring` for tap scale feedback (0.90 -> 1.0). Apply `React.memo` with custom comparator on `(date.dateString, isSelected, marking, flowIntensity)`.

#### FlowIntensitySelector

**Props:**
```typescript
interface FlowIntensitySelectorProps {
  selected: FlowIntensity | null;
  onSelect: (intensity: FlowIntensity) => void;
  disabled?: boolean;
}
```

**Options constant (define in component file):**
```typescript
const FLOW_OPTIONS: ReadonlyArray<{
  id: FlowIntensity;
  dotCount: number;
  dotSize: number;
}> = [
  { id: 'spotting', dotCount: 1, dotSize: 6 },
  { id: 'light',    dotCount: 2, dotSize: 8 },
  { id: 'medium',   dotCount: 3, dotSize: 10 },
  { id: 'heavy',    dotCount: 4, dotSize: 12 },
];
```

**Behavior:** Single-select. `impactMedium()` haptic on change. Dots render as filled circles with 3pt gaps. Active button uses `CycleCalendarTokens.periodLogged` background.

#### SymptomChipGroup

**Props:**
```typescript
interface SymptomChipGroupProps {
  selected: ReadonlySet<PeriodSymptom>;
  onToggle: (symptom: PeriodSymptom) => void;
  disabled?: boolean;
}
```

**Symptom definitions constant (define in component file):**
```typescript
const SYMPTOM_DEFS: ReadonlyArray<{
  id: PeriodSymptom;
  icon: keyof typeof Feather.glyphMap;
}> = [
  { id: 'cramps',      icon: 'zap' },
  { id: 'fatigue',     icon: 'battery' },
  { id: 'headache',    icon: 'cloud-lightning' },
  { id: 'bloating',    icon: 'circle' },
  { id: 'mood_swings', icon: 'trending-up' },
  { id: 'nausea',      icon: 'frown' },
];
```

**Behavior:** Multi-select. `impactLight()` haptic on toggle. `flexWrap: 'wrap'` layout. Minimum chip width 88pt per design spec.

#### PeriodLogPanel

**Props:**
```typescript
interface PeriodLogPanelProps {
  selectedDate: string;              // YYYY-MM-DD
  existingDayLog: PeriodDayRecord | null;
  existingPeriodLog: PeriodRecord | null;
  markers: Record<string, CalendarMarker>;
  cycleSettings: CycleSettings;
  onSave: () => void;
  onClose: () => void;
}
```

**Layout (top to bottom):**
1. Date header + cycle day + phase badge (reuse `computeDayInfo` from current calendar.tsx)
2. Validation error inline text (if applicable — future date, too far back, overlap)
3. Flow Intensity Selector
4. Symptom Chip Group
5. Factors (existing TAG_DEFS override tags — retained)
6. Notes TextInput (88pt min height, `Radii.md` border radius)
7. Save button (pill shape, 52pt height, disabled when no changes)
8. Delete button (if editing existing log) + Cancel text button

**Animation:** Uses `react-native-reanimated` entering/exiting layout animations: `FadeIn.duration(300)` + `SlideInDown.duration(300)` on mount, `FadeOut.duration(200)` + `SlideOutDown.duration(200)` on unmount. Wrapped in `Animated.View` from reanimated.

**Save flow:**
1. Disable save button immediately (useRef flag)
2. Call `savePeriodDayLog()` store action (optimistic)
3. On success: trigger `SaveToast` with success variant, `notificationSuccess()` haptic, call `onSave()`
4. On failure: trigger `SaveToast` with error variant (tappable to retry), re-enable save button, preserve form state

**Delete flow:** Retain `Alert.alert()` for destructive confirmation per design spec section 2.5. This is intentional to prevent accidental deletion.

#### SaveToast

**Props:**
```typescript
interface SaveToastProps {
  visible: boolean;
  variant: 'success' | 'error';
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;  // only for error variant
}
```

**Behavior:**
- Absolutely positioned at top of screen, below safe area inset
- Success: auto-dismiss after 2500ms
- Error: stays until tapped (tap triggers `onRetry`) or swiped up
- Entry: slide down from -60pt with spring (damping 18, stiffness 200) + fade in 200ms
- Exit: slide up to -60pt + fade out 250ms
- Does not push content down (absolutely positioned)

---

## 2. Zustand Store Additions

### 2.1 New State Fields

Add to `AppState` interface in `app/store/appStore.ts`:

```typescript
// Period day logs — per-day flow and symptom tracking
periodDayLogs: Record<string, PeriodDayRecord>;  // key: YYYY-MM-DD

// Transient UI state for the inline log panel
selectedCalendarDay: string | null;               // currently selected day (YYYY-MM-DD)
isSavingDayLog: boolean;                          // true while upsert is in-flight
```

**Why `Record<string, PeriodDayRecord>` instead of `Map`?**
Zustand's `persist` middleware serializes state to JSON via AsyncStorage. `Map` and `Set` do not serialize natively. A plain `Record` (object) keyed by date string is serializable, O(1) lookup, and compatible with the existing persistence strategy.

**Why `selectedCalendarDay` replaces `selectedDay` + `showPeriodLogSheet`?**
The current calendar.tsx maintains two separate pieces of local state: `selectedDay` (string | null) and `showPeriodLogSheet` (boolean). The redesign collapses the two-step flow (detail sheet -> log sheet) into a single inline panel. A single `selectedCalendarDay` field suffices. This field is transient (not persisted) since it represents ephemeral UI state.

### 2.2 New Actions

```typescript
// Period day log CRUD
savePeriodDayLog: (
  logDate: string,
  flowIntensity: FlowIntensity,
  symptoms: PeriodSymptom[],
  notes?: string,
  tags?: OverrideTag[],
) => Promise<void>;

loadPeriodDayLogs: (startDate: string, endDate: string) => Promise<void>;

removePeriodDayLog: (logDate: string) => Promise<void>;

// Calendar UI
selectCalendarDay: (dateString: string | null) => void;

// Receive partner's day log via Realtime (Sun-only)
receivePeriodDayLog: (
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  logDate: string,
  data: PeriodDayRecord | null,
) => void;
```

### 2.3 Action Implementations

#### `savePeriodDayLog`

```typescript
savePeriodDayLog: async (logDate, flowIntensity, symptoms, notes, tags) => {
  const { userId, periodDayLogs, periodLogs, cycleSettings } = get();
  if (!userId) return;

  set({ isSavingDayLog: true });

  // 1. Optimistic update — create new record immutably
  const newRecord: PeriodDayRecord = {
    logDate,
    flowIntensity,
    symptoms,
    ...(notes ? { notes } : {}),
  };
  const updatedDayLogs = { ...periodDayLogs, [logDate]: newRecord };
  set({ periodDayLogs: updatedDayLogs });

  try {
    // 2. Upsert to period_day_logs table
    await upsertPeriodDayLog(userId, logDate, flowIntensity, symptoms, notes);

    // 3. Auto-create/extend period_logs if this day isn't already within a period
    const existingPeriod = findPeriodContainingDate(periodLogs, logDate);
    if (!existingPeriod) {
      const adjacentPeriod = findAdjacentPeriod(periodLogs, logDate);
      if (adjacentPeriod) {
        // Extend existing period's end_date
        await get().setPeriodEndDate(adjacentPeriod.startDate, logDate);
      } else {
        // Create new single-day period log
        await get().addPeriodLog(logDate, undefined, tags);
      }
    }
  } catch (error) {
    // 4. Rollback optimistic update on failure
    set({ periodDayLogs });
    throw error;
  } finally {
    set({ isSavingDayLog: false });
  }
},
```

#### `loadPeriodDayLogs`

```typescript
loadPeriodDayLogs: async (startDate, endDate) => {
  const { userId } = get();
  if (!userId) return;

  const records = await fetchPeriodDayLogs(userId, startDate, endDate);
  const dayLogs = { ...get().periodDayLogs };
  for (const record of records) {
    dayLogs[record.logDate] = record;
  }
  set({ periodDayLogs: dayLogs });
},
```

#### `removePeriodDayLog`

```typescript
removePeriodDayLog: async (logDate) => {
  const { userId, periodDayLogs } = get();
  if (!userId) return;

  // Optimistic removal
  const { [logDate]: _removed, ...remaining } = periodDayLogs;
  set({ periodDayLogs: remaining });

  try {
    await deletePeriodDayLog(userId, logDate);
  } catch (error) {
    // Rollback
    set({ periodDayLogs });
    throw error;
  }
},
```

#### `receivePeriodDayLog` (Realtime handler for Sun)

```typescript
receivePeriodDayLog: (event, logDate, data) => {
  const { periodDayLogs } = get();
  if (event === 'DELETE') {
    const { [logDate]: _removed, ...remaining } = periodDayLogs;
    set({ periodDayLogs: remaining });
  } else if (data) {
    set({
      periodDayLogs: { ...periodDayLogs, [logDate]: data },
    });
  }
},
```

### 2.4 Initial State Additions

```typescript
periodDayLogs: {},
selectedCalendarDay: null,
isSavingDayLog: false,
```

### 2.5 Persistence Configuration

Update the `partialize` function to exclude transient UI state:

```typescript
partialize: ({
  activeSOS, activeWhisper, lastDeviation, predictionWindow,
  userId, coupleId,
  selectedCalendarDay, isSavingDayLog,  // NEW: exclude transient UI state
  ...rest
}) => rest,
```

Note: `periodDayLogs` IS persisted (offline support). `selectedCalendarDay` and `isSavingDayLog` are NOT persisted (transient UI state).

### 2.6 Integration with Existing Actions

**`bootstrapSession`:** After loading `periodLogs`, also load `periodDayLogs` for the current and previous cycle:

```typescript
// In bootstrapSession, after periodLogs are loaded:
if (profile?.role === 'moon' && periodLogs.length > 0) {
  const today = new Date().toISOString().split('T')[0];
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const startDate = threeMonthsAgo.toISOString().split('T')[0];
  const dayLogRecords = await fetchPeriodDayLogs(userId, startDate, today);
  const dayLogs: Record<string, PeriodDayRecord> = {};
  for (const r of dayLogRecords) {
    dayLogs[r.logDate] = r;
  }
  set({ periodDayLogs: dayLogs });
}
```

**`signOut`:** Reset `periodDayLogs: {}`, `selectedCalendarDay: null`, `isSavingDayLog: false`.

**`signIn`:** Same loading pattern as `bootstrapSession`.

---

## 3. Supabase Integration

### 3.1 New Data Access File

**File:** `app/lib/db/periodDayLogs.ts`

This file contains pure async functions following the existing `lib/db/*.ts` pattern. No React, no Zustand imports.

```typescript
// Functions to implement (signatures from backend spec Appendix B):

export async function upsertPeriodDayLog(
  userId: string,
  logDate: string,
  flowIntensity: FlowIntensity,
  symptoms: PeriodSymptom[],
  notes?: string,
): Promise<void>;

export async function fetchPeriodDayLogs(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<PeriodDayRecord[]>;

export async function deletePeriodDayLog(
  userId: string,
  logDate: string,
): Promise<void>;

export function subscribeToPeriodDayLogs(
  moonUserId: string,
  onDayLogChange: (
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    log: Pick<DbPeriodDayLog, 'log_date' | 'flow_intensity' | 'symptoms'> | null,
    oldLog: Pick<DbPeriodDayLog, 'log_date'> | null,
  ) => void,
): () => void;
```

### 3.2 Upsert Strategy

Use Supabase `upsert` with `onConflict: 'user_id, log_date'` for idempotent writes:

```typescript
const { error } = await supabase
  .from('period_day_logs')
  .upsert(
    {
      user_id: userId,
      log_date: logDate,
      flow_intensity: flowIntensity,
      symptoms,
      notes: notes ?? null,
    },
    { onConflict: 'user_id, log_date' },
  );
```

This means:
- First save for a date: INSERT
- Subsequent saves for same date: UPDATE (flow/symptoms/notes replaced)
- No need for separate create/update code paths

### 3.3 Optimistic UI Pattern

The optimistic update pattern follows the existing `addPeriodLog` strategy:

```
User taps Save
  → set({ periodDayLogs: { ...current, [date]: newRecord } })   // instant UI update
  → await upsertPeriodDayLog(...)                                 // async DB write
  → on error: set({ periodDayLogs: previousState })               // rollback
  → on error: show error toast (tappable to retry)
```

Form state is preserved on error. The user never loses their input.

### 3.4 Error Recovery

| Error Type | Recovery |
|-----------|----------|
| Network timeout | Rollback optimistic update, show error toast with "Tap to retry" |
| RLS violation (403) | Should not happen (Moon writing own data). Log error, show generic error toast |
| Constraint violation (CHECK) | Client-side validation should prevent. If it occurs, log error, show "Invalid data" toast |
| Conflict (race condition) | `upsert` is idempotent — last write wins. No special handling needed |

### 3.5 Realtime Subscription for Partner Sync

**New hook:** `app/hooks/usePeriodDayLogListener.ts`

This hook mirrors the existing `useSOSListener` pattern:

```typescript
export function usePeriodDayLogListener() {
  const role = useAppStore(s => s.role);
  const isPartnerLinked = useAppStore(s => s.isPartnerLinked);
  const receivePeriodDayLog = useAppStore(s => s.receivePeriodDayLog);

  useEffect(() => {
    // Only Sun subscribes (Moon is the writer)
    if (role !== 'sun' || !isPartnerLinked) return;

    const moonUserId = /* get from couple relationship */;
    if (!moonUserId) return;

    const unsubscribe = subscribeToPeriodDayLogs(
      moonUserId,
      (event, log, oldLog) => {
        if (event === 'DELETE' && oldLog) {
          receivePeriodDayLog('DELETE', oldLog.log_date, null);
        } else if (log) {
          receivePeriodDayLog(event, log.log_date, {
            logDate: log.log_date,
            flowIntensity: log.flow_intensity,
            symptoms: log.symptoms ?? [],
          });
        }
      },
    );

    return unsubscribe;
  }, [role, isPartnerLinked, receivePeriodDayLog]);
}
```

**Registration:** Call `usePeriodDayLogListener()` in `app/app/_layout.tsx` alongside existing `useSOSListener()`.

### 3.6 Query Patterns

| Operation | Table | Method | When |
|-----------|-------|--------|------|
| Load 3 months of day logs | `period_day_logs` | `fetchPeriodDayLogs(userId, 3moAgo, today)` | `bootstrapSession`, `signIn` |
| Load month on navigation | `period_day_logs` | `fetchPeriodDayLogs(userId, monthStart, monthEnd)` | Month swipe in calendar |
| Save day log | `period_day_logs` | `upsertPeriodDayLog(...)` | Save button tap |
| Delete day log | `period_day_logs` | `deletePeriodDayLog(userId, date)` | Delete button tap |
| Subscribe (Sun) | `period_day_logs` | `subscribeToPeriodDayLogs(moonId, ...)` | App mount (Sun only) |

---

## 4. Calendar Render Logic

### 4.1 Library Decision

**Keep `react-native-calendars` with custom `dayComponent` prop** per architecture notes recommendation. This avoids rebuilding locale handling, month transitions, and accessibility from scratch.

```tsx
<Calendar
  dayComponent={(props) => (
    <CalendarDayCell
      {...props}
      marking={dayCellMarkings[props.date?.dateString ?? '']}
      isSelected={props.date?.dateString === selectedCalendarDay}
      flowIntensity={periodDayLogs[props.date?.dateString ?? '']?.flowIntensity ?? null}
      onPress={handleDayPress}
    />
  )}
  // ... existing theme and props
/>
```

### 4.2 Phase Overlay Computation

Phase overlays are computed via the existing `buildCalendarMarkers()` in `cycleCalculator.ts`. The return type already includes `type` and `source` fields. For the redesign, extend the marker data with range position info:

**New helper in `cycleCalculator.ts`:**

```typescript
export function enrichMarkersWithRangeInfo(
  markers: Record<string, CalendarMarker>,
): Record<string, CalendarMarker & { isRangeStart?: boolean; isRangeEnd?: boolean; isRangeMid?: boolean }> {
  const enriched = { ...markers };
  const periodDates = Object.entries(markers)
    .filter(([_, m]) => m.type === 'period')
    .map(([date]) => date)
    .sort();

  for (let i = 0; i < periodDates.length; i++) {
    const date = periodDates[i];
    const prev = periodDates[i - 1];
    const next = periodDates[i + 1];
    const isConsecutiveWithPrev = prev && daysDiff(prev, date) === 1;
    const isConsecutiveWithNext = next && daysDiff(date, next) === 1;

    enriched[date] = {
      ...enriched[date],
      isRangeStart: !isConsecutiveWithPrev && isConsecutiveWithNext,
      isRangeEnd: isConsecutiveWithPrev && !isConsecutiveWithNext,
      isRangeMid: isConsecutiveWithPrev && isConsecutiveWithNext,
    };
  }

  return enriched;
}
```

### 4.3 Multi-Day Selection UX

**Tap behavior (single day, not range):**
- Tapping a non-selected day: sets `selectedCalendarDay` to that date, opens inline `PeriodLogPanel`
- Tapping the already-selected day: deselects (closes panel)
- Tapping a different day while panel is open: switches selection (panel re-renders with new date data)

**No multi-select in v1.7.** The PRD mentions contiguous auto-fill (FR-13) as P1. For this implementation, we support single-day selection and logging. Multi-day range selection is deferred.

### 4.4 Month Navigation

Retain `react-native-calendars` built-in `enableSwipeMonths`. On month change, trigger a lazy load of `periodDayLogs` for the newly visible month:

```typescript
const handleMonthChange = useCallback((month: { dateString: string }) => {
  const [year, m] = month.dateString.split('-').map(Number);
  const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const endDate = `${year}-${String(m).padStart(2, '0')}-${lastDay}`;
  loadPeriodDayLogs(startDate, endDate);
}, [loadPeriodDayLogs]);
```

### 4.5 Predicted Days Calculation

No change to `buildCalendarMarkers()`. Predicted period days continue to use the existing algorithm based on `cycleSettings.lastPeriodStartDate` and `avgCycleLength`. The visual distinction between logged and predicted is handled by `CalendarDayCell` based on the `marker.source` field.

### 4.6 Performance Optimizations

| Optimization | Technique | Rationale |
|-------------|-----------|-----------|
| Day cell memoization | `React.memo` on `CalendarDayCell` with custom comparator: `(prev, next) => prev.date?.dateString === next.date?.dateString && prev.isSelected === next.isSelected && prev.marking === next.marking && prev.flowIntensity === next.flowIntensity` | Prevents re-render of all 42 cells when one day is selected |
| Markers computation | `useMemo` on `buildCalendarMarkers(...)` with deps `[lastPeriodStartDate, avgCycleLength, avgPeriodLength, periodLogs]` | Already the current pattern; no change needed |
| Range enrichment | `useMemo` on `enrichMarkersWithRangeInfo(markers)` with dep `[markers]` | Computed once per marker change |
| Day log lookup | Direct object property access: `periodDayLogs[dateString]` — O(1) | No iteration needed; `Record` is optimal |
| Selector granularity | Use separate Zustand selectors per field: `useAppStore(s => s.periodDayLogs)`, not `useAppStore(s => s)` | Prevents unnecessary re-renders from unrelated state changes |
| Calendar markings | Pre-compute `markedDates` in `useMemo` and pass to `<Calendar>` | Existing pattern; ensure the custom dayComponent receives pre-computed data |

---

## 5. New Types

Add to `app/types/index.ts`:

```typescript
// ── Period Day Logs (Flo-style per-day tracking) ────────────────────────

/** Flow intensity levels for period day tracking. */
export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy';

/** Symptom identifiers for period day tracking. */
export type PeriodSymptom =
  | 'cramps'
  | 'fatigue'
  | 'headache'
  | 'bloating'
  | 'mood_swings'
  | 'nausea';

/** App-layer type for a single period day log (camelCase). */
export interface PeriodDayRecord {
  logDate: string;               // YYYY-MM-DD
  flowIntensity: FlowIntensity;
  symptoms: PeriodSymptom[];
  notes?: string;
}

/** Database row type for period_day_logs table (snake_case, mirrors Supabase). */
export interface DbPeriodDayLog {
  id: string;
  user_id: string;
  log_date: string;              // YYYY-MM-DD
  flow_intensity: FlowIntensity;
  symptoms: PeriodSymptom[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

**Naming rationale:**
- `PeriodDayRecord` (app layer) follows the existing `PeriodRecord` naming convention
- `DbPeriodDayLog` (DB layer) follows the existing `DbPeriodLog`, `DbDailyLog` naming convention
- `FlowIntensity` and `PeriodSymptom` are union types (not enums) consistent with `OverrideTag`, `CyclePhase`

---

## 6. i18n Keys

### 6.1 New Keys for `i18n/en/calendar.json`

```json
{
  "flowIntensity": "Flow intensity",
  "spotting": "Spotting",
  "light": "Light",
  "medium": "Medium",
  "heavy": "Heavy",

  "symptoms": "Symptoms",
  "howFeeling": "How are you feeling?",
  "cramps": "Cramps",
  "fatigue": "Fatigue",
  "headache": "Headache",
  "bloating": "Bloating",
  "moodSwings": "Mood swings",
  "nausea": "Nausea",

  "savePeriodLog": "Save",
  "saving": "Saving...",
  "periodLoggedSuccess": "Period logged",
  "saveError": "Could not save. Tap to retry.",
  "tapToLog": "Tap a day to log your period",
  "noChanges": "No changes to save",

  "dayLogHeader": "Log details",
  "dayFlowLabel": "Day {{day}} — {{flow}} flow",

  "deleteDay": "Remove this day",
  "confirmDeleteDay": "Remove period log for this day?",
  "confirmDeleteDayMessage": "This will remove the flow and symptom data for this day."
}
```

### 6.2 New Keys for `i18n/vi/calendar.json`

```json
{
  "flowIntensity": "Muc do",
  "spotting": "Lom dom",
  "light": "Nhe",
  "medium": "Trung binh",
  "heavy": "Nhieu",

  "symptoms": "Trieu chung",
  "howFeeling": "Ban cam thay the nao?",
  "cramps": "Chuot rut",
  "fatigue": "Met moi",
  "headache": "Dau dau",
  "bloating": "Day hoi",
  "moodSwings": "Thay doi tam trang",
  "nausea": "Buon non",

  "savePeriodLog": "Luu",
  "saving": "Dang luu...",
  "periodLoggedSuccess": "Da ghi nhan kinh nguyet",
  "saveError": "Khong the luu. Cham de thu lai.",
  "tapToLog": "Cham vao ngay de ghi nhan kinh nguyet",
  "noChanges": "Khong co thay doi de luu",

  "dayLogHeader": "Chi tiet ngay",
  "dayFlowLabel": "Ngay {{day}} — {{flow}}",

  "deleteDay": "Xoa ngay nay",
  "confirmDeleteDay": "Xoa ghi nhan kinh nguyet cho ngay nay?",
  "confirmDeleteDayMessage": "Dieu nay se xoa du lieu luu luong va trieu chung cho ngay nay."
}
```

### 6.3 Key Namespace Summary

All new keys are in the `calendar` namespace. No new keys needed in `health` or `common` namespaces for this implementation.

**Total new keys:** 21 per language (EN and VI).

---

## 7. Known Risks / Edge Cases

### 7.1 New User with No History

**Condition:** `periodLogs.length === 0`, `periodDayLogs` is empty, user taps a day cell.

**Behavior:**
- Calendar renders with predicted data only (from `cycleSettings.lastPeriodStartDate`)
- All predicted days show dashed-border style per design spec
- `PeriodLogPanel` opens with all fields empty (no flow selected, no symptoms)
- Save button label: "Save" — creates both a `period_log` entry AND a `period_day_log` entry
- No delete button shown
- Placeholder text below calendar (before any day is selected): "Tap a day to log your period" centered, `MoonColors.textHint` color

**Implementation:** The `savePeriodDayLog` action auto-creates a `period_log` if one doesn't exist for the selected date via `findPeriodContainingDate` / `findAdjacentPeriod` logic (see section 2.3).

### 7.2 Partner Viewing Mid-Log (Realtime Race Condition)

**Condition:** Moon is in the middle of editing a day log. Sun's Realtime subscription fires for each upsert.

**Risk:** Sun sees partial data (e.g., flow set to "heavy" but symptoms not yet saved).

**Mitigation:** The save operation is atomic — `upsertPeriodDayLog` sends flow + symptoms + notes in a single upsert call. Sun receives the complete row in the Realtime payload. There is no multi-step write that could produce partial state.

**Edge case within edge case:** Moon saves, then immediately edits and saves again. Sun may see the first version briefly before the second Realtime event arrives. This is acceptable behavior (eventual consistency, sub-second convergence).

### 7.3 Offline Support with Optimistic Writes

**Current support level:** Zustand + AsyncStorage persistence ensures `periodDayLogs` survive app restart. The optimistic update pattern means the UI reflects the save immediately.

**Risk:** Moon saves offline, app is killed before sync, app restarts, data only exists locally.

**Mitigation (v1.7 scope):** The `periodDayLogs` record is persisted via Zustand's `persist` middleware. On next `bootstrapSession`, the local cache is merged with DB data. Since the DB write failed (offline), the local-only record will be stale. The `bootstrapSession` fetch overwrites it.

**Proper mitigation (future):** Implement a `pendingSync` queue per architecture notes. Pending writes are flushed on reconnect. Out of scope for v1.7.0 initial implementation but the store shape supports it (add `pendingPeriodDayLogs: PeriodDayRecord[]` later).

### 7.4 Calendar Performance with 3 Months of Data

**Data volume:** 3 months = ~90 days. Each day has one `CalendarMarker` and optionally one `PeriodDayRecord`. Total objects in memory: ~180.

**Performance concerns:**
- `buildCalendarMarkers` iterates `periodLogs` (max 24 entries) + 3 predicted cycles. O(n) where n is small.
- `enrichMarkersWithRangeInfo` iterates period markers only (typically 5-15 per month). O(n).
- `CalendarDayCell` render: 42 cells per month. With `React.memo`, only changed cells re-render on state change.
- `periodDayLogs` lookup: O(1) per day via object property access.

**Benchmark target:** < 100ms for full month render including markers + flow indicators (per NFR in PRD).

**Risk:** `react-native-calendars` re-renders all 42 day components on any prop change to `markedDates`. The `dayComponent` prop is called for every cell.

**Mitigation:**
1. Wrap `CalendarDayCell` in `React.memo` with shallow comparison on relevant props
2. Compute `dayCellMarkings` in a `useMemo` so the object reference is stable across renders
3. Use Zustand selector granularity to avoid re-rendering `CalendarTab` on unrelated state changes
4. If profiling reveals jank: extract the entire calendar into a separate component with its own `React.memo` boundary

### 7.5 Existing Period Logs Without Day Logs (Backward Compatibility)

**Condition:** User upgrades to v1.7.0 with existing `period_logs` but no `period_day_logs`.

**Behavior:**
- Calendar renders existing periods with `periodLogged` fill color (solid circle)
- No flow intensity dot shown (absence = no data, not "no flow")
- Tapping an existing period day opens `PeriodLogPanel` with flow defaulting to `null` (no pre-selection)
- User can optionally add flow + symptoms retroactively and save
- `MyCycleCard` and `PredictionWindowCard` continue to work from `periodLogs` data alone

**No data migration required.** The new feature is purely additive.

### 7.6 Date Validation

Retain existing validation from `PeriodLogSheet.tsx`:

| Rule | Condition | UI Treatment |
|------|-----------|-------------|
| Future date | `selectedDate > today` | Inline error text below date header, save button disabled |
| Too far back | `daysDiff > 30` | Inline error text, save button disabled |
| Overlap | `distance <= 2 days` from existing log (if not editing) | Inline error text, save button disabled |

Validation runs in `useMemo` when `selectedCalendarDay` changes. Errors shown inline (not `Alert.alert()`) per design spec section 7.4.

### 7.7 PeriodLogSheet Deprecation Path

1. **v1.7.0:** Create `PeriodLogPanel`. `PeriodLogSheet` file remains in codebase but is no longer imported. Add `@deprecated` JSDoc comment.
2. **v1.8.0:** Delete `PeriodLogSheet.tsx` file and associated imports.

This avoids breaking any in-progress branches that may reference `PeriodLogSheet`.

### 7.8 CycleCalendarTokens Integration

New design tokens from the Design Spec (section 1.1) must be added to `app/constants/theme.ts` as `CycleCalendarTokens`. These tokens are used exclusively by `CalendarDayCell`, `FlowIntensitySelector`, `SymptomChipGroup`, and `SaveToast`. Existing `Colors`, `MoonColors`, and `CalendarTokens` are not modified.

---

## Appendix A: File Change Summary

| File | Change Type | Est. Lines Changed |
|------|------------|-------------------|
| `app/types/index.ts` | Add types | +30 |
| `app/constants/theme.ts` | Add `CycleCalendarTokens` | +40 |
| `app/lib/db/periodDayLogs.ts` | New file | ~130 |
| `app/store/appStore.ts` | Add state + actions | +120 |
| `app/hooks/usePeriodDayLogListener.ts` | New file | ~50 |
| `app/components/moon/CalendarDayCell.tsx` | New file | ~180 |
| `app/components/moon/FlowIntensitySelector.tsx` | New file | ~200 |
| `app/components/moon/SymptomChipGroup.tsx` | New file | ~150 |
| `app/components/moon/PeriodLogPanel.tsx` | New file | ~350 |
| `app/components/shared/SaveToast.tsx` | New file | ~120 |
| `app/app/(tabs)/calendar.tsx` | Major refactor | ~200 modified |
| `app/utils/cycleCalculator.ts` | Add `enrichMarkersWithRangeInfo` | +30 |
| `app/i18n/en/calendar.json` | Add 21 keys | +21 |
| `app/i18n/vi/calendar.json` | Add 21 keys | +21 |
| `app/app/_layout.tsx` | Register new Realtime hook | +3 |
| `app/components/sun/PartnerCalendarView.tsx` | Add flow indicator | +40 |

**Total new files:** 6
**Total modified files:** 7
**Estimated total lines added:** ~1,350

## Appendix B: Implementation Phases

Aligned with PRD milestones:

| Phase | Files | Depends On |
|-------|-------|-----------|
| **1. Types + Data Layer** (Day 1-2) | `types/index.ts`, `lib/db/periodDayLogs.ts`, `constants/theme.ts` (tokens) | Backend migration 008 deployed to staging |
| **2. Store Actions** (Day 2-3) | `store/appStore.ts` | Phase 1 |
| **3. Components** (Day 3-7) | `CalendarDayCell`, `FlowIntensitySelector`, `SymptomChipGroup`, `PeriodLogPanel`, `SaveToast` | Phase 2 |
| **4. Calendar Integration** (Day 7-9) | `calendar.tsx` refactor, `cycleCalculator.ts` range enrichment | Phase 3 |
| **5. Partner Sync** (Day 9-10) | `usePeriodDayLogListener.ts`, `PartnerCalendarView.tsx`, `_layout.tsx` | Phase 2 + backend Realtime enabled |
| **6. i18n + Polish** (Day 10-12) | `i18n/en/calendar.json`, `i18n/vi/calendar.json`, animation refinement | Phase 4 |
