# BUG_20260308_001 — Pipeline Retrospective & Systemic Analysis

**Date:** 2026-03-08
**Subject:** Bug Fix Pipeline failure analysis — Display Name placeholder bug
**Verdict:** The pipeline produced a wrong fix that passed all 25 test cases on paper but was visually broken on device. The pipeline's structural weaknesses allowed a bad fix to reach "safe to release" status.

---

## 1. What Happened

The Display Name TextInput placeholder rendered as "Y o u r  n a" due to a hardcoded `width: 120`. The pipeline correctly identified the root cause in Phase 2 and recommended replacing `width: 120` with `flex: 1` on the TextInput. Phase 4 implemented exactly that. Phase 5 passed 25/25 test cases by code inspection. Phases 6+7 declared high confidence.

**The fix was wrong.** The TextInput got `flex: 1`, but its parent wrapper View did not. Without `flex: 1` on the wrapper View, the wrapper collapsed to its content's intrinsic size rather than expanding to fill the available space in the `space-between` row. The TextInput's `flex: 1` only meant "fill 100% of the wrapper" — but the wrapper itself was still small. The placeholder remained truncated on device.

The user had to manually identify and correct the issue after visual testing.

---

## 2. Systemic Weaknesses

### 2.1. Phase 5 — "Test by Code Inspection" Is Fundamentally Broken for UI Bugs

**The problem:** Phase 5 executed all 25 test cases by reading source code and reasoning about layout. Every test case "passed" because the reasoning was plausible — `flex: 1` on a TextInput inside a flex row *sounds* like it should work. The reasoning in TC-001 even computed pixel widths to "prove" it would fit.

But static analysis of React Native flex layout is unreliable for three reasons:

1. **Flex layout is recursive.** A child's `flex: 1` means nothing unless every ancestor in the flex chain also participates correctly. The analysis traced the TextInput and its immediate parent but missed that the wrapper View between `rowStyles.row` and the TextInput had no flex property, making it a zero-flex container that collapses.

2. **React Native's Yoga layout engine has edge cases** that differ from CSS flexbox mental models. `justifyContent: 'space-between'` distributes space between direct children, but it does not force those children to expand internally. A wrapper View with no `flex` or `width` will shrink-wrap its content.

3. **iOS rendering has platform-specific behaviors** (font metrics, safe areas, padding computation) that cannot be verified by reading JavaScript style objects.

**The test execution report even acknowledged this** (lines 89-95) — listing "limitations of code inspection" including "exact pixel rendering" and "visual balance." But it still declared ALL TESTS PASS and recommended release. Acknowledging limitations and then ignoring them is worse than not acknowledging them at all, because it creates a false sense of rigor.

**Root failure:** The pipeline defines Phase 5 as "Execute ALL test cases" but provides no guidance on *how* to execute them. For an AI agent that cannot run a simulator, "execute" defaults to "reason about." The pipeline must explicitly distinguish between test execution methods and mandate the appropriate one per bug category.

### 2.2. Phase 2 — Root Cause Analysis Stopped One Level Too Shallow

Phase 2 correctly identified `width: 120` as the root cause and correctly recommended `flex: 1`. But the analysis documented the parent layout as:

```
rowStyles.row (flexDirection: 'row', justifyContent: 'space-between')
├── Text "Display name"
└── View (flexDirection: 'row', alignItems: 'center', gap: 8)
    ├── TextInput (width: 120)  ← THE PROBLEM
    └── check icon
```

The analysis noted the wrapper View but never asked: **"Does this wrapper View have `flex: 1`? If not, will putting `flex: 1` on the TextInput actually do anything?"**

The recommendation was: change the TextInput's style. But the fix needed to change *both* the TextInput and its wrapper View. The root cause document proposed a fix without tracing the full flex chain from the screen root to the broken element.

**Root failure:** Phase 2's "trace backwards from symptom" instruction is too vague. For layout bugs, you must trace the entire layout chain — every ancestor's flex/width/height properties — not just the immediate parent.

### 2.3. The QA-SWE Feedback Loop Is Dead If Phase 5 Cannot Detect Failures

