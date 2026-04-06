import { Hono } from 'hono';
import * as ingestController from '../controllers/ingest.controller';
import { rateLimit } from '../middleware/rateLimit';

const router = new Hono();

/**
 * Public Inbound Ingestion Routes
 * Dedicated endpoint for external system integration.
 */

// Phase 5.8: Two-layer rate limiting (API level + Key level in controller)
router.post(
  '/:projectKey',
  rateLimit(100, 60, 'rl:ingest'), // 100 requests per minute
  ingestController.ingestData
);

export default router;
