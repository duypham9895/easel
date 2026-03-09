# Feature Development Pipeline — Multi-Agent Workflow

> **Skill File:** `docs/skills/FEATURE_DEVELOPMENT_PIPELINE.md`
> **Related Skills:**
> - `docs/skills/BUG_FIX_PIPELINE.md`
> - `docs/skills/CHANGE_REQUEST_PIPELINE.md`
> - `docs/skills/USER_PERSONA_TESTING_PIPELINE.md`
> - `docs/skills/TESTING_STANDARDS.md` — **MANDATORY** testing standards for all pipelines

---

## Execution Mode

> **Shared orchestration rules:** See `docs/skills/PIPELINE_SHARED.md` for parallel execution, auto-detection, QA-SWE loop, and scope discipline.

**Parallel phases:** 0 -> (1+2) -> 3 -> 4 -> 5 -> 6 -> (7+8). Phase 2 conditional (skip if no user-facing text).

**Triggers:** "add [X]", "build [X]", "create [X]", "new feature", "implement [X]", "i want [X]", "feature request"

---

## Pipeline Overview

| Phase | Agent Role | Output |
|---|---|---|
| 0 | PM — Product Requirements | `[FEAT_ID]_prd.md` |
| 1 | UX/Design — Design Spec | `[FEAT_ID]_design_spec.md` |
| 2 | Copywriting — Copy Spec | `[FEAT_ID]_copy_spec.md` *(if user-facing)* |
| 3 | Architect — Technical Design | `[FEAT_ID]_technical_design.md` |
| 4 | QA — Test Case Writing | `[FEAT_ID]_test_cases.md` |
| 5 | SWE — Implementation | `[FEAT_ID]_implementation_notes.md` |
| 6 | QA — Test Execution | `[FEAT_ID]_test_execution_report.md` |
| 7 | TPM — Feature Report | `[FEAT_ID]_feature_report.md` |
| 8 | Technical Writer — Release Note | `[FEAT_ID]_release_note.md` |

> **FEAT ID format:** `FEAT_YYYYMMDD_NNN` (e.g. `FEAT_20260308_001`)

> **Note:** Phase 2 is conditional — skip if the feature has no user-facing text.

---

## Full Pipeline Definition

---

### PHASE 0 — Product Manager Agent (Product Requirements Document)

**Role:** Senior Product Manager
**Task:** Define the feature completely before any design or code begins.

**Deliverables — PRD including:**

- Feature ID and title
- Requestor and date
- **Problem statement** — what problem does this solve? Who has this problem?
- **Target users** — Moon, Sun, or both? All users or specific segment?
- **User stories** — as [role], I want [action], so that [benefit]
- **Requirements:**
  - Functional requirements (what it must do)
  - Non-functional requirements (performance, security, accessibility)
- **Acceptance criteria** — specific, testable conditions for "done"
- **Scope:**
  - In scope (what we ARE building)
  - Out of scope (what we are NOT building — and why)
  - Future scope (what we might build later)
- **Dependencies:**
  - Backend/database changes needed
  - New API endpoints needed
  - Third-party integrations
  - Other features this depends on
- **Risks and mitigations**
- **Success metrics** — how do we measure if this feature works?
- **Priority:** High / Medium / Low
- **Open questions** (tag as `[DECISION NEEDED]`)

**Save as:** `docs/features/[FEAT_ID]_prd.md`

> Warning: ALL `[DECISION NEEDED]` items must be resolved before Phase 3 (Technical Design).

---

### PHASE 1 — Design Agent (Design Specification)

**Role:** Senior UI/UX Designer
**Task:** Design the feature's user experience and visual interface.

**Deliverables:**

- **User flow** — step-by-step journey through the feature
- **Screen inventory** — list of new/modified screens
- **Screen specs** — for each screen:
  - Layout description
  - Components used (existing from design system vs new)
  - States: default, loading, empty, error, success
  - Interactions: taps, swipes, gestures, animations
