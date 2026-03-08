# EAP_20260309_001 — Expert Reviews Summary

> **ID:** EAP_20260309_001
> **Date:** 2026-03-09
> **Scope:** Feature-focused — AI Personalization (Phase Insight, Self-Care, Partner Advice)

## Scores

| Expert | Domain | Rating | Full Review |
|--------|--------|--------|-------------|
| Dr. Maya Chen | Women's Health | 7/10 | `docs/reviews/DR_MAYA_CHEN_AI_PERSONALIZATION_REVIEW.md` |
| James Park | Relationship Psychology | 6.5/10 | Agent output (embedded in task transcript) |
| Sarah Okonkwo | UX & Product Design | 6.5/10 | Agent output (embedded in task transcript) |
| Marcus Webb | Privacy & Data Ethics | 4/10 | `docs/reviews/PRIVACY_REVIEW_AI_PERSONALIZATION.md` |
| Priya Nair | Growth & Retention | 5.5/10 | `docs/reviews/priya_nair_growth_review.md` |
| David Lim | Couples Strategy | 7.5/10 | `docs/reviews/david_lim_ai_personalization_review.md` |

**Average: 6.2/10**

---

## Cross-Expert Consensus (Issues Flagged by 3+ Experts)

### 1. Moon Has No Granular Sharing Controls (4/6 experts)
**Flagged by:** James Park, Marcus Webb, Sarah Okonkwo, David Lim
Moon's mood and symptoms are automatically shared with Sun. No toggle, no opt-out, no consent flow. Marcus rates this CRITICAL from a privacy/legal perspective; James flags it as a surveillance/coercive control risk; David notes it could cause self-censoring during rough patches.

### 2. Sun Is a Passive Spectator — Will Churn (4/6 experts)
**Flagged by:** David Lim, Priya Nair, Sarah Okonkwo, James Park
Sun has zero input surfaces, zero interactive elements, zero feedback mechanisms. David predicts Sun churn at 30-45 days. Priya estimates Sun D30 retention 40-50% lower than Moon's. Both recommend a Sun check-in or micro-action feature.

### 3. No Personalization Indicator — Users Can't Tell Static from AI (3/6 experts)
**Flagged by:** Sarah Okonkwo, Priya Nair, David Lim
Content silently swaps from static to AI with no visual distinction. Users don't know they received personalized content. The `isAI` flag exists but is unused in the UI.

### 4. Check-In Card Below the Fold — Discovery Problem (3/6 experts)
**Flagged by:** Priya Nair, Sarah Okonkwo, David Lim
DailyCheckIn component is positioned after PhaseWheel, Whisper button, insight row, and phase description card. 30-40% of first-session users may never see it.

### 5. No Longitudinal Data in AI Prompts — Single-Day Snapshots Only (3/6 experts)
**Flagged by:** Dr. Maya Chen, David Lim, Priya Nair
Each AI call is stateless. No cross-day or cross-cycle patterns. This limits personalization quality and creates a thin competitive moat. Historical data exists in `daily_logs` but is never queried.

### 6. Mood Label Mismatch — UI Says "Meh", AI Sees "Low" (2/6 experts)
**Flagged by:** James Park, Sarah Okonkwo
UI mood labels: [Low, Meh, Okay, Good, Great]. AI prompt labels: [terrible, low, okay, good, great]. The AI receives a more negative signal than intended for mood 1 and 2.

### 7. No "See a Doctor" Escalation Path (2/6 experts)
**Flagged by:** Dr. Maya Chen, Marcus Webb
The normalizing framing could dismiss symptoms that warrant medical evaluation (endometriosis, PMDD, thyroid dysfunction). No conditional safety clause in AI prompts.

### 8. No Privacy Policy Published (1 expert, CRITICAL severity)
**Flagged by:** Marcus Webb
Landing page privacy link is a placeholder. Processing special category health data with no published privacy policy is a legal violation across virtually every jurisdiction.
