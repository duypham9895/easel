import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateClientToken } from '../lib/auth';
import { isRateLimited, maybePrune } from '../lib/rateLimit';
import { generateSOSTip } from '../lib/minimax';

const VALID_PHASES = new Set(['menstrual', 'follicular', 'ovulatory', 'luteal']);
const VALID_SOS_TYPES = new Set(['sweet', 'hug', 'pain', 'quiet']);

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

  const { sosType, phase, dayInCycle, language } = req.body ?? {};

  if (typeof sosType !== 'string' || !VALID_SOS_TYPES.has(sosType)) {
    return res.status(400).json({ error: 'Invalid sosType' });
  }
  if (typeof phase !== 'string' || !VALID_PHASES.has(phase)) {
    return res.status(400).json({ error: 'Invalid phase' });
  }
  if (typeof dayInCycle !== 'number' || dayInCycle < 1 || dayInCycle > 45) {
    return res.status(400).json({ error: 'Invalid dayInCycle' });
  }

  try {
    const lang = typeof language === 'string' ? language : 'en';
    const tip = await generateSOSTip(sosType, phase, dayInCycle, lang);
    return res.status(200).json({ tip });
  } catch (err) {
    console.error('[sos-tip] error:', err);
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}
