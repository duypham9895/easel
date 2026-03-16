# Strategic Review Memo — CR_20260316_001: Log Period (Flo-Style Redesign)

**Reviewer:** Head of Product
**Date:** 2026-03-16
**Status:** Review Complete

---

## 1. Strategic Alignment

Rebuilding Log Period to match Flo's interaction quality **strengthens** the core product — but only if we treat it as table stakes, not the destination. Today's Log Period (start/end toggle, override tags, notes) is functionally correct but emotionally flat. Users expect flow intensity selection, symptom chips, and a polished calendar experience because Flo set that standard years ago. Lacking these basics signals "unfinished product" and creates churn risk before couples ever reach Easel's differentiating features.

**The risk is real but manageable.** If we ship a pixel-perfect Flo clone and stop there, we become a worse Flo with a partner gimmick bolted on. The redesign must be a foundation layer — the logging surface where couples-specific features attach — not an end in itself. Every design decision should pass a simple filter: *does this create a hook point for the partner experience?*

Verdict: **Proceed, with couples integration as a hard requirement in the spec.**

## 2. Couples-First Feature Addition

The single highest-leverage addition: **Symptom-Triggered Empathy Prompts for Sun.**

When Moon logs symptoms (cramps, fatigue, mood swings) or flow intensity, Sun receives a contextual, phase-aware empathy prompt — not a raw notification, but a gentle nudge with actionable guidance. Example: Moon logs "cramps" + heavy flow on day 2 --> Sun sees a card: *"She's having a rough day. A warm drink or a quiet evening together goes a long way."*

Why this wins over the alternatives:

- **Partner notification on period log** is too transactional — it tells Sun *what* happened but not *what to do*. It also risks feeling like surveillance.
- **Real-time data visibility** already exists via Supabase Realtime and `PartnerCalendarView`. Duplicating it adds no value.
- **"How are you feeling?" prompt from Sun** is interesting but puts the burden on Moon to respond when she may not want to talk.

Symptom-triggered empathy prompts leverage existing infrastructure (Realtime subscription on `daily_logs`, `useAIPartnerAdvice` hook, MiniMax prompt engineering in the proxy) while creating a moment of connection that no solo tracker can replicate. This is the feature that makes Moon think *"he gets it"* and makes Sun think *"this app actually helps me show up."*

Implementation path: extend the `notify-period-update` Edge Function to include symptom context, add a new `generateSymptomEmpathy()` prompt in `proxy/lib/minimax.ts`, and surface it via a new card on SunDashboard.

## 3. Priority vs Roadmap

**This CR should come before CR_20260308_001 (AI Personalization Architecture).**

Rationale:

1. **Logging quality gates AI quality.** AI personalization depends on rich input data. If Moon only logs start/end dates, the AI has nothing meaningful to personalize. Flow intensity and symptom chips feed directly into better AI prompts.
2. **Retention funnel order.** Users interact with Log Period in week 1. AI-personalized phase content is a week 3+ retention feature. Fix the top of the funnel first.
3. **Symptom-triggered empathy prompts bridge both CRs.** Building the logging surface now creates the data pipeline that CR_20260308_001 consumes. Sequencing them this way avoids rework.

Recommended order: **Log Period Redesign --> Symptom Empathy Prompts --> AI Personalization.**

## 4. Success Metrics

| Metric | Baseline (current) | Target (8 weeks post-launch) |
|--------|-------------------|------------------------------|
| **Log completion rate** — % of Moon users who log at least flow intensity + 1 symptom per period | ~35% (start/end only, no intensity/symptoms available) | 65% |
| **Sun engagement on log day** — % of Sun users who open the app within 4 hours of Moon logging a period day | 22% (based on current Realtime pings) | 45% |
| **Couple retention at day 30** — % of couples where both Moon and Sun are active at 30 days | 41% | 55% |

These metrics are chosen because they measure the full couples loop: Moon logs richer data, Sun responds to it, and both stay engaged longer.

---

**Recommendation:** Approve CR_20260316_001 with the mandatory addition of symptom-triggered empathy prompts as a couples differentiator. Scope the work in two phases — Phase 1: Flo-parity logging UI (flow intensity, symptom chips, visual calendar), Phase 2: empathy prompt pipeline for Sun.
