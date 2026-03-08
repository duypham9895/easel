# Documentation Structure

This folder follows a strict convention. All contributors (human and AI) must follow these rules.

## Folder Structure

```
docs/
├── README.md              ← You are here (the rules)
├── project/               ← Core project-level docs (PRD, architecture, API, etc.)
├── features/              ← One subfolder per feature
│   └── <feature-name>/    ← All docs for a single feature (kebab-case)
├── releases/              ← One subfolder per version
│   └── v<x.y.z>/          ← Release notes + report for that version
├── reviews/               ← Expert reviews, audits, retrospectives
├── plans/                 ← Design plans and proposals (date-prefixed)
├── bugs/                  ← Bug investigations (BUG_YYYYMMDD_NNN prefix)
├── advisory/              ← Expert advisor panel sessions (EAP_YYYYMMDD_NNN prefix)
└── skills/                ← Pipeline and workflow definitions
```

---

## Rules

### 1. `project/` — Core Project Docs

Foundational docs that describe the whole product. Updated in-place, not per-version.

| File | Purpose |
|------|---------|
| `PRD.md` | Product requirements |
| `ARCHITECTURE.md` | System architecture |
| `API.md` | API reference |
| `DEPLOYMENT.md` | Deployment guide |
| `USER_JOURNEYS.md` | User flow descriptions |
| `UX_DESIGN.md` | Design system and UX guidelines |

**Rule:** Only add files here if they describe the entire product. Feature-specific docs go in `features/`.

### 2. `features/` — Feature Documentation

Every feature gets its own subfolder. All docs related to that feature live inside it.

```
features/
└── ios-health-sync/
    ├── PRD.md                    # What we're building and why
    ├── UX_research.md            # User research findings
    ├── UI_design_spec.md         # Design specs, mockups, flows
    ├── copy.md                   # UI copy and translations
    ├── SWE_implementation_notes.md  # Technical decisions and notes
    ├── QA_test_plan.md           # Test plan
    └── QA_execution_report.md    # Test results
```

**Rules:**
- Folder name: `kebab-case`, short and descriptive (e.g., `ios-health-sync`, `couple-linking`, `whisper-v2`)
- Every feature MUST have at minimum: `PRD.md`
- Add other docs as the feature progresses through the pipeline
- NO release notes here — those go in `releases/`

**Standard doc types per feature (add as needed):**

| Doc | When to create |
|-----|----------------|
| `PRD.md` | Planning phase — always required |
| `UX_research.md` | When user research is conducted |
| `UI_design_spec.md` | When UI/UX design is finalized |
| `copy.md` | When UI copy needs review (especially for i18n) |
| `SWE_implementation_notes.md` | During/after implementation |
| `QA_test_plan.md` | Before QA execution |
| `QA_execution_report.md` | After QA is complete |

### 3. `releases/` — Version Releases

One subfolder per app version. Documents what shipped in each release.

```
releases/
├── v1.5.1/
│   └── RELEASE.md
└── v1.6.0/
    └── RELEASE.md
```

**Rules:**
- Folder name: `v<major>.<minor>.<patch>` (e.g., `v1.6.0`)
- Each version folder MUST contain: `RELEASE.md` (the summary)
- Optionally include: `release_notes.md` (detailed App Store / developer changelog), `release_report.md` (PRD delta, rollout plan, sign-off checklist)
- `RELEASE.md` must follow this template:

```markdown
# Release v<x.y.z>

**Date:** YYYY-MM-DD
**Platform:** iOS / Android / Both

## Features
- [feature-name](../features/<feature-name>/PRD.md) — one-line summary
- ...

## Bug Fixes
- [BUG_ID](../bugs/<BUG_ID>_triage.md) — one-line summary
- ...

## Improvements
- One-line description of non-feature improvements
- ...

## Breaking Changes
- (if any)

## Notes
- (deployment notes, known issues, rollback plan, etc.)
```

**Key:** Link to feature and bug docs — don't duplicate content. The release doc is a summary that points to details.

### 4. `reviews/` — Reviews and Audits

Expert panel reviews, security audits, performance audits, retrospectives.

**Naming:** `<TYPE>_<subject>.md` (e.g., `EXPERT_PANEL_REVIEW.md`, `SECURITY_AUDIT_v1.6.md`)

### 5. `plans/` — Design Plans

Proposals and design documents for upcoming work.

**Naming:** `YYYY-MM-DD-<description>.md` (e.g., `2026-03-07-bilingual-i18n-design.md`)

**Rule:** Once a plan becomes a feature, create the feature folder in `features/` and reference the plan from the feature's `PRD.md`. Don't delete the plan.

### 6. `bugs/` — Bug Investigations

All docs for a single bug share the same ID prefix.

**Naming:** `BUG_YYYYMMDD_NNN_<doc-type>.md`

**Standard doc types:** `triage`, `root_cause`, `impact_map`, `test_cases`, `fix_notes`, `test_execution_report`

### 7. `advisory/` — Expert Advisor Panel Sessions

Expert panel review sessions with multi-domain feedback.

**Naming:** `EAP_YYYYMMDD_NNN_<doc-type>.md`

**Standard doc types:** `setup`, `expert_reviews`, `panel_discussion`, `feature_deep_dives`, `ideas_innovations`, `strategic_advisory`, `synthesis`, `action_plan`

### 8. `skills/` — Pipelines and Workflows

Reusable workflow definitions for development pipelines.

---

## Quick Reference: Where Does This Doc Go?

| You're writing about... | Put it in... |
|------------------------|--------------|
| The whole product | `project/` |
| A specific feature's design/QA/implementation | `features/<name>/` |
| What shipped in a version | `releases/v<x.y.z>/` |
| A code review or audit | `reviews/` |
| An expert panel advisory session | `advisory/` |
| A future proposal | `plans/` |
| A bug investigation | `bugs/` |
| A dev workflow/pipeline | `skills/` |

## Anti-Patterns (Don't Do This)

- **Don't** put feature docs at the `docs/` root level
- **Don't** put release notes inside a feature folder
- **Don't** duplicate content between release notes and feature docs — link instead
- **Don't** use inconsistent naming — follow the conventions above
- **Don't** create loose files without a folder when the doc belongs to a group
