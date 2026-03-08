# EAP_20260309_001 — Prioritized Action Plan

> **ID:** EAP_20260309_001
> **Date:** 2026-03-09
> **PM:** Product Lead
> **Scope:** AI Personalization Feature — Phase Insight, Self-Care, Partner Advice
> **Panel Average Score:** 6.2/10

---

## A. NOW — This Sprint (P0/P1)

| # | Issue | Action | Effort | Expert(s) | Route To |
|---|-------|--------|--------|-----------|----------|
| 1 | **Privacy policy missing** | Publish a basic privacy policy. Replace placeholder `href="#"` on landing page. | 1 day | Marcus Webb | Content Writer |
| 2 | **Mood label mismatch** | Change AI mood labels in `minimax.ts` line 99 from `['terrible', 'low', 'okay', 'good', 'great']` to `['low', 'meh', 'okay', 'good', 'great']` to match UI. Same fix needed at lines 166, 196, 225. | 30 min | James Park | Frontend Engineer |
| 3 | **Add "see a doctor" safety clause** | Append to `generateDailyInsight` and `generatePersonalizedPhaseInsight` prompts: "If she reports mood 1 with multiple physical symptoms, end with: 'You know your body best — if this doesn't feel typical, a quick chat with your doctor never hurts.'" | 1 hr | Dr. Maya Chen | Backend Engineer |
| 4 | **Add health disclaimer below AI insights** | In `DailyCheckIn.tsx`, below insight text, add tappable micro-text: "This is not medical advice. If something feels off, talk to your healthcare provider." | 1 hr | Dr. Maya Chen | Frontend Engineer |
| 5 | **Move check-in card above "About this Phase"** | In `MoonDashboard.tsx`, reorder `<DailyCheckIn>` to appear after insight row, before phase description card. | 30 min | Priya Nair, Sarah Okonkwo | Frontend Engineer |
| 6 | **Lower self-care temperature** | Change self-care prompt temperature from 0.8 to 0.6 in `minimax.ts` line 239. Reduces risk of outlier health suggestions. | 5 min | Dr. Maya Chen | Backend Engineer |
| 7 | **Add self-care prompt guardrail** | Append to `generatePersonalizedSelfCare` prompt: "Never suggest supplements, herbal remedies, or specific medications. Stick to general wellness: rest, gentle movement, hydration, warmth, breathing exercises, social connection." | 30 min | Dr. Maya Chen | Backend Engineer |
| 8 | **Add consent disclosure during couple linking** | Before Moon confirms link, show: "Your partner will see insights based on your cycle phase and daily check-ins. You can change this in Settings." | 3-4 hrs | Marcus Webb, James Park | Frontend Engineer |

---

## B. NEXT — Next 2 Sprints (P2)

| # | Issue | Action | Effort | Expert(s) | Route To |
|---|-------|--------|--------|-----------|----------|
| 9 | **Add "Personalized for you" indicator** | Show a subtle sparkle icon or "Personalized" micro-label when AI content replaces static. Use existing `isAI` flag pattern. | 3-4 hrs | Sarah Okonkwo, Priya Nair | Frontend Engineer |
| 10 | **Standardize loading states** | Replace self-care `'...'` with `ActivityIndicator` matching phase insight card. Add `FadeIn` animation to self-care card. | 2-3 hrs | Sarah Okonkwo | Frontend Engineer |
| 11 | **Add sharing controls for Moon** | Settings toggles: "Share mood with partner" / "Share symptoms with partner". Moon can log for herself without broadcasting. | 1-2 days | Marcus Webb, James Park | Frontend + Backend Engineer |
| 12 | **Cache partner log 48 hours** | When Moon hasn't checked in today, fall back to yesterday's log in `fetchPartnerDailyLog`. Reduces check-in pressure signal. | 2-3 hrs | James Park | Frontend Engineer |
| 13 | **Add "Ask Her" advice variant** | Append to partner advice prompt: "Occasionally (1 in 3 times), suggest he ask her how she's feeling or what she needs, rather than assuming." | 30 min | James Park | Backend Engineer |
| 14 | **Add yesterday's mood to AI prompt** | Fetch yesterday's log before generating today's insight. Pass to prompt for temporal context ("Yesterday you felt good — be extra gentle today"). | 2-3 hrs | Priya Nair | Frontend + Backend Engineer |
| 15 | **Add "Based on today's check-in" caption on Sun's advice** | When `isAI` is true and mood data present, show caption below advice card. When no mood data, show "Based on her cycle phase." | 1 hr | James Park, Sarah Okonkwo | Frontend Engineer |
| 16 | **Implement basic unlink flow** | Set `couples.status = 'unlinked'` — RLS already checks for `status = 'linked'`, so this immediately revokes data access. | 3-4 hrs | Marcus Webb | Backend Engineer |
| 17 | **Add Acne and Sleep to symptom list** | Two new entries in `SYMPTOM_OPTIONS`, 2 translation keys per language. Strongest hormonal markers missing from current list. | 1 hr | Dr. Maya Chen | Frontend Engineer |
| 18 | **Push Sun when Moon checks in** | When Moon submits daily log, fire push to Sun: "Your partner shared how she's feeling today." | Half day | David Lim, Priya Nair | Backend Engineer |
| 19 | **"Sun opened the app" indicator for Moon** | Write timestamp to `couples` when Sun opens dashboard. Moon sees "Sun checked in 2h ago." | 2-3 days | David Lim | Frontend + Backend Engineer |

