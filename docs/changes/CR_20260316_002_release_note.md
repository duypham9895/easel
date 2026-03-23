# CR_20260316_002 — Release Note

## User-Facing

### What Changed
The Calendar screen has been streamlined into a focused cycle timeline. You can now log period days by simply tapping any past day on the calendar — no more confusing buttons or redirects. Tap a day you've already logged to edit your flow, symptoms, and notes in a clean bottom sheet.

### Benefits
- **One-tap logging**: Tap any past day to instantly mark it as a period day
- **Quick editing**: Tap a logged day to open a detail sheet where you can adjust flow intensity, symptoms, factors, and notes
- **Cleaner layout**: The calendar is now focused on what matters — your cycle timeline and predictions

### What to Know
- Future days cannot be tapped (predictions are shown visually)
- Your existing period data is fully preserved
- The homepage daily check-in is unchanged

---

## Internal Changelog

### Technical Changes
- Removed `MyCycleCard` component from Calendar screen (`calendar.tsx`)
- Removed `/health-sync` redirect from Calendar tab
- Converted `PeriodLogPanel` from inline `react-native-reanimated` animated card to `Modal` bottom sheet
- Implemented two-tap day interaction in `handleDayPress`:
  - Unlogged past/today day → `savePeriodDayLog(date, 'medium', [])`
  - Logged day → opens Modal bottom sheet
  - Future day → no-op
- Bottom sheet follows established pattern (SOSSheet, PeriodLogSheet): Modal + Animated spring + Pressable backdrop

### Affected Components
- `app/app/(tabs)/calendar.tsx`
- `app/components/moon/PeriodLogPanel.tsx`

### Migration Notes
- No database migration required
- No new dependencies
- No breaking API changes
- Unused MyCycleCard translation keys preserved (safe to clean up later)

---

## Developer Note

### Files Modified
1. `app/app/(tabs)/calendar.tsx` — removed MyCycleCard, added two-tap logic, Modal-based PeriodLogPanel
2. `app/components/moon/PeriodLogPanel.tsx` — converted from Animated.View inline card to Modal bottom sheet

### APIs Changed
- `PeriodLogPanel` props: added `visible: boolean` (required)

### Breaking Changes
None.
