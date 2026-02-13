/**
 * Redis Configuration
 * 
 * Redis client setup for caching, session storage, and rate limiting.
 * Provides connection management, caching helpers, and health checks.
 */

import Redis, { RedisOptions } from 'ioredis';
import { env, isProduction } from './env.config';
import { logger } from '../utils/logger';
import { CACHE_TTL } from '@validiant/shared';

/**
 * Redis client instance
 */
let redisClient: Redis | null = null;

/**
 * Redis connection options
 */
const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

/**
 * Initialize Redis connection
 */
export const initializeRedis = async (): Promise<void> => {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      ...redisOptions,
      password: env.REDIS_PASSWORD,
    });

    // Connect to Redis
    await redisClient.connect();

    // Test connection
    const pong = await redisClient.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis ping failed');
    }

    logger.info('✅ Redis connection established');

    // Handle Redis events
    redisClient.on('error', (err) => {
      logger.error('❌ Redis client error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.debug('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.debug('Redis client ready');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
    });

    redisClient.on('close', () => {
      logger.info('Redis connection closed');
    });
  } catch (error) {
    logger.error('❌ Failed to initialize Redis', { error });
    throw error;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
};

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get value from cache
   */
  get: async <T = any>(key: string): Promise<T | null> => {
    try {
      const value = await getRedisClient().get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  },

  /**
   * Set value in cache with TTL (seconds)
   */
  set: async (key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> => {
    try {
      await getRedisClient().setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  },

  /**
   * Delete value from cache
   */
  del: async (key: string): Promise<void> => {
    try {
      await getRedisClient().del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  },

  /**
   * Delete all keys matching pattern
   */
  delPattern: async (pattern: string): Promise<void> => {
    try {
      const keys = await getRedisClient().keys(pattern);
      if (keys.length > 0) {
        await getRedisClient().del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
    }
  },

  /**
   * Check if key exists
   */
  exists: async (key: string): Promise<boolean> => {
    try {
      const result = await getRedisClient().exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  },

  /**
   * Get TTL for key (seconds)
   */
  ttl: async (key: string): Promise<number> => {
    try {
      return await getRedisClient().ttl(key);
    } catch (error) {
      logger.error('Cache TTL error', { key, error });
      return -1;
    }
  },

  /**
   * Extend TTL for key
   */
  expire: async (key: string, ttl: number): Promise<void> => {
    try {
      await getRedisClient().expire(key, ttl);
    } catch (error) {
      logger.error('Cache expire error', { key, error });
    }
  },

  /**
   * Increment value (for counters)
   */
  incr: async (key: string, by: number = 1): Promise<number> => {
    try {
      return await getRedisClient().incrby(key, by);
    } catch (error) {
      logger.error('Cache increment error', { key, error });
      return 0;
    }
  },

  /**
   * Decrement value
   */
  decr: async (key: string, by: number = 1): Promise<number> => {
    try {
      return await getRedisClient().decrby(key, by);
    } catch (error) {
      logger.error('Cache decrement error', { key, error });
      return 0;
    }
  },

  /**
   * Get or set (fetch from cache, or compute and cache)
   */
  getOrSet: async <T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> => {
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
 * Session helper functions
 */
export const session = {
  /**
   * Store session data
   */
  set: async (sessionId: string, data: any, ttl: number = 86400): Promise<void> => {
    const key = `session:${sessionId}`;
    await cache.set(key, data, ttl);
  },

  /**
   * Get session data
   */
  get: async <T = any>(sessionId: string): Promise<T | null> => {
    const key = `session:${sessionId}`;
    return await cache.get<T>(key);
  },

  /**
   * Delete session
   */
  del: async (sessionId: string): Promise<void> => {
    const key = `session:${sessionId}`;
    await cache.del(key);
  },

  /**
   * Extend session TTL
   */
  extend: async (sessionId: string, ttl: number = 86400): Promise<void> => {
    const key = `session:${sessionId}`;
    await cache.expire(key, ttl);
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
  check: async (
    key: string,
    max: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> => {
    try {
      const client = getRedisClient();
      const windowSeconds = Math.ceil(windowMs / 1000);
      const count = await client.incr(key);

      if (count === 1) {
        await client.expire(key, windowSeconds);
      }

      const ttl = await client.ttl(key);
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
  reset: async (key: string): Promise<void> => {
    await cache.del(key);
  },
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
    const pong = await getRedisClient().ping();
    if (pong !== 'PONG') {
      throw new Error('Invalid ping response');
    }
    const latency = Date.now() - start;
    return { status: 'up', latency };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

/**
 * Graceful shutdown handler
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing Redis connection...');
  await closeRedis();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing Redis connection...');
  await closeRedis();
});