- **Navigation** — how users get to/from this feature
- **Role-specific design** — Moon vs Sun differences (if applicable)
- **Responsive considerations** — small screens, large text, landscape
- **Accessibility** — color contrast, screen reader support, touch targets
- **Design system impact:**
  - New components needed
  - Existing components to reuse
  - Theme/color considerations (Moon dark vs Sun light)
- **Edge cases** — what happens when data is missing, network fails, etc.

**Save as:** `docs/features/[FEAT_ID]_design_spec.md`

---

### PHASE 2 — Copywriting Agent (Copy Specification)

**Role:** UX Copywriter
**Condition:** Run this phase ONLY if the feature has user-facing text.

**Deliverables:**

- **Copy inventory** — all text needed (labels, buttons, messages, tooltips, errors)
- For each piece of copy:
  - Location (screen, component, state)
  - English text
  - Vietnamese text
  - Tone notes (warm, urgent, celebratory, etc.)
- **i18n keys** — proposed translation key names following existing convention
- **Dynamic copy** — text that includes variables (names, dates, counts)
- **AI-generated copy** — any text that comes from the AI proxy (identify which)
- **Tone consistency** — verification that new copy matches app voice

**Save as:** `docs/features/[FEAT_ID]_copy_spec.md`

> Skip if feature is purely backend/logic with no user-facing text.

---

### PHASE 3 — Architect Agent (Technical Design)

**Role:** Expert Software Architect
**Task:** Design the technical implementation before any code is written.

**Deliverables:**

- **Architecture overview** — how this feature fits into the existing system
- **Data model:**
  - New tables/columns needed (with RLS policies)
  - Migration plan (new migration file number)
  - Indexes needed
- **State management:**
  - New Zustand store fields/actions needed
  - AsyncStorage persistence considerations
  - Realtime subscription needs
- **API design:**
  - New Supabase queries (with exact column selections)
  - New proxy endpoints (if AI-powered)
  - New Edge Functions (if background processing)
- **Component architecture:**
  - New components to create (with props interface)
  - Existing components to modify
  - Hook design (new custom hooks)
- **File plan** — exact files to create/modify with purpose
- **Implementation sequence** — ordered steps (what to build first)
- **Integration points** — where this connects to existing features
- **Performance considerations** — caching, lazy loading, optimistic updates
- **Security considerations** — RLS, auth, input validation
- **Platform considerations** — iOS vs Android differences
- **Technical risks** and mitigation strategies

**Save as:** `docs/features/[FEAT_ID]_technical_design.md`

> Rule: Resolve ALL `[DECISION NEEDED]` from Phase 0 before completing this phase.

---

### PHASE 4 — QA Agent (Test Case Writing)

**Role:** Expert QA Engineer
**Task:** Write comprehensive test cases before implementation.

**Test categories:**

A. **Feature Verification** — each acceptance criterion has test cases
B. **User Flow** — end-to-end journey through the feature
C. **Edge Cases** — empty states, errors, boundary conditions, missing data
D. **Role-specific** — Moon vs Sun behavior differences
E. **Integration** — interactions with existing features
F. **Regression** — existing features that might be affected

**Test case format:**

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-001 | ... | ... | Feature / User Flow / Edge Case / Regression | `code-inspection` / `device-test` / `device-test + screenshot` | ... | ... | ... | P0 / P1 / P2 |

> **Verification Method rules:** See `docs/skills/TESTING_STANDARDS.md` § 1.
> - UI/layout/visual/animation tests MUST use `device-test` or `device-test + screenshot`
> - Logic/data/RLS/API tests may use `code-inspection` or `unit-test`
> - Code inspection CANNOT pass a test that requires device verification

Priority: P0 (must pass), P1 (should pass), P2 (nice to have). P0 failure = block release.

**Save as:** `docs/features/[FEAT_ID]_test_cases.md`

---

### PHASE 5 — Software Engineer Agent (Implementation)

**Role:** Expert Software Engineer
**Task:** Build the feature based on all previous phase documents.

