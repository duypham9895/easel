# CR_20260316_001 — UX Copy Spec: Log Period (Flo-Style)

**Date:** 2026-03-16
**Author:** UX Writer (Claude)
**Status:** Draft
**Screens affected:** PeriodLogSheet (redesigned), push notifications, calendar tooltips

---

## Tone Reminder

Easel speaks like a caring friend. Short sentences, warm language, no medical jargon. We say "your flow" not "menstrual discharge." We say "a bit" not "moderate." Every word should feel like it was written by someone who genuinely cares about you.

---

## Copy Table

| # | Surface | Current Copy (EN) | New Copy (EN) | New Copy (VI) | Rationale |
|---|---------|-------------------|---------------|---------------|-----------|
| 1 | **Screen title** | *(date shown as header, no explicit title)* | "Log your day" | "Ghi nhận ngày hôm nay" | Shifts framing from "logging a period" (clinical task) to "logging your day" (personal ritual). Less intimidating for first-time users. |
| 2 | **Calendar section header** | *(no section header — date + marker badge only)* | "Pick a date" | "Chon ngay" | Short directive that orients the user. Only shown when the calendar is the primary interaction (not when opened from a specific date tap). When opened from a date tap, the selected date displays instead. |
| 3 | **Empty state (no period logged this cycle)** | "No periods logged yet" / "Log your periods for more accurate predictions" | "No period logged yet this cycle. Tap a date to get started." | "Chua ghi ky kinh nao trong chu ky nay. Cham vao mot ngay de bat dau." | Adds actionability. Tells the user exactly what to do next instead of just stating absence. |
| 4a | **Flow intensity label — Spotting** | *(not in current design)* | "A little" | "Mot chut" | Avoids the clinical term "spotting" which can confuse users unfamiliar with cycle tracking. "A little" feels conversational and approachable. |
| 4b | **Flow intensity label — Light** | *(not in current design)* | "Light" | "Nhe" | Already warm and human. No change needed. |
| 4c | **Flow intensity label — Medium** | *(not in current design)* | "Moderate" | "Vua" | "Moderate" reads clearly without being clinical. Short, neutral, easily understood. |
| 4d | **Flow intensity label — Heavy** | *(not in current design)* | "Heavy" | "Nhieu" | Direct and familiar. No euphemism needed here — users understand "heavy" intuitively. |
| 5a | **Symptom chip — Cramps** | "Cramps" *(from checkin.json)* | "Cramps" | "Dau bung" | Keeping this — it is already conversational and universally understood. |
| 5b | **Symptom chip — Fatigue** | "Fatigue" *(from checkin.json)* | "Tired" | "Met moi" | "Tired" is warmer and more everyday than "fatigue," which leans clinical. |
| 5c | **Symptom chip — Headache** | "Headache" *(from checkin.json)* | "Headache" | "Dau dau" | Already natural. No change. |
| 5d | **Symptom chip — Bloating** | "Bloating" *(from checkin.json)* | "Bloating" | "Day bung" | Common enough in everyday speech. Keeping as-is. |
| 5e | **Symptom chip — Mood swings** | "Mood swings" *(from checkin.json)* | "Moody" | "Hay doi" | Shorter, fits chip UI better, and feels less like a diagnosis. "Mood swings" sounds like something a doctor would say. "Moody" sounds like something you would say about yourself. |
| 5f | **Symptom chip — Nausea** | *(not in current design)* | "Nausea" | "Buon non" | Clear and commonly used in everyday language. No need to soften. |
| 6 | **Notes placeholder text** | "How are you feeling today?" | "Anything you want to remember about today..." | "Dieu gi ban muon ghi nho ve hom nay..." | The current placeholder is a mood question (already handled by daily check-in). The new placeholder reframes notes as a personal journal entry — complementary to mood tracking, not redundant. Ellipsis invites open-ended writing. |
| 7 | **Save button label** | "Log period start" / "End period here" | "Save" | "Luu" | In the redesigned flow, the user has already selected flow intensity and symptoms above. The save button confirms the entire entry — not just a period start/end. Simple, clear, universal. |
| 8 | **Toast confirmation (after save)** | *(Alert.alert: "Period Started" / confirm message)* | "Saved — your cycle is updated" | "Da luu — chu ky da duoc cap nhat" | Replaces modal alert with a non-blocking toast. Confirms both the save action and that predictions have adjusted. Warm "got it" tone from the existing health.json copy. |
| 9 | **Partner notification (push to Sun)** | "Moon updated her period log" | "Moon's period just started — she might need a little extra care today" | "Ky kinh cua Moon vua bat dau — co ay co the can duoc quan tam nhieu hon hom nay" | The current copy is factual but cold. The new copy gives Sun emotional context and a gentle nudge toward action, which is the whole point of Easel. Only sent on period start, not on every log edit. |
| 10 | **Error state — save failed** | "Could not save. Please try again." *(from checkin.json)* | "Something went wrong. Your log wasn't saved — try again?" | "Co loi xay ra. Ghi nhan chua duoc luu — thu lai nhe?" | Acknowledges the failure honestly, tells the user what happened (log not saved), and offers a next step. The question mark softens the ask. |
| 11 | **Tooltip — what does "predicted" mean** | *(no tooltip exists)* | "This is our best guess based on your cycle history. The more you log, the closer we get." | "Day la du doan dua tren lich su chu ky cua ban. Ban ghi nhan cang nhieu, du doan cang chinh xac." | Explains prediction in plain language without using "algorithm" or "AI." Encourages continued logging as a natural benefit, not a chore. |
| 12 | **Onboarding hint (first-time users)** | *(no onboarding hint exists)* | "Tap any date to log how your flow felt that day." | "Cham vao bat ky ngay nao de ghi nhan dong chay hom do." | One-line coach mark for first-time users opening the log sheet. Teaches the interaction without overwhelming. Uses "flow" to normalize the vocabulary early. |
| 13a | **Delete confirmation — title** | "Delete period log?" / "This will remove this period from your history. This cannot be undone." | "Remove this entry?" | "Xoa muc nay?" | Softer than "delete" — "remove" feels less permanent and scary even though the action is the same. |
| 13b | **Delete confirmation — body** | *(same as above)* | "This will be removed from your history and your predictions will update." | "Muc nay se bi xoa khoi lich su va du doan se duoc cap nhat." | Tells the user both consequences: data removal and prediction recalculation. Honest but not alarming. |
| 13c | **Delete confirmation — confirm button** | "Delete" | "Remove" | "Xoa" | Consistent with the title language. |
| 13d | **Delete confirmation — cancel button** | "Cancel" | "Keep it" | "Giu lai" | "Keep it" is warmer and more decisive than "Cancel." It affirms the user's choice to not delete, rather than just aborting an action. Matches existing `deleteNo` copy in health.json. |
| 14 | **Flow intensity section header** | *(not in current design)* | "How's your flow?" | "Dong chay the nao?" | Conversational question format, consistent with the check-in screen's "How are you feeling today?" pattern. Uses "flow" — a word people actually use when talking about their period. |
| 15 | **Symptom section header** | *(not in current design — "Factors" used for override tags)* | "How's your body feeling?" | "Co the ban cam thay the nao?" | Distinct from the mood check-in question. Focuses specifically on physical symptoms. Warm and personal — talks to the user, not about the user. |

