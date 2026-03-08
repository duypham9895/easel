# CR_20260308_001 — Personalized Phase Insight & Self-Care Spec

**Parent Issue:** [EAS-5](/issues/EAS-5) — Personalize About this Phase & Self-Care with AI
**This Issue:** [EAS-7](/issues/EAS-7) — Spec & Design
**Author:** Product Lead
**Date:** 2026-03-08
**Status:** Draft

---

## 1. Overview

After Moon submits her daily check-in (mood + symptoms), the static "About this Phase" and "Self-Care" cards on her dashboard should be replaced with AI-generated, personalized content that reflects how she actually feels today. Simultaneously, Sun's dashboard should become aware of Moon's real mood/symptoms so his "How to Show Up" advice is grounded in her actual state, not just the phase calendar.

### Goals

- Make Moon's dashboard feel **personally relevant** after check-in
- Give Sun **real-time emotional context** so his advice matches her actual day
- Maintain the **AI fallback pattern**: static content shown first, AI replaces seamlessly
- Keep the experience **warm and intimate**, never clinical

---

## 2. AI Prompt Specifications

### 2.1 Personalized "About this Phase" (Moon)

**Endpoint:** `POST /api/phase-insight` (new)
**Proxy function:** `generatePersonalizedPhaseInsight()` in `proxy/lib/minimax.ts`

| Input | Type | Source | Required |
|-------|------|--------|----------|
| `phase` | `menstrual \| follicular \| ovulatory \| luteal` | cycleCalculator | Yes |
| `dayInCycle` | `number (1-45)` | cycleCalculator | Yes |
| `mood` | `number (1-5) \| null` | daily_logs | No |
| `symptoms` | `string[]` | daily_logs | No (default `[]`) |
| `language` | `string` | i18n.language | Yes |

**Output:** Plain text, 2-3 sentences, max 50 words.

**System prompt behavior:**
```
You are a warm, knowledgeable companion inside Easel, a period-tracking app for couples.
Based on how the user feels today AND where she is in her cycle, write 2-3 sentences (max 50 words) that:
- Connect her current mood/symptoms to this phase in a normalizing, reassuring way
- Help her understand WHY she might feel this way right now
- Sound like a wise friend who gets it, not a textbook
- Never give medical advice or prescriptions
- Never be dismissive ("it's just hormones")
Respond with ONLY the insight text.
```

**Temperature:** 0.8
**Max tokens:** 120

**Difference from existing `generateDailyInsight`:** The existing daily insight validates feelings and offers a suggestion. This new prompt explains the **phase context** — why she feels what she feels. They serve complementary purposes and both appear post-check-in.

### 2.2 Personalized "Self-Care" (Moon)

**Endpoint:** `POST /api/self-care` (new)
**Proxy function:** `generatePersonalizedSelfCare()` in `proxy/lib/minimax.ts`

| Input | Type | Source | Required |
|-------|------|--------|----------|
| `phase` | enum | cycleCalculator | Yes |
| `dayInCycle` | `number (1-45)` | cycleCalculator | Yes |
| `mood` | `number (1-5) \| null` | daily_logs | No |
| `symptoms` | `string[]` | daily_logs | No |
| `language` | `string` | i18n.language | Yes |

**Output:** Plain text, 2-3 actionable tips, max 50 words.

**System prompt behavior:**
```
You are a caring self-care advisor inside Easel, a period-tracking app for couples.
Based on the user's current mood, symptoms, and cycle phase, suggest 2-3 specific,
actionable self-care activities (max 50 words) that:
- Directly address what she's experiencing (e.g., cramps → warm bath, fatigue → early bedtime)
- Match the energy level of her phase (gentle for menstrual, active for follicular)
- Feel like caring advice from a close friend
- Are practical and doable right now, not aspirational
- Never include medical advice or medication suggestions
Respond with ONLY the tips text.
```

**Temperature:** 0.8
**Max tokens:** 120

### 2.3 Enhanced "How to Show Up" (Sun — mood-aware partner advice)

**Endpoint:** `POST /api/partner-advice` (existing, enhanced)
**Proxy function:** `generatePartnerAdvice()` in `proxy/lib/minimax.ts` (updated signature)

| Input | Type | Source | Required | New? |
|-------|------|--------|----------|------|
| `phase` | enum | cycleCalculator | Yes | No |
| `dayInCycle` | `number` | cycleCalculator | Yes | No |
| `phaseTagline` | `string` | PHASE_INFO | Yes | No |
| `mood` | `number (1-5) \| null` | partner's daily_logs | No | **Yes** |
| `symptoms` | `string[]` | partner's daily_logs | No | **Yes** |
| `language` | `string` | i18n.language | Yes | No |

