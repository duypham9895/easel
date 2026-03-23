import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateClientToken } from '../lib/auth';
import { isRateLimited, maybePrune } from '../lib/rateLimit';
import { generatePartnerAdvice } from '../lib/minimax';
import { sanitizeInput } from '../lib/sanitize';

const VALID_PHASES = new Set(['menstrual', 'follicular', 'ovulatory', 'luteal']);

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

  const { phase, dayInCycle, phaseTagline, language, mood, symptoms } = req.body ?? {};

  if (typeof phase !== 'string' || !VALID_PHASES.has(phase)) {
    return res.status(400).json({ error: 'Invalid phase' });
  }
  if (typeof dayInCycle !== 'number' || dayInCycle < 1 || dayInCycle > 45) {
    return res.status(400).json({ error: 'Invalid dayInCycle' });
  }
  if (typeof phaseTagline !== 'string' || phaseTagline.length > 50) {
    return res.status(400).json({ error: 'Invalid phaseTagline' });
  }
  // mood is optional (1–5) — Moon's latest check-in mood
  if (mood != null && (typeof mood !== 'number' || mood < 1 || mood > 5)) {
    return res.status(400).json({ error: 'Invalid mood' });
  }
  // symptoms is optional — Moon's latest check-in symptoms
  if (symptoms !== undefined) {
    if (
      !Array.isArray(symptoms) ||
      symptoms.length > 10 ||
      symptoms.some((s: unknown) => typeof s !== 'string' || s.length > 30)
    ) {
      return res.status(400).json({ error: 'Invalid symptoms' });
    }
  }

  const cleanTagline = sanitizeInput(phaseTagline, 50);
  const cleanSymptoms = symptoms ? symptoms.map((s: string) => sanitizeInput(s, 30)) : undefined;

  try {
    const VALID_LANGUAGES = new Set(['en', 'vi']);
  const lang = typeof language === 'string' && VALID_LANGUAGES.has(language) ? language : 'en';
    const advice = await generatePartnerAdvice(
      phase,
      dayInCycle,
      cleanTagline,
      lang,
      mood ?? null,
      cleanSymptoms
    );
    return res.status(200).json({ advice });
  } catch (err) {
    console.error('[partner-advice] error:', err);
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}
