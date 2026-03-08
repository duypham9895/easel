# BUG_20260308_001 — Test Cases

**Bug:** Display Name TextInput placeholder shows "Y o u r  n a" (truncated/spaced) instead of "Your name" due to hardcoded `width: 120` on the input.

**File under test:** `app/app/(tabs)/settings.tsx` (lines 153-172)

**Fix:** Replace `{ width: 120, padding: 6 }` with `{ flex: 1, padding: 6, textAlign: 'right' }` on the TextInput.

---

## A. Bug Verification Tests (P0)

| ID | Title | Type | Precondition | Steps | Expected Result | Priority |
|----|-------|------|--------------|-------|-----------------|----------|
| TC-001 | EN placeholder displays fully | Bug verification | App language set to English. Display Name field is empty (no saved name). | 1. Open app as Moon or Sun. 2. Navigate to Settings tab. 3. Observe the Display Name TextInput placeholder. | Placeholder text "Your name" is fully visible with no truncation. All 9 characters plus the space render completely inside the input. | P0 |
| TC-002 | VI placeholder displays fully | Bug verification | App language set to Vietnamese. Display Name field is empty. | 1. Open app. 2. Switch language to Vietnamese in Settings. 3. Clear Display Name if set. 4. Observe the placeholder text. | Placeholder text "Ten cua ban" is fully visible with no truncation. All 12 characters render completely inside the input. | P0 |
| TC-003 | Placeholder text has normal letter-spacing | Bug verification | Display Name field is empty. Tested in both EN and VI. | 1. Navigate to Settings. 2. Observe the Display Name placeholder text. 3. Compare letter-spacing visually against the "Email" or "Language" label text in adjacent rows. | Letters in the placeholder have normal, natural spacing consistent with `fontSize: 16` system font. No abnormal gaps between characters. The text does not appear as "Y o u r  n a" or any spaced-out variant. | P0 |
| TC-004 | Check button (Feather icon) remains visible | Bug verification | Display Name field is empty or contains text. | 1. Navigate to Settings. 2. Observe the check icon (Feather `check`, 18px, color `#FF5F7E`) to the right of the Display Name input. | The check icon is fully visible, not clipped or pushed off-screen. There is an 8px gap between the TextInput and the check button. The button is tappable (meets minimum touch target). | P0 |
| TC-005 | Input accepts and displays typed text correctly | Bug verification | Display Name field is empty. | 1. Navigate to Settings. 2. Tap the Display Name TextInput. 3. Type "Edward". 4. Observe the text inside the input. | Typed text "Edward" displays inside the input with normal font rendering (fontSize 16, right-aligned). Text is not truncated, spaced out, or clipped. | P0 |
| TC-006 | Input renders correctly on narrow screen (iPhone SE) | Bug verification | Device or simulator: iPhone SE (375pt width). Display Name field is empty. | 1. Open app on iPhone SE. 2. Navigate to Settings. 3. Observe the Display Name placeholder and input width. | Placeholder "Your name" renders fully without truncation. The input flexes to fill available space. Check button remains visible. No horizontal overflow or clipping in the Account card. | P0 |
| TC-007 | Input renders correctly on wide screen (iPhone Pro Max) | Bug verification | Device or simulator: iPhone Pro Max (430pt width). Display Name field is empty. | 1. Open app on iPhone Pro Max. 2. Navigate to Settings. 3. Observe the Display Name placeholder and input width. | Placeholder "Your name" renders fully. The input stretches appropriately for the wider screen. Layout remains balanced with the label on the left and input on the right. | P0 |

---

## B. Regression Tests (P1)

