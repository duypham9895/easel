# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- Screen files (Expo Router): kebab-case (e.g., `app/health-sync.tsx`, `app/reset-password.tsx`)
- Component files: PascalCase (e.g., `components/gf/DailyCheckIn.tsx`, `components/moon/WhisperSheet.tsx`)
- Hook files: camelCase with `use` prefix (e.g., `hooks/useAIGreeting.ts`, `hooks/useHealthSync.ts`)
- DB function files: camelCase, domain-grouped (e.g., `lib/db/cycle.ts`, `lib/db/sos.ts`)
- Type definition files: `index.ts` at top level (e.g., `types/index.ts`)
- Test files: `__tests__` subdirectories with `.test.ts` or `.test.tsx` suffix (e.g., `utils/__tests__/cycleCalculator.test.ts`)

**Functions:**
- Async functions returning Promises: descriptive names with full action (e.g., `logPeriodStart`, `fetchPeriodLogs`, `deleteperiodLog`)
- Pure utility functions: verb-first pattern (e.g., `getCurrentDayInCycle`, `getConceptionChance`, `buildCalendarMarkers`)
- Hooks: `use` prefix (e.g., `useAIGreeting`, `useHealthSync`, `useAIPartnerAdvice`)
- React components: PascalCase (e.g., `DailyCheckIn`, `PhaseWheel`, `SOSSheet`)
- Zustand actions: imperative verbs (e.g., `setRole`, `addPeriodLog`, `removePeriodLog`, `sendSOS`)

**Variables:**
- State variables: camelCase (e.g., `cycleSettings`, `periodLogs`, `predictionWindow`, `activeSOS`)
- Constants in components: UPPER_SNAKE_CASE (e.g., `MOOD_OPTIONS`, `SYMPTOM_OPTIONS`, `GREETING_KEYS`)
- Transient state (UI-only): lowercase with `is`/`has` prefix (e.g., `isLoading`, `hasError`, `isSaving`)
- Temporary loop vars: single letters (e.g., `i`, `j`) or meaningful names (e.g., `index`, `count`)

**Types:**
- Database types from Supabase: `Db` prefix (e.g., `DbCycleSettings`, `DbProfile`, `DbPeriodLog`)
- App-level types: no prefix, domain names (e.g., `CycleSettings`, `PeriodRecord`, `SOSOption`)
- Type files: export interfaces at module level
- Enum-like types: union types using `type`, not `enum` (e.g., `type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'`)
- Interfaces for props: suffix `Props` (e.g., `interface DailyCheckInProps`)

**Constants:**
- Phase names: all lowercase (e.g., `menstrual`, `follicular`, `ovulatory`, `luteal`)
- SOS types: identifier strings (e.g., `'sweet_tooth'`, `'need_a_hug'`, `'cramps_alert'`, `'quiet_time'`)
- Design tokens in `constants/theme.ts`: UPPER_SNAKE_CASE (e.g., `MoonColors`, `SunColors`, `Spacing`, `Typography`, `Radii`)
- Translation keys: camelCase, domain-prefixed in i18n files (e.g., `greetingMenstrual1`, `moodLow`, `daysLeft`)
- API endpoints: kebab-case in URLs (e.g., `/api/greeting`, `/api/partner-advice`, `/api/sos-tip`)

## Code Style

**Formatting:**
- No ESLint or Prettier config found in root — follows TypeScript strict mode defaults
- Indentation: 2 spaces (observed in all files)
- Line length: not enforced, but generally kept under 100 characters
- Semicolons: required (TypeScript strict mode)
- Quotes: single quotes for strings in TypeScript, double quotes in JSON

**Linting:**
- TypeScript strict mode enabled in `app/tsconfig.json` (`"strict": true`)
- `proxy/` also runs TypeScript strict mode
- No ESLint config at project root — ESLint rules are not centrally enforced
- Implicit `any` types not allowed (part of strict mode)

**Styling (React Native):**
- `StyleSheet.create()` always at bottom of component files
- Styles object follows component code
- Design tokens centralized in `constants/theme.ts` (not in components)
- Example pattern from `PhaseWheel.tsx`:
  ```tsx
  export function PhaseWheel({ phase, dayInCycle, ... }: Props) {
    // Component code...
    return <View style={styles.container}>...</View>;
  }

  const styles = StyleSheet.create({
    container: { ... },
    outerRing: { ... },
  });
  ```
- Inline styles rare; use `StyleSheet.create()` + style arrays for conditional styling
- Example conditional styling from `PhaseWheel.tsx`:
  ```tsx
  <View style={[
    styles.outerRing,
    { backgroundColor: phaseInfo.color },
    outerRingStyle, // Animated style
  ]}
  ```

## Import Organization

**Order:**
1. React/React Native core imports
2. Third-party libraries (Supabase, Zustand, i18next, etc.)
3. Local app imports (absolute paths using `@/`)
4. Relative imports (`.ts`, `.tsx` files from local dirs)

