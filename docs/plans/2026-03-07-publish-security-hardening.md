# Easel Security Hardening & App Store Publishing — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all CRITICAL/HIGH/MEDIUM security issues and publish Easel to iOS App Store + Google Play Store.

**Architecture:** New Supabase migration (006) for all DB-level fixes. Edge function patches for auth + error handling. App-side fixes for avatar persistence, select column lists, and TOCTOU race. EAS Build configuration for store submission.

**Tech Stack:** Supabase PostgreSQL, Deno Edge Functions, Expo EAS Build, React Native, TypeScript

---

### Task 1: Create Security Hardening Migration (006)

**Files:**
- Create: `app/supabase/migrations/006_security_hardening.sql`

**Step 1: Write the migration file**

This single migration addresses: UNIQUE(boyfriend_id), RLS subquery optimization, search_path on SECURITY DEFINER functions, FK indexes, sos_signals type constraint, and sos_signals UPDATE restriction.

```sql
-- =============================================================================
-- Easel — Migration 006: Security Hardening (Pre-Publishing)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CRITICAL-1: Add UNIQUE constraint on boyfriend_id
-- Without this, a Sun user could be linked to multiple Moons, causing
-- my_couple_id() to return an arbitrary row and potentially leaking
-- the wrong Moon's health data.
-- ---------------------------------------------------------------------------
ALTER TABLE public.couples
  ADD CONSTRAINT unique_boyfriend UNIQUE (boyfriend_id);

-- ---------------------------------------------------------------------------
-- CRITICAL-3: Fix SECURITY DEFINER functions — add SET search_path
-- Without search_path pinning, a malicious caller could redirect these
-- functions to resolve tables in an attacker-controlled schema.
-- Also wrap RLS policy function calls in (SELECT ...) subqueries so
-- PostgreSQL executes them once per query instead of once per row.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_couple_id()
RETURNS UUID AS $$
  SELECT id
  FROM public.couples
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
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
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

-- ---------------------------------------------------------------------------
-- CRITICAL-3 (cont.): Recreate RLS policies with (SELECT ...) subquery
-- wrapping to prevent per-row function execution.
-- ---------------------------------------------------------------------------

-- profiles
DROP POLICY IF EXISTS "profiles: read own and partner" ON public.profiles;
CREATE POLICY "profiles: read own and partner"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR id = (SELECT public.my_partner_id()));

-- cycle_settings
DROP POLICY IF EXISTS "cycle_settings: read own or partner's" ON public.cycle_settings;
CREATE POLICY "cycle_settings: read own or partner's"
  ON public.cycle_settings FOR SELECT
  USING (user_id = auth.uid() OR user_id = (SELECT public.my_partner_id()));

-- period_logs
DROP POLICY IF EXISTS "period_logs: read own or partner's" ON public.period_logs;
CREATE POLICY "period_logs: read own or partner's"
  ON public.period_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id = (SELECT public.my_partner_id()));

-- daily_logs
DROP POLICY IF EXISTS "daily_logs: read own or partner's" ON public.daily_logs;
CREATE POLICY "daily_logs: read own or partner's"
  ON public.daily_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id = (SELECT public.my_partner_id()));

-- sos_signals
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

-- ---------------------------------------------------------------------------
-- HIGH-1: Restrict sos_signals UPDATE to only acknowledged_at column
-- The old policy allowed updating ANY column. This trigger rejects
-- changes to any column except acknowledged_at.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sos_signals: recipient can acknowledge (update)" ON public.sos_signals;
CREATE POLICY "sos_signals: recipient can acknowledge (update)"
  ON public.sos_signals FOR UPDATE
  USING (
    couple_id = (SELECT public.my_couple_id())
    AND sender_id <> auth.uid()
  );

CREATE OR REPLACE FUNCTION public.guard_sos_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only acknowledged_at may change
  IF NEW.couple_id    <> OLD.couple_id    OR
     NEW.sender_id    <> OLD.sender_id    OR
     NEW.type         <> OLD.type         OR
     NEW.message IS DISTINCT FROM OLD.message OR
     NEW.created_at   <> OLD.created_at   THEN
    RAISE EXCEPTION 'Only acknowledged_at may be updated on sos_signals';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER sos_signals_guard_update
  BEFORE UPDATE ON public.sos_signals
  FOR EACH ROW EXECUTE FUNCTION public.guard_sos_update();

-- ---------------------------------------------------------------------------
-- CRITICAL-4: Add length + character constraint on sos_signals.type
-- AI-generated whisper options can have dynamic IDs, so we use a
-- reasonable length limit + alphanumeric pattern instead of a strict list.
-- ---------------------------------------------------------------------------
ALTER TABLE public.sos_signals
  ADD CONSTRAINT sos_type_format
    CHECK (type ~ '^[a-z][a-z0-9_]{0,49}$');

-- ---------------------------------------------------------------------------
-- MEDIUM-2: Add missing indexes on FK columns for RLS performance
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sos_signals_couple_id ON public.sos_signals(couple_id);
CREATE INDEX IF NOT EXISTS idx_sos_signals_sender_id ON public.sos_signals(sender_id);
CREATE INDEX IF NOT EXISTS idx_period_logs_user_id ON public.period_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_couples_boyfriend_id ON public.couples(boyfriend_id);

-- ---------------------------------------------------------------------------
-- MEDIUM-4: Add expiry check to couples link — DB-level guard
-- Prevents linking with expired codes even if app-level check is bypassed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_couple_link()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enforce on status transition from pending to linked
  IF OLD.status = 'pending' AND NEW.status = 'linked' THEN
    IF OLD.link_code_expires_at IS NOT NULL
       AND OLD.link_code_expires_at < NOW() THEN
      RAISE EXCEPTION 'Link code has expired';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER couples_guard_link
  BEFORE UPDATE ON public.couples
  FOR EACH ROW EXECUTE FUNCTION public.guard_couple_link();
```

