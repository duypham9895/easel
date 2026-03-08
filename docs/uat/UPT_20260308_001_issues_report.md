# UPT_20260308_001 -- Phase 7: Consolidated Issues Report

**Session:** UPT_20260308_001
**Phase:** 7 of 9 (User Persona Testing Pipeline)
**Date:** 2026-03-08
**Compiled by:** QA Engineer (Phase 7)
**Source documents:** Setup, Linh Onboarding, Minh Onboarding, 30-Day Daily Usage Log, Emotional Scenarios, Friction Log, Persona Debrief
**App version:** v1.5.1

---

## Issue Summary

| Severity | Count |
|----------|-------|
| Critical | 11 |
| High | 15 |
| Medium | 14 |
| Low | 8 |
| **Total** | **48** |

### Routing Summary

| Pipeline | Count |
|----------|-------|
| BUG_FIX_PIPELINE | 9 |
| CHANGE_REQUEST_PIPELINE | 19 |
| FEATURE_DEVELOPMENT_PIPELINE | 14 |
| Delight Opportunity (future sprint) | 6 |

---

## Critical Issues (11)

| ID | Source Phases | Who Found | Type | Description | Severity | Affected Area | Suggested Fix | Code Reference | Route To |
|---|---|---|---|---|---|---|---|---|---|
| ISS-001 | P4 (Scenario C), P5 (#26) | Both | Bug | **Cycle calculator wraps past expected period via modulo arithmetic.** `(diffDays % avgCycleLength) + 1` causes the app to show Day 5 of a phantom new cycle when the period is 5 days late. App displays menstrual phase content while the user has not started bleeding. Trust-breaking: the app confidently shows the wrong phase. | Critical | `app/utils/cycleCalculator.ts` line 19 (`getCurrentDayInCycle`) | Clamp at `avgCycleLength + N` instead of wrapping. Show "Day 33 of expected 28-day cycle" rather than resetting to Day 5. | `app/utils/cycleCalculator.ts` | BUG_FIX_PIPELINE |
| ISS-002 | P4 (Scenario C), P5 (#27), P6 (Linh Q3, Q5) | Both | Emotional Miss | **No late-period detection or supportive content.** When cycle exceeds expected length by 2+ days, the app provides zero acknowledgment, no reassurance, and no guidance. User feels abandoned during most anxious health moment. | Critical | `app/utils/cycleCalculator.ts`, `app/screens/MoonDashboard.tsx` | Detect when `dayInCycle > avgCycleLength + 2`. Surface "Your cycle seems longer than usual" with supportive (not medical) content. Suggest consulting a doctor if concerned. | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-003 | P4 (Scenario I), P5 (#24, #28), P6 (Linh Q3) | Linh | Navigation | **"Period Started" action buried in Settings as a date picker.** The most important recurring user action (confirming period start) requires navigating to Settings > Cycle Settings > date picker > save. No prominent CTA on the dashboard. No ritual acknowledgment. | Critical | `app/app/(tabs)/settings.tsx`, `app/screens/MoonDashboard.tsx` | Add a "Has your period started?" prompt on the Moon dashboard near the predicted date. Two options: "Yes, today" and "Not yet." On confirmation, show a warm transition ("New cycle, Day 1. Your body is doing important work."). | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-004 | P4 (Scenario I), P5 (#29) | Minh | Bug | **Sun does not receive real-time cycle updates when Moon changes period start date.** No Realtime subscription on `cycle_settings` table for Sun. `partnerCycleSettings` remains stale until app restart. Sun sees wrong phase and gives wrong support. | Critical | `app/hooks/`, `app/store/appStore.ts` | Add Supabase Realtime subscription on `cycle_settings` filtered to partner's `user_id`. Update `partnerCycleSettings` in store on change. | `app/hooks/useCoupleLinkedListener.ts` (only watches `couples` table, not `cycle_settings`) | BUG_FIX_PIPELINE |
| ISS-005 | P4 (Scenario H), P5 (#30), P6 (Minh Q5, Joint Q3) | Both | Trust Erosion | **Whispers have no delivery/read confirmation.** Moon sees "He will know what to do" after sending, but has no way to verify Sun received or read it. Auto-clear timer (5 min) deletes the whisper even if Sun never opened the app. Moon feels she is "whispering into the void." | Critical | `app/store/appStore.ts` (`_whisperTimer`), `app/components/moon/WhisperSheet.tsx` | Add delivery status (Sent/Delivered/Seen) to whisper records. Change success text from "He will know what to do" to "Whisper sent." Add "Seen" confirmation sent back to Moon when Sun dismisses. | `app/store/appStore.ts` | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-006 | P4 (Scenario A), P5 (#31), P6 (Minh Q1, Q5) | Minh | Notification Issue | **No proactive luteal/PMS push notifications for Sun.** App has phase-aware advice ("avoid arguments during luteal") but only delivers it if Sun actively opens the app. Minh read the advice after the fight, not before. Preventable argument occurred. | Critical | `app/supabase/functions/notify-cycle/`, `app/hooks/useNotifications.ts` | Add daily phase-aware push notification for Sun at ~6 PM: "Moon is in Luteal Day 25 -- be extra gentle tonight." Phase-specific actionable tip in the notification body. | `app/supabase/functions/notify-cycle/index.ts` | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-007 | P3 (Days 1-6), P5 (#20), P6 (Minh Q4, Q6) | Minh | Retention Risk | **Sun has zero proactive engagement mechanism.** 6-day zero-open streak at the start. App is entirely pull-based for Sun with no daily notifications. Minh's 30-day engagement: 14/30 days, with 57% of opens externally triggered. Minh states he would delete the app if daily notifications are not added. | Critical | Entire Sun experience | Daily push notification for Sun with phase-aware advice. Phase-change notifications (4 per cycle). Re-engagement nudge after 48h inactivity. | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-008 | P3 (Days 3-4), P5 (#18), P6 (Linh Q5) | Linh | Notification Issue | **No daily check-in reminder notification for Moon.** Linh missed Days 3-4 entirely with no re-engagement. Phase silently changed without her knowing. Habit loop broken during critical first week. | Critical | `app/hooks/useNotifications.ts` | Add optional daily check-in reminder push at ~9 PM: "How was your day? Tap to log." Respect existing notification preferences. | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-009 | P3 (Days 8-16), P5 (#19), P6 (Minh Q5, Q8) | Minh | Notification Issue | **No phase-change notifications for Sun.** Ovulatory-to-luteal transition (the most important for relationship dynamics) happened silently. Minh was blind for 3+ days during this critical shift. | Critical | `app/supabase/functions/notify-cycle/` | Send phase-change push notifications to Sun (4 per cycle): "Moon just entered her luteal phase. Energy drops, sensitivity rises. Here is how to show up this week." | `app/supabase/functions/notify-cycle/index.ts` | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-010 | P2, P5 (#14), P6 (Minh Q4) | Minh | Notification Issue | **No notification permission context screen for Sun during onboarding.** Sun's core features (Whisper, SOS) depend on push notifications, but no explanation is given before the iOS permission prompt. If Sun denies permissions, core app value is silently broken. | Critical | `app/app/onboarding.tsx`, `app/hooks/useNotifications.ts` | Add a notification primer screen after Sun role selection: "Moon can send you quiet signals when she needs you. Allow notifications so you never miss one." Show examples of Whisper and SOS notifications. THEN trigger iOS permission prompt. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-011 | P4 (Scenario C), P5 (#26) | Both | Trust Erosion | **No period confirmation flow -- app auto-advances via modulo.** Combined with ISS-001 and ISS-002, this is the single most dangerous UX gap. The app must ask "Has your period started?" near the expected date instead of auto-advancing. Without this, every late period creates a trust-breaking experience for both users. | Critical | `app/screens/MoonDashboard.tsx`, `app/utils/cycleCalculator.ts` | See ISS-003. The period confirmation prompt and late-period detection (ISS-002) together solve this systemic issue. | -- | FEATURE_DEVELOPMENT_PIPELINE |

---

## High Issues (15)

| ID | Source Phases | Who Found | Type | Description | Severity | Affected Area | Suggested Fix | Code Reference | Route To |
|---|---|---|---|---|---|---|---|---|---|
| ISS-012 | P1, P5 (#7), P6 | Linh | Bug | **Tab bar uses white background (#FFFFFF) on Moon dark theme.** `Colors.card` (#FFFFFF) is used for tab bar background while Moon dashboard uses `MoonColors.background` (#0D1B2A). Creates a harsh white strip at the bottom of an otherwise beautiful dark UI. | High | `app/app/(tabs)/_layout.tsx` | Use `MoonColors.card` (#162233) for Moon role tab bar background. Apply role-aware theming to the tab bar. | `app/app/(tabs)/_layout.tsx` | BUG_FIX_PIPELINE |
| ISS-013 | P1, P5 (#10, #11), P6 (Linh Q6, Q9) | Linh | Privacy Concern | **No explanation of what partner can see when linked.** Not in Settings, not before the share code, not as FAQ. Linh self-censored check-in data for several days because she did not know if Minh could see her mood scores and symptoms. | High | `app/app/(tabs)/settings.tsx`, `app/screens/MoonDashboard.tsx` | Add "What your partner sees" section: Sun sees phase, day, phase description. Sun does NOT see mood score, symptoms, conception chance. Display before partner code sharing and in Settings. Use the same 3-bullet pattern as the health sync education screen. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-014 | P2, P5 (#15), P6 (Minh Q4, Q5, Joint Q4) | Minh | Missing Feature | **Calendar tab is empty for Sun users.** Shows static placeholder card despite `partnerCycleSettings` being populated and used on the dashboard. Minh cannot see predicted periods, phase transitions, or "best days for plans." Top Sun feature request. | High | `app/app/(tabs)/calendar.tsx` lines 36-56 | Build a real calendar view for Sun using `partnerCycleSettings` data. Show predicted period days, fertile windows, phase transitions. Add "best days for plans" markers. | `app/app/(tabs)/calendar.tsx` | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-015 | P3, P5 (#21), P6 (Linh Q5, Minh Q5, Q8) | Both | Bug | **Push notification text hardcoded in English.** `notify-cycle` and `notify-sos` Edge Functions send English text ("Your period is coming," "Moon needs kind words") regardless of user language preference. Vietnamese users receive jarring English notifications. | High | `app/supabase/functions/notify-cycle/index.ts`, `app/supabase/functions/notify-sos/index.ts` | Read user's `language` preference from `user_preferences` table. Include Vietnamese translations in Edge Function payloads. | `app/supabase/functions/notify-cycle/index.ts`, `app/supabase/functions/notify-sos/index.ts` | BUG_FIX_PIPELINE |
| ISS-016 | P3, P5 (#22) | Minh | Bug | **SOS alert title uses English constants on Sun dashboard.** "She needs: Cramps Alert" displayed instead of Vietnamese translations. Inconsistent with the otherwise localized UI. | High | `app/screens/SunDashboard.tsx` or `app/components/sun/SOSAlert.tsx` | Pass SOS type through `t()` translation function. Use i18n keys for SOS signal types. | -- | BUG_FIX_PIPELINE |
| ISS-017 | P1, P5 (#5) | Linh | Copy Issue | **"How does this work?" and "Hide" hardcoded in English in CycleDataReview.** Vietnamese user sees English mid-flow during onboarding. Strings not passed through `t()`. | High | `app/components/` (CycleDataReview.tsx lines 131-133) | Replace hardcoded strings with `t('healthSync.howDoesThisWork')` and `t('healthSync.hide')`. Add Vietnamese translations. | CycleDataReview.tsx lines 131-133 | BUG_FIX_PIPELINE |
| ISS-018 | P4 (Scenario H), P5 (#32) | Minh | UX Friction | **Whisper auto-clear at 5 minutes is too aggressive.** If Sun opens the app 2 hours after a whisper, it is already gone. Missed whispers disappear before Sun sees them. | High | `app/store/appStore.ts` (`_whisperTimer`) | Extend whisper persistence from 5 minutes to 24 hours. Only auto-clear after Sun explicitly dismisses OR after 24h timeout. | `app/store/appStore.ts` | CHANGE_REQUEST_PIPELINE |
| ISS-019 | P4 (Scenario B), P5 (#33), P6 (Minh Q5) | Minh | Missing Feature | **No phase forecast on Sun dashboard.** No "Coming up" section showing when follicular/ovulatory/luteal starts. Minh has to do mental math (countdown + period length) to plan dates. Defeats the app's promise of easy understanding. | High | `app/screens/SunDashboard.tsx` | Add "Coming up" section below the Moon Status Card: "Follicular starts ~March 24. Plan something fun!" with phase-specific forward guidance. | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-020 | P4 (Scenario A), P5 (#34) | Linh | Emotional Miss | **No post-conflict or emotional repair Whisper options.** Luteal whisper options ("snacks," "space," "cuddle," "kind words") are for soft moments, not relationship repair after arguments. Missing signals like "I'm sorry I snapped" or "I need you to understand." | High | `app/constants/whisperOptions.ts` or phase config | Add emotional repair whisper category with options like "I'm sorry," "I need you to understand," "Can we start over?" Available across all phases, not just luteal. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-021 | P4 (Scenario I), P5 (#35) | Minh | Notification Issue | **No "period started" push notification to Sun.** When Moon's new cycle begins (via date change in Settings), Sun has no proactive signal. Must open app to discover it. | High | `app/supabase/functions/notify-cycle/` | Trigger push notification to Sun when Moon updates `lastPeriodStartDate`: "Moon's new cycle has started -- be there for her." | -- | CHANGE_REQUEST_PIPELINE |
| ISS-022 | P4 (Scenario I), P5 (#36) | Linh | Emotional Miss | **No cycle transition acknowledgment.** Phase changes silently. No "New Cycle - Day 1" banner/modal. No tracking streak recognition ("You've been tracking for 2 cycles!"). Period start feels like a database update, not a meaningful body event. | High | `app/screens/MoonDashboard.tsx` | Show brief celebratory/supportive banner on cycle transition: "New Cycle, Day 1. Your body is doing important work. We're here with you." Track and display streak. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-023 | P4 (Scenario H), P5 (#37), P6 (Minh Q3, Q6) | Minh | Notification Issue | **No Sun re-engagement nudges.** If Sun hasn't opened the app in 48+ hours, there is no reminder push. Zero re-engagement mechanism. 6-day zero-open streaks are possible. | High | Notification system | After 48h inactivity, send gentle push: "Moon is in [phase] -- open the app to learn how to support her." Ensure Moon cannot see this nudge was sent (anti-surveillance). | -- | CHANGE_REQUEST_PIPELINE |
| ISS-024 | P4 (Scenario G), P5 (#38) | Linh | UX Friction | **SOS lacks "add a note" field for specific requests.** "Cramps Alert" tells Minh she is in pain but not what to bring. She has to follow up via text for specifics ("bring ibuprofen"). | High | `app/components/moon/SOSSheet.tsx` | Add an optional "Add a note" text input (similar to WhisperSheet's custom input) for specific requests alongside the categorical SOS signal. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-025 | P4 (Scenario E), P5 (#39) | Linh | Missing Feature | **No "share my status" shareable card.** Dashboard content uses second-person ("Ban" = you) which is awkward when showing screen to partner. No digital sharing option (text, image card, link). | High | `app/screens/MoonDashboard.tsx` | Add a "Share my status" button that generates a shareable card: "Linh is in Follicular phase, Day 8 -- feeling optimistic, energy rising." Suitable for texting or screen-sharing. | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-026 | P4 (Scenario C), P5 (#40) | Minh | Emotional Miss | **No late-period signal to Sun.** When Moon's period is significantly late, Sun remains oblivious. App actively misleads him with phantom phase data from modulo wrapping. | High | `app/screens/SunDashboard.tsx` | If Moon's cycle exceeds expected length by 3+ days, send Sun a gentle notification: "Moon's cycle is a bit different this month -- be extra supportive." Do not reveal medical details. | -- | CHANGE_REQUEST_PIPELINE |

---

## Medium Issues (14)

| ID | Source Phases | Who Found | Type | Description | Severity | Affected Area | Suggested Fix | Code Reference | Route To |
|---|---|---|---|---|---|---|---|---|---|
| ISS-027 | P1, P2, P5 (#1, #2) | Both | UX Friction | **Splash screen has no branding, no dark mode, and uses pink accent before role is known.** White background (#FBFBFD) flashes in dark rooms. Pink spinner (#FF5F7E) codes feminine before Sun users see their amber theme. | Medium | `app/app/index.tsx` | Use system color scheme detection (dark/light). Use neutral spinner color (e.g., `Colors.textHint` gray) instead of pink. Add app logo/branding to splash. | `app/app/index.tsx` | CHANGE_REQUEST_PIPELINE |
| ISS-028 | P2, P5 (#8) | Minh | Bug | **Tab bar active tint uses pink for Sun users.** `tabBarActiveTintColor` uses `Colors.menstrual` (#FF5F7E) even for Sun role. Should use amber (#F59E0B) for Sun. | Medium | `app/app/(tabs)/_layout.tsx` | Conditionally set `tabBarActiveTintColor` based on user role: Moon = `Colors.menstrual`, Sun = `SunColors.accentPrimary`. | `app/app/(tabs)/_layout.tsx` | BUG_FIX_PIPELINE |
| ISS-029 | P1, P2, P3, P5 (#9), P6 (Linh Q5) | Both | Copy Issue | **"AI" label shown in user-facing UI, violating product design rule.** Dashboard greeting shows "AI" sparkle label. Sun guide card title shows "Cach the hien AI". Product rule: "No AI terminology in UI." | Medium | `app/screens/MoonDashboard.tsx`, `app/screens/SunDashboard.tsx` | Remove or replace "AI" label. Use "Personalized" or remove the badge entirely. Replace "Cach the hien AI" with "Cach the hien" (no qualifier). | Multiple dashboard files | CHANGE_REQUEST_PIPELINE |
| ISS-030 | P2, P5 (#16) | Minh | UX Friction | **No display name prompt during onboarding.** Dashboard greeting defaults to "Chao, Sun" instead of "Chao, Minh." Impersonal from minute one. Display name is discoverable only in Settings. | Medium | `app/app/onboarding.tsx` | Add a single screen after role selection: "What should Moon call you?" One text input, one button. Makes the dashboard personal immediately. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-031 | P1, P5 (#12) | Linh | UX Friction | **Calendar card and Settings screen use light theme for Moon users.** Calendar card background uses `Colors.card` (#FFFFFF) on dark Moon page. Settings screen uses entirely light theme. Inconsistent with Moon dark aesthetic. | Medium | `app/app/(tabs)/calendar.tsx`, `app/app/(tabs)/settings.tsx` | Apply Moon theme to Calendar and Settings screens: use `MoonColors.card` (#162233) and `MoonColors.background` (#0D1B2A) for Moon role. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-032 | P3, P5 (#23, #48), P6 (Linh Q5) | Both | UX Friction | **AI insights become repetitive during long phases.** 12-day luteal phase produced 8 variations of "be gentle with yourself." Static fallback content has only 3 rotations per phase. Both personas experienced engagement fatigue. | Medium | `proxy/lib/minimax.ts`, static fallback content | Expand phase-specific prompt variety in minimax.ts. Add day-within-phase awareness. Increase static fallback rotations from 3 to 8+ per phase. Vary by symptom input. | `proxy/lib/minimax.ts` | CHANGE_REQUEST_PIPELINE |
| ISS-033 | P4 (Scenario H), P5 (#47) | Both | Trust Erosion | **No engagement indicator for Moon.** Moon invests daily (check-ins, whispers) with zero feedback that Sun is participating. "Am I doing this alone?" feeling. Retention risk if Moon feels unheard. | Medium | `app/screens/MoonDashboard.tsx` | Add subtle, opt-in (by Sun) indicator: "Sun is thinking of you" (positive framing, not absence). Never show "last opened" metrics. Show only engagement, never absence. MUST be carefully designed to avoid surveillance dynamics. | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-034 | P4 (Scenario F), P5 (#45) | Linh | Trust Erosion | **No whisper acknowledgment from Sun back to Moon.** Minh taps "Got it" to dismiss but Linh never sees confirmation. Emotional loop stays open. | Medium | `app/components/sun/WhisperAlert.tsx`, `app/store/appStore.ts` | When Sun dismisses whisper with "Got it," send a Realtime/push signal back to Moon: "Sun saw your whisper" or "Sun is on it." | -- | CHANGE_REQUEST_PIPELINE |
| ISS-035 | P4 (Scenario D), P5 (#42), P6 (Linh Q6) | Linh | Privacy Concern | **Conception chance card too prominent on Moon dashboard.** "Kha nang thu thai: Rat cao" is the second-most-prominent card. Linh tilted her phone away when Minh glanced at her screen. Awkward during casual screen-sharing. | Medium | `app/screens/MoonDashboard.tsx` | Make conception chance expandable/collapsible, or move to a "Health Details" section. Default to collapsed. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-036 | P3, P5 (#25) | Minh | Value Gap | **Sun dashboard is entirely read-only.** No interactive features beyond reading cards. Zero engagement hooks beyond receiving signals. Minh: "I can only read -- feels passive, not participatory." | Medium | `app/screens/SunDashboard.tsx` | Add minimal Sun interactions: "Did you check in on Moon today?" quick toggle. "Mark as done" for advice actions. Low-effort participation signals. | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-037 | P4 (Scenario F), P5 (#44) | Linh | Missing Feature | **No whisper history.** Moon cannot see past whispers sent. No pattern reflection over time. Cannot see "I send 'kind words' a lot during luteal." | Medium | `app/screens/MoonDashboard.tsx` or Settings | Add "Recent whispers" list showing past whisper types with dates. Use existing `whisper_history` table data. | `app/lib/db/` (whisper_history table exists) | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-038 | P5 (#41) | Linh | UX Friction | **Unclear distinction between SOS and Whisper.** Linh hesitated to use SOS during PMS (non-period cramps) because "SOS" implies emergency. "Cramps Alert" applies to PMS too but framing feels wrong. | Medium | `app/components/moon/SOSSheet.tsx` | Add brief contextual copy: "SOS signals are for when you need comfort -- they're not just for emergencies." Or rename SOS to "Signal" to better match actual severity. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-039 | P4 (Scenario E), P5 (#43) | Both | Missing Feature | **No couple conversation prompts.** App is a reference tool, not a conversation starter. No "Talk about this" section with phase-relevant questions. | Medium | `app/screens/MoonDashboard.tsx`, `app/screens/SunDashboard.tsx` | Add optional "Talk about" section with phase-relevant conversation starters: "What are you excited about this week?" (follicular), "What's weighing on you?" (luteal). | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-040 | P3, P5 (#49) | Linh | Missing Feature | **Calendar has no daily log visualization.** Moon cannot see mood/symptom patterns over time on the calendar. Missed opportunity for self-reflection and trend recognition. | Medium | `app/app/(tabs)/calendar.tsx` | Overlay logged mood indicators (color-coded dots or emoji) on calendar days where check-ins exist. Show mood trend summary per week/cycle. | -- | FEATURE_DEVELOPMENT_PIPELINE |

---

## Low Issues (8)

| ID | Source Phases | Who Found | Type | Description | Severity | Affected Area | Suggested Fix | Code Reference | Route To |
|---|---|---|---|---|---|---|---|---|---|
| ISS-041 | P1, P5 (#6) | Linh | Copy Issue | **"Done" button on iOS date picker hardcoded in English.** Should be "Xong" in Vietnamese. | Low | ManualCycleInput.tsx line 152 | Replace hardcoded "Done" with `t('common.done')`. Add Vietnamese translation "Xong". | ManualCycleInput.tsx line 152 | BUG_FIX_PIPELINE |
| ISS-042 | P1, P5 (#4) | Linh | UX Friction | **No minimum password length indication.** Password requires 6+ characters but this is never communicated. Disabled button at opacity 0.4 is nearly invisible at low brightness. | Low | `app/app/auth.tsx` | Add helper text "At least 6 characters" / "It nhat 6 ky tu" below password field during sign-up. Increase disabled opacity to 0.5 for better visibility. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-043 | P1, P5 (#50) | Linh | Copy Issue | **"Open Settings" link text hardcoded in English on PermissionDeniedScreen.** Should use `t()` for Vietnamese translation. | Low | PermissionDeniedScreen line 58 | Replace with `t('healthSync.openSettings')`. Add Vietnamese translation "Mo Cai dat". | PermissionDeniedScreen line 58 | BUG_FIX_PIPELINE |
| ISS-044 | P1, P5 (#3) | Both | UX Friction | **No Apple/Google sign-in option.** Email-only auth with mandatory email verification adds friction. Requires context-switch to email app and back. | Low | `app/app/auth.tsx` | Consider adding Apple Sign-In and Google Sign-In for reduced friction. Apple Sign-In is especially important for iOS-first app. | -- | FEATURE_DEVELOPMENT_PIPELINE |
| ISS-045 | P1, P5 (#13) | Linh | Terminology | **Vietnamese phase names use medical terms.** "Hoang the" (Luteal) and "Nang truong" (Follicular) are textbook terms most young Vietnamese women do not use casually. Taglines compensate but terms feel clinical. | Low | `app/i18n/vi/phases.json` | Consider adding simpler label alternatives or tooltips: "Hoang the" -> hover/long-press explains "Giai doan sau rung trung, truoc ky kinh." | -- | CHANGE_REQUEST_PIPELINE |
| ISS-046 | P4 (Scenario G), P5 (#46) | Both | Terminology | **SOS naming may overpromise urgency.** "SOS" implies emergency-level urgency. Actual options (sweet tooth, hug, cramps, quiet time) are comfort needs, not medical emergencies. | Low | `app/components/moon/SOSSheet.tsx`, i18n | Consider renaming to "Signal" or adding disclaimer: "For medical emergencies, call 115." | -- | CHANGE_REQUEST_PIPELINE |
| ISS-047 | P2, P5 (#17) | Minh | UX Friction | **Share invite message contains website URL, not App Store deep link.** App name "Easel" gives no indication of purpose in organic search. | Low | `app/i18n/*/partner.json` (inviteMessage) | Include direct App Store link in share message. Consider adding brief app description in the shared text. | -- | CHANGE_REQUEST_PIPELINE |
| ISS-048 | P6 (Linh Q1, Q8) | Linh | Missing Feature | **Only 8 symptom options in daily check-in.** Flo offers 50+. Missing common symptoms: acne, insomnia, back pain, breast tenderness, nausea, libido changes. | Low | `app/components/moon/DailyCheckIn.tsx`, `app/constants/` | Expand symptom options to 15-20. Add most-requested: acne, insomnia, back pain, nausea, libido changes. Keep the chip format but allow scrolling. | -- | CHANGE_REQUEST_PIPELINE |

---

## Delight Opportunities (Log for Future Sprint)

These are not issues but positive findings worth preserving and amplifying in future development.

| ID | Source Phases | Description | Why It Works | Amplification Opportunity |
|---|---|---|---|---|
| DLT-001 | P1, P6 | **Role selection screen** with Moon/Sun metaphor, Vietnamese intimate pronouns ("Em"/"Anh"), "thi tham" (whisper) language. | First moment of "this app understands me." Emotional hook of the entire app. | Preserve exactly. Extend this warmth to other touchpoints (cycle transition, period confirmation). |
| DLT-002 | P1, P6 | **Health sync education screen** with 3 bullet points (read-only, on-device, disconnect anytime) + shield icon. | Perfect privacy communication. Three fears, three answers. | Reuse this pattern for the missing "What your partner sees" explainer (ISS-013). |
| DLT-003 | P1 | **"Khong sao!" (No worries!) toggle** on manual cycle input for users unsure about their cycle data. | Empathy in a checkbox. Made Linh relax about imperfect data. | Add more "Khong sao!" moments: missed check-in days, late period detection, irregular cycles. |
| DLT-004 | P3, P6 | **Whisper feature end-to-end** (Day 19: "Kind words" -> push notification -> heartfelt message -> emotional reconnection). | THE moment the app proves its value. Both personas described it as the emotional highlight. | Build whisper history, delivery confirmation, richer vocabulary, and post-conflict options around it. |
| DLT-005 | P3, P6 | **Period-approaching notification -> proactive action** (Day 17: Minh bought snacks without Linh asking). | First notification-driven action. Converted Minh from skeptic to believer. | More proactive notifications (phase changes, daily advice) would multiply this effect. |
| DLT-006 | P1, P2, P6 | **Vietnamese translation quality (9/10).** Native-sounding phrasing, intimate couple pronouns, empathetic body language. | "Reads like a native speaker wrote it" -- differentiator vs. Flo/Clue's Vietnamese. | Fix remaining English hardcoded strings to reach 10/10. |

---

## Emotional Safety Flags

Issues where the app could cause emotional harm, create surveillance dynamics, or erode trust.

| ID | Related Issues | Risk Type | Status | Mitigation |
|---|---|---|---|---|
| ESF-001 | ISS-001, ISS-002, ISS-011 | **Trivializes health concern** -- Late period wraps to phantom phase with cheerful content while user is scared about being pregnant. | ACTIVE | Fix modulo wrapping (ISS-001). Add late-period detection (ISS-002). Add period confirmation flow (ISS-003). |
| ESF-002 | ISS-005, ISS-018, ISS-034 | **Broken emotional promise** -- "He will know what to do" is a lie if Sun never opens the app. Whispers auto-delete in 5 min. | ACTIVE | Add delivery confirmation (ISS-005). Extend persistence (ISS-018). Add Sun acknowledgment (ISS-034). |
| ESF-003 | ISS-013 | **Privacy uncertainty** -- Moon does not know what data Sun can see. Led to self-censoring check-in data. | ACTIVE | Add "What your partner sees" explainer (ISS-013). |
| ESF-004 | ISS-033 | **Potential surveillance risk** -- If engagement indicators are built without careful design, "Sun last opened: 3 days ago" could become a relationship weapon. | NOT YET BUILT | If implemented, MUST be opt-in by Sun, show only positive engagement signals, never show absence data. |
| ESF-005 | ISS-035 | **Privacy exposure** -- Conception chance prominently displayed on Moon dashboard. Awkward during casual screen-sharing with partner. | ACTIVE | Make collapsible or move to details section (ISS-035). |

---

## Cross-Reference: Issues to Codebase Files

| File | Issue IDs |
|------|-----------|
| `app/utils/cycleCalculator.ts` | ISS-001, ISS-002, ISS-011 |
| `app/app/(tabs)/_layout.tsx` | ISS-012, ISS-028 |
| `app/app/(tabs)/calendar.tsx` | ISS-014, ISS-031, ISS-040 |
| `app/app/(tabs)/settings.tsx` | ISS-003, ISS-013, ISS-031 |
| `app/screens/MoonDashboard.tsx` | ISS-002, ISS-003, ISS-022, ISS-025, ISS-029, ISS-033, ISS-035 |
| `app/screens/SunDashboard.tsx` | ISS-016, ISS-019, ISS-029, ISS-036 |
| `app/store/appStore.ts` | ISS-004, ISS-005, ISS-018 |
| `app/app/index.tsx` | ISS-027 |
| `app/app/auth.tsx` | ISS-042, ISS-044 |
| `app/app/onboarding.tsx` | ISS-010, ISS-030 |
| `app/components/moon/SOSSheet.tsx` | ISS-024, ISS-038, ISS-046 |
| `app/components/moon/WhisperSheet.tsx` | ISS-005, ISS-020 |
| `app/components/sun/WhisperAlert.tsx` | ISS-034 |
| `app/hooks/useNotifications.ts` | ISS-008, ISS-010 |
| `app/supabase/functions/notify-cycle/index.ts` | ISS-006, ISS-009, ISS-015, ISS-021 |
| `app/supabase/functions/notify-sos/index.ts` | ISS-015 |
| `proxy/lib/minimax.ts` | ISS-032 |
| CycleDataReview.tsx | ISS-017 |
| ManualCycleInput.tsx | ISS-041 |
| PermissionDeniedScreen | ISS-043 |
| `app/i18n/vi/phases.json` | ISS-045 |
| `app/constants/whisperOptions.ts` | ISS-020 |

---

## Recommended Fix Order (Sprint Planning)

### Sprint 1 -- Trust & Retention (Critical)

1. **ISS-001** -- Fix cycle calculator modulo wrapping (BUG_FIX)
2. **ISS-003 + ISS-011** -- Period confirmation flow on dashboard (FEATURE_DEV)
3. **ISS-002** -- Late-period detection with supportive content (FEATURE_DEV)
4. **ISS-004** -- Realtime subscription for Sun cycle updates (BUG_FIX)
5. **ISS-006 + ISS-007 + ISS-009** -- Sun daily + phase-change notifications (FEATURE_DEV)
6. **ISS-008** -- Moon daily check-in reminder (FEATURE_DEV)

### Sprint 2 -- Signal Integrity & Localization

7. **ISS-005 + ISS-018** -- Whisper delivery confirmation + persistence extension (FEATURE_DEV + CR)
8. **ISS-015 + ISS-016** -- Push notification i18n + SOS title i18n (BUG_FIX)
9. **ISS-017 + ISS-041 + ISS-043** -- Hardcoded English strings (BUG_FIX)
10. **ISS-012 + ISS-028** -- Tab bar theming per role (BUG_FIX)
11. **ISS-013** -- "What your partner sees" explainer (CR)
12. **ISS-010** -- Notification permission primer for Sun (CR)

### Sprint 3 -- Sun Experience & Polish

13. **ISS-014** -- Sun calendar view (FEATURE_DEV)
14. **ISS-019** -- Phase forecast on Sun dashboard (FEATURE_DEV)
15. **ISS-029** -- Remove AI terminology from UI (CR)
16. **ISS-030** -- Display name prompt in onboarding (CR)
17. **ISS-032** -- AI insight variety expansion (CR)
18. **ISS-031** -- Moon theme consistency (calendar, settings) (CR)

### Backlog

19-48. Remaining Medium and Low issues, ordered by impact within their pipelines.
