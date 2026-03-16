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

-- Primary query pattern: fetch day logs for a user within a date range
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
