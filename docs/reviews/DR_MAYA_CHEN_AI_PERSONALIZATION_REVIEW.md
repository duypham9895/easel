# Expert Review: AI Personalization Feature — Health Safety & Accuracy

**Reviewer:** Dr. Maya Chen, OB-GYN (12 years clinical, menstrual health technology research)
**Date:** 2026-03-09
**Scope:** Phase Insight, Self-Care, Partner Advice — mood/symptom-personalized AI content
**Files Reviewed:** `proxy/lib/minimax.ts`, `app/components/gf/DailyCheckIn.tsx`, `app/hooks/useAIPhaseInsight.ts`, `app/hooks/useAISelfCare.ts`, `app/hooks/useAIPartnerAdvice.ts`, `app/constants/phases.ts`

---

## A. Strengths

**1. "No medical advice" guardrail is consistently enforced.**
Every system prompt (`generatePersonalizedPhaseInsight`, `generatePersonalizedSelfCare`, `generatePartnerAdvice`, `generateDailyInsight`) includes an explicit "No medical advice" instruction. This is the single most important safety measure for a consumer health app without clinical oversight. Well done.

**2. The "caring friend who knows biology" framing is clinically sound.**
The prompt in `generatePersonalizedPhaseInsight` (line 203: "Sound like a caring friend who knows biology, not a textbook") strikes the right balance. In clinical practice, women respond best to health information delivered in a relational tone. This framing reduces health anxiety while maintaining informational value.

**3. Fallback architecture prevents blank-screen anxiety.**
The static fallback pattern (e.g., `PHASE_INFO[phase].partnerAdvice` shown immediately, AI replacing on success) is excellent from a health UX perspective. Women checking in during distress (cramps, low mood) should never face a loading spinner with no content. The static content in `phases.ts` is accurate and warm.

**4. Mood-symptom pairing enriches phase-level guidance.**
Passing actual mood (1-5) + symptoms to the AI instead of relying solely on cycle phase is a meaningful clinical improvement. Two women in the menstrual phase can have vastly different experiences — one asymptomatic, another with debilitating cramps. The personalization acknowledges this individual variability, which most period apps fail to do.

**5. Partner advice that adapts to her actual state is genuinely novel.**
The `generatePartnerAdvice` prompt (line 104: "weave awareness of how she ACTUALLY feels into your advice") goes beyond generic phase guidance. In couples counseling contexts, the number one complaint from female partners is that support feels generic. This feature addresses that directly.

---

## B. Critical Issues

### B1. CRITICAL: No "See a Doctor" Escalation Path

**Problem:** The prompts instruct the AI to "validate how she is feeling" and "connect symptoms to her current cycle phase in a normalizing way" (`generateDailyInsight`, line 174). This normalizing framing is dangerous without guardrails because certain symptom patterns warrant medical evaluation:

- **Severe cramps** (mood 1 + Cramps) could indicate endometriosis, adenomyosis, or fibroids — conditions affecting ~10% of reproductive-age women
- **Spotting during non-menstrual phases** (Spotting in follicular/ovulatory/luteal) could indicate hormonal imbalance, polyps, or in rare cases, ectopic pregnancy
- **Persistent fatigue + mood 1** across multiple check-ins could indicate thyroid dysfunction or iron-deficiency anemia — both common in menstruating women

**Risk:** The AI could respond with "It's totally normal to feel cramps during your period — your uterus is just doing its thing!" to a woman who has undiagnosed endometriosis and needs a referral, not reassurance.

**Recommendation:** Add a conditional safety clause to system prompts:
```
If the user reports severe pain (mood 1 + cramps), spotting outside menstrual phase,
or symptoms that seem disproportionate to her cycle phase, include a gentle note like
"If this feels different from your usual cycle, it's always okay to check in with
your healthcare provider."
```

### B2. HIGH: Self-Care Suggestions Lack Contraindication Awareness

**Problem:** The `generatePersonalizedSelfCare` prompt (line 230: "Be concrete — not 'take care of yourself' but 'try a 10-minute warm bath with lavender tonight'") encourages specific physical recommendations without any contraindication guardrails.

