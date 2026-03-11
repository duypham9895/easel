const MINIMAX_API_URL = 'https://api.minimax.io/v1/chat/completions';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  vi: 'Vietnamese',
};

/** Mood value → label mapping. Must match app UI labels in i18n/en/checkin.json. */
const MOOD_LABELS = ['low', 'meh', 'okay', 'good', 'great'] as const;
/** Returns the language instruction to append to system prompts. */
function langInstruction(lang: string): string {
  const name = LANGUAGE_NAMES[lang] ?? 'English';
  return `\nIMPORTANT: You MUST respond entirely in ${name}.`;
}

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
  phaseTagline: string,
  language = 'en'
): Promise<string> {
  const system = `You are a warm, empathetic companion inside a period-tracking app for couples called Easel.
Write a single short greeting (1–2 sentences, max 25 words) that:
- Acknowledges where the user is in her cycle with warmth, zero clinical coldness
- Feels personal, like a close friend who genuinely cares
- Matches the emotional tone of the phase
- Never uses medical jargon or prescriptive health advice
- Ends on a gentle, uplifting note
Respond with ONLY the greeting text — no quotes, no label, no extra explanation.${langInstruction(language)}`;

  const user = `Phase: ${phase} | Day: ${dayInCycle} | Theme: ${phaseTagline}\nWrite the greeting.`;

  return callMinimax(system, user, 80, 0.85);
}

// ---------------------------------------------------------------------------
// 2. BF personalized advice card
// ---------------------------------------------------------------------------
export async function generatePartnerAdvice(
  phase: string,
  dayInCycle: number,
  phaseTagline: string,
  language = 'en',
  mood?: number | null,
  symptoms?: string[]
): Promise<string> {
  const hasMoodData = mood != null || (symptoms && symptoms.length > 0);
  const moodLabel = mood
    ? MOOD_LABELS[mood - 1]
    : null;
  const symptomText = symptoms && symptoms.length > 0 ? symptoms.join(', ') : null;

  const moodAwareness = hasMoodData
    ? `\n- She checked in today: ${moodLabel ? `mood is "${moodLabel}"` : ''}${moodLabel && symptomText ? ', ' : ''}${symptomText ? `experiencing: ${symptomText}` : ''} — weave awareness of how she ACTUALLY feels into your advice`
    : '';

  const system = `You are an empathy coach advising a caring boyfriend whose girlfriend is tracking her cycle using Easel.
Write 2–3 warm, specific, actionable sentences (max 45 words) telling him what to do or say TODAY.
Rules:
- Be concrete — not "be supportive" but "send her a voice note tonight instead of texting"
- Match the energy of her phase (quiet during menstrual, adventurous during follicular, etc.)
- Sound like a wise friend, not a self-help book
- No medical advice${moodAwareness}
Respond with ONLY the advice text.${langInstruction(language)}`;

  const userMoodLine = hasMoodData
    ? `\nHer mood today: ${moodLabel ?? 'not rated'} | Symptoms: ${symptomText ?? 'none'}`
    : '';
  const user = `Her phase: ${phase} | Day ${dayInCycle} of cycle | Theme: ${phaseTagline}${userMoodLine}\nWhat should he do today?`;

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
  dayInCycle: number,
  language = 'en'
): Promise<string> {
  const sosLabel = SOS_LABELS[sosType] ?? 'needing support';

  const system = `You are advising a boyfriend who just received an SOS signal from his girlfriend via the Easel app.
Write exactly 1–2 sentences (max 30 words) with ONE specific, immediate action he should take right now.
Rules:
- Be concrete and physical — something he can do in the next 10 minutes
- Warm, not clinical
- Acknowledge her current phase context
Respond with ONLY the action tip — no intro, no label.${langInstruction(language)}`;

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
  symptoms: string[],
  language = 'en'
): Promise<string> {
  const moodLabel = mood
    ? MOOD_LABELS[mood - 1]
    : 'not rated';
  const symptomText = symptoms.length > 0 ? symptoms.join(', ') : 'none logged';

  const system = `You are a warm, knowledgeable companion inside a period-tracking app called Easel.
The user just logged how she feels today. Write 1–2 supportive sentences (max 35 words) that:
- Validate how she is feeling without being dismissive
- Connect her symptoms/mood to her current cycle phase in a normalizing way
- Offer one gentle, practical suggestion (not medical advice)
- Sound like a caring friend, not a health app
Respond with ONLY the insight text.${langInstruction(language)}`;

  const user = `Phase: ${phase} | Day: ${dayInCycle}\nMood today: ${moodLabel}\nSymptoms: ${symptomText}\nWrite the insight.`;

  return callMinimax(system, user, 90, 0.8);
}

