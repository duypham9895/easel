-- 004_relax_sos_type_constraint.sql
-- Drop the restrictive CHECK constraint on sos_signals.type so
-- whisper option IDs (hug, warmth, plan, etc.) can be stored.
ALTER TABLE public.sos_signals
  DROP CONSTRAINT IF EXISTS sos_signals_type_check;
