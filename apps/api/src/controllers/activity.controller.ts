/**
 * Activity Controller
 *
 * Enterprise audit trail — paginated activity logs scoped by organization.
 */

import { Context } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from '../db';

/**
 * GET /api/v1/activity
 * Returns paginated audit logs for the current organization.
 */
export const getOrganizationAuditLogs = async (c: Context) => {
  try {
    const orgId = c.get('orgId');
    if (!orgId) {
      return c.json(
        { success: false, error: 'Organization context missing' },
        400
      );
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const entityId = c.req.query('entityId');
    const entityType = c.req.query('entityType');
    const offset = (page - 1) * limit;

    const conditions = [eq(schema.activityLogs.organizationId, orgId)];
    if (entityId) {
      conditions.push(eq(schema.activityLogs.entityId, entityId));
    }
    if (entityType) {
      conditions.push(eq(schema.activityLogs.entityType, entityType));
    }

    const logs = await db
      .select()
      .from(schema.activityLogs)
      .where(and(...conditions))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Basic integrity hint: check if chain is broken within this page
    const data = logs.map((log: any, i: number) => {
      const isChainBroken =
        i < logs.length - 1 && logs[i].prevHash !== logs[i + 1].contentHash;
      return { ...log, isChainBroken };
    });

    return c.json({
      success: true,
      data,
      meta: { page, limit },
    });
  } catch (error) {
    console.error('Activity logs error:', error);
    return c.json({ success: false, error: 'Failed to fetch audit logs' }, 500);
  }
};

/**
 * GET /api/v1/activity/export
 * Dumps last 5000 logs to CSV for compliance auditors.
 */
export const exportAuditLogs = async (c: Context) => {
  try {
    const orgId = c.get('orgId');
    if (!orgId) {
      return c.json(
        { success: false, error: 'Organization context missing' },
        400
      );
    }

    const logs = await db
      .select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.organizationId, orgId))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(5000);

    const header = [
      'Timestamp',
      'Action',
      'Entity TYPE',
      'Entity ID',
      'Details',
      'User ID',
      'IP Address',
      'Device',
      'User Agent',
      'Content Hash',
    ];

    const csvRows = logs.map((l: any) => [
      l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
      l.action,
      l.entityType || '',
      l.entityId || '',
      (l.details || '').replace(/"/g, '""'),
      l.userId || 'SYSTEM',
      l.ipAddress || '',
      l.deviceType || '',
      (l.userAgent || '').replace(/"/g, '""'),
      l.contentHash || '',
    ]);

    const csvString = [
      header.join(','),
      ...csvRows.map((row: any[]) =>
        row.map((cell: any) => `"${cell}"`).join(',')
      ),
    ].join('\n');

    return c.newResponse(csvString, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
    });
  } catch (error) {
    console.error('Audit export error:', error);
    return c.json({ success: false, error: 'Failed to export logs' }, 500);
  }
};
