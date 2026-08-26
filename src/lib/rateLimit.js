/**
 * Simple in-memory rate limiter using a sliding window.
 * Suitable for single-instance deployments (Vercel serverless, single Node process).
 * For multi-instance production, replace with Redis-backed solution.
 */

const rateLimitMap = new Map();

// Clean up stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitMap) {
    if (now - entry.firstRequest > windowMs * 2) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited.
 * @param {string} key - Unique identifier (usually IP address)
 * @param {object} options
 * @param {number} options.maxRequests - Max requests allowed in the window (default: 5)
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns {{ limited: boolean, remaining: number, retryAfterMs: number }}
 */
export function rateLimit(key, { maxRequests = 5, windowMs = 60_000 } = {}) {
  cleanup(windowMs);

  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.firstRequest > windowMs) {
    // Start a new window
    rateLimitMap.set(key, { firstRequest: now, count: 1 });
    return { limited: false, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    const retryAfterMs = windowMs - (now - entry.firstRequest);
    return { limited: true, remaining: 0, retryAfterMs };
  }

  return { limited: false, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}