**Step 2: Verify migration syntax**

Run: `cd app && cat supabase/migrations/006_security_hardening.sql | head -5`
Expected: First lines of the migration visible.

**Step 3: Commit**

```bash
git add app/supabase/migrations/006_security_hardening.sql
git commit -m "fix(db): security hardening migration 006 — UNIQUE boyfriend_id, RLS subquery, indexes, guards"
```

---

### Task 2: Fix Edge Function Authentication & Error Handling

**Files:**
- Modify: `app/supabase/functions/notify-cycle/index.ts:55,178-183`
- Modify: `app/supabase/functions/notify-sos/index.ts:158-163`

**Step 1: Add auth check to notify-cycle**

At line 55, replace `Deno.serve(async (_req: Request) => {` with auth validation:

```typescript
Deno.serve(async (req: Request) => {
  // Validate authorization — only pg_cron or admin should call this
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authHeader || !serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
```

**Step 2: Fix error response in notify-cycle (line 178-183)**

Replace the catch block error response:

```typescript
  } catch (err) {
    console.error('notify-cycle error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
```

**Step 3: Fix error response in notify-sos (line 158-163)**

Replace the catch block error response:

```typescript
  } catch (err) {
    console.error('notify-sos error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
```

**Step 4: Commit**

```bash
git add app/supabase/functions/notify-cycle/index.ts app/supabase/functions/notify-sos/index.ts
git commit -m "fix(edge): add auth check to notify-cycle, sanitize error responses in both edge functions"
```

---

### Task 3: Fix Avatar Persistence & Select Column Lists

**Files:**
- Modify: `app/store/appStore.ts:330` (updateAvatarUrl)
- Modify: `app/store/appStore.ts:128,217,237` (bootstrapSession — restore avatarUrl from DB)
- Modify: `app/lib/db/profiles.ts:16` (select columns)
- Modify: `app/lib/db/profiles.ts:29` (upsertProfile fields)
- Modify: `app/lib/db/couples.ts:105` (select columns)
- Modify: `app/lib/db/cycle.ts:18` (select columns)

**Step 1: Fix updateAvatarUrl to persist to DB**

In `appStore.ts` line 330, replace:

```typescript
updateAvatarUrl: (url) => set({ avatarUrl: url }),
```

with:

