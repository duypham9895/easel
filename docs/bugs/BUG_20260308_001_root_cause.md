# BUG_20260308_001 — Root Cause Analysis

## Summary

The Display Name TextInput placeholder renders as "Y o u r  n a" (letter-spaced and truncated) because a hardcoded `width: 120` constrains the input to fewer usable pixels than the placeholder text requires at `fontSize: 16`.

## Confirmed Root Cause

### The problematic code (settings.tsx, line 157)

```tsx
<TextInput
  style={[settingStyles.input, { width: 120, padding: 6 }]}
  ...
  placeholder={t('yourName')}
/>
```

### Computed style breakdown

| Property | Source | Resolved Value |
|----------|--------|----------------|
| `fontSize` | `Typography.body` via `settingStyles.input` | **16** |
| `fontWeight` | `Typography.body` via `settingStyles.input` | **400** |
| `width` | Inline override | **120 px** |
| `padding` | Inline override (replaces `Spacing.sm = 8`) | **6 px** (all sides) |
| `backgroundColor` | `settingStyles.input` | `Colors.inputBg` (#F2F2F7) |
| `borderRadius` | `settingStyles.input` | `Radii.sm` (12) |

### Space budget calculation

```
Total width:           120 px
Left padding:          - 6 px
Right padding:         - 6 px
─────────────────────────────
Usable content width:  108 px
```

### Space required for placeholder text

At `fontSize: 16`, `fontWeight: 400` (San Francisco / system font on iOS), average character width is approximately 8.5-9 px. The strings require:

| Locale | Placeholder | Chars | Estimated Width |
|--------|-------------|-------|-----------------|
| EN | "Your name" | 9 + 1 space | ~130-140 px |
| VI | "Ten cua ban" | 10 + 2 spaces | ~140-150 px |

**Deficit: 22-42 px depending on locale.**

### Why it appears letter-spaced (not just truncated)

React Native's `TextInput` on iOS uses `UITextField` under the hood. When placeholder text exceeds the content width, the text layout engine does **not** simply clip — it compresses the text into the available width by adjusting the `NSLayoutManager` line fragment rect. On newer iOS versions (26.x), the `adjustsFontSizeToFitWidth` behavior interacts with the placeholder rendering path, causing the system to stretch inter-character spacing to fill the fixed width while truncating characters that overflow. This produces the characteristic "Y o u r  n a" appearance: letters spread apart with trailing characters cut off.

### Why other rows work fine

| Row | Component | Width Strategy | Result |
|-----|-----------|---------------|--------|
| Email | `<Row>` | `rowStyles.value` — no fixed width, flex naturally | OK |
| Language | Inline `<Text>` | No fixed width, flex naturally | OK |
| Role | Inline `<Text>` | No fixed width, flex naturally | OK |
| **Display Name** | `<TextInput>` | **`width: 120` hardcoded** | **BROKEN** |
| Cycle Length | `<SettingInput>` | `settingStyles.input` — **no width override** | OK |
| Period Length | `<SettingInput>` | `settingStyles.input` — **no width override** | OK |

The `SettingInput` component (lines 525-545) uses `settingStyles.input` without any `width` override and works correctly. The Display Name input is the only TextInput with a hardcoded width.

## Parent Layout Context

The Display Name row structure:

```
rowStyles.row (flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center')
├── Text "Display name" (label, left side)
└── View (flexDirection: 'row', alignItems: 'center', gap: 8)
    ├── TextInput (width: 120, padding: 6)  ← THE PROBLEM
    └── TouchableOpacity > Feather "check" icon (18px)
```

The parent `rowStyles.row` uses `justifyContent: 'space-between'`, which means the right-side container gets all remaining space after the label. However, the TextInput ignores this available space because it has a hardcoded `width: 120`. The card's inner width (screen width minus `Spacing.lg * 2` horizontal padding minus `Spacing.md * 2` card padding) is approximately **311 px** on an iPhone 17 Pro (393 pt screen). After the label "Display name" (~105 px) and space-between gap, the right side has roughly **180-200 px** available — more than enough if the input were allowed to flex.

## Fix Approaches

### Approach A: Replace `width: 120` with `flex: 1`

```tsx
<TextInput
  style={[settingStyles.input, { flex: 1, padding: 6, textAlign: 'right' }]}
  ...
/>
```

**Pros:**
- Input expands to fill all available space in the row
- Works for any locale (EN, VI, or longer translations)
- Consistent with how other settings rows handle content sizing
- Check button remains visible (it has intrinsic size, flex: 1 leaves room for siblings)

**Cons:**
- Input visually wider than the current 120px — may look different from the compact style originally intended
- Tappable area is larger (minor, actually could be a UX improvement)

**Tradeoffs:** Minimal. The wider input improves usability and matches the visual weight of adjacent rows.

### Approach B: Replace `width: 120` with `minWidth: 120, maxWidth: 200, flex: 1`

```tsx
<TextInput
  style={[settingStyles.input, { flex: 1, minWidth: 120, maxWidth: 200, padding: 6, textAlign: 'right' }]}
  ...
/>
```

**Pros:**
- Guarantees a minimum width even in constrained layouts
- Caps maximum width to prevent the input from dominating the row
- Still flexible enough for both EN and VI placeholders

**Cons:**
- Extra constraints add complexity for marginal visual benefit
- `maxWidth: 200` is another magic number that could break on different screen sizes or longer translations

**Tradeoffs:** More defensive but introduces new magic numbers. Overkill for a row that already has `space-between` layout handling the distribution.

### Approach C: Keep fixed width but increase to 180

```tsx
<TextInput
  style={[settingStyles.input, { width: 180, padding: 6, textAlign: 'right' }]}
  ...
/>
```

**Pros:**
- Minimal change, predictable layout
- 180 - 12 (padding) = 168 px content width — enough for both EN (~135 px) and VI (~145 px)

**Cons:**
- Still a magic number — will break again if translations get longer or font size changes
- Does not adapt to different screen widths (iPhone SE vs Pro Max)
- Fragile: any Typography.body fontSize change breaks it again

**Tradeoffs:** Quick fix but brittle. Does not solve the underlying design problem of a fixed-width input in a flex row.

## Recommendation

**Approach A (`flex: 1` + `textAlign: 'right'`)** is the best fix.

Rationale:
1. It eliminates the root cause (hardcoded width) rather than working around it.
2. It is consistent with how `SettingInput` and all other rows handle sizing — no special cases.
3. It works for all screen sizes and all locales without magic numbers.
4. Adding `textAlign: 'right'` ensures the input text right-aligns like the `rowStyles.value` text in adjacent rows (Email, Language, Role), maintaining visual consistency.
5. The check button icon has intrinsic width (~18 px + touchable padding), and the `gap: 8` in the parent View ensures it remains visible.

### Recommended change

In `app/app/(tabs)/settings.tsx`, line 157, replace:

```tsx
style={[settingStyles.input, { width: 120, padding: 6 }]}
```

with:

```tsx
style={[settingStyles.input, { flex: 1, padding: 6, textAlign: 'right' }]}
```

No other files need to change. Both EN and VI placeholders will render correctly. The check button remains visible and accessible.
