# Easel — Architectural & Code Patterns

## Design Patterns

### 1. Single Store Pattern (Zustand)
**Location**: `app/store/appStore.ts`

All app state lives in one Zustand store with AsyncStorage persistence. The store is the **only** place that mutates state. Components read via selectors, hooks trigger store actions.

```
Component → useAppStore(selector) → reads state
Component → store.action() → mutates state → triggers DB sync
```

**Why**: Eliminates prop drilling, ensures single source of truth, enables offline persistence via AsyncStorage middleware.

### 2. Data Access Layer (Repository Pattern)
**Location**: `app/lib/db/*.ts`

Pure async functions that encapsulate Supabase queries. No React imports, no Zustand refs. Each file maps to a database table/domain.

```
store action → lib/db/profiles.ts → supabase.from('profiles').select(...)
```

**Why**: Testable in isolation, swappable backend, clean separation from UI state.

### 3. AI Fallback-Then-Replace Pattern
**Location**: All `app/hooks/useAI*.ts` hooks

Static content displayed immediately. AI content fetches in background and replaces on success. On error, static content remains — user never sees a loading spinner or error for AI features.

```
1. Show static fallback (phase tagline, PHASE_INFO content)
2. Fetch AI content in background (AbortController for cleanup)
3. On success: replace with AI content, set isAI=true
4. On error: keep fallback, log warning, isAI=false
```

**Why**: AI is enhancement, not dependency. App works fully offline/without proxy.

### 4. Dual-Path Notification Pattern
**Location**: `app/hooks/useSOSListener.ts`, `app/supabase/functions/notify-sos/`

Every real-time event is delivered via two paths:
- **Foreground**: Supabase Realtime WebSocket → hook → store update → UI render
- **Background**: DB webhook → Edge Function → Expo Push API → device notification

```
INSERT sos_signals
  ├── Realtime channel → useSOSListener → store.receiveWhisper() → UI
  └── DB webhook → notify-sos Edge Function → Expo Push → device
```

**Why**: Guarantees delivery whether app is in foreground or background.

### 5. 5-Layer Security Pattern (Proxy)
**Location**: Every file in `proxy/api/*.ts`

```
1. Method guard (405 if not POST)
2. Token auth (timingSafeEqual, 401 if invalid)
3. Rate limit (30/min per IP, 429 if exceeded)
4. Input validation (whitelist + range, 400 if invalid)
5. Error handling (generic message to client, full log server-side)
```

**Why**: Defense in depth — each layer catches different attack vectors.

### 6. Optimistic Update Pattern
**Location**: `app/store/appStore.ts` (all actions)

```
1. Update Zustand state immediately (user sees change)
2. Async call to Supabase (fire-and-forget)
3. On DB error: log warning (don't revert UI — next session will re-sync)
```

**Why**: Perceived instant responsiveness. Acceptable because cycle data changes infrequently and session bootstrap re-syncs from DB.

### 7. Role-Based Theming Pattern
**Location**: `app/constants/theme.ts`, all screens

Single app binary with theme applied based on `role` state:
- Moon: dark indigo background, lavender accents, celestial feel
- Sun: warm cream background, golden accents, sunrise feel

```typescript
const colors = role === 'moon' ? MoonColors : SunColors;
```

**Why**: Avoids two separate apps while providing distinct emotional experiences.

## Data Flow Patterns

### Authentication Flow
```
auth.tsx → Supabase.auth.signInWithPassword()
  → onAuthStateChange listener fires
  → bootstrapSession(): fetch profile, cycle, couple, prefs
  → route to /(tabs) or /onboarding based on role
```

### Partner Linking Flow
```
Moon: generateLinkCode() → INSERT couples (status: pending, 24h expiry)
Sun: linkToPartner(code) → UPDATE couples (boyfriend_id, status: linked)
  → Realtime fires on Moon's app → useCoupleLinkedListener → setLinked()
  → Both apps now see partner data
```

### Whisper/SOS Signal Flow
```
Moon: sendWhisper(option) → store.activeWhisper = option
  → INSERT sos_signals (couple_id, sender_id, type, message)
  → 5-min auto-clear timer started
  → Dual-path notification to Sun
Sun: receiveWhisper() via Realtime → WhisperAlert renders
  → AI tip fetched from /api/sos-tip
  → Sun taps "Got it" → UPDATE sos_signals.acknowledged_at
```

### Session Restore Flow
```
App opens → index.tsx → bootstrapSession()
  → AsyncStorage: read Zustand persisted state
  → Supabase: getSession() → if valid JWT, fetch profile + settings
  → if no session: route to /auth
  → if session but no role: route to /onboarding
  → if session + role: route to /(tabs)
```

## Error Handling Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| AI hooks | Silent fallback | `catch(e) { console.warn(...); /* keep static */ }` |
| Store actions | Log + continue | `if (error) console.warn('sync failed:', error)` |
| DB functions | Return null on not-found | `if (!data) return null` |
| Proxy endpoints | Generic 502 | `res.status(502).json({ error: 'AI service unavailable' })` |
| Auth | User-facing message | `Alert.alert('Error', mapAuthError(error))` |
| Edge Functions | Generic 500 | `new Response('Internal server error', { status: 500 })` |

## State Management Patterns

### Transient vs Persisted State
```typescript
// Persisted (survives app restart)
isLoggedIn, email, role, isPartnerLinked, linkCode,
cycleSettings, partnerCycleSettings, avatarUrl, displayName, notificationPrefs

// Transient (reset on restart)
activeSOS, activeWhisper, userId, coupleId
```

### Module-Level Side Effects
```typescript
// Timers stored outside Zustand to avoid serialization
let _sosTimer: ReturnType<typeof setTimeout> | null = null;
let _whisperTimer: ReturnType<typeof setTimeout> | null = null;
```

## Testing Strategy (Planned)

| Layer | Tool | Focus |
|-------|------|-------|
| Pure functions | Jest | `cycleCalculator.ts` — phase math, calendar markers |
| DB layer | Jest + Supabase mock | `lib/db/*.ts` — query correctness |
| Store | Jest + Zustand testing | `appStore.ts` — action side effects |
| Proxy | Jest + supertest | `api/*.ts` — validation, auth, rate limiting |
| E2E | Detox or Maestro | Partner linking, whisper flow, auth |
