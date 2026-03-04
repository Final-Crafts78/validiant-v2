/**
 * Activity Controller
 *
 * Enterprise audit trail — paginated activity logs scoped by organization.
 */

import { Context } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from '../db';

/**
 * GET /api/v1/activity/organization/:orgId
 * Returns paginated audit logs for an organization.
 */
export const getOrganizationAuditLogs = async (c: Context) => {
  try {
    const orgId = c.req.param('orgId');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    const logs = await db
      .select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.organizationId, orgId))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      success: true,
      data: logs,
      meta: { page, limit },
    });
  } catch (error) {
    console.error('Activity logs error:', error);
    return c.json({ success: false, error: 'Failed to fetch audit logs' }, 500);
  }
};
