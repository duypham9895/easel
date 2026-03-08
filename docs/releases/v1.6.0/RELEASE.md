# Release v1.6.0

**Date:** 2026-03-08
**Platform:** iOS (Android unchanged)

## Features

- [ios-health-sync](../../features/ios-health-sync/PRD.md) — Redesigned HealthKit onboarding with multi-step wizard, manual cycle input fallback, and prediction confidence scoring
- Redesigned notification settings — removed whisper toggle (always-on), renamed AI timing to "Smart timing", cleaner UX
- Comprehensive app improvements — security hardening, bilingual AI prompts, batch DB queries in edge functions

## Bug Fixes

- [BUG_20260308_002](../../bugs/BUG_20260308_002_triage.md) — Fixed daily cycle notifications never being sent (edge functions were never deployed due to fragile CI condition)
- [BUG_20260308_001](../../bugs/BUG_20260308_001_triage.md) — Fixed Display Name placeholder truncated and letter-spaced on Settings screen
- Fixed date picker visibility on Moon's dark theme (text/background contrast)
- Fixed RLS violation when updating profiles (switched from `.upsert()` to `.update()`)
- Fixed notification API compatibility with Expo SDK 54 and Xcode 26 sandbox build

## Improvements

- 60+ new i18n keys for EN and VI covering onboarding wizard, notification settings, and dashboard
- Product design rules codified for notifications and UI terminology
- Development pipelines reviewed and strengthened with shared TESTING_STANDARDS.md
- Edge functions now deploy on every push to main (idempotent, prevents silent failures)
- Accessibility roles on all interactive elements

## Breaking Changes

None.

## Notes

- Edge functions (`notify-cycle`, `notify-sos`) are now deployed for the first time — daily cycle notifications will start working
- Check Supabase Dashboard for `notify-sos` Database Webhook (Table: `sos_signals`, Event: INSERT)
- No new dependencies added
- Android onboarding unchanged — enhancement planned for v1.7.0
