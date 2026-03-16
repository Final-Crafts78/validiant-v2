/**
 * BGV Partner Routes
 *
 * Endpoints for managing integration partners.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  createBgvPartnerSchema,
  updateBgvPartnerSchema,
} from '@validiant/shared';
import * as partnerController from '../controllers/bgv-partner.controller';

const app = new Hono();
/**
 * GET /:orgId
 * List all partners for an organization
 */
app.get('/:orgId', partnerController.listPartners);

/**
 * POST /:orgId
 * Create a new partner integration
 */
app.post(
  '/:orgId',
  zValidator('json', createBgvPartnerSchema),
  partnerController.createPartner
);

/**
 * GET /details/:id
 * Get specific partner details
 */
app.get('/details/:id', partnerController.getPartner);

/**
 * PATCH /details/:id
 * Update partner configuration
 */
app.patch(
  '/details/:id',
  zValidator('json', updateBgvPartnerSchema),
  partnerController.updatePartner
);

export default app;
