# CR_20260316_001 — Architecture Consultation Note

**Date:** 2026-03-16
**Author:** Head of Engineering
**Status:** Advisory

---

## 1. REALTIME vs POLLING

**Recommendation: Keep Supabase Realtime. No change needed.**

Period logging is low-frequency (1–7 events/month), but Sun's dashboard already subscribes to `period_logs` via `subscribeToPeriodLogs()`. Adding a parallel polling mechanism introduces a second sync path to maintain with zero user-facing benefit. The Realtime channel is already open for SOS signals, so the marginal cost of watching `period_logs` is near-zero — Supabase multiplexes channels over a single WebSocket connection. The only consideration is ensuring the new `period_day_logs` table (see Q5) is added to the existing subscription filter. Extend `subscribeToPeriodLogs()` to also watch INSERT/UPDATE/DELETE on the new table, filtered by `moonUserId`. No architectural change required.

## 2. PREDICTION COMPUTATION

**Recommendation: Keep client-side computation (option C).**

`computePredictionWindow()` operates on at most 7 recent cycles — this is trivially fast on-device. Moving to Postgres (option A) or an Edge Function (option B) adds network latency to every calendar render and couples prediction logic to the server deployment cycle. Client-side keeps predictions instant, offline-capable, and easy to iterate on. The weighted-average algorithm is pure math with no external dependencies, which is exactly the kind of logic that belongs in `cycleCalculator.ts`. If prediction complexity grows significantly (e.g., ML-based models), revisit with an Edge Function that caches results — but that is not on the horizon for v1.6.

## 3. OFFLINE SUPPORT

**Recommendation: Queue-and-reconcile with conflict resolution on `(user_id, date)`.**

Current optimistic writes via Zustand + AsyncStorage are sufficient for the happy path. The risk is Moon logging days offline that overlap with predictions Sun already sees. Mitigation: persist pending writes in a `pendingSync` queue in the Zustand store (AsyncStorage-backed). On reconnect, flush the queue in chronological order. Use Supabase's `upsert` with `onConflict: ['user_id', 'date']` on `period_day_logs` so duplicate offline writes are idempotent. Sun's predictions are already derived from `periodLogs` in the store, so they auto-correct once the sync completes and Realtime delivers the confirmed rows. No server-side conflict resolution needed — last-write-wins at the day granularity is correct because only Moon writes her own data.

## 4. CALENDAR PERFORMANCE

**Recommendation: Keep `react-native-calendars` with a custom `DayComponent` (option A).**

Building a custom calendar grid (option B) is high effort for marginal gain — `react-native-calendars` already handles locale, month transitions, and accessibility. The `DayComponent` prop gives full control over rendering phase overlays, flow intensity dots, and multi-select tap behavior. Wrap the custom day in `React.memo` keyed on `(date, isSelected, flowIntensity, phaseColor)` to prevent re-renders of unchanged days. For the month view, pre-compute `markedDates` in a `useMemo` derived from the store — this is already the pattern in `buildCalendarMarkers()`. A FlatList-based approach (option C) only pays off for infinite-scroll timelines, which is not the current UX. If profiling later reveals jank on low-end Android devices, the custom day component is the isolated optimization surface.

## 5. SCHEMA EVOLUTION

**Recommendation: New `period_day_logs` table (option A).**

A dedicated table with one row per day is the cleanest path:

```sql
period_day_logs (
  id uuid PK,
  user_id uuid FK,
  period_log_id uuid FK → period_logs,
  date date NOT NULL,
  flow_intensity text CHECK (flow_intensity IN ('spotting','light','medium','heavy')),
  symptoms text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
)
```

Option B (expanding `daily_logs`) conflates mood/general wellness tracking with period-specific data, making RLS and queries messier. Option C (JSONB on `period_logs`) loses queryability — you cannot index into JSONB arrays efficiently for cycle analytics. A normalized table supports future additions (cervical mucus, temperature, medication) as new columns without migration pain, enables simple Realtime subscriptions filtered by `user_id`, and keeps the existing `period_logs` table as the canonical cycle-level record while `period_day_logs` holds day-level detail. Apply RLS mirroring `period_logs`: owner read/write, partner read-only.

---

**Summary:** No architectural pivots needed. Extend the existing patterns — Realtime subscription, client-side prediction, optimistic writes — and add one new table for per-day granularity.
