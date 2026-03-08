# Expert Review: AI Personalization Based on Daily Check-In

**Reviewer:** David Lim — Founder of two relationship tech products, advisor to 5 femtech startups
**Date:** 2026-03-09
**Feature:** Mood-aware AI personalization for Moon (phase insight, self-care) and Sun (partner advice)
**Rating:** 7.5/10

---

## A. Strengths — What This Gets Right

### 1. You Own the Only "Empathy Bridge" in the Market

No one else connects cycle data to partner behavior in real time. Flo has 380M+ users but treats the partner as invisible. Clue has the science but no relational layer. Paired and Lasting have relationship exercises but no biological context. Easel is the only product where a biological signal (mood 2/5 + cramps + fatigue) transforms into a concrete behavioral instruction for a partner ("Bring her tea and keep the evening quiet — she's running on fumes today").

This is not a feature. This is a category. The daily check-in makes it *live* data rather than generic phase advice, which is the difference between "during menstrual phase, be gentle" (what a blog post says) and "she's at a 2 with cramps right now — here's what to do" (what only a connected app can say).

### 2. The Prompt Engineering Is Surprisingly Disciplined

Having reviewed `proxy/lib/minimax.ts`, I'm impressed by several details:
- **Temperature calibration per use case** (0.85 for greetings, 0.8 for advice, 0.1 for predictions) — most early-stage apps use one temperature for everything
- **Strict word caps** ("max 45 words", "max 25 words") — this prevents the AI from rambling and keeps the mobile UX tight
- **Explicit anti-clinical guardrails** ("no medical advice", "sound like a caring friend, not a self-help book") — critical for liability and tone
- **The think-block stripping** (`<think>...</think>` regex removal) shows you understand the model's reasoning output and handle it properly

### 3. The Fallback Pattern Is Production-Ready

The `static content shown immediately → AI replaces on success → silent fallback on error` pattern (visible in `useAIPartnerAdvice.ts` and `useAIPhaseInsight.ts`) is exactly right. Users never see a blank screen. The app works without AI. AI makes it better, not dependent. This is rare — most AI-first apps break when the API is slow or down.

### 4. The Check-In Design Is Low-Friction

5-point mood scale + 8 symptom chips + one tap to submit. No journaling, no free text, no overwhelm. The `DailyCheckIn` component takes under 10 seconds to complete. This matters enormously for daily retention — every extra field you add costs you 15-20% completion rate. You're at the right level of granularity.

### 5. Data Flows Correctly Between Partners

The architecture is clean: Moon logs → `daily_logs` table → Sun's dashboard fetches via `fetchPartnerDailyLog()` → feeds into `useAIPartnerAdvice(phase, dayInCycle, partnerLog?.mood, partnerLog?.symptoms)`. RLS handles authorization. No custom auth hacks. The couple relationship is the security boundary. This is the right way to build shared health data.

---

## B. Critical Issues

### 1. Sun Is Still a Spectator, Not a Participant (CRITICAL)

Looking at `SunDashboard.tsx`, Sun's entire experience is:
- Read Moon's status card
- Read a mood summary (`formatPartnerMood`)
- Read AI-generated advice ("How to Show Up")
- Receive Whisper/SOS alerts

Sun has **zero input surfaces**. He doesn't check in. He doesn't log his own state. He doesn't confirm he acted on advice. He doesn't rate whether the advice helped.

**Why this matters strategically:** In every dual-user app I've built or advised (2 products, 5 startups), the passive user churns first. Always. The active user has intrinsic motivation (tracking her own health). The passive user's only motivation is *the relationship* — and if the app feels like a one-way information feed, he'll just ask her directly instead.

The mood-aware partner advice makes the content *better*, but it doesn't change Sun's fundamental role from "reader of instructions" to "active participant in the relationship."

**Churn prediction:** Without Sun-side engagement features, expect Sun to stop opening the app within 30-45 days. Moon will follow within 60-90 days because "he never checks the app anyway."

### 2. The Asymmetry Is Structurally Unsustainable

