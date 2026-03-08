# Phase 2 — Root Cause Analysis: BUG_20260309_001

> **Bug ID:** `BUG_20260309_001`
> **Date:** 2026-03-09
> **Analyst:** Claude (SWE)
> **Input:** `BUG_20260309_001_triage.md`

---

## BUG-A: Cycle calculator wraps via modulo (Critical)

### 1. Confirmed Root Cause

- **File:** `app/utils/cycleCalculator.ts`, line 19
- **Function:** `getCurrentDayInCycle()`
- **Code:** `return (diffDays % avgCycleLength) + 1;`

### 2. Why This Bug Exists

The modulo operator unconditionally wraps `diffDays` back into the range `[0, avgCycleLength-1]`. When a user's period is late (e.g., 33 days into a 28-day cycle), the function returns `(33 % 28) + 1 = 6` instead of `34`. This makes the app display a phantom follicular phase (Day 6) when the user is actually on Day 34 with a late period.

The downstream `getCurrentPhase()` function then computes the wrong phase, and `getDaysUntilNextPeriod()` shows an incorrect countdown. Every phase-dependent feature (dashboards, calendar, AI prompts, partner advice) is affected.

### 3. Proposed Fix

Replace the modulo with a simple day count (clamp at cycle length):

```typescript
// Before (line 19):
return (diffDays % avgCycleLength) + 1;

// After:
return diffDays + 1;
```

This means Day 33 of a 28-day cycle shows as Day 33, not Day 5. The `getCurrentPhase()` function already handles this correctly — when `dayInCycle > avgCycleLength`, it falls into the `'luteal'` return (the final else branch), which is acceptable behavior for a late period.

`getDaysUntilNextPeriod()` at line 39-41 already handles `remaining <= 0` by returning `avgCycleLength`, but with the fix, when `dayInCycle > avgCycleLength`, `remaining` will be `<= 0`, so it returns `avgCycleLength` — this is functionally correct (it means "overdue, next cycle expected in ~N days"). No change needed there.

### 4. Risks

- **Phase calculation for very late periods:** If `dayInCycle` is 50+ days past, `getCurrentPhase()` still returns `'luteal'`. This is acceptable — a period that late is medically unusual and luteal is the safest default phase to display.
- **Calendar markers in `buildCalendarMarkers()`:** This function uses its own loop and doesn't call `getCurrentDayInCycle()`, so it's unaffected.
- **Sun dashboard:** Uses the same `getCurrentDayInCycle()` function, so the fix applies to both Moon and Sun views automatically.

### 5. i18n Keys Needed

None.

---

## BUG-C: Tab bar theming (C1: white background, C2: pink tint for Sun)

### 1. Confirmed Root Cause

- **File:** `app/app/(tabs)/_layout.tsx`, lines 13 and 16
- **Function:** `TabsLayout()`
- **Code:**
  - Line 13: `tabBarActiveTintColor: Colors.menstrual` (hardcoded `#FF5F7E`)
  - Line 16: `backgroundColor: Colors.card` (hardcoded `#FFFFFF`)

### 2. Why This Bug Exists

The tab layout imports only `Colors` (the default/fallback theme) and uses it unconditionally. It never reads the user's role from the Zustand store, so it cannot select `MoonColors` or `SunColors`. This results in:

- **C1:** Moon users see a white tab bar (`Colors.card = #FFFFFF`) against a dark indigo dashboard (`MoonColors.background = #0D1B2A`) — a jarring visual mismatch.
- **C2:** Sun users see pink active tab icons (`Colors.menstrual = #FF5F7E`) instead of amber (`SunColors.accentPrimary = #F59E0B`) — Moon's color leaking into the Sun experience.

### 3. Proposed Fix

Import `useAppStore` and `getTheme` (or `MoonColors`/`SunColors` directly), read the role from the store, and compute theme-aware values:

```typescript
// _layout.tsx — add imports
import { useAppStore } from '@/store/appStore';
import { Colors, MoonColors, SunColors } from '@/constants/theme';

export default function TabsLayout() {
  const { t } = useTranslation('common');
  const role = useAppStore(s => s.role);

  // Pick theme-appropriate colors based on user role
  const theme = role === 'moon' ? MoonColors : role === 'sun' ? SunColors : Colors;
  const activeTint = role === 'moon' ? MoonColors.accentPrimary   // #B39DDB (lavender)
                   : role === 'sun'  ? SunColors.accentPrimary    // #F59E0B (amber)
                   : Colors.menstrual;                            // #FF5F7E (default)
  const inactiveTint = role === 'moon' ? MoonColors.textHint
                     : role === 'sun'  ? SunColors.textHint
                     : Colors.textHint;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: 'transparent',
          shadowColor: theme.black,
          // ... rest unchanged
        },
        // ... rest unchanged
      }}
    >
      {/* ... screens unchanged */}
    </Tabs>
  );
}
```

### 4. Risks

- **Role `null` during onboarding:** Before a role is selected, `role` is `null`. The fallback to `Colors` handles this gracefully — same behavior as current code.
- **Tab bar re-render on role change:** Zustand selector `s => s.role` only triggers re-render when the role actually changes, which happens once per session. No performance concern.

### 5. i18n Keys Needed

None.

---

## BUG-D: Hardcoded English strings (D1, D2, D3)

### BUG-D1: "How does this work?" / "Hide" in CycleDataReview

#### 1. Confirmed Root Cause

- **File:** `app/components/moon/CycleDataReview.tsx`, line 131
- **Code:** `{showExplanation ? 'Hide' : 'How does this work?'}`

#### 2. Why This Bug Exists

The toggle text is a hardcoded English string instead of using `t()`. The component already has `useTranslation('health')` set up, and uses `t()` for every other string — this one was simply missed.

#### 3. Proposed Fix

Add i18n keys and replace the hardcoded strings:

```typescript
// Line 131 — replace:
{showExplanation ? 'Hide' : 'How does this work?'}

// With:
{showExplanation ? t('review.hideExplanation') : t('review.showExplanation')}
```

### BUG-D2: "Done" button in ManualCycleInput

#### 1. Confirmed Root Cause

- **File:** `app/components/moon/ManualCycleInput.tsx`, line 151
- **Code:** `<Text style={styles.doneDateText}>Done</Text>`

#### 2. Why This Bug Exists

The iOS date picker "Done" button uses a hardcoded English string. The `common.json` already has a `"done"` key (`"Done"` / `"Xong"`), but it's not imported.

#### 3. Proposed Fix

Add `useTranslation('common')` and use the existing key:

```typescript
// Add to existing translations at top of component:
const { t: tCommon } = useTranslation('common');

// Line 151 — replace:
<Text style={styles.doneDateText}>Done</Text>

// With:
<Text style={styles.doneDateText}>{tCommon('done')}</Text>
```

Note: `ManualCycleInput` already imports `useTranslation` and uses `const { t, i18n } = useTranslation('health')`. We just need to add a second namespace call for `common`.

### BUG-D3: "Open Settings" in PermissionDeniedScreen

#### 1. Confirmed Root Cause

- **File:** `app/components/moon/PermissionDeniedScreen.tsx`, line 57
- **Code:** `<Text style={styles.settingsLinkText}>Open Settings</Text>`

#### 2. Why This Bug Exists

Hardcoded English string. The component uses `useTranslation('health')` but no i18n key exists for "Open Settings" in the health namespace.

#### 3. Proposed Fix

Add new i18n keys and use `t()`:

```typescript
// Line 57 — replace:
<Text style={styles.settingsLinkText}>Open Settings</Text>

// With:
<Text style={styles.settingsLinkText}>{t('permissionDenied.openSettings')}</Text>
```

### 4. Risks (all D bugs)

- **Missing key fallback:** If a key is missing, i18next shows the key path as fallback text (e.g., `"review.hideExplanation"`). Ensure both `en` and `vi` files are updated simultaneously.
- **No layout risk:** All strings are short labels; no overflow concern.

### 5. i18n Keys Needed

**`app/i18n/en/health.json`** — add:

```json
{
  "review": {
    "showExplanation": "How does this work?",
    "hideExplanation": "Hide"
  },
  "permissionDenied": {
    "openSettings": "Open Settings"
  }
}
```

**`app/i18n/vi/health.json`** — add:

```json
{
  "review": {
    "showExplanation": "Cách hoạt động?",
    "hideExplanation": "Ẩn"
  },
  "permissionDenied": {
    "openSettings": "Mở Cài đặt"
  }
}
```

**No changes needed** for `ManualCycleInput` (D2) — the key `common:done` / `common:done` already exists in both `en/common.json` ("Done") and `vi/common.json` ("Xong").

---

## BUG-E: Push notification i18n (E1: notify-cycle, E2: notify-sos)

### BUG-E1: notify-cycle sends English-only text

#### 1. Confirmed Root Cause

- **File:** `app/supabase/functions/notify-cycle/index.ts`, lines 152-165
- **Code:** All notification strings are hardcoded English:
  ```typescript
  moonTitle = 'Your period is coming';
  moonBody = `Your period may start in ${d} day${d === 1 ? '' : 's'}. Take care of yourself.`;
  sunTitle = "Moon's period is approaching";
  // etc.
  ```

#### 2. Why This Bug Exists

The Edge Function was built as English-only. There is no query to `user_preferences` to determine the user's language, and no Vietnamese copy dictionary exists in the function.

#### 3. Proposed Fix

1. **Query user language** from `user_preferences` table (batch query alongside existing token queries):

```typescript
// Add to the batch queries section (after line 115):
const { data: prefsData } = await supabase
  .from('user_preferences')
  .select('user_id, language')
  .in('user_id', allUserIds);

const langByUser = new Map<string, string>();
for (const { user_id, language } of prefsData ?? []) {
  langByUser.set(user_id, language ?? 'en');
}
```

2. **Add Vietnamese copy dictionary** at the top of the file:

```typescript
const CYCLE_COPY = {
  en: {
    approaching: {
      moonTitle: 'Your period is coming',
      moonBody: (d: number) => `Your period may start in ${d} day${d === 1 ? '' : 's'}. Take care of yourself.`,
      sunTitle: "Moon's period is approaching",
      sunBody: (d: number) => `Moon's period may start in ${d} day${d === 1 ? '' : 's'} — be extra gentle today.`,
    },
    started: {
      moonTitle: 'Your period may have started',
      moonBody: 'Day 1 of your cycle. Be kind to yourself today.',
      sunTitle: "Moon's period may have started",
      sunBody: "It's day 1 of Moon's cycle. Show extra love today.",
    },
    ended: {
      moonTitle: 'Your period is ending',
      moonBody: "Your cycle is wrapping up. Energy is returning — you've got this.",
      sunTitle: "Moon's period is ending",
      sunBody: "Moon's cycle is finishing up. She'll be feeling more like herself soon.",
    },
  },
  vi: {
    approaching: {
      moonTitle: 'Kỳ kinh sắp đến',
      moonBody: (d: number) => `Kỳ kinh có thể bắt đầu trong ${d} ngày nữa. Hãy chăm sóc bản thân nhé.`,
      sunTitle: 'Kỳ kinh của Moon sắp đến',
      sunBody: (d: number) => `Kỳ kinh của Moon có thể bắt đầu trong ${d} ngày nữa — hãy nhẹ nhàng hơn hôm nay.`,
    },
    started: {
      moonTitle: 'Kỳ kinh có thể đã bắt đầu',
      moonBody: 'Ngày 1 của chu kỳ. Hãy dịu dàng với bản thân hôm nay.',
      sunTitle: 'Kỳ kinh của Moon có thể đã bắt đầu',
      sunBody: 'Ngày 1 trong chu kỳ của Moon. Hãy yêu thương cô ấy nhiều hơn hôm nay.',
    },
    ended: {
      moonTitle: 'Kỳ kinh sắp kết thúc',
      moonBody: 'Chu kỳ sắp hoàn tất. Năng lượng đang trở lại — bạn làm được mà.',
      sunTitle: 'Kỳ kinh của Moon sắp kết thúc',
      sunBody: 'Chu kỳ của Moon sắp xong. Cô ấy sẽ sớm cảm thấy như bình thường.',
    },
  },
} as const;
```

3. **Use the language-aware copy** when building messages. For Moon messages, use `langByUser.get(moon.id)`. For Sun messages, use `langByUser.get(partnerId)`.

### BUG-E2: notify-sos sends English-only text

#### 1. Confirmed Root Cause

- **File:** `app/supabase/functions/notify-sos/index.ts`, lines 42-82
- **Code:** `SOS_COPY` and `WHISPER_COPY` dictionaries contain English-only strings. No language lookup is performed.

#### 2. Why This Bug Exists

Same root cause as E1 — the Edge Function was built English-only. The Sun user's language preference is never queried.

#### 3. Proposed Fix

1. **Query the Sun user's language** from `user_preferences` after fetching the boyfriend's ID:

```typescript
// After line 109, add:
const { data: prefData } = await supabase
  .from('user_preferences')
  .select('language')
  .eq('user_id', couple.boyfriend_id)
  .maybeSingle();