| ID | Title | Type | Precondition | Steps | Expected Result | Priority |
|----|-------|------|--------------|-------|-----------------|----------|
| TC-008 | Email row renders correctly | Regression | User is logged in with a valid email. | 1. Navigate to Settings. 2. Observe the Email row in the Account section. | Email row displays label "Email" on the left and the user's email address on the right, using `rowStyles.value`. Text is not truncated. Row height matches other Account rows. | P1 |
| TC-009 | Language row renders correctly | Regression | App is set to English or Vietnamese. | 1. Navigate to Settings. 2. Observe the Language row in the Account section. | Language row displays label "Language" on the left, the locale badge (EN/VI) and full language name on the right, with a chevron-right icon. Row aligns vertically with Email and Display Name rows. | P1 |
| TC-010 | Role row renders correctly | Regression | User has selected Moon or Sun role. | 1. Navigate to Settings. 2. Observe the Role row in the Account section. | Role row displays label "Role" on the left and the role value ("Moon" or "Sun") on the right. Row height and alignment are consistent with sibling rows. | P1 |
| TC-011 | Cycle Length input (SettingInput) renders correctly | Regression | User is Moon role with cycle settings visible. | 1. Navigate to Settings. 2. Scroll to Cycle Settings section. 3. Observe the Average Cycle Length input. | Cycle Length input uses `settingStyles.input` without any width override. Input renders with correct width, placeholder or value is fully visible, and the input is functional. | P1 |
| TC-012 | Period Length input (SettingInput) renders correctly | Regression | User is Moon role with cycle settings visible. | 1. Navigate to Settings. 2. Scroll to Cycle Settings section. 3. Observe the Average Period Length input. | Period Length input renders identically to Cycle Length input. No truncation, no style changes from the fix. | P1 |
| TC-013 | Last Period date picker renders correctly | Regression | User is Moon role with cycle settings visible. | 1. Navigate to Settings. 2. Scroll to Cycle Settings section. 3. Observe the Last Period Start date picker trigger. | The date picker TouchableOpacity uses `settingStyles.input` and displays the date value correctly. No visual regression from the fix. | P1 |
| TC-014 | Display Name save persists correctly | Regression | Display Name field is empty. | 1. Navigate to Settings. 2. Tap Display Name TextInput. 3. Type "Alice". 4. Tap the check button. 5. Wait for save to complete (ActivityIndicator appears briefly). 6. Navigate away from Settings. 7. Return to Settings. | The name "Alice" persists in the Display Name input after navigating away and returning. The `displayName` value in the Zustand store matches "Alice". No error alert appears. | P1 |
| TC-015 | Display Name save via keyboard submit | Regression | Display Name field is empty. | 1. Navigate to Settings. 2. Tap Display Name TextInput. 3. Type "Bob". 4. Press the "Done" button on the keyboard (`returnKeyType="done"`). | The name "Bob" saves successfully via `onSubmitEditing`. ActivityIndicator shows during save, then the check icon returns. Name persists in the store. | P1 |
| TC-016 | ActivityIndicator layout stability during save | Regression | Display Name field contains text. | 1. Navigate to Settings. 2. Type a name in the Display Name field. 3. Tap the check button. 4. Observe the row during the save operation. | When the check icon is replaced by `ActivityIndicator`, the row does not shift, jump, or change height. The TextInput width remains stable. The spinner appears in the same position as the check icon. | P1 |
| TC-017 | Account card has no overflow or clipping | Regression | All Account section rows are populated. | 1. Navigate to Settings. 2. Visually inspect the entire Account card (avatar, email, display name, language, role). | All rows are contained within the card boundaries. No content overflows the card edges. Dividers between rows are intact. Card border radius and padding are consistent. | P1 |
| TC-018 | Long display name renders gracefully | Regression | Display Name field is empty. | 1. Navigate to Settings. 2. Tap Display Name TextInput. 3. Type a long name: "Alexandrina Victoria Elizabeth" (30+ chars). 4. Observe the input rendering. | The long text either scrolls horizontally within the input or truncates with ellipsis. The check button remains visible and is not pushed off-screen. The row does not break or overflow the card. | P1 |
| TC-019 | Settings screen overall layout intact | Regression | User is Moon role, coupled with Sun. | 1. Navigate to Settings. 2. Scroll through all sections: Account, Partner/Partner Link, Health Data, Cycle Settings, Notifications. | All sections render correctly with proper spacing, labels, and values. No visual regressions in any section. Section headers (ACCOUNT, PARTNER, etc.) are properly styled. | P1 |

