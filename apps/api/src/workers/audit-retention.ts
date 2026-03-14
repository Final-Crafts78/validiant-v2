/**
 * Audit Log Retention Worker
 *
 * Nightly routine to purge old activity logs based on organization settings.
 * Ensures the system stays within compliance retention windows.
 */

import { sql, eq, and } from 'drizzle-orm'; // We define lt below as helper if missing
import { db, schema } from '../db';
import { logger } from '../utils/logger';
import { logActivity } from '../utils/activity';

// Helper for LT (Less Than) to ensure edge compatibility
function lessThan(
  column: import('drizzle-orm').AnyColumn | import('drizzle-orm').SQL,
  value: Date | string | number
): import('drizzle-orm').SQL {
  return sql`${column} < ${value}`;
}

export const purgeAuditLogs = async () => {
  logger.info('[Audit Retention] Starting purge cycle...');

  try {
    const orgs = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        retentionDays: schema.organizations.auditLogRetentionDays,
      })
      .from(schema.organizations);

    const now = new Date();

    for (const org of orgs) {
      try {
        const threshold = new Date(
          now.getTime() - org.retentionDays * 24 * 60 * 60 * 1000
        );

        // 1. Calculate how many logs will be purged
        const countRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.activityLogs)
          .where(
            and(
              eq(schema.activityLogs.organizationId, org.id),
              lessThan(schema.activityLogs.createdAt, threshold)
            )
          );

        const toPurgeCount = Number(countRes[0]?.count || 0);

        if (toPurgeCount > 0) {
          // 2. Perform deletion
          await db
            .delete(schema.activityLogs)
            .where(
              and(
                eq(schema.activityLogs.organizationId, org.id),
                lessThan(schema.activityLogs.createdAt, threshold)
              )
            );

          logger.info(
            `[Audit Retention] Purged ${toPurgeCount} logs for org ${org.name} (${org.id})`
          );

          // 3. Log the operation itself as a permanent audit record
          await logActivity({
            organizationId: org.id,
            action: 'AUDIT_LOG_PURGED',
            entityId: org.id,
            entityType: 'organization',
            details: `Automated retention policy applied. Purged ${toPurgeCount} logs older than ${org.retentionDays} days.`,
          });
        }
      } catch (orgError) {
        logger.error(
          `[Audit Retention] Org ${org.name} failed:`,
          orgError as Error
        );
      }
    }

    logger.info('[Audit Retention] Purge cycle completed.');
  } catch (error) {
    logger.error('[Audit Retention] Critical worker failure:', error as Error);
  }
};
