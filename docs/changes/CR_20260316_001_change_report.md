# CR_20260316_001 — Change Report: Log Period (Flo-Style Experience)

| Field | Value |
|-------|-------|
| **CR ID** | CR_20260316_001 |
| **Title** | Log Period — Flo-Style Experience |
| **Requestor** | Duy (PM) |
| **Date** | 2026-03-16 |
| **Priority** | High |
| **Target Version** | v1.7.0 |
| **Status** | Pre-Implementation |

---

## 1. Executive Summary

**CR_20260316_001** redesigns Easel's period logging experience from a binary start/end toggle into a per-day granular logging system with flow intensity tracking, symptom chips, custom Flo-style calendar cells, tap-to-toggle day selection, and toast-based confirmations. The change introduces a new `period_day_logs` Supabase table, six new React Native components, Zustand store extensions, and Realtime subscription additions for partner sync. It affects both Moon (primary logging UX overhaul) and Sun (richer read-only period data via real-time sync). The existing `period_logs` table, cycle prediction engine, and notification system remain unchanged.

**Strategic alignment verdict:** Approved with conditions. The strategic review confirms this CR strengthens Easel's core proposition by reaching competitive parity with Flo while creating hook points for the couples-first differentiator. The mandatory addition of symptom-triggered empathy prompts for Sun is recommended as a Phase 2 follow-on. This CR should ship before CR_20260308_001 (AI Personalization Architecture) because logging quality gates AI quality.

---

## 2. Change Summary

### Delta Statement

This change transforms the period logging experience from a **binary start/end range model** with override tags and native alert confirmations into a **per-day granular logging model** with flow intensity tracking, symptom chips, custom Flo-style calendar cells, tap-to-toggle day selection, and toast-based confirmations. It requires:

1. **Data model expansion**: new `period_day_logs` table with `flow_intensity`, `symptoms`, and per-day `notes` columns.
2. **Custom calendar rendering**: replacing default `react-native-calendars` day cells with a custom `DayComponent` supporting phase-colored fills, flow-intensity dots, and connected-range visuals.
3. **New UX flow**: tap-to-toggle replaces the current two-step (DayDetailSheet -> PeriodLogSheet) interaction, with an inline detail panel for flow and symptoms.
4. **Confirmation pattern change**: native `Alert.alert()` replaced with toast notifications across all period logging actions.
5. **Existing functionality preserved**: override tags, prediction engine, partner sync, and the `PeriodStartButton` dashboard shortcut remain functional.

### Business Justification

- **Competitive parity**: Flo, Clue, and other leading cycle apps offer per-day flow logging and symptom tracking. The current binary model feels dated.
- **Data depth for AI personalization**: per-day flow and symptom data feeds the AI personalization pipeline (future CR_20260308_001).
- **User retention**: a richer logging experience increases daily engagement and 30-day retention.
- **Partner value**: Sun seeing flow intensity and symptoms (read-only) provides actionable context beyond "she's on her period."

### Change Type

**Multiple**: UI/Visual + UX/Flow + Functional

---

## 3. Scope

### What Is Changing

- Calendar day cells: custom `DayComponent` with phase fills, flow dots, selection rings, and connected-range bands
- Period logging flow: tap-to-toggle on calendar days replaces two-step modal navigation
- Per-day detail panel: inline panel with flow intensity selector (4 options), symptom chips (6 symptoms), notes field
- Confirmation UX: toast notifications replace `Alert.alert()` for save/toggle actions
- Data model: new `period_day_logs` table for per-day flow intensity and symptoms
- Partner sync: Supabase Realtime extended to broadcast `period_day_logs` changes to Sun
- Sun calendar view: enriched with flow intensity indicators (read-only)
- i18n: 21 new keys per language (EN, VI) in the `calendar` namespace
- Design tokens: new `CycleCalendarTokens` added to `theme.ts`
- Zustand store: new `periodDayLogs` state, `savePeriodDayLog`, `loadPeriodDayLogs`, `removePeriodDayLog`, `receivePeriodDayLog` actions