---

## C. Non-Regression Tests (P2)

| ID | Title | Type | Precondition | Steps | Expected Result | Priority |
|----|-------|------|--------------|-------|-----------------|----------|
| TC-020 | Moon Dashboard displays displayName correctly | Non-regression | Moon user has set display name "Luna" in Settings. | 1. Set display name to "Luna" in Settings. 2. Navigate to Moon Dashboard (Home tab). 3. Observe the greeting area. | The dashboard greeting uses "Luna" (e.g., "Hey Luna" or localized equivalent). The name renders with correct styling and is not truncated. | P2 |
| TC-021 | Sun Dashboard displays displayName correctly | Non-regression | Sun user has set display name "Sol" in Settings. | 1. Set display name to "Sol" in Settings. 2. Navigate to Sun Dashboard (Home tab). 3. Observe the greeting area. | The dashboard greeting uses "Sol" (e.g., "Hey Sol"). Name renders correctly in the Sun theme (`#FFF8F0` background). | P2 |
| TC-022 | Partner section renders correctly (Sun) | Non-regression | Sun user is linked to Moon partner. | 1. Log in as Sun. 2. Navigate to Settings. 3. Observe the Partner section. | Partner section shows Moon's phase and next period date in `rowStyles.row` format. Values are not truncated. Section is visually consistent with the Account section above it. | P2 |
| TC-023 | Partner Link section renders correctly (Moon) | Non-regression | Moon user is not yet linked to a Sun partner. | 1. Log in as Moon without a partner link. 2. Navigate to Settings. 3. Observe the Partner Link section. | The "Generate Link Code" or share code UI renders correctly. No layout regression from the Display Name fix. | P2 |
| TC-024 | Notification settings unaffected | Non-regression | Moon user with notification preferences visible. | 1. Navigate to Settings. 2. Scroll to Notifications section. 3. Observe toggle rows (Period approaching, Period started, Period ended). | All notification toggle rows render correctly with labels and switches. Toggle functionality works. The Smart Timing row (if visible) renders with proper label. No visual or functional changes from the fix. | P2 |
| TC-025 | WhisperSheet success circle unaffected | Non-regression | Moon user is linked to Sun. | 1. Log in as Moon. 2. Open the Whisper Sheet. 3. Send a whisper to Sun. 4. Observe the success animation. | The success circle (120x120, borderRadius 60) in `WhisperSheet.tsx` renders correctly. The `width: 120` on this decorative element is unrelated to the bug fix and remains intact. | P2 |

---

## Test Execution Summary

| Category | Count | Priority | Scope |
|----------|-------|----------|-------|
| A. Bug Verification | 7 | P0 | Confirm the fix resolves the placeholder truncation/spacing issue across locales and screen sizes |
| B. Regression | 12 | P1 | Verify no side effects on shared styles, sibling rows, save functionality, and layout |
| C. Non-Regression | 6 | P2 | Confirm unrelated screens and components remain unaffected |
| **Total** | **25** | | |

## Traceability

| Test IDs | Traced to Root Cause |
|----------|---------------------|
| TC-001 to TC-003 | Hardcoded `width: 120` causing placeholder truncation and letter-spacing artifacts |
| TC-004, TC-016 | Check button visibility in the flex row after removing fixed width |
| TC-005, TC-018 | TextInput text rendering after switching to `flex: 1` |
| TC-006, TC-007 | Responsiveness across screen widths (flex vs fixed width) |
| TC-008 to TC-010 | Adjacent Account rows sharing `rowStyles.row` |
| TC-011 to TC-013 | Other inputs sharing `settingStyles.input` base style |
| TC-014, TC-015 | Save functionality (`handleSaveName`, `updateDisplayName`) |
| TC-017, TC-019 | Overall Settings layout integrity |
| TC-020 to TC-025 | Downstream consumers and unrelated components |
