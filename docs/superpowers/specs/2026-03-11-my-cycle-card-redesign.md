# My Cycle Card Redesign — Design Spec

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Calendar tab enhancement + Settings tab cleanup

## Problem Statement

The current Settings screen has two separate sections — "Cycle Settings" and "Your Period History" — that serve overlapping purposes. This creates confusion: redundant CTAs ("Edit Period History" + "Add another period"), raw number inputs that feel clinical, a lifeless empty state, and no visual summary of logged periods. The cycle data is buried in Settings where users rarely go.

## Solution

Move cycle data to the **Calendar tab** as a unified "My Cycle" card. Calendar is the natural home — users already see their cycle visualized there. Settings becomes lighter with just a minimal link row.

## Design Decision: Option 3 — Calendar Tab

**Chosen over:**
- Option 1 (keep in Settings) — still buries data
- Option 2 (Dashboard widget) — clutters MoonDashboard
- Option 4 (new tab) — 4 tabs = unnecessary cognitive load

**Rationale:** Aligns with Flo, Clue, Ovia patterns where history lives alongside the calendar. Natural information grouping.

## UX Research Insights Applied

| Pattern | Source | How Applied |
|---------|--------|-------------|
| Living averages (computed, not static) | Clue, Flo | Cycle summary shows computed stats |
| Logged vs predicted distinction | Ovia | Period history dots use solid fill |
| Vertical scroll + widget cards | Flo, Clue | ScrollView + self-contained card |
| One-handed vertical scrolling | Clue redesign | No horizontal swiping |
| Warm empathetic tone | Easel brand | "My Cycle" not "Cycle Settings" |

## Architecture

### Calendar Tab Changes

Wrap existing content in `ScrollView`. Add `MyCycleCard` below the legend.

```
ScrollView
  ├── Header (existing, unchanged)
  ├── Calendar (existing, unchanged)
  ├── Legend (existing, unchanged)
  ├── MyCycleCard (NEW)
  └── DayDetailSheet modal (existing, unchanged)
```

### Settings Tab Changes

**Remove:**
- "CYCLE SETTINGS" section (lines 394-470 in settings.tsx)
- "Your period history" section (lines 472-493 in settings.tsx)
- Related state: `cycleLen`, `periodLen`, `lastPeriod`, `showDatePicker`
- Related handler: `handleSaveCycle()`

**Add:**
- Minimal "My Cycle" link row inside Settings card, linking to Calendar tab

### New Component: `MyCycleCard.tsx`

**File:** `app/components/moon/MyCycleCard.tsx`

**Design:** Pure presentational component. No store access — all data passed via props.

```typescript
interface MyCycleCardProps {
  cycleSettings: {
    avgCycleLength: number;
    avgPeriodLength: number;
    lastPeriodStartDate: string;
  };
  periodLogs: Array<{
    startDate: string;
    endDate?: string | null;
  }>;
  language: string;
  onLogPeriod: () => void;
  onEditSettings: () => void;
}
```

**Sub-components:**

#### A. Cycle Summary Row
Three stat pills in a horizontal row:

| Pill | Content | Style |
|------|---------|-------|
| Cycle Length | `28` + "day cycle" | Bold number + caption |
| Period Length | `5` + "day period" | Bold number + caption |
| Next Period | `~Mar 25` + "next period" | Bold date + caption |

