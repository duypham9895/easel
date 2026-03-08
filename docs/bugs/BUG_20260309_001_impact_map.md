# Phase 1 — Impact Map: BUG_20260309_001

> **Bug ID:** `BUG_20260309_001`
> **Date:** 2026-03-09
> **Phase:** Impact Mapping
> **Author:** QA Engineer (automated)

---

## Bug Group A — Cycle Calculator Modulo Wrap (Critical)

### 1. Directly Involved Files
| File | Line(s) | What's wrong |
|------|---------|-------------|
| `app/utils/cycleCalculator.ts` | 19 | `(diffDays % avgCycleLength) + 1` wraps unconditionally — never returns a value > avgCycleLength |
| `app/utils/cycleCalculator.ts` | 38-41 | `getDaysUntilNextPeriod` also masks the issue by wrapping remaining days |

### 2. Files That Share This Module (Blast Radius)
| Consumer | Usage |
|----------|-------|
| `app/screens/MoonDashboard.tsx:48-60` | `getCurrentDayInCycle`, `getCurrentPhase`, `getDaysUntilNextPeriod`, `getConceptionChance` |
| `app/screens/SunDashboard.tsx:40-52` | `getCurrentDayInCycle`, `getCurrentPhase`, `getDaysUntilNextPeriod` |
| `app/app/(tabs)/calendar.tsx:79-83` | `getCurrentPhase`, `buildCalendarMarkers` (also has its own inline modulo on line 80) |
| `app/app/(tabs)/settings.tsx:127-137` | `getCurrentDayInCycle`, `getCurrentPhase`, `getDaysUntilNextPeriod` (partner phase info for Sun) |
| `app/__tests__/cycleCalculator.test.ts` | Unit tests (must be updated to cover late period scenario) |

### 3. User Flows Affected
- **Moon Dashboard**: Phase wheel, phase tagline, greeting, insight cards, daily check-in, whisper phase selection — all show wrong phase/day when period is late
- **Sun Dashboard**: Phase orb day number, phase name/tagline, countdown badge, "How to show up" advice — all wrong when Moon's period is late
- **Calendar Tab**: Today's phase color, day detail sheet cycle day — both use modulo math
- **Settings Tab**: Partner phase display for Sun users — shows wrong phase
- **AI Hooks**: `useAIGreeting`, `useAIPartnerAdvice`, `useAIWhisperOptions` — all receive wrong `phase` and `dayInCycle` inputs, producing irrelevant AI content
- **Push Notifications**: `notify-cycle` Edge Function uses `addDays` + `daysDiff` (separate math), not `cycleCalculator.ts`. It computes `daysUntil` from `last_period_start_date + avg_cycle_length`, which is correct for the _next_ period but does not account for multiple missed periods.

### 4. Data Models Affected
- `CycleSettings` (`lastPeriodStartDate`, `avgCycleLength`, `avgPeriodLength`) — no data corruption, but these values are interpreted incorrectly
- No DB writes are affected — this is a pure display/calculation bug

