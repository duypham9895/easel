# BUG_20260308_002 — Root Cause Analysis

## Bug Summary

The `notify-cycle` Supabase Edge Function returns HTTP 404 when invoked by the daily cron workflow (`.github/workflows/notify-cycle.yml`). The function was never deployed to Supabase because the deployment condition in `.github/workflows/supabase.yml` is effectively dead for normal pushes.

## Root Cause

### The Deploy Condition Is Always False

The `deploy-functions` job in `.github/workflows/supabase.yml` (line 57-60) has this condition:

```yaml
if: |
  github.event_name == 'workflow_dispatch' ||
  contains(toJson(github.event.commits.*.modified), 'app/supabase/functions/') ||
  contains(toJson(github.event.commits.*.added), 'app/supabase/functions/')
```

This condition only evaluates to `true` in two scenarios:

1. **Manual workflow dispatch** — someone clicks "Run workflow" in the GitHub Actions tab.
2. **A push where the commit metadata includes files under `app/supabase/functions/`** — but this has a critical flaw.

**Why the condition is dead for normal pushes:**

The `on.push` trigger fires on every push to `main`, but `github.event.commits` only contains the commits in that specific push event. For the condition to fire, someone would need to push a commit that modifies or adds files under `app/supabase/functions/`. The edge functions were last modified in commit `2eb1eea` (comprehensive improvements), but since that commit also touched many other files, and the `contains()` check uses string matching on the JSON-serialized commit metadata — it depends on GitHub including the full file lists in the webhook payload.

**The deeper problem:** Even if the condition worked perfectly, it would only deploy functions when function source code changes. This means:

- Initial deployment after setting up the repo requires a manual `workflow_dispatch`.
- If the function deployment fails silently (e.g., auth error, CLI version issue), there's no retry mechanism.
- No periodic re-deployment to ensure functions stay deployed after Supabase project resets or migrations.

### Timeline of the Bug

| Event | Commit | Result |
|-------|--------|--------|
| Edge functions first added | `8ac72e3` (Moon/Sun redesign) | Functions added to source tree |
| Functions last modified | `2eb1eea` (comprehensive improvements) | Source updated, but deploy condition likely never triggered |
| Supabase workflow last modified | `de33fa9` (model name fix) | Removed IPv4 workaround, did not fix deploy condition |
| Daily cron runs every day | N/A | `notify-cycle.yml` calls the function → 404 every day |

### Git History of Edge Functions

```
2eb1eea feat: comprehensive app improvements, documentation, and security hardening
8ededfd feat(security): comprehensive security hardening for App Store publishing (v1.5.0)
66ab05e feat: whisper success UI, DB constraint fix, and push notification copy
8ac72e3 feat: Moon/Sun redesign with Whisper, HealthSync, AI cycle prediction, and push notifications
```

None of these commits are function-only changes. They are large multi-file commits, which means the deploy condition may not have matched even when function files were included — the `contains()` check on serialized JSON is fragile and depends on GitHub's payload truncation behavior for large pushes.

## Affected Functions

| Function | Trigger | Impact |
|----------|---------|--------|
| `notify-cycle` | Daily cron via `.github/workflows/notify-cycle.yml` | **Broken** — 404 every day. No Moon or Sun users receive cycle notifications (period approaching, started, ended). |
| `notify-sos` | Supabase Database Webhook on `sos_signals` INSERT | **Broken** — the webhook calls the function URL, which also 404s. SOS and Whisper push notifications never reach Sun. |

Both functions are valid Deno Edge Functions with correct source code. The issue is purely deployment — the code exists in the repo but was never deployed to Supabase.

## Function Validation

### `notify-cycle` (217 lines)
- Valid Deno Edge Function using `Deno.serve()`
- Imports `@supabase/supabase-js@2` via `jsr:` (correct for Deno)
- Properly authenticates via `Authorization: Bearer` header against `SUPABASE_SERVICE_ROLE_KEY`
- Queries `profiles`, `couples`, `push_tokens` tables with batch lookups (no N+1)
- Sends push notifications via Expo Push API
- Returns proper JSON responses with status codes

