/**
 * Rate Limiting Middleware
 *
 * Edge-native sliding-window rate limiter using Upstash Redis.
 * Prevents abuse of authentication and general API endpoints.
 */

import type { Context, Next } from 'hono';
import { env } from 'hono/adapter';

interface RateLimitEnv extends Record<string, unknown> {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
}

interface SlidingWindowResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Lightweight Upstash Redis sliding-window rate limiter.
 * Does NOT use @upstash/ratelimit SDK — raw fetch() for edge compatibility.
 */
async function checkRateLimit(
  redisUrl: string,
  redisToken: string,
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<SlidingWindowResult> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Pipeline: ZREMRANGEBYSCORE + ZADD + ZCARD + EXPIRE
    const pipeline = [
      ['ZREMRANGEBYSCORE', key, '-inf', String(windowStart)],
      ['ZADD', key, String(now), `${now}:${crypto.randomUUID().slice(0, 8)}`],
      ['ZCARD', key],
      ['EXPIRE', key, String(windowSeconds)],
    ];

    const response = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
    });

    if (!response.ok) {
      // Fail open: allow request if Redis is down
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: now + windowSeconds,
      };
    }

    const results = (await response.json()) as Array<{ result: number }>;
    const currentCount = results[2]?.result ?? 0;
    const allowed = currentCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - currentCount);

    return { allowed, remaining, resetAt: now + windowSeconds };
  } catch {
    // Fail open if Redis is unreachable
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: Math.floor(Date.now() / 1000) + windowSeconds,
    };
  }
}

/**
 * Create rate limit middleware factory.
 * @param maxRequests - Maximum requests per window
 * @param windowSeconds - Window duration in seconds
 * @param keyPrefix - Redis key prefix
 */
export function rateLimit(
  maxRequests: number,
  windowSeconds: number,
  keyPrefix: string = 'rl'
) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const envVars = env<RateLimitEnv>(c);

    if (!envVars.UPSTASH_REDIS_REST_URL || !envVars.UPSTASH_REDIS_REST_TOKEN) {
      // Skip rate limiting if Redis is not configured
      await next();
      return;
    }

    // Use IP address (or forwarded IP) as the rate limit key
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      'unknown';
    const key = `${keyPrefix}:${ip}`;

    const result = await checkRateLimit(
      envVars.UPSTASH_REDIS_REST_URL,
      envVars.UPSTASH_REDIS_REST_TOKEN,
      key,
      maxRequests,
      windowSeconds
    );

    // Set standard rate limit headers
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(result.resetAt));

    if (!result.allowed) {
      return c.json(
        {
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again in ${result.resetAt - Math.floor(Date.now() / 1000)} seconds.`,
        },
        429
      );
    }

    await next();
  };
}
