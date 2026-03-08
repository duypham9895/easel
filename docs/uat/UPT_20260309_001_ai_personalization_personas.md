# User Persona Testing: Personalized AI Content

**UPT ID:** UPT_20260309_001
**Date:** 2026-03-09
**Tester:** QA Lead (Agent)
**Feature:** CR: Personalize About this Phase & Self-Care with AI (EAS-5)
**Method:** Code-level persona tracing — each scenario traced through hook → proxy → AI prompt → response → UI

---

## Test Summary

| # | Persona | Result | Notes |
|---|---------|--------|-------|
| M1 | Moon menstrual, mood=1, symptoms=[Cramps, Fatigue] | PASS (with issue) | AI prompt says "terrible" but user selected "Low" |
| M2 | Moon ovulatory, mood=5, symptoms=[] | PASS | AI correctly handles high energy with no symptoms |
| M3 | Moon luteal, mood=2, symptoms=[Mood swings, Bloating] | PASS (with issue) | AI prompt says "low" but user selected "Meh" |
| M4 | Moon first-time user, no check-in | PASS | Static i18n fallback shown correctly |
| M5 | Vietnamese-speaking Moon | PASS | Language instruction appended to all prompts |
| S1 | Sun sees Moon mood=1 with cramps | PASS (with issue) | Mood label mismatch propagates to partner advice |
| S2 | Sun sees Moon mood=4 (Good) | PASS | Labels align at mood=4 |
| S3 | Sun sees no check-in from Moon | PASS | Fallback text + generic phase advice shown |
| S4 | Vietnamese-speaking Sun | PASS | Language instruction works |

**Overall: 9/9 PASS (3 with mood label mismatch issue)**

---

## Moon Persona Results

### M1: Moon during menstrual phase, mood=1 (Low), symptoms=[Cramps, Fatigue]

**Data flow:**
1. `DailyCheckIn` → user selects mood=1 (UI label: "Low"), symptoms: Cramps + Fatigue
2. Submit → upserts to `daily_logs` → calls `onCheckInSubmit(1, ["Cramps", "Fatigue"])`
3. `MoonDashboard.handleCheckInSubmit` triggers:
   - `fetchPhaseInsight(1, ["Cramps", "Fatigue"])` → POST `/api/phase-insight`
   - `fetchSelfCare(1, ["Cramps", "Fatigue"])` → POST `/api/self-care`
4. Proxy validates inputs → calls MiniMax with personalized prompt

**AI Prompt analysis (`generatePersonalizedPhaseInsight`):**
- System prompt: "Validate how she is feeling... Connect symptoms/mood to cycle phase... Sound like a caring friend"
- User message: `Phase: menstrual | Day: X | Mood today: terrible | Symptoms: Cramps, Fatigue`

**AI Prompt analysis (`generatePersonalizedSelfCare`):**
- System prompt: "gentle for low energy, active for high energy... Personalize based on reported symptoms"
- User message: Same as above

**Result:** PASS — AI will generate empathetic, low-energy advice for menstrual + cramps + fatigue.

**Issue:** Mood label mismatch (see BUG-001 below). User selected "Low" (mood=1) but AI prompt says "terrible". This may cause AI to overreact — e.g., generating overly sympathetic responses when user simply feels "low", not "terrible".

---

### M2: Moon during ovulatory phase, mood=5 (Great), symptoms=[]

**Data flow:**
1. `DailyCheckIn` → mood=5 (UI: "Great"), no symptoms selected
2. Submit → `handleCheckInSubmit(5, [])`
3. Hooks fetch AI with mood=5, symptoms=[]

**AI Prompt:**
- `Mood today: great | Symptoms: none logged`
- Self-care prompt: "active for high energy" matches mood=5

**Result:** PASS — Labels align at mood=5 ("Great"/"great"). AI should celebrate energy and suggest active self-care.

---

### M3: Moon during luteal phase, mood=2 (Meh), symptoms=[Mood swings, Bloating]

**Data flow:**
1. `DailyCheckIn` → mood=2 (UI: "Meh"), symptoms: Mood swings + Bloating
2. Hooks fetch AI with mood=2, symptoms=["Mood swings", "Bloating"]

**AI Prompt:**
- `Mood today: low | Symptoms: Mood swings, Bloating`
- System prompt: "Validate how she is feeling without being dismissive... normalizing way"

**Result:** PASS — AI should acknowledge PMS without being patronizing. The prompt explicitly says "normalizing" and "caring friend, not a textbook".

**Issue:** User selected "Meh" (mood=2) but AI prompt says "low". Mismatch is less severe here but still creates a tone gap — "Meh" implies mild indifference, "low" implies sadness.

---

### M4: Moon first-time user, no check-in yet

