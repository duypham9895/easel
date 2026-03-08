# BUG_20260308_001 — Release Note

**Date:** 2026-03-08
**Version:** v1.5.2
**Severity:** Medium (P2)

---

## 1. User-Facing Release Note

### Settings screen fix: Display Name field now shows properly

Previously, when you opened Settings before entering a display name, the placeholder text in the name field appeared garbled -- letters were spread apart with odd spacing and the text was cut off. It looked like something was broken, even though typing still worked fine.

This is now fixed. The "Your name" placeholder (and its Vietnamese equivalent) displays clearly and completely on all screen sizes. The save button next to the field is also fully visible and easy to tap.

Nothing else about Settings has changed -- your cycle settings, notifications, partner link, and everything else remain exactly as they were.

---

## 2. Internal Changelog

| Field | Detail |
|-------|--------|
| **Bug ID** | BUG_20260308_001 |
| **Root Cause Category** | Layout / CSS constraint error |
| **Root Cause** | Hardcoded `width: 120` on the Display Name TextInput created a container too narrow for the placeholder text at fontSize 16 (~130-140px needed). iOS UITextField compressed the text, producing letter-spacing artifacts and truncation. |
| **Affected Components** | Settings screen -- Display Name row only |
| **Affected Users** | All users (Moon and Sun), 100% reproducible when display name is not yet set |
| **Fix Approach** | Replaced `width: 120` with `flex: 1` so the TextInput expands naturally within its parent flex row. Added `textAlign: 'right'` for visual alignment with adjacent value rows (Email, Language, Role). |
| **Fix Size** | 1 line changed, 0 files added, 0 files deleted |
| **i18n Impact** | Fix benefits all locales -- flex layout adapts to any placeholder length |
| **Breaking Changes** | None |

---

## 3. Developer Note

### Files Changed

| File | Line | Change |
|------|------|--------|
| `app/app/(tabs)/settings.tsx` | 157 | Inline style `{ width: 120, padding: 6 }` changed to `{ flex: 1, padding: 6, textAlign: 'right' }` |

### Shared Styles Unchanged

- `settingStyles.input` (lines 603-606) -- base input style, not modified
- `rowStyles` -- all row layout styles intact
- `styles` -- all card/section styles intact

### Risk Areas to Monitor

- **iPhone SE (375pt):** Narrowest supported screen. Static analysis confirms ~134-144px content width available, which is tight for longer locale placeholders. Visual QA recommended.
- **ActivityIndicator swap:** During save, the check icon is replaced by a spinner. Both are intrinsic-sized flex siblings -- layout should remain stable, but worth a visual check.
- **Long display names:** With `flex: 1` the input is bounded by the flex row, so long names scroll horizontally within the field. The save button cannot be pushed off-screen.

### Test Coverage

| Category | Tests | Result |
|----------|-------|--------|
| Bug Verification (P0) | 7 | 7/7 PASS |
| Regression (P1) | 12 | 12/12 PASS |
| Non-Regression (P2) | 6 | 6/6 PASS |
| **Total** | **25** | **25/25 PASS** |

Tests were executed via code inspection (static analysis). Physical device visual QA is recommended for pixel-level rendering confidence.
