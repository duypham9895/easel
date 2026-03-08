# UPT_20260308_001 -- Phase 8: Product Recommendations

**Session:** UPT_20260308_001
**Phase:** 8 of 9 (User Persona Testing Pipeline)
**Date:** 2026-03-08
**Author:** Senior Product Manager (Phase 8 Agent)
**Input:** Phases 0-6 (Setup, Linh Onboarding, Minh Onboarding, Daily Usage, Emotional Scenarios, Friction Log, Persona Debrief)
**App Version:** v1.5.1

---

## A. Executive Summary

### Overall UX Assessment: **Needs Work**

The concept is validated. The execution has critical gaps that will cause churn within 60 days if unaddressed.

Easel has achieved something genuinely novel: a couples period tracking app where both partners derive value from the same biological data. The Moon/Sun metaphor, the Whisper and SOS signal system, and the phase-aware partner advice are innovations no competitor offers. The Vietnamese localization is near-native quality (9/10). The visual design -- particularly the Phase Wheel and the Sun amber theme -- is emotionally resonant.

However, the app has 11 critical friction points and 14 high-severity issues concentrated in three areas: (1) the notification system is nearly non-functional for Sun, (2) the period confirmation flow does not exist, and (3) the Whisper signal system lacks delivery confirmation. These are not nice-to-haves -- they are the connective tissue of a couples app, and without them, the bridge between Moon and Sun is unreliable.

### Did the app deliver on its core promise for couples?

Partially. Four concrete relationship-improving moments occurred during the 30-day simulation (snack purchase on Day 17, heartfelt message on Day 19, SOS cramps response on Day 20, surprise date on Day 25). One preventable argument still happened (Day 18) because the app's advice was available but not delivered via push notification. The app proves the concept works when information reaches Sun at the right time. It fails when Sun must pull information himself.

### Top 3 Things Working Well

1. **The Whisper feature is a breakthrough interaction pattern.** Both personas independently named it as the app's most emotionally resonant feature. Linh said: "Whisper gave me a vocabulary for needs I couldn't articulate." The two-tap signal ("Kind words") replaced a paragraph of vulnerable text messaging. The Day 19 Whisper led to a heartfelt response that both personas described as the app's defining moment. (Evidence: Phase 6, Q3 Joint Interview; Phase 4, Scenario F; Delight moments D8, D14)

2. **The Moon/Sun metaphor and Vietnamese localization create genuine emotional resonance.** Role selection was rated 5/5 by Linh. Vietnamese intimate pronouns ("Em"/"Anh"), the "thi tham" (whisper) language, and empathetic phase descriptions ("Your body is working very hard") read as native, not translated. Minh's amber/cream Sun theme eliminated "girl's app" perception once he left the splash screen. (Evidence: Phase 1, Section 3; Phase 2, Step 4; Delight moments D1, D5, D6, D12, D15)

3. **Immediate value delivery during onboarding sets Easel apart from competitors.** Linh received a cycle prediction within 3 minutes of signup with zero historical data required. The "Not sure" toggle with "Khong sao!" (No worries!) reassurance, the privacy education screen, and the instant prediction preview together form the strongest onboarding flow in the period tracking category. (Evidence: Phase 1, Sections 4a-4c; Delight moments D3, D4)

### Top 3 Things That Must Change Before Next Release

1. **The period confirmation flow does not exist, and the cycle calculator wraps unsafely.** When Linh's period was 5 days late, the app silently advanced to Day 5 of a phantom new cycle via modulo arithmetic (`dayInCycle = (diffDays % avgCycleLength) + 1`). It showed menstrual phase content while she had not started bleeding. Minh received wrong phase data and gave inappropriate support. This is the single most trust-damaging behavior in the app. (Evidence: Phase 4, Scenario C; Friction #26, #27, #28; Phase 6, Linh Q1, Q3, Q5)

