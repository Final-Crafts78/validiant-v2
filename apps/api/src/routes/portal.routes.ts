import { Hono } from 'hono';
import * as portalController from '../controllers/portal.controller';

const router = new Hono();

/**
 * Client & Field Portal Routes
 * Optimized for external/field access with token-based security.
 */

router.get('/context', portalController.getPortalContextHandler);

// Project-scoped portal access
router.get('/:projectKey/records', portalController.listPortalRecords);
router.get('/:projectKey/types', portalController.listPortalTypes);
router.get('/:projectKey/records/:number', portalController.getPortalRecord);
router.post('/:projectKey/records', portalController.ingestPortalRecord);

export default router;