- Background: `Colors.inputBg` (#F2F2F7)
- Border radius: `Radii.sm` (12)
- Equal flex distribution

#### B. Period History List
- Section header: "Period History" with count badge
- Each row: `startDate – endDate` | `N days` | solid menstrual dot
- Sorted newest first (already sorted in store)
- Max 6 visible inline; "See all N periods" link if more
- Empty state: "No periods logged yet" with soft hint text

Row layout:
```
┌─────────────────────────────────────┐
│  🔴  Feb 25 – Mar 1         5 days │
│  🔴  Jan 28 – Feb 1         5 days │
└─────────────────────────────────────┘
```

- Dot: 8px circle, `Colors.menstrual`
- Date range: `Typography.body`, `Colors.textPrimary`
- Duration: `Typography.caption`, `Colors.textSecondary`, right-aligned

#### C. Log Period CTA
- Full-width button with pink tint background
- Icon: Feather `plus` (16px)
- Label: "Log a period"
- Navigates to `/health-sync`

#### D. Edit Settings Footer
- Thin divider
- Row: "Cycle length · Period length" text + "Edit ›" link
- Tapping navigates to `/health-sync` (manual input step)
- Style: `Typography.caption`, `Colors.textHint`

### Card Styling

Follows existing card pattern from settings/calendar:
```
backgroundColor: Colors.card (#FFFFFF)
borderRadius: Radii.lg (28)
padding: Spacing.md (16)
gap: Spacing.md (16)
shadow: { color: black, offset: {0, 2}, opacity: 0.04, radius: 8 }
```

## Translation Keys

### `calendar` namespace (EN)

```json
{
  "myCycle": "MY CYCLE",
  "cycleLengthStat": "{{count}}-day cycle",
  "periodLengthStat": "{{count}}-day period",
  "nextPeriodLabel": "Next period",
  "nextPeriodAround": "~{{date}}",
  "periodHistoryTitle": "Period History",
  "noPeriods": "No periods logged yet",
  "noPeriodsHint": "Log your periods for more accurate predictions",
  "logPeriod": "Log a period",
  "editCycleSettings": "Edit",
  "cyclePeriodSummary": "Cycle length · Period length",
  "seeAllPeriods": "See all {{count}} periods"
}
```

### `calendar` namespace (VI)

```json
{
  "myCycle": "CHU KỲ CỦA TÔI",
  "cycleLengthStat": "Chu kỳ {{count}} ngày",
  "periodLengthStat": "Kỳ kinh {{count}} ngày",
  "nextPeriodLabel": "Kỳ kinh tiếp theo",
  "nextPeriodAround": "~{{date}}",
  "periodHistoryTitle": "Lịch sử kỳ kinh",
  "noPeriods": "Chưa ghi kỳ kinh nào",
  "noPeriodsHint": "Ghi kỳ kinh để dự đoán chính xác hơn",
  "logPeriod": "Ghi kỳ kinh",
  "editCycleSettings": "Chỉnh sửa",
  "cyclePeriodSummary": "Độ dài chu kỳ · Độ dài kỳ kinh",
  "seeAllPeriods": "Xem tất cả {{count}} kỳ kinh"
}
```

### `settings` namespace additions

**EN:**
```json
{
  "myCycle": "My Cycle",
  "viewCycle": "View"
}
```

**VI:**
```json
{
  "myCycle": "Chu kỳ của tôi",
  "viewCycle": "Xem"
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `app/components/moon/MyCycleCard.tsx` | New presentational component |

## Files to Modify

| File | Change |
|------|--------|
| `app/app/(tabs)/calendar.tsx` | Wrap in ScrollView, add MyCycleCard |
| `app/app/(tabs)/settings.tsx` | Remove Cycle Settings + Period History sections, add minimal link row |
| `app/i18n/en/calendar.json` | Add new translation keys |
| `app/i18n/vi/calendar.json` | Add new translation keys |
| `app/i18n/en/settings.json` | Add myCycle, viewCycle keys |
| `app/i18n/vi/settings.json` | Add myCycle, viewCycle keys |

## Utility Functions Needed

**`getNextPeriodDate(lastPeriodStartDate: string, avgCycleLength: number): string`**
- Calculates next predicted period start date
- Returns formatted date string
- Uses existing `getDaysUntilNextPeriod` from `cycleCalculator.ts`

**`formatPeriodDuration(startDate: string, endDate?: string | null): number`**
- Returns number of days for a period entry
- If no endDate, returns avgPeriodLength as fallback

## Success Criteria

- [ ] Calendar tab shows "My Cycle" card below legend
- [ ] Card displays 3 stat pills (cycle length, period length, next period)
- [ ] Card shows period history list with dates and durations
- [ ] "Log a period" navigates to health-sync flow
- [ ] "Edit" navigates to health-sync manual input
- [ ] Settings tab no longer shows Cycle Settings or Period History sections
- [ ] Settings tab has a minimal "My Cycle" row linking to Calendar
- [ ] All text translated EN + VI
- [ ] Empty state handles 0 periods gracefully
- [ ] Component is pure presentational (no store access)
