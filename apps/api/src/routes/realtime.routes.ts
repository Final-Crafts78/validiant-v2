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
    userContextOrgId: user?.organizationId || 'MISSING',
    headerOrgId: c.req.header('X-Org-Id') || 'MISSING',
    cookieOrgId: getCookie(c, 'orgId') || 'MISSING',
    queryOrgId: c.req.query('orgId') || 'MISSING',
    queryOrganizationId: c.req.query('organizationId') || 'MISSING',
    tokenParam: !!c.req.query('token'),
    allHeaders: JSON.stringify(c.req.header()),
    rawQuery: c.req.queries(), // Log the raw queries object
  });

  const queryOrgId = c.req.query('orgId') || c.req.query('organizationId');
  const headerOrgId = c.req.header('X-Org-Id');
  const userOrgId = user?.organizationId;
  const cookieOrgId = getCookie(c, 'orgId');

  // ELITE: For SSE, query parameter is the most reliable source as headers are complex for EventSource
  const orgId = queryOrgId || headerOrgId || userOrgId || cookieOrgId;

  const resolutionMarker = queryOrgId ? 'FROM_QUERY' : headerOrgId ? 'FROM_HEADER' : userOrgId ? 'FROM_USER_CONTEXT' : cookieOrgId ? 'FROM_COOKIE' : 'NOT_RESOLVED';

  logger.info('[Realtime:MW] Stream Isolation Decision', {
    path: c.req.path,
    resolvedOrgId: orgId || 'NONE',
    decision: resolutionMarker,
    details: {
      queryOrgId: c.req.query('orgId') || 'MISSING',
      queryOrganizationId: c.req.query('organizationId') || 'MISSING',
      headerOrgId: headerOrgId || 'MISSING',
      userOrgId: userOrgId || 'MISSING',
      cookieOrgId: cookieOrgId || 'MISSING',
    },
    userId: user?.userId,
    timestamp: new Date().toISOString(),
  });

  if (!orgId) {
    logger.error('[Realtime] TERMINAL FAILURE - No organization context found', {
      userId: user?.userId,
      path: c.req.path,
      attemptedDecision: resolutionMarker,
      headers: c.req.header(),
      query: c.req.queries(),
      timestamp: new Date().toISOString(),
      suggestion: 'Client must pass orgId in query string for SSE.',
    });
    throw new BadRequestError(
      'Active organization context required for real-time stream. Ensure orgId query param is present.'
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
