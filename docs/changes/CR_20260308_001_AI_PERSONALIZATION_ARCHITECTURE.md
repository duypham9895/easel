# CR_20260308_001 — AI Personalization Architecture Decision

**Parent Issue:** EAS-5 (CR: Personalize About this Phase & Self-Care with AI)
**Phase:** 1-2 Impact Analysis + Architecture Review
**Author:** CTO
**Date:** 2026-03-08

---

## 1. Current State Analysis

### What exists today

| Layer | File | Current behavior |
|-------|------|-----------------|
| **Proxy** | `proxy/lib/minimax.ts` | 6 AI functions. `generateDailyInsight()` already accepts mood+symptoms. `generatePartnerAdvice()` only receives phase+day+tagline. |
| **Proxy** | `proxy/api/daily-insight.ts` | POST endpoint — Moon calls after check-in, returns 1-2 sentence insight |
| **Proxy** | `proxy/api/partner-advice.ts` | POST endpoint — Sun calls on mount, returns phase-only advice |
| **Hook** | `app/hooks/useAIDailyInsight.ts` | Manual trigger hook — fetches insight after Moon submits check-in |
| **Hook** | `app/hooks/useAIPartnerAdvice.ts` | Auto-fetch on mount — static fallback → AI replace pattern |
| **Screen** | `app/screens/MoonDashboard.tsx` | "Self-Care" InsightCard = **static** `tPhases('${phase}_selfCare')` (L166). "About this Phase" card = **static** `tPhases('${phase}_moonMood')` (L174). |
| **Screen** | `app/screens/SunDashboard.tsx` | "Moon's Mood Now" GuideCard = **static** `tPhases('${phase}_mood')` (L151). "How to Show Up" = AI via `useAIPartnerAdvice` but **no mood/symptoms data** (L156). |
| **Component** | `app/components/gf/DailyCheckIn.tsx` | Saves mood+symptoms to `daily_logs` → triggers `useAIDailyInsight` → shows insight inline |
| **DB** | `app/lib/db/cycle.ts` | Only cycle_settings and period_logs — **no daily_log query functions** |
| **RLS** | `daily_logs` | Sun can already read Moon's daily_logs via `my_partner_id()` — **no RLS changes needed** |
| **Constants** | `app/constants/phases.ts` | Static `PhaseInfo` with `selfCareTip`, `partnerAdvice`, `moodDescription` — used as fallbacks |

### Key gaps

1. Moon's "About this Phase" and "Self-Care" are purely static i18n — not personalized
2. Sun's partner advice has zero awareness of Moon's actual mood/symptoms
3. No DB function exists to query partner's daily_log
4. No mechanism for DailyCheckIn to signal MoonDashboard to refresh cards

---

## 2. Architecture Decisions

### ADR-1: New `/api/phase-insight` endpoint (not extending daily-insight)

**Decision:** Create a new endpoint that returns both `aboutPhase` and `selfCare` in one call.

**Alternatives considered:**
- **Extend `/api/daily-insight`**: Would change existing API contract. Mixes quick post-checkin validation (1-2 sentences) with longer phase content. Breaking change for current consumers.
- **Two separate endpoints** (`/api/phase-about` + `/api/phase-selfcare`): Two extra API calls, two rate limit hits, more latency. Over-engineered.

**Why this approach:**
- Single API call for two related pieces of content (same input data)
- Keeps `daily-insight` (quick validation) separate from `phase-insight` (longer educational content)
- Follows existing 5-layer endpoint pattern
- New `generatePhaseInsight()` in minimax.ts with a system prompt tuned for educational, normalizing content

**Interface:**
```typescript
// POST /api/phase-insight
// Request
{ phase: string, dayInCycle: number, mood?: number, symptoms?: string[], language?: string }

// Response
{ aboutPhase: string, selfCare: string }
```

### ADR-2: Extend existing `/api/partner-advice` with optional mood/symptoms

**Decision:** Add optional `mood` and `symptoms` parameters to the existing partner-advice endpoint.

**Why not a new endpoint:**
- Backward compatible — when mood/symptoms absent, behavior is identical to today
- Sun's dashboard already calls this endpoint; just needs to pass additional data
- One prompt handles both cases (phase-only vs phase+mood)

**Interface change:**
```typescript
// POST /api/partner-advice (updated)
{ phase: string, dayInCycle: number, phaseTagline: string,
  mood?: number, symptoms?: string[], language?: string }
```

### ADR-3: On-mount query for partner's daily_log (no Realtime)

**Decision:** Sun fetches Moon's latest daily_log with a simple on-mount query. No Realtime subscription.

**Alternatives considered:**
- **Realtime subscription** on `daily_logs`: Adds complexity (channel management, cleanup). Daily check-in is once-a-day, not urgent like SOS.
- **Periodic polling**: Wasteful for a once-a-day event.

**Why on-mount query:**
- Daily check-in is low-frequency (once/day) — not urgent like SOS signals
- If Moon checks in while Sun has the app open, Sun sees updated advice on next app open/refresh
- Matches existing `partnerCycleSettings` pattern (fetched on mount, stored in state)
- Keeps architecture simple and predictable

**Future consideration:** If product decides Sun should see real-time updates when Moon checks in, add a Realtime subscription as an incremental enhancement.

### ADR-4: Callback pattern for DailyCheckIn → MoonDashboard

**Decision:** Add `onCheckInComplete` callback prop to DailyCheckIn. MoonDashboard owns the `useAIPhaseInsight` hook and triggers it via callback.

