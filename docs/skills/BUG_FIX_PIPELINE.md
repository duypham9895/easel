# 🐛 Bug Fix Pipeline — Multi-Agent Workflow

> **Skill File:** `docs/skills/BUG_FIX_PIPELINE.md`
> **Related Skills:**
> - `docs/skills/FEATURE_DEVELOPMENT_PIPELINE.md`
> - `docs/skills/CHANGE_REQUEST_PIPELINE.md`
> - `docs/skills/USER_PERSONA_TESTING_PIPELINE.md`
> - `docs/skills/TESTING_STANDARDS.md` — **MANDATORY** testing standards for all pipelines

---

## Execution Mode

> **Shared orchestration rules:** See `docs/skills/PIPELINE_SHARED.md` for parallel execution, auto-detection, QA-SWE loop, and scope discipline.

**Parallel phases:** 0 -> (1+2) -> 3 -> 4 -> 5 -> (6+7).

**Triggers:** "fix this bug", "something is broken", "not working", "fix [X]", "investigate [X]"

---

## Pipeline Overview

| Phase | Agent Role | Output |
|---|---|---|
| 0 | QA + PM — Bug Triage | `[BUG_ID]_triage.md` |
| 1 | QA — Impact Mapping | `[BUG_ID]_impact_map.md` |
| 2 | SWE — Root Cause Analysis | `[BUG_ID]_root_cause.md` |
| 3 | QA — Test Case Writing | `[BUG_ID]_test_cases.md` |
| 4 | SWE — Fix Implementation | `[BUG_ID]_fix_notes.md` |
| 5 | QA — Test Execution | `[BUG_ID]_test_execution_report.md` |
| 6 | TPM — Fix Report | `[BUG_ID]_fix_report.md` |
| 7 | Technical Writer — Release Note | `[BUG_ID]_release_note.md` |

> **Bug ID format:** `BUG_YYYYMMDD_NNN` (e.g. `BUG_20260308_001`)

---

## Full Pipeline Definition

---

### PHASE 0 — Bug Triage Agent

**Role:** Senior QA Engineer + Product Manager  
**Task:** Before touching any code, fully understand and document the bug.

**Deliverables — Bug Report document including:**

- Bug ID and title
- Environment (iOS/Android, OS version, app version)
- Steps to reproduce (exact, numbered)
- Expected behavior (reference PRD or existing behavior)
- Actual behavior (what is broken)
- Severity classification:
  - `Critical` — app crash, data loss, security issue
  - `High` — core feature broken, no workaround
  - `Medium` — feature degraded, workaround exists
  - `Low` — cosmetic, minor UX issue
- Frequency: always / sometimes / rare
- Affected user scope: all users / specific condition
- Root cause hypothesis (initial guess before code investigation)
- Related features that MIGHT be affected by a fix
- Screenshot or error log description if available

**Save as:** `docs/bugs/[BUG_ID]_triage.md`

> ⚠️ **Rule:** If steps to reproduce cannot be confirmed, STOP and ask for clarification before proceeding. Never fix a bug you cannot reproduce.

---

### PHASE 1 — QA Agent (Impact Mapping)

**Role:** Expert QA Engineer  
**Task:** Before any fix, map the full blast radius of this bug and its potential fix.

**Deliverables — Impact map:**

- Which files / modules / components are directly involved
- Which other features share these files / modules / components
- Which user flows touch the affected code path
- Data models that may be affected
- API endpoints involved
- Edge cases that currently work but could break during fix

**Risk assessment:**

- High-risk areas to watch during fix
- Features that MUST be regression tested after fix
- Features that SHOULD be regression tested (lower risk but worth checking)

**Save as:** `docs/bugs/[BUG_ID]_impact_map.md`

---

### PHASE 2 — Software Engineer Agent (Root Cause Analysis)

**Role:** Expert Software Engineer  
**Task:** Investigate the codebase to confirm root cause before writing any fix.

**Steps:**