**Updated system prompt behavior:**
```
You are an empathy coach advising a caring boyfriend whose girlfriend is tracking
her cycle using Easel.
Write 2-3 warm, specific, actionable sentences (max 45 words) telling him
what to do or say TODAY.
Rules:
- Be concrete — not "be supportive" but "bring her a warm blanket and her favorite tea"
- Match the energy of her phase
- When mood/symptoms are provided, tailor advice to what she's actually feeling
  (e.g., if she's tired and has cramps, suggest comfort; if she's feeling great,
  suggest celebrating together)
- Sound like a wise friend, not a self-help book
- No medical advice
Respond with ONLY the advice text.
```

**Backward compatibility:** If `mood` and `symptoms` are not provided (null/empty), the prompt falls back to phase-only advice — identical to current behavior.

---

## 3. Moon Dashboard UX Flow

### 3.1 Before Check-in (current behavior, unchanged)

```
┌─────────────────────────────┐
│  AI Greeting                │
│  Phase tagline chip         │
│  PhaseWheel                 │
│  [Whisper to Sun]           │
│                             │
│  ┌──────┐  ┌──────────────┐ │
│  │Concep│  │ Self-Care    │ │  ← Static from i18n
│  │tion  │  │ (static)     │ │
│  └──────┘  └──────────────┘ │
│                             │
│  ┌──────────────────────┐   │
│  │ About this Phase     │   │  ← Static from i18n
│  │ (static text)        │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │ Daily Check-in       │   │  ← Mood + symptoms form
│  │ [mood 1-5] [symptoms]│   │
│  │ [Log & Get Insight]  │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### 3.2 After Check-in (new behavior)

```
┌─────────────────────────────┐
│  AI Greeting                │
│  Phase tagline chip         │
│  PhaseWheel                 │
│  [Whisper to Sun]           │
│                             │
│  ┌──────┐  ┌──────────────┐ │
│  │Concep│  │ Self-Care    │ │  ← AI-personalized (animated swap)
│  │tion  │  │ (personal)   │ │
│  └──────┘  └──────────────┘ │
│                             │
│  ┌──────────────────────┐   │
│  │ About this Phase     │   │  ← AI-personalized (animated swap)
│  │ (personalized text)  │   │
│  └──────────────────────┘   │
│                             │
│  ┌──────────────────────┐   │
│  │ Daily Check-in       │   │  ← Shows AI insight (existing)
│  │ "Your insight..."    │   │     + [Update my log] link
│  │ [Update my log]      │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### 3.3 Transition Animation

When check-in is submitted:

1. **Self-Care InsightCard** and **About this Phase card** show a subtle shimmer/skeleton while AI loads (same ActivityIndicator pattern as greeting/check-in insight)
2. Once AI responds, text cross-fades (opacity animation, 300ms) from static → personalized
3. A small "Personalized for you" label appears below each card (styled like the existing AI insight label — `Typography.tiny`, hint color)
4. If AI fails, cards remain showing static i18n content — no error shown to user

### 3.4 State Management

Add to `appStore.ts`:
```typescript
// New transient state (excluded from persistence)
personalizedPhaseInsight: string | null;
personalizedSelfCare: string | null;
isPhaseInsightLoading: boolean;
isSelfCareLoading: boolean;
```

Alternatively, these can live as local state within a new hook `usePersonalizedContent(phase, dayInCycle)` that:
- Returns `{ phaseInsight, selfCare, isLoading, refresh }`
- Is triggered by DailyCheckIn's `onSubmit` callback
- Fetches both endpoints in parallel
- Falls back to `null` on error (letting the parent component keep showing static text)

**Recommended approach:** New hook, not store state. These are ephemeral per-session values tied to the current screen, not app-wide state.

---

## 4. Sun Dashboard UX — Moon's Mood Visibility

### 4.1 New UI Element: "How She's Feeling" Card

Add a new card between the Moon Status Card and the Guide section:

```
┌─────────────────────────────┐
│  Moon Status Card (existing)│
│  [Phase orb] [Phase info]   │
│                             │
│  ┌──────────────────────┐   │  ← NEW
│  │ 💜 How She's Feeling │   │
│  │ Mood: Good (4/5)     │   │
│  │ Cramps · Fatigue     │   │
│  │ Checked in 2h ago    │   │
│  └──────────────────────┘   │
│                             │
│  Today's Guide              │
│  ┌──────────────────────┐   │
│  │ How to Show Up       │   │  ← Now mood-aware AI advice
│  │ (personalized)       │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

**Design details:**

| Property | Value |
|----------|-------|
| Background | `SunColors.card` |
| Border radius | `Radii.xl` |
| Accent | Phase color (left border or icon tint) |
| Mood display | Emoji + label (e.g., "Feeling good" not "4/5") |
| Symptoms | Chip-style inline list, max 4 visible + "+N more" |
| Timestamp | Relative ("2h ago", "this morning") |
| Empty state | "She hasn't checked in yet today" (soft text, no pressure) |

**Mood labels for Sun's view:**

| Mood Value | Label (EN) | Label (VI) |
|------------|------------|------------|
| 1 | "Having a rough day" | "Hom nay kho khan" |
| 2 | "Not feeling great" | "Khong duoc tot lam" |
| 3 | "Doing okay" | "Tam on" |
| 4 | "Feeling good" | "Cam thay tot" |
| 5 | "Feeling amazing" | "Tuyet voi" |

**Important:** These labels are warmer than Moon's self-assessment labels. Moon rates herself (1-5 numeric). Sun sees an interpreted, empathetic version.

### 4.2 Data Flow

1. Moon submits daily check-in → upserts to `daily_logs` table
2. Sun's dashboard fetches Moon's latest daily_log via existing RLS access:
   ```sql
   SELECT mood, symptoms, log_date, updated_at
   FROM daily_logs
   WHERE user_id = my_partner_id()
   AND log_date = CURRENT_DATE
   ```
3. If data exists, display "How She's Feeling" card + pass mood/symptoms to `useAIPartnerAdvice`
4. If no data today, show empty state card + use phase-only partner advice (existing behavior)

**Realtime option (future):** Subscribe to `daily_logs` changes for Moon's partner ID so Sun's card updates live when Moon checks in. Not required for v1 — polling on screen focus is sufficient.

### 4.3 Removing "Moon Mood Now" GuideCard

The existing GuideCard with `icon="activity"` and `title="moonMoodNow"` currently shows static `${phase}_mood` text. This becomes redundant with the new "How She's Feeling" card, which shows her **actual** mood instead of generic phase mood.

**Decision:** Remove the "Moon Mood Now" GuideCard. Replace the Guide section with:
- **"How to Show Up"** GuideCard (existing, now mood-aware) — remains the single guide card

---

## 5. Edge Cases

| Scenario | Moon Dashboard | Sun Dashboard |
|----------|---------------|---------------|
| Moon hasn't checked in today | Static i18n content for both cards | "She hasn't checked in yet today" card + phase-only advice |
| Mood = null (symptoms only) | AI uses symptoms only, mood="not rated" | Card shows symptoms but no mood label |
| No symptoms selected (mood only) | AI uses mood only, symptoms="none logged" | Card shows mood label, no symptom chips |
| Both null (empty submit) | Should not happen — submit button disabled when mood=null | N/A |
| AI fails for phase insight | Keep static `${phase}_moonMood` text | N/A |
| AI fails for self-care | Keep static `${phase}_selfCare` text | N/A |
| AI fails for partner advice | Keep existing phase-only fallback | Falls back to static `PHASE_INFO.partnerAdvice` |
| Moon updates her log mid-day | Cards re-animate with new personalized content | Sun's card updates on next screen focus |
| Couple not linked | Normal Moon experience (no Sun impact) | UnlinkedScreen shown (existing) |
| Moon logs on day rollover | Previous day's personalized content clears; new day starts fresh with static | Previous day's data clears; shows empty state |

---

## 6. Copy & Tone Guidelines for AI Prompts

### Voice

- **Warm friend**, not health professional
- **Normalizing**, not diagnosing ("lots of people feel this way during this phase" not "this is because progesterone drops")
- **Empowering**, not prescriptive ("you might enjoy..." not "you should...")
- **Specific to her**, not generic ("since you mentioned cramps..." not "during this phase, cramps are common")

### Forbidden

- Medical terminology (progesterone, estrogen, luteinizing hormone)
- Medication suggestions (take ibuprofen, try supplements)
- Diagnosis language ("you have PMS", "this indicates...")
- Dismissive phrases ("it's just hormones", "this will pass")
- Overly clinical tone ("symptoms consistent with...")

### Example Outputs

**Personalized Phase Insight (menstrual, mood=2, symptoms=[Cramps, Fatigue]):**
> "Your body is doing a lot of work right now, and feeling tired with cramps is completely natural. This is your time to slow down — your energy will start building again in a few days."

**Personalized Self-Care (follicular, mood=4, symptoms=[]):**
> "Your energy is rising — perfect time for that walk you've been putting off, trying a new recipe, or catching up with a friend who makes you laugh."

**Mood-aware Partner Advice (luteal, mood=2, symptoms=[Mood swings, Cravings]):**
> "She's having a tough day with mood swings and cravings. Surprise her with her favorite snack tonight and keep the evening low-key — a cozy movie wins over big plans today."

---

## 7. New Translation Keys

### English (`app/i18n/en/`)

**dashboard.json additions:**
```json
{
  "personalizedForYou": "Personalized for you",
  "howSheFeeling": "How She's Feeling",
  "notCheckedInYet": "She hasn't checked in yet today",
  "checkedInAgo": "Checked in {{time}}",
  "havingRoughDay": "Having a rough day",
  "notFeelingGreat": "Not feeling great",
  "doingOkay": "Doing okay",
  "feelingGood": "Feeling good",
  "feelingAmazing": "Feeling amazing"
}
```

### Vietnamese (`app/i18n/vi/`)

**dashboard.json additions:**
```json
{
  "personalizedForYou": "Duoc ca nhan hoa cho ban",
  "howSheFeeling": "Co ay cam thay the nao",
  "notCheckedInYet": "Co ay chua check-in hom nay",
  "checkedInAgo": "Da check-in {{time}} truoc",
  "havingRoughDay": "Hom nay kho khan",
  "notFeelingGreat": "Khong duoc tot lam",
  "doingOkay": "Tam on",
  "feelingGood": "Cam thay tot",
  "feelingAmazing": "Tuyet voi"
}
```

---

## 8. Implementation Summary

### New Files

| File | Purpose |
|------|---------|
| `proxy/api/phase-insight.ts` | New endpoint for personalized phase insight |
| `proxy/api/self-care.ts` | New endpoint for personalized self-care |
| `app/hooks/usePersonalizedContent.ts` | Hook fetching phase insight + self-care in parallel |
| `app/hooks/usePartnerDailyLog.ts` | Hook fetching Moon's latest daily_log for Sun |
| `app/components/sun/MoodCard.tsx` | "How She's Feeling" card for Sun dashboard |

### Modified Files

| File | Change |
|------|--------|
| `proxy/lib/minimax.ts` | Add `generatePersonalizedPhaseInsight()`, `generatePersonalizedSelfCare()`, update `generatePartnerAdvice()` signature |
| `app/screens/MoonDashboard.tsx` | Wire `usePersonalizedContent`, pass check-in callback, conditionally show personalized vs static |
| `app/screens/SunDashboard.tsx` | Add `usePartnerDailyLog`, add MoodCard, pass mood/symptoms to `useAIPartnerAdvice` |
| `app/hooks/useAIPartnerAdvice.ts` | Accept optional `mood` + `symptoms` params |
| `app/i18n/en/dashboard.json` | Add new translation keys |
| `app/i18n/vi/dashboard.json` | Add new translation keys |

### No Changes Needed

| Area | Why |
|------|-----|
| Database schema | `daily_logs` already stores mood + symptoms; RLS already allows partner access |
| Auth / RLS | `my_partner_id()` function already enables Sun reading Moon's daily_logs |
| Existing `useAIDailyInsight` | Stays as-is — it serves the check-in insight card (complementary to phase insight) |

---

## 9. UX Designer Delegation

The following items require component specs from UX Designer ([EAS-7 subtask needed](/issues/EAS-7)):

1. **MoodCard component** for Sun dashboard — exact layout, spacing, empty state visual
2. **Shimmer/skeleton animation** for loading state on personalized cards
3. **"Personalized for you" badge** — positioning, typography, color treatment
4. **Symptom chips** on Sun's MoodCard — max visible, "+N more" truncation style
5. **Cross-fade animation** timing and easing for static → personalized text swap

---

## 10. Open Questions

1. **Should Moon explicitly consent to sharing mood/symptoms with Sun?** Current RLS allows it by default. Privacy-conscious users may want granular control. **Recommendation:** Ship v1 with sharing on by default (it's the core value prop — Sun knowing how she feels). Add opt-out toggle in Phase 2 if user research shows demand.

2. **Should the existing `generateDailyInsight` be removed or kept alongside the new personalized phase insight?** **Recommendation:** Keep both. Daily insight (in the check-in card) validates feelings. Phase insight (in the "About this Phase" card) explains context. They're complementary.

3. **Should we batch the two new AI calls (phase-insight + self-care) into a single endpoint?** **Recommendation:** Keep separate for now. Simpler error handling, independent fallbacks. Batch in Phase 2 if latency becomes a concern.