---

## C. LATER — Backlog (P3)

| # | Issue | Action | Effort | Expert(s) |
|---|-------|--------|--------|-----------|
| 20 | **Sun daily check-in** | "How available are you today?" (1-5) + emotion chips. Makes Sun a first-class user. | 1-2 weeks | David Lim, Priya Nair |
| 21 | **Cycle trend insights** | After 2+ cycles, show mood/symptom patterns ("Your mood dips on days 22-25"). | 1-2 weeks | Priya Nair, Dr. Maya Chen |
| 22 | **Longitudinal data in AI prompts** | Send last 3 cycles of daily logs to prompts for pattern-aware insights. | 1 week | David Lim, Priya Nair, Dr. Maya Chen |
| 23 | **AI quality gate** | Compare AI response to static fallback; if too similar, enhance or differentiate. | 3-5 days | Priya Nair |
| 24 | **Action confirmation loop** | Sun taps "Done" on advice, Moon sees subtle "Sun has something planned." | 1 week | David Lim |
| 25 | **Feedback thumbs up/down on AI advice** | Store in feedback table, use for prompt tuning. | 1-2 days | David Lim, Priya Nair |
| 26 | **Flow intensity tracking (menstrual only)** | Light/Medium/Heavy selector during menstrual phase. Pass to AI prompts. | 2-3 days | Dr. Maya Chen |
| 27 | **Add mood flavor selector** | After 1-5 rating, optional: Anxious, Sad, Irritable, Calm, Energized. | 2-3 days | Dr. Maya Chen |
| 28 | **Data Processing Agreement with MiniMax** | Execute DPA covering health data. Prohibit training on user data. | Legal task | Marcus Webb |
| 29 | **Forward Supabase JWT to proxy** | Replace shared client token with per-user auth on health endpoints. | 3-5 days | Marcus Webb |
| 30 | **Transparency dashboard for Moon** | Settings screen showing what Sun accessed and what was sent to AI. | 1 week | Marcus Webb |
| 31 | **Data export/deletion flow** | GDPR Art. 17 compliance: delete Moon's data, cascade through daily_logs. | 3-5 days | Marcus Webb |
| 32 | **Shared couples timeline** | Private timeline of whispers, SOS moments, phase transitions. | 2-3 weeks | David Lim |

---

## D. NEVER — Rejected

| Idea | Reason |
|------|--------|
| Show raw mood score to Sun | Deliberate design: Sun sees AI-synthesized advice, never raw data. Protects emotional safety. |
| Heavy gamification (badges, points, leaderboards) | Conflicts with intimate, warm product vision. Streak counters are ok; full gamification is not Easel. |
| End-to-end encryption for daily_logs | Would prevent RLS-based partner sharing. The consent model is the right solution, not encryption. |
| On-device AI inference | MiniMax M2.5 quality matters more at this stage. Revisit when on-device models reach quality parity. |

---

## E. Quick Win List (< 1 day each, do first)

1. Fix mood label mismatch in `minimax.ts` (30 min)
2. Lower self-care temperature to 0.6 (5 min)
3. Add self-care prompt guardrail (30 min)
4. Add "see a doctor" safety clause to prompts (1 hr)
5. Add health disclaimer below AI insights (1 hr)
6. Move check-in card above phase description card (30 min)
7. Replace self-care `'...'` with `ActivityIndicator` (30 min)

**Total: ~4.5 hours of engineering time for significant safety, UX, and retention improvements.**

---

## F. Routing Summary

```
→ BUG_FIX_PIPELINE:                [#2 Mood label mismatch]
→ CHANGE_REQUEST_PIPELINE:         [#3, #4, #5, #6, #7, #8, #9, #10, #11, #12, #13, #14, #15, #16, #17, #18, #19]
→ FEATURE_DEVELOPMENT_PIPELINE:    [#20 Sun check-in, #21 Cycle trends, #24 Action confirmation, #32 Shared timeline]
→ USER_PERSONA_TESTING_PIPELINE:   [#8 Consent flow, #11 Sharing controls, #20 Sun check-in — validate with Linh & Minh]
```

---

## G. Downstream Standards Reminder

All routed items MUST follow `docs/skills/TESTING_STANDARDS.md`:
- Device-test requirements cannot be verified by code inspection alone
- UI/layout changes require Layout Chain Trace
- User confirmation gate for device-test cases