1. Read `[BUG_ID]_triage.md` and `[BUG_ID]_impact_map.md` fully
2. Trace the bug through the codebase — start from the symptom (UI/behavior) and trace backwards
3. Identify the exact line(s) or logic where the fault lives
4. Confirm or update the root cause hypothesis from Phase 0

**Document findings:**

- Confirmed root cause (specific file, function, line range)
- Why this bug exists (logic error, race condition, missing null check, wrong state, API contract mismatch, etc.)
- Why it wasn't caught before (missing test, edge case, new interaction between features)
- Proposed fix approach (2–3 options if applicable, with tradeoffs)
- Recommended fix with justification
- Flag risks: `[RISK]` — changes here may affect [X]
- Flag uncertainty: `[CLARIFICATION NEEDED]` — before fixing, confirm with PM/QA: [question]

**For UI/layout bugs — mandatory Layout Chain Trace:**

> See `docs/skills/TESTING_STANDARDS.md` § 6 for full requirements.

- Trace the full ancestor chain from the broken element to the screen root
- For each ancestor: document `flexDirection`, `justifyContent`, `alignItems`, `flex`, `width`, `padding`, `gap`
- Flag any conflicts: `flex: 1` inside a parent without explicit sizing, `width` conflicts with `flex`, `space-between` with nested flex
- Validate the proposed fix against the FULL chain — not just the target element
- Verify fix works for: narrowest screen (iPhone SE) AND widest (Pro Max), shortest AND longest content

**Save as:** `docs/bugs/[BUG_ID]_root_cause.md`

> ⚠️ **Rule:** Do NOT write fix code yet. Root cause must be documented and reviewed first.

---

### PHASE 3 — QA Agent (Test Case Writing)

**Role:** Expert QA Engineer  
**Task:** Based on triage + impact map + root cause analysis, write ALL test cases before the fix is implemented.

**Deliverables:**

**A. Bug Verification Test Cases**
- Confirm the bug is fixed after implementation
- Directly test the exact scenario from the bug report
- Include boundary conditions and edge cases around the bug

**B. Regression Test Cases**
- Cover ALL features identified in the impact map
- Prioritized: high-risk features get full coverage, lower-risk get smoke tests
- Include: happy path, error path, edge cases per feature

**C. Non-Regression Confirmation Cases**
- Explicitly test that the fix did NOT change behavior elsewhere
- "Things that worked before must still work" cases

**Test case format:**

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-001 | ... | ... | Bug Fix / Regression / Non-Regression | `code-inspection` / `device-test` / `device-test + screenshot` | ... | ... | ... | P0 / P1 / P2 |

> **Verification Method rules:** See `docs/skills/TESTING_STANDARDS.md` § 1.
> - UI/layout/visual tests MUST use `device-test` or `device-test + screenshot`
> - Logic/data/RLS tests may use `code-inspection`
> - Code inspection CANNOT pass a test that requires device verification

**Save as:** `docs/bugs/[BUG_ID]_test_cases.md`

> **Priority rules:**
> - `P0` = must pass before release
> - `P1` = should pass
> - `P2` = nice to have
> - Any P0 failure = **block release**

---

### PHASE 4 — Software Engineer Agent (Fix Implementation)

**Role:** Expert Software Engineer  
**Task:** Implement the fix based on root cause analysis and with full awareness of all test cases.

**Steps:**

1. Read ALL previous phase documents for this bug
2. Implement the recommended fix (from Phase 2)
3. While implementing:
   - Apply **minimal change principle** — change ONLY what is needed to fix the root cause, nothing more
   - For every file touched, ask: *"Does changing this line affect anything outside the bug scope?"* → If yes, add `[RISK NOTE]` comment
   - Do not refactor unrelated code in the same commit
   - Do not add new features or improvements beyond the fix
4. Write or update unit tests for the fixed function/module
5. Self-review checklist before handoff to QA:
   - [ ] Root cause addressed directly
   - [ ] No unintended side effects introduced
   - [ ] Existing unit tests still pass
   - [ ] New unit tests added for the fixed scenario
   - [ ] Code matches existing style/patterns of codebase
   - [ ] No hardcoded values, no debug logs left in

