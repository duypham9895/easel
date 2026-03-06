const MINIMAX_API_URL = 'https://api.minimax.io/v1/chat/completions';

/** Shared low-level call — keeps request boilerplate in one place. */
async function callMinimax(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const model = process.env.MINIMAX_MODEL ?? 'MiniMax-M25';
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
  const output = data.choices?.[0]?.message?.content?.trim();
  if (!output) throw new Error('Empty response from MiniMax');
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
  sweet_tooth: 'craving something sweet',
  need_a_hug: 'needing a hug and comfort',
  cramps_alert: 'having cramps and pain',
  quiet_time: 'needing quiet and alone time',
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
