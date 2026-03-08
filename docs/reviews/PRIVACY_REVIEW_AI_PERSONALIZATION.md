# Privacy & Data Ethics Review: AI Personalization Feature

**Reviewer:** Marcus Webb — Privacy Attorney & Health Tech Data Ethics Consultant
**Date:** 2026-03-09
**Scope:** Daily check-in data flow, partner data sharing, AI proxy health data handling
**Version Reviewed:** v1.6.0

---

## A. Strengths

The Easel team has made several privacy-conscious engineering decisions that are above-average for an early-stage femtech app:

1. **Timing-safe token comparison.** The proxy's `auth.ts` hashes both sides with SHA-256 before calling `timingSafeEqual`. This eliminates timing-based token enumeration — a detail most teams skip.

2. **Input sanitization before AI prompt injection.** `sanitizeInput()` strips control characters and newlines before inserting user-provided strings into MiniMax prompts. This is a meaningful defense against prompt injection, though not exhaustive (see Section B).

3. **Explicit column selection in every Supabase query.** `fetchPartnerDailyLog` selects only `mood, symptoms, log_date` — never `select('*')`. This limits accidental over-exposure of fields like `notes` (which exists in the schema but is not surfaced to Sun).

4. **SECURITY DEFINER functions with explicit `SET search_path`.** Migration 006 correctly locks down `my_couple_id()` and `my_partner_id()` against search_path hijacking — a PostgreSQL security best practice that many teams miss entirely.

5. **RLS on every table.** All 10 tables have Row Level Security enabled. The policies use scalar subquery wrapping `(SELECT public.my_partner_id())` for both performance and security. This is well-implemented.

6. **Rate limiting exists.** 30 req/min per IP with sliding window is a reasonable first layer against abuse, even with its in-memory limitations.

7. **No medical advice in AI prompts.** Every system prompt explicitly prohibits clinical or prescriptive health advice. This reduces liability exposure from AI-generated content.

---

## B. Critical Issues

### B1. Consent Model: Inadequate for Intimate Health Data Sharing

**Severity: CRITICAL**

The current design shares Moon's mood (1-5), symptoms (Cramps, Bloating, Headache, Fatigue, Tender, Mood swings, Spotting, Cravings), and daily log data with Sun automatically upon couple linking. There is no:

- Explicit consent screen explaining what data will be shared
- Granular toggle for Moon to control which data points Sun can see
- Ability to retroactively hide a specific day's data
- Notification to Moon that her data was viewed or sent to AI

**Why this matters legally:**

Under GDPR Article 6 (lawful basis for processing), "legitimate interest" of the couple relationship is not sufficient for processing *special category data* (health data falls under Article 9). You need **explicit consent** — not implied consent from linking accounts.

Under the proposed EU AI Act and emerging US state health data privacy laws (Washington's My Health My Data Act, Connecticut's health data provisions), health data used as input to AI systems requires specific, informed consent disclosing:
- What data is collected
- How it is processed (including AI inference)
- Who receives it (partner AND third-party AI service)
- Right to withdraw consent

**The couple link is not consent.** Agreeing to pair accounts is agreeing to a feature — it is not informed consent to share menstrual symptoms with a third-party AI service in China (MiniMax is a Chinese company headquartered in Shanghai).

**Recommendation:** Add a dedicated consent flow during onboarding that:
1. Clearly lists what data Moon shares with Sun
2. Discloses that data is processed by an external AI service
3. Allows Moon to toggle sharing granularity (mood only, symptoms only, both, neither)
4. Is re-accessible from Settings at any time
5. Records the consent timestamp in the database

### B2. Health Data Sent to Third-Party AI Without Disclosure

**Severity: CRITICAL**

Moon's mood and symptoms are sent to MiniMax M2.5 (a Chinese AI company) via the Vercel proxy for three endpoints:
- `/api/partner-advice` — Sun's advice card includes Moon's mood and symptoms
- `/api/daily-insight` — Moon's post-checkin insight
- `/api/phase-insight` — Moon's personalized phase explanation
- `/api/self-care` — Moon's self-care recommendation

**Regulatory implications:**

1. **GDPR cross-border transfer (Chapter V):** MiniMax is headquartered in Shanghai. Sending EU users' menstrual health data to a Chinese AI provider requires either Standard Contractual Clauses (SCCs) or an adequacy decision — neither of which China has. This is a potential violation of GDPR Articles 44-49.

2. **MiniMax's data retention:** What does MiniMax do with the prompt data? Does it train on it? Retain logs? The current implementation sends health data with zero contractual protections. You need a Data Processing Agreement (DPA) with MiniMax that explicitly:
   - Prohibits training on user health data
   - Specifies data retention and deletion obligations
   - Establishes sub-processor obligations

