import { Hono } from 'hono';
import { UserContext } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';
import { Env } from '../app';
import { getCookie } from 'hono/cookie';
import { logger } from '../utils/logger';

const router = new Hono<{
  Bindings: Env;
  Variables: { user: UserContext; requestId?: string };
}>();

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

  const rawUrl = new URL(c.req.url);
  const searchOrgId =
    rawUrl.searchParams.get('orgId') ||
    rawUrl.searchParams.get('organizationId');
  const queryOrgId =
    c.req.query('orgId') || c.req.query('organizationId') || searchOrgId;
  const headerOrgId = c.req.header('X-Org-Id');
  const userOrgId = user?.organizationId;
  const cookieOrgId = getCookie(c, 'orgId');

  // ELITE: For SSE, query parameter is the most reliable source as headers are complex for EventSource
  const orgId = queryOrgId || headerOrgId || userOrgId || cookieOrgId;

  const resolutionMarker = queryOrgId
    ? 'FROM_QUERY'
    : headerOrgId
      ? 'FROM_HEADER'
      : userOrgId
        ? 'FROM_USER_CONTEXT'
        : cookieOrgId
          ? 'FROM_COOKIE'
          : 'NOT_RESOLVED';

  logger.debug('[Realtime:MW] Stream Isolation Decision', {
    url: c.req.url,
    path: c.req.path,
    resolvedOrgId: orgId || 'NONE',
    decision: resolutionMarker,
    details: {
      searchParamsOrgId: searchOrgId || 'MISSING',
      honoQueryOrgId: c.req.query('orgId') || 'MISSING',
      headerOrgId: headerOrgId || 'MISSING',
      userOrgId: userOrgId || 'MISSING',
      cookieOrgId: cookieOrgId || 'MISSING',
    },
    userId: user?.userId,
    timestamp: new Date().toISOString(),
  });

  if (!orgId) {
    logger.error(
      '[Realtime] TERMINAL FAILURE - No organization context found',
      {
        userId: user?.userId,
        path: c.req.path,
        attemptedDecision: resolutionMarker,
        headers: c.req.header(),
        query: c.req.queries(),
        timestamp: new Date().toISOString(),
        suggestion: 'Client must pass orgId in query string for SSE.',
      }
    );
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
  // ELITE: Use internal host to disambiguate from public API requests in wrangler tail
  const doUrl = new URL(c.req.url);
  doUrl.hostname = 'durable-object-internal';
  doUrl.pathname = '/stream';

  const subrequestStartTime = performance.now();
  const requestId =
    (c.get('requestId') as string) ||
    c.req.header('cf-ray') ||
    `internal-${Math.random().toString(36).substring(7)}`;

  logger.debug('[Realtime:Proxy] Initiating DO subrequest', {
    orgId,
    doUrl: doUrl.toString(),
    requestId,
    method: c.req.method,
    hasUser: !!user,
    rawHeaders: JSON.stringify(c.req.header()),
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await room.fetch(doUrl.toString(), {
      headers: {
        ...c.req.raw.headers,
        'x-request-id': requestId,
        'x-internal-proxy': 'true',
      },
    });

    // ELITE: Extreme Visibility for SSE Lifecycles
    const streamStartTime = Date.now();
    const { readable, writable } = new TransformStream({
      start() {
        logger.info(
          '[Realtime:Stream] Connection ESTABLISHED (Handoff Success)',
          {
            orgId,
            userId: user?.userId,
            requestId,
            timestamp: new Date().toISOString(),
          }
        );
      },
      transform(chunk, controller) {
        // Pass through
        controller.enqueue(chunk);
      },
      flush() {
        const streamDuration = ((Date.now() - streamStartTime) / 1000).toFixed(
          2
        );
        logger.info('[Realtime:Stream] Connection CLOSED (Pipeline Flushed)', {
          orgId,
          userId: user?.userId,
          requestId,
          duration: `${streamDuration}s`,
          timestamp: new Date().toISOString(),
        });
      },
    });

    const duration = (performance.now() - subrequestStartTime).toFixed(2);
    logger.debug('[Realtime:Proxy] DO subrequest COMPLETED', {
      orgId,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      contentType: response.headers.get('Content-Type'),
    });

    // Pipe the DO response through our tracker
    if (response.body) {
      // ELITE: We don't await pipeTo here because we need to return the Response immediately
      // but we catch any async errors in the background.
      response.body.pipeTo(writable).catch((err) => {
        logger.error('[Realtime:Stream] Pipeline FAILED', {
          orgId,
          userId: user?.userId,
          requestId,
          error: err instanceof Error ? err.message : 'Pipe error',
          timestamp: new Date().toISOString(),
        });
      });

      return new Response(readable, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return response;
  } catch (error) {
    const duration = (performance.now() - subrequestStartTime).toFixed(2);
    logger.error('[Realtime:Proxy] DO subrequest FAILED (Canceled/Error)', {
      orgId,
      error: error instanceof Error ? error.message : 'Unknown error',
      isAbort: error instanceof Error && error.name === 'AbortError',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
});

export default router;