### What Is NOT Changing (Out of Scope)

- Apple HealthKit / Android Health Connect sync of flow data
- AI-generated symptom insights or cycle analytics
- Symptom tracking outside period days (existing `daily_logs` unchanged)
- Push notification changes (edge functions unchanged)
- Sun-side logging (Sun remains read-only)
- Calendar library replacement (`react-native-calendars` retained, custom `DayComponent` used)
- Retroactive backfill of flow data for existing periods (defaults to no flow data)
- Cycle prediction algorithm rewrite (only richer input data)
- Sun dashboard layout redesign (only a contextual flow-intensity card added)
- Fertility/conception tracking (BBT, LH)

---

## 4. Files to Be Changed/Created

### New Files

| File | Type | Est. Lines |
|------|------|-----------|
| `app/components/moon/CalendarDayCell.tsx` | Component | ~180 |
| `app/components/moon/FlowIntensitySelector.tsx` | Component | ~200 |
| `app/components/moon/SymptomChipGroup.tsx` | Component | ~150 |
| `app/components/moon/PeriodLogPanel.tsx` | Component | ~350 |
| `app/components/shared/SaveToast.tsx` | Component | ~120 |
| `app/lib/db/periodDayLogs.ts` | Data Access Layer | ~130 |
| `app/hooks/usePeriodDayLogListener.ts` | Hook (Realtime) | ~50 |
| `app/supabase/migrations/008_period_day_logs.sql` | Migration | ~80 |

### Modified Files

| File | Change Description | Est. Lines Changed |
|------|-------------------|-------------------|
| `app/app/(tabs)/calendar.tsx` | Replace `<Calendar>` default rendering with custom `DayComponent`, wire inline panel, remove `DayDetailSheet` modal | ~200 |
| `app/store/appStore.ts` | Add `periodDayLogs` state, 5 new actions, update `bootstrapSession`/`signOut` | ~120 |
| `app/constants/theme.ts` | Add `CycleCalendarTokens` object (~30 tokens) | ~40 |
| `app/types/index.ts` | Add `FlowIntensity`, `PeriodSymptom`, `PeriodDayRecord`, `DbPeriodDayLog` types | ~30 |
| `app/utils/cycleCalculator.ts` | Add `enrichMarkersWithRangeInfo()` helper | ~30 |
| `app/components/sun/PartnerCalendarView.tsx` | Add flow intensity indicator on period day cells (read-only) | ~40 |
| `app/app/_layout.tsx` | Register `usePeriodDayLogListener` hook | ~3 |
| `app/i18n/en/calendar.json` | Add 21 new translation keys | ~21 |
| `app/i18n/vi/calendar.json` | Add 21 new translation keys | ~21 |

### Deprecated

| File | Reason |
|------|--------|
| `app/components/moon/PeriodLogSheet.tsx` | Replaced by `PeriodLogPanel.tsx`. Retained in codebase for one release cycle (v1.7.0), removed in v1.8.0. |

**Totals:** 8 new files, 9 modified files, 1 deprecated file. Estimated ~1,350 lines added.

---

## 5. Design & Copy Changes

### Design Highlights

