# Feature Development Pipeline Review — Systemic Weakness Analysis

**Date:** 2026-03-08
**Reviewer:** Process Engineering Audit
**Trigger:** Bug Fix Pipeline failure — broken fix shipped because all phases declared success via code inspection only, without runtime verification on device.
**Scope:** `docs/skills/FEATURE_DEVELOPMENT_PIPELINE.md` — identifying identical failure modes.

---

## Executive Summary

The Feature Development Pipeline has the **same systemic vulnerability** that caused the Bug Fix Pipeline failure. Phase 6 (Test Execution) defines what to test and how to handle failures, but **never defines HOW testing must be performed**. There is no requirement for runtime verification, no mention of device/simulator testing, and no mechanism to distinguish code-inspection "passes" from actual observed behavior. An agent can declare all P0 tests passed without ever running the app.

---

## Finding 1: No Runtime Verification Requirement

**Severity:** CRITICAL

Phase 6 (Test Execution) specifies an execution order and a pass/fail protocol, but nowhere does it state that tests must be **executed on a device or simulator**. The entire phase can be completed by an agent reading the implementation code and reasoning that "this should work."

**Evidence from the pipeline:**

Phase 6 says:
> "Execute ALL test cases from Phase 4."

But "execute" is undefined. For an AI agent, "executing" a test case by reading code and concluding it passes is a valid interpretation. There is no language requiring:
- Running `npx expo start`
- Observing the UI on a device or simulator
- Taking screenshots as evidence
- Checking runtime console output
- Verifying actual rendered layout vs expected layout

**Same failure mode as Bug Fix Pipeline?** Yes, identical. The QA agent can mark every test case PASS based on code logic alone.

---

## Finding 2: Phase 4 Test Cases Lack Verification Method

**Severity:** HIGH

Phase 4 (Test Case Writing) defines test cases with this format:

> | ID | Title | Feature Area | Type | Precondition | Steps | Expected Result | Priority |

There is no column for **Verification Method** — meaning every test case is ambiguous about whether it requires:
- Code inspection (reading the source)
- Unit test execution (`npm test`)
- Device testing (run app, tap through flow)
- Screenshot comparison (visual diff)

Without this column, the QA agent defaults to the easiest method: code reading.

---

## Finding 3: No Visual Verification for UI Features

**Severity:** CRITICAL

Phase 1 (Design Spec) produces detailed screen specs including layout, components, states, interactions, and animations. But Phase 6 never requires **visual confirmation** that the implementation matches the design spec.

The pipeline creates a design spec and then never verifies it visually. The gap:

```
Phase 1: "Card should have 16px padding, centered text, phase-colored border"
Phase 5: SWE writes code with those values
Phase 6: QA reads the code, sees the values match → PASS
Reality: Flexbox nesting causes text to overflow, border is hidden behind parent
```

This is exactly what happened in the Bug Fix Pipeline — the code looked correct but rendered incorrectly.

---

## Finding 4: No Distinction Between Testable-by-Code vs Testable-by-Device

**Severity:** HIGH

Some test cases genuinely can be verified by code inspection:
- "RLS policy blocks unauthorized access" — verifiable by reading the SQL
- "Translation key exists for all strings" — verifiable by reading i18n files
- "API endpoint returns 401 without auth token" — verifiable by reading middleware

Other test cases absolutely require runtime:
- "Card renders correctly on small screens"
- "Animation plays when transitioning between phases"
- "Pull-to-refresh triggers data reload"
- "Keyboard does not cover input field"

The pipeline makes no distinction. Both categories get the same PASS/FAIL treatment.

---

## Finding 5: Exit Conditions Are Purely Logical, Not Empirical

**Severity:** MEDIUM

Phase 6 exit conditions:
> - All P0+P1 PASS
> - Zero regressions
> - Feature matches acceptance criteria
> - Both roles work correctly
> - Both languages display correctly

Every one of these can be "verified" by reading code. None require empirical evidence (screenshots, logs, video). The exit gate has no teeth — it trusts the agent's self-assessment.

---

## Finding 6: QA-SWE Loop Has No Escalation for Unverifiable Claims

**Severity:** MEDIUM

The QA-SWE loop protocol assumes QA can reliably detect failures. But if QA is also limited to code inspection, the loop becomes:

```
SWE writes code → QA reads code → "Looks right" → PASS → Ship
```

There is no mechanism for a human or device to break this cycle. No escalation trigger like "if this is a UI feature, a human must verify before exit."

---

## Recommendations

### Recommendation 1: Add Verification Method to Test Case Format (Phase 4)

**Change the test case table to:**

| ID | Title | Feature Area | Type | **Verification Method** | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|---|---|

**Verification Method values:**
- `CODE_REVIEW` — verifiable by reading source code (logic, config, SQL)
- `UNIT_TEST` — verifiable by running automated tests (`npm test`)
- `DEVICE_TEST` — requires running app on device/simulator and observing behavior
- `SCREENSHOT` — requires screenshot evidence (layout, styling, responsive)

**Rule:** Any test case involving UI rendering, animations, gestures, navigation transitions, or responsive layout MUST be `DEVICE_TEST` or `SCREENSHOT`. `CODE_REVIEW` is only valid for pure logic, data, config, and security policy tests.

### Recommendation 2: Add Mandatory Device Testing Gate to Phase 6

