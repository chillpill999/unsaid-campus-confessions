/**
 * Production Rate Limiter Utility for API Endpoints.
 * Uses in-memory sliding window cache for IP / user-based rate limiting.
 */

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitTracker>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const tracker = memoryStore.get(identifier);

  if (!tracker || tracker.resetAt <= now) {
    const newTracker: RateLimitTracker = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(identifier, newTracker);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: newTracker.resetAt,
    };
  }

  if (tracker.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: tracker.resetAt,
    };
  }

  tracker.count += 1;
  memoryStore.set(identifier, tracker);

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - tracker.count,
    reset: tracker.resetAt,
  };
}
