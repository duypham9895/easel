# Pipeline Review: Change Request Pipeline

**Reviewer:** Process Engineer
**Date:** 2026-03-08
**Document under review:** `docs/skills/CHANGE_REQUEST_PIPELINE.md`
**Triggered by:** Bug Fix Pipeline failure — a visually broken fix passed all pipeline phases via code inspection only, with no runtime or device verification.

---

## Executive Summary

The Change Request Pipeline suffers from the **same systemic weaknesses** that caused the Bug Fix Pipeline to ship a broken fix. Phase 6 (Test Execution) has no requirement to actually run the app, take screenshots, or verify visual output on a device or simulator. An agent can — and will — "pass" every test case by reading code and reasoning about behavior, without ever launching the application.

**Severity: Critical.** For a mobile app where the majority of change requests involve UI/UX changes (the pipeline even has dedicated UX and Copy phases), the absence of runtime verification is a fundamental gap.

---

## Detailed Findings

### Finding 1: No Visual/Runtime Verification Step

**Question:** Does the pipeline have a visual/runtime verification step?
**Answer:** No.

Phase 6 (Test Execution) says "Execute ALL test cases from Phase 4" but provides zero guidance on **how** to execute them. There is no mention of:
- Running the app on a simulator or device
- Taking screenshots before/after
- Using Playwright, Detox, or any E2E framework
- Visual diffing or snapshot testing
- Manual device inspection

The word "screenshot" does not appear anywhere in the Change Request Pipeline. The word "simulator" does not appear. The word "device" does not appear. The word "run" (as in running the app) does not appear in Phase 6.

**Risk:** An agent will interpret "execute test cases" as "read the code and reason about whether each test case would pass." This is exactly what happened in the Bug Fix Pipeline.

### Finding 2: Test Execution Phase Lacks Method Specification

**Question:** Does Phase 6 mandate actual app testing?
**Answer:** No. It mandates test execution but is silent on method.

Phase 6 specifies:
- Execution order (Verification -> Backward Compat -> Regression -> Edge Cases)
- How to handle PASS/FAIL
- Exit conditions

But it never says **how** to verify. Compare:

| What Phase 6 says | What Phase 6 should say |
|---|---|
| "Execute ALL test cases from Phase 4" | "Execute ALL test cases by running the app on iOS simulator and/or physical device" |
| "All P0+P1 PASS" | "All P0+P1 PASS with evidence (screenshot, screen recording, or test output log)" |
| "New behavior matches acceptance criteria" | "New behavior matches acceptance criteria as verified on device, with before/after screenshots for UI changes" |

### Finding 3: Agents Can Pass All Tests Without Running the App

**Question:** Could agents "pass" all tests by reading code without running the app?
**Answer:** Yes, easily.

The pipeline's test case format (Phase 4) has columns for Steps and Expected Result, but there is no column for **Actual Result Evidence** or **Verification Method**. An agent can fill in "PASS" for every test case by:

1. Reading the implementation code from Phase 5
2. Reasoning that the code change should produce the expected result
3. Marking the test as PASS

This is not testing. This is code review masquerading as QA.

The QA <-> SWE Loop Protocol reinforces this problem: it describes what to do on FAIL but never defines what constitutes a valid PASS. A PASS based on code inspection is treated identically to a PASS based on device verification.

### Finding 4: No Screenshot/Device Testing Requirement for UI Changes

**Question:** Is there a step requiring screenshots/device testing for UI changes?
**Answer:** No.

This is especially problematic because the pipeline has a dedicated Phase 1 (UX Impact Assessment) that explicitly calls out:
- "Before/After comparison per affected screen"
- "Edge cases: empty states, loading states, error states, long text / small screen"

Phase 1 identifies what needs visual verification, but Phase 6 never closes the loop by requiring visual verification of those exact items. The pipeline creates a design spec but never validates it was implemented correctly **visually**.

### Finding 5: No Criteria Distinguishing Code-Inspection-Safe vs Runtime-Required Changes

**Question:** Are there clear criteria for when code inspection is sufficient vs. when runtime verification is mandatory?
**Answer:** No.

The pipeline classifies change types in Phase 0 (UI/Visual, UX/Flow, Functional, Copy, Performance, Configuration, Multiple) but never maps these classifications to verification methods. For example:

- `UI/Visual` change -> should **require** screenshot comparison
- `Performance` change -> should **require** profiling/timing measurement
- `Functional` change -> could potentially be verified by unit test output
- `Copy` change -> should **require** visual confirmation that text renders correctly (line breaks, truncation, RTL)

No such mapping exists. All change types get the same "execute test cases" instruction.

---

## Recommendations

### Recommendation 1: Add a Change Verification Method Matrix to Phase 0

After the PM classifies the change type, require a verification method assignment:

```markdown
| Change Type | Minimum Verification Method |
|---|---|
| UI/Visual | Device/simulator screenshot comparison (before + after) |
| UX/Flow | Screen recording or step-by-step screenshot walkthrough on device |
| Functional | Unit test execution output (actual test runner, not code reading) + manual smoke test |
| Copy | Screenshot on device showing rendered text (check truncation, wrapping, i18n) |
| Performance | Profiling data or timing measurement (before + after) |
| Configuration | Functional test showing old default vs new default behavior |
| Multiple | Most rigorous method from applicable types above |
```

This matrix should be a hard gate: Phase 6 cannot proceed without the method assigned in Phase 0.

### Recommendation 2: Split Phase 6 into Code Verification + Runtime Verification

Replace the current single-step Phase 6 with two sub-phases:

**Phase 6A — Automated/Code Verification (Agent-executable)**
- Run TypeScript compiler (`npx tsc --noEmit`)
- Run linter
- Run existing unit tests
- Verify no type errors introduced
- Check that all changed files compile

**Phase 6B — Runtime Verification (Requires actual app execution)**
- Build and run the app on iOS simulator
- Execute each test case manually or via E2E framework
- For UI changes: capture before/after screenshots and attach to test report
- For flow changes: record step-by-step navigation
- For copy changes: screenshot each affected screen in both EN and VI
- Mark test cases with actual device-observed results, not code-inferred results

**Hard rule:** Phase 6B is MANDATORY for change types `UI/Visual`, `UX/Flow`, `Copy`, and `Multiple`. Phase 6B is RECOMMENDED for `Functional` and `Configuration`. Phase 6B can be skipped ONLY for pure `Performance` changes with profiling data as substitute evidence.

### Recommendation 3: Require Evidence Artifacts in Test Execution Report

Add a mandatory "Evidence" column to the test execution report format:

```markdown
| TC ID | Title | Result | Evidence | Verified By |
|---|---|---|---|---|
| TC-001 | Button color changes to blue | PASS | screenshot_tc001.png | Device (iPhone 15 Simulator) |
| TC-002 | API returns correct data | PASS | unit_test_output.log | Jest test runner |
| TC-003 | Text wraps correctly on small screen | PASS | screenshot_tc003_se.png | Device (iPhone SE Simulator) |
```

**Hard rule:** Any test case marked PASS without an evidence artifact for UI/UX changes is automatically marked as `UNVERIFIED` and blocks the exit condition.

### Recommendation 4: Add a "Verification Checkpoint" Gate Between Phase 5 and Phase 6

Insert a mandatory checkpoint after implementation and before test execution:

**Phase 5.5 — Build Verification Checkpoint**
- [ ] App compiles without errors (`npx tsc --noEmit`)
- [ ] App launches on simulator without crash
- [ ] Changed screen(s) are navigable and render without errors
- [ ] No red/yellow box errors in development mode

If any checkpoint fails, return to Phase 5. Do not proceed to Phase 6.

This prevents the scenario where Phase 6 "tests" code that doesn't even build or render.

### Recommendation 5: Define What "Execute" Means — Add a Glossary

Add a definitions section to the pipeline:

```markdown
## Definitions

- **Execute a test case:** Perform the test steps on a running instance of the
  application (simulator, device, or E2E test framework) and observe the actual
  result. Reading code to predict what would happen is NOT execution — it is
  code review.

- **Code inspection:** Reading source code to verify logic correctness. Valid
  for verifying implementation approach, but NOT a substitute for test execution
  on UI/UX/Copy changes.

- **Visual verification:** Confirming the rendered output on a real screen
  matches the expected design. Requires a screenshot or screen recording as
  evidence.
```

### Recommendation 6: Add Explicit Agent Limitations Acknowledgment

Add a section that explicitly addresses the agent execution context:

```markdown
## Agent Execution Limitations

AI agents executing this pipeline CANNOT:
- See the app running on a screen
- Interact with touch targets
- Judge visual spacing, alignment, or color accuracy
- Verify animations or transitions
- Test haptic feedback or sound

For any change classified as UI/Visual, UX/Flow, or Copy, the agent MUST:
1. Flag that runtime verification is required
2. Provide instructions for the human to perform visual verification
3. NOT mark UI test cases as PASS based on code inspection alone
4. Generate a "Human Verification Checklist" as part of the test execution report
```

### Recommendation 7: Cross-Pipeline Consistency

Apply these same fixes to all three pipelines (Change Request, Bug Fix, Feature Development). The weakness is systemic — it exists because all three pipelines were designed with the assumption that "test execution" is self-explanatory. It is not, especially when the executor is an AI agent that cannot see rendered output.

Create a shared `docs/skills/TESTING_STANDARDS.md` that all three pipelines reference, containing:
- The verification method matrix
- Evidence requirements
- Build verification checkpoint
- Glossary of terms
- Agent limitation acknowledgments

---

## Summary of Gaps

| # | Gap | Severity | Current State | Required State |
|---|---|---|---|---|
| 1 | No runtime verification requirement | Critical | "Execute test cases" (method unspecified) | "Execute on device/simulator with evidence" |
| 2 | No screenshot requirement for UI changes | Critical | Not mentioned | Mandatory before/after screenshots |
| 3 | No distinction between code inspection and testing | Critical | Treated as equivalent | Explicitly differentiated with rules |
| 4 | No evidence artifacts required | High | PASS/FAIL only | PASS/FAIL + evidence attachment |
| 5 | No build verification gate | High | Implementation -> Test Execution (no gate) | Implementation -> Build Check -> Test Execution |
| 6 | No agent limitation acknowledgment | High | Pipeline assumes human executor | Explicit rules for AI agent executors |
| 7 | Phase 1 design spec not validated in Phase 6 | Medium | Design spec created but never visually verified | Phase 6 must close the loop on Phase 1 specs |

---

## Conclusion

The Change Request Pipeline is well-structured for documentation, planning, and scope management. Its weakness is identical to the Bug Fix Pipeline's: **it conflates reasoning about code with testing the application**. For a mobile app where the user experience is visual and interactive, this is a critical gap that will predictably produce "all tests passed" reports for changes that are visually broken on device.

The fix is straightforward: define what "execute" means, require evidence, and acknowledge that AI agents cannot perform visual verification without tooling (screenshots, E2E frameworks) or human assistance.
