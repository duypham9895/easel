# Testing Standards — Shared Across All Pipelines

> **Referenced by:**
> - `docs/skills/BUG_FIX_PIPELINE.md`
> - `docs/skills/FEATURE_DEVELOPMENT_PIPELINE.md`
> - `docs/skills/CHANGE_REQUEST_PIPELINE.md`
> - `docs/skills/USER_PERSONA_TESTING_PIPELINE.md`

---

## Why This Document Exists

On 2026-03-08, the Bug Fix Pipeline executed all 8 phases for a UI bug (BUG_20260308_001). Phase 5 (Test Execution) "passed" 25/25 test cases by **code inspection only**. The fix was visually broken on device — the placeholder text was still letter-spaced and the save button was pushed off screen. The pipeline declared "High confidence, safe to release" based on static analysis of a layout bug.

**Root cause:** No pipeline defined HOW test cases should be executed. AI agents defaulted to reading code, which cannot validate visual rendering, platform-specific behavior, or runtime layout.

This document defines mandatory testing standards that all pipelines must follow.

---

## 1. Verification Method Classification

Every test case MUST include a **Verification Method** column. The method is determined by what the test verifies:

| Verification Method | When to Use | What It Means |
|---|---|---|
| `code-inspection` | Logic, data flow, type safety, SQL, RLS, pure functions | Reading code is sufficient to verify correctness |
| `build-check` | TypeScript compilation, linting, import resolution | Run `npx tsc --noEmit` or equivalent build command |
| `unit-test` | Isolated function behavior, calculations, transformations | Write and run automated test (Jest, etc.) |
| `device-test` | UI layout, visual rendering, animations, gestures, platform behavior | Run on device/simulator and visually verify |
| `device-test + screenshot` | Visual regressions, layout bugs, design spec compliance | Run on device AND capture screenshot as evidence |

### Classification Rules

```
IF test involves ANY of:
  - Visual appearance (colors, spacing, alignment, truncation)
  - Layout behavior (flex, width, overflow, clipping)
  - Platform-specific rendering (iOS UIKit, Android Views)
  - Animations or transitions
  - Touch/gesture behavior
  - Responsive layout (different screen sizes)
  - Text rendering (placeholder, fonts, letter-spacing, RTL)
→ Verification Method = `device-test` or `device-test + screenshot`

IF test involves ANY of:
  - Data correctness (right values stored/returned)
  - API response format
  - State management logic
  - Business rules / calculations
  - Database queries / RLS policies
  - Error handling paths (non-UI)
→ Verification Method = `code-inspection` or `unit-test`

IF test involves TypeScript compilation or import correctness:
→ Verification Method = `build-check`
```

### The Hard Rule

> **Code inspection CANNOT pass a test that requires device-test verification.**
>
> If a test case is marked `device-test` and the agent can only do code inspection,
> the test result MUST be marked `UNTESTED (device verification required)` — NOT `PASS`.

---

## 2. Updated Test Case Format

All pipelines must use this format (adds Verification Method column):

| ID | Title | Feature Area | Type | Verification Method | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|---|---|
| TC-001 | ... | ... | Bug Fix / Regression | `device-test + screenshot` | ... | ... | ... | P0 |
| TC-002 | ... | ... | Regression | `code-inspection` | ... | ... | ... | P1 |

---

## 3. Test Execution Report Requirements

### Mandatory Fields Per Test Result

| Field | Description |
|---|---|
| Test ID | The test case ID |
| Result | `PASS` / `FAIL` / `UNTESTED` / `BLOCKED` |
| Verification Method Used | Must match or exceed the required method |
| Evidence | For `device-test`: describe what was observed. For `device-test + screenshot`: user must confirm visual correctness. For `code-inspection`: cite specific file:line. For `unit-test`: paste test output. |

### Result Validity Rules

| Required Method | Actual Method Used | Result Valid? |
|---|---|---|
| `code-inspection` | `code-inspection` | Yes |
| `code-inspection` | `device-test` | Yes (exceeds requirement) |
| `device-test` | `code-inspection` | **NO — mark UNTESTED** |
| `device-test + screenshot` | `device-test` | Partial (note: no screenshot) |
| `device-test + screenshot` | `code-inspection` | **NO — mark UNTESTED** |