Moon does all the work:
- Logs period dates
- Completes daily check-ins
- Sends Whispers
- Sends SOS signals

Sun receives all the value:
- Gets told how she feels
- Gets told what to do
- Gets alerts

This creates an invisible resentment dynamic. Moon thinks: "I'm doing all this logging — does he even read it?" There's no feedback mechanism. Moon never finds out if Sun read her mood, followed the advice, or even opened the app today.

**The real-world parallel:** Imagine texting someone every day and never getting a read receipt. That's Moon's experience with Sun's engagement.

### 3. Competitors Could Copy the Partner Layer — But Not Quickly

Could Flo add partner features? Technically, yes. But here's why it would take them 12-18 months, not "overnight":

- **Database architecture:** They'd need to add couple linking, partner data sharing, RLS policies — a fundamental schema change to a system serving 380M users
- **Product identity:** Flo is "my health app." Adding a partner viewer changes the mental model. Their product team would agonize over this for 6+ months
- **Regulatory concerns:** Sharing health data with a partner introduces GDPR/HIPAA complications that a solo tracker doesn't have
- **AI integration:** Their chatbot ("Flo AI") is Q&A-based, not contextual. Converting it to real-time partner advice requires a different prompt architecture

**However:** If Easel proves the couples tracking model works, Flo could acquire you or a clone in 18-24 months. Your window to build defensibility is ~12 months.

### 4. Defensibility Requires Data Moats, Not Feature Moats

The current AI personalization is based on a single day's check-in. One mood rating + symptoms. This is valuable but *thin*. Any competitor could replicate this prompt:

```
"She's feeling [mood] with [symptoms] during [phase] — give the partner advice"
```

What they can't replicate is **longitudinal pattern data**: "She always gets cramps on day 19, her mood drops to 2 on days 3-5, and the last three luteal phases she's craved chocolate." That data takes months to accumulate and is the real competitive moat.

You're storing daily logs in `daily_logs` but not using historical patterns in your prompts yet. The AI sees today's snapshot, not the full picture.

### 5. Rough Patch Scenario — The App Could Make Things Worse

When a couple is fighting, this app creates several risks:

- **Moon logs mood 1/5 with no symptoms.** Is she upset about her cycle or upset at her partner? The AI can't tell the difference. Sun gets advice like "she's having a terrible day, bring her comfort" when the correct action might be "give her space because she's angry at you"
- **Surveillance anxiety:** If Moon knows Sun sees her mood in real time, she may censor her logs. A mood 1 becomes a mood 3 to avoid questions. The data becomes unreliable
- **Weaponization:** "The app says you're in a bad mood — is it because of what I said?" Now Moon's private health data is relationship ammunition

There is no "relationship status" context in the AI prompts. The system assumes the couple is always in a supportive dynamic.

### 6. Stickiness Analysis — Incomplete But Promising

Current retention hooks:
- Daily check-in (Moon) — yes, this drives DAU
- AI-refreshed content — yes, new advice daily prevents staleness
- Whisper/SOS — yes, high-emotion moments create memories
- Phase cycle — yes, the 28-day loop creates a natural re-engagement cadence

Missing retention hooks:
- No streaks or consistency rewards for daily check-ins
- No "relationship health score" that both partners maintain together
- No shared history ("remember last month when you sent that Whisper?")
- No social proof ("87% of couples using Easel report better communication")

---

## C. Missed Opportunities

### 1. Sun Check-In (The Most Important Missing Feature)

Give Sun a 10-second daily check-in:
- "How available are you today?" (1-5: buried at work → fully present)
- "Anything on your mind?" (3-4 emotion chips: stressed, excited, tired, good)

This does three things:
- Makes Sun feel like a first-class user with his own input
- Lets Moon see that Sun is thinking about her ("he checked in today")
- Gives the AI richer context: "She's at mood 2 with cramps, he's stressed from work — advice: send a quick voice note, don't try to fix anything tonight"

### 2. Action Confirmation Loop

After Sun reads "bring her tea tonight," let him tap "Done" or "I'll do this." Moon sees a subtle indicator: "Sun read your update" or "Sun has something planned for tonight." No details — just presence. This closes the feedback loop without oversharing.

