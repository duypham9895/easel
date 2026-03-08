# Change Request Pipeline — Multi-Agent Workflow

> **Skill File:** `docs/skills/CHANGE_REQUEST_PIPELINE.md`
> **Related Skills:**
> - `docs/skills/BUG_FIX_PIPELINE.md`
> - `docs/skills/FEATURE_DEVELOPMENT_PIPELINE.md`
> - `docs/skills/USER_PERSONA_TESTING_PIPELINE.md`
> - `docs/skills/TESTING_STANDARDS.md` — **MANDATORY** testing standards for all pipelines

---

## Agent Team Execution Mode

**MANDATORY:** This pipeline uses parallel agent execution. Launch independent phases as concurrent Agent tool calls in a single message.

### Dependency Graph

```
Phase 0 (Change Analysis)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 1 (UX Impact) Phase 2 (Copy Updates)  ← PARALLEL (both conditional)
    │                  │
    └────────┬─────────┘
             ▼
Phase 3 (Technical Impact)
             │
             ▼
Phase 4 (Test Cases)
             │
             ▼
Phase 5 (Implementation)
             │
             ▼
Phase 6 (Test Execution)
             │
    ┌────────┴─────────┐
    ▼                  ▼
Phase 7 (Report)   Phase 8 (Release Note)   ← PARALLEL
```

### Orchestration Rules

| Step | Action | Agent Tool Calls |
|---|---|---|
| 1 | Run Phase 0 | 1 agent (PM — Change Analysis) |
| 2 | Run Phases 1+2 in parallel | 2 agents simultaneously: UX Design + Copywriting (skip either if not applicable) |
| 3 | Merge outputs, run Phase 3 | 1 agent (SWE — Technical Impact) — reads Analysis + UX + Copy |
| 4 | Run Phase 4 | 1 agent (QA — Test Cases) — reads all previous docs |
| 5 | Run Phase 5 | 1 agent (SWE — Implementation) |
| 6 | Run Phase 6 | 1 agent (QA — Test Execution) |
| 7 | Run Phases 7+8 in parallel | 2 agents simultaneously: TPM Report + Tech Writer Release Note |

### How to Launch Parallel Agents

```
# Step 2 — launch BOTH in a single message:
Agent(subagent_type="general-purpose", prompt="[Phase 1 — UX Impact] ...")
Agent(subagent_type="general-purpose", prompt="[Phase 2 — Copy Updates] ...")

# Step 7 — launch BOTH in a single message:
Agent(subagent_type="general-purpose", prompt="[Phase 7 — Change Report] ...")
Agent(subagent_type="general-purpose", prompt="[Phase 8 — Release Note] ...")
```

### Context Passing Between Agents

Each agent receives the full context it needs via its prompt:
- Include the change description and all previously generated doc file paths
- Agents read the output files from previous phases
- Sequential agents MUST wait for parallel agents to complete before starting

---

## Trigger Patterns

Activate this pipeline automatically when the request contains any of:

- `"change request"`
- `"change [X] to [Y]"`
- `"update [X]"`
- `"modify [X]"`
- `"adjust [X]"`
- `"i want [X] to behave differently"`
- `"can we change how [X] works"`
- `"revise [X]"`
- `"the [X] should be [Y] instead"`
- `"improve [X]"` (existing behavior, not new feature)

---

## Auto-Detection Logic

```
IF request is about something BROKEN that should work:
-> ACTIVATE: BUG_FIX_PIPELINE

IF request is about something that DOESN'T EXIST yet:
-> ACTIVATE: FEATURE_DEVELOPMENT_PIPELINE

IF request is about something that EXISTS and WORKS
   but needs to BEHAVE DIFFERENTLY or LOOK DIFFERENT:
-> ACTIVATE: CHANGE_REQUEST_PIPELINE

IF ambiguous:
-> ASK: "Is this fixing something broken, adding something new,
        or changing how something existing works?"
-> Wait for answer, then activate correct pipeline
```

---

## Why Change Request Is Different

