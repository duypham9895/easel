import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateClientToken } from '../lib/auth';
import { isRateLimited, maybePrune } from '../lib/rateLimit';
import { generateCyclePrediction } from '../lib/minimax';
import { sanitizeInput } from '../lib/sanitize';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MIN_HISTORY = 1;
const MAX_HISTORY = 36;
const MIN_LENGTH = 1;
const MAX_LENGTH = 60;

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

  const { cycleHistory } = req.body ?? {};

  if (!Array.isArray(cycleHistory)) {
    return res.status(400).json({ error: 'cycleHistory is required and must be an array' });
  }
  if (cycleHistory.length < MIN_HISTORY || cycleHistory.length > MAX_HISTORY) {
    return res.status(400).json({ error: `cycleHistory must contain between ${MIN_HISTORY} and ${MAX_HISTORY} entries` });
  }

  for (let i = 0; i < cycleHistory.length; i++) {
    const entry = cycleHistory[i];
    if (typeof entry !== 'object' || entry === null) {
      return res.status(400).json({ error: `cycleHistory[${i}]: must be an object` });
    }
    if (typeof entry.startDate !== 'string' || !DATE_REGEX.test(entry.startDate)) {
      return res.status(400).json({ error: `cycleHistory[${i}].startDate must be a date string in YYYY-MM-DD format` });
    }
    if (entry.endDate !== undefined && entry.endDate !== null) {
      if (typeof entry.endDate !== 'string' || !DATE_REGEX.test(entry.endDate)) {
        return res.status(400).json({ error: `cycleHistory[${i}].endDate must be a date string in YYYY-MM-DD format or null` });
      }
    }
    if (entry.length !== undefined && entry.length !== null) {
      if (typeof entry.length !== 'number' || !Number.isInteger(entry.length) || entry.length < MIN_LENGTH || entry.length > MAX_LENGTH) {
        return res.status(400).json({ error: `cycleHistory[${i}].length must be an integer between ${MIN_LENGTH} and ${MAX_LENGTH}` });
      }
    }
  }

  const sanitizedHistory = cycleHistory.map((entry: { startDate: string; endDate?: string | null; length?: number | null }) => ({
    ...entry,
    startDate: sanitizeInput(entry.startDate, 10),
    endDate: entry.endDate != null ? sanitizeInput(entry.endDate, 10) : entry.endDate,
  }));

  try {
    const prediction = await generateCyclePrediction(sanitizedHistory);
    return res.status(200).json(prediction);
  } catch (err) {
    console.error('[predict-cycle] error:', err);
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}
