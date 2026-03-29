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
import { logger as appLogger } from './utils/logger';
import { prettyJSON } from 'hono/pretty-json';
import { UserContext } from './middleware/auth';

// Import all routes
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import passkeyRoutes from './routes/passkey.routes';
import userRoutes from './routes/user.routes';
import organizationRoutes from './routes/organization.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import analyticsRoutes from './routes/analytics.routes';
import activityRoutes from './routes/activity.routes';
import contactRoutes from './routes/contact.routes';
import optimizeRoutes from './routes/optimize.routes';
import commentRoutes from './routes/comment.routes';
import webhookRoutes from './routes/webhook.routes';
import aiRoutes from './routes/ai.routes';
import kycRoutes from './routes/kyc.routes';
import geocodeRoutes from './routes/geocode.routes';
import timeTrackingRoutes from './routes/time-tracking.routes';
import notificationRoutes from './routes/notification.routes';
import invoiceRoutes from './routes/invoice.routes';
import searchRoutes from './routes/search.routes';
import automationRoutes from './routes/automation.routes';
import backupRoutes from './routes/backup.routes';
import ssoRoutes from './routes/sso.routes';
import verificationRoutes from './routes/verification.routes';
import bgvPartnerRoutes from './routes/bgv-partner.routes';
import inboundRoutes from './routes/inbound.routes';
import csvImportRoutes from './routes/csv-import.routes';
import realtimeRoutes from './routes/realtime.routes';
import { rateLimit } from './middleware/rateLimit';
import { tenantIsolation } from './middleware/tenant';
import { authenticate } from './middleware/auth';
import { initEnv } from './config/env.config';

// ---------------------------------------------------------------------------
// Cloudflare Workers Fetch Patch
// Strips the `cache` field from RequestInit before every fetch call.
// Required because @upstash/redis internally passes cache: 'no-store' which
// is not supported by the Cloudflare Workers fetch implementation.
// ---------------------------------------------------------------------------
const _nativeFetch = globalThis.fetch;
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (init && 'cache' in init) {
    const { cache: _cache, ...rest } = init;
    return _nativeFetch(input, rest);
  }
  return _nativeFetch(input, init);
};

import type { R2Bucket } from '@cloudflare/workers-types';

/**
 * Environment variables interface
 */
export interface Env {
  // Required secrets (wrangler secret put)
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  SESSION_SECRET: string;
  ENCRYPTION_SECRET: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;

  // Plaintext vars (wrangler.toml [vars])
  CORS_ORIGIN?: string;
  FRONTEND_URL?: string;
  WEB_APP_URL?: string;
  GOOGLE_REDIRECT_URI?: string;
  GITHUB_REDIRECT_URI?: string;

  // OAuth secrets (wrangler secret put)
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;

  // Runtime
  NODE_ENV?: string;

  // Optional secrets
  RESEND_API_KEY?: string;
  REDIS_URL?: string;

  // Cloudflare resource bindings
  BACKUP_BUCKET?: R2Bucket;
  REALTIME_ROOMS: DurableObjectNamespace;
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
  'https://app.validiant.in',
];

/**
 * Create Hono application with full type safety
 */
