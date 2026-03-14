/**
 * Activity Routes
 *
 * Enterprise audit trail endpoints — restricted to org owners and admins.
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { requireOrgRole } from '../middleware/rbac';
import * as activityController from '../controllers/activity.controller';

const activityRoutes = new Hono();

activityRoutes.use('*', authenticate);

// Enterprise Audit Trail: Paginated logs scoped by organization
activityRoutes.get(
  '/',
  requireOrgRole(['owner', 'admin', 'manager']),
  activityController.getOrganizationAuditLogs
);

// Compliance Export: CSV dump
activityRoutes.get(
  '/export',
  requireOrgRole(['owner', 'admin', 'manager']),
  activityController.exportAuditLogs
);

export default activityRoutes;
