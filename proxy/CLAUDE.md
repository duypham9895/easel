# proxy/ — Vercel Serverless AI Proxy

## Purpose
A lightweight Vercel serverless proxy that protects the MiniMax M2.5 API key and provides 7 AI-powered endpoints for the Easel mobile app. Implements 5-layer security (method check, token auth, rate limiting, input validation, error handling) and sophisticated prompt engineering for warm, phase-aware AI responses.

## Tech Stack
- **Runtime**: Vercel Serverless Functions (Node 20.x)
- **Language**: TypeScript (strict mode)
- **AI Model**: MiniMax M2.5 (via REST API)
- **Auth**: Static `X-Client-Token` header with timing-safe comparison
- **Rate Limiting**: In-memory sliding window (30 req/min per IP)

## Key Entry Points
1. `lib/minimax.ts` — All 6 AI prompt functions + MiniMax API caller (most important file)
2. `lib/auth.ts` — Token validation with `timingSafeEqual`
3. `lib/rateLimit.ts` — Sliding window rate limiter with lazy pruning
4. `api/*.ts` — 7 serverless endpoint handlers

## How to Run
```bash
cd proxy
npm install
vercel dev              # Local development server
vercel --prod           # Deploy to production
```

Required `.env` (see `.env.example`):
- `MINIMAX_API_KEY` — MiniMax API authentication
- `MINIMAX_MODEL` — Model name (default: MiniMax-M2.5)
- `CLIENT_TOKEN` — Shared secret matching app's `EXPO_PUBLIC_CLIENT_TOKEN`

## Key Dependencies
| Package | Purpose |
|---------|---------|
| `@vercel/node` | Vercel serverless function types |
| `typescript` | Type checking |
| `vercel` | CLI for local dev and deployment |

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/greeting` | Yes | Moon's daily phase-aware greeting |
| POST | `/api/partner-advice` | Yes | Sun's actionable phase tip |
| POST | `/api/sos-tip` | Yes | Sun's immediate SOS response tip |
| POST | `/api/daily-insight` | Yes | Moon's post-checkin insight |
| POST | `/api/whisper-options` | Yes | AI-generated whisper menu (4 options) |
| POST | `/api/predict-cycle` | Yes | Next period prediction + confidence |
| GET | `/api/health` | No | Health check + env validation |

## Conventions & Patterns

### 5-Layer Security (every endpoint)
1. **Method guard**: POST-only (405 on other methods)
2. **Token auth**: `X-Client-Token` validated with `timingSafeEqual`
3. **Rate limit**: 30 req/min per IP (sliding window)
4. **Input validation**: Whitelist enums, range checks, array bounds
5. **Error handling**: Generic messages to client, detailed logs server-side

### Prompt Engineering
- **Temperature varies by use case**: Creative (0.85-0.9) for greetings/options, practical (0.75-0.8) for advice, deterministic (0.1) for predictions
- **Strict output format**: Word/token caps in system prompt (e.g., "max 25 words")
- **Safety**: All prompts explicitly prohibit medical/clinical advice
- **Reasoning model handling**: Strips `<think>...</think>` blocks from MiniMax responses

### Response Format
```typescript
// Success: single meaningful field
res.status(200).json({ greeting: "..." })
res.status(200).json({ options: ["...", "...", "...", "..."] })

// Error: human-readable message
res.status(400).json({ error: "Invalid phase" })
```

### Input Validation
- Phases: enum `[menstrual, follicular, ovulatory, luteal]`
- Day in cycle: `1-45`
- SOS types: enum `[sweet, hug, pain, quiet]`
- String lengths: capped (e.g., phaseTagline max 50 chars)
- Arrays: max items + max element length

## Gotchas
- **Rate limiter is per-instance**: Resets on cold start, doesn't share across Vercel instances. Acceptable for current scale; upgrade to Vercel KV for distributed limiting.
- **SOS type mapping**: App sends short IDs (`sweet`, `hug`, `pain`, `quiet`) — not the full SOS option IDs from the app constants
- **Whisper options parsing**: Falls back from JSON.parse to regex extraction if AI returns non-JSON
- **No response caching**: Every request hits MiniMax API — no deduplication layer
- **vercel.json security headers**: Applied globally to `/api/*` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)

## Notes for Claude
- Read `lib/minimax.ts` first — it contains all prompt engineering and is the core value of this service
- Each `api/*.ts` file follows an identical pattern: method check → auth → rate limit → validate → call minimax → respond
- When adding a new endpoint: copy an existing one, add a new function to `minimax.ts`, follow the same 5-layer pattern
- Token comparison uses SHA256 hashing + `timingSafeEqual` — never change to simple `===`
- The `callMinimax()` function handles the raw HTTP call, think-block stripping, and error wrapping
- All errors logged with `console.error('[endpoint-name] error:', err)` pattern
