/**
 * Server Entry Point (Node.js Runtime)
 * 
 * Starts the Hono server using @hono/node-server adapter.
 * This file is used for local development and traditional Node.js deployment.
 * 
 * For Cloudflare Workers deployment, use worker.ts instead.
 */

import { serve } from '@hono/node-server';
import { app } from './app';
import { env } from './config/env.config';
import { db } from './db';
import { testConnection as testRedisConnection } from './config/redis.config';
import { logger } from './utils/logger';
import { sql } from 'drizzle-orm';

/**
 * Test database connection
 */
const testDatabaseConnection = async (): Promise<void> => {
  try {
    // Execute simple query to test connection
    await db.execute(sql`SELECT 1`);
    logger.info('✅ Database connection successful');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Test database connection
    await testDatabaseConnection();

    // Test Redis connection
    const redisOk = await testRedisConnection();
    if (!redisOk) {
      logger.warn('⚠️  Redis connection failed, but server will continue');
    }

    // Start Hono server using Node.js adapter
    serve(
      {
        fetch: app.fetch,
        port: env.PORT,
      },
      (info) => {
        logger.info(`🚀 Hono server running on port ${info.port}`);
        logger.info(`📝 Environment: ${env.NODE_ENV}`);
        logger.info(`🔗 API URL: http://localhost:${info.port}/api/${env.API_VERSION}`);
        logger.info(`⚡ Edge-compatible runtime active`);
      }
    );
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