**Example from `DailyCheckIn.tsx`:**
```typescript
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MoonColors, SharedColors, Spacing, Radii, Typography } from '@/constants/theme';
import { CyclePhase } from '@/types';
import { useAIDailyInsight } from '@/hooks/useAIDailyInsight';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/lib/supabase';
```

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Always use `@/` imports (e.g., `@/hooks/useHealthSync`, `@/store/appStore`, `@/constants/theme`)
- Never use relative imports like `../../../ when `@/` is available

## Error Handling

**Patterns:**
- All async functions explicitly throw errors on failure (no silent failures)
- Store actions (`appStore.ts`) wrap DB calls in try-catch and provide user-facing error state
- DB layer functions (`lib/db/*.ts`) throw errors; callers handle them
- HTTP errors from Supabase: check `error` field; throw if present
- Example from `cycle.ts`:
  ```typescript
  const { data, error } = await supabase.from('cycle_settings').select(...);
  if (error) {
    if (error.code === 'PGRST116') return null; // Expected case
    throw error; // Unexpected error — propagate
  }
  ```

**UI Error Handling:**
- Components show loading state while async work completes
- Errors captured in component state (e.g., `saveError`, `hasError`)
- Users see human-readable error messages, never raw API errors
- Example from `DailyCheckIn.tsx`:
  ```typescript
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // On error, show message to user
  ```

**AI Fallback Pattern:**
- Static fallback content shown immediately
- AI request fires in background with `AbortController`
- If AI succeeds: replace fallback with AI response, set `isAI: true`
- If AI fails: silently keep fallback, log warning
- If component unmounts: `AbortError` silently ignored
- Example from `useAIGreeting.ts`:
  ```typescript
  const [greeting, setGreeting] = useState(fallback); // Show immediately
  const [isAI, setIsAI] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const data = await fetch(proxyUrl, { signal: controller.signal });
        setGreeting(data.greeting);
        setIsAI(true);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('[useAIGreeting] falling back to static greeting:', err);
      }
    })();
    return () => controller.abort();
  }, [phase, dayInCycle]);
  ```

**Proxy Error Handling:**
- 5-layer validation: method check → auth → rate limit → input validation → API call
- All errors caught at endpoint handler level
- User sees generic message (e.g., `"AI service unavailable"`)
- Detailed errors logged server-side with endpoint name prefix
- Example from `proxy/api/greeting.ts`:
  ```typescript
  try {
    const greeting = await generateGreeting(...);
    return res.status(200).json({ greeting });
  } catch (err) {
    console.error('[greeting] MiniMax error:', err);
    return res.status(502).json({ error: 'AI service unavailable' });
  }
  ```

## Logging

**Framework:** `console` (no centralized logger)

**Patterns:**
- `console.warn()` for expected errors with fallbacks (e.g., AI request failures)
- `console.error()` for unexpected errors or server-side issues
- Log format: `[module-or-endpoint-name] message:` prefix for server logs
- Example from proxy:
  ```typescript
  console.error('[greeting] MiniMax error:', err);
  console.error('[whisper-options] failed to parse response:', err);
  ```
- App logs rarely; mostly relies on Sentry or error states in UI
- No structured logging (JSON objects); use readable string messages

## Comments

**When to Comment:**
- JSDoc on exported functions and hooks (especially complex ones)
- Inline comments for "why", not "what" (code is clear, logic may not be)
- Comments on non-obvious algorithms or business logic
- Section markers for large blocks (e.g., `// — Layer 1: Method guard`)
- TODO/FIXME rarely used (no pattern found in codebase)

**JSDoc/TSDoc:**
- Function signatures documented with `/**...*/ before export
- `@param` tags for all parameters
- `@returns` tag for return type description
- `@example` optional for complex functions
- Example from `proxy/lib/minimax.ts`:
  ```typescript
  /**
   * Generate a warm, empathetic greeting from MiniMax M25 for the Easel app.
   *
   * @param phase      - Current cycle phase (menstrual | follicular | ovulatory | luteal)
   * @param dayInCycle - Day number within the current cycle
   * @param phaseTagline - Short tagline for the phase (e.g. "Rest & Restore")
   * @param language   - Language code (default: 'en')
   */
  export async function generateGreeting(
    phase: string,
    dayInCycle: number,
    phaseTagline: string,
    language = 'en'
  ): Promise<string>
  ```

## Function Design

**Size:**
- Target: under 50 lines per function (strict guideline from coding-style.md)
- Large functions broken into smaller helpers
- Store actions often 30-50 lines (include state mutations + DB calls)
- Hooks often 20-40 lines (setup + effect)

**Parameters:**
- Destructured when possible (e.g., `{ phase, dayInCycle }` from props)
- Optional parameters marked with `?` (e.g., `endDate?: string`)
- DB functions always include `userId` as first parameter
- Hooks receive minimal props (data + optional callbacks)

**Return Values:**
- Async functions return Promises, never callbacks
- Hooks return objects with named fields (e.g., `{ greeting, isAI, isLoading }`)
- Data access functions return typed domain objects (e.g., `CycleSettings`, `PeriodRecord`)
- UI components return JSX.Element or null (never untyped)

## Module Design

**Exports:**
- Each module exports one primary thing (function, component, or hook)
- Types co-exported with functions (e.g., `DbCycleSettings` interface + functions in `cycle.ts`)
- Barrel files: `index.ts` at `types/` re-exports all type definitions
- No default exports (all named exports)

**Barrel Files:**
- `types/index.ts` — all TypeScript types and interfaces
- No barrel files in `components/`, `hooks/`, or `lib/db/` — import directly
- Reason: enables tree-shaking and avoids circular imports

**File Size:**
- Most components: 50-150 lines
- Hooks: 20-100 lines
- Store (`appStore.ts`): 428 lines (largest module, single responsibility)
- DB functions: 10-50 lines each
- Utilities: 10-100 lines

**Immutability:**
- Zustand store only place that mutates state
- All updates use `setState({ ...state, field: newValue })` pattern
- DB functions return new data; callers update store
- Components never mutate props or parent state directly
- Example from `appStore.ts`:
  ```typescript
  // Instead of: periodLogs.push(entry)
  const entry: PeriodRecord = { ... };
  const updated = [entry, ...periodLogs.filter((l) => l.startDate !== startDate)];
  useAppStore.setState({ periodLogs: updated });
  ```

---

*Convention analysis: 2026-03-22*
