-- =============================================================================
-- Easel — Moon/Sun Schema Extension
-- Migration: 002_moon_sun_schema.sql
--
-- Safe, idempotent migration — can be run multiple times without error.
-- Extends the initial schema to support Moon/Sun role terminology and adds:
--   - whisper_history: tracks Moon's frequently-used whisper selections
--   - notification_preferences: per-user fine-grained notification toggles
--   - Auto-provisioning trigger for notification_preferences on profile creation
--   - link_code_expires_at column on couples (if not already present)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Expand role constraint to include moon/sun (backward compatible)
--    Drops and recreates the check so existing girlfriend/boyfriend rows
--    remain valid alongside the new moon/sun values.
-- ---------------------------------------------------------------------------
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('moon', 'sun', 'girlfriend', 'boyfriend'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;


-- ---------------------------------------------------------------------------
-- 2. whisper_history
--    Stores Moon's whisper text selections with frequency tracking so the
--    AI can surface personalised suggestions based on past preferences.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS whisper_history (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text             TEXT        NOT NULL,
  selected_count   INTEGER     NOT NULL DEFAULT 1,
  last_selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index optimised for the "top N most-used whispers per user" query.
CREATE INDEX IF NOT EXISTS idx_whisper_history_user_freq
  ON whisper_history(user_id, selected_count DESC, last_selected_at DESC);

ALTER TABLE whisper_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whisper_history' AND policyname = 'whisper_history_own'
  ) THEN
    CREATE POLICY whisper_history_own ON whisper_history
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 3. notification_preferences
--    One row per user. Stores granular toggle state for every notification
--    type plus the AI-timing vs manual-days configuration.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id            UUID      PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  period_approaching BOOLEAN   NOT NULL DEFAULT TRUE,
  period_started     BOOLEAN   NOT NULL DEFAULT TRUE,
  period_ended       BOOLEAN   NOT NULL DEFAULT TRUE,
  whisper_alerts     BOOLEAN   NOT NULL DEFAULT TRUE,
  use_ai_timing      BOOLEAN   NOT NULL DEFAULT TRUE,
  manual_days_before INTEGER   NOT NULL DEFAULT 3
                               CHECK (manual_days_before BETWEEN 1 AND 7),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_preferences' AND policyname = 'notif_prefs_own'
  ) THEN
    CREATE POLICY notif_prefs_own ON notification_preferences
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 4. Auto-create notification_preferences on new profile
--    Ensures every user always has a preferences row without requiring the
--    application to insert one explicitly after sign-up.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_notif_prefs ON profiles;
CREATE TRIGGER on_profile_created_notif_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();


-- ---------------------------------------------------------------------------
-- 5. couples: add link_code_expires_at if missing
--    Column already exists in the initial schema but the ADD COLUMN IF NOT
--    EXISTS guard makes this migration safe to re-run against either schema
--    version.
-- ---------------------------------------------------------------------------
ALTER TABLE couples ADD COLUMN IF NOT EXISTS link_code_expires_at TIMESTAMPTZ;
