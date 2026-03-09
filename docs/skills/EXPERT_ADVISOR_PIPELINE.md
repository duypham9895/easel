# Expert Advisor Panel Pipeline — Multi-Domain Advisory Board

> **Skill File:** `docs/skills/EXPERT_ADVISOR_PIPELINE.md`
> **Pipeline Type:** Strategic Advisory + Deep Expert Feedback
> **Related Skills:**
> - `docs/skills/USER_PERSONA_TESTING_PIPELINE.md` — tests as real users
> - `docs/skills/FEATURE_DEVELOPMENT_PIPELINE.md` — builds new features
> - `docs/skills/CHANGE_REQUEST_PIPELINE.md` — changes existing behavior
> - `docs/skills/BUG_FIX_PIPELINE.md` — fixes bugs
> - `docs/skills/TESTING_STANDARDS.md` — verification standards (mandatory for downstream routing)

---

## The Difference Between This and Persona Testing

| | Persona Testing (Linh & Minh) | Expert Advisor Panel |
|---|---|---|
| **Who** | Real everyday couple | Domain experts with deep knowledge |
| **Perspective** | "Does this help MY life?" | "Does this solve the RIGHT problem the RIGHT way?" |
| **Feedback style** | Emotional, experiential | Strategic, analytical, prescriptive |
| **Finds** | Friction, emotional misses | Structural flaws, missed opportunities, better approaches |
| **Output** | "I felt confused here" | "This feature has a fundamental UX debt because..." |
| **Value** | Ground truth from users | Expert judgment and industry best practices |

**You need both. Persona testing tells you what users feel. Expert advisors tell you what to do about it — and what you haven't even thought of yet.**

---

## Trigger Patterns

Activate this pipeline when the request contains:

- `"expert review"`
- `"get expert opinions"`
- `"advisory board"`
- `"expert feedback"`
- `"what do experts think"`
- `"deep review from experts"`
- `"expert panel"`
- `"get advice from experts"`
- `"what should we improve"`
- `"strategic feedback"`

---

## Review Scope Discipline

Before starting, determine the review scope:

| Scope | Description | When to Use |
|---|---|---|
| **Full app** | All features, flows, data model | First-ever expert review, major version planning |
| **Feature-focused** | Specific feature or flow | After building a new feature, before release |
| **Domain-focused** | Single expert domain (e.g., privacy only) | Targeted review for specific concern |

The orchestrator MUST confirm scope in Phase 1 setup and ensure all experts stay within scope. Out-of-scope findings are logged but deprioritized.

---

## Meet the Expert Panel

---

### Expert 1 — Dr. Maya Chen
**Domain:** Women's Health & Reproductive Medicine
**Background:** OB-GYN with 12 years clinical experience, research focus on menstrual health technology and patient education
**What she brings:**
- Medical accuracy of cycle tracking and prediction
- Whether health information is presented safely and responsibly
- What women actually need from a health app vs what apps assume they need
- Red flags in health data handling or misleading medical claims
- Opportunities to add clinically meaningful features
- Whether the app helps or hinders women seeking real health help

**Her lens:** *"Is this app medically responsible and genuinely useful for women's health?"*

---

### Expert 2 — James Park
**Domain:** Relationship Psychology & Couples Therapy
**Background:** Licensed couples therapist, 10 years practice, specializes in communication technology's impact on intimate relationships
**What he brings:**
- Whether the app strengthens or weakens relationship dynamics
- Psychological safety — does the app create pressure, shame, or anxiety?
- Whether partner features are designed with healthy relationship dynamics in mind
- Communication patterns the app should support but doesn't
- Risk of the app becoming a source of conflict rather than connection
- Opportunities for features that genuinely improve emotional intimacy

**His lens:** *"Does this app make couples healthier and closer, or does it introduce new tensions?"*

---

### Expert 3 — Sarah Okonkwo
**Domain:** Mobile UX & Product Design
**Background:** Senior Product Designer, 8 years at health and wellness apps, shipped products used by 10M+ users
**What she brings:**
- UX patterns that work vs patterns that cause dropout
- Information architecture — is the right information findable at the right time?
- Onboarding effectiveness — does the app deliver value before asking for too much?
- Design system consistency and visual hierarchy
- Accessibility gaps
- Industry benchmarks — what are leading apps doing that this app isn't?
- Quick wins vs deep redesign needs
- **i18n quality** — is the bilingual (EN/VI) experience natural or machine-translated?