The pipeline defines a QA-SWE loop:

```
IF bug verification FAIL → return to Phase 2
IF regression FAIL → return to Phase 4
IF all pass → proceed to Phase 6
```

This loop is the pipeline's safety net. But it depends entirely on Phase 5 producing accurate PASS/FAIL verdicts. When Phase 5 passes everything by code inspection, the loop never triggers. The pipeline proceeds directly to "safe to release."

**This is a single point of failure.** The entire pipeline's correctness guarantee flows through Phase 5, and Phase 5 has no mechanism to distinguish between "I verified this works" and "I believe this should work based on my reading of the code."

### 2.4. No Visual Verification Step Exists Anywhere in the Pipeline

Across all 8 phases and the QA-SWE loop protocol, the word "simulator" appears zero times. "Device" appears zero times. "Screenshot" appears once (Phase 0, as optional input). "Run the app" appears zero times.

For a mobile UI bug — a visual rendering defect — the pipeline has no step that says: build the app, run it on a simulator or device, and look at the screen.

### 2.5. Over-Reliance on Static Analysis Across Multiple Phases

This is not isolated to Phase 5. The pattern of "analyze code instead of running code" appears throughout:

- **Phase 2** analyzed the flex layout by reading style objects instead of inspecting the rendered layout tree (React Native's layout inspector or Flipper could show actual computed dimensions).
- **Phase 4** self-reviewed with a checklist that includes "TypeScript compiles clean" but not "visually verified on simulator."
- **Phase 5** executed 25 test cases without running the app once.
- **Phase 6** declared "High confidence" based on Phase 5's static analysis results.

The pipeline treats code as the source of truth. For logic bugs, this can work. For UI bugs, the rendered output is the source of truth, and code is merely an input to the rendering engine.

---

## 3. Specific Recommendations

### R1. Phase 5 — Mandate Execution Method Per Bug Category

Add a **test execution method matrix** to Phase 5:

| Bug Category | Required Execution Method | Code Inspection Alone? |
|---|---|---|
| Logic / data flow | Unit tests + code inspection | Acceptable |
| API / network | Integration tests (actual HTTP calls) | No |
| UI layout / visual | Device or simulator verification | **Never acceptable** |
| UI interaction | Device or simulator verification | **Never acceptable** |
| Performance | Profiling / benchmarking | No |
| Crash / error handling | Runtime testing with error injection | No |

**Hard rule:** For any test case tagged as UI/visual, Phase 5 MUST include one of:
1. A screenshot from a simulator or device showing the fix works
2. A recording of the user flow on device
3. Explicit acknowledgment that visual verification was not performed, with the test marked as `UNVERIFIED` (not `PASS`)

A test that was only code-inspected must be reported as `PASS (static)` — never plain `PASS`. Phase 6 must treat any `PASS (static)` on a UI test as a yellow flag.

### R2. Phase 2 — Add Mandatory Layout Chain Trace for UI Bugs

Add to Phase 2's steps, specifically for layout/visual bugs:

> **Layout Bug Protocol (mandatory when the bug involves sizing, positioning, overflow, or visual rendering):**
>
> 1. Identify the broken element
> 2. Trace the **complete ancestor chain** from the broken element to the screen root
> 3. For each ancestor, document: `flex`, `width`, `height`, `flexDirection`, `justifyContent`, `alignItems`, `padding`, `margin`
> 4. Identify which ancestor in the chain is the **actual constraint** causing the issue
> 5. When proposing a fix, verify that changing the target element will propagate correctly through the entire chain — if any intermediate ancestor blocks the propagation, the fix must address that ancestor too
> 6. **Explicitly state:** "The fix at [element] will propagate because [ancestor] has [property] that allows it" — if you cannot make this statement, the fix is incomplete

### R3. Add Phase 5.5 — Runtime Verification Gate

Insert a mandatory gate between Phase 5 and Phase 6:

> **Phase 5.5 — Runtime Verification (MANDATORY for UI/visual/interaction bugs)**
>
> **Role:** Developer or QA with device access
> **Task:** Run the app with the fix applied and verify on device or simulator.
>
> **Steps:**
> 1. Build and run the app (`npx expo start` or `npm run ios:device`)
> 2. Navigate to the affected screen
> 3. Visually confirm the bug is fixed
> 4. Visually confirm no regressions in adjacent UI elements
> 5. Test on at least two screen sizes (e.g., iPhone SE and iPhone Pro Max)
> 6. Capture screenshots as evidence
>
> **Exit criteria:**
> - Screenshot showing the fix works on at least one device
> - No visual regressions observed
>
> **If this phase cannot be performed** (e.g., no simulator available), Phase 6 must state: "Runtime verification was not performed. Confidence level is capped at MEDIUM regardless of code inspection results."

### R4. Phase 4 Self-Review — Add Visual Verification Checkbox

Add to Phase 4's self-review checklist:

```
- [ ] For UI bugs: visually verified on simulator/device
- [ ] For layout bugs: confirmed flex chain propagation from target to screen root
```

### R5. Phase 6 — Confidence Level Must Reflect Verification Method

Change Phase 6's confidence level rules:

| Verification Method | Maximum Confidence |
|---|---|
| All tests executed at runtime + visual verification on device | High |
| All tests executed at runtime, no visual verification | Medium |
| Tests executed by code inspection only | Low |
| Mixed (some runtime, some code inspection) | Medium (with caveats listed) |

**Hard rule:** Phase 6 can never declare "High confidence" if Phase 5 was performed entirely by code inspection for a UI/visual bug.

### R6. Phase 3 — Test Cases Must Specify Execution Method

Each test case in Phase 3 should include an "Execution Method" column:

| ID | Title | ... | Execution Method |
|---|---|---|---|
| TC-001 | Placeholder displays fully | ... | **Visual (device/sim)** |
| TC-008 | Email row renders correctly | ... | **Visual (device/sim)** |
| TC-014 | Save persists correctly | ... | Code inspection + unit test |

This forces the QA agent writing test cases to think about *how* each test will be verified, and gives Phase 5 explicit instructions rather than defaulting to code reading.

### R7. QA-SWE Loop — Add External Verification Trigger

Amend the loop protocol:

```
LOOP START

  QA executes test cases (Phase 5)
  QA performs runtime verification (Phase 5.5, if applicable)

  IF bug verification FAIL (Phase 5 or 5.5):
    → Return to Phase 2

  IF regression FAIL (Phase 5 or 5.5):
    → Return to Phase 4

  IF Phase 5 used code inspection only for UI tests:
    → Mark as UNVERIFIED, do NOT proceed to Phase 6
    → Require runtime verification before loop can exit

  IF all P0 + P1 PASS with runtime verification:
    → EXIT LOOP → Proceed to Phase 6

LOOP END
```

---

## 4. Summary of Changes Required

| # | Target | Change | Priority |
|---|---|---|---|
| R1 | Phase 5 | Add execution method matrix; prohibit code-inspection-only for UI bugs | **Critical** |
| R2 | Phase 2 | Add mandatory layout chain trace protocol for UI/layout bugs | **Critical** |
| R3 | New Phase 5.5 | Add runtime verification gate before Phase 6 | **Critical** |
| R4 | Phase 4 | Add visual verification and flex chain checkboxes | High |
| R5 | Phase 6 | Cap confidence level based on verification method used | High |
| R6 | Phase 3 | Add "Execution Method" column to test case format | Medium |
| R7 | QA-SWE Loop | Add external verification trigger; block exit on unverified UI tests | High |

---

## 5. Broader Lesson

The pipeline was designed with the implicit assumption that the executing agents can run code and observe output. In practice, AI agents performing Phase 5 can only read code. This mismatch between the pipeline's assumptions and the agents' actual capabilities is the systemic root cause.

The fix is not to make AI agents better at reasoning about layout (they will always have blind spots with recursive visual rendering). The fix is to **make the pipeline aware of its own limitations** by:

1. Categorizing bugs by verification method required
2. Explicitly marking which phases need runtime access
3. Refusing to declare confidence when runtime verification was skipped
4. Treating code-inspection-only results as hypotheses, not verdicts
