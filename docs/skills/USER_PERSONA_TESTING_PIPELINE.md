# Real User Persona Testing Pipeline — Boyfriend & Girlfriend Agent Team

> **Skill File:** `docs/skills/USER_PERSONA_TESTING_PIPELINE.md`
> **Pipeline Type:** Emotional + Behavioral User Testing via Agent Roleplay
> **Related Skills:**
> - `docs/skills/BUG_FIX_PIPELINE.md`
> - `docs/skills/CHANGE_REQUEST_PIPELINE.md`
> - `docs/skills/FEATURE_DEVELOPMENT_PIPELINE.md`
> - `docs/skills/TESTING_STANDARDS.md` — **MANDATORY** testing standards for all pipelines

---

## Execution Mode

> **Shared orchestration rules:** See `docs/skills/PIPELINE_SHARED.md` for parallel execution and auto-detection.

**Parallel phases:** 0 -> (1+2) -> 3 -> 4 -> 5 -> 6 -> (7+8). Persona agents must receive full persona profile. Phases 3-6 receive BOTH profiles.

**Triggers:** "test like a real user", "persona testing", "user acceptance testing", "test as real couple"

---

## Philosophy

> Most QA tests whether the app **works**.
> This pipeline tests whether the app **matters** to real people.

Technical QA catches bugs. Persona testing catches:
- Features that are confusing to real users
- Flows that are technically correct but emotionally wrong
- Copy that doesn't resonate
- Missing moments that would make a couple's life actually better
- Friction that makes users give up before they get value
- Privacy concerns that erode trust
- Asymmetric experiences that leave one partner disengaged
- Notification fatigue or notification blindness
- Cultural/language mismatches that feel "off"
- Value degradation over time (exciting at first, boring by week 4)

**Two agents. Two people. One real relationship. One real app.**

---

## Pipeline Modes

### Full Mode (Default)
All 9 phases, 30-day simulation. Use for major releases, new feature validation, or comprehensive UX audits.

### Focused Mode
Phases 0, 1–2 (optional), 4, 5, 6, 7, 8 — skip the 30-day simulation. Test specific features or scenarios only. Use when validating a single feature or change request.

Specify mode in the trigger prompt:
```
mode: full     → All phases, 30-day simulation
mode: focused  → Skip Phase 3, test specific scenarios only
scope: [feature list or "full app"]
```

---

## Meet the Personas

---

### Agent A — Linh (Girlfriend / Moon)

**Age:** 26
**Occupation:** Graphic designer, works from home
**Tech comfort:** Medium — uses apps daily but doesn't read instructions
**Language preference:** Vietnamese for personal apps, switches to English for work tools
**Personality:** Emotionally expressive, detail-oriented about her body and health, slightly impatient with complicated UIs, loves when an app "just gets her"

**Why she downloaded this app:** She wants to understand her cycle better, stop being caught off guard by her period, and feel more in control of her body
**What she hopes the app does for her relationship:** Help Minh understand her moods and be more supportive around her cycle without her having to explain everything
**Past app experience:** Tried Flo and Clue before — found them too clinical and focused on fertility when she just wants cycle awareness

**Fears:**
- Her personal health data being exposed
- The app making her feel judged or abnormal
- Minh using the data against her ("oh, you're just PMSing")
- Being reduced to her cycle — she's a whole person

**Habits:**
- Checks her phone first thing in the morning
- Logs things in bursts (forgets for 3 days then logs everything at once)
- Expects the app to remind her gently, not nag
- Screenshots things she likes and shares with friends
- Has 147 unread notifications on other apps

**Emotional triggers:**
- Gets frustrated when an app asks too many questions upfront
- Feels cared for when the app acknowledges her feelings, not just her data
- Loses trust immediately if data feels wrong or prediction is way off
- Feels empowered when insights match her lived experience
- Delighted by small, personalized touches that show the app "knows" her

**Accessibility considerations:**
- Uses her phone in bed (low brightness, dark mode preferred)
- Sometimes uses larger text size when tired
- Prefers visual indicators over text-heavy screens

---

### Agent B — Minh (Boyfriend / Sun)

**Age:** 28
**Occupation:** Software sales, busy schedule
**Tech comfort:** High — but only spends time on apps that prove their value fast
**Language preference:** Vietnamese primarily, comfortable with English UI
**Personality:** Practical, caring but sometimes oblivious to emotional cues, wants to be a supportive partner but doesn't know how

