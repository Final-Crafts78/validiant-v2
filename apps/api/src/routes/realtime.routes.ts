import { Hono } from 'hono';
import { UserContext } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';
import { Env } from '../app';
import { getCookie } from 'hono/cookie';
import { logger } from '../utils/logger';

const router = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

/**
 * GET /api/v1/realtime/stream
 *
 * Establishes a persistent SSE connection for the authenticated user's organization.
 */
router.get('/stream', async (c) => {
  const user = c.get('user') as UserContext;

  logger.debug('[Realtime] GET /stream Entry', {
    userId: user?.userId || 'MISSING',
    orgId: user?.organizationId || 'MISSING',
    tokenParam: !!c.req.query('token'),
    allHeaders: JSON.stringify(c.req.header()),
    query: c.req.queries(),
  });

  const headerOrgId = c.req.header('X-Org-Id');
  const userOrgId = user?.organizationId;
  const cookieOrgId = getCookie(c, 'orgId');
  const queryOrgId = c.req.query('orgId') || c.req.query('organizationId');

  const orgId = headerOrgId || userOrgId || cookieOrgId || queryOrgId;

  console.debug('[Realtime:MW] Stream Isolation Trace', {
    path: c.req.path,
    method: c.req.method,
    resolvedOrgId: orgId || 'NONE',
    sources: {
      userContext: userOrgId || 'MISSING',
      header: headerOrgId || 'MISSING',
      cookie: cookieOrgId || 'MISSING',
      queryOrgId: c.req.query('orgId') || 'MISSING',
      queryOrganizationId: c.req.query('organizationId') || 'MISSING',
    },
    headers: Object.fromEntries(
      Object.entries(c.req.header()).map(([k, v]) => [
        k, 
        k.toLowerCase().includes('id') || k.toLowerCase().includes('token') || k.toLowerCase().includes('cookie') 
          ? 'PRESENT (Masked)' 
          : v
      ])
    ),
    cookies: {
      hasAccessToken: !!getCookie(c, 'accessToken'),
      hasOrgId: !!getCookie(c, 'orgId'),
      rawCookieNames: c.req.header('cookie') ? c.req.header('cookie')?.split(';').map(c => c.split('=')[0]?.trim() || 'UNKNOWN') : [],
    },
    query: c.req.queries(),
    userId: user?.userId,
    timestamp: new Date().toISOString(),
  });

  if (!orgId) {
    logger.warn('[Realtime] GET /stream - Missing organization context', {
      userId: user?.userId,
      userContextOrgId: userOrgId || 'MISSING',
      headerOrgId: headerOrgId || 'MISSING',
      cookieOrgId: cookieOrgId || 'MISSING',
      hasAccessToken: !!getCookie(c, 'accessToken'),
    });
    throw new BadRequestError(
      'Active organization context required for real-time stream. Ensure X-Org-Id header is present or organization is selected.'
    );
  }

  // Bindings for Durable Objects
  const env = c.env;
  const REALTIME_ROOMS = env.REALTIME_ROOMS;

  if (!REALTIME_ROOMS) {
    throw new Error('Durable Object binding REALTIME_ROOMS not found');
  }

  // Get or create DO instance for this organization
  const id = REALTIME_ROOMS.idFromName(orgId);
  const room = REALTIME_ROOMS.get(id);

  // Proxy the request to the Durable Object
  // We explicitly call the '/stream' path inside the DO
  const doUrl = new URL(c.req.url);
  doUrl.pathname = '/stream';

  return room.fetch(doUrl.toString(), {
    headers: c.req.raw.headers,
  });
});

export default router;
