/**
 * Express Application Configuration
 * 
 * Configures Express app with middleware, routes, and error handling.
 */

import express, { Application } from 'express';
import { env, isDevelopment } from './config/env.config';
import {
  corsMiddleware,
  helmetMiddleware,
  compressionMiddleware,
  requestIdMiddleware,
  requestLoggingMiddleware,
  rateLimitMiddleware,
  sanitizeBody,
  validateContentType,
  responseTimeMiddleware,
  apiVersionMiddleware,
  removePoweredBy,
  notFoundMiddleware,
  errorMiddleware,
} from './middleware';
import { logger } from './utils/logger';

/**
 * Create Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Trust proxy (for rate limiting, IP extraction)
  app.set('trust proxy', 1);

  // Disable x-powered-by header
  app.disable('x-powered-by');

  // Security middleware
  app.use(helmetMiddleware);
  app.use(corsMiddleware);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compressionMiddleware);

  // Request processing middleware
  app.use(removePoweredBy);
  app.use(requestIdMiddleware);
  app.use(responseTimeMiddleware);
  app.use(apiVersionMiddleware);
  app.use(requestLoggingMiddleware);

  // Security middleware
  app.use(sanitizeBody);
  app.use(validateContentType());

  // Global rate limiting (100 requests per 15 minutes)
  if (!isDevelopment) {
    app.use(rateLimitMiddleware());
  }

  // Health check endpoint (no auth required)
  app.get('/health', async (req, res) => {
    const { checkDatabaseHealth } = await import('./config/database.config');
    const { checkRedisHealth } = await import('./config/redis.config');

    const [dbHealth, redisHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const isHealthy = dbHealth.status === 'up' && redisHealth.status === 'up';

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: env.API_VERSION,
      services: {
        api: 'up',
        database: dbHealth.status,
        redis: redisHealth.status,
      },
      latency: {
        database: dbHealth.latency,
        redis: redisHealth.latency,
      },
    });
  });

  // API info endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        name: 'Validiant API',
        version: env.API_VERSION,
        environment: env.NODE_ENV,
        documentation: isDevelopment ? `http://localhost:${env.PORT}/api-docs` : undefined,
        endpoints: {
          health: '/health',
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          organizations: '/api/v1/organizations',
          projects: '/api/v1/projects',
          tasks: '/api/v1/tasks',
          timeTracking: '/api/v1/time-tracking',
          notifications: '/api/v1/notifications',
        },
      },
    });
  });

  // API routes
  app.use('/api/v1/auth', async (req, res, next) => {
    const { default: authRoutes } = await import('./routes/auth.routes');
    authRoutes(req, res, next);
  });

  app.use('/api/v1/users', async (req, res, next) => {
    const { default: userRoutes } = await import('./routes/user.routes');
    userRoutes(req, res, next);
  });

  app.use('/api/v1/organizations', async (req, res, next) => {
    const { default: organizationRoutes } = await import('./routes/organization.routes');
    organizationRoutes(req, res, next);
  });

  app.use('/api/v1/projects', async (req, res, next) => {
    const { default: projectRoutes } = await import('./routes/project.routes');
    projectRoutes(req, res, next);
  });

  app.use('/api/v1/tasks', async (req, res, next) => {
    const { default: taskRoutes } = await import('./routes/task.routes');
    taskRoutes(req, res, next);
  });

  app.use('/api/v1/time-tracking', async (req, res, next) => {
    const { default: timeTrackingRoutes } = await import('./routes/time-tracking.routes');
    timeTrackingRoutes(req, res, next);
  });

  app.use('/api/v1/notifications', async (req, res, next) => {
    const { default: notificationRoutes } = await import('./routes/notification.routes');
    notificationRoutes(req, res, next);
  });

  // Swagger API documentation (development only)
  if (isDevelopment && env.ENABLE_SWAGGER) {
    app.use('/api-docs', async (req, res, next) => {
      const { serve, setup } = await import('swagger-ui-express');
      const swaggerDocument = await import('./docs/swagger.json');
      serve(req, res, next);
      setup(swaggerDocument)(req, res, next);
    });

    logger.info(`📚 API Documentation available at http://localhost:${env.PORT}/api-docs`);
  }

  // 404 handler - must be after all routes
  app.use(notFoundMiddleware);

  // Error handler - must be last
  app.use(errorMiddleware);

  return app;
};

/**
 * Export configured app
 */
export default createApp();
