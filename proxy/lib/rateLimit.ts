/**
 * In-memory sliding window rate limiter.
 * 30 requests per minute per IP — resets naturally as old timestamps expire.
 * This is the primary insurance layer against API key abuse.
 */

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;
const PRUNE_INTERVAL_MS = 10_000; // 10 seconds
const MAX_STORE_SIZE = 10_000;

// Map from IP → array of request timestamps within the current window
const store = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const timestamps = (store.get(ip) ?? []).filter((t) => t > cutoff);
  timestamps.push(now);
  store.set(ip, timestamps);

  // Cap store size: if exceeded, delete oldest entries
  if (store.size > MAX_STORE_SIZE) {
    let oldest: { ip: string; time: number } | null = null;
    for (const [key, ts] of store.entries()) {
      const minTime = ts[0] ?? 0;
      if (oldest === null || minTime < oldest.time) {
        oldest = { ip: key, time: minTime };
      }
    }
    if (oldest) store.delete(oldest.ip);
  }

  return timestamps.length > MAX_REQUESTS;
}

// Prevent unbounded memory growth: prune IPs that have had no requests
// in the last window. Called lazily on each request.
let lastPrune = Date.now();

export function maybePrune(): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;

  const cutoff = now - WINDOW_MS;
  for (const [ip, timestamps] of store.entries()) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      store.delete(ip);
    } else {
      store.set(ip, valid);
    }
  }
}