```typescript
updateAvatarUrl: async (url) => {
  set({ avatarUrl: url });
  const { userId } = get();
  if (userId) {
    await upsertProfile(userId, { avatar_url: url });
  }
},
```

Also update the interface (line 66):
```typescript
updateAvatarUrl: (url: string) => Promise<void>;
```

**Step 2: Update upsertProfile to accept avatar_url**

In `profiles.ts` line 29, change the fields type:

```typescript
export async function upsertProfile(
  userId: string,
  fields: Partial<Pick<DbProfile, 'role' | 'display_name' | 'avatar_url'>>
): Promise<void> {
```

Also update DbProfile to include avatar_url (add after line 8):
```typescript
  avatar_url: string | null;
```

**Step 3: Replace select('*') with explicit columns**

In `profiles.ts` line 16:
```typescript
.select('id, email, role, display_name, avatar_url, created_at, updated_at')
```

In `couples.ts` line 105:
```typescript
.select('id, girlfriend_id, boyfriend_id, link_code, link_code_expires_at, status, created_at, linked_at')
```

In `cycle.ts` line 18:
```typescript
.select('id, user_id, avg_cycle_length, avg_period_length, last_period_start_date, created_at, updated_at')
```

**Step 4: Restore avatarUrl in bootstrapSession**

In `appStore.ts`, the bootstrapSession and signIn functions should set avatarUrl from the profile:

In signIn (around line 141), add to the set() call:
```typescript
avatarUrl: profile?.avatar_url ?? null,
```

In bootstrapSession (around line 228), add to the set() call:
```typescript
avatarUrl: profile?.avatar_url ?? null,
```

**Step 5: Commit**

```bash
git add app/store/appStore.ts app/lib/db/profiles.ts app/lib/db/couples.ts app/lib/db/cycle.ts
git commit -m "fix: persist avatar to DB, replace select('*') with explicit columns, restore avatarUrl on session"
```

---

### Task 4: Update App Version & Create EAS Build Config

**Files:**
- Modify: `app/app.json` (version, new fields)
- Create: `app/eas.json`

**Step 1: Update app.json**

Update version from `1.0.0` to `1.5.0`. Add iOS/Android build numbers. Add required store metadata fields.

Key changes:
- `"version": "1.5.0"`
- `ios.buildNumber`: `"1"`
- `android.versionCode`: `1`
- `ios.infoPlist.NSHealthShareUsageDescription` (already in plugins)
- `ios.config.usesNonExemptEncryption`: `false` (HTTPS only, no custom crypto)

**Step 2: Create eas.json**

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "duypham9895@gmail.com",
        "ascAppId": "FILL_AFTER_CREATING_APP_IN_ASC",
        "appleTeamId": "FILL_YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-services.json",
        "track": "internal"
      }
    }
  }
}
```

**Step 3: Commit**

```bash
git add app/app.json app/eas.json
git commit -m "chore: sync app.json to v1.5.0, create eas.json build config"
```

---

### Task 5: Update CHANGELOG & Release

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add v1.5.0 entry**

Add new version section above `[1.4.1]` with all security fixes documented.

**Step 2: Commit and tag**

```bash
git add CHANGELOG.md
git commit -m "release: v1.5.0 — security hardening for App Store publishing"
git tag v1.5.0
git push origin main && git push origin v1.5.0
```

---

### Task 6: Build & Submit (requires developer accounts)

**Step 1: Install EAS CLI and login**

```bash
npm install -g eas-cli
eas login
```

**Step 2: Build for both platforms**

```bash
cd app
eas build --platform ios --profile preview    # TestFlight internal
eas build --platform android --profile preview # Internal APK
```

**Step 3: After testing, build production**

```bash
eas build --platform all --profile production
```

**Step 4: Submit to stores**

```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## Dependency Graph

```
Task 1 (DB migration) ──┐
Task 2 (Edge functions) ─┤── All independent, can run in parallel
Task 3 (App code fixes) ─┤
Task 4 (EAS config) ─────┘
         │
         ▼
Task 5 (CHANGELOG + release) ── depends on all above
         │
         ▼
Task 6 (Build + Submit) ── depends on Task 5 + developer accounts
```
