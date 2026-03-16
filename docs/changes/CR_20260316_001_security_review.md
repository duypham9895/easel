# CR_20260316_001 — Security Review Report

| Field | Value |
|-------|-------|
| **Review ID** | SEC-20260316-001 |
| **Change Request** | CR_20260316_001 — Log Period Flo-Style Redesign |
| **Reviewer** | Head of DevSecOps |
| **Date** | 2026-03-16 |
| **Severity** | High — new health data collection with partner sharing |
| **Status** | Review Complete — Action Items Below |

---

## 1. Data Classification

### Sensitivity Level: **PHI / Special Category Personal Data**

The new data being collected — flow intensity (spotting/light/medium/heavy), symptoms (cramps, fatigue, headache, bloating, mood swings, nausea), and free-text per-day notes — constitutes **health data** under every applicable framework:

| Classification | Applies? | Rationale |
|----------------|----------|-----------|
| **PII (Personally Identifiable Information)** | Yes | Data is tied to `user_id` which links to `profiles.email` |
| **PHI (Protected Health Information)** | Yes | Menstrual flow intensity and physical symptoms are health indicators. While Easel is not a HIPAA-covered entity (no US healthcare provider relationship), this data meets the PHI definition and should be treated with equivalent rigor. |
| **GDPR Special Category Data (Art. 9)** | **Yes** | Menstrual cycle data, flow intensity, and symptoms are explicitly **"data concerning health"** under GDPR Art. 4(15). Processing requires an Art. 9(2) exemption — in Easel's case, **explicit consent** (Art. 9(2)(a)). |
| **PDPA Vietnam (Nghị định 13/2023/NĐ-CP)** | Yes | Article 2 defines "sensitive personal data" to include health data. Menstrual tracking data falls squarely within this. Requires explicit consent, purpose limitation, and data subject rights (access, correction, deletion). |
| **Apple App Store Guidelines (5.1.1, 5.1.2)** | Yes | Health and fitness data requires a privacy policy disclosure. HealthKit data rules apply if any data is synced to/from HealthKit (currently out of scope for per-day flow, but the existing HealthKit integration for cycle-level data already triggers this). Apple requires Purpose String declarations for health data access. |

### Regulatory Implications

1. **GDPR (EU users)**: Must obtain explicit consent before processing health data. The current Supabase Auth sign-up flow does not include a health data consent step. **ACTION REQUIRED**: Add a consent screen during onboarding or before first period log, with granular consent for (a) health data collection, (b) partner sharing of health data. Consent must be freely given, specific, informed, and unambiguous.

2. **PDPA Vietnam**: Requires a Personal Data Processing Agreement and explicit consent. Data subjects must be able to request access, correction, and deletion. The existing `deletePeriodLog()` function satisfies the deletion requirement at the period level, but per-day deletion must also be supported.

3. **Apple Health Guidelines**: Per-day flow and symptoms are not being synced to HealthKit in this CR (confirmed out of scope), but the privacy policy must still disclose collection of menstrual health data and partner sharing.

---

## 2. Supabase RLS Review

### 2.1 Minimum Required RLS Policies for `period_day_logs`

Assuming the architecture decision goes with a new `period_day_logs` table (one row per period-day), the following RLS policies are the **minimum required set**:

```sql
-- Enable RLS (mandatory — no exceptions)
ALTER TABLE public.period_day_logs ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Owner + linked partner (read-only for partner)
CREATE POLICY "period_day_logs: read own or partner's"
  ON public.period_day_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id = (SELECT public.my_partner_id()));

-- 2. INSERT: Owner only (Moon logs her own data)
CREATE POLICY "period_day_logs: insert own only"
  ON public.period_day_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3. UPDATE: Owner only (Moon edits her own data)
CREATE POLICY "period_day_logs: update own only"
  ON public.period_day_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. DELETE: Owner only (Moon can remove her own day logs)
CREATE POLICY "period_day_logs: delete own only"
  ON public.period_day_logs FOR DELETE
  USING (user_id = auth.uid());
```

**Key design decisions in these policies:**
- **Separate INSERT/UPDATE/DELETE policies** instead of a single `FOR ALL` — this provides clearer audit trail and makes it explicit that partner access is read-only.
- **Subquery wrapping** `(SELECT public.my_partner_id())` — consistent with the pattern established in migration 006, ensures the helper function evaluates once per query (not per row).
- **No partner write access** — Sun must never be able to insert, update, or delete Moon's period data.

### 2.2 Attack Vectors if RLS Misconfigured