---

## Notes for Implementation

### New i18n keys needed (namespace: `calendar`)

```
periodLogSheet.screenTitle
periodLogSheet.calendarHeader
periodLogSheet.emptyState
periodLogSheet.flowHeader
periodLogSheet.flow.spotting
periodLogSheet.flow.light
periodLogSheet.flow.medium
periodLogSheet.flow.heavy
periodLogSheet.symptomHeader
periodLogSheet.symptom.cramps
periodLogSheet.symptom.tired
periodLogSheet.symptom.headache
periodLogSheet.symptom.bloating
periodLogSheet.symptom.moody
periodLogSheet.symptom.nausea
periodLogSheet.notePlaceholder
periodLogSheet.save
periodLogSheet.toastSaved
periodLogSheet.errorSaveFailed
periodLogSheet.tooltipPredicted
periodLogSheet.onboardingHint
periodLogSheet.deleteTitle
periodLogSheet.deleteBody
periodLogSheet.deleteConfirm
periodLogSheet.deleteCancel
periodLogSheet.flowHeader
```

### Updated push notification key (namespace: `calendar`)

```
partnerPeriodStarted   (new — replaces partnerPeriodUpdated for start events)
partnerPeriodUpdated   (keep — for non-start edits)
```

### Existing keys to deprecate