- **New color tokens**: `periodLogged` (#D4537E, deep rose), `periodPredicted` (#F2A6C0, soft blush), `ovulationDay` (#3AAFFF), plus 25+ supporting tokens for surfaces, dots, chips, and toast
- **Custom day cells**: 44x44pt (Apple HIG compliant), solid fill for logged days, dashed border for predicted days, connected-range bands for multi-day spans
- **Flow intensity selector**: 4 horizontal buttons (72pt height) with 1-4 dot indicators per option
- **Symptom chips**: 6 pill-shaped chips (40pt height, 88pt min width), `flexWrap` layout, multi-select
- **Toast**: capsule-shaped, top-positioned, auto-dismiss after 2500ms, spring entry animation
- **Animations**: all via `react-native-reanimated` — day cell scale tap (0.90), chip fill from center, staggered dot fade-in, toast slide-down spring
- **Accessibility**: WCAG 2.1 AA contrast ratios verified, VoiceOver labels for all interactive elements, Reduce Motion support, Dynamic Type up to 1.5x

### Copy Changes

- **Tone shift**: from clinical data entry to caring friend ("How's your flow?" not "Flow intensity")
- **Flow labels**: "A little" (spotting), "Light", "Moderate" (medium), "Heavy"
- **Symptom labels**: "Tired" (not "Fatigue"), "Moody" (not "Mood swings") — warmer, shorter
- **Notes placeholder**: "Anything you want to remember about today..." (personal journal framing)
- **Toast**: "Saved — your cycle is updated" replaces `Alert.alert()` modal
- **Partner push**: "Moon's period just started — she might need a little extra care today" (empathy-driven)
- **Delete**: "Remove" replaces "Delete", "Keep it" replaces "Cancel"
- **New surfaces**: empty state CTA, predicted tooltip, onboarding hint
- **6 deprecated i18n keys**, ~20 new keys per language (EN + VI)

---

## 6. Backend Changes

### New Table: `period_day_logs`

```
period_day_logs (
  id              UUID PK,
  user_id         UUID FK -> profiles(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  flow_intensity  TEXT NOT NULL CHECK (IN spotting/light/medium/heavy),
  symptoms        TEXT[] NOT NULL DEFAULT '{}' CHECK (subset of 6 allowed values),
  notes           TEXT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  UNIQUE (user_id, log_date)
)
```

### Migration: `008_period_day_logs.sql`

- Table creation with proper column types and FK constraints
- CHECK constraint on `flow_intensity` (closed enum via TEXT)
- CHECK constraint on `symptoms` (subset validation via `<@` operator)
- B-tree index on `(user_id, log_date DESC)` for range queries
- GIN index on `symptoms` for array queries
- `updated_at` auto-update trigger using existing `set_updated_at()`
- Wrapped in transaction (`BEGIN`/`COMMIT`)

### RLS Policies (4 Granular Policies)

| Policy | Operation | Rule |
|--------|-----------|------|
| Read own or partner's | SELECT | `user_id = auth.uid() OR user_id = (SELECT my_partner_id())` |
| Insert own only | INSERT | `WITH CHECK (user_id = auth.uid())` |
| Update own only | UPDATE | `USING + WITH CHECK (user_id = auth.uid())` |
| Delete own only | DELETE | `USING (user_id = auth.uid())` |

### Realtime Subscription

- `period_day_logs` added to `supabase_realtime` publication
- New client-side subscription: `subscribeToPeriodDayLogs(moonUserId, callback)`
- Events: INSERT, UPDATE, DELETE — filtered by `user_id=eq.{moonUserId}`
- Sun receives complete row payload per event (atomic upsert, no partial state)

### Relationship to Existing Tables

The `period_day_logs` table supplements (does not replace) `period_logs`. The relationship is logical (same user, date within period range), enforced at the application layer. No FK to `period_logs` — this avoids complications with nullable `end_date` and pre-finalized periods. Existing tables (`period_logs`, `daily_logs`, `cycle_settings`, `profiles`) are unchanged.

---

## 7. Security Findings

### Data Classification

Period day logs constitute **GDPR Special Category Data (Art. 9)** — "data concerning health." Also classified as PHI, PDPA Vietnam sensitive data, and subject to Apple App Store health data guidelines (5.1.1, 5.1.2).

### P0 Blocking Action Items (Must Complete Before Merge)

| # | Action |
|---|--------|
| 1 | Add RLS policies to `period_day_logs` table (4 granular policies per spec) |
| 2 | Add database constraints: `flow_intensity` CHECK, `symptoms` array validation, `notes` length limit |
| 3 | Write and verify RLS test queries (4 scenarios: Moon, Sun, unrelated user, ex-partner) |
| 4 | Add `notes` character constraint (`CHECK (char_length(notes) <= 200)`) at database level |

### P1 Action Items (Must Complete Before Production Ship)

- Implement granular partner sharing settings (share flow: ON, share symptoms: ON, share notes: OFF by default)
- Clear partner health data from AsyncStorage on couple unlink
- Update privacy policy to disclose per-day health data collection and partner sharing
- Add health data consent screen (GDPR Art. 9(2)(a) compliance)

### Key Recommendations

- **Notes encryption**: application-layer AES-256-GCM encryption recommended for the free-text notes field (P2, Sprint +2). Notes should NOT be shared with partner by default.
- **Sharing toggles**: Moon should control what Sun sees (period dates, flow, symptoms, notes — each toggleable independently).
- **Audit logging**: log partner read access to health data for GDPR Art. 15 compliance (P2, Sprint +2).
- **Stealth unlink**: allow Moon to revoke partner access without notifying Sun (IPV safety consideration).
- **CI RLS gate**: add a CI check verifying all public tables have RLS enabled and at least one policy.

### Top Threat: Intimate Partner Surveillance

The security review flags that a period tracking app with partner sharing is inherently a dual-use tool. Mitigations include granular sharing controls, notes-not-shared default, and a future stealth unlink capability.

---

## 8. Test Coverage

### Summary

| Metric | Value |
|--------|-------|
| **Total test cases** | 40 |
| **P0 (must pass, blocks release)** | 24 |
| **P1 (should pass, important)** | 16 |
| **P2** | 0 |

### Category Breakdown

| Category | Count | Description |
|----------|-------|-------------|
| A. Change Verification | 17 | New behavior per acceptance criteria |
| B. Backward Compatibility | 6 | Existing data and flows still work |
| C. Regression | 7 | SOS, Whisper, predictions, daily check-in unaffected |
| D. Edge Cases | 10 | Empty state, offline, rapid taps, small screen, i18n |

### Verification Methods

- **device-test**: 35 cases (requires physical iPhone for haptic verification)
- **unit-test**: 3 cases (cycleCalculator, prediction accuracy, data persistence)
- **code-inspection**: 1 case (Supabase table verification)
- Multi-device tests: 3 cases (partner sync requires simultaneous Moon + Sun devices)

### Note

All UI/UX test cases (`device-test` method) require on-device verification. Simulator is acceptable for visual/layout checks only. All P0 cases must pass on both iPhone 15 Pro and iPhone SE before release signoff.

---

## 9. Backward Compatibility

- **Existing `period_logs` table**: completely unchanged. No columns added, no constraints modified.
- **New `period_day_logs` table**: purely additive. No dependency on existing data.
- **Existing periods without day logs**: calendar renders them with solid pink fill and no flow dot (absence = no data, not "no flow"). Users can retroactively add flow data by tapping historical period days.
- **Override tags**: retained as "Factors affecting prediction" section, still stored in `period_logs.tags[]`, still feed prediction engine at 0.5x weight.
- **Cycle prediction engine**: `cycleCalculator.ts` continues to operate on `period_logs` start/end ranges. The new `enrichMarkersWithRangeInfo()` function is additive.
- **Partner sync**: existing `subscribeToPeriodLogs()` is unchanged. New `subscribeToPeriodDayLogs()` runs in parallel.
- **No breaking changes to existing API, store shape, or data access patterns.**

---

## 10. Risk Assessment

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Calendar performance regression** with custom `DayComponent` rendering 42 cells per month, each checking flow intensity + marking + selection state | Medium | Medium | `React.memo` with custom comparator on each cell; `useMemo` for markers computation; O(1) day log lookup via `Record<string, PeriodDayRecord>`; benchmark target <100ms for full month render |
| 2 | **Data migration breaks existing period logs** or RLS misconfiguration exposes health data | Low | Critical | Migration is additive only (new table, no existing table changes); RLS policies mirror proven `period_logs` pattern; 4-scenario RLS test suite required before merge; rollback script prepared |
| 3 | **Intimate partner surveillance via flow/symptom data** — Sun uses real-time health data for coercive control | Medium | Critical | Notes not shared with partner by default; granular sharing toggles (P1); stealth unlink capability (future); GDPR-compliant consent screen before health data sharing begins |

---

## 11. Open Questions

All items below are unresolved and require decisions before or during implementation.

### Data Model

| # | Question | Source | Recommendation |
|---|----------|--------|----------------|
| 1 | Should `period_day_logs` use a FK to `period_logs` or a logical relationship enforced at app layer? | Analysis, Backend Spec | Backend spec recommends logical (no FK) due to nullable `end_date` and pre-finalized periods. Architecture notes concur. |
| 2 | Should the symptom list match `daily_logs` symptoms or be a period-specific subset? | Analysis OQ-3, PRD OQ-4 | Period-specific subset of 6 (cramps, fatigue, headache, bloating, mood_swings, nausea) with potential for "other" freeform in future. |
| 3 | Should `period_day_logs` rows be auto-created when Moon sets an end date, or only on explicit day taps? | PRD OQ-5 | Auto-create with default "medium" flow on end-date set; Moon edits individual days afterward. |

### UX

| # | Question | Source | Recommendation |
|---|----------|--------|----------------|
| 4 | Should the detail panel be inline (scroll-based) or a bottom sheet? | Analysis OQ-4, Design Spec OQ-2 | Design spec assumes inline. Architecture notes defer to design. Decision needed from product. |
| 5 | Should tapping non-period days between two logged days auto-fill the gap? | Analysis OQ-5 | No auto-fill in v1.7.0 (P1 feature FR-13 deferred). Each day individually toggled. |
| 6 | Should the `DayDetailSheet` (read-only phase info) remain accessible via long-press? | Analysis OQ-6 | Decision needed. Current spec removes it entirely; functionality absorbed by `PeriodLogPanel`. |
| 7 | Should flow intensity be required or optional when tapping a period day? | PRD OQ-1 | Default to "medium", allow saving without explicit selection. |
| 8 | Should Moon be able to log flow retroactively for past periods? | PRD OQ-2 | Allow retroactive for last 2 periods (within 30-day window). |
| 9 | Do we need an explicit "period ended" action or auto-detect from gap in logged days? | Design Spec OQ-3 | Decision needed. |

### Partner Sync & Privacy

| # | Question | Source | Recommendation |
|---|----------|--------|----------------|
| 10 | Should Sun see flow intensity labels ("Heavy") or only visual dot sizing? | Analysis OQ-7 | Flow labels visible by default; Moon can toggle off via sharing settings (P1). |
| 11 | Should Sun see individual symptom chips or only a summary count? | Analysis OQ-8 | Individual symptoms visible by default; Moon can toggle off (P1). |
| 12 | Should Sun see Moon's per-day notes? | Security Review | Notes NOT shared with partner by default. Revisit if product requires it. |

### Technical

| # | Question | Source | Recommendation |
|---|----------|--------|----------------|
| 13 | Should we use an existing toast library or build custom? | Analysis OQ-9 | Design spec defines a custom `SaveToast` component matching Moon theme. Evaluate `burnt` for native feel vs custom for full control. |
| 14 | Should we replace `react-native-calendars` entirely or use custom `DayComponent`? | PRD OQ-3 | Keep library, use `DayComponent` prop. Replace only if profiling reveals insufficiency. |

**Status:** All 14 questions are unresolved (pre-implementation). Resolution required during Phase 1-2 of implementation.

---

## 12. Success Metrics

### Strategic Metrics (from Strategic Review)

| Metric | Baseline | Target (8 weeks post-launch) |
|--------|----------|------------------------------|
| Log completion rate (Moon logs flow + 1 symptom per period) | ~35% | 65% |
| Sun engagement on log day (opens app within 4 hours) | 22% | 45% |
| Couple retention at day 30 (both Moon and Sun active) | 41% | 55% |

### Product Metrics (from PRD)

| Metric | Baseline (v1.6.0) | Target (v1.7.0 + 30 days) |
|--------|-------------------|---------------------------|
| Period logging completion rate (start + end logged) | ~60% | >= 85% |
| Flow intensity adoption (% of logged days with flow set) | 0% | >= 70% |
| Calendar tab DAU | Baseline | +20% |
| Mean absolute prediction error | ~3.2 days | <= 2.2 days |
| Partner dashboard engagement | Baseline | +15% |
| NPS for period tracking | Not measured | >= 40 |
| Time to log a complete period | ~45 seconds | <= 30 seconds |

---

## 13. Estimated Effort

| Phase | Duration | Deliverables |
|-------|----------|-------------- |
| **Phase 1: Foundation** | 3 days | Migration 008, types, data access layer, store actions, unit tests |
| **Phase 2: Core UI** | 5 days | Tap-to-toggle, FlowIntensitySelector, inline confirmation, PeriodLogPanel |
| **Phase 3: Calendar Visual** | 3 days | Custom day rendering with flow indicators, legend updates, performance optimization |
| **Phase 4: Partner Sync** | 2 days | Realtime subscription, Sun contextual card, PartnerCalendarView enrichment |
| **Phase 5: Polish & P1** | 3 days | Symptom picker, period summary card, animations, i18n |
| **Phase 6: QA & Launch** | 2 days | Manual QA, VoiceOver audit, performance benchmarks, staging deploy |

**Total estimated effort: 18 engineering days (~3.5 weeks with buffer)**

---

## 14. Release Recommendation

| Attribute | Assessment |
|-----------|-----------|
| **Confidence** | **Low** — pre-implementation phase. All 40 test cases are UNTESTED. No code has been written. |
| **Recommendation** | **Proceed to implementation phase.** The design, architecture, backend, frontend, and security specs are comprehensive and aligned. No architectural pivots needed. |
| **Blockers before implementation** | Resolve open questions 4 (inline vs bottom sheet), 6 (DayDetailSheet disposition), and 9 (period end detection). |
| **Blockers before merge** | Complete P0 security action items 1-4 (RLS policies, database constraints, RLS test queries, notes length constraint). |
| **Blockers before production** | Complete P1 security action items (sharing toggles, cache clearing on unlink, privacy policy update, health data consent screen). Pass all 24 P0 test cases on both iPhone 15 Pro and iPhone SE. |

**Recommended implementation order:** Foundation (types + DB) -> Store actions -> Components -> Calendar integration -> Partner sync -> i18n + polish -> QA.

**Recommended CR sequencing:** Log Period Redesign (this CR) -> Symptom Empathy Prompts (Phase 2, strategic review recommendation) -> AI Personalization (CR_20260308_001).

---

## 15. Document Index

| # | Document | File Path |
|---|----------|-----------|
| 1 | Change Analysis | `docs/changes/CR_20260316_001_analysis.md` |
| 2 | Strategic Review Memo | `docs/changes/CR_20260316_001_strategic_review.md` |
| 3 | Product Requirements Document | `docs/changes/CR_20260316_001_prd.md` |
| 4 | Design Specification | `docs/changes/CR_20260316_001_design_spec.md` |
| 5 | UX Copy Specification | `docs/changes/CR_20260316_001_ux_copy_spec.md` |
| 6 | Architecture Consultation Note | `docs/changes/CR_20260316_001_architecture_notes.md` |
| 7 | Backend Specification | `docs/changes/CR_20260316_001_backend_spec.md` |
| 8 | Security Review Report | `docs/changes/CR_20260316_001_security_review.md` |
| 9 | Frontend Implementation Spec | `docs/changes/CR_20260316_001_frontend_impl_spec.md` |
| 10 | Test Cases | `docs/changes/CR_20260316_001_test_cases.md` |
| 11 | **Change Report (this document)** | `docs/changes/CR_20260316_001_change_report.md` |
