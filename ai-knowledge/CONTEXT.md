# Easel — Deep Context for Claude

## Why These Architectural Decisions Were Made

### Why a Vercel proxy instead of calling MiniMax directly?
The MiniMax API key must never ship in the app binary — it would be extractable from the IPA/APK. The proxy adds authentication, rate limiting, and input validation as bonus security layers. Vercel was chosen for zero-config serverless with generous free tier.

### Why Zustand instead of Redux or Context?
Zustand is minimal (~1KB), has built-in persist middleware for AsyncStorage, and avoids Redux boilerplate. For a two-screen app with a single store, it's the right size. The `create()` API also avoids the Provider wrapper that Context requires.

### Why a single store file instead of slices?
The app has ~20 state fields and ~25 actions. Splitting into slices would add complexity without benefit at this scale. The single file makes it easy to see all state mutations in one place, which is important for a real-time app where events (Realtime, push, timers) can trigger state changes from multiple sources.

### Why separate `lib/db/` from the store?
Testability and separation of concerns. DB functions can be unit tested without mocking Zustand. The store depends on DB functions, not the reverse. This also makes it possible to swap backends (e.g., from Supabase to a custom API) without touching UI or state logic.

### Why Edge Functions instead of proxy for notifications?
Edge Functions run with the Supabase service role key (bypasses RLS), which is needed to query across users (e.g., find all Moon users approaching their period). The proxy only has the MiniMax key and client token — it shouldn't have DB admin access.

### Why both Realtime AND push notifications?
Realtime only works when the app is in the foreground with an active WebSocket. Push notifications reach the device even when the app is killed. Both paths ensure SOS/whisper signals are never missed.

### Why `gf/`+`bf/` AND `moon/`+`sun/` component folders?
Historical artifact. `gf/`/`bf/` were created in v1.0. When the Moon/Sun rebrand happened in v1.1, new components went into `moon/`/`sun/`. Both folders are active and contain production code. A future cleanup could consolidate them.

### Why static fallback + AI replace instead of loading spinners?
The app's value proposition is empathetic, always-available support. Showing a loading spinner for AI content undermines that — the user should never feel like they're "waiting for the AI." Static content is carefully written to be useful on its own; AI enhancement is a bonus.

### Why in-memory rate limiting on the proxy?
Simplicity. For a couples app with 2-4 active users, per-instance rate limiting is sufficient. The rate limit primarily protects against accidental request loops in the client code, not DDoS attacks. Upgrading to Vercel KV is planned for scale.

## Domain Concepts

### Cycle Phases
The menstrual cycle is divided into 4 phases, each with distinct hormonal profiles:
1. **Menstrual** (days 1 to avgPeriodLength): Active bleeding. Moon may feel tired, crampy. Sun should be extra gentle.
2. **Follicular** (after menstrual to ovulation-3): Energy rising. Moon feels optimistic. Good time for activities together.
3. **Ovulatory** (ovulation-3 to ovulation+2): Peak energy and confidence. Ovulation day = avgCycleLength - 14.
4. **Luteal** (after ovulatory to end of cycle): Energy declining. PMS symptoms possible. Moon may need more space or comfort.

### Phase Calculation
```
ovulationDay = avgCycleLength - 14  // NOT avgCycleLength / 2 (was a bug)
dayInCycle = (today - lastPeriodStartDate) % avgCycleLength + 1  // 1-indexed
```

### Whisper vs SOS
- **Whisper**: Gentle intimate signal (e.g., "Bring me chocolate", "Plan a date night"). Phase-aware — 4 options per phase, 16 total. Can include custom text.
- **SOS**: Urgent needs signal (e.g., "Cramps Alert", "Need a Hug"). Always available regardless of phase. 4 fixed options.
- Both use the same `sos_signals` table. Whisper IDs are prefixed with `whisper_` to distinguish.

### Partner Linking
- Moon generates a 6-digit alphanumeric code (24h expiry)
- Sun enters the code to link
- Couple record transitions: `pending → linked`
- Once linked: Sun can see Moon's cycle data, receive whispers/SOS
- Only one active couple per Moon (enforced by DB constraint)
- Only one Moon per Sun (enforced by UNIQUE(boyfriend_id))

### Conception Chance
Displayed on Moon's dashboard as informational:
- Menstrual: Low
- Follicular: Medium
- Ovulatory: Very High
- Luteal: Low

## Implicit Rules (Not Written Elsewhere)

1. **Moon always creates the couple record** — Sun can only link to an existing code
2. **Whisper auto-clears after 5 minutes** — module-level timers in appStore.ts
3. **AI content is never cached** — every request is fresh (acceptable cost for 2-4 users)
4. **Language preference is persisted to DB** — not just in-memory, survives reinstall
5. **Avatar is persisted to both Zustand AND Supabase** — the DB write was added in v1.5.0 (was a bug)
6. **Edge Functions use Deno, not Node** — import syntax and APIs differ
7. **The landing page has no build step** — it's a single HTML file with inline CSS/JS
8. **All Supabase queries use explicit column selects** — `select('*')` is prohibited to prevent PII leakage
9. **The `profiles` table is auto-created by a trigger** — no manual insert needed on signup
10. **SOS type values must match the DB CHECK constraint** — regex `^[a-z][a-z0-9_]{0,49}$`

## Things That Look Wrong But Are Intentional

1. **Two component folder naming schemes** (`gf/`+`bf/` and `moon/`+`sun/`): Both are active. It's a rebrand artifact, not a mistake.
2. **Module-level `let` variables in appStore.ts**: The timer refs (`_sosTimer`, `_whisperTimer`) are intentionally outside Zustand to prevent AsyncStorage serialization.
3. **Silent error handling in AI hooks**: This is by design — AI is enhancement, not dependency.
4. **No test suite**: The project is pre-launch; tests are planned for Phase 2.
5. **`partnerCycleSettings` as separate state**: Sun needs Moon's cycle data but shouldn't write to it. Keeping it separate prevents accidental mutation.
6. **Rate limit of 30/min on proxy**: Seems high for 2 users, but the app makes multiple AI calls per session (greeting + advice + whisper options).
7. **`dayInCycle` range 1-45**: Normal cycles are 21-35 days, but some medical conditions cause longer cycles. 45 is a safe upper bound.
