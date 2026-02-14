/**
 * Redis Configuration (Upstash - Edge Compatible)
 * 
 * HTTP-based Redis client compatible with Cloudflare Workers.
 * Uses Upstash Redis REST API instead of TCP connections.
 * 
 * CRITICAL: This replaces ioredis which is NOT edge-compatible.
 * 
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL: Your Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis REST token
 */

import { Redis } from '@upstash/redis';
import { env } from './env.config';
import { logger } from '../utils/logger';

/**
 * Edge-compatible Redis client
 * Uses HTTP REST API instead of TCP connections
 */
let redis: Redis;

try {
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  logger.info('✅ Upstash Redis client initialized');
} catch (error) {
  logger.error('❌ Failed to initialize Upstash Redis client:', error);
  throw error;
}

/**
 * Cache utilities with automatic JSON handling
 * Compatible with Cloudflare Workers edge runtime
 */
export const cache = {
  /**
   * Get value from cache
   * Automatically deserializes JSON
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await redis.get<T>(key);
      return value;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  },

  /**
   * Set value in cache with optional TTL
   * Automatically serializes JSON
   * 
   * @param key - Cache key
   * @param value - Value to cache (will be JSON serialized)
   * @param ttl - Time to live in seconds (optional)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await redis.setex(key, ttl, value);
      } else {
        await redis.set(key, value);
      }
    } catch (error) {
      logger.error('Cache set error:', { key, ttl, error });
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  },

  /**
   * Delete all keys matching pattern
   * Note: KEYS command can be slow, use with caution
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', { pattern, error });
    }
  },

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', { key, error });
      return false;
    }
  },

  /**
   * Set expiration on existing key
   * 
   * @param key - Cache key
   * @param ttl - Time to live in seconds
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await redis.expire(key, ttl);
    } catch (error) {
      logger.error('Cache expire error:', { key, ttl, error });
    }
  },

  /**
   * Get remaining TTL for key
   * 
   * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error:', { key, error });
      return -2;
    }
  },

  /**
   * Increment value (for counters)
   */
  async incr(key: string, by: number = 1): Promise<number> {
    try {
      return await redis.incrby(key, by);
    } catch (error) {
      logger.error('Cache increment error:', { key, error });
      return 0;
    }
  },

  /**
   * Decrement value
   */
  async decr(key: string, by: number = 1): Promise<number> {
    try {
      return await redis.decrby(key, by);
    } catch (error) {
      logger.error('Cache decrement error:', { key, error });
      return 0;
    }
  },

  /**
   * Get or set (fetch from cache, or compute and cache)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await cache.set(key, value, ttl);
    return value;
  },
};

/**
 * Session storage utilities
 * Uses 'session:' prefix for all keys
 */
export const session = {
  /**
   * Get session data
   */
  async get<T = unknown>(sessionId: string): Promise<T | null> {
    return cache.get<T>(`session:${sessionId}`);
  },

  /**
   * Set session data with TTL
   * 
   * @param sessionId - Session identifier
   * @param data - Session data (will be JSON serialized)
   * @param ttl - Time to live in seconds
   */
  async set(sessionId: string, data: unknown, ttl: number): Promise<void> {
    await cache.set(`session:${sessionId}`, data, ttl);
  },

  /**
   * Delete session
   */
  async del(sessionId: string): Promise<void> {
    await cache.del(`session:${sessionId}`);
  },

  /**
   * Check if session exists
   */
  async exists(sessionId: string): Promise<boolean> {
    return cache.exists(`session:${sessionId}`);
  },

  /**
   * Extend session TTL
   */
  async extend(sessionId: string, ttl: number): Promise<void> {
    await cache.expire(`session:${sessionId}`, ttl);
  },
};

/**
 * Rate limiting helper
 */
export const rateLimit = {
  /**
   * Check and increment rate limit counter
   * Returns remaining requests or -1 if limit exceeded
   */
  async check(
    key: string,
    max: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    try {
      const windowSeconds = Math.ceil(windowMs / 1000);
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);
      const reset = Date.now() + (ttl * 1000);
      const remaining = Math.max(0, max - count);

      return {
        allowed: count <= max,
        remaining,
        reset,
      };
    } catch (error) {
      logger.error('Rate limit check error', { key, error });
      // Fail open on error
      return { allowed: true, remaining: max, reset: Date.now() + windowMs };
    }
  },

  /**
   * Reset rate limit for key
   */
  async reset(key: string): Promise<void> {
    await cache.del(key);
  },
};

/**
 * Token denylist utilities
 * Used for logout and token invalidation
 */
export const denylist = {
  /**
   * Add token to denylist
   * 
   * @param token - JWT token or token ID
   * @param ttl - Time until token naturally expires (seconds)
   */
  async add(token: string, ttl: number): Promise<void> {
    await cache.set(`denylist:${token}`, '1', ttl);
  },

  /**
   * Check if token is denied
   */
  async isDenied(token: string): Promise<boolean> {
    return cache.exists(`denylist:${token}`);
  },
};

/**
 * Export raw Redis client for advanced operations
 */
export { redis };

/**
 * Utility to test Redis connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await redis.ping();
    logger.info('✅ Redis connection test successful');
    return true;
  } catch (error) {
    logger.error('❌ Redis connection test failed:', error);
    return false;
  }
};

/**
 * Check Redis health
 */
export const checkRedisHealth = async (): Promise<{
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}> => {
  const start = Date.now();
  try {
    await redis.ping();
    const latency = Date.now() - start;
    return { status: 'up', latency };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
