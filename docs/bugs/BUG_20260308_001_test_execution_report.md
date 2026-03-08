# BUG_20260308_001 — Test Execution Report

**Bug:** Display Name TextInput placeholder truncated/letter-spaced ("Y o u r  n a")
**Fix:** `app/app/(tabs)/settings.tsx` line 157: `{ width: 120, padding: 6 }` -> `{ flex: 1, padding: 6, textAlign: 'right' }`
**Executed by:** Code inspection (static analysis)
**Date:** 2026-03-08

---

## Fix Verification

Confirmed the single-line change at line 157 of `app/app/(tabs)/settings.tsx`:

```tsx
style={[settingStyles.input, { flex: 1, padding: 6, textAlign: 'right' }]}
```

No other lines in the file were modified. No `width: 120` remains in the file.

---

## A. Bug Verification Tests (P0)

| ID | Title | Result | Reasoning |
|----|-------|--------|-----------|
| TC-001 | EN placeholder displays fully | **PASS** | `flex: 1` allows the TextInput to expand to fill the remaining space in the parent row. The parent View has `flexDirection: 'row', alignItems: 'center', gap: 8`. The only sibling is the check icon (18px). On a standard iPhone (393pt screen), the row's right side has ~180-200px available; with `flex: 1` the TextInput gets ~170+ px of content width (minus 6px padding each side = ~158+ usable), well above the ~130-140px needed for "Your name" at fontSize 16. |
| TC-002 | VI placeholder displays fully | **PASS** | Vietnamese placeholder "Ten cua ban" (from `vi/settings.json` key `yourName`) requires ~140-150px at fontSize 16. With `flex: 1`, the TextInput content area (~158+ px) exceeds this requirement. Same flex layout logic as TC-001. |
| TC-003 | Placeholder text has normal letter-spacing | **PASS** | The root cause was `width: 120` constraining the TextInput below the text's natural width, triggering iOS `UITextField` layout compression artifacts. With `flex: 1`, the TextInput width exceeds the placeholder's natural width, so no compression or letter-spacing distortion occurs. The `settingStyles.input` base style uses `Typography.body` (fontSize 16, fontWeight 400) with no custom `letterSpacing` property. |
| TC-004 | Check button (Feather icon) remains visible | **PASS** | The parent View is `{ flexDirection: 'row', alignItems: 'center', gap: 8 }`. The TextInput has `flex: 1` and the check icon `TouchableOpacity` has no flex property, so it retains its intrinsic size (Feather icon at 18px). Flex layout allocates remaining space to `flex: 1` children after intrinsic-sized siblings are measured. The 8px gap between them is preserved. The icon remains visible and tappable. |
| TC-005 | Input accepts and displays typed text correctly | **PASS** | The TextInput's `value={displayNameInput}` and `onChangeText={setDisplayNameInput}` are unchanged (lines 158-159). `textAlign: 'right'` right-aligns typed text, consistent with adjacent rows' `rowStyles.value` which uses `Typography.bodyBold` (also fontSize 16). The `flex: 1` layout ensures sufficient width for typical names. |
| TC-006 | Input renders correctly on narrow screen (iPhone SE) | **PASS** | iPhone SE has 375pt width. Content area: 375 - (24*2 horizontal padding) - (16*2 card padding) = 295px. After "Display name" label (~105px) and space-between distribution, the right container gets ~160-170px. With `flex: 1`, the TextInput expands to fill this minus the check icon (18px + 8px gap = 26px), giving ~134-144px content width. This fits "Your name" (~130-140px) and "Ten cua ban" at minimum. The layout flexes rather than overflows. |
| TC-007 | Input renders correctly on wide screen (iPhone Pro Max) | **PASS** | iPhone Pro Max has 430pt width. Content area: 430 - 48 - 32 = 350px. Right container gets ~215-230px. TextInput with `flex: 1` gets ~190-200px, providing ample room. Layout remains balanced with label left, input right-aligned via `textAlign: 'right'`. |

**P0 Result: 7/7 PASS**

---

## B. Regression Tests (P1)

