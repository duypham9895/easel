# Release v1.6.1

**Date:** 2026-03-09
**Platform:** iOS (Android unchanged)
**Type:** Bug Fix + Quality Release

## Bug Fixes (BUG_20260309_001)

8 bugs resolved from dual-persona user testing (Linh/Moon + Minh/Sun):

- **Critical:** Fixed cycle calculator modulo wrapping that created phantom phases when period is late — now shows actual day count (e.g., Day 33 instead of incorrectly wrapping to Day 5)
- **High:** Tab bar now uses role-aware theming — Moon gets dark indigo/lavender, Sun gets warm cream/amber (was white/pink for both)
- **High:** Fixed 3 hardcoded English strings in health sync flow (CycleDataReview toggle, ManualCycleInput "Done" button, PermissionDeniedScreen "Open Settings")
- **High:** Edge Functions (`notify-cycle`, `notify-sos`) now send push notifications in user's preferred language (Vietnamese/English)
- **Medium:** Removed "AI" labels from both dashboards per product design rules (no AI terminology in UI)

## Features

- **Language-aware AI responses:** All 5 AI proxy endpoints now generate content in user's preferred language
- **User Persona Testing Pipeline:** New development skill for dual-persona UX testing
- **Expert Advisor Pipeline:** New skill for multi-expert review framework

## Improvements

- Documentation reorganized into structured folders (`docs/project/`, `docs/features/`, `docs/releases/`)
- Development pipelines updated with agent team mode support
- Shared testing standards across all pipelines
- 9 persona testing output documents from full app audit (48 issues identified)
- Local config directories (`.claude/`, `.playwright-mcp/`, `agents/`) added to `.gitignore`

## Breaking Changes

None.

## Deployment Notes

- Edge Functions must be redeployed: `supabase functions deploy notify-cycle notify-sos`
- 28 device test cases pending manual verification (all 45 code-inspection tests pass)
- No database migration required
- No new dependencies added

## Deferred

- ISS-004: Sun real-time cycle updates → `FEAT_20260309_001` (feature, not bug)