3. **Washington My Health My Data Act (effective March 2024):** Requires explicit consent before collecting, sharing, or selling consumer health data. Menstrual cycle data is explicitly in scope. Sending it to MiniMax without disclosure likely violates this law.

4. **No privacy policy exists.** The landing page has a "Privacy" footer link but it appears to be a placeholder (`href="#"`). You are collecting and processing special category health data with no published privacy policy. This is a compliance gap across virtually every jurisdiction.

**Recommendation:**
- Publish a privacy policy immediately (legal obligation, not optional)
- Add in-app disclosure about AI data processing
- Execute a DPA with MiniMax
- Consider whether the AI features could work with anonymized/de-identified data (strip user context, send only phase + generic symptom categories)

### B3. No Granular Sharing Controls for Moon

**Severity: HIGH**

Moon has zero control over what Sun sees from her daily check-in. The `fetchPartnerDailyLog` function returns mood + symptoms + log_date with no filtering layer. Consider these scenarios:

- Moon logs "Mood swings" and "Spotting" — does she want her boyfriend to see "Spotting" surfaced as an AI advice trigger?
- Moon logs a mood of 1 ("terrible") — the AI tells Sun "she's feeling terrible today, maybe bring her comfort food." Moon may not want this level of emotional transparency on a bad day.
- Moon is in an abusive relationship — the app becomes a surveillance tool with no off switch.

**The intimate partner violence (IPV) risk is real and documented in femtech.** Period tracking apps have been specifically called out by domestic violence advocacy organizations as potential tools of coercive control.

**Recommendation:**
- Add sharing granularity: "Share mood with partner" / "Share symptoms with partner" toggles
- Add a "private mode" that temporarily hides all check-in data from partner view
- Consider a "safety plan" feature — a hidden way to disable data sharing that doesn't visibly change the app's behavior to an abusive partner

### B4. No Data Lifecycle After Breakup

**Severity: HIGH**

There is no unlink/breakup flow in the codebase. The `couples.ts` data access layer has `createOrRefreshLinkCode` and `linkToPartnerByCode`, but no `unlinkCouple()` or `deletePartnerData()` function.

When a couple breaks up:
- Sun retains RLS-granted read access to Moon's daily_logs, period_logs, and cycle_settings indefinitely
- Historical daily_logs with mood and symptoms remain accessible
- No mechanism exists for Moon to revoke Sun's access
- No data deletion cascade for couple dissolution

Under GDPR Article 17 (Right to Erasure), Moon must be able to:
1. Revoke Sun's access to her health data
2. Request deletion of her data from the system
3. Have her data removed from any third-party systems (MiniMax logs, if retained)

**Recommendation:**
- Implement an unlink flow that immediately revokes RLS access
- Add a "delete my data" option that cascades through daily_logs, period_logs, cycle_settings
- Document the data deletion process in the privacy policy
- Consider auto-purging partner-accessible data after unlink with a grace period

### B5. Proxy Authentication Is Insufficient for Health Data

**Severity: HIGH**

The proxy uses a single shared `X-Client-Token` for all authentication. This means:
- Every app installation uses the same token
- Any client with the token can call any endpoint for any user
- There is no user-level authorization — the proxy cannot distinguish which user is making a request
- A leaked token (via APK decompilation, network inspection, or accidental exposure) grants full access to all AI endpoints
- The token is embedded in the app bundle (`EXPO_PUBLIC_CLIENT_TOKEN`) — it is public by definition

**This is not API authentication. It is a speed bump.** Any determined attacker can extract the token from the app binary in minutes.

For health data endpoints, you need:
- **User-level authentication:** Forward the Supabase JWT to the proxy and verify it
- **Request-level authorization:** Verify the requesting user has a valid couple relationship before processing partner data
- **Audit logging:** Record which user accessed which endpoint and when

**Recommendation:**
- Forward the Supabase access token to the proxy
- Verify the JWT on the proxy side (Supabase provides a JWT verification library)
- Log access to health-data-touching endpoints
- Treat the client token as a supplementary layer, not the primary auth

### B6. GDPR and Femtech Regulatory Gaps

**Severity: HIGH**

| Requirement | Status |
|---|---|
| Privacy policy | Missing (placeholder link) |
| Lawful basis for processing health data (Art. 9) | Not established — no explicit consent |
| Data Processing Agreement with MiniMax | Not in place |
| Cross-border transfer safeguards (Arts. 44-49) | Not in place (China has no adequacy) |
| Right to erasure (Art. 17) | No implementation |
| Right to data portability (Art. 20) | No implementation |
| Data Protection Impact Assessment (Art. 35) | Not conducted (mandatory for health data at scale) |
| Right to withdraw consent | No implementation |
| Data breach notification procedure | Not documented |
| Data retention policy | Not defined |
| Age verification | Not implemented |