const lang = (prefData?.language ?? 'en') as 'en' | 'vi';
```

2. **Add Vietnamese copy dictionaries** — restructure `SOS_COPY` and `WHISPER_COPY` as nested objects:

```typescript
const SOS_COPY: Record<string, Record<string, { title: string; body: string }>> = {
  en: {
    sweet_tooth: { title: 'Moon needs you', body: "She's craving something sweet — bring her a little treat." },
    need_a_hug:  { title: 'Moon needs you', body: 'She needs a hug right now. Just hold her close.' },
    cramps_alert:{ title: 'Moon needs you', body: 'Cramps alert — a hot water bottle and your presence means everything.' },
    quiet_time:  { title: 'Moon needs you', body: 'She needs some quiet time. Check in gently, softly.' },
  },
  vi: {
    sweet_tooth: { title: 'Moon cần bạn', body: 'Cô ấy đang thèm đồ ngọt — mang cho cô ấy một món nhỏ nhé.' },
    need_a_hug:  { title: 'Moon cần bạn', body: 'Cô ấy cần một cái ôm ngay bây giờ. Hãy ôm cô ấy thật chặt.' },
    cramps_alert:{ title: 'Moon cần bạn', body: 'Cô ấy bị đau bụng — túi nước nóng và sự hiện diện của bạn là tất cả.' },
    quiet_time:  { title: 'Moon cần bạn', body: 'Cô ấy cần không gian yên tĩnh. Hãy nhẹ nhàng hỏi thăm.' },
  },
};
```

Same pattern for `WHISPER_COPY` — add `vi` translations for all 16 whisper types.

3. **Use the language** when looking up copy:

```typescript
const copy =
  SOS_COPY[lang]?.[signal.type] ??
  WHISPER_COPY[lang]?.[signal.type] ?? {
    title: lang === 'vi' ? 'Moon đã thì thầm với bạn' : 'Moon whispered to you',
    body: signal.message ?? (lang === 'vi' ? 'Cô ấy gửi cho bạn một lời thì thầm.' : 'She sent you a whisper.'),
  };
```

### 4. Risks (both E1 and E2)

- **user_preferences row may not exist:** If a user hasn't set a language preference, the query returns null. Default to `'en'` in that case.
- **Additional DB query latency:** One extra query per Edge Function invocation. For `notify-cycle`, it's batched with existing queries so minimal impact. For `notify-sos`, it's one extra single-row lookup.
- **Deployment:** Edge Functions require redeployment via `supabase functions deploy`. This is a separate deployment from the app.

### 5. i18n Keys Needed

No app-side i18n keys needed — the translations live directly in the Edge Function source as copy dictionaries (they run server-side in Deno, not in the React Native i18n system).

---

## BUG-F: "AI" label visible in user-facing UI

### 1. Confirmed Root Cause

Two locations:

**Location 1 — MoonDashboard:**
- **File:** `app/screens/MoonDashboard.tsx`, lines 100-102
- **Code:**
  ```tsx
  {isAI && !greetingLoading && (
    <Text style={styles.aiLabel}>✦ AI</Text>
  )}
  ```

**Location 2 — SunDashboard:**
- **File:** `app/screens/SunDashboard.tsx`, line 156
- **Code:**
  ```tsx
  title={adviceIsAI ? t('howToShowUpAI') : t('howToShowUp')}
  ```
- The i18n key `howToShowUpAI` contains "AI":
  - EN: `"How to show up ✦ AI"`
  - VI: `"Cách thể hiện ✦ AI"`

### 2. Why This Bug Exists

This violates the product design rule: **No AI terminology in user-facing UI**. The `isAI` flag was intended for internal tracking of whether the AI responded successfully, but it was incorrectly used to conditionally show an "AI" badge. The `howToShowUpAI` i18n key was created specifically for this badge, embedding "AI" in the title.

### 3. Proposed Fix

**MoonDashboard (lines 100-102):** Remove the entire `isAI` render block:

```tsx
// DELETE these 3 lines:
{isAI && !greetingLoading && (
  <Text style={styles.aiLabel}>✦ AI</Text>
)}
```

Also remove the `aiLabel` style definition from the `StyleSheet.create()` block (lines 242-245).

**SunDashboard (line 156):** Always use the non-AI title:

```tsx
// Before:
title={adviceIsAI ? t('howToShowUpAI') : t('howToShowUp')}

