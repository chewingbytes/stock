/**
 * Fixed-window rate limiter for auth endpoints.
 *
 * State is per-instance and in-memory: on serverless it limits per warm
 * container rather than globally, which still blunts credential-stuffing from
 * a single source. Move to Redis/Upstash if you need strict global limits.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Bound the map so a flood of unique keys cannot grow memory without limit.
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  options: { limit: number; windowSeconds: number },
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      for (const [candidate, bucket] of buckets) {
        if (now >= bucket.resetAt) buckets.delete(candidate);
      }
      if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort client identity from proxy headers (Vercel sets these). */
export function getClientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}

/** Test-only: clear accumulated state between cases. */
export function resetRateLimits(): void {
  buckets.clear();
}
