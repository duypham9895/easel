# BUG_20260308_001 — Impact Map

## 1. Directly Involved Files & Modules

| File | Role | Lines of Interest |
|------|------|-------------------|
| `app/app/(tabs)/settings.tsx` | **Primary bug location** — Display Name TextInput with `width: 120` inline override | L153-172 (Display Name row), L594-607 (style definitions) |
| `app/constants/theme.ts` | Provides `Typography.body` (fontSize 16), `Colors.inputBg`, `Radii.sm` (12), `Spacing.sm` (8) used by `settingStyles.input` | L42-50 (Typography), L1-6 (Colors) |
| `app/i18n/en/settings.json` | Placeholder string `"yourName": "Your name"` (9 chars) | L6 |
| `app/i18n/vi/settings.json` | Placeholder string `"yourName": "Tên của bạn"` (12 chars — longer than EN) | L6 |
| `app/store/appStore.ts` | `displayName` state field + `updateDisplayName` action | L35, L384-387 |
| `app/lib/db/profiles.ts` | `display_name` column in `DbProfile`, `upsertProfile` writes it | L8, L17, L30 |

## 2. Shared Styles & Components Within settings.tsx

The bug is in a file that defines three local `StyleSheet` groups, all of which are shared across multiple UI sections:

### `rowStyles` (used 12 times across 7 distinct UI rows)
- **Display Name row** (L153) — the buggy row, uses `rowStyles.row` + `rowStyles.label`
- **Email row** (L151) — via `Row` component
- **Language row** (L177) — `rowStyles.row` + `rowStyles.label` + `rowStyles.value`
- **Role row** (L201) — `rowStyles.row` + `rowStyles.label` + `rowStyles.value`
- **Partner Phase row** (L254) — Sun only, `rowStyles.row` + `rowStyles.value`
- **Partner Next Period row** (L265) — Sun only, `rowStyles.row` + `rowStyles.value`
- **Days Before Period row** (L445) — Moon only, `rowStyles.row` + `rowStyles.value`
- **`Row` component** (L501-508) — reusable, uses `rowStyles.row`, `.label`, `.value`
- **`ToggleRow` component** (L514-523) — reusable, uses `rowStyles.row`, `.label`

### `settingStyles` (used 4 times across 3 distinct inputs)
- **Display Name TextInput** (L157) — `settingStyles.input` with inline `width: 120, padding: 6` override (THE BUG)
- **Cycle Length TextInput** (L537) — via `SettingInput` component, `settingStyles.input` WITHOUT width override (works correctly)
- **Period Length TextInput** (L537) — via `SettingInput` component, same (works correctly)
- **Last Period Start date picker** (L383) — `settingStyles.input` as TouchableOpacity style (works correctly)

### Key observation
The bug is isolated to the **inline style override** `{ width: 120, padding: 6 }` on line 157. The base `settingStyles.input` style is healthy — the three other usages of `settingStyles.input` (cycle length, period length, date picker) render correctly because they do not apply a fixed width.

### Other files using `width: 120` (NOT related to TextInput)
| File | Usage | Risk |
|------|-------|------|
| `app/components/moon/WhisperSheet.tsx:335` | Circle avatar/icon (120x120, borderRadius 60) | None — decorative, unrelated |
| `app/components/moon/HealthSyncPrompt.tsx:115` | Circle icon container (120x120, borderRadius 60) | None — decorative, unrelated |

## 3. User Flows Touching the Affected Code Path

### Flow 1: First-time Setup (HIGHEST VISIBILITY)
1. User signs up and selects role (Moon or Sun)
2. User navigates to Settings tab
3. Display Name field is empty — placeholder "Your name" / "Tên của bạn" renders broken
4. User types a name and taps check button to save
5. `updateDisplayName()` persists to Supabase

**Impact:** Every new user sees the broken placeholder on their first Settings visit.

### Flow 2: Display Name Editing
1. Existing user opens Settings
2. Clears the Display Name field to re-enter a new name
3. Placeholder reappears — broken again
4. User types new name and saves

### Flow 3: Sun Dashboard Greeting
1. Sun's dashboard reads `displayName` from store (L31 of `SunDashboard.tsx`)
2. If null (name never saved due to confusion from broken UI), falls back to generic "Sun"
3. Greeting shows `"Hey Sun"` instead of personalized `"Hey [Name]"`

**Downstream impact:** A confusing Settings UI may cause users to skip entering their name, degrading personalization across the app.

### Flow 4: Language Toggle (Adjacent Row)
1. User taps Language row (directly below Display Name)
2. This row uses `rowStyles.row` — same parent style as the Display Name row
3. Language toggle is NOT affected by the bug but shares visual proximity

### Flow 5: Partner-Linked Sun Viewing Moon's Phase
1. Sun user visits Settings
2. Sees Account section (with buggy Display Name) + Partner section
3. Partner section uses `rowStyles.row` for Phase and Next Period rows
4. These rows are unaffected but are visually adjacent