| # | Attack Vector | Impact | Likelihood |
|---|--------------|--------|------------|
| 1 | **RLS not enabled on new table** — if `ENABLE ROW LEVEL SECURITY` is omitted, any authenticated user can read/write all period data for all users. | Critical — full data breach of all menstrual health data | Low (would be caught in code review, but catastrophic if missed) |
| 2 | **Missing USING clause on UPDATE/DELETE** — without `USING (user_id = auth.uid())`, a user could update/delete rows belonging to other users by guessing UUIDs. | High — data tampering/deletion for arbitrary users | Low |
| 3 | **Overly permissive SELECT via broken `my_partner_id()`** — if the `status = 'linked'` check is removed from `my_partner_id()`, unlinked (broken-up) partners could still read health data. | High — ex-partner retains access to intimate health data post-breakup | Low (function is SECURITY DEFINER and tested) |
| 4 | **INSERT policy allows `user_id` spoofing** — if WITH CHECK only checks `auth.uid()` on one condition but not another, a malicious client could insert rows with a different `user_id`. | Medium — data poisoning of another user's period log | Low (Supabase client sends auth.uid() automatically, but a crafted API call could attempt spoofing) |
| 5 | **Realtime subscription leaks data** — if Supabase Realtime is enabled on the table without RLS-aware filters, a user could subscribe to changes for any `user_id`. | High — real-time health data exfiltration | Medium — Supabase Realtime respects RLS since v2, but the channel filter must match |

### 2.3 RLS Testing Recommendation

**Recommended approach: pgTAP tests in CI**

pgTAP is the most robust option for testing RLS policies in a Supabase project. However, given Easel's current CI setup (GitHub Actions without a Supabase local instance), a pragmatic two-tier approach is recommended:

**Tier 1 — Manual test queries (immediate, pre-merge gate):**

```sql
-- Test as Moon (girlfriend) — should return own data
SET request.jwt.claim.sub = '<moon_user_id>';
SELECT * FROM period_day_logs; -- expect: Moon's rows only

-- Test as Sun (boyfriend, linked) — should return partner's data (read-only)
SET request.jwt.claim.sub = '<sun_user_id>';
SELECT * FROM period_day_logs; -- expect: Moon's rows (via my_partner_id())
INSERT INTO period_day_logs (user_id, log_date, flow_intensity)
  VALUES ('<moon_user_id>', '2026-03-16', 'heavy'); -- expect: DENIED

-- Test as unrelated user — should return nothing
SET request.jwt.claim.sub = '<random_user_id>';
SELECT * FROM period_day_logs; -- expect: 0 rows

-- Test as unlinked ex-partner — should return nothing
-- (after unlinking couple row)
SET request.jwt.claim.sub = '<ex_sun_user_id>';
SELECT * FROM period_day_logs; -- expect: 0 rows
```

**Tier 2 — pgTAP integration tests (recommended for CI pipeline):**

Add a `supabase/tests/` directory with pgTAP test files. Run via `supabase db test` in CI. This catches RLS regressions on every migration change automatically.

**ACTION ITEM**: Add RLS test suite before merging the migration. At minimum, Tier 1 manual queries must pass. Tier 2 pgTAP tests should be added to CI within 2 sprints.

---

## 3. Encryption

### 3.1 Supabase Default Encryption at Rest

Supabase uses **AES-256 encryption at rest** for all PostgreSQL data, provided by the underlying cloud provider (AWS). This means:

- Data files on disk are encrypted.
- Backups are encrypted.
- The encryption is transparent to queries (decrypt happens at the storage layer).

**Assessment: Sufficient for flow intensity and symptoms columns.** These are structured enum/array values with limited cardinality. The risk of a disk-level breach exposing "she had cramps on March 16" is low given the encryption already in place.

### 3.2 Application-Layer Encryption for Notes Field

**Recommendation: YES — encrypt the `notes` field at the application layer.**

**Justification:**

| Factor | Analysis |
|--------|----------|
| **Data sensitivity** | Free-text notes on period days could contain highly personal information: emotional state, relationship details, sexual activity, medical concerns, mental health notes. Unlike structured fields (flow = "heavy"), the content is unbounded and unpredictable. |
| **Threat model** | A Supabase admin, a compromised service role key, or a SQL injection through an unrelated vector could expose plaintext notes. AES-256 at rest does not protect against these vectors — the data is decrypted for any authenticated database connection. |
| **Partner visibility** | Notes are viewable by the linked partner via Realtime. If Moon writes something she later regrets, the note has already been transmitted. Application-layer encryption does not solve this (partner needs the decryption key to read), but it does protect against backend breaches. |
| **Regulatory alignment** | GDPR Art. 32 requires "appropriate technical measures" for health data. Application-layer encryption demonstrates defense-in-depth and strengthens the compliance posture. |

