const MINIMAX_API_URL = 'https://api.minimax.io/v1/chat/completions';

/** Shared low-level call — keeps request boilerplate in one place. */
async function callMinimax(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const model = process.env.MINIMAX_MODEL ?? 'MiniMax-M2.5';
  if (!apiKey) throw new Error('MINIMAX_API_KEY not set');

  const res = await fetch(MINIMAX_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MiniMax API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from MiniMax');

  // Strip <think>...</think> blocks emitted by reasoning models (e.g. MiniMax-M2.5)
  const output = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (!output) throw new Error('Empty response from MiniMax after stripping reasoning block');
  return output;
}


/**
 * Generate a warm, empathetic greeting from MiniMax M25 for the Easel app.
 *
 * @param phase      - Current cycle phase (menstrual | follicular | ovulatory | luteal)
 * @param dayInCycle - Day number within the current cycle
 * @param phaseTagline - Short tagline for the phase (e.g. "Rest & Restore")
 * @param signal     - AbortSignal for request cancellation
 */
// ---------------------------------------------------------------------------
// 1. GF daily greeting
// ---------------------------------------------------------------------------
export async function generateGreeting(
  phase: string,
  dayInCycle: number,
  phaseTagline: string
): Promise<string> {
  const system = `You are a warm, empathetic companion inside a period-tracking app for couples called Easel.
Write a single short greeting (1–2 sentences, max 25 words) that:
- Acknowledges where the user is in her cycle with warmth, zero clinical coldness
- Feels personal, like a close friend who genuinely cares
- Matches the emotional tone of the phase
- Never uses medical jargon or prescriptive health advice
- Ends on a gentle, uplifting note
Respond with ONLY the greeting text — no quotes, no label, no extra explanation.`;

  const user = `Phase: ${phase} | Day: ${dayInCycle} | Theme: ${phaseTagline}\nWrite the greeting.`;

  return callMinimax(system, user, 80, 0.85);
}

// ---------------------------------------------------------------------------
// 2. BF personalized advice card
// ---------------------------------------------------------------------------
export async function generatePartnerAdvice(
  phase: string,
  dayInCycle: number,
  phaseTagline: string
): Promise<string> {
  const system = `You are an empathy coach advising a caring boyfriend whose girlfriend is tracking her cycle using Easel.
Write 2–3 warm, specific, actionable sentences (max 45 words) telling him what to do or say TODAY.
Rules:
- Be concrete — not "be supportive" but "send her a voice note tonight instead of texting"
- Match the energy of her phase (quiet during menstrual, adventurous during follicular, etc.)
- Sound like a wise friend, not a self-help book
- No medical advice
Respond with ONLY the advice text.`;

  const user = `Her phase: ${phase} | Day ${dayInCycle} of cycle | Theme: ${phaseTagline}\nWhat should he do today?`;

  return callMinimax(system, user, 100, 0.8);
}

// ---------------------------------------------------------------------------
// 3. BF SOS action tip
// ---------------------------------------------------------------------------
const SOS_LABELS: Record<string, string> = {
  sweet: 'craving something sweet',
  hug: 'needing a hug and comfort',
  pain: 'having cramps and pain',
  quiet: 'needing quiet and alone time',
};

export async function generateSOSTip(
  sosType: string,
  phase: string,
  dayInCycle: number
): Promise<string> {
  const sosLabel = SOS_LABELS[sosType] ?? 'needing support';

  const system = `You are advising a boyfriend who just received an SOS signal from his girlfriend via the Easel app.
Write exactly 1–2 sentences (max 30 words) with ONE specific, immediate action he should take right now.
Rules:
- Be concrete and physical — something he can do in the next 10 minutes
- Warm, not clinical
- Acknowledge her current phase context
Respond with ONLY the action tip — no intro, no label.`;

  const user = `SOS: she is ${sosLabel}.\nHer phase: ${phase} (day ${dayInCycle}).\nWhat is the ONE thing he should do right now?`;

  return callMinimax(system, user, 70, 0.75);
}

// ---------------------------------------------------------------------------
// 4. GF daily insight (after mood + symptom check-in)
// ---------------------------------------------------------------------------
export async function generateDailyInsight(
  phase: string,
  dayInCycle: number,
  mood: number | null,
  symptoms: string[]
): Promise<string> {
  const moodLabel = mood
    ? ['terrible', 'low', 'okay', 'good', 'great'][mood - 1]
    : 'not rated';
  const symptomText = symptoms.length > 0 ? symptoms.join(', ') : 'none logged';

  const system = `You are a warm, knowledgeable companion inside a period-tracking app called Easel.
The user just logged how she feels today. Write 1–2 supportive sentences (max 35 words) that:
- Validate how she is feeling without being dismissive
- Connect her symptoms/mood to her current cycle phase in a normalizing way
- Offer one gentle, practical suggestion (not medical advice)
- Sound like a caring friend, not a health app
Respond with ONLY the insight text.`;

  const user = `Phase: ${phase} | Day: ${dayInCycle}\nMood today: ${moodLabel}\nSymptoms: ${symptomText}\nWrite the insight.`;

  return callMinimax(system, user, 90, 0.8);
}

// ---------------------------------------------------------------------------
// 5. Moon Whisper options — AI-generated per cycle phase
// ---------------------------------------------------------------------------
export async function generateWhisperOptions(
  phase: string,
  dayInCycle: number,
  topSelections: string[]
): Promise<string[]> {
  const selectionContext = topSelections.length > 0
    ? `Her most frequent requests: ${topSelections.slice(0, 5).join(', ')}.`
    : '';

  const system = `You generate Whisper options for the Easel app — short, intimate signals Moon sends to Sun when she needs something.
Generate exactly 4 warm options matching her current cycle phase.
Rules:
- Each option is 2-5 words maximum (e.g. "Need a hug", "Bring me chocolate")
- Match phase energy: quiet/gentle for menstrual, curious for follicular, vibrant for ovulatory, cosy for luteal
- Sound personal and intimate, never clinical
- Return ONLY a valid JSON array of exactly 4 strings, no other text`;

  const user = `Phase: ${phase} | Day ${dayInCycle}
${selectionContext}
Generate 4 Whisper options as JSON array.`;

  const raw = await callMinimax(system, user, 120, 0.9);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 4 && parsed.every(s => typeof s === 'string')) {
      return parsed;
    }
  } catch { /* fall through */ }
  // Fallback: extract quoted strings
  const matches = raw.match(/"([^"]{2,30})"/g);
  if (matches && matches.length >= 4) {
    return matches.slice(0, 4).map(s => s.replace(/"/g, ''));
  }
  throw new Error('Failed to parse Whisper options from AI response');
}

// ---------------------------------------------------------------------------
// 6. Cycle prediction with AI confidence scoring
// ---------------------------------------------------------------------------
interface CycleEntry {
  startDate: string;
  endDate?: string | null;
  length?: number | null;
}

export interface CyclePredictionResult {
  predictedDate: string;
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  notifyDaysBefore: number;
}

export async function generateCyclePrediction(
  cycleHistory: CycleEntry[]
): Promise<CyclePredictionResult> {
  const historyText = cycleHistory
    .map((c, i) => `Cycle ${i + 1}: start=${c.startDate}${c.endDate ? `, end=${c.endDate}` : ''}${c.length ? `, length=${c.length}d` : ''}`)
    .join('\n');

  const today = new Date().toISOString().split('T')[0];

  const system = `You analyze menstrual cycle data to predict the next period start date. Today is ${today}.
Based on the cycle history, output:
1. predictedDate: next predicted period start (YYYY-MM-DD, must be in the future)
2. confidence: 0-100 based on regularity (high variance = low confidence)
3. confidenceLabel: "high" if confidence>80, "medium" if 50-80, "low" if below 50
4. notifyDaysBefore: 2 for high, 4 for medium, 7 for low
Return ONLY valid JSON, no other text:
{"predictedDate":"YYYY-MM-DD","confidence":85,"confidenceLabel":"high","notifyDaysBefore":2}`;

  const user = `Cycle history (oldest first):\n${historyText}\n\nPredict next period.`;

  const raw = await callMinimax(system, user, 120, 0.1);
  try {
    const parsed = JSON.parse(raw) as CyclePredictionResult;
    if (typeof parsed.predictedDate !== 'string' || typeof parsed.confidence !== 'number') {
      throw new Error('Invalid response shape');
    }
    return parsed;
  } catch {
    throw new Error(`Failed to parse cycle prediction: ${raw.slice(0, 100)}`);
  }
}
