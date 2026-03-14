/**
 * CSV Import Routes
 *
 * Dedicated pipeline for bulk data ingestion.
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { requireOrgRole } from '../middleware/rbac';
import * as csvImportController from '../controllers/csv-import.controller';

const app = new Hono();

app.use('*', authenticate);

/**
 * GET /api/v1/import/csv/templates
 * List saved mapping templates
 */
app.get(
  '/templates',
  requireOrgRole(['admin', 'member']),
  csvImportController.getTemplates
);

/**
 * POST /api/v1/import/csv/validate
 * Dry-run validation of CSV against mapping
 */
app.post(
  '/validate',
  requireOrgRole(['admin', 'member']),
  csvImportController.validateCsv
);

/**
 * POST /api/v1/import/csv/execute
 * Atomic batch processing of validated rows
 */
app.post(
  '/execute',
  requireOrgRole(['admin', 'member']),
  csvImportController.executeImport
);

export default app;