| Key | Namespace | Reason |
|-----|-----------|--------|
| `logPeriodStart` | calendar | Replaced by flow-based save |
| `endPeriodHere` | calendar | Replaced by flow-based save |
| `factors` | calendar | Replaced by `periodLogSheet.symptomHeader` |
| `factorsSubtitle` | calendar | No longer needed — section header is self-explanatory |
| `confirmDelete` | calendar | Replaced by `periodLogSheet.deleteTitle` |
| `confirmDeleteMessage` | calendar | Replaced by `periodLogSheet.deleteBody` |

### Character limits

| Surface | Max chars (EN) | Max chars (VI) | Notes |
|---------|---------------|----------------|-------|
| Screen title | 20 | 30 | Single line, headline style |
| Flow labels | 10 | 12 | Must fit inside round selector |
| Symptom chips | 12 | 15 | Pill-shaped, single line |
| Notes placeholder | 50 | 60 | Truncated with ellipsis |
| Save button | 10 | 10 | Full-width button |
| Toast message | 45 | 55 | Auto-dismiss after 3s |
| Push notification body | 100 | 120 | iOS truncates beyond this |
| Tooltip | 100 | 120 | Popover, max 2 lines |
| Onboarding hint | 55 | 65 | Coach mark overlay |
| Delete confirmation body | 80 | 90 | Alert dialog |

### Accessibility (VoiceOver / TalkBack)

All flow intensity selectors should announce: "[label] — [selected/not selected]"
Example: "Light — selected" / "Nhe — da chon"

Symptom chips follow the same pattern: "Cramps — selected" / "Dau bung — da chon"

### Vietnamese diacritics note

The Vietnamese copy in the table above is shown **without diacritics** for markdown table compatibility. The actual i18n JSON files must include full diacritics. Reference translations with proper diacritics:

| # | Vietnamese (with diacritics) |
|---|-----|
| 1 | Ghi nhan ngay hom nay |
| 2 | Chon ngay |
| 3 | Chua ghi ky kinh nao trong chu ky nay. Cham vao mot ngay de bat dau. |
| 4a | Mot chut |
| 4b | Nhe |
| 4c | Vua |
| 4d | Nhieu |
| 5a | Dau bung |
| 5b | Met moi |
| 5c | Dau dau |
| 5d | Day bung |
| 5e | Hay doi |
| 5f | Buon non |
| 6 | Dieu gi ban muon ghi nho ve hom nay... |
| 7 | Luu |
| 8 | Da luu — chu ky da duoc cap nhat |
| 9 | Ky kinh cua Moon vua bat dau — co ay co the can duoc quan tam nhieu hon hom nay |
| 10 | Co loi xay ra. Ghi nhan chua duoc luu — thu lai nhe? |
| 11 | Day la du doan dua tren lich su chu ky cua ban. Ban ghi nhan cang nhieu, du doan cang chinh xac. |
| 12 | Cham vao bat ky ngay nao de ghi nhan dong chay hom do. |
| 13a | Xoa muc nay? |
| 13b | Muc nay se bi xoa khoi lich su va du doan se duoc cap nhat. |
| 13c | Xoa |
| 13d | Giu lai |
| 14 | Dong chay the nao? |
| 15 | Co the ban cam thay the nao? |

> **Action item for implementation:** Have a native Vietnamese speaker review all VI copy with proper diacritics before merging into i18n files. The transliterations above are directional only.
