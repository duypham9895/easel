# Easel — Ready-to-Use Prompts for Common Tasks

## 1. Add a New AI Endpoint

```
I need to add a new AI endpoint to Easel. The endpoint should:
- Name: /api/<name>
- Purpose: <what it generates>
- Input: <fields with types and constraints>
- Output: <expected response shape>

Follow the existing patterns:
1. Add prompt function to proxy/lib/minimax.ts (choose appropriate temperature)
2. Create proxy/api/<name>.ts with 5-layer security
3. Create app/hooks/useAI<Name>.ts with fallback pattern
4. Integrate in the relevant component
5. Update docs/API.md
```

## 2. Add a New Database Table

```
I need to add a new table to the Supabase database:
- Table name: <name>
- Columns: <list with types>
- RLS rules: <who can read/write>

Follow the existing patterns:
1. Create migration app/supabase/migrations/00N_<name>.sql with RLS
2. Add types to app/types/index.ts (Db prefix)
3. Create app/lib/db/<name>.ts (pure async functions, explicit select columns)
4. Add state + actions to app/store/appStore.ts
```

## 3. Fix a Bug in Cycle Calculation

```
There's a bug in the cycle calculation. The issue is: <describe symptom>

Debug steps:
1. Read app/utils/cycleCalculator.ts — all cycle math is here
2. Check: ovulationDay = avgCycleLength - 14 (NOT /2)
3. Check: dayInCycle is 1-indexed
4. Check: phase boundaries (menstrual ends at avgPeriodLength, follicular ends at ovulationDay-3, etc.)
5. Test with edge cases: day 1, last day of cycle, cycle rollover
```

## 4. Add a New Whisper/SOS Signal Type

```
I need to add a new whisper signal type:
- ID: whisper_<name> (must match ^[a-z][a-z0-9_]{0,49}$)
- Title: <display name>
- Icon: <Feather icon name>
- Phase: <which phase this appears in, or all>

Follow the patterns in:
1. app/constants/whisper.ts (add to phase array)
2. app/i18n/en/signals.json + app/i18n/vi/signals.json (translations)
3. app/supabase/functions/notify-sos/index.ts (push copy)
```

## 5. Debug a Realtime Subscription

```
The Realtime subscription for <feature> isn't working.

Debug steps:
1. Check the relevant hook: app/hooks/useSOSListener.ts or useCoupleLinkedListener.ts
2. Verify the channel is subscribing to the correct table and filter
3. Check RLS policies — Realtime respects RLS, so the user must have SELECT permission
4. Check Supabase dashboard → Realtime → verify channel is active
5. Test: manually INSERT a row and check if the callback fires
6. Check: is the Supabase client singleton properly initialized? (app/lib/supabase.ts)
```

## 6. Add a New Translation

```
I need to add translations for a new feature:
- Feature: <name>
- Strings: <list of strings to translate>

Steps:
1. Choose or create namespace in app/i18n/config.ts
2. Add keys to app/i18n/en/<namespace>.json
3. Add Vietnamese translations to app/i18n/vi/<namespace>.json
4. Use in components: const { t } = useTranslation('<namespace>'); t('<key>')
5. Test both languages by switching in Settings
```

## 7. Add a New Screen/Tab

```
I need to add a new screen to the app:
- Name: <screen name>
- Type: tab / modal / standalone
- Role: Moon only / Sun only / both

Steps:
1. Create app/app/<name>.tsx (or app/app/(tabs)/<name>.tsx for tabs)
2. Use role-based theming: const colors = role === 'moon' ? MoonColors : SunColors
3. Add navigation if needed (Expo Router auto-registers file-based routes)
4. Add translations to i18n
```

## 8. Modify the Zustand Store

```
I need to add new state/actions to the store:
- New state: <fields with types>
- New actions: <function signatures>

Read app/store/appStore.ts first, then:
1. Add state fields to the interface
2. Add initial values in create()
3. Add actions that follow optimistic update pattern
4. If state should persist: don't add to partialize exclusion list
5. If state is transient: add to partialize exclusion list
6. If DB sync needed: call lib/db/ functions from the action
```

## 9. Debug Push Notifications

```
Push notifications aren't being received for <feature>.

Debug steps:
1. Check app/hooks/useNotifications.ts — is the token registered?
2. Check push_tokens table in Supabase — does the user have a token?
3. Check the Edge Function logs: app/supabase/functions/notify-sos/ or notify-cycle/
4. Check Expo Push API receipts for errors
5. Verify the notification preferences (notification_preferences table)
6. iOS: check notification permissions in device settings
```

## 10. Add Security Hardening

```
I need to add a security improvement to <area>.

Reference the security patterns in:
1. Proxy: 5-layer defense (proxy/api/*.ts)
2. Database: RLS policies (app/supabase/migrations/)
3. Auth: timing-safe comparison (proxy/lib/auth.ts)
4. Edge Functions: service role auth (supabase/functions/*)
5. App: input validation, no select('*'), no hardcoded secrets

Previous hardening: see app/supabase/migrations/006_security_hardening.sql
and docs/plans/2026-03-07-publish-security-hardening.md
```

## 11. Update the Landing Page

```
I need to update the Easel landing page.

The landing page is a single file: landing/index.html
- No build tools, no frameworks — pure HTML/CSS/JS
- Fonts: Cormorant Garamond (headers) + DM Sans (body) from Google Fonts
- Responsive: 768px breakpoint
- Animations: IntersectionObserver fade-up, canvas elements, orbital animations
- Deploy: automatic on push to main via .github/workflows/pages.yml
```

## 12. Create a New Database Migration

```
I need to make a schema change: <describe change>

Steps:
1. Check current migration count: ls app/supabase/migrations/
2. Create app/supabase/migrations/00N_<descriptive_name>.sql
3. Always include RLS if adding tables
4. Add indexes for foreign keys used in RLS policies
5. Use IF NOT EXISTS for idempotent operations
6. Test locally: cd app && supabase db push
7. The CI pipeline (.github/workflows/supabase.yml) will apply on push to main
```

## 13. Refactor Component Organization

```
I want to refactor the component folder structure (currently gf/bf/ and moon/sun/ coexist).

Before starting:
1. Read all components in app/components/gf/, app/components/bf/
2. Read all components in app/components/moon/, app/components/sun/
3. Check all imports across screens/ and app/ directories
4. Consolidate into moon/ and sun/ (the canonical naming)
5. Update all import paths (using @/ alias)
6. Verify no broken imports
```