// ---------------------------------------------------------------------------
// 5. GF personalized phase insight (replaces static "About this Phase")
// ---------------------------------------------------------------------------
export async function generatePersonalizedPhaseInsight(
  phase: string,
  dayInCycle: number,
  mood: number | null,
  symptoms: string[],
  language = 'en'
): Promise<string> {
  const moodLabel = mood
    ? MOOD_LABELS[mood - 1]
    : 'not rated';
  const symptomText = symptoms.length > 0 ? symptoms.join(', ') : 'none logged';

  const system = `You are a warm, knowledgeable companion inside a period-tracking app called Easel.
The user just checked in and wants to understand what her body is going through today. Write 1–2 sentences (max 50 words) that:
- Explain what is happening in her body during this phase in a warm, normalizing way
- Personalize the explanation based on her mood and symptoms — connect what she is experiencing to what is typical for this phase
- Make her feel understood and informed, not anxious
- Sound like a caring friend who knows biology, not a textbook
- No medical advice
Respond with ONLY the insight text.${langInstruction(language)}`;

  const user = `Phase: ${phase} | Day: ${dayInCycle}\nMood today: ${moodLabel}\nSymptoms: ${symptomText}\nExplain what her body is doing today.`;

  return callMinimax(system, user, 100, 0.8);
}

// ---------------------------------------------------------------------------
// 6. GF personalized self-care advice (replaces static "Self-Care" tips)
// ---------------------------------------------------------------------------
export async function generatePersonalizedSelfCare(
  phase: string,
  dayInCycle: number,
  mood: number | null,
  symptoms: string[],
  language = 'en'
): Promise<string> {
  const moodLabel = mood
    ? MOOD_LABELS[mood - 1]
    : 'not rated';
  const symptomText = symptoms.length > 0 ? symptoms.join(', ') : 'none logged';

  const system = `You are a warm self-care companion inside a period-tracking app called Easel.
Based on the user's current cycle phase, mood, and symptoms, suggest ONE specific, actionable self-care activity in 1–2 sentences (max 50 words).
Rules:
- Be concrete — not "take care of yourself" but "try a 10-minute warm bath with lavender tonight"
- Match the activity to her current state: gentle for low energy, active for high energy
- Personalize based on her reported symptoms and mood
- Sound like a thoughtful friend, not a wellness app
- No medical advice
Respond with ONLY the self-care suggestion.${langInstruction(language)}`;

  const user = `Phase: ${phase} | Day: ${dayInCycle}\nMood today: ${moodLabel}\nSymptoms: ${symptomText}\nSuggest one self-care activity.`;

  return callMinimax(system, user, 100, 0.8);
}

