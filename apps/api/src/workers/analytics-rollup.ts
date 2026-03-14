/**
 * Analytics Rollup Worker
 *
 * Aggregates organization metrics every 15 minutes and stores them
 * in the orgAnalyticsSnapshots table for O(1) retrieval.
 */

import { sql, eq, and, isNull, count, sum } from 'drizzle-orm';
import { db } from '../db';
import {
  organizations,
  tasks,
  orgAnalyticsSnapshots,
  activityLogs,
  timeEntries,
} from '../db/schema';
import { logger } from '../utils/logger';

export const rollupAnalytics = async () => {
  logger.info('[Analytics Rollup] Starting aggregation...');

  try {
    const orgs = await db.select({ id: organizations.id }).from(organizations);
    const now = new Date();

    for (const org of orgs) {
      try {
        // 1. Task Metrics
        const taskStats = await db
          .select({
            status: tasks.statusKey,
            count: count(),
          })
          .from(tasks)
          .where(and(eq(tasks.organizationId, org.id), isNull(tasks.deletedAt)))
          .groupBy(tasks.statusKey);

        const totalTasks = taskStats.reduce(
          (acc: number, curr: { count: number }) => acc + curr.count,
          0
        );
        const completedTasks =
          taskStats.find(
            (s: { status: string; count: number }) => s.status === 'COMPLETED'
          )?.count || 0;

        // 2. SLA Metrics
        const slaBreaches = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.organizationId, org.id),
              isNull(tasks.completedAt),
              isNull(tasks.deletedAt),
              lt(tasks.dueDate, now)
            )
          )
          .then((res: { count: number }[]) => res[0]?.count || 0);

        // 3. Activity Metrics (Last 24 hours)
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const dailyActivity = await db
          .select({ count: count() })
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.organizationId, org.id),
              sql`${activityLogs.createdAt} > ${dayAgo}`
            )
          )
          .then((res: { count: number }[]) => res[0]?.count || 0);

        // 4. Productivity Metrics (Time tracked in last 24h)
        const dailyTimeSeconds = await db
          .select({ total: sum(timeEntries.duration) })
          .from(timeEntries)
          .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
          .where(
            and(
              eq(tasks.organizationId, org.id),
              sql`${timeEntries.createdAt} > ${dayAgo}`
            )
          )
          .then((res: { total: string | null }[]) =>
            Number(res[0]?.total || 0)
          );

        // Compile metrics object
        const metrics = {
          tasks: {
            total: totalTasks,
            completed: completedTasks,
            pending: totalTasks - completedTasks,
            byStatus: Object.fromEntries(
              taskStats.map((s: { status: string; count: number }) => [
                s.status,
                s.count,
              ])
            ),
          },
          sla: {
            breached: slaBreaches,
          },
          productivity: {
            dailyActivity,
            dailyTimeSeconds,
            averageTimePerTask:
              completedTasks > 0 ? dailyTimeSeconds / completedTasks : 0,
          },
        };

        // Store snapshot
        await db.insert(orgAnalyticsSnapshots).values({
          organizationId: org.id,
          recordedAt: now,
          metrics,
        });
      } catch (orgError) {
        logger.error(
          `[Analytics Rollup] Failed for org ${org.id}:`,
          orgError as Error
        );
      }
    }

    logger.info(
      `[Analytics Rollup] Completed for ${orgs.length} organizations.`
    );
  } catch (error) {
    logger.error('[Analytics Rollup] Critical failure:', error as Error);
  }
};

// Helper for LT (Less Than) since it was missing in imports
function lt(column: any, value: any) {
  return sql`${column} < ${value}`;
}