export const createHonoApp = () => {
  const app = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

  // ============================================================================
  // MIDDLEWARE
  // ============================================================================

  // Edge Env Injector (Passes Cloudflare secrets to global scope for the DB Proxy)
  app.use('*', async (c, next) => {
    (globalThis as { __ENV__?: Env }).__ENV__ = c.env;
    initEnv(c.env as unknown as Record<string, unknown>);
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
        const isAllowed = !origin || allowedOrigins.includes(origin);
        const result = isAllowed ? (origin || '*') : null;

        appLogger.debug('[CORS] Origin Check', {
          incomingOrigin: origin || 'NONE',
          isAllowed,
          resultHeader: result,
          credentials: true, // Hardcoded as per line 187
        });

        return result;
      },
      credentials: true, // Required for HttpOnly cookie pass-through
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'Authorization',
        'Cookie',
        'X-Org-Id',
        'X-Signature',
      ],
      exposeHeaders: ['Set-Cookie'],
      maxAge: 86400, // 24 hours preflight cache
    });
    return corsMiddleware(c, next);
  });

  // Rate Limiting — applied per route group
  // Auth: 5 attempts per 15 minutes (brute-force protection)
  app.use('/api/v1/auth/login', rateLimit(5, 900, 'rl:auth'));
  // Passkey: 20 attempts per 60 seconds
  app.use('/api/v1/passkey/*', rateLimit(20, 60, 'rl:passkey'));
  // General API: 200 requests per 60 seconds
  app.use('/api/v1/*', rateLimit(200, 60, 'rl:api'));

  // Unified Path Management
  const publicPaths = [
    '/api/v1/oauth/google',
    '/api/v1/oauth/github',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/webhook',
    '/api/v1/inbound',
    '/api/v1/contact',
  ];

  const isPublicPath = (path: string) =>
    publicPaths.some((p) => path.startsWith(p));

  // 1. Authentication: Populate user context first
  app.use('/api/v1/*', async (c, next) => {
    if (isPublicPath(c.req.path)) {
      return next();
    }
    return authenticate(c, next);
  });

  // 2. Tenant Isolation: Automatically scope every request
  app.use('/api/v1/*', async (c, next) => {
    if (isPublicPath(c.req.path)) {
      return next();
    }
    // Also skip isolation for organization management routes that don't have an org context yet
    const orgManagementPaths = [
      '/api/v1/organizations/my',
      '/api/v1/organizations', // POST / is allowed, but GET /:id should hit the isolation
    ];

    if (
      orgManagementPaths.some((p) => c.req.path === p) ||
      (c.req.path === '/api/v1/organizations' && c.req.method === 'POST')
    ) {
      return next();
    }

    return tenantIsolation(c, next);
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
  app.route('/api/v1/analytics', analyticsRoutes);
  app.route('/api/v1/activity', activityRoutes);
  app.route('/api/v1/contact', contactRoutes);
  app.route('/api/v1/tasks/optimize', optimizeRoutes);
  app.route('/api/v1/comments', commentRoutes);
  app.route('/api/v1/webhooks', webhookRoutes);
  app.route('/api/v1/ai', aiRoutes);
  app.route('/api/v1/kyc', kycRoutes);
  app.route('/api/v1/geocode', geocodeRoutes);
  app.route('/api/v1/time-tracking', timeTrackingRoutes);
  app.route('/api/v1/notifications', notificationRoutes);
  app.route('/api/v1/invoices', invoiceRoutes);
  app.route('/api/v1/search', searchRoutes);
  app.route('/api/v1/automations', automationRoutes);
  app.route('/api/v1/backups', backupRoutes);
  app.route('/api/v1/sso', ssoRoutes);
  app.route('/api/v1/verifications', verificationRoutes);
  app.route('/api/v1/partners', bgvPartnerRoutes);
  app.route('/api/v1/inbound', inboundRoutes);
  app.route('/api/v1/import/csv', csvImportRoutes);
  app.route('/api/v1/realtime', realtimeRoutes);

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
    const user = c.get('user') as UserContext | undefined;
    
    console.error('[API:Error] Unhandled Exception', {
      error: err.name || 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
      path: c.req.path,
      method: c.req.method,
      query: c.req.query(),
      params: c.req.param(),
      headers: {
        host: c.req.header('host'),
        'user-agent': c.req.header('user-agent'),
        'x-org-id': c.req.header('X-Org-Id') || 'MISSING',
        referer: c.req.header('referer') || 'NONE',
      },
      userId: user?.userId || 'ANONYMOUS',
      requestId: c.req.header('x-request-id') || 'NONE',
      timestamp: new Date().toISOString(),
      stack: err.stack,
    });

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
