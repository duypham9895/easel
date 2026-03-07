# Whisper Success Feedback & Sun Push Notification Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show Moon a beautiful in-sheet success state after whispering, and fix the DB constraint bug so Sun actually receives push notifications.

**Architecture:** Three coordinated changes — (1) a DB migration drops the broken type CHECK constraint so whisper inserts succeed, (2) `WhisperSheet` gains an internal `sent` success state that replaces the grid with an animated confirmation view, (3) the `notify-sos` edge function gets whisper-aware copy so the push notification body is meaningful.

**Tech Stack:** React Native, Expo, Animated API, Supabase Edge Functions (Deno), PostgreSQL migrations.

---

### Task 1: Fix the DB CHECK constraint blocking whisper inserts

**Context:** `sos_signals.type` in migration 001 has `CHECK (type IN ('sweet_tooth','need_a_hug','cramps_alert','quiet_time'))`. Whisper IDs like `hug`, `warmth`, `plan`, etc. are rejected. Every whisper silently fails at the DB level.

**Files:**
- Create: `app/supabase/migrations/004_relax_sos_type_constraint.sql`

**Step 1: Create the migration file**

```sql
-- 004_relax_sos_type_constraint.sql
-- Drop the restrictive CHECK constraint on sos_signals.type so
-- whisper option IDs (hug, warmth, plan, etc.) can be stored.
ALTER TABLE public.sos_signals
  DROP CONSTRAINT IF EXISTS sos_signals_type_check;
```

**Step 2: Apply migration via Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration.
Or via CLI: `cd app && npx supabase db push` (if remote is configured).

Expected: No error. Query `\d sos_signals` should show no check constraint on `type`.

**Step 3: Verify whisper insert works**

In Supabase SQL Editor:
```sql
INSERT INTO public.sos_signals (couple_id, sender_id, type, message)
VALUES ('test-couple-id', 'test-user-id', 'hug', 'Need a hug')
ON CONFLICT DO NOTHING;
-- Should succeed without constraint violation
```

Delete the test row after verification.

**Step 4: Commit**

```bash
git add app/supabase/migrations/004_relax_sos_type_constraint.sql
git commit -m "fix: drop sos_signals type CHECK constraint to allow whisper IDs"
```

---

### Task 2: Add whisper-aware copy to the notify-sos edge function

**Context:** `notify-sos/index.ts` has `SOS_COPY` only for the 4 old SOS types. It falls back to `{ title: 'Moon needs you', body: signal.message }` for unknown types — `signal.message` is the option title (e.g., "Need a hug"). This is _OK_ but we can make it warmer and whisper-specific.

**Files:**
- Modify: `app/supabase/functions/notify-sos/index.ts`

**Step 1: Read the current file**

Read `app/supabase/functions/notify-sos/index.ts` to confirm current structure.

**Step 2: Add WHISPER_COPY map after SOS_COPY**

Find the closing `};` of `SOS_COPY` (around line 59) and add the whisper map right after:

```typescript
const WHISPER_COPY: Record<string, { title: string; body: string }> = {
  // Menstrual
  hug:       { title: 'Moon needs you', body: 'She needs a hug right now — just hold her close.' },
  warmth:    { title: 'Moon needs you', body: 'She wants something warm. Bring a blanket or a hot drink.' },
  chocolate: { title: 'Moon needs you', body: "Sweet tooth alert — she's craving something sweet." },
  quiet:     { title: 'Moon needs you', body: 'She needs peace and quiet. Tread softly.' },
  // Follicular
  plan:      { title: 'Moon is ready', body: "She's up for an adventure — surprise her with something fun." },
  cook:      { title: 'Moon wants you', body: "She'd love to cook together tonight." },
  walk:      { title: 'Moon wants you', body: "She's in the mood for a walk. Let's go outside." },
  movie:     { title: 'Moon wants you', body: "Movie night — she wants to watch something together." },
  // Ovulatory
  date:      { title: 'Moon is glowing', body: "Take her somewhere nice — she's ready for a date." },
  compliment:{ title: 'Moon needs to hear it', body: "Say something kind. She needs to hear it from you." },
  dance:     { title: 'Moon wants to dance', body: "Put on a song and dance with her." },
  kiss:      { title: 'Moon wants a kiss', body: "She just wants a kiss." },
  // Luteal
  snacks:    { title: 'Moon has a craving', body: "Bring her favourite snacks — she'll love you for it." },
  space:     { title: 'Moon needs space', body: "Give her a little room today. Check in gently." },
  cuddle:    { title: 'Moon needs you', body: "Come cuddle. That's all she needs." },
  kind:      { title: 'Moon needs kind words', body: "Say something kind. Small words, big impact." },
};
```

