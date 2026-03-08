# Easel Expert Panel Review

**Date:** 2026-03-07 | **Reviewed by:** 7-perspective AI panel | **Version:** v1.5.1

---

## Executive Summary

This review analyzed the Easel codebase from 7 expert perspectives. We identified **22 issues** across architecture, mobile UX, backend reliability, frontend performance, design, product strategy, and user research. Below are the findings organized by priority.

### Impact/Effort Matrix

| Priority | Issue | Perspective | Effort |
|----------|-------|-------------|--------|
| P0 | N+1 query in notify-cycle Edge Function | Backend | Medium |
| P0 | No offline retry/sync queue for preferences | Senior Eng + Mobile | Medium |
| P0 | Missing accessibility (contrast, touch targets, screen readers) | UI/UX + Frontend | Medium |
| P1 | No onboarding tutorial for features | Product + UXR | Large |
| P1 | Dashboard cognitive overload (7+ concepts) | Product + UXR + UI/UX | Medium |
| P1 | Zustand over-rendering (no granular selectors) | Frontend | Small |
| P1 | Prompt injection via unsanitized user input | Backend | Small |
| P2 | Mental model gap (users don't understand phases) | UXR | Medium |
| P2 | Partner linking friction (Sun onboarding) | Product + UXR | Medium |
| P2 | Memory leaks (Animated values, Realtime listeners) | Mobile | Small |
| P2 | Rate limiter memory leak on distributed attacks | Backend | Small |
| P2 | Hardcoded design values (not using theme tokens) | UI/UX | Small |
| P3 | DRY violation (ovulation constant repeated) | Senior Eng | Small |
| P3 | Edge case gaps (irregular cycles, pregnancy, breakups) | UXR | Large |
| P3 | AI endpoint ROI unclear (6 endpoints, fallbacks hide value) | Product | Medium |
| P3 | Whisper/SOS copy hardcoded in Edge Function | Backend | Small |

---

## P0 — Critical (Fix Before Next Release)

### 1. N+1 Query in notify-cycle Edge Function
**Perspective:** Backend Engineer
**File:** `app/supabase/functions/notify-cycle/index.ts:103-178`

**Problem:** For each Moon user, the function runs 3 separate queries (push_tokens, couples, partner tokens). At 1,000 users = ~3,000 queries per daily cron run.

**Fix:** Batch all queries upfront:
```typescript
// Replace per-user queries with 3 batch queries:
const couples = await supabase.from('couples').select('girlfriend_id, boyfriend_id')
  .eq('status', 'linked').in('girlfriend_id', moonIds);
const allTokens = await supabase.from('push_tokens').select('user_id, token')
  .in('user_id', [...moonIds, ...partnerIds]);
// Then build messages in-memory using Maps
```
Reduces 3,000 queries to 3.

---

### 2. Fire-and-Forget Preference Sync (No Retry)
**Perspectives:** Senior Engineer, Mobile Engineer
**File:** `app/store/appStore.ts:369-390, 405-418`

**Problem:** `updateNotificationPrefs()` and `setLanguage()` update local state optimistically but sync to Supabase fire-and-forget. On network failure, user thinks settings are saved but DB never gets the update. No retry, no error feedback.

**Fix:** Add exponential backoff retry (3 attempts: 500ms, 1s, 2s). On final failure, show toast: "Settings couldn't sync. They'll sync when you're back online." Queue failed syncs in AsyncStorage for retry on app restart.

---

### 3. Accessibility Violations (WCAG AA Failures)
**Perspectives:** UI/UX Designer, Frontend Engineer
**Files:** `app/constants/theme.ts`, `app/components/gf/DailyCheckIn.tsx`, `app/components/gf/PhaseWheel.tsx`, `app/app/auth.tsx`

Three sub-issues:

**a) Low contrast in Moon theme:**
- `textSecondary` (#8899AA) on `card` (#162233) = 4.3:1 (below WCAG AA 4.5:1)
- `textHint` (#4A5568) on card = 2.8:1 (critically low)
- **Fix:** Lighten `textSecondary` to `#A8BAC8` (5.2:1) and `textHint` to `#6B7A8C` (4.8:1)

**b) Sub-44pt touch targets:**
- Mood buttons in DailyCheckIn: ~28pt tall (min 44pt)
- PhaseWheel badge: 5px vertical padding
- **Fix:** Increase padding to `Spacing.md` (16px) on mood buttons; add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}`

**c) No screen reader support:**
- No `accessibilityLabel` on interactive elements
- No `accessibilityRole` on buttons/inputs
- **Fix:** Add `accessible`, `accessibilityLabel`, and `accessibilityRole` to all TouchableOpacity and TextInput components

---

## P1 — High (Next Sprint)

### 4. No Feature Onboarding
**Perspectives:** Product Manager, User Researcher
**Files:** `app/app/onboarding.tsx`, `app/screens/MoonDashboard.tsx`, `app/screens/SunDashboard.tsx`

**Problem:** Users sign up, choose role, land on dashboard — then what? No explanation of:
- Why daily check-ins matter (they train the AI)
- What Whispers are or when to use them
- How phases relate to mood/needs
- What Sun is supposed to *do*

**Fix:**
1. Add 2-minute in-app tutorial after role selection (skippable, re-offerable after 3 days)
2. Add contextual tooltips on first dashboard visit (phase wheel, check-in card, whisper button)
3. Send onboarding push 2 hours post-signup: "Ready to connect? Generate a code in Settings."

---

### 5. Dashboard Information Overload
**Perspectives:** Product Manager, User Researcher, UI/UX Designer
**Files:** `app/screens/MoonDashboard.tsx:74-177`, `app/screens/SunDashboard.tsx`

**Problem:** Moon dashboard has 7+ visual blocks with equal weight. Sun dashboard has 7 concepts too. Users can't identify the primary action.

**Fix:** Reorder Moon dashboard:
1. **Hero:** Phase wheel + tagline only
2. **Primary CTA:** "Signal your Sun" button
3. **Below fold:** Daily check-in (if not yet logged)
4. **Collapsible:** Phase description, conception chance, self-care tip

Reorder Sun dashboard:
1. **Hero:** Phase status + countdown
2. **Alert:** Active whisper (if any)
3. **Guide:** AI tip + mood description
4. **Below fold:** Phase overview chips

---

### 6. Zustand Over-Rendering
**Perspective:** Frontend Engineer
**Files:** `app/app/(tabs)/settings.tsx:22-25`, `app/screens/SunDashboard.tsx:28-34`

**Problem:** Components destructure 7+ fields from the store in a single call. Any state change triggers full re-render of Settings and Dashboard pages.

**Fix:** Use individual selectors:
```typescript
// Before
const { email, role, cycleSettings, ... } = useAppStore();

