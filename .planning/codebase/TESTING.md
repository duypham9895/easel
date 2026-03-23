# Testing Patterns

**Analysis Date:** 2026-03-22

## Test Framework

**Runner:**
- Jest 30.3.0
- Config: `app/jest.config.js`
- TypeScript support via ts-jest 29.4.6

**Assertion Library:**
- Jest built-in matchers (`expect`, `toBe`, `toEqual`, etc.)
- No external assertion library

**Run Commands:**
```bash
npm test                   # Run all tests in __tests__ directories
npm test -- --watch       # Watch mode (auto-rerun on file change)
npm test -- --coverage    # Generate coverage report
```

## Test File Organization

**Location:**
- Co-located in `__tests__` subdirectories (NOT separate from source)
- Pattern: `[source-dir]/__tests__/[feature].test.ts`
- Examples:
  - `app/utils/__tests__/cycleCalculator.test.ts`
  - `app/hooks/__tests__/useHealthSync.test.ts`
  - `app/lib/db/__tests__/cycle.test.ts`
  - `app/__tests__/appStore.test.ts` (at root level for store)
  - `app/__tests__/e2e/periodCalendar.e2e.test.ts` (E2E scenarios)

**Naming:**
- Test files: `[feature].test.ts` or `[feature].test.tsx`
- E2E tests: `[scenario].e2e.test.ts`
- Mirror source structure for easy discovery

**Test File Counts:**
- 13 test files total in codebase (verified via `find`)
- Unit tests dominate (utilities, hooks, DB)
- E2E tests: 2 files (integration scenarios)
- Store tests: 2 files (integration with actions)

## Test Structure

**Suite Organization:**
```typescript
/**
 * [Feature] — [Brief description]
 *
 * Tests:
 *  1. [Scenario 1]
 *  2. [Scenario 2]
 *  3. [Scenario 3]
 */

// ---------------------------------------------------------------------------
// Mocks — must be defined before imports
// ---------------------------------------------------------------------------
jest.mock('@/lib/db/cycle', () => ({ ... }));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import { useAppStore } from '@/store/appStore';

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------
function seedStore(overrides: Record<string, unknown>) { ... }

// ---------------------------------------------------------------------------
// Test Suites
// ---------------------------------------------------------------------------
describe('Feature name', () => {
  it('does something specific', () => {
    expect(...).toBe(...);
  });
});
```

**Patterns:**
- All mocks defined at top (before imports)
- Organized sections: Mocks → Imports → Helpers → Tests
- Helper functions for common setup (e.g., `seedStore`, `makeLog`)
- Descriptive test names: `it('does X when Y happens')` not `it('works')`

**Example from `cycleCalculator.test.ts`:**
```typescript
describe('getConceptionChance', () => {
  it('returns Low for menstrual', () => {
    expect(getConceptionChance('menstrual')).toBe('Low');
  });

  it('returns Very High for ovulatory', () => {
    expect(getConceptionChance('ovulatory')).toBe('Very High');
  });
});

describe('getCurrentDayInCycle', () => {
  function toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  it('returns 1 when lastPeriodStartDate is today', () => {
    const today = toDateString(new Date());
    expect(getCurrentDayInCycle(today, 28)).toBe(1);
  });
});
```

**Patterns:**
- One `describe()` per function/feature
- Nested `describe()` for related test groups
- Local helper functions inside describe blocks for test-specific utilities
- No test-specific helper file needed; keep helpers inline

## Mocking

**Framework:** Jest built-in (`jest.mock()`)

**Patterns:**
- Mocks defined at module level before imports
- All module-level mocks use `jest.mock(path, factory)`
- Virtual mocks for React Native (not in node_modules): `{ virtual: true }`
- Example from `useHealthSync.test.ts`:
  ```typescript
  jest.mock('react-native-health', () => ({
    default: {
      Constants: { Permissions: { MenstrualFlow: 'MenstrualFlow' } },
      initHealthKit: jest.fn(),
      getMenstrualFlowSamples: jest.fn(),
    },
  }), { virtual: true });
  ```

