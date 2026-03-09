# Pipeline Shared Standards

> Referenced by all pipelines. Do NOT duplicate these sections in individual pipeline files.

## Agent Team Execution Mode

All pipelines use parallel agent execution. Launch independent phases as concurrent Agent tool calls in a single message. Sequential agents MUST wait for parallel agents to complete.

### How to Launch Parallel Agents

```
# Launch BOTH in a single message:
Agent(subagent_type="general-purpose", prompt="[Phase X — Name] ...")
Agent(subagent_type="general-purpose", prompt="[Phase Y — Name] ...")
```

### Context Passing

Each agent receives full context via its prompt:
- Include description + all previously generated doc file paths
- Agents read output files from previous phases

## Pipeline Auto-Detection

```
IF something BROKEN that should work       -> BUG_FIX_PIPELINE
IF something DOESN'T EXIST yet             -> FEATURE_DEVELOPMENT_PIPELINE
IF something EXISTS but needs to CHANGE     -> CHANGE_REQUEST_PIPELINE
IF testing real user RESONANCE              -> USER_PERSONA_TESTING_PIPELINE
IF strategic expert REVIEW                  -> EXPERT_ADVISOR_PIPELINE
IF ambiguous                                -> ASK the user
```

## QA <-> SWE Loop Protocol

```
LOOP START
  QA executes test cases
  IF verification FAIL -> SWE fixes, QA re-runs FULL suite
  IF regression FAIL   -> SWE fixes side effect only, QA re-runs FULL suite
  IF all P0+P1 PASS AND zero regressions -> EXIT LOOP -> Report phase
LOOP END
```

## Quick Reference

| Trigger | Pipeline | Starting Point |
|---|---|---|
| Something **broken** | `BUG_FIX_PIPELINE` | Reproduce the bug |
| Something **doesn't exist** | `FEATURE_DEVELOPMENT_PIPELINE` | Write PRD |
| Something **needs to change** | `CHANGE_REQUEST_PIPELINE` | Define current vs desired |
| Does it **matter to real people**? | `USER_PERSONA_TESTING_PIPELINE` | Define personas + scenarios |
| Need **expert strategic review**? | `EXPERT_ADVISOR_PIPELINE` | Audit + brief experts |

## Scope Discipline (Hard Rule for SWE)

1. Build/fix ONLY what is defined in the phase docs
2. Related improvements -> log as separate items
3. Every line changed must map to an accepted requirement
4. If more scope needed -> STOP and flag
5. Document ALL scope deviations as `[SCOPE DEVIATION]`

## Testing Standards

All pipelines MUST follow `docs/skills/TESTING_STANDARDS.md` for verification methods, test case format, device-test gates, and confidence levels. See that file for complete rules.