**Implementation approach:**

```
Encrypt: client-side before INSERT/UPDATE
  notes_encrypted = AES-256-GCM(plaintext_notes, user_derived_key)
  Store notes_encrypted in DB, notes column remains TEXT

Decrypt: client-side after SELECT
  plaintext_notes = AES-256-GCM-decrypt(notes_encrypted, user_derived_key)

Key derivation: PBKDF2(user_password, user_id_salt) or stored in Secure Enclave
```

**Trade-offs to accept:**
- Partner (Sun) cannot decrypt notes unless Moon's key is shared with the couple. This means either (a) notes are Moon-only (not shared with Sun), or (b) a couple-level key is derived at link time.
- Server-side search on notes becomes impossible.
- Key loss = data loss (mitigated by key backup in Secure Enclave / Keychain).

**Pragmatic recommendation for v1:**
- **Encrypt notes at application layer** using a per-user key stored in the device Keychain (iOS) / Keystore (Android).
- **Notes are NOT shared with Sun** — the partner sees flow intensity and symptoms but not free-text notes. This is the safest default and avoids the key-sharing complexity.
- **Revisit couple-level encryption** in a future CR if note sharing becomes a product requirement.

**If the team decides NOT to encrypt notes** (pragmatic trade-off for v1 speed): Document this as accepted risk in the architecture decision record, and ensure the privacy policy explicitly states that notes are stored server-side and visible to the linked partner.

---

## 4. Partner Access Consent

### 4.1 Explicit Consent Requirement

**Yes — explicit consent is required before granting partner read access to health data.**

Under GDPR Art. 9(2)(a), processing special category data (health) requires **explicit consent**. The current flow is:

1. Moon creates couple, generates link code.
2. Sun enters link code, couple status becomes `linked`.
3. RLS automatically grants Sun read access to Moon's `period_logs`, `cycle_settings`, and `daily_logs`.

**The problem**: Step 2 constitutes consent to partner *linking*, not consent to **sharing health data with the partner**. These are legally distinct. Moon consenting to link with Sun does not automatically mean she consents to sharing flow intensity, symptoms, and notes.

**Required change**: Add an explicit health data sharing consent step. Options:

| Option | UX Impact | Compliance |
|--------|-----------|------------|
| A. Consent checkbox during couple linking | Minimal — one extra checkbox on the link screen | Good — consent is captured at the moment sharing begins |
| B. Granular sharing settings in Moon's preferences | Better UX — Moon can toggle sharing per data type | Best — aligns with GDPR data minimization and Apple privacy expectations |
| C. First-log consent prompt | Moderate — prompt appears on first period log after linking | Good — contextual consent at the moment data is created |

**Recommendation**: **Option B** — Add a `period_data_sharing` setting to Moon's preferences (or `notification_preferences` table) with granular toggles:
- Share period dates with partner: ON by default (core feature)
- Share flow intensity with partner: ON by default
- Share symptoms with partner: ON by default
- Share notes with partner: **OFF by default** (most sensitive)

This satisfies GDPR data minimization, gives Moon control, and aligns with the product principle that whisper/SOS alerts are always on but detailed health data sharing is Moon's choice.

### 4.2 Consent Revocation (Breakup / Unlink)

**Current mechanism analysis:**

1. When a couple unlinks, the `couples` row is either deleted or its `status` is changed from `linked` to a terminal state.
2. `my_partner_id()` queries `WHERE status = 'linked'` — so it returns `NULL` when unlinked.
3. RLS policies use `user_id = (SELECT public.my_partner_id())` — when `my_partner_id()` returns `NULL`, the condition `user_id = NULL` evaluates to `FALSE` (SQL three-valued logic), so no partner rows are returned.

**Assessment: The RLS mechanism is sound.** When the couple unlinks, partner access is immediately and completely revoked at the database layer. This is correct.

**Gaps identified:**

| Gap | Risk | Recommendation |
|-----|------|----------------|
| **Cached data on Sun's device** | After unlinking, Sun's Zustand store (persisted in AsyncStorage) may still contain Moon's period data from the last sync. | Clear partner health data from AsyncStorage on unlink. Add a `clearPartnerData()` action to the store triggered by couple status change. |
| **Supabase Realtime channel** | An active Realtime subscription on Sun's device could theoretically receive one more event during the race condition between unlink and channel teardown. | Supabase Realtime respects RLS, so the channel will stop delivering events once `my_partner_id()` returns NULL. The race window is sub-second. **Accepted risk.** |
| **No audit trail of who accessed data** | If Moon unlinks and later asks "did my ex see my period data?", there is no access log to answer this. | See Section 5 (Audit Logging). |
| **Supabase backups** | Supabase automated backups contain all data. An ex-partner with Supabase dashboard access (if they had admin credentials) could restore a backup containing Moon's data. | Irrelevant for Easel — only the developer team has Supabase dashboard access, not end users. **No action needed.** |