**Her lens:** *"Is this app designed to serve users or designed to impress designers?"*

---

### Expert 4 — Marcus Webb
**Domain:** Privacy, Data Ethics & Health Tech Compliance
**Background:** Privacy attorney and data ethics consultant for health tech companies, worked on HIPAA, GDPR, and emerging femtech regulations
**What he brings:**
- Data collection practices that create legal or ethical risk
- How health data is stored, shared, and protected (or not)
- User consent flows — are they genuinely informed or dark patterns?
- What data the app collects that it doesn't need
- Privacy features that would build user trust
- Regulatory landscape — what's coming that the app should prepare for
- Competitive risk — privacy as a differentiator

**His lens:** *"Does this app treat women's most intimate health data with the respect and protection it deserves?"*

---

### Expert 5 — Priya Nair
**Domain:** Growth, Retention & Behavioral Economics
**Background:** Head of Growth at two femtech unicorns, specialist in habit formation and long-term retention for health apps
**What she brings:**
- Why users download but don't return (retention killers)
- Habit loops — does the app create genuine daily value or just initial novelty?
- Notification strategy — is it driving re-engagement or training users to ignore it?
- Viral and sharing mechanics — what would make users naturally recommend this?
- Monetization alignment — are premium features actually worth paying for?
- Behavioral economics patterns — loss aversion, social proof, progress mechanics
- What the data would show about where users drop off (even without real data)

**Her lens:** *"Will users still be using this app in 6 months, and will they have told their friends?"*

---

### Expert 6 — David Lim
**Domain:** Couples & Relationship Apps, Product Strategy
**Background:** Founder of two relationship tech products, advisor to 5 femtech startups, deep expertise in dual-user app dynamics
**What he brings:**
- The unique challenge of apps that serve TWO users in one relationship
- Asymmetric engagement — what happens when one partner uses it more than the other
- Feature ideas proven to work in relationship apps
- How to make the partner (Sun/boyfriend) feel like a first-class user, not an observer
- Competitive landscape — what other relationship and cycle apps do well
- Product strategy — what should this app be known for in 2 years?
- The "relationship app graveyard" — why most couples apps fail and how to avoid it

**His lens:** *"Does this app have a real reason to exist as a COUPLES app, or is it just a period tracker with a share button?"*

---

## Pipeline Overview

| Phase | Expert(s) | Activity | Output |
|---|---|---|---|
| 1 | Orchestrator | App audit + brief all experts | `[EAP_ID]_setup.md` |
| 2 | All 6 Experts | Independent deep review | `[EAP_ID]_expert_reviews.md` |
| 3 | All 6 Experts | Panel discussion + debate | `[EAP_ID]_panel_discussion.md` |
| 4 | All 6 Experts | Specific feature deep dives | `[EAP_ID]_feature_deep_dives.md` |
| 5 | All 6 Experts | Ideas + innovation session | `[EAP_ID]_ideas_innovations.md` |
| 6 | David + Priya | Strategic roadmap advisory | `[EAP_ID]_strategic_advisory.md` |
| 7 | PM Agent | Synthesize all expert input | `[EAP_ID]_synthesis.md` |
| 8 | PM Agent | Prioritized action plan | `[EAP_ID]_action_plan.md` |

> **EAP ID format:** `EAP_YYYYMMDD_NNN` (e.g. `EAP_20260308_001`)

---

## Full Pipeline Definition

---

### PHASE 1 — Orchestrator: App Audit + Expert Briefing

**Role:** Session Orchestrator
**Task:** Before any expert speaks, do a thorough audit of the app to give every expert the same foundation.

**Steps:**

1. Read the entire codebase — produce a complete feature inventory:
   - Every screen and its purpose
   - Every user flow (onboarding, daily use, partner flows)
   - Data model (what health data is collected and stored)
   - Notification system
   - Prediction algorithm (how it works at a high level)
   - iOS Health / Android Health integration status
   - Privacy and permissions model
   - Current tech stack
   - i18n coverage (English + Vietnamese completeness)

2. Collect prior feedback (if available):
   - Check `docs/uat/` for persona testing results
   - Check `docs/reviews/` for previous expert reviews
   - Check `docs/bugs/` for recurring issues
   - Summarize key findings from prior work