2. **Sun receives only 3 push notifications per 28-day cycle, creating a 14/30 engagement rate.** Minh opened the app 14 times in 30 days, with 57% of opens triggered externally (notifications or Linh prompting). Days 1-6 had zero engagement. The app has no daily advice push, no phase-change notifications, no re-engagement nudges, and no check-in reminders for Moon. Minh explicitly stated: "If the app stops sending me notifications, I delete it." (Evidence: Phase 3, Days 1-7; Phase 6, Minh Q5, Q6, Q8; Friction #19, #20, #31, #37)

3. **Whisper signals vanish after 5 minutes with no delivery confirmation.** Moon sees "He will know what to do" after sending a Whisper, but has no way to verify Sun received it. The 5-minute auto-clear timer deletes whispers even if Sun never opened the app. Linh described this as "whispering into the void." This undermines the app's best feature and erodes trust in the signal system. (Evidence: Phase 4, Scenario H; Friction #30, #32, #45; Phase 6, Linh Q1, Minh Q5)

### One-Sentence Verdict

> Linh and Minh would keep using this app for one more cycle, but Minh will churn within 60 days without daily push notifications, and Linh's trust will break the first time her period is late -- both fixable within two sprints.

---

## B. Prioritized Issue List

| Priority | Issue ID | Issue Summary | Impact | Effort | Route To | Sprint |
|----------|----------|---------------|--------|--------|----------|--------|
| P0 | ISS-001 | Period confirmation flow missing -- cycle calculator wraps via modulo, creating phantom phases | Trust-breaking: wrong phase shown to both users when period is late | M | Engineering | 1 |
| P0 | ISS-002 | No late-period detection or supportive content | User abandoned during most anxious health moment | M | Engineering + Copy | 1 |
| P0 | ISS-003 | Sun receives only 3 notifications/cycle -- no daily advice push, no phase-change push | Sun engagement 14/30; explicit churn threat | M | Engineering (Edge Functions) | 1 |
| P0 | ISS-004 | Sun does not receive real-time cycle updates (no Realtime subscription on cycle_settings) | Stale data = wrong phase = wrong advice for Sun | S | Engineering | 1 |
| P0 | ISS-005 | Whisper delivery/read confirmation missing; 5-min auto-clear too aggressive | Moon whispers into void; trust erosion | M | Engineering | 1 |
| P0 | ISS-006 | No proactive luteal/PMS push notification for Sun | App has info to prevent arguments but fails to deliver | S | Engineering (Edge Functions) | 1 |
| P1 | ISS-007 | No daily check-in reminder for Moon | Habit loop breaks during first week (Days 3-4 gap) | S | Engineering | 1 |
| P1 | ISS-008 | Push notification text hardcoded in English (Edge Functions + SOS constants) | Breaks immersion for Vietnamese users | S | Engineering + i18n | 1 |
| P1 | ISS-009 | Sun calendar tab is empty placeholder despite cycle data being available | Forward planning impossible; top Sun request | M | Engineering | 2 |
| P1 | ISS-010 | No "What your partner sees" explainer before code sharing or in Settings | Top privacy concern for Moon; caused self-censoring | S | Design + Copy | 1 |
| P1 | ISS-011 | No cycle transition acknowledgment (banner/celebration on Day 1) | Most important body event treated like a form field | S | Engineering + Copy | 2 |
| P1 | ISS-012 | No "period started" push notification to Sun | Sun misses the most critical cycle transition | S | Engineering (Edge Functions) | 1 |
| P1 | ISS-013 | No post-conflict/emotional repair Whisper options | Whisper vocabulary covers soft moments but not relationship repair | S | Copy + Engineering | 2 |
| P1 | ISS-014 | No "share my status" shareable card from Moon | Awkward screen-sharing due to second-person framing | M | Design + Engineering | 2 |
| P1 | ISS-015 | Tab bar uses white (#FFFFFF) on Moon dark theme -- harsh visual break | Jarring; feels unfinished | S | Engineering | 1 |
| P1 | ISS-016 | SOS lacks "add a note" for specific requests | "Cramps Alert" tells Sun about pain but not what to bring | S | Engineering | 2 |
| P2 | ISS-017 | No Sun engagement nudges after 48h inactivity | 6-day zero-open streaks at start; silent dropout | S | Engineering (Edge Functions) | 2 |
| P2 | ISS-018 | Tab bar active tint pink for Sun users -- should be amber | Pink leaks into Sun's space | S | Engineering | 1 |
| P2 | ISS-019 | AI insights repetitive during long phases (12-day luteal) | Engagement fatigue; Linh stopped reading by Day 7 | M | Proxy/Prompts | 2 |
| P2 | ISS-020 | "How does this work?" / "Hide" / "Done" / "Open Settings" hardcoded English | i18n breaks in CycleDataReview, ManualCycleInput, PermissionDenied | S | Engineering | 1 |
| P2 | ISS-021 | No display name prompt during onboarding -- greeting defaults to "Sun" | Impersonal first impression for Sun | S | Engineering | 2 |
| P2 | ISS-022 | Conception chance prominently displayed on Moon dashboard | Awkward when casually showing screen to partner | S | Design | 2 |
| P2 | ISS-023 | Calendar card uses light theme on dark Moon page; Settings entirely light | Inconsistent with Moon dark theme | M | Engineering | 2 |
| P2 | ISS-024 | No whisper history for Moon | Cannot reflect on patterns over time | S | Engineering | 3 |
| P2 | ISS-025 | Splash screen has no branding and uses light theme regardless of system dark mode | White flash in dark room; first impression is bare | S | Engineering | 3 |
| P2 | ISS-026 | "AI" label visible in user-facing UI, violating "No AI terminology" rule | Product rule inconsistency | S | Engineering | 1 |
| P2 | ISS-027 | No conversation prompts tied to phase | App is reference tool, not conversation starter | S | Copy + Engineering | 3 |
| P2 | ISS-028 | Only 8 symptom options (Flo has 50+) | Tracking depth gap vs. competitors | S | Engineering + Copy | 3 |
| Low | ISS-029 | "SOS" label may overpromise urgency vs. comfort-level options | Slight label/severity mismatch | S | Copy | 3 |
| Low | ISS-030 | No Apple/Google sign-in | Standard but adds auth friction | M | Engineering | 3 |
| Low | ISS-031 | App name "Easel" gives no indication of purpose | Affects cold organic discovery | N/A | Marketing | Ongoing |
| Low | ISS-032 | Medical phase names ("Hoang the", "Nang truong") unfamiliar to young Vietnamese | Compensated by taglines; tooltip would help | S | Copy | 3 |

**Legend:** Impact = trust-breaking / churn-causing / quality-of-life. Effort: S = Small (<1 day), M = Medium (1-3 days), L = Large (3+ days). Sprint 1 = immediate, Sprint 2 = next cycle, Sprint 3 = backlog.

---

## C. Relationship Value Assessment

### Did the app improve the couple's dynamic?

**Yes, measurably.** Four concrete relationship-positive moments occurred that both personas attribute directly to the app:

1. **Day 17:** Period-approaching notification prompted Minh to buy Linh's favorite snacks proactively. She was surprised and delighted. He looked thoughtful without needing to explain. (Notification-driven)
2. **Day 19:** Linh sent a "Kind words" Whisper. Minh sent a heartfelt message. Both described this as the app's emotional peak. Linh said she would never have texted the equivalent. (Whisper-driven)
3. **Day 20:** SOS cramps alert reached Minh in a meeting. He left early with ibuprofen and ginger tea. Compressed a 6-hour information gap into 2 minutes. (SOS-driven)
4. **Day 25:** Minh planned a surprise date during follicular phase based on "Plan a date! She's in an adventurous mood" advice. Linh was delighted and had no idea the app prompted it. (Advice-driven)

One preventable negative moment: Day 18 argument during luteal phase. The app had the right advice ("avoid arguments") but Minh read it at lunch and forgot by evening. No push reminder delivered it at the critical time.

**Joint verdict:** Both personas independently said the app made the relationship "net positive." They now use "I'm in luteal" as shared vocabulary, replacing "why are you being so moody?" conversations.

### Is Sun experience strong enough to retain both users?

**Not yet.** Minh's 14/30 engagement rate and NPS of 5-6 (Passive/Detractor boundary) indicate the Sun experience is insufficient for independent retention. His explicit statement: "If the app stops sending me notifications, I delete it." Linh confirmed: "If Minh stopped using the app, I would probably stop within a month."

The Sun experience is a read-only dashboard with no interactive elements, an empty calendar tab, and 3 notifications per cycle. Minh described it as: "You gave Moon a garden and gave Sun a window to look at it through."

**Critical dependency:** Linh's retention is contingent on Minh's retention. Minh's retention is contingent on notifications. Therefore, the notification system is the single highest-leverage retention investment.

### Biggest missed opportunity for the relationship angle

**No "phase forecast" for planning together.** The most relationship-enhancing Sun use case -- "When should I plan a date?" or "Is next weekend a good time for a trip?" -- is currently impossible because Sun has no calendar view and no "coming up" section on the dashboard. Minh had to do mental arithmetic (countdown badge + period length) to reverse-engineer dates. A "Best days for plans" indicator would transform the app from reactive (respond to current phase) to proactive (plan around future phases).

### Any unintended relationship tension?

Two sources of tension surfaced:

1. **Whisper void:** Linh sent whispers that Minh never confirmed receiving. When she asked "Are you even checking the app?" it created a low-grade trust issue. The app promised "He will know what to do" but couldn't guarantee delivery.

2. **Self-censoring:** For the first two weeks, Linh did not know what data Minh could see. She logged mood 3 when it was really mood 1, fearing he would see her scores. The lack of a "what your partner sees" disclosure caused her to self-censor honest tracking data.

Neither tension was severe enough to damage the relationship, but both erode the app's core value proposition: honest tracking that bridges understanding.

### Relationship Value Score: **7/10**

**Reasoning:** The concept is a 10. Four genuine relationship-improving moments in 30 days is remarkable for any app. But the execution gaps (whisper void, no notifications for Sun, no data visibility disclosure) mean the relationship value is inconsistent. On days when the signal system works (notification arrives, Minh acts), the score is 10. On days when it fails (Minh doesn't check, whisper disappears, phantom phase shows wrong data), the score drops to 4. The average is 7, pulled down by preventable delivery failures.

---

## D. Retention Risk Assessment

### When is each persona most likely to stop using?

| Persona | Churn Window | Trigger | Probability |
|---------|-------------|---------|-------------|
| Minh (Sun) | Days 60-90 | Notification fatigue from English-only, low-frequency pushes; no daily advice creates multi-day usage gaps; app becomes invisible during non-crisis phases | HIGH (70% churn if no changes) |
| Linh (Moon) | Days 30-60 after Minh churns | Once Minh stops, Whisper/SOS signals go unanswered; Easel becomes a bare-bones solo tracker inferior to Flo; she switches back | HIGH (80% churn within 30 days of Minh leaving) |
| Linh (Moon) independently | First late period (~Cycle 3-4) | Phantom phase wrapping breaks trust; app shows wrong phase while she is anxious; she switches to Flo permanently | MEDIUM (50% churn on first late period event) |

### What would bring them back?

| Persona | Re-engagement Hook |
|---------|-------------------|
| Minh | A daily 6 PM push notification with phase-aware advice (his explicit #1 request). If this single feature were added and he received it for 3 consecutive days, he would re-engage. |
| Linh | Period confirmation flow that asks "Has your period started?" near the expected date. This signals the app is paying attention to her specifically, not just running calculations. Combined with Vietnamese push notifications. |

### Clear "aha moment" for each persona?

| Persona | Aha Moment | When | Evidence |
|---------|------------|------|----------|
| Linh | Instant prediction preview during onboarding ("Oh, this is actually useful -- I can plan around this") | ~3 minutes after signup | Phase 1, Section 4b |
| Minh | UnlinkedScreen benefit cards ("Never be caught off guard" / "Know what to do, every day") | During onboarding, before linking | Phase 2, Step 5 |
| Minh (reinforced) | Day 17 period-approaching notification leading to snack purchase | Week 3 | Phase 3, Day 17; Phase 6, Minh Q2 |

**Problem:** Minh's first reinforced aha moment takes 17 days. That is far too long. Without the Day 7 dashboard check (triggered by Linh mentioning the app), he might have churned before Day 17.

### 30-Day Retention Prediction (with current build)

| Metric | Linh (Moon) | Minh (Sun) |
|--------|-------------|------------|
| 30-day retention | 75% | 45% |
| 60-day retention | 55% | 20% |
| 90-day retention | 40% | 10% |

**With Sprint 1 fixes (notifications + period confirmation):**

| Metric | Linh (Moon) | Minh (Sun) |
|--------|-------------|------------|
| 30-day retention | 90% | 80% |
| 60-day retention | 80% | 65% |
| 90-day retention | 70% | 55% |

---

## E. Competitive Positioning

### How does Easel compare to Flo/Clue?

| Dimension | Easel | Flo | Clue |
|-----------|-------|-----|------|
| **Core differentiator** | Couples bridge (Moon/Sun) | Solo tracking + community | Solo tracking + science focus |
| **Partner features** | Whisper, SOS, phase-aware advice, shared status | Partner mode (basic view sharing) | None |
| **Emotional tone** | Warm, intimate ("Your body is working very hard") | Medical with pink paint | Science textbook |
| **Localization (Vietnamese)** | 9/10 (near-native quality) | 5/10 (Google Translate level per Linh) | Not available |
| **Symptom tracking depth** | 8 options | 50+ options | 30+ options |
| **Cycle analytics** | None | Charts, trends, accuracy metrics | Charts, trends, export |
| **Check-in reminders** | None | Daily push | Daily push |
| **Onboarding speed to value** | ~3 min (instant prediction) | ~5 min (requires 3 cycles for accuracy) | ~5 min |
| **Calendar** | Moon: good, Sun: empty | Full featured | Full featured |
| **Community/education** | None | Forums, articles, courses | Articles |
| **AI personalization** | Phase-aware greetings + daily insights | Flo Assistant (LLM-powered) | None |

### What does Easel do that competitors don't?

1. **Couples signal system (Whisper + SOS):** No competitor has a mechanism for Moon to send contextual, low-effort emotional signals to a partner. This is Easel's moat.
2. **Phase-aware partner coaching:** Sun receives daily advice tailored to Moon's exact cycle day. Flo's partner mode shares data but does not coach the partner on what to do.
3. **Cultural authenticity for Vietnamese couples:** The "Em"/"Anh" pronouns, intimate Vietnamese copy, and Moon/Sun metaphor create emotional resonance that localized Western apps cannot match.
4. **Immediate prediction without historical data:** Easel delivers a cycle prediction from three manual inputs during onboarding. Flo requires multiple logged cycles for accuracy.

### Where are competitors still better?

1. **Tracking depth:** Flo's 50+ symptoms vs. Easel's 8. Linh explicitly noted missing "acne" and "insomnia" options.
2. **Cycle analytics:** Neither Flo nor Clue leave users without mood trends, cycle length tracking, or prediction accuracy metrics. Easel has none.
3. **Retention mechanics:** Both competitors have daily check-in reminders, streak tracking, and rich content libraries. Easel has zero proactive re-engagement.
4. **Period logging UX:** Both competitors offer prominent "Period started" buttons on their main screens. Easel buries this in a Settings date picker.
5. **Educational content:** Flo has articles, courses, and community forums. Easel has only phase descriptions.

### Positioning recommendation

Easel should not compete with Flo/Clue on solo tracking depth. Instead, own the "couples cycle intelligence" category. The tagline should be: **"The period tracker your boyfriend actually uses."** Invest in what competitors cannot easily replicate: the signal system, partner coaching, and couples-specific features. Bring solo tracking to "good enough" parity (reminders, period button, 15-20 symptoms) without trying to match Flo's depth.

---

## F. Recommended Next Sprint

### Top 5 Issues to Fix/Build First

| Rank | Issue | Rationale |
|------|-------|-----------|
| 1 | **Period confirmation flow + late-period detection** (ISS-001, ISS-002) | Trust-breaking when wrong. Affects both users simultaneously. The modulo wrapping is a ticking time bomb that will detonate on every user's first irregular cycle. Requires: dashboard "Period Started?" prompt near expected date, cycle calculator clamping instead of wrapping, late-period supportive content. |
| 2 | **Sun notification system** (ISS-003, ISS-006, ISS-012) | Minh's 14/30 engagement is entirely caused by notification absence. Adding daily phase-aware push (6 PM), phase-change notifications (4/cycle), and "period started" notification would likely double Sun engagement. This is the single highest-ROI feature for retention. Minh said: "Fix this one thing and I'm a loyal daily user." |
| 3 | **Moon daily check-in reminder** (ISS-007) | Linh missed Days 3-4 entirely with no re-engagement. A single 9 PM push ("How was your day? Tap to log") prevents habit-loop breaks during the critical first two weeks. Low effort, high impact on data quality and engagement. |
| 4 | **Push notification i18n** (ISS-008) | Every notification arrives in English for Vietnamese users. The Edge Functions (`notify-cycle`, `notify-sos`) have hardcoded English strings. The SOS alert title on Sun's dashboard uses English constants. Quick fix: pass user language preference to Edge Functions, add Vietnamese string variants. |
| 5 | **Whisper delivery confirmation + extended persistence** (ISS-005) | Extend whisper TTL from 5 minutes to 24 hours. Add delivery/read status visible to Moon. Change success text from "He will know what to do" (promise) to "Whisper sent" (factual) + "Delivered" / "Seen" updates. This fixes the trust erosion around the app's best feature. |

### One "Quick Win" That Can Ship This Week

**Fix hardcoded English strings in i18n (ISS-020).**

Four locations with hardcoded English in an otherwise excellent Vietnamese flow:
- `CycleDataReview.tsx` lines 131-133: "How does this work?" / "Hide" -- replace with `t('howDoesThisWork')` / `t('hide')`
- `ManualCycleInput.tsx` line 152: "Done" -- replace with `t('done')`
- `PermissionDeniedScreen` line 58: "Open Settings" -- replace with `t('openSettings')`
- Remove/hide the "AI" label from greeting and guide card titles (ISS-026)

Combined with tab bar theming fix (ISS-015, ISS-018): apply `MoonColors.card` for Moon users and `SunColors` active tint for Sun users in `_layout.tsx`.

Estimated effort: 2-4 hours. Immediate perception improvement for Vietnamese users and visual consistency.

### One "Strategic Investment" That Pays Off Over Time

**Build the Sun calendar view with phase forecast (ISS-009).**

The calendar tab is currently dead space for Sun users. Building a real calendar showing Moon's predicted periods, phase transitions, fertile windows, and "best days for plans" markers would:

1. Give Sun a reason to open the app beyond notifications (forward planning use case)
2. Enable the "surprise date" behavior (Day 25) to become repeatable without mental math
3. Create a natural conversation starter between the couple ("Let's look at the calendar for our vacation")
4. Differentiate further from Flo's basic partner mode (which shares current data but not future forecasts)

The data is already available (`partnerCycleSettings`). The Moon calendar component already exists and can be adapted. Estimated effort: 3-5 days. Long-term impact: transforms Sun from a reactive "check today's phase" experience into a proactive planning tool.

---

## G. Persona-Specific Action Items

| For Linh (Moon Experience) | For Minh (Sun Experience) |
|---|---|
| **Sprint 1** | **Sprint 1** |
| Add "Period Started?" prompt on dashboard near expected date (ISS-001) | Add daily phase-aware push notification at 6 PM (ISS-003) |
| Add late-period detection with supportive content when cycle > expected + 2 days (ISS-002) | Add phase-change push notifications (4 per cycle) (ISS-003) |
| Add daily check-in reminder at 9 PM (ISS-007) | Add "period started" push notification when Moon logs new cycle (ISS-012) |
| Fix push notification i18n -- Vietnamese text for Vietnamese users (ISS-008) | Add Realtime subscription on cycle_settings for live updates (ISS-004) |
| Add "What your partner sees" disclosure before code sharing (ISS-010) | Add proactive luteal/PMS evening push notification (ISS-006) |
| Fix tab bar to use Moon dark theme (ISS-015) | Fix tab bar active tint to amber for Sun role (ISS-018) |
| Fix hardcoded English strings in onboarding (ISS-020) | Fix push notification i18n (ISS-008) |
| Remove "AI" label from user-facing UI (ISS-026) | Remove "AI" label from guide card titles (ISS-026) |
| **Sprint 2** | **Sprint 2** |
| Add cycle transition celebration ("New Cycle - Day 1!") (ISS-011) | Build Sun calendar view with predicted phases (ISS-009) |
| Add post-conflict whisper options ("I need you to understand") (ISS-013) | Add "add a note" field to SOS signals (ISS-016) |
| Add shareable status card for showing partner (ISS-014) | Add display name prompt during onboarding (ISS-021) |
| Make conception chance expandable/hideable (ISS-022) | Add 48h inactivity re-engagement nudge (ISS-017) |
| Apply Moon dark theme to calendar and settings (ISS-023) | |
| **Sprint 3** | **Sprint 3** |
| Add whisper history (ISS-024) | Add conversation prompts tied to phase (ISS-027) |
| Add more symptom options (15-20 minimum) (ISS-028) | |
| Improve AI insight variety during long phases (ISS-019) | |
| Dark mode splash screen (ISS-025) | |

---

## Appendix: Key Metrics Summary

| Metric | Linh (Moon) | Minh (Sun) |
|--------|-------------|------------|
| Days active (out of 30) | 25 | 14 |
| Overall rating | 3.5/5 | 3/5 |
| NPS | 7 (Passive) | 5-6 (Passive/Detractor) |
| Would recommend | Yes, with caveats | Yes, to the right friend |
| Would keep using (3 months) | Yes, if core bugs fixed | Only if daily notifications added |
| Most valued feature | Whisper | Period-approaching notification |
| Would delete if... | Minh stops using | Notifications stop coming |
| Time to first value | ~3 min (onboarding prediction) | ~7 days (first advice-prompted action) |
| Friction moments experienced | 33 (of 50 total) | 29 (of 50 total) |
| Critical friction | 3 unique to Moon | 5 unique to Sun |
| Delight moments | 10 | 7 |

### Friction Distribution

| Severity | Count |
|----------|-------|
| Critical | 11 |
| High | 14 |
| Medium | 15 |
| Low | 7 |
| **Total** | **47** |

| Category | Count | Critical |
|----------|-------|----------|
| Notification | 8 | 4 |
| Value Gap | 10 | 1 |
| Trust Erosion | 5 | 3 |
| Emotional Miss | 5 | 2 |
| Design | 5 | 0 |
| Language | 5 | 0 |
| Privacy | 3 | 0 |
| Navigation | 3 | 1 |
| Cognitive Load | 3 | 0 |
| Terminology | 3 | 0 |

### Emotional Safety

10 emotional safety risks identified. 5 are currently active (phantom phase wrapping, whisper void, cold period logging UX, repetitive low-mood insights, no data visibility disclosure). None have caused relationship damage yet, but the phantom phase wrapping (ES1) and whisper void (ES2) are the most likely to cause real harm in ongoing usage.

---

*Generated by Phase 8 Agent (Senior Product Manager) for session UPT_20260308_001.*
*Input sources: 7 documents spanning 6 pipeline phases, ~180 pages of persona simulation data.*
