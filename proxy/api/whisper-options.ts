import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateClientToken } from '../lib/auth';
import { isRateLimited, maybePrune } from '../lib/rateLimit';
import { generateWhisperOptions } from '../lib/minimax';
import { sanitizeInput } from '../lib/sanitize';

const VALID_PHASES = new Set(['menstrual', 'follicular', 'ovulatory', 'luteal']);
const MAX_SELECTIONS = 10;
const MAX_SELECTION_LENGTH = 50;

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

  const { phase, dayInCycle, topSelections } = req.body ?? {};

  if (typeof phase !== 'string' || !VALID_PHASES.has(phase)) {
    return res.status(400).json({ error: 'Invalid phase' });
  }
  if (typeof dayInCycle !== 'number' || dayInCycle < 1 || dayInCycle > 45) {
    return res.status(400).json({ error: 'Invalid dayInCycle' });
  }

  // topSelections is optional; when provided it must be a string array within bounds
  const selections: string[] = [];
  if (topSelections !== undefined) {
    if (!Array.isArray(topSelections) || topSelections.length > MAX_SELECTIONS) {
      return res.status(400).json({ error: 'Invalid topSelections: must be an array of at most 10 items' });
    }
    for (const item of topSelections) {
      if (typeof item !== 'string' || item.length > MAX_SELECTION_LENGTH) {
        return res.status(400).json({ error: 'Invalid topSelections: each item must be a string of at most 50 characters' });
      }
      selections.push(item);
    }
  }

  const cleanSelections = selections.map((s: string) => sanitizeInput(s, 50));

  try {
    const options = await generateWhisperOptions(phase, dayInCycle, cleanSelections);
    return res.status(200).json({ options });
  } catch (err) {
    console.error('[whisper-options] error:', err);
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}