**Femtech-specific risks:**
- The US FTC has taken enforcement actions against period tracking apps (Flo Health, 2021) for sharing health data with third parties without adequate disclosure
- Multiple US states now have specific health data privacy laws that explicitly include menstrual cycle data
- The EU Digital Services Act imposes additional transparency requirements for AI-generated content

---

## C. Missed Opportunities

### C1. Privacy as a Differentiator
Most period tracking apps have been caught sharing data inappropriately (Flo, Clue controversies). Easel could market itself as "the privacy-first couples period tracker" with:
- End-to-end encryption for daily logs
- On-device AI inference (small models can run on modern phones)
- Zero-knowledge architecture where the server never sees raw symptom data
- Published security audit results

### C2. Consent Receipts
Implement a "consent receipt" system where Moon can see exactly what was shared, when, and with whom — including AI processing events. This builds trust and satisfies GDPR's transparency obligations.

### C3. Data Minimization for AI
The AI prompts currently receive mood integers and symptom strings. Consider:
- Sending only the cycle phase to the AI (no personal health data)
- Using symptom *categories* instead of specific symptoms ("physical discomfort" instead of "Cramps, Bloating")
- Running a local model for the most sensitive personalizations

### C4. Transparency Dashboard
Add a settings screen showing Moon:
- What data Sun has accessed today
- What data was sent to the AI service
- A toggle to switch between "personalized" (AI uses her data) and "general" (AI uses only phase info) modes

### C5. Ephemeral Daily Logs
Offer an option for daily_logs to auto-expire after N days. A 90-day rolling window gives enough data for cycle tracking while limiting historical exposure.

---

## D. Quick Wins

These can be implemented in days, not weeks:

1. **Publish a basic privacy policy.** Even a minimal one is legally better than none. Template it from the FTC's guidelines for health apps. Replace the placeholder `href="#"` in the landing page.

2. **Add a data-sharing disclosure screen during couple linking.** Before Moon confirms the link, show: "Your partner will be able to see your daily mood and symptoms. You can change this in Settings." This establishes a consent moment.

3. **Strip user-identifying context from AI prompts.** The current prompts already avoid sending names or IDs to MiniMax. Verify this remains true and document it as a privacy control.

4. **Add `notes` column exclusion as an explicit security comment.** The `daily_logs` table has a `notes` field that is intentionally not shared with Sun (not selected in `fetchPartnerDailyLog`). Add a code comment making this a deliberate privacy decision so future developers don't accidentally include it.

5. **Implement a basic unlink flow.** Even a simple function that sets `couples.status = 'unlinked'` and updates RLS policies to check for `status = 'linked'` would close the biggest post-breakup privacy gap. The RLS policies already check for `status = 'linked'` in the `my_partner_id()` function — so unlinking the couple would immediately revoke data access.

6. **Add rate limiting per token, not just per IP.** Since all users share the same token, per-IP limiting is the only real throttle. When you add user-level auth, rate limit per user.

7. **Log AI data processing events.** Add a simple `ai_processing_log` table recording: user_id, endpoint, data_categories_sent (e.g., "mood,symptoms"), timestamp. This creates an audit trail with minimal effort.

---

## E. Rating: 4/10

**Breakdown:**

| Category | Score | Notes |
|---|---|---|
| Technical security | 6/10 | RLS, timing-safe auth, input sanitization, SECURITY DEFINER hardening |
| Consent & transparency | 2/10 | No consent flow, no privacy policy, no disclosure of AI data processing |
| Data lifecycle | 2/10 | No deletion, no retention policy, no unlink flow |
| Regulatory compliance | 2/10 | Missing privacy policy, no DPA, no DPIA, no cross-border safeguards |
| IPV/safety considerations | 1/10 | No private mode, no safety features, partner access is all-or-nothing |
| AI data ethics | 3/10 | Good prompt safety, but health data sent to third-party without disclosure |
| **Overall** | **4/10** | |

**Summary:** Easel's engineering team has solid security instincts at the infrastructure level — the RLS policies, timing-safe comparisons, and input sanitization are genuinely well done. However, the app processes intimate health data (menstrual symptoms, mood) with virtually no consent infrastructure, no privacy policy, no data processing agreements, and no user control over sharing. The gap between the technical security quality and the privacy/compliance posture is stark.

The most urgent actions are:
1. Publish a privacy policy (legal exposure is active right now)
2. Add a consent flow for health data sharing with partner
3. Disclose AI data processing to users
4. Execute a DPA with MiniMax (or evaluate alternative AI providers with better data protection guarantees)
5. Implement an unlink/data deletion flow

These are not "nice to have" improvements. In the current regulatory environment for femtech, they are baseline requirements for operating legally in the EU, Washington state, Connecticut, and an expanding list of jurisdictions.

---

*This review does not constitute legal advice. Easel should engage privacy counsel in its primary operating jurisdictions to formalize a compliance program.*
