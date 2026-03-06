import { createHash, timingSafeEqual } from 'crypto';

/**
 * Validate the X-Client-Token header against the expected CLIENT_TOKEN env var.
 * Uses timingSafeEqual to prevent timing-based enumeration of the token value.
 */
export function validateClientToken(token: string | undefined): boolean {
  const expected = process.env.CLIENT_TOKEN;
  if (!expected || !token) return false;

  // Hash both sides so we always compare equal-length buffers,
  // which is required by timingSafeEqual.
  const a = createHash('sha256').update(token).digest();
  const b = createHash('sha256').update(expected).digest();

  return timingSafeEqual(a, b);
}