// After:
title={t('howToShowUp')}
```

**i18n cleanup:** Remove `howToShowUpAI` keys from both dashboard translation files:
- `app/i18n/en/dashboard.json` — remove `"howToShowUpAI": "How to show up ✦ AI"`
- `app/i18n/vi/dashboard.json` — remove `"howToShowUpAI": "Cách thể hiện ✦ AI"`

**Also clean up common.json:** The keys `"ai": "AI"` and `"aiLabel": "✦ AI"` in both `en/common.json` and `vi/common.json` are now unused and should be removed.

### 4. Risks

- **Low risk.** The `isAI` boolean is still available in hooks for internal use (e.g., analytics, fallback logic). We're only removing its effect on UI rendering.
- **Unused i18n keys:** Removing `howToShowUpAI`, `ai`, and `aiLabel` keys. If any other component references them, it will show the key path as fallback. A project-wide search should confirm no other usage.

### 5. i18n Keys Needed

No new keys. Keys to **remove**:
- `dashboard:howToShowUpAI` (en + vi)
- `common:ai` (en + vi)
- `common:aiLabel` (en + vi)

---

## Summary Table

| Bug | Severity | File(s) | Root Cause | Fix Type |
|-----|----------|---------|------------|----------|
| BUG-A | Critical | `cycleCalculator.ts:19` | Modulo wraps day count | Remove modulo, return `diffDays + 1` |
| BUG-C1 | High | `_layout.tsx:16` | Hardcoded `Colors.card` | Read role from store, use `getTheme()` |
| BUG-C2 | Medium | `_layout.tsx:13` | Hardcoded `Colors.menstrual` | Use role-aware active tint color |
| BUG-D1 | High | `CycleDataReview.tsx:131` | Hardcoded EN string | Replace with `t()` + new i18n keys |
| BUG-D2 | Low | `ManualCycleInput.tsx:151` | Hardcoded "Done" | Use existing `tCommon('done')` |
| BUG-D3 | Low | `PermissionDeniedScreen.tsx:57` | Hardcoded "Open Settings" | Replace with `t()` + new i18n key |
| BUG-E1 | High | `notify-cycle/index.ts:152-165` | English-only copy | Add language query + VI copy dict |
| BUG-E2 | High | `notify-sos/index.ts:42-82` | English-only copy | Add language query + VI copy dict |
| BUG-F | Medium | `MoonDashboard.tsx:100-102`, `SunDashboard.tsx:156` | "AI" label in UI | Remove AI badge + unused i18n keys |

## New i18n Keys Required

| File | Key | EN | VI |
|------|-----|----|----|
| `health.json` | `review.showExplanation` | How does this work? | Cach hoat dong? |
| `health.json` | `review.hideExplanation` | Hide | An |
| `health.json` | `permissionDenied.openSettings` | Open Settings | Mo Cai dat |

(Full Vietnamese with diacritics: `"Cách hoạt động?"`, `"Ẩn"`, `"Mở Cài đặt"`)

## i18n Keys to Remove

| File | Key |
|------|-----|
| `en/dashboard.json` + `vi/dashboard.json` | `howToShowUpAI` |
| `en/common.json` + `vi/common.json` | `ai` |
| `en/common.json` + `vi/common.json` | `aiLabel` |