**Insert a new section in Phase 6:**

```markdown
### Device Testing Requirements

For features with ANY user-facing UI changes:

1. **MANDATORY:** Run the app on iOS simulator or physical device
2. **MANDATORY:** Test as BOTH Moon and Sun roles
3. **MANDATORY:** Verify in BOTH English and Vietnamese
4. **MANDATORY:** Capture screenshots for all DEVICE_TEST and SCREENSHOT test cases
5. Screenshots must be saved as evidence in `docs/features/[FEAT_ID]_screenshots/`

For features with NO user-facing changes (pure backend/logic):
- Device testing may be skipped IF all test cases are CODE_REVIEW or UNIT_TEST type
- This exception must be explicitly noted in the test execution report

EXIT GATE: Phase 6 CANNOT be marked complete for UI features without
screenshot evidence. "Code looks correct" is NOT a valid pass for DEVICE_TEST cases.
```

### Recommendation 3: Add Verification Evidence to Test Execution Report

**Phase 6 output format should require:**

For each DEVICE_TEST or SCREENSHOT case:
```markdown
| TC-001 | PASS | DEVICE_TEST | Screenshot: `screenshots/TC-001_moon_en.png` |
| TC-002 | PASS | SCREENSHOT  | Screenshot: `screenshots/TC-002_sun_vi.png`  |
| TC-003 | PASS | CODE_REVIEW | Verified in `app/lib/db/couples.ts:45-52`    |
| TC-004 | PASS | UNIT_TEST   | `npm test` output: 14/14 passed               |
```

The evidence column makes it impossible to "pass" a device test without device evidence.

### Recommendation 4: Classify Features at Phase 0 (PRD)

**Add to Phase 0 deliverables:**

```markdown
- **Testing classification:**
  - [ ] UI Feature (requires device testing + screenshots)
  - [ ] Backend Feature (code review + unit tests sufficient)
  - [ ] Hybrid (specify which aspects need device testing)
```

This classification propagates through the pipeline so Phase 4 (test cases) and Phase 6 (execution) know upfront what verification methods are required.

### Recommendation 5: Add a "Smoke Test on Device" Step to Phase 5 (Implementation)

**Add to the SWE self-review checklist in Phase 5:**

```markdown
- [ ] Ran app on device/simulator after implementation
- [ ] Visually confirmed new screens/components render correctly
- [ ] No layout overflow, missing elements, or broken styling observed
- [ ] Console shows no new warnings or errors related to this feature
```

This catches obvious visual issues before the formal QA phase, reducing loop iterations.

### Recommendation 6: Define "Code Inspection Sufficiency" Criteria

**Add as a pipeline-wide rule:**

```markdown
## When Code Inspection Is Sufficient

Code inspection (CODE_REVIEW) is a valid verification method ONLY when ALL of these are true:
1. The change is pure logic, data, or configuration (no visual output)
2. The behavior can be fully determined by reading the code (no runtime dependencies)
3. There are no layout, styling, or rendering implications
4. The change does not affect component hierarchy, flexbox/grid layout, or z-index

If ANY of these are false, DEVICE_TEST is required.

Examples:
- Adding an RLS policy → CODE_REVIEW (SQL logic, no runtime needed)
- Adding a translation key → CODE_REVIEW (JSON structure, no rendering)
- Changing button color → DEVICE_TEST (must verify rendered output)
- Adding a new card component → SCREENSHOT (must verify layout)
- Fixing notification timing → UNIT_TEST + DEVICE_TEST (logic + actual push)
```

### Recommendation 7: Add Human Gate for P0 UI Features

**Add to Phase 6 exit conditions:**

```markdown
### Human Verification Gate (P0 UI Features Only)

If the feature is classified as "UI Feature" in Phase 0 AND contains P0 test cases:
- At least ONE screenshot per new screen must be reviewed by the user
- The test execution report must flag: "[AWAITING HUMAN REVIEW]" for screenshot evidence
- Pipeline does NOT proceed to Phase 7 until user confirms visual correctness

This prevents the "all agents agree it looks right" failure mode.
```

---

## Impact Assessment

| Recommendation | Effort | Impact | Priority |
|---|---|---|---|
| 1. Verification Method column | Low | High | P0 — Implement immediately |
| 2. Device Testing Gate in Phase 6 | Low | Critical | P0 — Implement immediately |
| 3. Evidence column in report | Low | High | P0 — Implement immediately |
| 4. Testing classification in PRD | Low | Medium | P1 — Implement soon |
| 5. Smoke test in Phase 5 | Low | Medium | P1 — Implement soon |
| 6. Code inspection criteria | Low | High | P0 — Implement immediately |
| 7. Human gate for P0 UI | Medium | Critical | P0 — Implement immediately |

---

## Conclusion

The Feature Development Pipeline suffers from the exact same structural flaw as the Bug Fix Pipeline: **it treats test execution as a documentation exercise rather than an empirical verification step.** Every phase produces a document, but none require observable evidence from a running app.

The core fix is simple: **require proof, not claims.** A screenshot is proof. A device test log is proof. "I read the code and it looks correct" is a claim. The pipeline must distinguish between the two and reject claims where proof is required.

These recommendations apply equally to the Bug Fix Pipeline and Change Request Pipeline. All three should be updated simultaneously.