- Mock function setup:
  ```typescript
  const mockLogPeriodStart = jest.fn().mockResolvedValue(undefined);
  const mockFetchPeriodLogs = jest.fn().mockResolvedValue([]);

  jest.mock('@/lib/db/cycle', () => ({
    logPeriodStart: mockLogPeriodStart,
    fetchPeriodLogs: mockFetchPeriodLogs,
  }));
  ```

- Reset mocks before each test:
  ```typescript
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });
  ```

**What to Mock:**
- External modules (Supabase, React Native, i18next)
- DB layer functions (`@/lib/db/*`)
- Zustand store (when testing hooks in isolation)
- Platform-specific modules (react-native, platform detection)
- Async operations (HTTP, storage, Auth)

**What NOT to Mock:**
- Pure utility functions (e.g., `cycleCalculator.ts` functions)
- Components under test (test them directly)
- TypeScript types and interfaces
- File I/O in unit tests (use integration tests instead)

**Setup/Teardown:**
- `beforeEach()` for common setup per test
- `beforeAll()` for one-time setup (avoid if possible)
- Reset mocks before each test to avoid state leakage

## Fixtures and Factories

**Test Data:**
- Inline in test files (no separate fixtures directory)
- Factory helper functions for reusable test data
- Example from `useHealthSync.test.ts`:
  ```typescript
  function makeLog(startDate: string, endDate?: string): PeriodRecord {
    return endDate ? { startDate, endDate } : { startDate };
  }

  it('returns true when exact date match exists', () => {
    const existing = [makeLog('2024-01-15')];
    expect(isDuplicate(existing, '2024-01-15')).toBe(true);
  });
  ```

- Factory from `appStore.test.ts`:
  ```typescript
  function seedStore(overrides: Record<string, unknown>) {
    useAppStore.setState({
      userId: 'test-user-id',
      coupleId: 'test-couple-id',
      cycleSettings: {
        avgCycleLength: 28,
        avgPeriodLength: 5,
        lastPeriodStartDate: '2026-02-01',
      },
      ...overrides,
    });
  }
  ```

- Factory from E2E tests:
  ```typescript
  function generatePeriodLogs(
    count: number,
    cycleLengthDays: number,
    baseDate: string,
    options?: { periodLength?: number; taggedIndices?: Map<number, string[]> }
  ): PeriodRecord[] {
    const logs: PeriodRecord[] = [];
    for (let i = 0; i < count; i++) {
      const startDate = addDays(baseDate, -(i * cycleLengthDays));
      logs.push({ startDate, ... });
    }
    return logs;
  }
  ```

**Location:**
- Inline in test files (no external fixtures)
- Helper functions above test suites
- Date/number generation helpers at module level

## Coverage

**Requirements:** Not enforced (no `--coverage` target in package.json)

**Coverage Observed:**
- Core utilities: high coverage (cycleCalculator, useHealthSync)
- Store actions: medium coverage (appStore has comprehensive tests)
- E2E scenarios: partial coverage (2 files for integration scenarios)
- Components: minimal coverage (no component snapshot tests found)