**Why:**
- "About this Phase" and "Self-Care" cards are rendered in MoonDashboard, not inside DailyCheckIn
- DailyCheckIn already manages its own `useAIDailyInsight` internally (this stays unchanged)
- Callback pattern keeps components loosely coupled
- No Zustand store changes needed for this — hook state lives in MoonDashboard

**Data flow:**
```
DailyCheckIn.handleSubmit()
  → saves to daily_logs
  → calls fetchInsight(mood, symptoms)         // existing: shows insight inside DailyCheckIn
  → calls onCheckInComplete(mood, symptoms)     // new: signals MoonDashboard
       → MoonDashboard.fetchPhaseInsight(mood, symptoms)  // replaces static cards
```

### ADR-5: Rate limiting is sufficient (no changes)

**Analysis:**
- Current: 30 req/min per IP
- New AI calls per Moon check-in: +1 (phase-insight). Total per check-in: 2 AI calls.
- Sun dashboard: 0 new calls (same endpoint, enhanced payload)
- Typical user session: ~5-8 API calls. Well within 30/min limit.
- **No rate limit changes needed.**

---

## 3. Affected Files (Implementation Map)

### Proxy changes (3 files)

| File | Change | Effort |
|------|--------|--------|
| `proxy/lib/minimax.ts` | Add `generatePhaseInsight()`. Update `generatePartnerAdvice()` signature to accept optional mood/symptoms. | Medium |
| `proxy/api/phase-insight.ts` | **New file.** Copy daily-insight.ts pattern, call `generatePhaseInsight()`, return `{ aboutPhase, selfCare }`. | Low |
| `proxy/api/partner-advice.ts` | Add optional `mood`/`symptoms` validation. Pass to `generatePartnerAdvice()`. | Low |

### App changes (7 files)

| File | Change | Effort |
|------|--------|--------|
| `app/lib/db/cycle.ts` | Add `getPartnerDailyLog(partnerId: string)` — query today's daily_log for partner. | Low |
| `app/hooks/useAIPhaseInsight.ts` | **New file.** Manual-trigger hook returning `{ aboutPhase, selfCare, isLoading, fetchPhaseInsight }`. | Low |
| `app/hooks/useAIPartnerAdvice.ts` | Accept optional `mood`/`symptoms` params, pass to proxy call. Re-fetch when partner data changes. | Low |
| `app/components/gf/DailyCheckIn.tsx` | Add `onCheckInComplete?: (mood, symptoms) => void` prop. Call it after successful save. | Low |
| `app/screens/MoonDashboard.tsx` | Use `useAIPhaseInsight`. Pass `onCheckInComplete` to DailyCheckIn. Replace static InsightCard value and description card with AI content (fallback to static i18n). | Medium |
| `app/screens/SunDashboard.tsx` | On mount, fetch partner's daily_log. Pass mood/symptoms to `useAIPartnerAdvice`. | Medium |
| `app/i18n/en/*.json` + `app/i18n/vi/*.json` | No new keys needed — existing phase i18n keys remain as static fallbacks. | None |

### No changes needed

| Layer | Reason |
|-------|--------|
| Database schema | `daily_logs` table already has `mood` and `symptoms` columns |
| Migrations | No new tables or columns required |
| RLS policies | Sun can already read partner's daily_logs via `my_partner_id()` |
| `app/store/appStore.ts` | Partner daily_log state can live in hooks (no global store change needed) |
| Rate limiter | 30 req/min is sufficient for +1 call per check-in |

---

## 4. Prompt Engineering Notes

### `generatePhaseInsight()` — system prompt direction

```
Role: warm, knowledgeable companion (same persona as daily-insight)
Input: phase + day + mood + symptoms
Output: { aboutPhase: "2-3 sentences about what's happening in her body/mind this phase,
                       personalized to how she's feeling",
          selfCare: "1-2 specific self-care suggestions based on her mood and symptoms" }
Rules: No medical advice. Normalizing tone. Connect symptoms to phase context.
Temperature: 0.8 (practical but warm)
Max tokens: 200 (covers both fields in JSON response)
```

### Updated `generatePartnerAdvice()` — prompt enhancement

When mood/symptoms are present, append to user message:
```
Her mood today: [label] | Symptoms: [list]
```

This gives the AI concrete context to generate advice like "She's feeling low and has cramps today — bring her a heating pad and her favorite tea" instead of generic phase advice.

---

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| AI returns malformed JSON for phase-insight | Medium | Parse with try/catch, fallback to static i18n content (existing pattern) |
| Partner daily_log not yet logged today | Low | Sun gets phase-only advice (current behavior) — graceful degradation |
| Extra latency from +1 AI call on Moon check-in | Low | Calls are parallel (daily-insight + phase-insight). Static content shown immediately. |
| Rate limit hit from burst of calls | Very Low | 30/min is 5x typical usage. Monitor but no action needed. |

---

## 6. Implementation Sequence

1. **Proxy first** — Add `generatePhaseInsight()` + update `generatePartnerAdvice()` + new endpoint
2. **DB layer** — Add `getPartnerDailyLog()`
3. **Hooks** — New `useAIPhaseInsight`, update `useAIPartnerAdvice`
4. **Components** — Update DailyCheckIn with callback prop
5. **Screens** — Wire up MoonDashboard and SunDashboard
6. **Test** — Verify fallback behavior, AI content quality, RLS access