**Save as:** `docs/bugs/[BUG_ID]_fix_notes.md`

---

### PHASE 5 — QA Agent (Test Execution)

**Role:** Expert QA Engineer
**Task:** Execute ALL test cases from Phase 3 against the fix from Phase 4.

> **MANDATORY:** Follow `docs/skills/TESTING_STANDARDS.md` for all verification rules.

**Step 1 — Automated verification:**

1. Run `npx tsc --noEmit` — verify build passes
2. Run any existing unit tests — verify no regressions
3. Execute `code-inspection` test cases — read code, verify logic correctness
4. Execute `build-check` test cases — verify compilation, imports, types
5. Execute `unit-test` test cases — write and run automated tests

**Step 2 — Device verification (CANNOT be skipped for UI bugs):**

6. Mark ALL `device-test` and `device-test + screenshot` cases as `UNTESTED`
7. Tell the user exactly what to verify on device:
   - List each device-test case with specific things to check
   - Be precise: "Check that [X] displays as [Y] on the Settings screen"
8. Wait for user confirmation before proceeding

**Step 3 — Record results:**

For each test case:
- `PASS` — verified (with evidence: file:line for code, user confirmation for device)
- `FAIL` — document: test case ID, actual result, is this original bug or new regression?
- `UNTESTED` — requires device verification not yet confirmed

**Failure handling:**

- Bug Verification FAIL → Return to Phase 2 (Root Cause Analysis)
- Regression FAIL → Return to Phase 4 (Implementation)
- Device-test UNTESTED → CANNOT proceed to Phase 6 until user confirms

**Exit condition:**
- All P0 test cases: PASS (including device-test confirmed by user)
- All P1 test cases: PASS (or explicitly accepted as known issue)
- Zero new regressions introduced
- Original bug: confirmed fixed ON DEVICE
- Zero UNTESTED cases remaining

**Save as:** `docs/bugs/[BUG_ID]_test_execution_report.md`

---

### PHASE 6 — Fix Report

**Role:** Technical Program Manager  
**Task:** Write a complete bug fix summary report.

**Report includes:**

- Bug summary (from triage)
- Root cause confirmed
- Fix approach and rationale
- Files changed (list)
- Test coverage summary (total cases, pass/fail/blocked counts)
- Any P1 cases deferred (with justification)
- Regression status: `CLEAN` / `KNOWN ISSUES (list them)`
- Fix confidence level: High / Medium / Low + reasoning
- Confidence level constraints (from `TESTING_STANDARDS.md`):
  - `High` = ALL tests verified including device-test confirmed by user
  - `Low` = any device-test cases were UNTESTED or unconfirmed
  - Cannot claim High when visual verification is incomplete
- Recommendation: Safe to release / Needs monitoring / Defer

**Save as:** `docs/bugs/[BUG_ID]_fix_report.md`

---

### PHASE 7 — Release Note (Bug Fix Entry)

**Role:** Technical Writer  
**Task:** Write release note entry for this bug fix.

**Deliverables:**

- **User-facing:** Plain language, what was broken and now works, no technical jargon
- **Internal changelog:** Technical detail, root cause category, affected components, fix approach summary
- **Developer note:** Files changed, risk areas monitored, test coverage added

**Save as:** `docs/bugs/[BUG_ID]_release_note.md`

---

## Minimal Change Principle

1. Fix ONLY the root cause
2. Unrelated issues -> log as separate bug reports
3. Every line changed must map to `root_cause.md`
4. When in doubt: smaller change = safer change

## Output Files

All saved to `docs/bugs/[BUG_ID]_*.md`: triage, impact_map, root_cause, test_cases, fix_notes, test_execution_report, fix_report, release_note.

> **QA-SWE loop, scope discipline, quick reference:** See `docs/skills/PIPELINE_SHARED.md`
