# UPT_20260308_001 -- Phase 5: Friction Log

**Session:** UPT_20260308_001
**Phase:** 5 of 9 (User Persona Testing Pipeline)
**Date:** 2026-03-08
**Synthesized from:** Phases 1-4 (Linh Onboarding, Minh Onboarding, 30-Day Usage, Emotional Scenarios)
**Personas:** Linh (Moon, 26, graphic designer) & Minh (Sun, 28, software sales)

---

## Complete Friction Log

### Legend

- **Severity:** Critical / High / Medium / Low
- **Categories:** Terminology, Navigation, Cognitive Load, Emotional Miss, Trust Erosion, Value Gap, Design, Notification, Language, Privacy

---

| # | Who | Phase | Where in App | What Happened | Emotional Reaction | Severity | Category |
|---|-----|-------|-------------|---------------|-------------------|----------|----------|
| 1 | Both | 1, 2 | Splash screen (index.tsx) | White background (#FBFBFD) with pink spinner flashes in dark room. No branding, no logo, no dark mode detection. Linh was blinded in bed; Minh perceived it as "a girl's app" before even choosing a role. | Linh: squinting, disappointed. Minh: "this is a girl's app" suspicion. | Medium | Design |
| 2 | Both | 1, 2 | Splash screen (index.tsx) | Pink spinner (#FF5F7E) uses menstrual color before role is known. First visual cue is coded feminine, alienating Sun users before they see their amber theme. | Minh: masculinity discomfort. Linh: neutral but no delight. | Medium | Design |
| 3 | Both | 1, 2 | Auth screen (auth.tsx) | Email-only auth with mandatory email verification. No Apple/Google sign-in. Requires context-switch to email app and back. | Mild annoyance; standard but adds friction at the most fragile moment. | Low | Navigation |
| 4 | Linh | 1 | Auth screen (auth.tsx) | Password minimum is 6 characters but this is never shown. Disabled button at opacity 0.4 is nearly invisible at low brightness. | Confusion about why button won't activate. | Low | Cognitive Load |
| 5 | Linh | 1 | CycleDataReview.tsx (lines 131-133) | "How does this work?" and "Hide" toggle text hardcoded in English, not passed through `t()`. Vietnamese user sees English mid-flow. | Jarring language break in otherwise excellent Vietnamese flow. | High | Language |
| 6 | Linh | 1 | ManualCycleInput.tsx (line 152) | "Done" button on iOS date picker spinner hardcoded in English instead of "Xong". | Minor but noticeable language inconsistency. | Low | Language |
| 7 | Linh | 1 | Tab bar (_layout.tsx) | Tab bar background uses white (#FFFFFF / Colors.card) while Moon dashboard uses dark indigo (#0D1B2A). Creates a harsh white strip at the bottom of an otherwise beautiful dark UI. | Jarring visual break; feels unfinished. | High | Design |
| 8 | Minh | 2 | Tab bar (_layout.tsx) | Tab bar active tint uses pink (Colors.menstrual #FF5F7E) even for Sun users. Should be amber (#F59E0B) for Sun role. | Feels like the app forgot he exists; pink leaks into his space. | Medium | Design |
| 9 | Both | 1, 2, 3 | Dashboard greeting + Guide cards | "AI" label (sparkle + text) shown in user-facing UI. Violates product design rule: "No AI terminology in UI." Sun dashboard shows "Cach the hien AI" title. | Linh: confused about what "AI" means here. Minh: doesn't care but it's a rule violation. | Medium | Terminology |
| 10 | Linh | 1 | Dashboard invite banner | "Chia se ma voi Sun de ket noi" banner provides no explanation of what the partner will see when linked. Privacy concern goes unanswered. | Anxiety: "Will he see my mood? My symptoms? Everything?" | High | Privacy |
| 11 | Linh | 1 | Settings screen | No "What your partner sees" explanation anywhere -- not in settings, not before the share code, not as an FAQ. | Lingering privacy doubt throughout entire usage period. | High | Privacy |
| 12 | Linh | 1 | Calendar + Settings | Calendar card background uses light theme Colors.card (#FFFFFF) on dark Moon page. Settings screen uses light theme entirely. Inconsistent with Moon dark theme. | Jarring aesthetic break when navigating between tabs. | Medium | Design |
| 13 | Linh | 1 | Dashboard phase names | "Hoang the" (Luteal) and "Nang truong" (Follicular) are medical Vietnamese terms most young women don't use casually. | Slight cognitive load; taglines compensate but terms feel clinical. | Low | Terminology |
| 14 | Minh | 2 | Onboarding flow | No notification permission context screen. Sun's core features (Whisper, SOS) depend on push notifications, but no explanation given before iOS permission prompt. | Risk of denying notifications and breaking the app's core value. | Critical | Notification |
| 15 | Minh | 2 | Calendar tab (calendar.tsx) | Calendar tab shows static placeholder card for Sun users even when cycle data is available. No actual calendar despite `partnerCycleSettings` being populated. | Disappointment: "Is this feature broken?" | High | Value Gap |
| 16 | Minh | 2 | Onboarding + Dashboard | No display name prompt during onboarding. Dashboard greeting defaults to "Chao, Sun" instead of "Chao, Minh." Impersonal from minute one. | Feels generic, not personal. | Medium | Cognitive Load |
| 17 | Minh | 2 | Invite flow (partner.json) | Share message links to website URL, not App Store deep link. App name "Easel" gives no indication of purpose. | Minh Googled "Easel app" and got nothing relevant. | Low | Navigation |
| 18 | Both | 3 | Entire app | No daily check-in reminder notification for Moon. Linh missed Days 3-4 entirely with no re-engagement mechanism. Phase silently changed without her knowing. | Linh: guilt when she remembered. Habit loop broken during critical first week. | Critical | Notification |
| 19 | Minh | 3 | Entire app | No phase-change notifications for Sun. Ovulatory-to-luteal transition (most important for relationship) happened silently. Minh was blind for 3+ days. | Minh: oblivious during the shift that matters most. | Critical | Notification |
| 20 | Minh | 3 | Entire app | No daily advice push notification for Sun. 6-day zero-open streak at the start (Days 1-6). App is entirely pull-based for Sun with no proactive value delivery. | Minh almost forgot the app existed. Considered it useless around Day 5-6. | Critical | Value Gap |
| 21 | Both | 3 | Push notifications (Edge Functions) | Push notification text hardcoded in English in `notify-cycle` and `notify-sos` Edge Functions. Vietnamese users receive "Your period is coming" and "Moon needs kind words" in English. | Jarring, breaks immersion. Feels like the developers forgot about localization. | High | Language |
| 22 | Minh | 3 | SOS alert card (SunDashboard) | SOS alert title uses English constants directly ("She needs: Cramps Alert") instead of i18n-translated Vietnamese strings. | Inconsistent with the otherwise good Vietnamese UI. | High | Language |
| 23 | Linh | 3 | Dashboard daily insight | AI insights become repetitive during the 12-day luteal phase. Variations of "luteal phase means sensitivity, be gentle" cycle with limited variety. | Engagement drops; logging feels like documenting misery. Skips reading insights. | Medium | Value Gap |
| 24 | Linh | 3 | Entire app | No mechanism for Moon to confirm/correct actual period start date from the dashboard. Only way is to edit a date picker buried in Settings. | Feels anticlimactic; most important body event treated like a form field. | Critical | Emotional Miss |
| 25 | Minh | 3 | SunDashboard | Sun dashboard is entirely read-only. No interactive features beyond reading cards. Zero engagement hooks beyond receiving signals. | "I can only read" -- feels passive, not participatory. | Medium | Value Gap |
| 26 | Both | 4 (Scenario C) | cycleCalculator.ts (line 19) | Cycle calculator uses modulo wrapping: `(diffDays % avgCycleLength) + 1`. When period is 5 days late, app wraps to Day 5 of phantom new cycle. Shows menstrual phase content while user hasn't started bleeding. | Trust-breaking. App confidently shows wrong phase. Linh is scared (late period) and app is oblivious. Minh gives wrong support based on wrong data. | Critical | Trust Erosion |
| 27 | Both | 4 (Scenario C) | Entire app | No late-period detection. No supportive content when cycle exceeds expected length. No notification like "Your period seems late." | Linh feels abandoned during most anxious moment. App cheerfully discusses menstrual self-care while she's staring at a pregnancy test. | Critical | Emotional Miss |
| 28 | Linh | 4 (Scenario I) | Settings screen | "Period Started" action is buried as a date picker in Settings > Cycle Settings. No prominent CTA on dashboard. No ritual acknowledgment. | Most important recurring action has worst UX. Feels clinical, not supportive. | Critical | Navigation |
| 29 | Minh | 4 (Scenario I) | Store + Realtime | Sun doesn't receive real-time cycle updates when Moon changes her period start date. No Realtime subscription on `cycle_settings` table. `partnerCycleSettings` remains stale until app restart. | Minh sees wrong phase, gives wrong support. Stale data = wrong advice. | Critical | Trust Erosion |
| 30 | Both | 4 (Scenario H) | Whisper system (appStore.ts) | Whispers have no delivery/read confirmation. Moon sees "He will know what to do" but has no way to verify Minh received it. Auto-clear timer (5 min) deletes whisper even if never seen. | Linh feels she's whispering into the void. Promise of "he will know" is broken if he doesn't open the app. | Critical | Trust Erosion |
| 31 | Minh | 4 (Scenario A) | Entire app | No proactive luteal/PMS push notification for Sun. App has the information to prevent arguments ("avoid arguments during luteal") but only delivers it if Sun opens the app. | Preventable argument happened. Minh read the advice AFTER the fight and felt guilty. The app was right but too late. | Critical | Notification |
| 32 | Minh | 4 (Scenario H) | Whisper system (appStore.ts) | Whisper auto-clear at 5 minutes is too aggressive. If Minh opens the app 2 hours after a whisper, it's already gone. Whispers disappear before Sun ever sees them. | Missed signals. Moon's emotional expression is lost. | High | Value Gap |
| 33 | Minh | 4 (Scenario B) | Sun dashboard + Calendar | No phase forecast on Sun dashboard. No "Coming up" section showing when follicular starts. Minh has to do mental math (countdown + period length) to plan dates. | Frustrating: "I shouldn't have to do math." Defeats the app's promise of easy understanding. | High | Value Gap |
| 34 | Linh | 4 (Scenario A) | WhisperSheet | No post-conflict or emotional repair Whisper options. Luteal options ("snacks," "space," "cuddle," "kind words") are for soft moments, not relationship repair after arguments. | Linh wanted to signal "I'm sorry I snapped" or "I need you to understand" but couldn't. | High | Emotional Miss |
| 35 | Minh | 4 (Scenario I) | Entire app | No "period started" push notification to Sun. When Moon's new cycle begins, Sun has no proactive signal. Must open app to discover it. | Minh misses the most important cycle transition entirely unless he checks. | High | Notification |
| 36 | Linh | 4 (Scenario I) | Dashboard | No cycle transition acknowledgment (banner, modal, or celebration). Phase changes silently. No "New Cycle - Day 1" moment. No tracking streak recognition. | Period start feels like a database update, not a meaningful body event. | High | Emotional Miss |
| 37 | Minh | 4 (Scenario H) | Entire app | No Sun engagement nudges. If Sun hasn't opened the app in 48+ hours, no reminder push. Zero re-engagement mechanism. | Minh's 6-day zero-open streak at the start could have been prevented. | High | Notification |
| 38 | Linh | 4 (Scenario G) | SOSSheet | SOS lacks "add a note" field for specific requests. "Cramps Alert" tells Minh she's in pain but not what to bring. She has to follow up via text. | Partial solution: knows she's hurting but not what to do. Extra step needed. | High | Value Gap |
| 39 | Linh | 4 (Scenario E) | MoonDashboard | No "share my status" shareable card. Dashboard content uses second-person ("Ban" = you) which is awkward when showing screen to partner. | Showing the phone feels clunky. No digital sharing alternative. | High | Value Gap |
| 40 | Minh | 4 (Scenario C) | Entire app | No late-period signal to Sun. When Moon's period is significantly late, Sun remains oblivious. App actively misleads him with phantom phase data. | Minh is supportive in the wrong way during Moon's most anxious moment. | High | Emotional Miss |
| 41 | Linh | 3 | Dashboard + SOS | Unclear distinction between SOS and Whisper. Linh hesitated to use SOS during PMS (non-period cramps) because "SOS" implies emergency. "Cramps Alert" applies to PMS too but framing feels wrong. | Hesitation and second-guessing: "Is this serious enough for SOS?" | Medium | Cognitive Load |
| 42 | Linh | 4 (Scenario D) | MoonDashboard | Conception chance ("Kha nang thu thai: Thap/Trung binh/Rat cao") is prominently displayed on the main dashboard. Awkward when casually showing screen to partner. | Self-conscious about clinical fertility data being visible during screen-sharing. | Medium | Privacy |
| 43 | Both | 4 (Scenario E) | Entire app | No couple conversation prompts. App is a reference tool, not a conversation starter. No "Talk about this" section with phase-relevant questions. | App enables understanding but doesn't actively facilitate connection. | Medium | Value Gap |
| 44 | Linh | 4 (Scenario F) | Entire app | No whisper history. Linh can't see past whispers she's sent. No pattern reflection over time. | Can't look back and see "I send 'kind words' a lot during luteal." | Medium | Value Gap |
| 45 | Linh | 4 (Scenario F) | Whisper system | No whisper acknowledgment from Sun back to Moon. Minh taps "Got it" to dismiss but Linh never sees that he read it. Emotional loop stays open. | "Did he even see my whisper?" Uncertainty undermines the feature's emotional promise. | Medium | Trust Erosion |
| 46 | Both | 4 (Scenario G) | SOS naming | "SOS" label may overpromise urgency. Actual options are comfort needs (sweet tooth, hug, cramps, quiet time), not medical emergencies. | Slight mismatch between label severity and actual use case. | Low | Terminology |
| 47 | Both | 4 (Scenario H) | Entire app | No engagement indicator for Moon to see Sun's activity. No "last seen" or "last opened" signal. Moon invests daily (check-ins, whispers) with zero feedback that Sun is participating. | "Am I doing this alone?" feeling. Retention risk for Moon if she feels unheard. | Medium | Trust Erosion |
| 48 | Both | 3 | Dashboard + Guide cards | Content repetition during long phases. Both Linh and Minh experienced fatigue reading similar advice across the 12-day luteal and 5-day menstrual phases. Static fallback content has only 3 rotations per phase. | Boredom, disengagement. Logging feels like a chore. | Medium | Value Gap |
| 49 | Linh | 3 | Calendar tab | Calendar has no daily log visualization. Moon can't see mood/symptom patterns over time on the calendar. | Missed opportunity for self-reflection and pattern recognition. | Medium | Value Gap |
| 50 | Linh | 1 | PermissionDeniedScreen (line 58) | "Open Settings" link text hardcoded in English instead of Vietnamese. | Minor language break in otherwise localized screen. | Low | Language |

---

## Missing Moments

Things that SHOULD exist but don't. Ranked by emotional impact.

| # | Who | What's Missing | When It Would Matter | Emotional Impact |
|---|-----|---------------|---------------------|-----------------|
| M1 | Linh | **"Period Started" button on dashboard** | Late luteal / expected start date | Transforms the most important body event from a Settings field edit into a meaningful ritual |
| M2 | Minh | **Daily phase-aware push notification** (e.g., 6 PM: "Moon is in Luteal Day 27. Be extra gentle tonight.") | Every day, especially luteal | Would raise Minh's engagement from 14/30 to 25+/30 days. Prevents arguments. |
| M3 | Linh | **Daily check-in reminder** (e.g., 9 PM: "How was your day? Tap to log.") | Every day, especially during first two weeks | Prevents habit-loop breaks during critical early engagement window |
| M4 | Both | **Late-period detection and supportive content** | When cycle exceeds expected length by 2+ days | Most anxious health moment gets zero app support; trust-breaking |
| M5 | Both | **Period confirmation flow** (dashboard prompt: "Has your period started?") | Near predicted period start | Prevents phantom cycle wrapping; enables real data accuracy |
| M6 | Minh | **Phase-change push notification** (4 per cycle: menstrual/follicular/ovulatory/luteal transitions) | Each phase boundary | Most important information for Sun, currently invisible |
| M7 | Minh | **Sun calendar view** with predicted periods, phases, and "best days for plans" | Whenever he wants to plan ahead | Forward-looking planning is a top use case; currently impossible |
| M8 | Both | **Whisper delivery + read status** (Delivered / Seen / On it) | After every whisper | Closes the emotional loop; validates Moon's vulnerability |
| M9 | Both | **Cycle transition celebration** ("New Cycle - Day 1! You've been tracking for 2 cycles!") | Each new cycle start | Reinforces tracking habit, makes the moment feel significant |
| M10 | Minh | **Sun re-engagement nudge** (48h inactivity: "Moon is in [phase] -- check in on her") | After 2+ days without opening | Prevents silent dropout; 6-day zero-open streaks become impossible |
| M11 | Both | **Push notification i18n** (Vietnamese text for Vietnamese users) | Every push notification | Currently all English; breaks immersion for primary audience |
| M12 | Linh | **Notification permission primer screen for Sun** | During Sun onboarding, before iOS permission prompt | Context for why notifications matter prevents denial of critical permission |
| M13 | Linh | **Whisper history** (list of past whispers with dates) | Anytime, for reflection | Enables pattern recognition and validates ongoing emotional expression |
| M14 | Both | **"What your partner sees" explainer** | Before sharing partner code + in Settings | Addresses the #1 privacy concern for couples apps |
| M15 | Linh | **Post-conflict whisper options** ("I'm sorry I snapped," "I need you to understand") | After arguments during luteal phase | Current whisper vocabulary covers soft moments but not relationship repair |

---

## Delight Moments

Things that worked beautifully and should be preserved and amplified.

| # | Who | Phase | What Worked | Why It Delighted | Preserve/Amplify |
|---|-----|-------|------------|-----------------|-----------------|
| D1 | Linh | 1 | **Role selection screen** -- Moon/Sun metaphor with Vietnamese intimate pronouns ("Em"/"Anh"), "thi tham" (whisper) language | First moment of "this app understands me." Feels designed for Vietnamese couples, not translated. | Preserve exactly. This is the app's emotional hook. |
| D2 | Linh | 1 | **Health sync education screen** -- Three bullet points (read-only, on-device, disconnect anytime) with shield icon | Perfect privacy communication. Three fears, three answers. No guilt trip for choosing manual entry. | Amplify: use this same pattern for the missing "what your partner sees" explainer. |
| D3 | Linh | 1 | **"Khong sao!" (No worries!) toggle** on manual cycle input | The one phrase that made her relax about not knowing exact cycle numbers. Empathy in a checkbox. | Preserve. Consider more "Khong sao!" moments elsewhere (e.g., missed check-in days). |
| D4 | Linh | 1 | **Instant prediction preview** after entering 3 cycle data points | First Value Moment at ~3 minutes. "Oh, this is actually useful." No "complete 3 months first." | Preserve. Immediate value delivery is the app's competitive advantage over Flo/Clue. |
| D5 | Linh | 1 | **Phase Wheel animation** -- pulsating glow, phase colors, dark background at low brightness | "Ooh" moment. The centerpiece looks like jewelry. The screenshot she'd share with friends. | Preserve. This is the visual identity of the app. |
| D6 | Minh | 2 | **UnlinkedScreen benefit cards** -- "Never be caught off guard," "Know what to do, every day" | First Value Moment for Sun. Action-oriented copy that speaks to his pain points. Amber/cream theme feels masculine. | Preserve. This screen is the best sales pitch in the app. |
| D7 | Minh | 2 | **Partner linking flow** -- type 6 digits, haptic buzz, instant dashboard transition | Fastest, smoothest part of the entire flow. 10 seconds total. Celebratory haptic. | Preserve. Consider adding a brief "Connected!" celebration banner. |
| D8 | Both | 3 | **Day 19: Linh's first Whisper ("Kind words")** -> Minh receives push -> sends heartfelt message -> emotional reconnection | THE moment the app proves its value. Clear signal -> concrete action -> real emotional impact. Both users cried (good tears). | Amplify: this is the killer feature. Build whisper history, delivery confirmation, and richer whisper vocabulary around it. |
| D9 | Both | 3 | **Day 17: Period-approaching notification** -> Minh buys Linh's favorite snacks -> she's surprised | First notification-driven action. Minh became a believer. "Oh, THAT'S why she's been off this week." | Amplify: more proactive notifications like this (phase changes, daily advice) would multiply this effect. |
| D10 | Both | 3 | **Day 20: SOS Cramps Alert** -> push notification -> Minh leaves meeting, brings hot water bottle and ginger tea | SOS->notification->action pipeline worked perfectly. High-urgency, high-value delivery. | Preserve. Consider adding "add a note" for specificity. |
| D11 | Minh | 3 | **Day 25: Date night planned using follicular phase advice** | Minh pre-planned based on "Plan a date! She's in an adventurous mood." Linh was delighted and didn't know the app prompted it. | Amplify: this proves Sun users will act on proactive advice. Daily push would create more of these moments. |
| D12 | Linh | 3 | **Vietnamese translation quality (9/10 overall)** -- natural phrasing, intimate pronouns, empathetic tone | Reads like native Vietnamese, not translation. "Co the ban dang lam viec rat vat va" (Your body is working very hard) personifies the body with dignity. | Preserve. Fix the remaining English hardcoded strings (CycleDataReview, Edge Functions, SOS constants). |
| D13 | Linh | 1 | **"Dung roi, bat dau thoi!" (Looks good, let's go!) CTA** on cycle review screen | Informal, enthusiastic, feels like a friend. Not clinical. | Use this tone pattern for other CTAs (period confirmation, cycle transition). |
| D14 | Linh | 4 | **Whisper send animation** -- pulsing check circle, "Da thi tham voi Sun," auto-close after 2.5s | Small emotional release. "I told him what I need without having to explain." Beautiful micro-interaction. | Preserve. Add delivery/read confirmation to extend this emotional arc. |
| D15 | Both | 1, 2 | **Sun theme (amber/cream #FFF8F0)** -- feels like a premium coffee app, not a health tracker | Minh never felt like he was using "a girl's app" once he was past the splash screen. Warm, masculine, action-oriented. | Preserve and extend to tab bar (currently leaks pink). |

---

## Emotional Safety Audit

Moments where the app could make users feel judged, create couple tension, feel like surveillance, trivialize health, or use cold language.

| # | Risk Type | Who | Where | What Could Go Wrong | Current Status | Recommendation |
|---|-----------|-----|-------|--------------------|----|-----|
| ES1 | **Trivializes health** | Linh | cycleCalculator.ts | Late period wraps to phantom Day 5 with cheerful menstrual content while she's scared about being pregnant | ACTIVE RISK -- happens whenever cycle exceeds expected length | Implement late-period detection. Stop modulo wrapping. Show "Your cycle seems longer than usual" with supportive (not medical) content. |
| ES2 | **Creates couple tension** | Both | Whisper system | Moon sends a whisper, app says "He will know what to do," but if Sun never opens the app, he doesn't know. Moon feels lied to; Sun feels accused when she asks "did you even see my whisper?" | ACTIVE RISK -- no delivery confirmation exists | Add whisper delivery/read status. Change success text to "Whisper sent" (factual) rather than "He will know what to do" (promise). |
| ES3 | **Feels like surveillance** | Minh | Potential engagement indicator | If Moon can see "Sun last opened: 3 days ago," it could create pressure and guilt. "Why aren't you checking the app?" becomes a relationship weapon. | NOT YET BUILT -- but was identified as a P2 gap | If built, MUST be opt-in by Sun. Frame as "Sun is thinking of you" (positive) not "Sun hasn't checked" (negative). Consider showing only engagement, never absence. |
| ES4 | **Cold language** | Linh | Settings > Cycle Settings | Logging period start via a date picker field labeled "Ngay bat dau ky kinh gan nhat" feels clinical. No warm acknowledgment. No "Welcome to Day 1." | ACTIVE -- the only way to log period start | Build a warm "Period Started" flow with supportive copy ("Your body is doing important work. We're here with you.") |
| ES5 | **Makes user feel judged** | Linh | Daily check-in | 5+ consecutive days of mood 1-2 during luteal/menstrual with no variation in response. Feels like documenting misery without progress. | ACTIVE -- insight variety is limited during long phases | Vary insights more. Acknowledge streaks of low mood with extra compassion. "Five tough days in a row. That takes strength." |
| ES6 | **Privacy exposure risk** | Linh | Partner linking | No explanation of what data the partner can access. Linh doesn't know if Minh sees her symptoms, mood scores, or conception chance. | ACTIVE -- no "what your partner sees" explainer exists | Add clear data visibility disclosure before partner code sharing. Sun sees: phase, day, phase description. Sun does NOT see: mood score, symptoms, conception chance. |
| ES7 | **Gendered assumptions** | Both | Role system | Moon = girlfriend, Sun = boyfriend. No accommodation for same-sex couples, non-binary users, or couples where the boyfriend tracks cycles. | BY DESIGN -- but worth noting | Consider role labels that are relationship-neutral in future versions while keeping the warm metaphor. |
| ES8 | **Trivialized urgency** | Linh | SOS system | "SOS" label implies emergency, but options are comfort needs (snacks, hug, cramps, quiet). If Linh has a real medical emergency, the SOS button is not appropriate, but the label suggests it is. | LOW RISK -- options clearly show comfort level | Add subtle disclaimer: "For medical emergencies, call 115." Consider renaming to "Signal" to better match severity. |
| ES9 | **Information asymmetry** | Both | Sun dashboard | Sun sees Moon's mood description and phase status, but Moon has no visibility into whether Sun read it or acted on it. Creates one-way transparency that can feel unfair. | ACTIVE -- inherent in the role design | Whisper delivery confirmation and Sun engagement nudges partially address this. Full solution requires careful design to avoid surveillance. |
| ES10 | **False reassurance** | Both | cycleCalculator.ts + predictions | Predictions are based on single manual input with no correction mechanism. After months, drift accumulates. App shows "Low confidence" initially but never upgrades or adjusts. | ACTIVE -- no period confirmation loop to improve accuracy | Build period confirmation flow. Update predictions based on actual logged dates. Show improving confidence badge. |

---

## Summary Statistics

### By Severity

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 11 | Stopped using or nearly stopped; trust-breaking; core feature failure |
| High | 14 | Almost gave up; significant frustration; feature gap blocking value |
| Medium | 15 | Confused but pushed through; noticeable but not blocking |
| Low | 7 | Minor annoyance; noticed but quickly forgotten |
| **Total** | **47** | |

### By Category

| Category | Count | Top Severity |
|----------|-------|-------------|
| Notification | 8 | 4 Critical |
| Value Gap | 10 | 1 Critical |
| Trust Erosion | 5 | 3 Critical |
| Emotional Miss | 5 | 2 Critical |
| Design | 5 | 0 Critical |
| Language | 5 | 0 Critical |
| Privacy | 3 | 0 Critical |
| Navigation | 3 | 1 Critical |
| Cognitive Load | 3 | 0 Critical |
| Terminology | 3 | 0 Critical |

### By Persona

| Persona | Friction Count | Critical Count |
|---------|---------------|----------------|
| Linh (Moon) only | 18 | 3 |
| Minh (Sun) only | 14 | 5 |
| Both | 15 | 3 |

### Key Insight

The notification gap is the single largest category of critical friction. **Four of eleven critical issues are notification-related.** The app has the right information and the right content, but fails to deliver it at the right time. This makes the difference between preventing an argument and explaining it afterward, between Minh buying snacks proactively and Linh wondering if he even cares.

---

## Top 5 Friction Items to Fix First

Ordered by combined severity, frequency, and impact on retention:

1. **Period confirmation flow + late-period detection** (Friction #24, #26, #27, #28) -- Trust-breaking when wrong. Affects both users. The cycle calculator's modulo wrapping is a ticking time bomb.

2. **Sun proactive notifications** -- phase changes, daily advice, re-engagement nudges (Friction #19, #20, #31, #37) -- Minh's 14/30 engagement is entirely caused by notification absence. Fix this and Sun retention likely doubles.

3. **Moon daily check-in reminder** (Friction #18) -- Linh's Day 3-4 gap and luteal fatigue are directly caused by zero re-engagement mechanism. One well-timed push per day solves this.

4. **Whisper delivery confirmation + persistence** (Friction #30, #32, #45) -- The app's best feature (Whisper) has a broken emotional loop. Moon whispers into the void with no confirmation and a 5-minute auto-delete.

5. **Push notification i18n** (Friction #21, #22) -- Every push notification arrives in English for Vietnamese users. Quick fix with high perception impact.