## 4. Edge Cases That Could Break During Fix

### 4.1 Long Display Names
If fix uses `flex: 1` instead of `width: 120`, a very long display name (e.g., 30+ characters) could overflow or push the check button off-screen. The fix must ensure `maxWidth` or text truncation (`numberOfLines={1}`) is applied.

### 4.2 Vietnamese Placeholder Length
Vietnamese placeholder "Tên của bạn" is 12 characters vs English "Your name" at 9 characters. Any fixed-width solution must accommodate the longer locale string. A flex-based solution naturally handles this.

### 4.3 Check Button Visibility
The save button (Feather `check` icon at 18px) sits to the right of the TextInput inside a `flexDirection: 'row'` container with `gap: 8`. If the TextInput flexes too aggressively, the check button could be squeezed. The fix should ensure the button retains its minimum tap target.

### 4.4 ActivityIndicator Swap
When `isSavingName` is true, the check icon is replaced with an `ActivityIndicator`. Both elements must have stable layout dimensions so the row does not shift during save.

### 4.5 Row Height Consistency
The Display Name row must maintain the same `paddingVertical: Spacing.xs` (4px) as sibling rows (Email, Language, Role). If the TextInput's vertical padding changes, the row could appear taller or shorter than neighbors.

### 4.6 Keyboard Interaction
The TextInput has `returnKeyType="done"` and `onSubmitEditing={handleSaveName}`. Width changes should not affect keyboard behavior, but verify that the input remains tappable and focusable at the new width.

### 4.7 settingStyles.input Padding Conflict
The inline override `padding: 6` conflicts with the base `settingStyles.input` padding of `Spacing.sm` (8). The fix should decide: use the base padding or a deliberate override. Inconsistent padding between the Display Name input and other `settingStyles.input` users could look off.

### 4.8 Landscape / Large Fonts
If the user has accessibility large text enabled or rotates to landscape, a fixed width would be even more problematic. A flex-based solution is inherently more resilient to these cases.

## 5. Risk Assessment & Regression Test Plan

### HIGH RISK — Must Regression Test

| Area | Why | How to Test |
|------|-----|-------------|
| **Display Name placeholder (EN)** | Direct bug fix target | Clear name, verify "Your name" renders fully, no letter-spacing artifacts |
| **Display Name placeholder (VI)** | Longer placeholder string, i18n variant | Switch to Vietnamese, verify "Tên của bạn" renders fully |
| **Display Name with text** | Verify entered text still renders correctly | Type a name, verify it displays properly in the input |
| **Check button visibility** | Adjacent element in same flex row | Verify check icon is fully visible and tappable next to the input |
| **Save functionality** | `handleSaveName` triggered via button and keyboard | Enter a name, tap check, verify save succeeds and `displayName` updates in store |
| **Cycle Length / Period Length inputs** | Share `settingStyles.input` base style | Verify these inputs in Cycle Settings section still render correctly |
| **Last Period date picker** | Shares `settingStyles.input` base style | Verify the date picker trigger still renders correctly |

### MEDIUM RISK — Should Regression Test

| Area | Why | How to Test |
|------|-----|-------------|
| **Row visual alignment** | Display Name row sits between Email and Language rows | Verify all Account section rows have consistent height and alignment |
| **ActivityIndicator during save** | Layout stability during loading state | Tap save, verify no layout shift when spinner replaces check icon |
| **Sun Dashboard greeting** | Consumes `displayName` from store | Set a name in Settings, navigate to Sun Dashboard, verify greeting uses the name |
| **Long name input** | Edge case for flex-based width | Enter a 30+ character name, verify text truncates or scrolls gracefully |

### LOW RISK — Optional Regression

| Area | Why | How to Test |
|------|-----|-------------|
| **WhisperSheet success circle** | Uses `width: 120` but for a decorative circle, not TextInput | Visual check that whisper success animation still renders |
| **HealthSyncPrompt icon** | Uses `width: 120` for icon container | Visual check that health sync icon renders |
| **Partner section rows** | Same `rowStyles.row` but no TextInput | Verify Phase and Next Period rows still render for linked Sun users |

### Summary

| Risk Level | Count | Key Concern |
|------------|-------|-------------|
| HIGH | 7 | Fix correctness, style spillover to shared `settingStyles.input`, i18n |
| MEDIUM | 4 | Visual consistency, downstream data flow |
| LOW | 3 | Unrelated usages of `width: 120` |

### Recommended Fix Approach (Reference Only)

Replace `{ width: 120, padding: 6 }` with `{ flex: 1 }` on the TextInput, keeping the base `settingStyles.input` padding intact. This allows the input to fill available space in the flex row while the check button retains its natural size. No changes needed to `settingStyles.input` itself or any other component.