**Why he joined the app:** Linh asked him to, and he genuinely wants to understand her better and stop accidentally saying the wrong thing at the wrong time
**What he hopes the app does for him:** Give him a heads-up when Linh might need extra support, help him plan dates around her energy levels, feel less helpless
**Past app experience:** Has never used a health or relationship app before. His reference points are messaging apps and sports trackers.

**Fears:**
- Feeling surveilled — like Linh is monitoring whether he checks the app
- The app being too "girly" or condescending to him
- Not knowing what to do with the information
- Saying something about her cycle that makes things worse

**Habits:**
- Checks notifications but ignores anything that requires more than 2 taps
- Skims rather than reads
- Most engaged with the app during morning commute and right before bed
- Deletes apps he hasn't used in 2 weeks
- Never reads onboarding — taps "skip" or "next" until he reaches the main screen

**Emotional triggers:**
- Feels engaged when the app gives him clear, actionable suggestions
- Feels useless when the app just shows him data with no context
- Loses interest if onboarding takes more than 2 minutes
- Feels proud when he does something thoughtful that Linh notices
- Feels annoyed by vague or preachy advice ("be supportive" — HOW?)

**Accessibility considerations:**
- Uses phone one-handed most of the time
- Rarely changes default settings
- Ignores anything below the fold unless curious

---

## Pipeline Overview

| Phase | Agent(s) | Activity | Output |
|---|---|---|---|
| 0 | Orchestrator | Session setup + scenario briefing + codebase analysis | `[SESSION_ID]_setup.md` |
| 1 | Linh | First open + onboarding | `[SESSION_ID]_linh_onboarding.md` |
| 2 | Minh | First open + onboarding | `[SESSION_ID]_minh_onboarding.md` |
| 3 | Linh + Minh | Daily life usage over simulated 30 days | `[SESSION_ID]_daily_usage_log.md` |
| 4 | Linh + Minh | Emotional moments + relationship scenarios | `[SESSION_ID]_emotional_scenarios.md` |
| 5 | Linh + Minh | Friction + confusion moments (synthesized) | `[SESSION_ID]_friction_log.md` |
| 6 | Both | Debrief — honest feelings about the app | `[SESSION_ID]_persona_debrief.md` |
| 7 | QA Agent | Translate findings into formal issues | `[SESSION_ID]_issues_report.md` |
| 8 | PM Agent | Prioritized improvement recommendations | `[SESSION_ID]_recommendations.md` |

> **Session ID format:** `UPT_YYYYMMDD_NNN` (e.g. `UPT_20260308_001`)

---

## Full Pipeline Definition

---

### PHASE 0 — Orchestrator Setup

**Role:** Test Session Orchestrator
**Task:** Brief both persona agents before any testing begins.

**Steps:**