**Data flow:**
1. `DailyCheckIn` mounts → queries `daily_logs` for today → no data
2. Check-in form shown (not submitted state)
3. `useAIPhaseInsight` returns `phaseInsight: null`
4. `useAISelfCare` returns `selfCare: null`
5. MoonDashboard renders:
   - "About this Phase" card: `tPhases(\`${phase}_moonMood\`)` (static i18n)
   - "Self-Care" card: `tPhases(\`${phase}_selfCare\`)` (static i18n)

**Result:** PASS — Static fallback renders correctly. No AI calls made until check-in is submitted.

---

### M5: Vietnamese-speaking Moon

**Data flow:**
1. `i18n.language` returns `"vi"`
2. All hooks pass `language: "vi"` to proxy
3. Proxy passes to minimax functions with `lang="vi"`
4. `langInstruction("vi")` appends: `"\nIMPORTANT: You MUST respond entirely in Vietnamese."`

**Result:** PASS — Language instruction is appended to all system prompts. MiniMax M2.5 supports Vietnamese.

**Note:** Vietnamese checkin labels differ from dashboard labels (checkin: "Tệ" for mood=1, dashboard: "mệt mỏi" for mood=1). This is a minor consistency issue within Vietnamese i18n.

---

## Sun Persona Results

### S1: Sun sees Moon mood=1 with cramps

**Data flow:**
1. `SunDashboard` mounts → fetches `fetchPartnerDailyLog(girlfriend_id)` → returns `{ mood: 1, symptoms: ["Cramps"], log_date: "2026-03-09" }`
2. `formatPartnerMood(log, t, tPhases, phase)`:
   - `log.mood = 1` → `t('moodLevel1')` → "low" (from dashboard.json)
   - `t('moonFeeling', { mood: "low" })` → "She's feeling low"
   - `log.symptoms = ["Cramps"]` → "with cramps"
   - Result: "She's feeling low with cramps"
3. `useAIPartnerAdvice(phase, dayInCycle, 1, ["Cramps"])`:
   - Body includes `mood: 1, symptoms: ["Cramps"]`
   - `generatePartnerAdvice` with mood=1: `moodLabel = "terrible"`
   - Prompt: `"She checked in today: mood is \"terrible\", experiencing: Cramps"`

**Result:** PASS — Sun sees accurate mood summary. AI gives specific caring advice.

**Issue:** Sun's GuideCard shows "She's feeling low" but AI advice prompt says mood is "terrible". The Sun-facing display (dashboard.json: "low") and Moon-facing check-in (checkin.json: "Low") are both reasonable. But the AI prompt uses a different mapping ("terrible") creating inconsistency between what Sun reads and what the AI bases advice on.

---

### S2: Sun sees Moon mood=4 (Good)

**Data flow:**
1. `fetchPartnerDailyLog` → `{ mood: 4, symptoms: [] }`
2. `formatPartnerMood`: `t('moodLevel4')` → "good" → "She's feeling good"
3. `useAIPartnerAdvice`: mood=4 → `moodLabel = "good"` in AI prompt

**Result:** PASS — Labels align at mood=4. AI should encourage shared enjoyment.

---

### S3: Sun sees no check-in from Moon today

**Data flow:**
1. `fetchPartnerDailyLog(girlfriend_id)` → returns `null` (no log for today)
2. `formatPartnerMood(null, t, tPhases, phase)`:
   - `!log?.mood` → true
   - Returns `"${tPhases(\`${phase}_mood\`)}\n\n${t('moonNoCheckIn')}"` → phase-specific mood text + "She hasn't checked in today yet"
3. `useAIPartnerAdvice(phase, dayInCycle, undefined, undefined)`:
   - `partnerMood = undefined` → hook skips mood/symptoms in body
   - Partner advice request only has phase/dayInCycle/phaseTagline → generic phase guidance
   - Falls back to static `PHASE_INFO[phase].partnerAdvice` initially

**Result:** PASS — Sun sees clear fallback: phase mood text + "She hasn't checked in today yet". AI gives generic phase advice (not personalized).

---

### S4: Vietnamese-speaking Sun

**Data flow:**
1. `i18n.language = "vi"` → hook passes `language: "vi"`
2. Proxy appends Vietnamese language instruction to prompt
3. Sun's GuideCard text uses Vietnamese translations from `dashboard.json`

**Result:** PASS — Works the same as English path with Vietnamese translations.

---

## Bugs Found

### BUG-001: Mood label mismatch between app UI and AI prompts (MEDIUM)

**Location:** `proxy/lib/minimax.ts` lines 98-100, 165-167, 193-195, 222-224

**Problem:** The mood-to-label mapping in AI prompts uses `['terrible', 'low', 'okay', 'good', 'great']`, but the app UI uses `['Low', 'Meh', 'Okay', 'Good', 'Great']` (checkin.json) and Sun dashboard uses `['low', 'meh', 'okay', 'good', 'great']` (dashboard.json).

| Mood Value | App UI (checkin.json) | Sun Display (dashboard.json) | AI Prompt (minimax.ts) |
|---|---|---|---|
| 1 | Low | low | terrible |
| 2 | Meh | meh | low |
| 3 | Okay | okay | okay |
| 4 | Good | good | good |
| 5 | Great | great | great |

