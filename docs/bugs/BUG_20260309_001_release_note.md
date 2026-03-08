# Release Note: BUG_20260309_001

> **Version:** v1.5.2
> **Date:** 2026-03-09
> **Type:** Bug Fix Release
> **Source:** User Persona Testing (UPT_20260308_001)

---

## What's Fixed

### Cycle Tracking Accuracy (Critical)
Fixed a bug where the app showed incorrect cycle days and phases when your period was late. If your period didn't arrive on time, the app would "wrap around" and show you in a phantom menstrual phase instead of correctly indicating your period was late. Now the app accurately shows the real day count (e.g., Day 33 of a 28-day cycle) and keeps you in the luteal phase until you log your next period.

### Tab Bar Theming
The tab bar at the bottom of the screen now matches your role's theme. Moon users see a dark tab bar with lavender accents; Sun users see a warm cream tab bar with amber accents. Previously, both roles saw a white tab bar with pink accents.

### Vietnamese Translation Fixes
Fixed several screens that showed English text even when the app was set to Vietnamese:
- "How does this work?" / "Hide" toggle on the cycle data review screen
- "Done" button on the date picker
- "Open Settings" link on the permission screen

### Push Notification Language Support
Push notifications for cycle reminders (period approaching, started, ended) and SOS/Whisper alerts now arrive in your preferred language. Vietnamese users will receive notifications in Vietnamese instead of English.

### Cleaner UI
Removed technical labels from the user interface to keep the experience warm and personal.

---

## What's Not Included

- **Sun real-time cycle updates:** When Moon updates her cycle settings, Sun's dashboard will update on next app open rather than in real-time. A real-time sync feature is planned for a future release.

---

## Technical Details

- **16 files modified** across app code, translations, and Edge Functions
- **No database changes** — no migration required
- **Edge Functions must be redeployed** (`notify-cycle`, `notify-sos`)
- **73 test cases** executed: 45 passed (code inspection), 28 pending device verification

---

## Upgrade Notes

- Standard app update — no user action required
- Edge Functions: Deploy `notify-cycle` and `notify-sos` to Supabase after release
- No breaking changes to API or database schema