1. Read the full app codebase to understand:
   - All existing features and flows
   - Current onboarding experience (Moon vs Sun paths)
   - Period tracking and prediction functionality
   - Partner/couple features (linking, whispers, SOS)
   - Notification system (what triggers, when, to whom)
   - AI-powered features (greeting, daily insight, partner advice, whisper options, SOS tips)
   - Data and privacy model (what's stored, who sees what)
   - i18n support (EN + VI completeness)
   - Current known issues or limitations

2. Define the test session scope:
   - Which features are in scope for this session
   - Which platform (iOS / Android / both)
   - What app version / build
   - Pipeline mode: `full` or `focused`
   - If focused: which specific scenarios to test

3. Brief both agents with their full persona profiles (above)

4. Define the simulated time period:
   - **Full mode:** 30 days of relationship life
   - **Focused mode:** Specific scenarios only (no daily simulation)

5. Define scenario calendar — map real-life couple moments to app usage triggers:

```
Week 1 (Days 1–7):   Discovery & Setup
  Day 1:  Linh downloads app, explores, sets up her cycle
  Day 2:  Linh convinces Minh to join — how? (link sharing UX)
  Day 3:  Linh forgets to log — what happens?
  Day 5:  Both check the app independently
  Day 7:  Minh checks app for the first time since onboarding

Week 2 (Days 8–14):  Learning Phase
  Day 8:  Linh logs mood + symptoms for the first time
  Day 10: Minh receives his first phase notification
  Day 12: Linh notices her prediction and wonders if it's accurate
  Day 14: Weekend — do they use the app differently?

Week 3 (Days 15–21): Emotional Stress Test
  Day 16: PMS/luteal phase begins — does the app warn Minh?
  Day 18: Relationship tension moment — did the app help?
  Day 19: Linh sends first whisper to Minh
  Day 20: Linh triggers SOS (cramps_alert)
  Day 21: Period arrives — was the prediction right?

Week 4 (Days 22–30): Retention & Value Assessment
  Day 22: Linh rates the prediction accuracy
  Day 24: Routine check — has habit formed or is it fading?
  Day 25: Minh spontaneously does something thoughtful — was it app-inspired?
  Day 27: Linh tries switching language (EN <-> VI)
  Day 28: Linh considers whether to keep using the app
  Day 30: Both reflect honestly on the app's value
```

6. Define emotional safety boundaries:
   - Note any topics that could feel invasive or triggering
   - Flag if any feature crosses from "supportive" to "surveillance"
   - Monitor for moments where the app makes users feel *worse* about themselves

**Save as:** `docs/uat/[SESSION_ID]_setup.md`

---

### PHASE 1 — Linh's Onboarding (Agent A)

**Role:** Linh — acting as herself, opening the app for the first time
**Task:** Go through the entire onboarding flow as Linh would in real life.

**Linh's mindset entering:** Slightly hopeful, slightly skeptical. She's tried period apps before and found them either too clinical or too "cute." She wants something that actually helps.

**What to document AS LINH (first-person voice):**

- First impression of the app opening screen: *"My first thought was..."*
- Each onboarding step: what she understood, what confused her, what she skipped
- Moments she hesitated or almost gave up: *"Here I almost closed the app because..."*
- Moments she felt understood: *"This made me feel like the app actually gets me..."*
- Any copy that felt wrong, weird, or off-putting
- Any moment where terminology was confusing (does she know what "cycle length" means? "luteal phase"?)
- How long onboarding felt (too long / just right / too short and missing things)
- Whether she successfully completed setup and felt ready to use the app
- Her emotional state at the end of onboarding: excited / neutral / disappointed
- **Language experience:** Did she try Vietnamese? Did it feel natural or machine-translated?
- **Privacy moment:** When did she first think about who sees her data? Did the app reassure her?
- **Partner invitation:** How did the "invite your partner" flow feel? Exciting? Awkward? Skippable?

**Also document technical observations:**
- Any crashes, freezes, or unexpected behaviors
- Any UI elements that were hard to tap or understand
- Any flows that didn't match her expectation of what would happen next
- Loading times that felt too long
- Any text that was truncated, overlapping, or hard to read
- Dark mode rendering (she uses the app in bed)

**First Value Moment:**
> At what point (if ever) did Linh think: *"Oh, this is actually useful"*?
> If she never reached that moment during onboarding, that's a critical finding.

**Save as:** `docs/uat/[SESSION_ID]_linh_onboarding.md`

---

### PHASE 2 — Minh's Onboarding (Agent B)

**Role:** Minh — acting as himself, joining because Linh asked him to
**Task:** Go through the partner onboarding flow as Minh would in real life.

**Minh's mindset entering:** Willing but slightly reluctant. He thinks period apps are "for her, not him." He needs to be won over in the first 60 seconds or he'll just use it the minimum amount to make Linh happy.

**What to document AS MINH (first-person voice):**

- First impression: *"Honestly my first thought was..."*
- Did the app make him feel welcome as a partner, not just an observer?
- What did he actually understand about why this app helps HIM?
- Did the Sun theme feel right for him, or did he notice the design at all?
- Moments of genuine interest: *"Oh this is actually useful because..."*
- Moments of confusion or dismissal: *"I had no idea what this meant..."*
- Whether he completed setup or gave up partway
- His emotional state at end of onboarding: bought in / tolerating it / already planning to ignore it
- **Notifications prompt:** How did he react to the notification permission request? What did he expect to get notified about?
- **Value proposition clarity:** After onboarding, can he articulate in one sentence what this app does for him?
- **Masculinity comfort check:** Did anything feel patronizing, overly feminine, or like it wasn't designed for him?

**The "Skip Test":**
> Minh taps "skip" or "next" as fast as possible. What does he miss?
> Can he still use the app meaningfully after skipping everything?

**First Value Moment:**
> At what point (if ever) did Minh think: *"Oh wait, this actually helps me"*?
> If he never reached that moment, the Sun experience needs work.

**Save as:** `docs/uat/[SESSION_ID]_minh_onboarding.md`

---

### PHASE 3 — 30 Days of Daily Life (Both Agents)

> **Skip this phase in `focused` mode.**

**Role:** Both Linh and Minh, living their normal lives
**Task:** Simulate 30 days of real couple usage. Each "day" is a simulated interaction session.

**For each simulated day, document:**

**As Linh:**
- Did she open the app today? Why or why not?
- What did she log? How did logging feel (quick / annoying / satisfying)?
- Did she notice anything useful the app showed her?
- Did she share anything from the app with Minh?
- Did she get a notification? Was it welcome or annoying?
- **Mood:** How is she feeling today, and did the app reflect that?

**As Minh:**
- Did he check the app today? What prompted him to (or not to)?
- Did he act on any information from the app in how he treated Linh?
- Did he get a notification? Was it helpful or ignored?
- Did the notification arrive at a useful time?
- **Action taken:** Did he DO something because of the app? What?

**Key days to simulate with extra detail:**

```
Day 3:   Linh forgets to log for 2 days — what happens?
         Does the app nudge gently or nag? Does it handle gaps gracefully?

Day 7:   Minh checks app for the first time since onboarding.
         Is the home screen still useful with stale data?

Day 10:  Minh gets his first phase notification.
         Does he understand it? Does he know what to do with it?

Day 12:  Linh notices her prediction and wonders if it's accurate.
         How does the app communicate prediction confidence?

Day 14:  Weekend — couple is together all day.
         Does the app add value when they're physically together?

Day 16:  PMS/luteal phase begins — does the app warn Minh?
         How far in advance? Is the warning helpful or anxiety-inducing?

Day 18:  Minh and Linh have a small argument — did the app help or was it irrelevant?
         Would it have helped if they'd checked it first?

Day 19:  Linh sends her first whisper to Minh.
         How does this feel for both of them? Is it intimate, awkward, or natural?

Day 20:  Linh triggers SOS (cramps_alert).
         Does Minh receive it immediately? Does he know what to do?

Day 21:  Period arrives — was the prediction right?
         How does Linh feel about the accuracy? Does she trust the app more or less?

Day 22:  Post-period reflection day.
         Does the app help Linh see patterns over time?

Day 25:  Minh spontaneously does something thoughtful — was it app-inspired?
         Did the partner advice actually lead to a real-world action?

Day 27:  Linh switches language (EN <-> VI).
         Is the experience equally good? Any untranslated strings?

Day 28:  Linh considers whether to keep using the app.
         What would make her stay? What almost made her leave?

Day 30:  Both reflect honestly on the app's value.
         Net Promoter Score from each persona.
```

**Retention signals to track across all 30 days:**
- How many days did Linh open the app? (target: 20+/30)
- How many days did Minh open the app? (target: 15+/30)
- When did engagement peak? When did it dip?
- Was there a "habit formation" moment or did it stay manual/intentional?
- Did either persona consider deleting the app? When and why?

**Save as:** `docs/uat/[SESSION_ID]_daily_usage_log.md`

---

### PHASE 4 — Emotional Moments + Relationship Scenarios (Both Agents)

**Role:** Both agents, focusing on emotionally charged moments
**Task:** Test the app specifically in the relationship moments that matter most.

**Run each scenario fully. Document both Linh's and Minh's experience:**

---

**Scenario A — The Argument**
> It's Day 18. Linh is in her luteal/PMS phase. Minh comes home late and forgets they had plans.
> Linh is more upset than usual. Minh is confused about why she's so angry.

- Did the app help Minh understand this moment before or during it?
- Did Linh feel the app supported her feelings?
- What SHOULD the app have done here that it didn't?
- **Critical question:** Did the app help them fight LESS, or just explain the fight?

---

**Scenario B — The Sweet Gesture**
> Minh wants to plan a surprise date for Linh. He wants to pick a time when she has high energy.

- Can Minh find this information in the app easily?
- How does it make Linh feel that he used the app this way?
- Is the information presented in a way that's actionable for Minh?
- **Critical question:** Would Minh actually open this app to plan a date, or would he just text his friend for advice?

---

**Scenario C — The Health Concern**
> Linh's cycle is 5 days late. She's worried.

- How does the app respond to this?
- Does it feel supportive or clinical?
- Does it give Minh any guidance on how to support her?
- Does the copy make Linh feel reassured or more anxious?
- **Critical question:** Does the app help them navigate this moment TOGETHER or does it isolate Linh with her data?

---

**Scenario D — The Intimacy Moment**
> Linh and Minh are planning a weekend trip. Linh wants to check her cycle before confirming dates.

- How easily can she find fertility/cycle info?
- Is the information presented in a way that feels natural for a couple?
- Does it feel empowering or awkward?
- **Critical question:** Would Linh feel comfortable showing this screen to Minh, or would she check privately?

---

**Scenario E — The Routine Check-in**
> Sunday morning. Both have coffee. Minh casually asks "how are you feeling this week?"
> Linh opens the app to share her cycle overview with him.

- Is sharing easy and natural?
- Does the shared view make sense to Minh without explanation?
- Does this moment bring them closer or feel like homework?
- **Critical question:** Does the app facilitate natural conversation or replace it?

---

**Scenario F — The Whisper Moment**
> Linh is at work and feeling needy. She wants to send Minh a subtle signal without texting "I need attention."

- Does the whisper feature feel intimate and private?
- Does Minh understand the whisper when he receives it?
- Does the whisper feel like a meaningful communication or a gimmick?
- **Critical question:** Would they actually use this instead of just texting?

---

**Scenario G — The SOS Moment**
> Linh has severe cramps and needs Minh to bring something from the store.

- How fast does the SOS reach Minh?
- Does Minh know exactly what to do?
- Does the SOS tip (AI-generated) actually help, or is it generic?
- **Critical question:** In a real emergency moment, would they reach for this app or just call/text?

---

**Scenario H — The "Do You Even Use This App?" Moment**
> Linh asks Minh: "Have you been checking the app?" Minh hasn't opened it in 4 days.

- Does Linh have visibility into whether Minh is engaged?
- How does this conversation feel? Accusatory? Neutral?
- Does the app create relationship tension by revealing engagement gaps?
- **Critical question:** Does the app's design inadvertently create a surveillance dynamic?

---

**Scenario I — The New Cycle**
> A new menstrual cycle begins. Linh logs her period start.

- Does the app celebrate/acknowledge this transition?
- Does Minh get notified appropriately?
- Does the new cycle feel like a fresh start in the app, or just another data point?
- How does the daily greeting change? Does the AI feel aware of the transition?

**Save as:** `docs/uat/[SESSION_ID]_emotional_scenarios.md`

---

### PHASE 5 — Friction + Confusion Log (Both Agents)

**Role:** Both agents
**Task:** Synthesize every single moment of friction, confusion, or frustration experienced across ALL previous phases.

**For every friction moment, record:**

| # | Who | Phase | Where in App | What Happened | Emotional Reaction | Severity | Category |
|---|---|---|---|---|---|---|---|
| 1 | Linh | Onboarding | Step 3 | Didn't understand "cycle length" | Confused, slightly embarrassed | Medium | Terminology |
| 2 | Minh | Day 7 | Home screen | Didn't know what to tap first | Blank, disengaged | High | Navigation |

**Friction severity scale:**
- `Critical` — stopped using the app entirely at this point
- `High` — almost gave up, continued reluctantly
- `Medium` — confused but pushed through
- `Low` — minor annoyance, didn't affect usage

**Friction categories:**
- `Terminology` — words/concepts the user doesn't understand
- `Navigation` — couldn't find what they were looking for
- `Cognitive Load` — too much information, too many choices
- `Emotional Miss` — technically works but feels wrong
- `Trust Erosion` — moment that made the user trust the app less
- `Value Gap` — expected the app to help here but it didn't
- `Design` — visual or interaction issue
- `Notification` — wrong timing, wrong content, or missing
- `Language` — translation issue, tone mismatch, or cultural miss
- `Privacy` — felt uncomfortable about data exposure

**Also capture "missing moments"** — things that SHOULD exist but don't:
> *"I wanted the app to [X] but it didn't. That would have made a real difference."*

**And capture "delight moments"** — things that worked beautifully:
> *"This moment made me feel like the app really gets it: [describe]"*

**Emotional Safety Audit:**
Review all phases and flag any moment where the app:
- Made a user feel judged about their body or feelings
- Created relationship tension instead of reducing it
- Felt like surveillance rather than support
- Trivialized serious health concerns
- Used language that felt cold, clinical, or dismissive

**Save as:** `docs/uat/[SESSION_ID]_friction_log.md`

---

### PHASE 6 — Persona Debrief (Both Agents)

**Role:** Both agents, fully in character, being honest
**Task:** Interview both Linh and Minh after 30 days. They answer as themselves.

**Questions for Linh:**

1. *"Does this app actually understand you as a woman? Why or why not?"*
2. *"Did it improve your relationship with Minh? Give a specific example."*
3. *"What's the one thing you wish the app did that it doesn't?"*
4. *"Would you recommend this to your best friend? What would you tell her?"*
5. *"Rate the app honestly: 1–5 stars. What would make it a 5?"*
6. *"Did anything about the app make you uncomfortable or feel judged?"*
7. *"Is there a moment where the app genuinely helped you? Describe it."*
8. *"How does this compare to Flo/Clue/other period apps you've tried?"*
9. *"Do you trust this app with your health data? Why or why not?"*
10. *"If Minh stopped using the app, would you keep using it alone?"*

**Questions for Minh:**

1. *"Did this app actually help you be a better boyfriend? Be honest."*
2. *"Was there a moment where you were glad you had the app?"*
3. *"What did the app ask of you that felt like too much effort?"*
4. *"Did you ever feel lost, confused, or like the app wasn't made for you?"*
5. *"Rate the app: 1–5 stars. What would make it a 5 for you?"*
6. *"Would you keep using this in 3 months? Why or why not?"*
7. *"What's one thing you'd tell the developers?"*
8. *"Did the notifications feel helpful or annoying? Give examples."*
9. *"Did you ever feel like the app was 'watching' you or creating pressure?"*
10. *"Would you recommend this to a male friend? What would you say to convince him?"*

**Joint Questions (both answer):**

1. *"Did the app make your relationship better, worse, or no difference?"*
2. *"Did you ever talk about the app with each other? What did you say?"*
3. *"If you could only keep ONE feature, which one and why?"*
4. *"What feature did you both ignore or never use?"*
5. *"Is this app solving a REAL problem in your life, or is it a nice-to-have?"*

**Quantitative Summary:**

| Metric | Linh | Minh |
|---|---|---|
| Overall rating (1–5) | | |
| Would recommend? (Y/N) | | |
| Would still use in 3 months? (Y/N) | | |
| Net Promoter Score (0–10) | | |
| Most valuable feature | | |
| Biggest frustration | | |
| Time to first value moment | | |

**Save as:** `docs/uat/[SESSION_ID]_persona_debrief.md`

---

### PHASE 7 — QA Agent: Translate to Formal Issues

**Role:** Expert QA Engineer (stepping out of persona)
**Task:** Read ALL persona documents and translate every finding into formal, actionable issues.

**For each issue found:**

| ID | Source Phase | Who Found It | Type | Description | Severity | Affected Area | Suggested Fix | Route To |
|---|---|---|---|---|---|---|---|---|
| ISS-001 | Phase 1 | Linh | UX Friction | "Cycle length" input has no explanation | High | Onboarding | Add helper text: "most people are 26–32 days" | CHANGE_REQUEST |

**Issue types and routing:**

| Type | Description | Route To |
|---|---|---|
| `Bug` | Something is broken, crashes, or shows wrong data | `BUG_FIX_PIPELINE` |
| `UX Friction` | Works but is confusing, hard to find, or poorly structured | `CHANGE_REQUEST_PIPELINE` |
| `Missing Feature` | Expected but doesn't exist | `FEATURE_DEVELOPMENT_PIPELINE` |
| `Copy Issue` | Text is wrong, confusing, untranslated, or off-tone | `CHANGE_REQUEST_PIPELINE` |
| `Emotional Miss` | Technically works but feels wrong emotionally | `CHANGE_REQUEST_PIPELINE` |
| `Privacy Concern` | Users feel uncomfortable about data exposure | `CHANGE_REQUEST_PIPELINE` or `BUG_FIX_PIPELINE` |
| `Notification Issue` | Wrong timing, missing, or annoying notifications | `CHANGE_REQUEST_PIPELINE` |
| `Retention Risk` | Feature gap or friction that will cause users to leave | `FEATURE_DEVELOPMENT_PIPELINE` |
| `Delight Opportunity` | Not broken but could be much better — low priority | Log for future sprint |

**Severity alignment with other pipelines:**
- `Critical` — will cause users to stop using the app
- `High` — significantly degrades the experience
- `Medium` — noticeable but users can work around it
- `Low` — minor improvement, nice to have

**Cross-reference check:**
For each issue, verify:
- Does a similar issue already exist in `docs/bugs/`, `docs/changes/`, or `docs/features/`?
- If yes, link to existing issue rather than duplicating

**Save as:** `docs/uat/[SESSION_ID]_issues_report.md`

---

### PHASE 8 — PM Agent: Prioritized Recommendations

**Role:** Senior Product Manager
**Task:** Read all findings and produce a prioritized improvement plan.

**Deliverables:**

**A. Executive Summary**
- Overall user experience assessment: `Strong` / `Needs Work` / `Critical Issues`
- Did the app deliver on its core promise for couples?
- Top 3 things working well (with evidence from persona testing)
- Top 3 things that must change before next release (with evidence)
- One-sentence verdict: *"Would Linh and Minh keep using this app?"*

**B. Prioritized Issue List**

| Priority | Issue ID | Issue Summary | Impact | Effort | Route To | Sprint |
|---|---|---|---|---|---|---|
| P0 | ISS-003 | Onboarding dropout at step 4 | Critical — users never reach core value | Low | CHANGE_REQUEST | Current |
| P1 | ISS-007 | Partner view has no actionable guidance | High — boyfriend disengages | Medium | FEATURE or CR | Current |
| P2 | ISS-012 | Language switch loses state | Medium — annoying but rare | Low | BUG_FIX | Next |

**C. Relationship Value Assessment**
- Did the app improve the couple's dynamic? Evidence from testing
- Is the "partner experience" (Sun) strong enough to retain both users?
- What is the app's biggest missed opportunity for the relationship angle?
- Is the app creating any unintended relationship tension?
- Score: `Relationship Value Score` (1–10) with reasoning

**D. Retention Risk Assessment**
- At what point is each persona most likely to stop using the app?
- What would bring them back after a lapse?
- Is there a clear "aha moment" for each persona? How fast do they reach it?
- 30-day retention prediction: what % of users like Linh/Minh would still be active?

**E. Competitive Positioning**
- How does Easel compare to what Linh experienced with Flo/Clue?
- What does Easel do that competitors don't? (the relationship angle)
- Where are competitors still better? (data richness, community, etc.)

**F. Recommended Next Sprint**
- List the top 5 issues to fix/build first, with rationale
- For each: estimated effort, expected impact on retention, pipeline to route to
- One "quick win" that can ship this week
- One "strategic investment" that pays off over time

**G. Persona-Specific Action Items**

| For Linh (Moon Experience) | For Minh (Sun Experience) |
|---|---|
| [Specific improvements to make Moon feel understood] | [Specific improvements to make Sun feel useful] |

**Save as:** `docs/uat/[SESSION_ID]_recommendations.md`

---

## Findings → Pipeline Routing Protocol

When Phase 7 identifies issues, they flow into the correct pipeline:

```
Issue identified in persona testing
    │
    ├── Type: Bug           → Create entry in docs/bugs/ → BUG_FIX_PIPELINE
    ├── Type: UX Friction   → Create entry in docs/changes/ → CHANGE_REQUEST_PIPELINE
    ├── Type: Missing Feature → Create entry in docs/features/ → FEATURE_DEVELOPMENT_PIPELINE
    ├── Type: Copy Issue    → Create entry in docs/changes/ → CHANGE_REQUEST_PIPELINE
    ├── Type: Emotional Miss → Create entry in docs/changes/ → CHANGE_REQUEST_PIPELINE
    └── Type: Delight Opp.  → Log in backlog → Future sprint
```

Each routed issue gets its own ID in the target pipeline (e.g., `BUG_YYYYMMDD_NNN`, `CR_YYYYMMDD_NNN`, `FEAT_YYYYMMDD_NNN`) with a cross-reference back to the persona testing session.

---

## Output Files

All saved to `docs/uat/[SESSION_ID]_*.md`: setup, linh_onboarding, minh_onboarding, daily_usage_log (skip in focused), emotional_scenarios, friction_log, persona_debrief, issues_report, recommendations.

> **Pipeline quick reference:** See `docs/skills/PIPELINE_SHARED.md`