**Potential harmful suggestions:**
- "Try a hot bath" — safe for most, but excessive heat during very heavy bleeding can increase flow
- "Do some gentle yoga inversions" — inversions during heavy menstrual flow are debated but some women experience discomfort
- "Try chamomile tea for relaxation" — generally safe but can interact with blood thinners
- "Essential oils on temples for headache" — some essential oils are irritants; peppermint oil contraindicated for certain skin conditions

**Risk:** At temperature 0.8, the model has enough creativity to suggest specific remedies, supplements, or physical activities that could be inappropriate for individual users whose medical history the app does not know.

**Recommendation:** Add to the self-care system prompt:
```
Never suggest supplements, herbal remedies, or specific medications.
Stick to general wellness activities: rest, gentle movement, hydration,
warmth, breathing exercises, social connection.
```

### B3. MEDIUM: Symptom List Has Clinically Significant Gaps

**Current symptoms (8):** Cramps, Bloating, Headache, Fatigue, Tender, Mood swings, Spotting, Cravings

**Missing symptoms that are clinically important for cycle tracking:**
| Symptom | Why It Matters |
|---------|---------------|
| **Acne/Skin changes** | Strong hormonal marker, peaks in luteal phase. Tracking helps identify androgen-related conditions (PCOS). |
| **Sleep disruption/Insomnia** | Progesterone drop in late luteal directly affects sleep architecture. Affects ~30% of women premenstrually. |
| **Back pain** | Distinct from cramps; prostaglandin-mediated referred pain. Very common, often undertreated. |
| **Nausea** | Common menstrual/luteal symptom; also an early pregnancy indicator if cycle is late. |
| **Discharge/Cervical mucus** | Primary fertility awareness marker; helps confirm ovulation phase accuracy. |
| **Anxiety** | Distinct from "mood swings"; anxiety has a specific luteal-phase pattern (PMDD screening). |
| **Libido changes** | Natural cycle-linked variation; peaks around ovulation. Relevant for a couples app. |

The current list skews toward physical symptoms and underrepresents neuropsychiatric and fertility-relevant markers. For a couples app, libido tracking would be particularly appropriate and useful for the partner advice feature.

### B4. MEDIUM: Mood Scale Lacks Granularity for Clinical Patterns

**Current scale:** 1 (terrible) - 2 (low) - 3 (okay) - 4 (good) - 5 (great)

This is a unidimensional scale that conflates emotional valence with energy level. A woman could be "low energy but content" (think: cozy luteal day) or "high energy but anxious" (think: ovulatory stress). The 1-5 mapping in the prompt (`['terrible', 'low', 'okay', 'good', 'great']` at line 99 of `minimax.ts`) loses this nuance.

**Clinical concern:** The PMDD screening questionnaire (DRSP) uses separate dimensions for mood, anxiety, and functional impairment. The current scale cannot differentiate between sadness, irritability, and anxiety — all of which have different hormonal correlates and require different partner responses.

**Recommendation (low-effort):** Rather than redesigning the scale, add an optional "mood flavor" selector after the 1-5 rating: Anxious, Sad, Irritable, Calm, Energized. This would dramatically improve AI personalization accuracy with minimal UI disruption.

### B5. LOW: Phase-Symptom Mapping Has No Validation Layer

**Problem:** The AI receives symptoms and phase but has no way to flag implausible combinations. For example:
- Spotting during ovulatory phase is clinically meaningful (could be ovulation bleeding — normal — or could indicate something else)
- The AI might normalize it either way depending on the model's training data

The app trusts the AI to make the right inference from phase + symptom, but MiniMax M2.5 is not a medical model and may not have reliable menstrual health knowledge.

**Recommendation:** Add a simple lookup table in the proxy that flags "unusual" phase-symptom combinations and appends a note to the system prompt like: "Note: spotting in the ovulatory phase can be normal (ovulation bleeding) but is worth mentioning if persistent."

---

## C. Missed Opportunities

### C1. No Longitudinal Pattern Detection
The app sends each day's check-in in isolation. There is no mechanism to tell the AI "she has reported mood 1-2 for the last 5 days of every luteal phase for the past 3 cycles." This is the most clinically valuable data in cycle tracking — it can flag PMDD, suggest cycle-syncing lifestyle changes, and give the partner advance warning.

**Impact:** Without historical context, the AI generates reactive advice. With it, the AI could generate proactive insights like "Based on your last few cycles, you tend to feel lowest around day 24. Your partner has been notified that this window is coming up."

