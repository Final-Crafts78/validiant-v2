/**
 * Hono Application Setup (Edge-Compatible)
 * 
 * This is the new Hono-based application that will replace Express.
 * Designed for Cloudflare Workers with 4x performance improvement.
 * 
 * Key differences from Express:
 * - Uses Hono context (c) instead of (req, res)
 * - Built-in edge-compatible middleware
 * - No need for body-parser (automatic JSON parsing)
 * - No need for cookie-parser (built-in cookie support)
 * 
 * Migration Status (Phase 4):
 * ✅ Auth routes - MIGRATED to Hono + @hono/zod-validator
 * ⏳ User routes - Pending migration
 * ⏳ Organization routes - Pending migration
 * ⏳ Project routes - Pending migration
 * ⏳ Task routes - Pending migration
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Migrated Hono routes
import authRoutes from './routes/auth.routes.hono';

// Legacy Express routes (to be migrated)
import userRoutes from './routes/user.routes';
import organizationRoutes from './routes/organization.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';

/**
 * Environment variables interface
 */
interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  CORS_ORIGIN?: string;
}

/**
 * Create Hono application with full type safety
 */
export const createHonoApp = () => {
  const app = new Hono<{ Bindings: Env }>();

  // ============================================================================
  // MIDDLEWARE
  // ============================================================================

  // Logger middleware (development and production)
  app.use('*', logger());

  // Pretty JSON in development
  if (process.env.NODE_ENV === 'development') {
    app.use('*', prettyJSON());
  }

  // CORS middleware
  app.use(
    '*',
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      exposeHeaders: ['Set-Cookie'],
      maxAge: 86400, // 24 hours
    })
  );

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Health check endpoint
   * Returns server status and uptime
   */
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ============================================================================
  // API ROUTES (v1)
  // ============================================================================

  /**
   * Mount all API routes under /api/v1
   * 
   * Migration Progress:
   * ✅ /api/v1/auth          → Hono routes (auth.routes.hono.ts)
   * ⏳ /api/v1/users         → Express routes (pending migration)
   * ⏳ /api/v1/organizations → Express routes (pending migration)
   * ⏳ /api/v1/projects      → Express routes (pending migration)
   * ⏳ /api/v1/tasks         → Express routes (pending migration)
   */
  app.route('/api/v1/auth', authRoutes);
  app.route('/api/v1/users', userRoutes);
  app.route('/api/v1/organizations', organizationRoutes);
  app.route('/api/v1/projects', projectRoutes);
  app.route('/api/v1/tasks', taskRoutes);

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * 404 Not Found handler
   */
  app.notFound((c) => {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: `Route ${c.req.path} not found`,
        path: c.req.path,
        method: c.req.method,
      },
      404
    );
  });

  /**
   * Global error handler
   * Catches all unhandled errors
   */
  app.onError((err, c) => {
    console.error('Unhandled error:', err);

    const isDevelopment = process.env.NODE_ENV === 'development';

    return c.json(
      {
        success: false,
        error: err.name || 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
        ...(isDevelopment && { stack: err.stack }),
      },
      500
    );
  });

  return app;
};

/**
 * Export the app instance
 */
export const app = createHonoApp();

/**
 * Default export for Cloudflare Workers
 */
export default app;