---

## 4. User Confirmation Gate

For any change that includes `device-test` or `device-test + screenshot` test cases:

```
AFTER implementation (Phase 4/5), BEFORE declaring tests passed:

1. Agent implements the fix/feature
2. Agent runs build-check (tsc, lint)
3. Agent marks code-inspection and unit-test cases as PASS/FAIL
4. Agent marks device-test cases as UNTESTED
5. Agent tells the user: "Please verify on device: [specific things to check]"
6. User confirms or reports issues
7. ONLY THEN can device-test cases be marked PASS

→ If user reports issues: return to implementation phase
→ If user confirms: mark PASS and proceed
```

> **The agent MUST NOT mark device-test cases as PASS without user confirmation.**
> This is the single most important rule in this document.

---

## 5. Confidence Level Rules

The fix/feature report's confidence level is constrained by verification completeness:

| Verification Status | Maximum Confidence Level |
|---|---|
| All test cases verified (including device-test confirmed by user) | High |
| All code-inspection + build-check verified, device-test confirmed by user | High |
| All code-inspection verified, device-test UNTESTED | **Low** |
| Some test cases UNTESTED | **Low** |
| Any P0 test case FAIL | **Cannot release** |

> **You cannot claim "High confidence" when device-test cases are unverified.**

---

## 6. Root Cause Analysis Standards (Bug Fix Pipeline)

When the bug involves UI/layout, the root cause analysis MUST include:

### Layout Chain Trace (Mandatory for layout bugs)

Trace the full ancestor chain from the broken element to the screen root:

```
Screen (flex: 1)
└── ScrollView
    └── Card (padding: Spacing.md)
        └── Row (flexDirection: 'row', justifyContent: 'space-between')
            └── Wrapper View (flexDirection: 'row', ← DOES IT HAVE flex: 1?)
                ├── TextInput (flex: 1, width: 120  ← CONFLICT?)
                └── Button (intrinsic 18px)
```

**For each ancestor, document:**
- `flexDirection`, `justifyContent`, `alignItems`
- `flex`, `width`, `maxWidth`, `minWidth`
- `padding`, `margin`, `gap`
- Whether the element has explicit sizing or relies on children

**Flag conflicts:**
- `flex: 1` on a child inside a parent without explicit sizing
- `width: X` on a child inside a `flex` parent
- `justifyContent: 'space-between'` with nested flex containers

### Fix Validation Checklist (Mandatory)

Before recommending a fix approach, verify:
- [ ] The fix element AND its parent both have compatible flex/sizing
- [ ] All sibling elements will still be visible after the fix
- [ ] The fix works for the shortest AND longest possible content
- [ ] The fix works for the narrowest (iPhone SE) AND widest (Pro Max) screen

---

## 7. Agent Capability Acknowledgment

AI agents executing these pipelines have the following limitations:

| Capability | Agent CAN | Agent CANNOT |
|---|---|---|
| Code analysis | Read, trace, understand code | Run the app |
| Build verification | Run `tsc`, `eslint`, `jest` | See visual output |
| Layout analysis | Trace flex chains, calculate sizes | Render pixels on screen |
| Platform behavior | Reason about documented behavior | Test actual iOS/Android rendering |

**Implication:** For any test that requires visual verification, the agent MUST:
1. Do as much as possible via code analysis
2. Clearly mark remaining verification as requiring user/device testing
3. Ask the user to verify on device before declaring the test passed

---

## 8. Quick Reference: When Is Code Inspection Enough?

| Change Type | Code Inspection Sufficient? |
|---|---|
| Fix a calculation / business logic | Yes |
| Add/modify RLS policy | Yes |
| Change API response format | Yes |
| Fix a layout / styling bug | **No — device-test required** |
| Add a new UI component | **No — device-test required** |
| Change colors / typography | **No — device-test required** |
| Modify animations | **No — device-test required** |
| Change text / translations | Partial (content: yes, rendering: device-test) |
| Add a database migration | Yes (but test data flow: device-test) |
| Fix a state management bug | Partial (logic: yes, UI effect: device-test) |
