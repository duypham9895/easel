-- Migration 006: Security Hardening
-- Purpose: Harden RLS policies, fix SECURITY DEFINER search_path,
--          add missing constraints, indexes, and guard triggers.
-- Date: 2026-03-07

BEGIN;

-- ============================================================================
-- 1. UNIQUE constraint on couples.boyfriend_id
--    Prevents a single boyfriend account from being linked to multiple couples.
-- ============================================================================

ALTER TABLE public.couples
  ADD CONSTRAINT unique_boyfriend UNIQUE (boyfriend_id);

-- ============================================================================
-- 2. Fix SECURITY DEFINER functions — add SET search_path = public
--    Prevents search_path hijacking in security-definer context.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.my_couple_id()
RETURNS UUID AS $$
  SELECT id FROM public.couples
  WHERE (girlfriend_id = auth.uid() OR boyfriend_id = auth.uid())
    AND status = 'linked'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.my_partner_id()
RETURNS UUID AS $$
  SELECT CASE
    WHEN girlfriend_id = auth.uid() THEN boyfriend_id
    ELSE girlfriend_id
  END
  FROM public.couples
  WHERE (girlfriend_id = auth.uid() OR boyfriend_id = auth.uid())
    AND status = 'linked'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- 3. Recreate RLS policies with (SELECT ...) subquery wrapping
--    Wrapping helper calls in a scalar subquery ensures the function is
--    evaluated once per query instead of once per row, which is both a
--    performance win and a security improvement.
-- ============================================================================

-- profiles ---------------------------------------------------------------
DROP POLICY IF EXISTS "profiles: read own and partner" ON public.profiles;
CREATE POLICY "profiles: read own and partner"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR id = (SELECT public.my_partner_id()));

-- cycle_settings ---------------------------------------------------------
DROP POLICY IF EXISTS "cycle_settings: read own or partner's" ON public.cycle_settings;
CREATE POLICY "cycle_settings: read own or partner's"
  ON public.cycle_settings FOR SELECT
  USING (user_id = auth.uid() OR user_id = (SELECT public.my_partner_id()));

-- period_logs ------------------------------------------------------------
DROP POLICY IF EXISTS "period_logs: read own or partner's" ON public.period_logs;
CREATE POLICY "period_logs: read own or partner's"
  ON public.period_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id = (SELECT public.my_partner_id()));

-- daily_logs -------------------------------------------------------------
DROP POLICY IF EXISTS "daily_logs: read own or partner's" ON public.daily_logs;
CREATE POLICY "daily_logs: read own or partner's"
  ON public.daily_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id = (SELECT public.my_partner_id()));

-- sos_signals ------------------------------------------------------------
DROP POLICY IF EXISTS "sos_signals: couple members can read" ON public.sos_signals;
CREATE POLICY "sos_signals: couple members can read"
  ON public.sos_signals FOR SELECT
  USING (couple_id = (SELECT public.my_couple_id()));

DROP POLICY IF EXISTS "sos_signals: sender can insert" ON public.sos_signals;
CREATE POLICY "sos_signals: sender can insert"
  ON public.sos_signals FOR INSERT
  WITH CHECK (
    couple_id = (SELECT public.my_couple_id())
    AND sender_id = auth.uid()
  );

DROP POLICY IF EXISTS "sos_signals: recipient can acknowledge (update)" ON public.sos_signals;
CREATE POLICY "sos_signals: recipient can acknowledge (update)"
  ON public.sos_signals FOR UPDATE
  USING (
    couple_id = (SELECT public.my_couple_id())
    AND sender_id <> auth.uid()
  );

-- ============================================================================
-- 4. sos_signals UPDATE guard trigger
--    Only the acknowledged_at column may be changed on an existing row.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.guard_sos_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.couple_id <> OLD.couple_id OR
     NEW.sender_id <> OLD.sender_id OR
     NEW.type <> OLD.type OR
     NEW.message IS DISTINCT FROM OLD.message OR
     NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Only acknowledged_at may be updated on sos_signals';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS sos_signals_guard_update ON public.sos_signals;
CREATE TRIGGER sos_signals_guard_update
  BEFORE UPDATE ON public.sos_signals
  FOR EACH ROW EXECUTE FUNCTION public.guard_sos_update();

-- ============================================================================
-- 5. sos_signals type constraint
--    Enforce a lowercase snake_case pattern so AI-generated IDs stay sane.
-- ============================================================================

ALTER TABLE public.sos_signals
  ADD CONSTRAINT sos_type_format CHECK (type ~ '^[a-z][a-z0-9_]{0,49}$');

-- ============================================================================
-- 6. Foreign-key indexes
--    Speed up RLS policy lookups and JOIN performance on FK columns.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sos_signals_couple_id ON public.sos_signals(couple_id);
CREATE INDEX IF NOT EXISTS idx_sos_signals_sender_id ON public.sos_signals(sender_id);
CREATE INDEX IF NOT EXISTS idx_period_logs_user_id   ON public.period_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id    ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id   ON public.push_tokens(user_id);
-- Note: couples.boyfriend_id already has a unique index from the UNIQUE constraint above

-- ============================================================================
-- 7. Couples link expiry guard
--    Reject linking if the link code has already expired.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.guard_couple_link()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'linked' THEN
    IF OLD.link_code_expires_at IS NOT NULL AND OLD.link_code_expires_at < NOW() THEN
      RAISE EXCEPTION 'Link code has expired';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS couples_guard_link ON public.couples;
CREATE TRIGGER couples_guard_link
  BEFORE UPDATE ON public.couples
  FOR EACH ROW EXECUTE FUNCTION public.guard_couple_link();

-- Drop orphaned updated_at trigger — couples table has no updated_at column
DROP TRIGGER IF EXISTS couples_updated_at ON public.couples;

-- ============================================================================
-- 8. Display name length constraint
--    Prevents arbitrarily long display names that could cause UI issues
--    or storage abuse.
-- ============================================================================

ALTER TABLE public.profiles
  ADD CONSTRAINT display_name_length CHECK (char_length(display_name) <= 100);

COMMIT;