| Aspect | Bug Fix | New Feature | Change Request |
|---|---|---|---|
| Current state | Broken | Doesn't exist | Works, but needs to change |
| Starting point | Reproduce the bug | Write PRD from scratch | Understand current + desired state |
| Risk | Fix without breaking others | Build without breaking others | Change without breaking others |
| Scope driver | Root cause | Requirements | Delta between old and new |
| Hardest part | Finding root cause | Defining requirements | Managing side effects of the change |
| PM focus | Triage severity | Define full scope | Assess impact of delta |
| QA focus | Bug gone + no regression | Feature works + no regression | Old behavior replaced correctly + no regression |

---

## Pipeline Overview

| Phase | Agent Role | Output |
|---|---|---|
| 0 | PM — Change Analysis | `[CR_ID]_analysis.md` |
| 1 | UX/Design — Impact on UX | `[CR_ID]_ux_impact.md` *(if UI change)* |
| 2 | Copywriting — Copy Updates | `[CR_ID]_copy_updates.md` *(if text change)* |
| 3 | SWE — Technical Impact Assessment | `[CR_ID]_technical_impact.md` |
| 4 | QA — Test Case Writing | `[CR_ID]_test_cases.md` |
| 5 | SWE — Implementation | `[CR_ID]_implementation_notes.md` |
| 6 | QA — Test Execution | `[CR_ID]_test_execution_report.md` |
| 7 | TPM — Change Report | `[CR_ID]_change_report.md` |
| 8 | Technical Writer — Release Note | `[CR_ID]_release_note.md` |

> **CR ID format:** `CR_YYYYMMDD_NNN` (e.g. `CR_20260308_001`)

> **Note:** Phases 1 and 2 are conditional — skip if the change does not affect UI or copy.

---

## Full Pipeline Definition

---

### PHASE 0 — Product Manager Agent (Change Analysis)

**Role:** Senior Product Manager
**Task:** Fully understand, document, and assess the change before anything is touched.

**Deliverables — Change Analysis document including:**

- Change ID and title
- Requestor and date
- **Current behavior** — exactly how it works today (with reference to screen, flow, or feature)
- **Desired behavior** — exactly how it should work after the change
- **Delta statement** — one clear sentence: *"Change [X] from [current] to [desired]"*
- Business justification: why is this change needed?
- Change type classification:
  - `UI/Visual` — appearance, layout, colors, typography
  - `UX/Flow` — user journey, interaction, navigation
  - `Functional` — logic, rules, calculations, data behavior
  - `Copy` — text, labels, messages, tone
  - `Performance` — speed, load time, optimization
  - `Configuration` — settings, defaults, toggles
  - `Multiple` — combination of above

> **Change type determines test verification method** (see `docs/skills/TESTING_STANDARDS.md` § 1):
> - `UI/Visual`, `UX/Flow` → require `device-test` or `device-test + screenshot`
> - `Functional`, `Performance`, `Configuration` → may use `code-inspection` or `unit-test`
> - `Copy` → content correctness: `code-inspection`; rendering: `device-test`
> - `Multiple` → use the strictest method required by any sub-type

- Affected screens / features / flows (list all, even indirect)
- Users affected: all users / specific segment / specific condition
- Priority: High / Medium / Low
- Urgency: Must release by [date] / No hard deadline
- Acceptance criteria — how do we know the change is done correctly?
- Out of scope — what explicitly is NOT changing
- Open questions (tag as `[DECISION NEEDED]` — must be resolved before Phase 5)

**Save as:** `docs/changes/[CR_ID]_analysis.md`

> Warning: If the desired behavior conflicts with an existing PRD or design decision, flag it as `[CONFLICT]` and resolve before proceeding.

---

### PHASE 1 — Design Agent (UX Impact Assessment)

**Role:** Senior UI/UX Designer
**Condition:** Run this phase ONLY if the change affects UI, layout, visual design, or user flow.

**Deliverables:**