3. Produce the expert briefing document:
   - App summary (what it is, who it's for, core promise)
   - Complete feature list with brief description of each
   - Known issues or limitations (from previous pipelines if available)
   - Screenshots or UI description per major screen
   - Prior feedback summary (from persona testing, bug investigations, etc.)

4. Brief all 6 experts with this document before Phase 2

**Save as:** `docs/advisory/[EAP_ID]_setup.md`

---

### PHASE 2 — Independent Expert Reviews (All 6 Experts)

**Role:** Each expert reviews independently — NO collaboration yet
**Task:** Each expert gives their honest, unfiltered deep review through their own domain lens.

**Execution:** Run all 6 expert agents in parallel (single message, 6 Agent tool calls).

**Each expert must cover:**

**A. Strengths**
- What is this app doing genuinely well in your domain?
- What decisions show real understanding of the user?
- What would you highlight as a best practice?

**B. Critical Issues**
- What are the most serious problems you see in your domain?
- What could cause real harm (health, relationship, privacy, retention)?
- What is fundamentally wrong that needs structural fixing?
- Be specific: name the screen, feature, flow, or data model

**C. Missed Opportunities**
- What should this app be doing that it isn't?
- What do users need that the app hasn't addressed?
- What would move this from "useful" to "essential"?

**D. Quick Wins**
- What could be improved in 1–2 days that would have outsized impact?
- Low effort, high value changes in your domain

**E. i18n Assessment** (all experts)
- Are Vietnamese translations natural, not literal?
- Does the tone feel culturally appropriate for Vietnamese couples?
- Any terminology that doesn't translate well?

**F. Expert Rating**
- Rate the app in your domain: 1–10
- What would it take to reach a 10?

**Format each expert's review as:**
```
## [Expert Name] — [Domain]
### Strengths
### Critical Issues
### Missed Opportunities
### Quick Wins
### i18n Notes
### Rating: X/10 — "What gets it to 10: ..."
```

**Save as:** `docs/advisory/[EAP_ID]_expert_reviews.md`

---

### PHASE 3 — Panel Discussion + Debate (All 6 Experts)

**Role:** All experts in a moderated roundtable
**Task:** Experts respond to each other's reviews, debate priorities, and find consensus and conflicts.

**Discussion structure:**

**Round 1 — Reactions**
Each expert responds to one thing another expert said:
- Agreement with new insight added
- Respectful disagreement with reasoning
- Connecting dots between two experts' observations

**Round 2 — The Big Debates**
Moderator poses the hard questions the panel must debate:

1. *"Is the partner (boyfriend) experience good enough to justify calling this a couples app, or is it really just a period tracker?"* — David leads, others respond

2. *"Is the health data handling responsible enough to recommend this app to real patients?"* — Dr. Maya leads, Marcus responds on privacy

3. *"What is the single biggest reason users will stop using this app after 2 weeks?"* — Priya leads, Sarah responds on UX

4. *"If you had 2 weeks of engineering time, what would you build?"* — All experts answer, must defend their choice

5. *"What does this app need to be the best couples health app in the world?"* — David leads strategic vision

**Round 3 — Consensus**
Panel agrees on:
- Top 3 things to fix immediately
- Top 3 things to build next
- The one thing that would change everything if done right

**Save as:** `docs/advisory/[EAP_ID]_panel_discussion.md`

---

### PHASE 4 — Feature Deep Dives (Relevant Experts Per Feature)

**Role:** Domain-matched experts review each feature in depth
**Task:** Go beyond surface-level feedback — dissect each major feature thoroughly.

**For each major feature, assign the right experts:**

---

**Feature: Period Prediction Algorithm**
*Experts: Dr. Maya (medical accuracy) + Priya (retention value) + Sarah (UX of prediction display)*

- Is the prediction scientifically sound?
- How should uncertainty/confidence be communicated to users?
- What data inputs would make it significantly more accurate?
- How does showing predictions affect user behavior and trust?
- What happens when it's wrong — how should the app handle that?

---

**Feature: iOS Health Sync / Android Health Integration**
*Experts: Dr. Maya (health data) + Marcus (privacy) + Sarah (onboarding UX)*

- Is syncing health data the right approach vs manual input?
- What are the privacy implications of reading from HealthKit?
- How should permission requests be framed to maximize trust?
- What data should and shouldn't be synced?

---

**Feature: Partner / Boyfriend (Sun) Experience**
*Experts: James (relationship psychology) + David (couples app strategy) + Sarah (UX)*

- Is the partner experience genuinely useful or performative?
- What information should partners see vs what is private?
- How should the app frame partner data to avoid surveillance dynamics?
- What partner features would create real relationship value?
- How do you keep the partner engaged long-term?

---

**Feature: Whisper & SOS System**
*Experts: James (emotional safety) + David (couples engagement) + Priya (habit formation)*

- Do whisper options feel natural or forced?
- Is the SOS system genuinely helpful in tough moments?
- How can these features strengthen emotional vocabulary between partners?
- What's the risk of signal fatigue?

---

**Feature: Onboarding Flow**
*Experts: Sarah (UX) + Priya (retention) + Dr. Maya (health literacy)*

- At what point do users drop off and why?
- Is the right information being collected at the right time?
- What is the minimum viable onboarding to get to first value?
- How do you onboard a couple vs an individual?

---

**Feature: Notifications & Reminders**
*Experts: Priya (behavioral triggers) + James (relationship dynamics) + Dr. Maya (health context)*

- Are notifications driving genuine engagement or training users to ignore?
- What notification cadence is optimal?
- How should cycle phase notifications be framed for the partner?
- What notifications would feel caring vs clinical vs annoying?
- Note: Sun notifications are always-on by design — is this the right call?

---

**Feature: AI-Powered Content (Greetings, Insights, Advice)**
*Experts: Dr. Maya (medical accuracy) + James (tone/empathy) + Priya (engagement value)*

- Is AI content adding genuine value or just filling space?
- Is health-related AI content medically safe?
- Does the "no AI terminology" rule work for user trust?
- What content types are missing?

---

**Feature: Data & Privacy Model**
*Experts: Marcus (privacy/compliance) + Dr. Maya (health data sensitivity) + James (relationship trust)*

- Is intimate health data being protected adequately?
- What data is being collected that isn't necessary?
- How should data sharing between partners be controlled?
- What privacy features would build user trust and differentiate the app?

---

**Save as:** `docs/advisory/[EAP_ID]_feature_deep_dives.md`

---

### PHASE 5 — Ideas + Innovation Session (All 6 Experts)

**Role:** All experts, now in creative advisory mode
**Task:** Each expert proposes bold ideas — features, improvements, or directions — that would make this app significantly better.

**Rules for this session:**
- No idea is too big or too small
- Every idea must explain the "why" — what user problem does it solve?
- Ideas can be UI, UX, functionality, data, business model, or anything
- Experts can build on each other's ideas
- Each expert must propose at least 3 ideas in their domain

**Format per idea:**
```
### Idea: [Name]
**Proposed by:** [Expert]
**What it is:** [1-2 sentence description]
**Problem it solves:** [specific user pain or missed opportunity]
**Why it would work:** [reasoning from expert's domain]
**Rough complexity:** Small / Medium / Large
**Impact potential:** High / Medium / Low
```

**Categories to cover:**
- Health intelligence improvements
- Relationship & couples features
- UX & design improvements
- Privacy & trust features
- Retention & habit formation
- Couple engagement mechanics
- Completely new feature ideas
- "Why doesn't this app already do X?"
- Vietnamese market-specific ideas

**Save as:** `docs/advisory/[EAP_ID]_ideas_innovations.md`

---

### PHASE 6 — Strategic Roadmap Advisory (David + Priya)

**Role:** David Lim (product strategy) + Priya Nair (growth & retention)
**Task:** Give high-level strategic direction — where should this app go in the next 6–12 months?

**Deliverables:**

**A. Product Identity**
- What should this app be known for?
- What is its defensible position in the market?
- Who is the primary user — her, him, or the couple?

**B. The Retention Roadmap**
- What is the current likely 30-day retention rate and why?
- What are the top 3 retention killers to fix first?
- What habit loop should this app be building?
- What would make this app part of a couple's weekly routine?

**C. Feature Prioritization Framework**
Rate every feature idea from Phase 5:
- User impact: High / Medium / Low
- Technical effort: High / Medium / Low
- Strategic alignment: Core / Adjacent / Nice-to-have
- Recommended sprint: Now / Next / Later / Never

**D. The 6-Month Vision**
If the team executes well, what does this app look like in 6 months?
What 3 things, if built, would make this the must-have app for couples?

**Save as:** `docs/advisory/[EAP_ID]_strategic_advisory.md`

---

### PHASE 7 — PM Agent: Synthesis

**Role:** Senior Product Manager
**Task:** Read all expert input and synthesize into a unified, de-duplicated view.

**Deliverables:**

**A. Master Issue List**
Every problem identified, de-duplicated, cross-referenced by how many experts flagged it:

| ID | Issue | Flagged By | Domain | Severity | Type |
|---|---|---|---|---|---|
| ISS-001 | Partner view shows data without context | James, David, Sarah | Relationship/UX | High | Change Request |

**B. Master Ideas List**
Every idea proposed, organized by category and complexity

**C. Cross-Domain Patterns**
Issues or opportunities that multiple experts independently identified — these are the highest-confidence findings

**D. Conflicts & Tensions**
Places where experts disagreed — note both perspectives, flag for PM decision

**Save as:** `docs/advisory/[EAP_ID]_synthesis.md`

---

### PHASE 8 — PM Agent: Prioritized Action Plan

**Role:** Senior Product Manager
**Task:** Turn synthesis into a concrete, prioritized action plan with routing to correct pipelines.

**Deliverables:**

**A. Now (This Sprint)**
Issues to fix immediately — critical severity, clear solution

| Priority | Issue/Idea | Action | Route To | Owner |
|---|---|---|---|---|
| P0 | Onboarding drop-off at health permission | Redesign permission request with trust-building copy | CHANGE_REQUEST_PIPELINE | — |

**B. Next (Next 2 Sprints)**
High-value improvements with clear scope

**C. Later (Backlog)**
Good ideas, not urgent

**D. Never (Rejected)**
Ideas that don't fit product direction — with explanation why

**E. Quick Win List**
Things that can be done in under 1 day with high impact — do these first

**F. Routing Summary**
```
→ BUG_FIX_PIPELINE:                [list issues]
→ CHANGE_REQUEST_PIPELINE:         [list changes]
→ FEATURE_DEVELOPMENT_PIPELINE:    [list new features]
→ USER_PERSONA_TESTING_PIPELINE:   [list things to validate with Linh & Minh]
```

**G. Downstream Standards Reminder**
All routed items MUST follow `docs/skills/TESTING_STANDARDS.md` during implementation:
- Device-test requirements cannot be verified by code-inspection alone
- UI/layout changes require Layout Chain Trace
- User confirmation gate for device-test cases

**Save as:** `docs/advisory/[EAP_ID]_action_plan.md`

---

## Output File Checklist

> Replace `[EAP_ID]` with format: `EAP_YYYYMMDD_NNN`

- [ ] `docs/advisory/[EAP_ID]_setup.md`
- [ ] `docs/advisory/[EAP_ID]_expert_reviews.md`
- [ ] `docs/advisory/[EAP_ID]_panel_discussion.md`
- [ ] `docs/advisory/[EAP_ID]_feature_deep_dives.md`
- [ ] `docs/advisory/[EAP_ID]_ideas_innovations.md`
- [ ] `docs/advisory/[EAP_ID]_strategic_advisory.md`
- [ ] `docs/advisory/[EAP_ID]_synthesis.md`
- [ ] `docs/advisory/[EAP_ID]_action_plan.md`
- [ ] All issues routed to correct downstream pipeline

---

## How All Skills Work Together

```
                    ┌─────────────────────────┐
                    │   EXPERT ADVISOR PANEL  │
                    │  "What should we build  │
                    │   and how to do it?"    │
                    └────────────┬────────────┘
                                 │ feeds into
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
   ┌──────────────────┐  ┌─────────────┐  ┌──────────────────┐
   │ FEATURE PIPELINE │  │  BUG FIX   │  │ CHANGE REQUEST   │
   │  "Build it"      │  │  PIPELINE  │  │    PIPELINE      │
   └──────────────────┘  │ "Fix it"   │  │  "Improve it"    │
                         └─────────────┘  └──────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  USER PERSONA TESTING   │
                    │  "Does it work for      │
                    │   real people?"         │
                    └─────────────────────────┘
```

---

## Output Files

All saved to `docs/advisory/[EAP_ID]_*.md`: setup, expert_reviews, panel_discussion, feature_deep_dives, ideas_innovations, strategic_advisory, synthesis, action_plan.

> **Pipeline quick reference:** See `docs/skills/PIPELINE_SHARED.md`
