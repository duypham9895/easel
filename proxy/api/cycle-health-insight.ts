import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateClientToken } from '../lib/auth';
import { isRateLimited, maybePrune } from '../lib/rateLimit';
import { generateCycleHealthInsight } from '../lib/minimax';

const VALID_DEVIATION_TYPES = new Set(['early', 'late']);
const VALID_CONFIDENCE_LEVELS = new Set(['high', 'medium', 'low']);
const VALID_STRESS_LEVELS = new Set(['low', 'moderate', 'high']);
const VALID_LANGUAGES = new Set(['en', 'vi']);
const MAX_DAYS_DIFFERENCE = 60;
const MAX_AVG_CYCLE_LENGTH = 60;
const MAX_VARIABILITY = 30;
const MAX_RECENT_CYCLES = 24;
const MIN_CYCLE_LENGTH = 10;
const MAX_CYCLE_LENGTH = 90;

function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['x-client-token'];
  if (!validateClientToken(typeof token === 'string' ? token : undefined)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  maybePrune();
  if (isRateLimited(getClientIP(req))) return res.status(429).json({ error: 'Too many requests' });

  const { deviation, userContext, language } = req.body ?? {};

  // --- Validate deviation ---
  if (typeof deviation !== 'object' || deviation === null) {
    return res.status(400).json({ error: 'deviation is required and must be an object' });
  }
  if (typeof deviation.type !== 'string' || !VALID_DEVIATION_TYPES.has(deviation.type)) {
    return res.status(400).json({ error: 'deviation.type must be "early" or "late"' });
  }
  const absDaysDiff = typeof deviation.daysDifference === 'number' ? Math.abs(deviation.daysDifference) : NaN;
  if (isNaN(absDaysDiff) || absDaysDiff < 1 || absDaysDiff > MAX_DAYS_DIFFERENCE) {
    return res.status(400).json({ error: `deviation.daysDifference must be a non-zero number with absolute value between 1 and ${MAX_DAYS_DIFFERENCE}` });
  }

  // --- Validate cycleHistory within deviation ---
  const { cycleHistory } = deviation;
  if (typeof cycleHistory !== 'object' || cycleHistory === null) {
    return res.status(400).json({ error: 'deviation.cycleHistory is required and must be an object' });
  }
  if (typeof cycleHistory.avgCycleLength !== 'number' || cycleHistory.avgCycleLength < 1 || cycleHistory.avgCycleLength > MAX_AVG_CYCLE_LENGTH) {
    return res.status(400).json({ error: 'deviation.cycleHistory.avgCycleLength must be a number between 1 and 60' });
  }
  if (typeof cycleHistory.variability !== 'number' || cycleHistory.variability < 0 || cycleHistory.variability > MAX_VARIABILITY) {
    return res.status(400).json({ error: 'deviation.cycleHistory.variability must be a number between 0 and 30' });
  }
  if (typeof cycleHistory.confidence !== 'string' || !VALID_CONFIDENCE_LEVELS.has(cycleHistory.confidence)) {
    return res.status(400).json({ error: 'deviation.cycleHistory.confidence must be "high", "medium", or "low"' });
  }
  if (!Array.isArray(cycleHistory.recentCycleLengths)) {
    return res.status(400).json({ error: 'deviation.cycleHistory.recentCycleLengths must be an array' });
  }
  if (cycleHistory.recentCycleLengths.length > MAX_RECENT_CYCLES) {
    return res.status(400).json({ error: `deviation.cycleHistory.recentCycleLengths must contain at most ${MAX_RECENT_CYCLES} entries` });
  }
  for (let i = 0; i < cycleHistory.recentCycleLengths.length; i++) {
    const len = cycleHistory.recentCycleLengths[i];
    if (typeof len !== 'number' || !Number.isInteger(len) || len < MIN_CYCLE_LENGTH || len > MAX_CYCLE_LENGTH) {
      return res.status(400).json({ error: `deviation.cycleHistory.recentCycleLengths[${i}] must be an integer between ${MIN_CYCLE_LENGTH} and ${MAX_CYCLE_LENGTH}` });
    }
  }

  // --- Validate userContext ---
  if (typeof userContext !== 'object' || userContext === null) {
    return res.status(400).json({ error: 'userContext is required and must be an object' });
  }
  if (userContext.recentStress !== null && (typeof userContext.recentStress !== 'string' || !VALID_STRESS_LEVELS.has(userContext.recentStress))) {
    return res.status(400).json({ error: 'userContext.recentStress must be "low", "moderate", "high", or null' });
  }
  if (typeof userContext.sleepChanges !== 'boolean') {
    return res.status(400).json({ error: 'userContext.sleepChanges must be a boolean' });
  }
  if (typeof userContext.dietChanges !== 'boolean') {
    return res.status(400).json({ error: 'userContext.dietChanges must be a boolean' });
  }
  if (typeof userContext.exerciseChanges !== 'boolean') {
    return res.status(400).json({ error: 'userContext.exerciseChanges must be a boolean' });
  }
  if (typeof userContext.travelRecent !== 'boolean') {
    return res.status(400).json({ error: 'userContext.travelRecent must be a boolean' });
  }

  // --- Validate language ---
  const lang = typeof language === 'string' && VALID_LANGUAGES.has(language) ? language : 'en';

  try {
    const result = await generateCycleHealthInsight(
      {
        type: deviation.type,
        daysDifference: deviation.daysDifference,
        cycleHistory: {
          avgCycleLength: cycleHistory.avgCycleLength,
          variability: cycleHistory.variability,
          confidence: cycleHistory.confidence,
          recentCycleLengths: cycleHistory.recentCycleLengths,
        },
      },
      {
        recentStress: userContext.recentStress,
        sleepChanges: userContext.sleepChanges,
        dietChanges: userContext.dietChanges,
        exerciseChanges: userContext.exerciseChanges,
        travelRecent: userContext.travelRecent,
      },
      lang
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error('[cycle-health-insight] error:', err);
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}