### `notify-sos` (175 lines)
- Valid Deno Edge Function using `Deno.serve()`
- Same import and auth pattern as `notify-cycle`
- Handles both SOS signals and Whisper signals with dedicated copy maps
- Triggered by Database Webhook on `sos_signals` INSERT

Both functions are production-ready. The only issue is they were never deployed.

## Proposed Fix Approaches

### Approach A: Remove the `if` Condition Entirely

**Change:** Remove the `if` block from the `deploy-functions` job so it runs on every push to `main`.

```yaml
deploy-functions:
  name: Edge Functions
  runs-on: ubuntu-latest
  # No 'if' condition — deploy on every push
```

**Pros:**
- Simplest fix — one line removed
- Guarantees functions are always deployed
- `supabase functions deploy` is idempotent — deploying unchanged functions is a no-op (fast, safe)
- Eliminates the fragile `contains(toJson(...))` pattern entirely

**Cons:**
- Adds ~30-60 seconds to every CI run (Supabase CLI setup + deploy)
- Every push to `main` triggers a deploy even for docs-only or UI-only changes
- Minor increase in GitHub Actions minutes usage

### Approach B: Add `paths` Filter to the `on.push` Trigger

**Change:** Add a `paths` filter at the workflow trigger level so the entire workflow only runs when relevant files change, and remove the job-level `if` condition.

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'app/supabase/**'
  workflow_dispatch:
```

**Pros:**
- Git-native path filtering — reliable, well-documented, no fragile JSON parsing
- Only runs when Supabase files actually change
- Saves CI minutes on irrelevant pushes

**Cons:**
- **Breaks the `migrate` job** — migrations currently run on every push (idempotent). Adding a `paths` filter would prevent migrations from running on non-Supabase pushes. This would require splitting into two separate workflow files.
- More complex change — need to restructure workflows
- Still has the "initial deployment" problem if functions are added in a commit that doesn't match the path filter

### Approach C: Split Into Two Workflows + Scheduled Redeploy

**Change:** Split `supabase.yml` into two workflows:
1. `supabase-migrate.yml` — runs on every push (existing behavior for migrations)
2. `supabase-functions.yml` — runs on push with `paths: ['app/supabase/functions/**']` + daily schedule as safety net

```yaml
# supabase-functions.yml
on:
  push:
    branches: [main]
    paths: ['app/supabase/functions/**']
  schedule:
    - cron: '0 6 * * *'   # Daily redeploy as safety net (before notify-cycle at 8 AM)
  workflow_dispatch:
```

**Pros:**
- Each workflow has a single responsibility
- Path filtering works correctly because it's at the workflow level
- Daily schedule ensures functions are always deployed (self-healing)
- Migrations continue running on every push (no regression)

**Cons:**
- Two workflow files instead of one — more files to maintain
- Daily scheduled deploy is slightly wasteful (but idempotent and fast)
- More complex setup

## Recommendation

**Approach A (Remove the `if` condition)** is the recommended fix.

**Rationale:**

1. **Simplicity wins.** The `supabase functions deploy` command is idempotent and fast (~30s for 2 functions). The overhead of deploying on every push is negligible compared to the risk of functions never being deployed.

2. **The `migrate` job already runs on every push** with the same idempotent reasoning (see the workflow comment on line 4: "supabase db push is idempotent — it only applies migrations not yet in the schema_migrations table"). The same logic applies to function deployment.

3. **The current condition is actively harmful.** It creates a false sense of automation. The daily cron has been silently failing with 404s, and no one noticed because the deploy job never ran to produce an error.

4. **Approach B breaks migrations.** Adding `paths` at the workflow level would require restructuring both jobs, which is unnecessary complexity for this fix.

5. **Approach C is over-engineered** for 2 edge functions. If the project grows to 10+ functions, splitting workflows may be warranted, but not today.

**Immediate action after deploying the fix:** Run `workflow_dispatch` manually on the `Supabase` workflow to deploy both functions immediately, rather than waiting for the next push to `main`.