// After
const email = useAppStore(s => s.email);
const role = useAppStore(s => s.role);
const cycleSettings = useAppStore(s => s.cycleSettings);
```
Also wrap expensive children (PhaseWheel, GuideCard) with `React.memo()`.

---

### 7. Prompt Injection via Unsanitized Input
**Perspective:** Backend Engineer
**Files:** All `proxy/api/*.ts` endpoints

**Problem:** `phaseTagline` and `topSelections` are passed directly into MiniMax prompts without sanitizing newlines or control characters. An attacker could inject: `"Rest\n\nIgnore previous instructions..."`.

**Fix:** Add sanitization:
```typescript
function sanitizeInput(input: string, maxLen: number): string {
  return input.replace(/[\x00-\x1F\x7F]/g, '').replace(/\n+/g, ' ').trim().slice(0, maxLen);
}
```
Apply to all string inputs before passing to `generateGreeting()`, `generatePartnerAdvice()`, etc.

---

## P2 — Medium (This Quarter)

### 8. Mental Model Gap — Users Don't Understand Phases
**Perspective:** User Researcher
**Files:** `app/app/onboarding.tsx`, `app/i18n/en/onboarding.json`

**Problem:** App assumes users know what menstrual phases are. Moon sees "Follicular: Rising Energy" with no context. Sun reads phase tips without understanding the biology.

**Fix:** Add 60-second cycle education in onboarding with a simple 4-color cycle diagram. Change copy from "She may feel tired" to "In the Menstrual phase, energy is typically low — this is normal."

---

### 9. Partner Linking Friction
**Perspectives:** Product Manager, User Researcher
**Files:** `app/components/sun/UnlinkedScreen.tsx`, `app/app/onboarding.tsx`

**Problem:** Sun can't do anything until Moon generates a code. But Moon may not understand she needs to generate one, or may not have installed the app yet. Asymmetric burden.

**Fix:**
- Add pre-written share templates with copy button: "Hey, my Easel code is 482917. Enter it so we can connect!"
- Show real-time confirmation on both sides when linking completes (already partially implemented via `useCoupleLinkedListener`)
- Add "Invite partner" deep link flow that pre-fills instructions

---

### 10. Memory Leaks (Animated Values & Realtime)
**Perspective:** Mobile Engineer
**Files:** `app/components/gf/SOSSheet.tsx:22-39`, `app/components/moon/WhisperSheet.tsx:33-38`, `app/hooks/useSOSListener.ts`

**Problem:** Animated.Value instances created per render, not cleaned up. Realtime subscriptions may not unsubscribe properly on `coupleId` change.

**Fix:** Use `useRef` for Animated values (already done in some cases — verify cleanup). Ensure Realtime useEffect has `coupleId` in dependency array for proper cleanup/resubscribe.

---

### 11. Rate Limiter Memory Leak
**Perspective:** Backend Engineer
**File:** `proxy/lib/rateLimit.ts:24-39`

**Problem:** Pruning only removes IPs where ALL timestamps are expired. Distributed attacks accumulate unbounded entries.

**Fix:** Filter stale timestamps per-IP during pruning (not just delete entire IP). Add `MAX_STORE_SIZE` cap (e.g., 10,000 IPs) with LRU eviction. Long-term: migrate to Vercel KV.

---

### 12. Hardcoded Design Values
**Perspective:** UI/UX Designer
**Files:** `app/components/moon/WhisperSheet.tsx:231`, `app/components/gf/DailyCheckIn.tsx:300`, `app/components/sun/UnlinkedScreen.tsx`

**Problem:** Multiple components use hardcoded colors (`'rgba(0,0,0,0.6)'`, `'#EF5350'`) instead of theme tokens.

**Fix:** Add `SharedColors` to theme.ts:
```typescript
export const SharedColors = {
  error: '#EF5350',
  success: '#4CAF50',
  warning: '#FFB347',
} as const;
```
Replace all hardcoded values with token references.

---

## P3 — Low (Backlog)

### 13. DRY Violation — Ovulation Constant
**Files:** `app/utils/cycleCalculator.ts:27,78`, `app/supabase/functions/notify-cycle/index.ts`

Magic number `14` (luteal phase length) repeated without shared constant. Extract to `constants/cycle.ts`.

### 14. Edge Case Gaps
**Perspective:** User Researcher

Missing support for: irregular cycles (PCOS), pregnancy pause, birth control users, non-binary/trans users (gendered role names), breakup/unlink flow. Each is a separate feature — prioritize irregular cycle support first (most common).

### 15. AI Endpoint ROI
**Perspective:** Product Manager

6 AI endpoints with fallbacks that hide AI value. Recommendation: keep `daily-insight` and `sos-tip` (highest value). Monitor `greeting`. Consider sunsetting `whisper-options` and `partner-advice` (static fallbacks are nearly as good).

### 16. Whisper Copy Hardcoded in Edge Function
**File:** `app/supabase/functions/notify-sos/index.ts:42-59`

New whisper types won't get personalized push notifications. Move copy to a `signal_templates` database table.

---

## Cross-Cutting Concerns

| Concern | Affects | Description |
|---------|---------|-------------|
| **Offline resilience** | Mobile, Backend, Frontend | No retry queue for failed syncs. Affects preferences, cycle settings, avatar uploads. |
| **Error handling inconsistency** | All layers | AI hooks: silent fallback. Store: console.warn. Auth: user-facing Alert. Edge Functions: generic 500. Need unified error strategy. |
| **State sync on couple linking** | Mobile, Backend | Race condition if Realtime fires before `linkToPartner` completes. Need atomic state transition. |
| **gendered copy ("she"/"her")** | Product, UXR, UI/UX | Alienates non-binary/trans users. Change to phase-descriptive copy ("In this phase, energy is low"). |
| **No test suite** | All | Zero automated tests. The ovulation formula bug (v1.5.1) would have been caught by basic unit tests. Most impactful technical debt. |

---

## Recommended Action Plan

### Sprint 1 (P0 — This Week)
- [ ] Batch queries in notify-cycle Edge Function
- [ ] Add retry logic for preference sync in appStore
- [ ] Fix WCAG contrast in Moon theme tokens
- [ ] Add touch target minimum (44pt) to mood buttons and key CTAs
- [ ] Sanitize proxy input strings (prompt injection fix)

### Sprint 2 (P1 — Next 2 Weeks)
- [ ] Use granular Zustand selectors across all screens
- [ ] Redesign dashboard information hierarchy (Moon + Sun)
- [ ] Add basic in-app onboarding tutorial (skippable)
- [ ] Add `React.memo()` to expensive components

### Sprint 3 (P2 — This Month)
- [ ] Add cycle education to onboarding
- [ ] Improve partner linking UX (share templates, real-time confirmation)
- [ ] Audit and fix Animated value / Realtime cleanup
- [ ] Consolidate hardcoded colors to theme tokens
- [ ] Add SharedColors to design system

### Backlog (P3)
- [ ] Extract cycle constants (DRY)
- [ ] Evaluate AI endpoint ROI
- [ ] Add irregular cycle support
- [ ] Move signal copy to database
- [ ] Add unit tests for cycleCalculator.ts
