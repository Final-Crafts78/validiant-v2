/**
 * Application Setup (Edge-Compatible)
 *
 * Edge-optimized Hono application for Cloudflare Workers.
 * 4x faster than Express with native edge runtime support.
 *
 * Key features:
 * - Hono context (c) with type safety
 * - Built-in edge-compatible middleware
 * - Automatic JSON parsing (no body-parser)
 * - Built-in cookie support (no cookie-parser)
 * - @hono/zod-validator for edge validation
 *
 * Architecture:
 * ✅ Auth routes - Hono + @hono/zod-validator
 * ✅ OAuth routes - Hono + Arctic (Phase 6.1)
 * ✅ Passkey routes - Hono + SimpleWebAuthn (Phase 6.2)
 * ✅ User routes - Hono + @hono/zod-validator
 * ✅ Organization routes - Hono + @hono/zod-validator
 * ✅ Project routes - Hono + @hono/zod-validator
 * ✅ Task routes - Hono + @hono/zod-validator
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Import all routes
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import passkeyRoutes from './routes/passkey.routes';
import userRoutes from './routes/user.routes';
import organizationRoutes from './routes/organization.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import { initEnv } from './config/env.config';

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
 * Explicitly allowed origins.
 *
 * - localhost:3000    → local development
 * - validiant.in      → apex production domain
 * - www.validiant.in  → www production domain (primary)
 *
 * Both apex and www are listed because browsers send the exact origin
 * used in the address bar; omitting either would break preflight for that
 * variant.
 */
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'https://validiant.in',
  'https://www.validiant.in',
];

/**
 * Create Hono application with full type safety
 */
export const createHonoApp = () => {
  const app = new Hono<{ Bindings: Env }>();

  // ============================================================================
  // MIDDLEWARE
  // ============================================================================

  // Edge Env Injector (Passes Cloudflare secrets to global scope for the DB Proxy)
  app.use('*', async (c, next) => {
    (globalThis as any).__ENV__ = c.env;
    initEnv(c.env as Record<string, unknown>);
    await next();
  });

  // Logger middleware (development and production)
  app.use('*', logger());

  // Pretty JSON in development
  if (process.env.NODE_ENV === 'development') {
    app.use('*', prettyJSON());
  }

  // CORS middleware — dynamic origin allowlist
  //
  // origin function contract (Hono / WhatWG Fetch):
  //   - Return the origin string  → Access-Control-Allow-Origin: <origin>
  //   - Return '*'                → Access-Control-Allow-Origin: *
  //   - Return null               → header is omitted (request blocked)
  //
  // When `origin` is null/empty (same-origin requests, server-to-server,
  // or curl without an Origin header) we allow by returning '*' because
  // credentials are irrelevant in that case and blocking hurts health checks.
  app.use('*', async (c, next) => {
    const corsMiddleware = cors({
      origin: (origin) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return origin || '*';
        }
        return null; // Reject unknown origins
      },
      credentials: true,          // Required for HttpOnly cookie pass-through
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      exposeHeaders: ['Set-Cookie'],
      maxAge: 86400, // 24 hours preflight cache
    });
    return corsMiddleware(c, next);
  });

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
   * All services use Hono with @hono/zod-validator:
   * ✅ /api/v1/auth          → auth.routes.ts (Email/Password)
   * ✅ /api/v1/oauth         → oauth.routes.ts (Google, GitHub - Phase 6.1)
   * ✅ /api/v1/passkey       → passkey.routes.ts (WebAuthn/FIDO2 - Phase 6.2)
   * ✅ /api/v1/users         → user.routes.ts
   * ✅ /api/v1/organizations → organization.routes.ts
   * ✅ /api/v1/projects      → project.routes.ts
   * ✅ /api/v1/tasks         → task.routes.ts
   */
  app.route('/api/v1/auth', authRoutes);
  app.route('/api/v1/oauth', oauthRoutes);
  app.route('/api/v1/passkey', passkeyRoutes);
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