**Step 3: Update the copy lookup logic**

Replace the existing `const copy = SOS_COPY[signal.type] ?? { ... }` line (around line 97) with:

```typescript
const copy =
  SOS_COPY[signal.type] ??
  WHISPER_COPY[signal.type] ?? {
    title: 'Moon whispered to you',
    body: signal.message ?? 'She sent you a whisper.',
  };
```

**Step 4: Deploy the updated edge function**

```bash
cd app
npx supabase functions deploy notify-sos --no-verify-jwt
```

Expected output: `Deployed notify-sos successfully.`

**Step 5: Commit**

```bash
git add app/supabase/functions/notify-sos/index.ts
git commit -m "feat: add whisper-specific push notification copy to notify-sos"
```

---

### Task 3: Add in-sheet success state to WhisperSheet

**Context:** `WhisperSheet.tsx` closes instantly after `handleSend()` — Moon sees no confirmation. We add a `sent` boolean state. When true, swap the option grid for a celebration view: a pulsing check circle + "Whispered to Sun" + the option title. Auto-dismiss after 2.5 s.

**Files:**
- Modify: `app/components/moon/WhisperSheet.tsx`

**Step 1: Add `sent` state and `sentOption` ref**

In the component, after the existing `customInput` state, add:

```typescript
const [sent, setSent] = useState(false);
const [sentOption, setSentOption] = useState<SOSOption | null>(null);
const pulseAnim = useRef(new Animated.Value(1)).current;
const checkOpacity = useRef(new Animated.Value(0)).current;
```

**Step 2: Add pulse animation helper**

Add this function inside the component, after `handleSendCustom`:

```typescript
function animateSentState() {
  // Fade in the check
  Animated.timing(checkOpacity, {
    toValue: 1,
    duration: 350,
    useNativeDriver: true,
  }).start();
  // Gentle repeating pulse on the circle
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ])
  ).start();
}
```

**Step 3: Update `handleSend` to show success state instead of closing**

Replace the existing `handleSend` function:

```typescript
function handleSend(option: SOSOption) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setSentOption(option);
  setSent(true);
  animateSentState();
  onSend(option);
  // Auto-dismiss after 2.5 s
  setTimeout(() => {
    handleClose();
  }, 2500);
}
```

**Step 4: Add `handleClose` that resets state**

Replace direct `onClose()` calls with a clean reset function:

```typescript
function handleClose() {
  setSent(false);
  setSentOption(null);
  setCustomInput('');
  pulseAnim.setValue(1);
  checkOpacity.setValue(0);
  onClose();
}
```

Update `handleSendCustom` to use `handleClose` is not needed — `handleSend` calls it already. Update the cancel button and backdrop `onPress` to call `handleClose()` instead of `onClose()`.

**Step 5: Add the success view to the JSX**

Inside `<Pressable>` (after the handle bar), add a conditional that renders either the success view or the normal content:

```tsx
{sent && sentOption ? (
  // ── Success state ──────────────────────────────────────────────
  <View style={styles.successContainer}>
    {/* Pulsing circle */}
    <Animated.View
      style={[
        styles.successCircle,
        {
          backgroundColor: sentOption.color + '22',
          borderColor: sentOption.color + '55',
          transform: [{ scale: pulseAnim }],
          opacity: checkOpacity,
        },
      ]}
    >
      <Feather name="check" size={48} color={sentOption.color} />
    </Animated.View>

    {/* Sent label */}
    <Animated.View style={{ opacity: checkOpacity, alignItems: 'center', gap: 6 }}>
      <Text style={styles.successTitle}>Whispered to your Sun</Text>
      <View style={[styles.sentOptionChip, { backgroundColor: sentOption.color + '20' }]}>
        <Feather name={sentOption.icon as any} size={14} color={sentOption.color} />
        <Text style={[styles.sentOptionText, { color: sentOption.color }]}>
          {sentOption.title}
        </Text>
      </View>
      <Text style={styles.successHint}>He'll know what to do.</Text>
    </Animated.View>
  </View>
) : (
  // ── Normal content ─────────────────────────────────────────────
  <>
    {/* Header */}
    <View style={styles.header}>
      <Text style={styles.title}>What do you need?</Text>
      <Text style={styles.subtitle}>
        {isAI ? 'Personalized for your phase ✦ AI' : 'Whisper it to your Sun'}
      </Text>
    </View>

    {/* Options grid */}
    <View style={styles.grid}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={styles.optionCard}
          onPress={() => handleSend(option)}
          activeOpacity={0.85}
        >
          <View style={[styles.optionIconBg, { backgroundColor: option.color + '18' }]}>
            <Feather name={option.icon as any} size={28} color={option.color} />
          </View>
          <Text style={styles.optionTitle}>{option.title}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Custom input row */}
    <View style={styles.customRow}>
      <View style={styles.customInputContainer}>
        <TextInput
          style={styles.customInput}
          placeholder="Something else..."
          placeholderTextColor={MOON.textHint}
          value={customInput}
          onChangeText={setCustomInput}
          returnKeyType="send"
          onSubmitEditing={handleSendCustom}
        />
        {customInput.length > 0 && (
          <TouchableOpacity onPress={handleSendCustom} activeOpacity={0.75}>
            <Feather name="send" size={18} color={MOON.accentPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>

    {/* Cancel */}
    <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
      <Text style={styles.cancelText}>Maybe later</Text>
    </TouchableOpacity>
  </>
)}
```

**Step 6: Add success styles to StyleSheet**

Append these styles inside `StyleSheet.create({...})`:

```typescript
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
    minHeight: 280,
    justifyContent: 'center',
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: MOON.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sentOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sentOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  successHint: {
    ...Typography.body,
    color: MOON.textHint,
    textAlign: 'center',
  },
```

**Step 7: Reset `sent` state when modal closes (useEffect)**

Add a `useEffect` that resets state when `visible` goes `false`:

```typescript
useEffect(() => {
  if (!visible) {
    setSent(false);
    setSentOption(null);
    setCustomInput('');
    pulseAnim.setValue(1);
    checkOpacity.setValue(0);
  }
}, [visible]);
```

**Step 8: Manual test checklist**

1. Open the app as Moon
2. Tap "Whisper to your Sun"
3. Select any whisper option
4. Verify: sheet transforms to success view with pulsing circle, option chip, "He'll know what to do."
5. Verify: sheet auto-dismisses after ~2.5 seconds
6. Verify: tapping the backdrop during success view also dismisses cleanly
7. Open app as Sun — verify the WhisperAlert card appears in dashboard
8. Check Expo push notification arrives on Sun's device

**Step 9: Commit**

```bash
git add app/components/moon/WhisperSheet.tsx
git commit -m "feat: add in-sheet whisper success state with pulse animation"
```

---

### Task 4: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add entry to [Unreleased] section**

```markdown
### Added
- WhisperSheet: beautiful in-sheet success confirmation state after sending a whisper (pulsing circle, option chip, "Whispered to your Sun", auto-dismiss after 2.5s)
- notify-sos edge function: whisper-specific push notification copy for all 16 whisper types

### Fixed
- DB migration 004: dropped CHECK constraint on sos_signals.type that was silently blocking all whisper inserts and preventing Sun from receiving push notifications
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for whisper success UI and notification fix"
```
