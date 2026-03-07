# Easel App — Publishing & Security Hardening Design

**Date:** 2026-03-07
**Goal:** Fix all security issues and publish to iOS App Store + Google Play

## Approach: Fix Everything, Then Publish

### Phase 1: Critical Security Fixes (DB Migration 006)

| ID | Issue | Fix |
|----|-------|-----|
| C1 | Missing `UNIQUE(boyfriend_id)` — Sun can link multiple Moons | Add unique constraint |
| C2 | `notify-cycle` edge function has no auth | Add Authorization header check |
| C3 | RLS helpers called per-row (perf + DoS) | Wrap in `(SELECT ...)` subquery |
| C4 | `sos_signals.type` unconstrained | Add allowlist or length limit |

### Phase 2: High Security Fixes

| ID | Issue | Fix |
|----|-------|-----|
| H1 | `sos_signals` UPDATE allows any column change | Restrict via trigger or RPC |
| H2 | Edge functions leak error details | Return generic errors only |
| H3 | Avatar URL not persisted to DB | Write to profiles table in store |
| H4 | In-memory rate limiting (proxy) | Acceptable for launch scale; document limitation |

### Phase 3: Medium Security Fixes

| ID | Issue | Fix |
|----|-------|-----|
| M1 | `SECURITY DEFINER` missing `SET search_path` | Add to all helper functions |
| M2 | Missing FK indexes | Create indexes |
| M3 | `select('*')` exposes PII | Use explicit column lists |
| M4 | Link code TOCTOU race | Add expiry check in UPDATE WHERE |

### Phase 4: Pre-Publishing Setup

- Sync `app.json` version to 1.5.0
- Create `eas.json` with development/preview/production profiles
- Verify real app icons exist (current ones are 70-byte stubs)
- Add privacy policy URL to app config
- Build TestFlight (iOS) + internal APK (Android)

### Phase 5: Store Submission

- Submit to App Store Connect (iOS)
- Submit to Google Play Console (Android)

## Out of Scope

- Distributed rate limiting (Vercel KV) — not needed at launch scale
- UUIDv7 migration — non-breaking, can do later
- E2E test suite — deferred to post-launch
