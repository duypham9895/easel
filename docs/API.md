# Easel — Proxy API Reference

The Vercel serverless proxy protects the MiniMax API key and provides all AI-powered endpoints to the mobile app.

**Base URL**: `https://<your-deployment>.vercel.app`

---

## Authentication

Every request (except `GET /api/health`) must include:

```
X-Client-Token: <CLIENT_TOKEN>
```

`CLIENT_TOKEN` is a 32-byte hex secret set in both the Vercel environment and the app's `.env` file. Requests without a valid token return `401 Unauthorized`.

---

## Rate Limiting

10 requests per minute per IP address. Exceeding the limit returns `429 Too Many Requests`.

---

## Endpoints

### `GET /api/health`

Health check. No auth required.

**Response `200`**
```json
{ "status": "ok" }
```

---

### `POST /api/greeting`

Generate a warm, phase-aware greeting for Moon's dashboard.

**Request body**
```json
{
  "phase": "menstrual",       // required: "menstrual" | "follicular" | "ovulatory" | "luteal"
  "dayInCycle": 3,            // required: integer 1–45
  "phaseTagline": "Rest & Restore"  // required: string
}
```

**Response `200`**
```json
{ "greeting": "Your body is doing so much right now — let yourself rest fully today." }
```

**Errors**
| Status | Body | Cause |
|---|---|---|
| 400 | `{ "error": "Invalid phase" }` | `phase` not in allowed set |
| 400 | `{ "error": "Invalid dayInCycle" }` | Outside 1–45 range |
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid X-Client-Token |
| 405 | `{ "error": "Method not allowed" }` | Not POST |
| 429 | `{ "error": "Too many requests" }` | Rate limit exceeded |
| 502 | `{ "error": "AI service unavailable" }` | MiniMax API error |

**AI prompt**: 1–2 sentences, max 25 words. Warm, personal, phase-aware. No medical jargon.

---

### `POST /api/partner-advice`

Generate personalised daily advice for Sun on how to support Moon.

**Request body**
```json
{
  "phase": "luteal",          // required
  "dayInCycle": 22,           // required: integer 1–45
  "phaseTagline": "Wind Down" // required: string
}
```

**Response `200`**
```json
{ "advice": "She is winding down — pick up her favourite snacks on your way home and skip any big plans tonight." }
```

**AI prompt**: 2–3 sentences, max 45 words. Concrete, phase-matched actions. Not generic "be supportive" advice.

---

### `POST /api/sos-tip`

Generate a single immediate action tip for Sun when they receive a Whisper/SOS signal.

**Request body**
```json
{
  "sosType": "hug",           // required: string (SOSOption.id)
  "phase": "menstrual",       // required
  "dayInCycle": 2             // required: integer 1–45
}
```

**Response `200`**
```json
{ "tip": "Go to her now and hold her — no words needed, just presence." }
```

**AI prompt**: 1–2 sentences, max 30 words. ONE concrete action he can take in the next 10 minutes.

---

### `POST /api/daily-insight`

Generate a personalised insight for Moon after she submits her daily mood + symptom check-in.

**Request body**
```json
{
  "phase": "follicular",        // required
  "dayInCycle": 8,              // required: integer 1–45
  "mood": 4,                    // optional: integer 1–5 (1=terrible, 5=great)
  "symptoms": ["bloating", "fatigue"]  // optional: string[] max 10 items, 30 chars each
}
```

**Response `200`**
```json
{ "insight": "Your body is already starting to energise — the bloating you feel now will ease in a day or two as follicular energy picks up." }
```

**AI prompt**: 1–2 sentences, max 35 words. Validates feelings, normalises symptoms in context of phase, one gentle practical suggestion.

---

### `POST /api/whisper-options`

Generate 4 phase-appropriate Whisper options for Moon's send sheet.

**Request body**
```json
{
  "phase": "ovulatory",         // required
  "dayInCycle": 15,             // required: integer 1–45
  "topSelections": ["hug", "date"]  // optional: Moon's past top picks for personalisation
}
```

**Response `200`**
```json
{ "options": ["Date night", "Dance with me", "Kiss me", "Compliment me"] }
```

Each option is 2–5 words. Matched to phase energy (quiet for menstrual, vibrant for ovulatory, cosy for luteal).

**Fallback**: If AI response cannot be parsed as a 4-element string array, the endpoint returns `502`. The app falls back to the static `WHISPER_OPTIONS` for the current phase.

---

### `POST /api/predict-cycle`

Analyse Moon's historical period log to predict her next period date with confidence scoring.

**Request body**
```json
{
  "cycleHistory": [
    { "startDate": "2025-12-01", "endDate": "2025-12-05", "length": 28 },
    { "startDate": "2025-12-29", "endDate": "2026-01-03", "length": 29 },
    { "startDate": "2026-01-27", "endDate": "2026-02-01" }
  ]
}
```

Each entry: `startDate` (required), `endDate` (optional), `length` (optional).

**Response `200`**
```json
{
  "predictedDate": "2026-02-24",
  "confidence": 82,
  "confidenceLabel": "high",
  "notifyDaysBefore": 2
}
```

| `confidenceLabel` | `confidence` range | `notifyDaysBefore` |
|---|---|---|
| `high` | > 80 | 2 |
| `medium` | 50–80 | 4 |
| `low` | < 50 | 7 |

**AI prompt**: Returns strict JSON. Temperature set to `0.1` for maximum determinism.

---

## Error Response Format

All errors return JSON:
```json
{ "error": "Human-readable message" }
```

---

## Local Development

```bash
cd proxy
cp .env.example .env
# Fill in MINIMAX_API_KEY, MINIMAX_MODEL, CLIENT_TOKEN
npm install
vercel dev
```

The proxy runs at `http://localhost:3000` in dev mode.

```bash
# Test greeting endpoint
curl -X POST http://localhost:3000/api/greeting \
  -H "Content-Type: application/json" \
  -H "X-Client-Token: YOUR_TOKEN" \
  -d '{"phase":"follicular","dayInCycle":7,"phaseTagline":"Rising Energy"}'
```

---

## Security Notes

- `CLIENT_TOKEN` must be generated with `openssl rand -hex 32` — never use a human-readable password.
- The same `CLIENT_TOKEN` value is set in **both** Vercel env vars AND the app's `EXPO_PUBLIC_CLIENT_TOKEN` `.env` field.
- `MINIMAX_API_KEY` is **only** set in Vercel. It is never in the app binary.
- Rate limiting is in-memory and resets on cold start. For production scale, replace with a persistent store (Redis / KV).