- Which screens are affected (list with current vs new state)
- Component-level changes needed
- Updated screen flow or layout spec
- Before/After comparison per affected screen
- Edge cases: empty states, loading states, error states, long text / small screen
- Design system consistency check
- Flag any design conflicts: `[DESIGN CONFLICT]`

**Save as:** `docs/changes/[CR_ID]_ux_impact.md`

> Skip if change is purely backend logic, copy-only, or performance-only.

---

### PHASE 2 — Copywriting Agent (Copy Updates)

**Role:** UX Copywriter
**Condition:** Run this phase ONLY if the change affects any user-facing text.

**Deliverables:**

- Inventory of all affected copy (screen by screen, component by component)
- For each piece of copy: Location, Current copy, New copy, Reason for change
- Tone consistency check
- Any new copy needed

**Save as:** `docs/changes/[CR_ID]_copy_updates.md`

> Skip if change has zero impact on user-facing text.

---

### PHASE 3 — Software Engineer Agent (Technical Impact Assessment)

**Role:** Expert Software Engineer
**Task:** Before writing any code, assess the full technical impact.

**Steps:**

1. Read ALL previous phase documents
2. Map change to codebase: files, components, functions, dependencies, data model, API, state
3. Identify side effects: shared data, shared components, platform-specific considerations
4. Assess complexity: Small (< 2hrs) / Medium (2-8hrs) / Large (> 8hrs)
5. Flag clarifications needed: `[CLARIFICATION NEEDED -- PM/DESIGN/QA]`
6. Propose implementation approach with rationale
7. Flag technical debt introduced or resolved

**Save as:** `docs/changes/[CR_ID]_technical_impact.md`

> Resolve ALL `[CLARIFICATION NEEDED]` and `[DECISION NEEDED]` before Phase 4.

---

### PHASE 4 — QA Agent (Test Case Writing)

**Role:** Expert QA Engineer
**Task:** Write complete test cases before implementation begins.

**Test categories:**

A. **Change Verification** — new behavior works per acceptance criteria
B. **Backward Compatibility** — existing data/state still works
C. **Regression** — features sharing components/data with changed area
D. **Edge Cases** — all edge cases from design and technical phases

**Test case format:**

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-001 | ... | ... | Change Verification / Backward Compat / Regression / Edge Case | `code-inspection` / `device-test` / `device-test + screenshot` | ... | ... | ... | P0 / P1 / P2 |

> **Verification Method rules:** See `docs/skills/TESTING_STANDARDS.md` § 1.
> - Verification method MUST match the change type from Phase 0
> - UI/Visual and UX/Flow changes require `device-test` — no exceptions
> - Code inspection CANNOT pass a test that requires device verification

Priority: P0 (must pass), P1 (should pass), P2 (nice to have). P0 failure = block release.

**Save as:** `docs/changes/[CR_ID]_test_cases.md`

---

### PHASE 5 — Software Engineer Agent (Implementation)

**Role:** Expert Software Engineer
**Task:** Implement the change based on all previous phase documents.

**Steps:**

1. Read ALL phase documents (0-4)
2. Confirm all clarifications resolved
3. Implement changes per Phase 3 approach, Phase 1 design, Phase 2 copy
4. Change scope discipline: ONLY what is in scope. Log related improvements as separate CRs.
5. Self-review checklist before QA handoff

**Save as:** `docs/changes/[CR_ID]_implementation_notes.md`

---

### PHASE 6 — QA Agent (Test Execution)

**Role:** Expert QA Engineer
**Task:** Execute ALL test cases from Phase 4.

> **MANDATORY:** Follow `docs/skills/TESTING_STANDARDS.md` for all verification rules.

**Step 1 — Automated verification:**

1. Run `npx tsc --noEmit` — verify build passes
2. Run existing unit/integration tests — verify no regressions
3. Execute `code-inspection` test cases — read code, verify logic
4. Execute `build-check` test cases — verify compilation, types
5. Execute `unit-test` test cases — write and run automated tests

**Step 2 — Device verification (MANDATORY for UI/Visual and UX/Flow changes):**