**Impact:** For mood=1 and mood=2, AI responses may have mismatched intensity. User selects "Low" but AI thinks "terrible" — AI may overreact. User selects "Meh" but AI thinks "low" — AI may be more sympathetic than needed.

**Fix:** Change minimax.ts mood labels to match the app's scale: `['low', 'meh', 'okay', 'good', 'great']`

**Severity:** MEDIUM — doesn't break functionality but creates UX tone inconsistency.

---

### BUG-002: Missing AbortController in useAIPhaseInsight and useAISelfCare (LOW)

**Location:** `app/hooks/useAIPhaseInsight.ts`, `app/hooks/useAISelfCare.ts`

**Problem:** The established AI hook pattern (seen in `useAIPartnerAdvice`, `useAIGreeting`) uses `AbortController` to cancel in-flight requests on unmount. The two new hooks don't implement this pattern.

**Impact:** If Moon navigates away while AI is loading, the fetch continues and calls `setState` on an unmounted component. Modern React ignores this, but it's wasted network/compute and a pattern violation.

**Fix:** Add `AbortController` + `signal` to both hooks' fetch calls, with cleanup in the callback.

**Severity:** LOW — no user-visible impact, but inconsistent with codebase patterns.

---

### BUG-003: DailyCheckIn requires mood to submit — symptoms-only check-in impossible (INFO)

**Location:** `app/components/gf/DailyCheckIn.tsx` line 174

**Problem:** Submit button is disabled when `!mood` — user cannot log symptoms without selecting a mood. The edge case "Moon logs symptoms only, no mood" from the acceptance criteria cannot be tested because the UI prevents it.

**Impact:** None if mood is intentionally required. But the proxy endpoints (`daily-insight`, `phase-insight`, `self-care`) all accept `mood: null`, suggesting the backend supports symptom-only check-ins.

**Fix (if needed):** Change disable condition to `disabled={(!mood && symptoms.length === 0) || saving}` to require at least one input.

**Severity:** INFO — design decision, not a bug. Worth confirming with Product Lead.

---

### BUG-004: Sun dashboard doesn't refresh when Moon checks in (INFO)

**Location:** `app/screens/SunDashboard.tsx` lines 75-91

**Problem:** `fetchPartnerDailyLog` runs only when `isPartnerLinked` changes. If Moon submits a check-in while Sun's dashboard is open, Sun won't see the updated mood/symptoms until app refresh.

**Impact:** Sun may see "She hasn't checked in today yet" even though Moon just checked in moments ago.

**Potential fix:** Add a Realtime subscription on `daily_logs` (same pattern as SOS listener), or add a pull-to-refresh trigger.

**Severity:** INFO — known limitation. The app uses Realtime for SOS/Whisper but not daily logs.

---

### BUG-005: Vietnamese i18n label inconsistency between checkin and dashboard (LOW)

**Location:** `app/i18n/vi/checkin.json` vs `app/i18n/vi/dashboard.json`

**Problem:**
| Mood | checkin.json (Moon sees) | dashboard.json (Sun sees) |
|---|---|---|
| 1 | "Tệ" (bad/terrible) | "mệt mỏi" (tired/exhausted) |
| 2 | "Bình thường" (normal) | "bình thường" (normal) |

"Tệ" and "mệt mỏi" convey different meanings — Moon selects "Tệ" (bad) but Sun's dashboard shows "mệt mỏi" (tired/exhausted). These should be the same word.

**Fix:** Align Vietnamese mood labels between checkin and dashboard — use the same word for each level.

**Severity:** LOW — minor translation inconsistency visible only to Vietnamese couples comparing screens.

---

## Edge Cases Verified

| Edge Case | Result | Details |
|---|---|---|
| Moon logs mood only, no symptoms | PASS | mood=3, symptoms=[] → AI prompt: "Symptoms: none logged" — works correctly |
| Moon logs symptoms only, no mood | BLOCKED | Submit button disabled when mood=null (see BUG-003) |
| Moon re-opens app after check-in | PASS | `DailyCheckIn` useEffect restores saved data + re-fetches AI content (line 51-74) |
| Partner unlinked — Sun sees no mood | PASS | `SunDashboard` returns `<UnlinkedScreen>` when `!isPartnerLinked` (line 119-126) |

---

## Conclusion

The personalized AI content feature is **functionally complete and working** across all persona scenarios. The data flow from check-in → proxy → AI → dashboard is correct for both Moon and Sun roles.

**Critical finding:** Mood label mismatch (BUG-001) should be fixed before launch — it causes AI tone to diverge from user expectations at mood levels 1 and 2.

**Recommendation:** Fix BUG-001 (mood labels) and BUG-005 (Vietnamese consistency) before marking the CR as done. BUG-002 (AbortController) and BUG-003/004 can be addressed as follow-up tasks.
