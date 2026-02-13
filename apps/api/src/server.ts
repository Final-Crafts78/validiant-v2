/**
 * Server Entry Point
 * 
 * Starts the Express server with database connection and graceful shutdown.
 */

import http from 'http';
import { createApp } from './app';
import { env } from './config/env.config';
import { logger } from './utils/logger';
import { db } from './config/database.config';
import { cache } from './config/redis.config';

/**
 * Normalize port
 */
const normalizePort = (val: string | number): number => {
  const port = typeof val === 'string' ? parseInt(val, 10) : val;
  return isNaN(port) ? 3000 : port;
};

const PORT = normalizePort(env.PORT);

/**
 * Create Express app
 */
const app = createApp();

/**
 * Create HTTP server
 */
const server = http.createServer(app);

/**
 * Start server
 */
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await db.raw('SELECT 1');
    logger.info('✅ Database connected successfully');

    // Test Redis connection
    logger.info('Testing Redis connection...');
    await cache.ping();
    logger.info('✅ Redis connected successfully');

    // Start listening
    server.listen(PORT, () => {
      logger.info('='.repeat(60));
      logger.info('🚀 Validiant API Server Started');
      logger.info('='.repeat(60));
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Port: ${PORT}`);
      logger.info(`API URL: ${env.API_URL}`);
      logger.info(`Health Check: ${env.API_URL}/health`);
      logger.info(`API Info: ${env.API_URL}/api`);
      logger.info('='.repeat(60));
    });
  } catch (error) {
    logger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('✅ HTTP server closed');

    try {
      // Close database connections
      await db.end();
      logger.info('✅ Database connections closed');

      // Close Redis connection
      await cache.disconnect();
      logger.info('✅ Redis connection closed');

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during graceful shutdown', { error });
      process.exit(1);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('⚠️  Forceful shutdown after timeout');
    process.exit(1);
  }, 30000); // 30 seconds
};

/**
 * Handle process signals
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Handle uncaught errors
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('❌ Uncaught Exception', { error });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('❌ Unhandled Rejection', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});

/**
 * Start the server
 */
startServer();

/**
 * Export server for testing
 */
export { server, app };
