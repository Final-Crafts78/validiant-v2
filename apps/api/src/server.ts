/**
 * HTTP Server
 * 
 * Initializes and starts the HTTP server with database and Redis connections.
 * Handles graceful shutdown on SIGTERM and SIGINT signals.
 */

import http from 'http';
import { env, isDevelopment } from './config/env.config';
import { initializeDatabase, closeDatabase } from './config/database.config';
import { initializeRedis, closeRedis } from './config/redis.config';
import { logger } from './utils/logger';
import app from './app';

/**
 * HTTP server instance
 */
let server: http.Server | null = null;

/**
 * Track if shutdown is in progress
 */
let isShuttingDown = false;

/**
 * Initialize all services
 */
const initializeServices = async (): Promise<void> => {
  try {
    logger.info('Initializing services...');

    // Initialize database
    await initializeDatabase();

    // Initialize Redis
    await initializeRedis();

    logger.info('✅ All services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services', { error });
    throw error;
  }
};

/**
 * Start HTTP server
 */
const startServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      server = http.createServer(app);

      // Handle server errors
      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`❌ Port ${env.PORT} is already in use`);
        } else {
          logger.error('❌ Server error', { error });
        }
        reject(error);
      });

      // Start listening
      server.listen(env.PORT, () => {
        logger.info(`✅ Server started successfully`);
        logger.info(`🚀 API server running on port ${env.PORT}`);
        logger.info(`🌎 Environment: ${env.NODE_ENV}`);
        logger.info(`📦 API Version: ${env.API_VERSION}`);
        
        if (isDevelopment) {
          logger.info(`📝 Health: http://localhost:${env.PORT}/health`);
          logger.info(`📝 API Info: http://localhost:${env.PORT}/`);
        }

        resolve();
      });
    } catch (error) {
      logger.error('❌ Failed to start server', { error });
      reject(error);
    }
  });
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} signal received, starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) {
            logger.error('Error closing HTTP server', { error: err });
            reject(err);
          } else {
            logger.info('✅ HTTP server closed');
            resolve();
          }
        });
      });
    }

    // Close database connections
    await closeDatabase();

    // Close Redis connection
    await closeRedis();

    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown', { error });
    process.exit(1);
  }
};

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('❌ Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  
  // Exit process after logging
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('❌ Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  
  // Exit process after logging
  process.exit(1);
});

/**
 * Handle SIGTERM signal (Docker, Kubernetes)
 */
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

/**
 * Handle SIGINT signal (Ctrl+C)
 */
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

/**
 * Main startup function
 */
const main = async (): Promise<void> => {
  try {
    logger.info('Starting Validiant API Server...');
    logger.info(`Node version: ${process.version}`);
    logger.info(`Platform: ${process.platform}`);
    
    // Initialize services
    await initializeServices();

    // Start HTTP server
    await startServer();
  } catch (error) {
    logger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
main();

/**
 * Export server for testing
 */
export { server };
