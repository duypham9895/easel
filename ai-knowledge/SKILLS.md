# Easel — Reusable Skills & Procedures

## How to Add a New AI Endpoint (End-to-End)

1. **Proxy: Add prompt function** in `proxy/lib/minimax.ts`
   - Define the system prompt with strict output format, word limit, and tone
   - Choose temperature (creative 0.85-0.9, practical 0.75-0.8, deterministic 0.1)
   - Set max_tokens appropriate to expected output length
   - Export the new function

2. **Proxy: Create endpoint** in `proxy/api/<name>.ts`
   - Copy an existing endpoint (e.g., `greeting.ts`)
   - Implement 5-layer security: method check → auth → rate limit → validate → call
   - Define input validation (whitelist enums, range checks, string lengths)
   - Return single meaningful field in response JSON

3. **App: Create hook** in `app/hooks/useAI<Name>.ts`
   - Follow the pattern: `useState` for result + loading + isAI flag
   - Provide static fallback content (shown immediately)
   - Use `AbortController` for cleanup on unmount
   - Call proxy via `fetch(PROXY_URL + '/api/<name>', { headers: { 'X-Client-Token': ... } })`
   - On success: replace fallback with AI content, set `isAI: true`
   - On error: silently keep fallback, log warning

4. **App: Integrate in component**
   - Import hook, destructure `{ result, loading, isAI }`
   - Show result immediately (fallback or AI)
   - Optionally show AI badge when `isAI === true`

5. **Update documentation**
   - Add endpoint to `docs/API.md`
   - Add to README API table
   - Update CHANGELOG

## How to Add a New Database Table

1. **Create migration** in `app/supabase/migrations/00N_<name>.sql`
   - Number sequentially after the last migration
   - Always enable RLS: `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`
   - Create RLS policies using `my_couple_id()` or `auth.uid()` helpers
   - Add FK indexes for performance

2. **Create DB functions** in `app/lib/db/<name>.ts`
   - Pure async functions (no React, no Zustand)
   - Use explicit `select()` column lists (never `select('*')`)
   - Use upserts for idempotent operations
   - Return typed results matching the DB schema

3. **Add TypeScript types** in `app/types/index.ts`
   - Add `Db<Name>` interface matching the table columns
   - Add any app-level types needed

4. **Integrate in store** in `app/store/appStore.ts`
   - Add state fields and actions
   - Call DB functions from actions
   - Follow optimistic update pattern

5. **Run migration**: `supabase db push` or push to main (CI handles it)

## How to Add a New Whisper/SOS Option

1. **Constants**: Add to `app/constants/whisper.ts` or `app/constants/sos.ts`
   - ID must match regex `^[a-z][a-z0-9_]{0,49}$` (DB constraint)
   - Whisper IDs must be prefixed with `whisper_` to avoid collision with SOS IDs

2. **Translations**: Add title/description to both `app/i18n/en/signals.json` and `app/i18n/vi/signals.json`

3. **Edge Function**: Add push notification copy to `app/supabase/functions/notify-sos/index.ts`

4. **Proxy** (if whisper): May need to update `proxy/lib/minimax.ts` generateWhisperOptions prompt

## How to Add a Translation Namespace

1. Create `app/i18n/en/<namespace>.json` and `app/i18n/vi/<namespace>.json`
2. Register in `app/i18n/config.ts` (add to `ns` array and `resources` map)
3. Use in components: `const { t } = useTranslation('<namespace>')`

## How to Add a New Screen

1. Create file in `app/app/<name>.tsx` (Expo Router auto-registers)
2. For tab screens: add to `app/app/(tabs)/<name>.tsx`
3. Role-specific content: check `useAppStore(s => s.role)` and render accordingly
4. Use `@/constants/theme` for styling tokens

## How to Debug a Failing AI Call

1. **Check proxy health**: `curl <PROXY_URL>/api/health` — verify env vars are set
2. **Check client token**: Ensure `EXPO_PUBLIC_CLIENT_TOKEN` matches `CLIENT_TOKEN`
3. **Check rate limit**: If 429, wait 60s or check for request loops
4. **Check input validation**: Verify phase enum, dayInCycle range, string lengths
5. **Check MiniMax response**: Look at proxy logs for `[endpoint-name] error:` messages
6. **Check think-block stripping**: MiniMax may return `<think>...</think>` blocks

## How to Run Tests
Currently no test suite (planned for Phase 2). When adding:
- Unit tests for `utils/cycleCalculator.ts` (pure functions)
- Integration tests for `lib/db/*.ts` (mock Supabase client)
- E2E tests for critical flows (partner linking, whisper send/receive)

## How to Deploy

### Proxy (automatic on push to main)
```bash
cd proxy && vercel --prod   # Manual deploy
```

### Database migrations (automatic on push to main)
```bash
cd app && supabase db push  # Manual migration
```

### Edge Functions (automatic on push to main)
```bash
cd app && supabase functions deploy notify-cycle
cd app && supabase functions deploy notify-sos
```

### Mobile app
```bash
cd app && eas build --platform ios --profile production
cd app && eas submit --platform ios
```

### Landing page (automatic on push to main)
Just edit `landing/index.html` and push.