**View Coverage:**
```bash
npm test -- --coverage      # Generate coverage report (not configured as output)
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities
- Examples: `cycleCalculator.test.ts`, `useHealthSync.test.ts`
- Approach: Mock external dependencies, test pure logic
- Common pattern:
  ```typescript
  describe('functionName', () => {
    it('returns X when Y', () => {
      expect(functionName(input)).toBe(expected);
    });
  });
  ```

**Integration Tests:**
- Scope: Store actions + DB layer interactions
- Examples: `appStore.test.ts`, `appStore.periodLogs.test.ts`
- Approach: Mock DB functions, verify store state changes correctly
- Common pattern:
  ```typescript
  it('should update periodLogs state', async () => {
    mockFetchPeriodLogs.mockResolvedValue(logs);
    await useAppStore.getState().loadPeriodLogs();
    expect(useAppStore.getState().periodLogs).toEqual(logs);
  });
  ```

**E2E Tests:**
- Framework: Jest (not Detox or Maestro)
- Scope: End-to-end user flows and data propagation
- Examples: `periodCalendar.e2e.test.ts`, `dataIntegrity.e2e.test.ts`
- Approach: No mocks; test full calculations + state together
- Common pattern from `periodCalendar.e2e.test.ts`:
  ```typescript
  describe('Scenario 1: Moon logs period, Sun sees update', () => {
    it('should update cycleStats when Moon has 3+ months of data', () => {
      const logs = generatePeriodLogs(4, 28, baseDate);
      const stats = computeCycleStats(logs);
      expect(stats.avgCycleLength).toBe(28);
      expect(stats.confidence).toBe('medium');
    });
  });
  ```

## Common Patterns

**Async Testing:**
```typescript
it('fetches and sets period logs', async () => {
  const logs = [{ startDate: '2026-03-01' }];
  mockFetchPeriodLogs.mockResolvedValue(logs);

  // Call async function without await — test the immediate state
  // OR await for full completion
  await useAppStore.getState().loadPeriodLogs();

  expect(mockFetchPeriodLogs).toHaveBeenCalledWith('test-user-id');
  expect(useAppStore.getState().periodLogs).toEqual(logs);
});
```

**Error Testing:**
```typescript
it('throws when error occurs', async () => {
  mockFetchPeriodLogs.mockRejectedValue(new Error('DB error'));

  await expect(useAppStore.getState().loadPeriodLogs()).rejects.toThrow('DB error');
});

// OR for non-throwing errors:
it('handles null gracefully', () => {
  const result = getCycleSettings(null); // function handles null
  expect(result).toBe(null);
});
```

**Mocking Hook State:**
```typescript
// From useHealthSync.test.ts
jest.mock('@/store/appStore', () => ({
  useAppStore: jest.fn(),
}));

it('calls addPeriodLog with synced records', async () => {
  const mockAddLog = jest.fn();
  (useAppStore as jest.Mock).mockReturnValue({
    periodLogs: [],
    addPeriodLog: mockAddLog,
  });

  // Test code that calls the hook
  expect(mockAddLog).toHaveBeenCalledWith('2024-01-15');
});
```

**Store State Manipulation:**
```typescript
beforeEach(() => {
  useAppStore.setState({
    userId: 'test-user-id',
    periodLogs: [],
    cycleSettings: { avgCycleLength: 28, avgPeriodLength: 5, lastPeriodStartDate: '2026-02-01' },
  });
});

it('updates state correctly', () => {
  const state = useAppStore.getState();
  expect(state.periodLogs).toEqual([]);

  state.addPeriodLog('2026-03-01');

  expect(useAppStore.getState().periodLogs).toContainEqual(
    expect.objectContaining({ startDate: '2026-03-01' })
  );
});
```

## Gotchas & Anti-Patterns

**Mocks Must Come First:**
- All `jest.mock()` calls must precede imports
- If you forget, TypeScript will not see mocked modules correctly
- Pattern from `appStore.test.ts`:
  ```typescript
  // ✓ CORRECT: Mocks at top
  jest.mock('@/lib/db/cycle', () => ({ ... }));
  import { useAppStore } from '@/store/appStore';

  // ✗ WRONG: Import before mock
  import { useAppStore } from '@/store/appStore';
  jest.mock('@/lib/db/cycle', () => ({ ... }));
  ```

**Don't Test Implementation Details:**
- Test behavior, not internal state
- Bad: `expect(store.internal._timer).toBe(123)`
- Good: `expect(store.getSOS()).toEqual(option)`

**Avoid Over-Mocking:**
- Pure utility functions should run real code (not mocked)
- `cycleCalculator.ts` tests run the actual calculations
- Only mock I/O boundaries (DB, API, Storage)

**State Isolation:**
- Use `jest.clearAllMocks()` before each test
- Use `seedStore()` to reset store state before each test
- Don't let one test's state affect another

**Async Pitfall:**
- Always `await` async operations in tests
- Use `mockResolvedValue()` for successful Promises
- Use `mockRejectedValue()` for failed Promises
- Test code that is async should use `async/await` or return a Promise

---

*Testing analysis: 2026-03-22*