### C2. No Cycle Irregularity Awareness in Insights
The `generatePersonalizedPhaseInsight` prompt does not receive information about whether the user's cycle is regular or irregular. A woman with a 45-day cycle in the "follicular" phase at day 30 is in a very different clinical situation than a woman with a 28-day cycle at day 7 — both labeled "follicular."

### C3. No Flow Tracking
Period flow (light/medium/heavy) is absent from the check-in. Flow intensity is one of the most clinically relevant menstrual metrics — it affects energy levels, iron status, and the appropriateness of self-care suggestions (e.g., "go for a run" is fine with light flow, less so with heavy).

### C4. Partner Advice Doesn't Account for Relationship Context
The partner advice is one-directional (AI to boyfriend). There is no feedback mechanism for the boyfriend to indicate what worked or didn't. Over time, this could allow the AI to learn "she appreciates physical comfort more than words" or "he tends to respond better to specific tasks than emotional cues."

---

## D. Quick Wins (Low-Effort, High-Value)

### D1. Add a "Talk to your doctor" disclaimer to the insight display
In `DailyCheckIn.tsx`, below the AI insight text (line 198), add a small, tappable disclaimer:
```
"This is not medical advice. If something feels off, talk to your healthcare provider."
```
Effort: 1 line of UI. Impact: Significant liability reduction and responsible health communication.

### D2. Add a "See a doctor" trigger phrase to system prompts
Append to `generateDailyInsight` and `generatePersonalizedPhaseInsight`:
```
If she reports mood 1 with multiple physical symptoms, end with:
"You know your body best — if this doesn't feel typical, a quick chat with your doctor never hurts."
```
Effort: 2 lines in `minimax.ts`. Impact: Catches the most dangerous normalization cases.

### D3. Add Acne and Sleep to symptom list
These are the two highest-impact additions: acne is a strong hormonal marker (useful for phase insight accuracy), and sleep disruption directly affects mood predictions.
Effort: 2 entries in `SYMPTOM_OPTIONS`, 2 translation keys. Impact: Meaningful improvement in symptom-phase correlation.

### D4. Add flow intensity to the menstrual phase check-in
Show a "Flow today?" selector (Light / Medium / Heavy) only when `phase === 'menstrual'`. Pass it to the AI prompts. This single addition would make the self-care and phase insight dramatically more appropriate during menstruation.
Effort: Conditional UI element + 1 prompt parameter. Impact: High — flow is the most undertracked metric in consumer period apps.

### D5. Lower self-care temperature from 0.8 to 0.6
The self-care prompt at temperature 0.8 (line 239) gives the model too much creative latitude for health-adjacent suggestions. Reducing to 0.6 would make suggestions more predictable and safer while still varied.
Effort: Change one number. Impact: Reduces risk of outlier suggestions.

---

## E. Rating: 7/10

**Breakdown:**

| Category | Score | Notes |
|----------|-------|-------|
| Safety guardrails | 6/10 | "No medical advice" is present but lacks escalation path for concerning symptoms |
| Symptom accuracy | 6/10 | Core symptoms covered, but missing key clinical markers (flow, sleep, acne, anxiety) |
| Phase-symptom science | 8/10 | The four-phase model is well-established; connecting mood/symptoms to phase is sound |
| Self-care safety | 6/10 | Concrete suggestions are good UX but need contraindication guardrails |
| Partner advice quality | 9/10 | Genuinely thoughtful; mood-aware partner guidance is a standout feature |
| Prompt engineering | 8/10 | Well-crafted tone, appropriate word limits, good temperature calibration (except self-care) |
| Data model completeness | 5/10 | No flow tracking, no longitudinal patterns, no cycle regularity context |

**Summary:** Easel's AI personalization is one of the better implementations I have seen in consumer period tracking apps. The emphasis on warmth over clinical language, the mood-symptom integration, and the partner advice personalization are genuinely well-considered. The primary risk is not that the app gives bad advice — the "no medical advice" guardrail handles that — but that it normalizes symptoms that warrant clinical evaluation. Adding a lightweight "see your doctor" escalation path and expanding the symptom list would bring this from a 7 to an 8.5+ with minimal engineering effort.

---

*Dr. Maya Chen — This review is provided as expert consultation and does not constitute medical advice or regulatory guidance. Product teams should consult with healthcare regulatory counsel before making clinical claims.*