**Verdict**: The current unlink mechanism is **sufficient** for access revocation. Add the client-side cache clearing as a hardening measure.

---

## 5. Audit Logging

### 5.1 Should We Log Period Data Access?

**Recommendation: YES — implement audit logging for health data access.**

### 5.2 Compliance Requirement Analysis

| Framework | Audit Logging Required? | Details |
|-----------|------------------------|---------|
| **GDPR Art. 30** | Yes (indirectly) | Requires "records of processing activities." While not a per-query audit log, the spirit of Art. 30 is that data controllers can demonstrate what processing occurred. |
| **GDPR Art. 15** | Yes (indirectly) | Data subjects have the right to know who has accessed their data. Without audit logs, you cannot fulfill this right. |
| **PDPA Vietnam** | Yes | Article 9(5) requires data controllers to maintain records of personal data processing activities. |
| **Apple Guidelines** | No explicit requirement | But App Tracking Transparency and privacy nutrition labels imply transparency. |
| **SOC 2 Type II** (future) | Yes | If Easel pursues SOC 2 certification, audit logging of access to sensitive data is a mandatory control. |

### 5.3 Recommendation

**Tier 1 (implement now — before this CR ships):**
- Log partner (Sun) **read access** to Moon's period data. This is the most sensitive vector — someone other than the data owner viewing health data.
- Implementation: A lightweight Postgres trigger on the `period_day_logs` table that logs `SELECT` operations by non-owner users. However, Postgres triggers do not fire on SELECT — so the practical approach is:
  - **Application-layer logging**: When Sun's client fetches Moon's period data (via the `fetchPeriodLogs` or equivalent function), log the access event to a new `audit_log` table.
  - Schema: `audit_log (id, actor_id, action, resource_table, resource_owner_id, metadata JSONB, created_at)`.

**Tier 2 (implement within 2 sprints):**
- Log all write operations (INSERT, UPDATE, DELETE) on health data tables via Postgres triggers.
- Add a "Data Access History" screen in Moon's settings so she can see when Sun last viewed her period data.
- Retention policy: 90 days for access logs, 1 year for write logs.

**Tier 3 (implement before any regulatory audit):**
- Centralized audit log export for GDPR/PDPA compliance requests.
- Automated anomaly detection (e.g., an unlinked user somehow accessing partner data — should never happen with RLS, but defense in depth).

---

## 6. Threat Model

### Top 3 Risks for the Per-Day Period Logging Feature

#### Risk 1: Intimate Partner Surveillance / Coercive Control

| Attribute | Detail |
|-----------|--------|
| **Threat** | Sun (boyfriend) uses real-time access to Moon's period data — flow intensity, symptoms, notes — as a tool for surveillance or coercive behavior. Example: monitoring symptoms to predict fertility, pressuring Moon about logged data, or using notes content in arguments. |
| **Likelihood** | **Medium** — intimate partner violence (IPV) affects ~30% of women globally. A period tracking app with partner sharing is inherently a dual-use tool. |
| **Impact** | **Critical** — physical safety, emotional harm, legal liability. |
| **Mitigations** | 1. **Notes are NOT shared with partner by default** (see Section 3.2 recommendation). 2. **Granular sharing controls** (Section 4.1, Option B) — Moon can disable symptom/flow sharing at any time without unlinking. 3. **Stealth unlink**: Add a way for Moon to revoke partner access that does not send a notification to Sun. Currently, unlinking likely triggers a Realtime event that Sun would notice. 4. **Safety resource**: If Moon searches for "help" or "abuse" in notes, surface a discreet link to a domestic violence hotline (future feature, out of scope for this CR but flagged for product team). |

#### Risk 2: Free-Text Notes Injection / XSS via Realtime

