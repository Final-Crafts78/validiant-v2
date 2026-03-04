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

// Enterprise Audit Trail: Only Org Owners and Admins can view complete logs
activityRoutes.get(
  '/organization/:orgId',
  requireOrgRole(['owner', 'admin']),
  activityController.getOrganizationAuditLogs
);

export default activityRoutes;
