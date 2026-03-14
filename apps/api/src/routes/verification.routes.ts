/**
 * Verification Type Routes (Phase 11)
 *
 * Endpoints for managing verification types and their field schemas.
 *
 * Routes:
 * - GET /:orgId - List verification types for an organization
 * - POST /:orgId - Create a new verification type
 * - PUT /:orgId/:id - Update verification type (and create new version)
 * - GET /:orgId/:id/versions - List schema versions for a verification type
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  createVerificationTypeSchema,
  updateVerificationTypeSchema,
} from '@validiant/shared';
import * as verificationController from '../controllers/verification.controller';
import { authenticate } from '../middleware/auth';

const app = new Hono();

// All routes require authentication
app.use('*', authenticate);

/**
 * GET /:orgId
 * List all verification types for an organization
 */
app.get('/:orgId', verificationController.listVerificationTypes);

/**
 * POST /:orgId
 * Create a new verification type
 */
app.post(
  '/:orgId',
  zValidator('json', createVerificationTypeSchema),
  verificationController.createVerificationType
);

/**
 * PUT /:orgId/:id
 * Update verification type (and create new field schema version)
 */
app.put(
  '/:orgId/:id',
  zValidator('json', updateVerificationTypeSchema),
  verificationController.updateVerificationType
);

/**
 * GET /:orgId/:id/versions
 * Get schema history for a verification type
 */
app.get('/:orgId/:id/versions', verificationController.getSchemaVersions);

export default app;
