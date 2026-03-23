# TODOS

## Security

- [ ] **SEC-001/002: Migrate auth tokens + health data to SecureStore**
  **Priority:** P1
  AsyncStorage stores JWT tokens and period/symptom data in plaintext SQLite. Replace with `expo-secure-store` adapter for Supabase auth and reduce persisted health data in Zustand.

- [ ] **SEC-007: Add Supabase JWT verification to proxy**
  **Priority:** P2
  `CLIENT_TOKEN` is extractable from the app bundle. Add Supabase JWT verification as a second auth layer on all proxy endpoints.

- [ ] **SEC-008: Whitelist symptom values in proxy endpoints**
  **Priority:** P2
  Proxy accepts arbitrary symptom strings (up to 30 chars) — validate against the DB-level allowed set: `['cramps', 'fatigue', 'headache', 'bloating', 'mood_swings', 'nausea']`.

## UX & Emotional Safety

- [ ] **UX-006: Remove heteronormative language from AI prompts**
  **Priority:** P1
  `proxy/lib/minimax.ts` lines 109, 144 use "boyfriend/girlfriend". Replace with gender-neutral "partner" language.

- [ ] **UX-011: Add context to "Conception Chance" label**
  **Priority:** P2
  Moon's dashboard shows "Conception Chance: Very High" with no user intent context. Add a tooltip or rename to "Fertile Window".

- [ ] **UX-012: Explain what Easel does before role selection**
  **Priority:** P2
  Onboarding shows role cards but no product explanation. Add 1-2 lines of context.

- [ ] **UX-014: Fix "It's probably nothing" doctor nudge**
  **Priority:** P2
  Replace anxiety-inducing "probably nothing" with normalizing context about cycle variation.

## Data Integrity

- [ ] **DI-006: Clean stale periodDayLogs from AsyncStorage**
  **Priority:** P3
  Deleted day logs older than 3 months persist as ghost entries from AsyncStorage cache.

- [ ] **DI-008: Surface notification prefs sync failure to user**
  **Priority:** P3
  Fire-and-forget sync with no rollback or user feedback after 3 retries fail.

- [ ] **QA-016: Implement periodDayLogs eviction policy**
  **Priority:** P3
  Day logs map grows unboundedly in AsyncStorage. Implement 3-month eviction on bootstrap.

## Completed