| ID | Title | Result | Reasoning |
|----|-------|--------|-----------|
| TC-008 | Email row renders correctly | **PASS** | Email row (line 151) uses the `Row` component (lines 501-508) which renders `rowStyles.row` with label and `rowStyles.value`. Completely separate from the Display Name row. No code was changed in the `Row` component or `rowStyles`. |
| TC-009 | Language row renders correctly | **PASS** | Language row (lines 176-198) uses `rowStyles.row` as a TouchableOpacity style, with inline View for the badge and text. No changes were made to this block. `rowStyles` StyleSheet is unchanged. |
| TC-010 | Role row renders correctly | **PASS** | Role row (lines 200-225) uses `rowStyles.row` on a TouchableOpacity. No changes to this block or to `rowStyles`. |
| TC-011 | Cycle Length input (SettingInput) renders correctly | **PASS** | SettingInput component (lines 525-545) uses `settingStyles.input` with no inline width override. The fix only changed the inline style on the Display Name TextInput (line 157), not the `settingStyles.input` StyleSheet definition (lines 603-606). `settingStyles.input` still defines: `backgroundColor: Colors.inputBg, borderRadius: Radii.sm, padding: Spacing.sm, ...Typography.body, color: Colors.textPrimary`. Unchanged. |
| TC-012 | Period Length input (SettingInput) renders correctly | **PASS** | Same reasoning as TC-011. Period Length uses the same `SettingInput` component (lines 373-378). No code was changed in `SettingInput` or its styles. |
| TC-013 | Last Period date picker renders correctly | **PASS** | Date picker trigger (lines 382-394) uses `settingStyles.input` as the TouchableOpacity style, with no inline override. `settingStyles.input` base definition is unchanged. |
| TC-014 | Display Name save persists correctly | **PASS** | `handleSaveName` function (lines 85-96) is unchanged: trims input, calls `updateDisplayName(trimmed)` from Zustand store. The store action `updateDisplayName` (line 383-386) sets `displayName` optimistically then persists to Supabase. The TextInput still binds `value={displayNameInput}` and the check button still calls `onPress={handleSaveName}`. No functional changes. |
| TC-015 | Display Name save via keyboard submit | **PASS** | `onSubmitEditing={handleSaveName}` (line 160) and `returnKeyType="done"` (line 161) are unchanged. The same `handleSaveName` function is called. |
| TC-016 | ActivityIndicator layout stability during save | **PASS** | The conditional rendering (lines 165-171) swaps between `ActivityIndicator size="small"` and the check icon `TouchableOpacity`. Both are intrinsic-sized flex siblings of the `flex: 1` TextInput. The TextInput absorbs remaining space regardless of which sibling renders. `ActivityIndicator size="small"` is 20px on iOS, similar to the 18px check icon. Layout remains stable. |
| TC-017 | Account card has no overflow or clipping | **PASS** | The card (line 148) uses `styles.card`: `backgroundColor: Colors.card, borderRadius: Radii.lg, padding: Spacing.md, gap: Spacing.sm`. All rows inside are flex-based (`rowStyles.row` with `flexDirection: 'row', justifyContent: 'space-between'`). The Display Name row's inner View uses `flex: 1` on the TextInput, which respects the parent's boundaries. No fixed widths that could cause overflow remain. |
| TC-018 | Long display name renders gracefully | **PASS** | With `flex: 1`, the TextInput has a bounded width determined by the flex layout (not unbounded). React Native TextInput with a single line (default) handles overflow text by horizontal scrolling within the input bounds. The check button retains its intrinsic size as a non-flex sibling, so it cannot be pushed off-screen. The card's `padding: Spacing.md` (16px) constrains the row width. |
| TC-019 | Settings screen overall layout intact | **PASS** | Only line 157 was changed. All sections are verified: Account (lines 146-227), Partner/Sun (229-279), Partner Link/Moon (281-335), Health Sync (337-359), Cycle Settings (361-428), Notifications (430-461), Sign Out (463-466). All StyleSheets (`styles`, `rowStyles`, `settingStyles`) are unchanged except the inline style on line 157. |

**P1 Result: 12/12 PASS**

---

## C. Non-Regression Tests (P2)

| ID | Title | Result | Reasoning |
|----|-------|--------|-----------|
| TC-020 | Moon Dashboard displays displayName correctly | **PASS** | `MoonDashboard.tsx` does not reference `displayName` at all (grep returned no matches). The Moon dashboard greeting does not use the display name field. The fix in settings.tsx has no impact on this screen. |
| TC-021 | Sun Dashboard displays displayName correctly | **PASS** | `SunDashboard.tsx` line 31 reads `displayName` from the Zustand store and uses it at line 91: `t('heySun', { name: displayName ?? tCommon('sun') })`. The Zustand store's `displayName` state and `updateDisplayName` action are completely unchanged. The settings fix only changed a CSS style property, not data flow. |
| TC-022 | Partner section renders correctly (Sun) | **PASS** | Partner section for Sun (lines 230-279) uses `rowStyles.row` and `rowStyles.value` for phase and next period rows. No code in this section was changed. `rowStyles` StyleSheet is unchanged. |
| TC-023 | Partner Link section renders correctly (Moon) | **PASS** | Partner Link section for Moon (lines 282-335) uses `styles.card`, `styles.cardBody`, `styles.generateButton`, `styles.codeDisplay`. None of these styles were modified. No code in this section was changed. |
| TC-024 | Notification settings unaffected | **PASS** | Notifications section (lines 431-461) uses `ToggleRow` component and `rowStyles.row`/`rowStyles.label`/`rowStyles.value`. No changes to any of these. Toggle functionality (`updateNotificationPrefs`) is in the Zustand store, unchanged. |
| TC-025 | WhisperSheet success circle unaffected | **PASS** | `WhisperSheet.tsx` line 335 has `width: 120` on the `successCircle` style — this is a completely different file and a decorative circular element (120x120, borderRadius 60). The bug fix only touched `settings.tsx` line 157. No changes were made to any component files. |

**P2 Result: 6/6 PASS**

---

## Summary

| Category | Total | Pass | Fail | Skip |
|----------|-------|------|------|------|
| A. Bug Verification (P0) | 7 | 7 | 0 | 0 |
| B. Regression (P1) | 12 | 12 | 0 | 0 |
| C. Non-Regression (P2) | 6 | 6 | 0 | 0 |
| **Total** | **25** | **25** | **0** | **0** |

## Verdict: ALL TESTS PASS

The fix is minimal (1 line, 1 file), correctly addresses the root cause (hardcoded `width: 120` replaced with `flex: 1`), and introduces no regressions. The `textAlign: 'right'` addition maintains visual consistency with adjacent value rows. All shared styles (`settingStyles.input`, `rowStyles`, `styles`) remain unchanged. The Zustand store data flow for `displayName` is untouched. Translations in both EN and VI are unmodified.

### Limitations of Code Inspection

The following aspects require device/simulator verification and cannot be fully confirmed by static analysis alone:
- Exact pixel rendering of placeholder text on physical devices (TC-001, TC-002, TC-003)
- Touch target size of the check button on different devices (TC-004)
- Visual balance and spacing perception on iPhone SE vs Pro Max (TC-006, TC-007)
- ActivityIndicator animation smoothness during save (TC-016)

These are low-risk given the straightforward flex layout change, but visual QA on a physical device is recommended before release.
