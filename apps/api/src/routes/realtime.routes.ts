import { Hono } from 'hono';
import { authenticate, UserContext } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';
import { Env } from '../app';

const router = new Hono<{ Bindings: Env; Variables: { user: UserContext } }>();

/**
 * GET /api/v1/realtime/stream
 *
 * Establishes a persistent SSE connection for the authenticated user's organization.
 */
router.get('/stream', authenticate, async (c) => {
  const user = c.get('user') as UserContext;
  const orgId = user?.organizationId;

  if (!orgId) {
    throw new BadRequestError(
      'Active organization context required for real-time stream. Ensure X-Org-Id header is present.'
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