| Attribute | Detail |
|-----------|--------|
| **Threat** | Moon enters malicious content in the per-day notes field (e.g., `<script>` tags, excessively long strings, or Unicode exploits). This content is synced to Sun's device via Supabase Realtime and rendered in the UI. |
| **Likelihood** | **Low** — requires a user to intentionally attack their own partner's device. More realistically, this is an accidental risk from copy-pasted text or emoji edge cases. |
| **Impact** | **Medium** — potential UI breakage, rendering exploits, or crash on partner's device. XSS is not directly applicable in React Native (no browser DOM), but malformed content could cause rendering issues or crash the app. |
| **Mitigations** | 1. **Input validation**: Enforce 200-character limit at both client and database level (`CHECK (char_length(notes) <= 200)`). 2. **Sanitize on render**: Strip control characters and validate UTF-8 before rendering notes text. React Native's `<Text>` component is not vulnerable to XSS, but malformed Unicode can cause layout issues. 3. **Database constraint**: Add a CHECK constraint rejecting null bytes and control characters (`CHECK (notes !~ '[\x00-\x08\x0B\x0C\x0E-\x1F]')`). |

#### Risk 3: RLS Bypass via New Table Missing Policies

| Attribute | Detail |
|-----------|--------|
| **Threat** | The new `period_day_logs` table is created in a migration but RLS is either not enabled or policies are incomplete. Any authenticated Supabase user could query all period day logs for all users via the Supabase REST API (`/rest/v1/period_day_logs`). |
| **Likelihood** | **Low** — Easel has a strong RLS track record (all 10 existing tables have RLS). But the risk is non-zero because this is a new table added in a new migration, and a single omitted line (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) would be catastrophic. |
| **Impact** | **Critical** — complete exposure of all users' menstrual health data (flow intensity, symptoms, notes) to any authenticated user. This would be a reportable data breach under GDPR Art. 33 (72-hour notification to supervisory authority). |
| **Mitigations** | 1. **Migration checklist**: Every new table migration MUST include `ENABLE ROW LEVEL SECURITY` as the first statement after `CREATE TABLE`. Add this as a PR review checklist item. 2. **CI gate**: Add a CI check that queries `pg_tables` and `pg_policies` to verify every table in the `public` schema has RLS enabled and at least one policy. Fail the build if any table lacks RLS. 3. **pgTAP test**: Write a specific test that attempts to read `period_day_logs` as an unrelated user and asserts 0 rows. 4. **Code review requirement**: All migration PRs require security review sign-off (this review serves as the template). |

---

## 7. Action Items Summary

| # | Action | Priority | Owner | Deadline |
|---|--------|----------|-------|----------|
| 1 | Add RLS policies to new `period_day_logs` table (per Section 2.1) | **P0 — Blocker** | Backend | Before merge |
| 2 | Add database constraints: `notes` length limit, `flow_intensity` enum CHECK, `symptoms` array validation | **P0 — Blocker** | Backend | Before merge |
| 3 | Write RLS test queries (Tier 1 manual, Section 2.3) and verify all 4 scenarios pass | **P0 — Blocker** | Backend | Before merge |
| 4 | Add `notes` character constraint (`CHECK (char_length(notes) <= 200)`) at database level | **P1 — High** | Backend | Before merge |
| 5 | Implement granular partner sharing settings (Section 4.1, Option B) | **P1 — High** | Mobile | Sprint +1 |
| 6 | Clear partner health data from AsyncStorage on unlink (Section 4.2) | **P1 — High** | Mobile | Sprint +1 |
| 7 | Evaluate and implement application-layer encryption for notes field (Section 3.2) | **P2 — Medium** | Backend + Mobile | Sprint +2 |
| 8 | Add CI check for RLS coverage on all public tables (Section 6, Risk 3) | **P2 — Medium** | DevOps | Sprint +2 |
| 9 | Implement audit logging for partner access to health data (Section 5.3, Tier 1) | **P2 — Medium** | Backend | Sprint +2 |
| 10 | Update privacy policy to disclose per-day health data collection and partner sharing | **P1 — High** | Legal + PM | Before App Store submission |
| 11 | Add health data consent screen (GDPR Art. 9(2)(a) compliance) | **P1 — High** | Mobile + Legal | Sprint +1 |
| 12 | Add pgTAP test suite to CI (Section 2.3, Tier 2) | **P3 — Low** | DevOps | Sprint +3 |

---

## 8. Approval

| Role | Name | Decision | Date |
|------|------|----------|------|
| Head of DevSecOps | — | **Conditionally Approved** | 2026-03-16 |

**Conditions for approval:**
- Action items 1–4 (P0) must be completed before the migration is merged.
- Action items 5, 6, 10, 11 (P1) must be completed before the feature ships to production.
- Action items 7–9, 12 (P2/P3) are tracked as follow-up work within the stated sprint deadlines.

This review will be re-evaluated if the data model decision (Section 9 of the analysis doc, Open Questions 1–3) results in a JSONB approach instead of a per-row table, as the RLS and encryption recommendations would change.
