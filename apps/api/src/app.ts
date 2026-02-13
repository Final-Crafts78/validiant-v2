/**
 * Express Application
 * 
 * Main Express app configuration with middleware, routes, and error handling.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimit.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { sanitize } from './middleware/sanitize.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import organizationRoutes from './routes/organization.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';

/**
 * Create Express application
 */
const createApp = (): Application => {
  const app = express();

  // ============================================================================
  // Security Middleware
  // ============================================================================

  // Helmet - Set security HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS - Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
      maxAge: 86400, // 24 hours
    })
  );

  // ============================================================================
  // General Middleware
  // ============================================================================

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Request sanitization
  app.use(sanitize);

  // ============================================================================
  // Logging Middleware
  // ============================================================================

  // HTTP request logging (only in development)
  if (env.NODE_ENV === 'development') {
    app.use(
      morgan('dev', {
        stream: {
          write: (message: string) => logger.http(message.trim()),
        },
      })
    );
  }

  // Custom request logger
  app.use(requestLogger);

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  // Apply rate limiting to all routes
  app.use(rateLimiter);

  // ============================================================================
  // Health Check & Status
  // ============================================================================

  /**
   * Health check endpoint
   */
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    });
  });

  /**
   * API info endpoint
   */
  app.get('/api', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'Validiant API',
      version: '2.0.0',
      description: 'Project management and time tracking API',
      documentation: `${env.API_URL}/docs`,
      endpoints: {
        health: '/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        organizations: '/api/v1/organizations',
        projects: '/api/v1/projects',
        tasks: '/api/v1/tasks',
      },
    });
  });

  // ============================================================================
  // API Routes
  // ============================================================================

  const API_PREFIX = '/api/v1';

  // Authentication routes
  app.use(`${API_PREFIX}/auth`, authRoutes);

  // User routes
  app.use(`${API_PREFIX}/users`, userRoutes);

  // Organization routes
  app.use(`${API_PREFIX}/organizations`, organizationRoutes);

  // Project routes
  app.use(`${API_PREFIX}/projects`, projectRoutes);

  // Task routes
  app.use(`${API_PREFIX}/tasks`, taskRoutes);

  // Organization projects route (nested)
  app.use(
    `${API_PREFIX}/organizations/:organizationId/projects`,
    (req: Request, res: Response, next: NextFunction) => {
      // Pass organizationId to project controller
      req.params.organizationId = req.params.organizationId;
      next();
    },
    projectRoutes
  );

  // Project tasks route (nested)
  app.use(
    `${API_PREFIX}/projects/:projectId/tasks`,
    (req: Request, res: Response, next: NextFunction) => {
      // Pass projectId to task controller
      req.params.projectId = req.params.projectId;
      next();
    },
    taskRoutes
  );

  // ============================================================================
  // Error Handling
  // ============================================================================

  // 404 handler - Must be after all routes
  app.use(notFoundHandler);

  // Global error handler - Must be last
  app.use(errorHandler);

  return app;
};

/**
 * Export app factory
 */
export { createApp };