6. Mark ALL `device-test` and `device-test + screenshot` cases as `UNTESTED`
7. Tell the user exactly what to verify on device:
   - List each device-test case with specific things to check
   - Reference the Before/After from Phase 1 (UX Impact) if applicable
8. Wait for user confirmation before proceeding

**Step 3 — Record results:**

For each test case:
- `PASS` — verified (with evidence)
- `FAIL` — document: test case ID, actual vs expected, severity
- `UNTESTED` — requires device verification not yet confirmed

**Failure handling:**
- Verification FAIL → Return to Phase 5
- Backward Compat FAIL → Return to Phase 5 (handle migration)
- Regression FAIL → Return to Phase 5 (fix side effects)
- Device-test UNTESTED → CANNOT proceed to Phase 7 until user confirms

**Exit condition:**
- All P0+P1 PASS (including device-test confirmed by user)
- Zero unintended regressions
- New behavior matches acceptance criteria (verified on device for UI changes)
- Zero UNTESTED cases remaining

**Save as:** `docs/changes/[CR_ID]_test_execution_report.md`

---

### PHASE 7 — Change Report

**Role:** Technical Program Manager

**Report includes:** Change summary, business justification, scope, files changed, design/copy changes, test coverage, backward compatibility status, regression status, scope deviations, release recommendation.

**Confidence level:** High / Medium / Low
- `High` = ALL tests verified including device-test confirmed by user
- `Low` = any device-test cases UNTESTED or unconfirmed

**Save as:** `docs/changes/[CR_ID]_change_report.md`

---

### PHASE 8 — Release Note

**Role:** Technical Writer

**Deliverables:**
- **User-facing:** What changed, benefits, what to know
- **Internal changelog:** Technical changes, affected components, migration notes
- **Developer note:** Files modified, APIs changed, breaking changes

**Save as:** `docs/changes/[CR_ID]_release_note.md`

---

## QA <-> SWE Loop Protocol

```
LOOP START
  QA executes test cases
  IF verification FAIL -> SWE fixes, QA re-runs FULL suite
  IF backward compat FAIL -> SWE handles transition, QA re-runs FULL suite
  IF regression FAIL -> SWE fixes side effect only, QA re-runs FULL suite
  IF all P0 + P1 PASS AND zero regressions -> EXIT LOOP -> Phase 7
LOOP END
```

---

## Change Scope Discipline (Hard Rule for SWE)

1. Implement ONLY what is defined in `[CR_ID]_analysis.md`
2. Related improvements discovered during implementation -> log as new CR
3. Every line changed must map to an accepted requirement or identified side effect
4. If more scope needed than assessed -> STOP and flag to PM
5. Document ALL scope deviations as `[SCOPE DEVIATION]`

---

## Output File Checklist

- [ ] `docs/changes/[CR_ID]_analysis.md`
- [ ] `docs/changes/[CR_ID]_ux_impact.md` *(if UI change)*
- [ ] `docs/changes/[CR_ID]_copy_updates.md` *(if copy change)*
- [ ] `docs/changes/[CR_ID]_technical_impact.md`
- [ ] `docs/changes/[CR_ID]_test_cases.md`
- [ ] `docs/changes/[CR_ID]_implementation_notes.md`
- [ ] `docs/changes/[CR_ID]_test_execution_report.md`
- [ ] `docs/changes/[CR_ID]_change_report.md`
- [ ] `docs/changes/[CR_ID]_release_note.md`
- [ ] All `device-test` cases: confirmed by user on device
- [ ] Confidence level: matches `TESTING_STANDARDS.md` constraints

---

## All Three Pipelines — Quick Reference

| Trigger | Pipeline | Starting Point |
|---|---|---|
| Something is **broken** | `BUG_FIX_PIPELINE` | Reproduce the bug |
| Something **doesn't exist** yet | `FEATURE_DEVELOPMENT_PIPELINE` | Write PRD |
| Something **exists but needs to change** | `CHANGE_REQUEST_PIPELINE` | Define current vs desired |
| Does the app **matter to real people**? | `USER_PERSONA_TESTING_PIPELINE` | Define personas + scenarios |
