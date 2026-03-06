/**
 * In-memory sliding window rate limiter.
 * 30 requests per minute per IP — resets naturally as old timestamps expire.
 * This is the primary insurance layer against API key abuse.
 */

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;

// Map from IP → array of request timestamps within the current window
const store = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const timestamps = (store.get(ip) ?? []).filter((t) => t > cutoff);
  timestamps.push(now);
  store.set(ip, timestamps);

  return timestamps.length > MAX_REQUESTS;
}

// Prevent unbounded memory growth: prune IPs that have had no requests
// in the last window. Called lazily on each request.
let lastPrune = Date.now();

export function maybePrune(): void {
  const now = Date.now();
  if (now - lastPrune < WINDOW_MS) return;
  lastPrune = now;

  const cutoff = now - WINDOW_MS;
  for (const [ip, timestamps] of store.entries()) {
    if (timestamps.every((t) => t <= cutoff)) {
      store.delete(ip);
    }
  }
}