// ---------------------------------------------------------------------------
// 7. Moon Whisper options — AI-generated per cycle phase
// ---------------------------------------------------------------------------
export async function generateWhisperOptions(
  phase: string,
  dayInCycle: number,
  topSelections: string[],
  language = 'en'
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
- Return ONLY a valid JSON array of exactly 4 strings, no other text${langInstruction(language)}`;

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

// ---------------------------------------------------------------------------
// 8. Cycle health insight — explain deviations with warmth
// ---------------------------------------------------------------------------
interface CycleHealthDeviation {
  type: 'early' | 'late';
  daysDifference: number;
  cycleHistory: {
    avgCycleLength: number;
    variability: number;
    confidence: 'high' | 'medium' | 'low';
    recentCycleLengths: number[];
  };
}

interface CycleHealthUserContext {
  recentStress: 'low' | 'moderate' | 'high' | null;
  sleepChanges: boolean;
  dietChanges: boolean;
  exerciseChanges: boolean;
  travelRecent: boolean;
}

export interface CycleHealthInsightResult {
  explanation: string;
  suggestions: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  shouldSuggestDoctor: boolean;
  doctorReason: string | null;
}

function buildCycleHealthPrompt(
  deviation: CycleHealthDeviation,
  userContext: CycleHealthUserContext,
  language: string
): { system: string; user: string } {
  const reportedFactors: string[] = [];
  if (userContext.recentStress && userContext.recentStress !== 'low') {
    reportedFactors.push(`stress level: ${userContext.recentStress}`);
  }
  if (userContext.sleepChanges) reportedFactors.push('recent sleep changes');
  if (userContext.dietChanges) reportedFactors.push('recent diet changes');
  if (userContext.exerciseChanges) reportedFactors.push('recent exercise changes');
  if (userContext.travelRecent) reportedFactors.push('recent travel');

  const factorsText = reportedFactors.length > 0
    ? reportedFactors.join(', ')
    : 'no specific lifestyle changes reported';

  // Determine if doctor suggestion is warranted based on data alone
  // (AI will also assess, but we pre-compute for the prompt)
  const recentLengths = deviation.cycleHistory.recentCycleLengths;
  const hasConsecutiveIrregular = recentLengths.length >= 3 && recentLengths.slice(-3).every(
    (len) => Math.abs(len - deviation.cycleHistory.avgCycleLength) > 7
  );
  const isLargeDeviation = deviation.daysDifference >= 14;

  const system = `You are a warm, empathetic health companion (NOT a doctor) inside a period-tracking app called Easel.
Knowledge base:
- Stress raises cortisol → suppresses GnRH → delays ovulation → shifts period
- Only 13% of cycles are exactly 28 days; normal range: 24-38 days
- PCOS (10-13% of women) and thyroid disorders are top medical causes of irregularity
- Travel, sleep shifts, diet changes disrupt circadian hormones → delay periods
- Moderate exercise helps; excessive exercise can suppress cycles
- Weight changes in either direction affect estrogen/progesterone balance

Rules:
- Warm, normalizing tone — like a knowledgeable friend, never clinical or scary
- Connect reported lifestyle factors to the deviation using the knowledge base
- ALWAYS end with: "This is not medical advice"
- Return ONLY valid JSON matching this exact shape:
{"explanation":"string","suggestions":[{"icon":"emoji","title":"string","description":"string"}],"shouldSuggestDoctor":boolean,"doctorReason":"string or null"}
- suggestions: exactly 2-3 items, each title max 6 words, description max 25 words
- shouldSuggestDoctor: true if ${hasConsecutiveIrregular ? '3+ consecutive irregular cycles detected' : isLargeDeviation ? 'deviation is 14+ days' : 'patterns suggest a medical check would be wise'}; false otherwise
- doctorReason: a gentle, non-alarming reason if shouldSuggestDoctor is true, otherwise null
- explanation: max 60 words, warm and reassuring${langInstruction(language)}`;

  const user = `Period came ${deviation.daysDifference} days ${deviation.type} than expected.
Average cycle: ${deviation.cycleHistory.avgCycleLength} days | Variability: ${deviation.cycleHistory.variability} days | Confidence: ${deviation.cycleHistory.confidence}
Recent cycle lengths: ${recentLengths.join(', ')} days
Reported factors: ${factorsText}
${hasConsecutiveIrregular ? 'Note: 3+ consecutive irregular cycles detected.' : ''}
${isLargeDeviation ? 'Note: Deviation is 14+ days from expected.' : ''}
Provide the health insight as JSON.`;

  return { system, user };
}

export async function generateCycleHealthInsight(
  deviation: CycleHealthDeviation,
  userContext: CycleHealthUserContext,
  language = 'en'
): Promise<CycleHealthInsightResult> {
  const { system, user } = buildCycleHealthPrompt(deviation, userContext, language);

  const raw = await callMinimax(system, user, 350, 0.75);
  try {
    const parsed = JSON.parse(raw) as CycleHealthInsightResult;
    if (
      typeof parsed.explanation !== 'string' ||
      !Array.isArray(parsed.suggestions) ||
      parsed.suggestions.length < 2 ||
      parsed.suggestions.length > 3 ||
      typeof parsed.shouldSuggestDoctor !== 'boolean'
    ) {
      throw new Error('Invalid response shape');
    }
    for (const s of parsed.suggestions) {
      if (typeof s.icon !== 'string' || typeof s.title !== 'string' || typeof s.description !== 'string') {
        throw new Error('Invalid suggestion shape');
      }
    }
    if (parsed.shouldSuggestDoctor && typeof parsed.doctorReason !== 'string') {
      throw new Error('Missing doctorReason when shouldSuggestDoctor is true');
    }
    return {
      ...parsed,
      doctorReason: parsed.shouldSuggestDoctor ? parsed.doctorReason : null,
    };
  } catch {
    throw new Error(`Failed to parse cycle health insight: ${raw.slice(0, 200)}`);
  }
}
