# CR_20260316_001 — Backend Spec: Supabase Schema & API

**Change Request:** Log Period Flo-Style Redesign with Partner Sync
**Author:** Backend Engineering
**Date:** 2026-03-16
**Status:** Draft
**Migration:** `008_period_day_logs.sql`

---

## Table of Contents

1. [Schema Design](#1-schema-design)
2. [Row Level Security Policies](#2-row-level-security-policies)
3. [Realtime Subscription Spec](#3-realtime-subscription-spec)
4. [Prediction Algorithm](#4-prediction-algorithm)
5. [Data Migration](#5-data-migration)

---

## 1. Schema Design

### Problem

The current `period_logs` table stores one row per period (start_date, end_date) but has no per-day granularity. The Flo-style redesign requires Moon to log **flow intensity** and **symptoms for each individual day** within a period. The existing `daily_logs` table serves a different purpose (mood/energy check-ins) and should not be overloaded.

### Decision: New `period_day_logs` Table

Create a dedicated `period_day_logs` table with one row per day within a period. This is preferred over:

- **Adding JSONB to `period_logs`**: Would make querying individual days inefficient, break Realtime granularity (entire JSONB blob change vs. row-level change), and complicate partial updates.
- **Overloading `daily_logs`**: `daily_logs` tracks mood/energy (general wellness); `period_day_logs` tracks flow/symptoms (menstrual-specific). Different domains, different access patterns, different lifecycle.

### Relationship Model

```
period_logs (range-level)          period_day_logs (day-level)
┌──────────────────────────┐       ┌────────────────────────────────┐
│ user_id + start_date (UK)│──1:N──│ user_id + log_date (UK)        │
│ end_date                 │       │ flow_intensity (enum)           │
│ tags[]                   │       │ symptoms[] (constrained)        │
│ notes                    │       │ notes                           │
└──────────────────────────┘       └────────────────────────────────┘
```

The relationship is **logical, not enforced via FK**. A `period_day_logs` row for a given date should fall within the `[start_date, end_date]` range of a `period_logs` row for the same user. This is enforced at the application layer because:

1. `period_logs.end_date` is nullable (period may still be in progress).
2. Day logs may be entered before the period range is finalized.
3. FK on date ranges is not natively supported in PostgreSQL without triggers.

### Table Definition

```sql
CREATE TABLE public.period_day_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date        DATE        NOT NULL,
  flow_intensity  TEXT        NOT NULL,
  symptoms        TEXT[]      NOT NULL DEFAULT '{}'::TEXT[],
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, log_date)
);
```

### Constraints

| Column | Constraint | Rationale |
|--------|-----------|-----------|
| `flow_intensity` | `CHECK (flow_intensity IN ('spotting', 'light', 'medium', 'heavy'))` | Closed enum — matches UI picker options. Stored as TEXT (not Postgres ENUM) to allow adding values without migration. |
| `symptoms` | `CHECK (symptoms <@ ARRAY['cramps', 'fatigue', 'headache', 'bloating', 'mood_swings', 'nausea']::TEXT[])` | Subset constraint using `<@` operator — all elements must be from the allowed set. |
| `log_date` | Part of `UNIQUE(user_id, log_date)` | One flow entry per user per day. Upsert on conflict. |

### Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `UNIQUE(user_id, log_date)` | B-tree (implicit) | Primary lookup pattern: fetch day details for a user within a date range. Also enforces one entry per day. |
| `idx_period_day_logs_user_date` | B-tree on `(user_id, log_date DESC)` | Optimizes the common query: "get all day logs for user X ordered by date" (calendar view, partner sync). |
| `idx_period_day_logs_symptoms` | GIN on `symptoms` | Enables efficient `@>` (contains) queries for symptom filtering/analytics. |

### Why Not a Postgres ENUM?

`flow_intensity` uses a CHECK constraint on TEXT rather than `CREATE TYPE ... AS ENUM` because:
- Adding a new intensity level (e.g., `very_heavy`) requires only an `ALTER TABLE ... DROP CONSTRAINT / ADD CONSTRAINT`, not `ALTER TYPE ... ADD VALUE` which cannot run inside a transaction.
- Consistent with how `period_logs.tags` and `sos_signals.type` are implemented in this codebase.

---

## 2. Row Level Security Policies

### Policy Design

The RLS model mirrors `period_logs` exactly: **owner has full access, partner has read-only access**.

| Policy Name | Operation | Rule | Notes |
|-------------|-----------|------|-------|
| `period_day_logs: read own or partner's` | SELECT | `user_id = auth.uid() OR user_id = (SELECT public.my_partner_id())` | Sun can see Moon's day-by-day flow and symptoms in real-time. Uses subquery wrapping per migration 006 pattern. |
| `period_day_logs: insert own only` | INSERT | `WITH CHECK (user_id = auth.uid())` | Only Moon can create her own day logs. |
| `period_day_logs: update own only` | UPDATE | `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())` | Only Moon can modify her own day logs. |
| `period_day_logs: delete own only` | DELETE | `USING (user_id = auth.uid())` | Only Moon can delete her own day logs. |

### Why Separate INSERT/UPDATE/DELETE Instead of FOR ALL?

The existing `period_logs` uses `FOR ALL` with a single policy. However, splitting into granular policies is recommended here because:

1. **Clarity**: Each operation's intent is self-documenting.
2. **Security audit**: Easier to verify that partner cannot write when policies are explicit.
3. **Future flexibility**: Can add constraints per operation (e.g., prevent DELETE after 30 days) without rewriting a monolithic policy.

### Partner Access Verification

Sun's read access flows through `my_partner_id()`:

```
Sun (auth.uid()) → my_partner_id() → returns Moon's user_id
                                     → period_day_logs.user_id matches
                                     → SELECT allowed
```

Sun attempting INSERT/UPDATE/DELETE:
```
Sun (auth.uid()) → period_day_logs.user_id = Moon's ID
                 → auth.uid() ≠ Moon's ID
                 → DENIED
```

---

## 3. Realtime Subscription Spec

### Tables Requiring Realtime

| Table | Realtime? | Justification |
|-------|-----------|---------------|
| `period_day_logs` | **Yes** | Sun needs live updates when Moon logs/edits daily flow and symptoms. |
| `period_logs` | Already enabled | No change needed. |

### Event Types

| Event | Use Case |
|-------|----------|
| INSERT | Moon logs a new day's flow/symptoms. Sun's dashboard updates immediately. |
| UPDATE | Moon edits a previously logged day (changes flow intensity or adds symptoms). Sun sees the correction. |
| DELETE | Moon removes a day log (e.g., logged wrong date). Sun's view reflects removal. |

### Subscription Pattern (Client-Side)

The subscription follows the existing `subscribeToPeriodLogs()` pattern in `app/lib/db/cycle.ts`:

```typescript
// New function: subscribeToPeriodDayLogs()
// Channel: period-day-logs:{moonUserId}
// Events: INSERT, UPDATE, DELETE
// Filter: user_id=eq.{moonUserId}
//
// On INSERT/UPDATE: upsert into local state (Zustand store)
// On DELETE: remove from local state by (user_id, log_date)
```

### Realtime Filter

Supabase Realtime supports `eq` filters on columns. The subscription uses `user_id=eq.{moonUserId}` to receive only the partner's events, avoiding unnecessary traffic.

### UI Update Flow

```
Moon taps "Heavy" for March 15
  → App upserts period_day_logs (user_id, 2026-03-15, 'heavy', ['cramps'])
  → Supabase broadcasts INSERT event on period_day_logs
  → Sun's Realtime channel receives event
  → Sun's Zustand store updates periodDayLogs map
  → Sun's dashboard re-renders with updated flow indicator
```

### RLS + Realtime Interaction

Supabase Realtime respects RLS policies. Sun receives events for Moon's `period_day_logs` rows because the SELECT policy grants access via `my_partner_id()`. No additional configuration needed beyond adding the table to the publication.

---

## 4. Prediction Algorithm

### Recommendation: Keep Client-Side

The prediction logic should remain in `app/utils/cycleCalculator.ts` for the following reasons:

| Factor | Client-Side | Server-Side (Postgres) |
|--------|-------------|----------------------|
| Latency | Zero — computed locally | Round-trip to Supabase (~100-300ms) |
| Complexity | Low — weighted average over 7 data points | Same algorithm, different language |
| Data volume | Max 7 recent periods (already fetched) | Same, but requires a DB call |
| Offline support | Works offline with cached data | Fails without connectivity |
| Current state | Already implemented and tested | Would need reimplementation |

### How `period_day_logs` Enhances Predictions

The new per-day flow data can improve prediction accuracy without moving logic server-side:

1. **Period length refinement**: Instead of relying on `period_logs.end_date` (which Moon may forget to set), count the number of `period_day_logs` rows within a period range to auto-detect period length.
2. **Flow pattern analysis**: Track typical flow progression (e.g., light → heavy → medium → light) to predict period end more accurately.
3. **Symptom-based early warning**: If Moon logs `cramps` or `bloating` on a non-period day, the app could surface "period may be starting soon" (future feature).

### Client-Side Enhancement (No Migration Needed)

```typescript
// In cycleCalculator.ts, add:
export function inferPeriodLength(dayLogs: PeriodDayLog[]): number {
  // Count consecutive days with flow >= 'light' to determine actual period length
  // More accurate than relying on manually-set end_date
}
```

### Future: Server-Side Path (If Needed)

If prediction complexity grows (e.g., ML model, cross-user anonymized patterns), the algorithm could move to a Postgres function:

```sql
-- Future: not part of this migration
CREATE OR REPLACE FUNCTION public.predict_next_period(p_user_id UUID)
RETURNS TABLE (predicted_date DATE, confidence INTEGER, window_start DATE, window_end DATE)
AS $$
  -- Weighted average of recent cycle gaps
  -- Uses period_day_logs for refined period length
  -- Returns prediction window
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
```

This would be exposed via Supabase RPC: `supabase.rpc('predict_next_period', { p_user_id })`. Not recommended for v1.6 but documented for future consideration.

---

## 5. Data Migration

### Migration File: `app/supabase/migrations/008_period_day_logs.sql`

```sql
-- =============================================================================
-- Migration 008: period_day_logs — Per-Day Period Detail Tracking
--
-- CR: CR_20260316_001 (Log Period Flo-Style Redesign)
-- Date: 2026-03-16
--
-- Adds a new table for per-day period details (flow intensity, symptoms).
-- Enables Moon to log granular daily data during her period.
-- Sun can read (not write) via RLS + Realtime for live partner sync.
--
-- Dependencies: 001_initial_schema.sql (profiles, period_logs, helpers)
--               006_security_hardening.sql (subquery-wrapped RLS pattern)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. CREATE TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE public.period_day_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date        DATE        NOT NULL,
  flow_intensity  TEXT        NOT NULL,
  symptoms        TEXT[]      NOT NULL DEFAULT '{}'::TEXT[],
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One entry per user per day
  UNIQUE (user_id, log_date)
);

COMMENT ON TABLE public.period_day_logs IS
  'Per-day period detail: flow intensity and symptoms. One row per day within a period. '
  'Logically linked to period_logs by user_id + date range, enforced at application layer.';

COMMENT ON COLUMN public.period_day_logs.flow_intensity IS
  'Flow level for this day: spotting, light, medium, or heavy.';

COMMENT ON COLUMN public.period_day_logs.symptoms IS
  'Array of symptom identifiers from the allowed set. Empty array if no symptoms.';

-- ---------------------------------------------------------------------------
-- 2. CONSTRAINTS
-- ---------------------------------------------------------------------------

-- Flow intensity must be one of the allowed values
ALTER TABLE public.period_day_logs
  ADD CONSTRAINT chk_flow_intensity
  CHECK (flow_intensity IN ('spotting', 'light', 'medium', 'heavy'));

-- All symptoms must be from the allowed set (subset check via <@ operator)
ALTER TABLE public.period_day_logs
  ADD CONSTRAINT chk_period_day_symptoms
  CHECK (symptoms <@ ARRAY['cramps', 'fatigue', 'headache', 'bloating', 'mood_swings', 'nausea']::TEXT[]);

-- ---------------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------------

-- Primary query pattern: fetch day logs for a user within a date range, newest first
CREATE INDEX idx_period_day_logs_user_date
  ON public.period_day_logs (user_id, log_date DESC);

-- Symptom filtering/analytics queries
CREATE INDEX idx_period_day_logs_symptoms
  ON public.period_day_logs USING GIN (symptoms);

-- ---------------------------------------------------------------------------
-- 4. AUTO-UPDATE updated_at TRIGGER
-- ---------------------------------------------------------------------------

CREATE TRIGGER period_day_logs_updated_at
  BEFORE UPDATE ON public.period_day_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.period_day_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: owner + partner (read-only for partner)
-- Uses (SELECT ...) subquery wrapping per migration 006 security pattern
CREATE POLICY "period_day_logs: read own or partner's"
  ON public.period_day_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id = (SELECT public.my_partner_id()));

-- INSERT: owner only
CREATE POLICY "period_day_logs: insert own only"
  ON public.period_day_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: owner only
CREATE POLICY "period_day_logs: update own only"
  ON public.period_day_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: owner only
CREATE POLICY "period_day_logs: delete own only"
  ON public.period_day_logs FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. REALTIME PUBLICATION
-- ---------------------------------------------------------------------------

-- Enable Realtime for partner sync (Sun receives Moon's day log changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.period_day_logs;

COMMIT;
```

### Migration Checklist

- [x] Table creation with proper column types
- [x] Foreign key to `profiles(id)` with CASCADE delete
- [x] UNIQUE constraint on `(user_id, log_date)` for upsert support
- [x] CHECK constraint on `flow_intensity` (closed enum via TEXT)
- [x] CHECK constraint on `symptoms` (subset validation via `<@`)
- [x] B-tree index on `(user_id, log_date DESC)` for range queries
- [x] GIN index on `symptoms` for array queries
- [x] `updated_at` auto-update trigger using existing `set_updated_at()`
- [x] RLS enabled with 4 granular policies (SELECT, INSERT, UPDATE, DELETE)
- [x] Subquery-wrapped `my_partner_id()` calls (migration 006 pattern)
- [x] Added to `supabase_realtime` publication
- [x] Wrapped in transaction (`BEGIN` / `COMMIT`)
- [x] Comments on table and key columns

### Rollback

```sql
-- Rollback migration 008 (if needed)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.period_day_logs;
DROP TABLE IF EXISTS public.period_day_logs CASCADE;
```

---

## Appendix A: TypeScript Types (for `app/types/index.ts`)

```typescript
// New type for period_day_logs rows
export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy';

export type PeriodSymptom =
  | 'cramps'
  | 'fatigue'
  | 'headache'
  | 'bloating'
  | 'mood_swings'
  | 'nausea';

export interface DbPeriodDayLog {
  id: string;
  user_id: string;
  log_date: string;          // YYYY-MM-DD
  flow_intensity: FlowIntensity;
  symptoms: PeriodSymptom[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// App-layer type (camelCase)
export interface PeriodDayRecord {
  logDate: string;            // YYYY-MM-DD
  flowIntensity: FlowIntensity;
  symptoms: PeriodSymptom[];
  notes?: string;
}
```

## Appendix B: Data Access Layer (for `app/lib/db/cycle.ts`)

```typescript
// New functions to add to cycle.ts

/** Upsert a single day's period details. */
export async function upsertPeriodDayLog(
  userId: string,
  logDate: string,
  flowIntensity: FlowIntensity,
  symptoms: PeriodSymptom[],
  notes?: string,
): Promise<void> {
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

  if (error) throw error;
}

/** Fetch period day logs for a user within a date range. */
export async function fetchPeriodDayLogs(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<PeriodDayRecord[]> {
  const { data, error } = await supabase
    .from('period_day_logs')
    .select('log_date, flow_intensity, symptoms, notes')
    .eq('user_id', userId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Pick<DbPeriodDayLog, 'log_date' | 'flow_intensity' | 'symptoms' | 'notes'>[]).map(
    (row) => ({
      logDate: row.log_date,
      flowIntensity: row.flow_intensity,
      symptoms: row.symptoms ?? [],
      ...(row.notes != null ? { notes: row.notes } : {}),
    }),
  );
}

/** Delete a specific day log. */
export async function deletePeriodDayLog(
  userId: string,
  logDate: string,
): Promise<void> {
  const { error } = await supabase
    .from('period_day_logs')
    .delete()
    .eq('user_id', userId)
    .eq('log_date', logDate);

  if (error) throw error;
}

/** Subscribe to period day log changes for a specific user (partner sync). */
export function subscribeToPeriodDayLogs(
  moonUserId: string,
  onDayLogChange: (
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    log: Pick<DbPeriodDayLog, 'log_date' | 'flow_intensity' | 'symptoms'> | null,
    oldLog: Pick<DbPeriodDayLog, 'log_date'> | null,
  ) => void,
): () => void {
  const channel = supabase
    .channel(`period-day-logs:${moonUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'period_day_logs',
        filter: `user_id=eq.${moonUserId}`,
      },
      (payload) => {
        const record = payload.new as unknown as DbPeriodDayLog;
        onDayLogChange('INSERT', {
          log_date: record.log_date,
          flow_intensity: record.flow_intensity,
          symptoms: record.symptoms,
        }, null);
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'period_day_logs',
        filter: `user_id=eq.${moonUserId}`,
      },
      (payload) => {
        const record = payload.new as unknown as DbPeriodDayLog;
        onDayLogChange('UPDATE', {
          log_date: record.log_date,
          flow_intensity: record.flow_intensity,
          symptoms: record.symptoms,
        }, null);
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'period_day_logs',
        filter: `user_id=eq.${moonUserId}`,
      },
      (payload) => {
        const old = payload.old as unknown as Pick<DbPeriodDayLog, 'log_date'>;
        onDayLogChange('DELETE', null, { log_date: old.log_date });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

## Appendix C: Impact on Existing Tables

| Table | Change | Details |
|-------|--------|---------|
| `period_logs` | **None** | Continues to track period ranges (start/end). `period_day_logs` supplements it with per-day detail. |
| `daily_logs` | **None** | Remains the general mood/energy check-in. Not overloaded with period-specific data. |
| `cycle_settings` | **None** | Still stores rolling averages. Future: `avg_period_length` could be auto-computed from `period_day_logs` count. |
| `profiles` | **None** | FK target only. |

## Appendix D: Query Patterns

### Moon: Log a period day (Flo-style UI)

```sql
-- Upsert: Moon taps "Heavy" + selects "cramps, headache" for March 15
INSERT INTO period_day_logs (user_id, log_date, flow_intensity, symptoms)
VALUES ('moon-uuid', '2026-03-15', 'heavy', ARRAY['cramps', 'headache'])
ON CONFLICT (user_id, log_date)
DO UPDATE SET
  flow_intensity = EXCLUDED.flow_intensity,
  symptoms = EXCLUDED.symptoms,
  updated_at = NOW();
```

### Sun: Read partner's period day details

```sql
-- Sun fetches Moon's day logs for current period (RLS grants access via my_partner_id())
SELECT log_date, flow_intensity, symptoms, notes
FROM period_day_logs
WHERE user_id = 'moon-uuid'
  AND log_date BETWEEN '2026-03-12' AND '2026-03-18'
ORDER BY log_date;
```

### Analytics: Symptom frequency across cycles

```sql
-- Which symptoms does Moon experience most during periods?
SELECT unnest(symptoms) AS symptom, COUNT(*) AS occurrences
FROM period_day_logs
WHERE user_id = 'moon-uuid'
GROUP BY symptom
ORDER BY occurrences DESC;
```

### Infer period length from day logs

```sql
-- Count logged days within a period range for auto-detecting period length
SELECT COUNT(*) AS logged_days
FROM period_day_logs
WHERE user_id = 'moon-uuid'
  AND log_date BETWEEN '2026-03-12' AND '2026-03-18'
  AND flow_intensity != 'spotting';  -- exclude spotting-only days from core length
```
