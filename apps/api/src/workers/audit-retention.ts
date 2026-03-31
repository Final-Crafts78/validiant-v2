/**
 * Audit Log Retention Worker
 *
 * Nightly routine to purge old activity logs based on organization settings.
 * Ensures the system stays within compliance retention windows.
 */

import { sql, and } from 'drizzle-orm'; // We define lt below as helper if missing
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
  const workerStartTime = new Date();
  // eslint-disable-next-line no-console
  console.info('[Worker:AuditRetention] Lifecycle START', {
    timestamp: workerStartTime.toISOString(),
  });

  try {
    // 1. Get all organizations and their unique retention windows
    const orgs = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        retentionDays: schema.organizations.auditLogRetentionDays,
      })
      .from(schema.organizations);

    if (orgs.length === 0) {
      // eslint-disable-next-line no-console
      console.info('[Worker:AuditRetention] No organizations found. Exiting.');
      return;
    }

    // 2. Group org IDs by their retention value to minimize subrequests
    const retentionGroups: Record<number, string[]> = {};
    orgs.forEach((org: { id: string; retentionDays: number | null }) => {
      const days = org.retentionDays || 90; // Default 90 days if null
      if (!retentionGroups[days]) retentionGroups[days] = [];
      retentionGroups[days].push(org.id);
    });

    const retentionWindows = Object.keys(retentionGroups).map(Number);
    // eslint-disable-next-line no-console
    console.debug('[Worker:AuditRetention] Grouped organizations', {
      uniqueRetentionWindows: retentionWindows,
      orgCount: orgs.length,
    });

    let totalPurged = 0;
    const now = new Date();

    // 3. Process each retention window as a single batch
    for (const days of retentionWindows) {
      const orgIds = retentionGroups[days];
      const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      try {
        // 🔥 BATCH DELETE: One query for N organizations
        const purgeRes = await db
          .delete(schema.activityLogs)
          .where(
            and(
              sql`${schema.activityLogs.organizationId} IN (${sql.join(
                orgIds.map((id) => sql`${id}`),
                sql`, `
              )})`,
              lessThan(schema.activityLogs.createdAt, threshold)
            )
          )
          .returning({ id: schema.activityLogs.id });

        const purgedInBatch = purgeRes.length;
        totalPurged += purgedInBatch;

        // eslint-disable-next-line no-console
        console.info(`[Worker:AuditRetention] Purge Batch SUCCESS`, {
          days,
          orgCount: orgIds.length,
          purgedCount: purgedInBatch,
        });
      } catch (batchError) {
        // eslint-disable-next-line no-console
        console.error(`[Worker:AuditRetention] Purge Batch FAILED`, {
          days,
          orgIds: orgIds.length,
          error: (batchError as Error).message,
        });
      }
    }

    // 4. Single system-level log for the entire cycle (Minimizes subrequests)
    if (totalPurged > 0) {
      await logActivity({
        action: 'SYSTEM_RETENTION_CYCLE',
        details: `Automated audit retention cycle completed. Total logs purged across all organizations: ${totalPurged}. Total organizations affected: ${orgs.length}.`,
        entityType: 'system',
      });
    }

    const workerEndTime = new Date();
    const durationMs = workerEndTime.getTime() - workerStartTime.getTime();

    // eslint-disable-next-line no-console
    console.info('[Worker:AuditRetention] Lifecycle END', {
      totalPurged,
      durationMs,
      timestamp: workerEndTime.toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Worker:AuditRetention] CRITICAL FAILURE', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    logger.error('[Audit Retention] Critical worker failure:', error as Error);
  }
};