### 5. Edge Cases That Currently Work but Could Break During Fix
- **Day 1 of a new cycle** (diffDays === 0): Must still return 1
- **Future lastPeriodStartDate** (diffDays < 0): Currently returns 1 — must preserve this guard
- **Exactly on cycle boundary** (diffDays === avgCycleLength): Currently wraps to Day 1 — fix must decide: is this Day 1 of new cycle or Day N+1 of late period? Product decision needed.
- **Very late period** (diffDays >> avgCycleLength, e.g., 90 days past): New code must handle gracefully without nonsensical "Day 90"
- **`buildCalendarMarkers`** projects 3 cycles ahead using `cycle * avgCycleLength` offset — this is separate math and should NOT be changed (it's predictive, not current-state)
- **Calendar `computeDayInfo` (line 198)**: Has its own modulo `((diffDays % avgCycleLength) + avgCycleLength) % avgCycleLength + 1` — this is for viewing any calendar date and SHOULD wrap (it's showing predicted phase for future/past dates, not current late-period state). Must NOT accidentally break this.

### 6. High-Risk Areas
- **Introducing a new "late" concept**: If `getCurrentDayInCycle` can now return values > `avgCycleLength`, then `getCurrentPhase` will always return `'luteal'` for any day > `ovulationDay + 2`. A new `'late'` phase or explicit handling is needed.
- **`PHASE_INFO[phase]`**: If a new phase is introduced, every consumer that indexes into `PHASE_INFO` will crash unless the new phase is added to the constant.
- **`getDaysUntilNextPeriod`**: Currently has `remaining <= 0 ? avgCycleLength : remaining`. If dayInCycle can now exceed avgCycleLength, this must be updated to return 0 or negative (period is overdue).
- **`getConceptionChance`**: Switch statement has no default — if a new phase is added, TypeScript may not catch missing case at runtime.
- **AI prompt engineering**: `proxy/lib/minimax.ts` receives phase and dayInCycle — if dayInCycle > avgCycleLength, prompts may produce unexpected results.

### 7. MUST Regression Test
- Moon Dashboard: phase wheel, phase name, day-in-cycle display for normal cycle (day 1-28)
- Moon Dashboard: phase wheel for late period (day 29+)
- Sun Dashboard: phase orb, countdown badge for normal and late cycles
- Calendar: today highlight phase color, day detail sheet
- Settings: partner phase display (Sun role)
- `cycleCalculator.ts`: All exported functions with edge cases (day 0, day 1, boundary, late, very late, future date)

### 8. SHOULD Regression Test
- AI greeting content relevance (Moon)
- AI partner advice content relevance (Sun)
- Whisper sheet phase-based options
- Daily check-in phase-awareness
- `notify-cycle` Edge Function timing logic (separate math but related concept)

---

## Bug Group B — Sun Missing Real-time Cycle Updates (Deferred)

> **Deferred to FEAT_20260309_001** — this is a feature request, not a bug fix.
> No impact mapping needed for this batch.

---

## Bug Group C — Tab Bar Theming (C1: High, C2: Medium)

### 1. Directly Involved Files
| File | Line(s) | What's wrong |
|------|---------|-------------|
| `app/app/(tabs)/_layout.tsx` | 13 | `tabBarActiveTintColor: Colors.menstrual` — hardcoded pink, not role-aware |
| `app/app/(tabs)/_layout.tsx` | 16 | `backgroundColor: Colors.card` (#FFFFFF) — hardcoded white, not role-aware |

### 2. Files That Share This Module
| File | Relationship |
|------|-------------|
| `app/constants/theme.ts` | Source of `Colors`, `MoonColors`, `SunColors`, `getThemeColors()` |
| `app/store/appStore.ts` | Provides `role` state needed for role-aware theming |
| All tab screens (`index.tsx`, `calendar.tsx`, `settings.tsx`) | Rendered inside this layout — visual context changes for all |

### 3. User Flows Affected
- **Every screen for Moon users**: White tab bar clashes with dark Moon theme on dashboard, calendar, and settings
- **Every screen for Sun users**: Pink active tint is Moon-branded, feels wrong in Sun's warm cream space

### 4. Data Models Affected
- None — purely a styling/theming issue

### 5. Edge Cases That Could Break During Fix
- **Unauthenticated state** (`role === null`): Before role selection, the tab bar must use a sensible default (likely `Colors` / light theme)
- **Role change in Settings**: If user switches role via Settings > Change Role, the tab bar theme must update reactively (Zustand `role` change should trigger re-render)
- **Tab bar shadow/elevation**: Moon theme may need different shadow values (dark-on-dark vs light shadow)
- **`tabBarInactiveTintColor`** (line 14): Currently `Colors.textHint` — should this also be role-aware? Moon's `textHint` is `#6B7A8C`, Sun's is `#9C8B7A`
- **`borderTopColor: 'transparent'`**: Fine for both themes, but verify on device

### 6. High-Risk Areas
- **Reading `role` from Zustand in `_layout.tsx`**: This file currently does NOT import `useAppStore`. Adding it introduces a new dependency. Must ensure it doesn't cause unnecessary re-renders of all tab screens.
- **Conditional styling**: Must handle the `null` role gracefully before onboarding completes.

### 7. MUST Regression Test
- Tab bar appearance as Moon (dark background, purple/phase-appropriate active tint)
- Tab bar appearance as Sun (cream/white background, amber active tint)
- Tab bar appearance before role selection (default light theme)
- Tab bar after role change (Settings > Change Role)

### 8. SHOULD Regression Test
- Tab bar animation/transition when switching tabs
- Tab bar appearance on different iOS devices (notch vs Dynamic Island vs home button)
- Android tab bar rendering (elevation, shadow differences)

---

## Bug Group D — Hardcoded English Strings (D1: High, D2/D3: Low)

### 1. Directly Involved Files
| Bug | File | Line(s) | Hardcoded String |
|-----|------|---------|-----------------|
| D1 | `app/components/moon/CycleDataReview.tsx` | 131 | `'How does this work?'` and `'Hide'` |
| D2 | `app/components/moon/ManualCycleInput.tsx` | 151 | `'Done'` (iOS date picker dismiss button) |
| D3 | `app/components/moon/PermissionDeniedScreen.tsx` | 57 | `'Open Settings'` |

### 2. Files That Share This Module
| File | Relationship |
|------|-------------|
| `app/i18n/en/health.json` | English health namespace — new keys needed |
| `app/i18n/vi/health.json` | Vietnamese health namespace — new translations needed |
| `app/app/health-sync.tsx` | Parent screen that renders CycleDataReview, ManualCycleInput, PermissionDeniedScreen |

### 3. User Flows Affected
- **Health Sync onboarding (Moon only)**: The entire HealthKit/manual entry flow
  - CycleDataReview: shown after HealthKit sync or manual entry — explanation toggle text
  - ManualCycleInput: shown when user enters data manually — iOS date picker "Done" button
  - PermissionDeniedScreen: shown when HealthKit permission denied — "Open Settings" link

### 4. Data Models Affected
- None — purely i18n string replacement

### 5. Edge Cases That Could Break During Fix
- **D2 "Done" button**: The `DateTimePicker` from `@react-native-community/datetimepicker` has its own iOS locale handling. The "Done" button here is a _custom_ `TouchableOpacity`, not the native picker's built-in confirm. Fix is safe — just replace string with `t()` call.
- **Long Vietnamese strings**: "Mở Cài đặt" (Open Settings) and "Điều này hoạt động như thế nào?" (How does this work?) are longer than English — verify no text truncation in the UI
- **Missing i18n key fallback**: If a key is missing from the JSON, `i18next` returns the key name. Ensure both `en` and `vi` JSONs are updated.

### 6. High-Risk Areas
- **None** — these are straightforward string replacements with `t()` calls
- Only risk is forgetting to add the key to both language files

### 7. MUST Regression Test
- CycleDataReview in Vietnamese: tap "How does this work?" toggle — verify Vietnamese text
- ManualCycleInput in Vietnamese on iOS: verify "Done" button shows Vietnamese
- PermissionDeniedScreen in Vietnamese on iOS: verify "Open Settings" shows Vietnamese

### 8. SHOULD Regression Test
- All three screens in English (ensure no regression)
- Text truncation check for Vietnamese strings in all three locations
- CycleDataReview explanation toggle animation (expand/collapse) still works

---

## Bug Group E — Push Notification i18n (E1 + E2: High)

### 1. Directly Involved Files
| Bug | File | Line(s) | What's wrong |
|-----|------|---------|-------------|
| E1 | `app/supabase/functions/notify-cycle/index.ts` | 152-165 | All notification strings hardcoded in English |
| E2 | `app/supabase/functions/notify-sos/index.ts` | 42-82 | `SOS_COPY` and `WHISPER_COPY` dictionaries English-only |

### 2. Files That Share This Module
| File | Relationship |
|------|-------------|
| Supabase `user_preferences` table | Stores user's `language` preference — must be queried to determine language |
| `app/store/appStore.ts` | `setLanguage` action syncs language to `user_preferences` table |
| Expo Push API | Receives the messages — no language awareness, just passes through |

### 3. User Flows Affected
- **E1 — Cycle Notifications**: Daily cron-triggered notifications to Moon and Sun users about period approaching/started/ended
  - Moon receives: "Your period is coming" (should be Vietnamese for VI users)
  - Sun receives: "Moon's period is approaching" (should be Vietnamese for VI users)
- **E2 — SOS/Whisper Notifications**: Real-time push when Moon sends SOS or Whisper signal
  - Sun receives: "Moon needs you" / "She's craving something sweet" etc. (should be Vietnamese for VI users)

### 4. Data Models Affected
- `user_preferences.language` — must be queried by Edge Functions (currently not queried)
- `profiles` table — Edge Functions already query this; may need JOIN to `user_preferences`
- **Schema consideration**: `notify-sos` currently queries `couples.boyfriend_id` but NOT the boyfriend's language preference

### 5. Edge Cases That Could Break During Fix
- **No language preference set**: Users who signed up before language preference was added may have no row in `user_preferences`. Must default to `'en'`.
- **Moon and Sun have different languages**: Moon speaks Vietnamese, Sun speaks English. Each notification must be sent in the _recipient's_ language, not the sender's.
- **notify-cycle batching**: Currently uses batch queries for efficiency. Adding per-user language lookup must not create N+1 query problems. Should batch-fetch all `user_preferences` for affected users.
- **notify-sos webhook latency**: Adding a language lookup adds one more DB query. Must ensure this doesn't cause timeout.
- **New SOS/Whisper types added later**: The translation dictionaries must be kept in sync with `app/constants/sos.ts` and `app/constants/whisper.ts`.
- **Deno runtime**: Edge Functions use Deno, not Node.js. Cannot use `i18next` library. Must implement simple lookup or inline translation maps.

### 6. High-Risk Areas
- **Dual-language notification copy maintenance**: Hardcoded bilingual dictionaries in Edge Functions are separate from the app's `i18n/` JSON files. Risk of copy drift over time. Consider a shared constants approach or at minimum document the duplication.
- **notify-cycle batch query restructuring**: Adding JOIN to `user_preferences` changes the query shape. Must test with users who have no preference row.
- **Pluralization**: English uses "day/days" pluralization (`${d} day${d === 1 ? '' : 's'}`). Vietnamese doesn't pluralize nouns the same way. Translation must handle this correctly.

### 7. MUST Regression Test
- notify-cycle: Vietnamese Moon user receives Vietnamese notification for period approaching/started/ended
- notify-cycle: English Moon user still receives English notification
- notify-cycle: Sun user receives notification in Sun's language (not Moon's)
- notify-sos: Vietnamese Sun user receives Vietnamese SOS notification
- notify-sos: Vietnamese Sun user receives Vietnamese Whisper notification
- notify-sos: English Sun user still receives English notifications
- Both functions: User with no `user_preferences` row defaults to English

### 8. SHOULD Regression Test
- notify-cycle: Batch processing performance with mixed-language users
- notify-sos: Latency with additional language lookup query
- Fallback text for unknown SOS/Whisper types in both languages

---

## Bug Group F — "AI" Label in User-Facing UI (Medium)

### 1. Directly Involved Files
| File | Line(s) | What's wrong |
|------|---------|-------------|
| `app/screens/MoonDashboard.tsx` | 100-102 | `{isAI && <Text style={styles.aiLabel}>✦ AI</Text>}` — explicit AI label |
| `app/screens/SunDashboard.tsx` | 156 | `adviceIsAI ? t('howToShowUpAI') : t('howToShowUp')` — "AI" in title when AI response |
| `app/i18n/en/dashboard.json` | 12 | `"howToShowUpAI": "How to show up ✦ AI"` |
| `app/i18n/vi/dashboard.json` | 12 | `"howToShowUpAI": "Cách thể hiện ✦ AI"` |
| `app/i18n/en/common.json` | 16 | `"aiLabel": "✦ AI"` — unused but present |
| `app/i18n/vi/common.json` | 16 | `"aiLabel": "✦ AI"` — unused but present |

### 2. Other Files With AI Labels (Extended Blast Radius)
| File | Line | AI-Labelled Content |
|------|------|-------------------|
| `app/components/bf/SOSAlert.tsx` | 45 | `tipIsAI ? ' · ✦ AI' : ''` in badge text |
| `app/components/sun/WhisperAlert.tsx` | 64 | `tipIsAI ? ' · ✦ AI' : ''` in badge text |
| `app/i18n/en/signals.json` | 5 | `"personalizedAI": "Personalized for your phase ✦ AI"` |
| `app/i18n/vi/signals.json` | 5 | `"Được cá nhân hoá cho giai đoạn của bạn ✦ AI"` |
| `app/i18n/en/checkin.json` | 20 | `"aiInsight": "✦ AI Insight"` |

### 3. User Flows Affected
- **Moon Dashboard greeting**: "✦ AI" label shown below AI-generated greeting
- **Sun Dashboard "How to show up" card**: Title changes to "How to show up ✦ AI" when AI response loads
- **SOS Alert (Sun)**: Badge shows "SOS Signal · ✦ AI" when AI tip is loaded
- **Whisper Alert (Sun)**: Badge shows "Whisper · ✦ AI" when AI tip is loaded
- **Daily Check-in Insight (Moon)**: "✦ AI Insight" header on post-checkin card
- **Whisper Sheet (Moon)**: "Personalized for your phase ✦ AI" subtitle

### 4. Data Models Affected
- None — purely UI label changes

### 5. Edge Cases That Could Break During Fix
- **Removing `isAI` conditional entirely**: The `isAI` flag is also used in AI hooks to determine if the response is from AI or static fallback. Must NOT remove the flag from hooks — only remove the UI rendering.
- **Removing i18n keys**: If `howToShowUpAI` key is removed, any cached/old app version referencing it will show the key name. Safer to keep the key but make it identical to `howToShowUp` (no "AI" text), or replace usage.
- **Product design rule enforcement**: The fix must be comprehensive — all 6+ locations must be updated. Partial fix is worse than no fix (inconsistent experience).

### 6. High-Risk Areas
- **Scope creep**: The triage identified Moon Dashboard and Sun Dashboard, but the extended blast radius shows 4 additional locations. All must be addressed for consistency.
- **`SOSAlert.tsx` and `WhisperAlert.tsx`**: These use inline conditional string concatenation, not i18n keys. Fix approach differs from dashboard fixes.

### 7. MUST Regression Test
- Moon Dashboard: AI greeting loads — no "✦ AI" label visible
- Sun Dashboard: AI advice loads — title says "How to show up" (no "✦ AI")
- Both dashboards: Static fallback loads — no visual difference from AI version

### 8. SHOULD Regression Test
- SOS Alert: AI tip loads — badge text has no "AI" reference
- Whisper Alert: AI tip loads — badge text has no "AI" reference
- Daily Check-in insight: header has no "AI" reference
- Whisper Sheet: subtitle has no "AI" reference
- Vietnamese versions of all above

---

## Cross-Group Risk Matrix

| Risk | Bug Groups | Severity |
|------|-----------|----------|
| Cycle calculator change cascading to all phase-dependent UI | A | Critical |
| New phase/state concept ("late") requiring constant updates | A | High |
| Calendar tab has its own modulo math (line 80, 198) that must NOT be broken | A | High |
| Tab layout adding Zustand dependency causing re-renders | C | Medium |
| Edge Function language lookup creating N+1 queries | E | Medium |
| AI label removal must cover 6+ locations, not just 2 | F | Medium |
| i18n key additions must mirror in both en/ and vi/ | D, E, F | Low |
| Edge Function bilingual copy drifting from app i18n files | E | Low (ongoing) |

## Recommended Fix Order

1. **Bug Group A** (Critical) — Fix cycle calculator first since all other features depend on correct phase/day
2. **Bug Group C** (High) — Tab bar theming is high-visibility, low-risk fix
3. **Bug Group D** (High/Low) — Straightforward i18n string replacements
4. **Bug Group F** (Medium) — AI label removal across all locations
5. **Bug Group E** (High) — Edge Function i18n is most complex, requires schema awareness and bilateral testing

> **Bug Group B is deferred** to `FEAT_20260309_001`.