### 3. Historical Pattern AI

Feed the last 3 cycles of daily logs into the partner advice prompt:
```
"She typically feels worst on days 3-5. Last month, day 4 had mood 1 with cramps and fatigue. Today is day 4 and she logged mood 2 with cramps — she's tracking slightly better than usual. Your advice..."
```

This is the data moat. No competitor can generate this without months of user data.

### 4. "How Did That Go?" Retrospective

Once per cycle, ask both partners: "How supported did you feel this cycle?" (Moon) and "How helpful was the guidance this cycle?" (Sun). Use this to tune future AI advice and create a visible improvement trajectory.

### 5. Shared Journal or Timeline

A private, couples-only timeline showing:
- Whispers sent and received
- SOS moments and how they were handled
- Phase transitions with both partners' check-in summaries
- "This time last month" comparisons

This creates the "relationship memory" that makes the app irreplaceable.

---

## D. Quick Wins (< 1 Sprint Each)

### 1. "Sun Opened the App" Indicator (2-3 Days)

When Sun opens the dashboard, write a timestamp to the `couples` table. Moon sees "Sun checked in 2h ago" on her dashboard. Zero UI for Sun, huge emotional impact for Moon. Closes the "is he even reading this?" anxiety.

### 2. Read Receipt for Mood (1-2 Days)

When Sun's dashboard fetches `fetchPartnerDailyLog()`, mark the log as "seen" (add a `partner_viewed_at` column). Moon sees a subtle checkmark next to her check-in. "Your partner saw your update." Minimal code, massive relationship reassurance.

### 3. Advice Quality Thumbs Up/Down (1 Day)

Add a thumbs up/down on the "How to Show Up" card. Store in a `feedback` table. Use it to:
- Tune prompt temperature and wording over time
- Identify which phase/mood combos produce bad advice
- Tell investors "82% of AI advice rated positively" (fundraising gold)

### 4. Check-In Streak Counter for Moon (1 Day)

Add a small "7-day streak" badge to the DailyCheckIn component. Streaks are the cheapest retention mechanic in mobile. They work. Don't overthink it.

### 5. Push Sun When Moon Checks In (Half Day)

When Moon submits her daily log, fire a silent push to Sun: "Your partner shared how she's feeling today." Sun opens the app, sees fresh mood-aware advice. This is the engagement loop that turns daily check-in from a Moon habit into a couples habit.

---

## E. Rating: 7.5/10

**What earns the 7.5:**
- The couples + cycle + AI combination is genuinely unique in the market
- The implementation quality is high (prompt engineering, fallback patterns, security layers, clean data flow)
- The check-in UX is well-calibrated for daily completion
- The mood-aware partner advice is a meaningful upgrade over generic phase content
- The Whisper/SOS system creates high-emotion engagement moments that competitors lack

**What keeps it from 9+:**
- Sun remains a passive consumer — the #1 existential risk to retention
- No feedback loop between partners (Moon doesn't know if Sun reads or acts)
- AI uses single-day snapshots instead of longitudinal patterns (thin moat)
- No safeguards for relationship-conflict scenarios
- Missing the streak/gamification/shared-history mechanics that drive long-term retention in couples apps

**The bottom line:** Easel has found a genuinely defensible niche — the intersection of cycle tracking, partner awareness, and AI personalization. No one else is here yet. The AI personalization feature makes the content layer meaningfully better. But the app's survival depends on solving the Sun engagement problem within the next 2-3 months. A passive partner is a churned partner, and a churned partner means a churned couple. The quick wins I listed above (especially the "Sun opened the app" indicator and the push-on-checkin loop) would buy significant time while the team builds the deeper Sun check-in and feedback features.

The 12-month window before Flo or a well-funded clone enters this space is real. Use it to accumulate longitudinal data, build the relationship memory layer, and make Sun feel like this is *his* app too — not just a read-only view of his girlfriend's cycle.

---

*David Lim | Relationship Tech Advisor | March 2026*
