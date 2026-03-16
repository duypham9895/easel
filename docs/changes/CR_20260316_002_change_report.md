# CR_20260316_002 — Change Report

## Change Summary
Rebuilt the Calendar screen from a mixed-purpose view into a focused Cycle Timeline. Removed the MyCycleCard component (which contained a misleading "Log a period" redirect to health-sync) and converted the period log panel from an inline card to a proper bottom sheet Modal. Implemented a two-tap interaction: tap an unlogged day to instantly mark it as a period day, tap a logged day to open a bottom sheet for editing flow, symptoms, and notes.

## Business Justification
The "Log a period" button was mislabeled — it redirected to health-sync settings instead of actually logging a period. This broke user trust. The Calendar screen also had no clear single purpose, combining calendar, cycle stats, and period history. The rebuild gives it one job: visual cycle timeline with direct tap-to-log.

## Scope

### In Scope (Completed)
- Removed MyCycleCard from Calendar screen
- Removed health-sync redirect
- Converted PeriodLogPanel to Modal bottom sheet
- Implemented two-tap day interaction (auto-mark / edit sheet)
- Future day tap blocking

### Out of Scope
- Homepage (unchanged)
- PartnerCalendarView (unchanged)
- Database/migration changes (none needed)
- MyCycleCard component deletion (preserved for potential reuse)
- Translation key cleanup (unused keys left in place)

## Files Changed

| File | Change Type | Lines Changed |
|---|---|---|
| `app/app/(tabs)/calendar.tsx` | Major refactor | ~50 lines changed |
| `app/components/moon/PeriodLogPanel.tsx` | Major refactor (inline → Modal) | ~80 lines changed |

## Design / Copy Changes
- No new design tokens needed
- No new translation keys needed
- MyCycleCard-related translation keys now unused from Calendar (not deleted)

## Test Coverage
- 25 test cases written (10 P0, 11 P1, 4 P2)
- 4 automated tests PASS (3 code-inspection, 1 build-check)
- 21 device-test cases UNTESTED (awaiting user verification)

## Backward Compatibility
- No breaking changes to data model
- No breaking changes to APIs
- Existing period_day_logs and period_logs data fully compatible
- Sun's PartnerCalendarView completely unaffected

## Regression Status
- TypeScript build: PASS
- No regressions detected via code inspection
- Device regression tests pending user verification

## Scope Deviations
None. All changes map directly to accepted requirements.

## Release Recommendation
**Conditional release** — pending user device verification of P0 test cases.

## Confidence Level
**Low** — All automated checks pass, but 21 device-test cases require user confirmation. Confidence will be **High** once P0 device tests are verified.