**Steps:**

1. Read ALL phase documents (0-4)
2. Confirm all `[DECISION NEEDED]` items resolved
3. Follow implementation sequence from Phase 3
4. Implementation order:
   a. Database migration (if needed)
   b. Data access layer (`lib/db/`)
   c. Store actions (`store/appStore.ts`)
   d. Hooks (custom React hooks)
   e. Components (UI)
   f. Screens (routing/navigation)
   g. Translations (`i18n/en/`, `i18n/vi/`)
   h. Proxy endpoints (if AI-powered)
5. Apply copy from Phase 2
6. Follow design spec from Phase 1
7. Scope discipline:
   - Build ONLY what is in the PRD
   - Unrelated improvements -> log as separate items
   - Document scope deviations as `[SCOPE DEVIATION]`
8. Self-review checklist:
   - [ ] All acceptance criteria from Phase 0 met
   - [ ] Design spec from Phase 1 implemented
   - [ ] All copy from Phase 2 applied (EN + VI)
   - [ ] Technical design from Phase 3 followed
   - [ ] RLS policies added for new tables
   - [ ] Both Moon and Sun roles work correctly
   - [ ] Existing tests still pass
   - [ ] No hardcoded values, no debug logs
   - [ ] TypeScript strict mode — no `any` types

**Save as:** `docs/features/[FEAT_ID]_implementation_notes.md`

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

**Step 2 — Device verification (MANDATORY for features with UI):**

6. Mark ALL `device-test` and `device-test + screenshot` cases as `UNTESTED`
7. Tell the user exactly what to verify on device:
   - List each device-test case with specific things to check
   - Include both Moon and Sun roles if applicable
   - Include both EN and VI languages if applicable
8. Wait for user confirmation before proceeding

**Step 3 — Record results:**

For each test case:
- `PASS` — verified (with evidence)
- `FAIL` — document: test case ID, actual vs expected, severity
- `UNTESTED` — requires device verification not yet confirmed

**Failure handling:**
- Feature Verification FAIL → Return to Phase 5 with specific failures
- Integration FAIL → Return to Phase 5, fix interaction
- Regression FAIL → Return to Phase 5, fix side effects
- Device-test UNTESTED → CANNOT proceed to Phase 7 until user confirms

**Exit condition:**
- All P0+P1 PASS (including device-test confirmed by user)
- Zero regressions
- Feature matches acceptance criteria (verified on device for UI features)
- Both roles work correctly
- Both languages display correctly
- Zero UNTESTED cases remaining

**Save as:** `docs/features/[FEAT_ID]_test_execution_report.md`

---

### PHASE 7 — Feature Report

**Role:** Technical Program Manager
**Task:** Write comprehensive feature summary.

**Report includes:**

- Feature summary
- Problem solved
- User stories delivered
- Screens/flows added or modified
- Files created/modified
- Database changes
- API changes
- Test coverage summary
- Regression status
- Known limitations
- Future enhancements (from "out of scope")
- Release recommendation
- Confidence level: High / Medium / Low
  - `High` = ALL tests verified including device-test confirmed by user
  - `Low` = any device-test cases UNTESTED or unconfirmed

**Save as:** `docs/features/[FEAT_ID]_feature_report.md`

---

### PHASE 8 — Release Note

**Role:** Technical Writer
**Task:** Write release note for this feature.

**Deliverables:**

- **User-facing:** What's new, how to use it, benefits — plain language, benefit-focused
- **Internal changelog:** Technical details, new components, new endpoints
- **Developer note:** Files added/modified, new DB tables, API changes, migration notes

**Save as:** `docs/features/[FEAT_ID]_release_note.md`

---

## Output Files

All saved to `docs/features/[FEAT_ID]_*.md`: prd, design_spec, copy_spec, technical_design, test_cases, implementation_notes, test_execution_report, feature_report, release_note.

> **QA-SWE loop, scope discipline, quick reference:** See `docs/skills/PIPELINE_SHARED.md`
