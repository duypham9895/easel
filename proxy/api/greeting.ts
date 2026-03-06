import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateClientToken } from '../lib/auth';
import { isRateLimited, maybePrune } from '../lib/rateLimit';
import { generateGreeting } from '../lib/minimax';

const VALID_PHASES = new Set(['menstrual', 'follicular', 'ovulatory', 'luteal']);

function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // — Layer 1: Method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // — Layer 2: Static token auth
  const token = req.headers['x-client-token'];
  if (!validateClientToken(typeof token === 'string' ? token : undefined)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // — Layer 3: Rate limiting
  const ip = getClientIP(req);
  maybePrune();
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // — Layer 4: Input validation (whitelist)
  const { phase, dayInCycle, phaseTagline } = req.body ?? {};

  if (typeof phase !== 'string' || !VALID_PHASES.has(phase)) {
    return res.status(400).json({ error: 'Invalid phase' });
  }

  if (typeof dayInCycle !== 'number' || dayInCycle < 1 || dayInCycle > 45) {
    return res.status(400).json({ error: 'Invalid dayInCycle' });
  }

  if (typeof phaseTagline !== 'string' || phaseTagline.length > 50) {
    return res.status(400).json({ error: 'Invalid phaseTagline' });
  }

  // — Layer 5: Call MiniMax (HTTPS is handled by Vercel / fetch)
  try {
    const greeting = await generateGreeting(phase, dayInCycle, phaseTagline);
    return res.status(200).json({ greeting });
  } catch (err) {
    console.error('[greeting] MiniMax error:', err);
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}
