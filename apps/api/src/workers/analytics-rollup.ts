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
  const startTime = performance.now();
  logger.info('[Analytics Rollup] Starting batched aggregation...');

  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Get all active organizations
    const orgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(isNull(organizations.deletedAt));

    if (orgs.length === 0) {
      logger.info('[Analytics Rollup] No organizations found. Skipping.');
      return;
    }

    // 2. Batched Task Metrics (all orgs at once)
    const allTaskStats = await db
      .select({
        orgId: tasks.organizationId,
        status: tasks.statusKey,
        count: count(),
      })
      .from(tasks)
      .where(isNull(tasks.deletedAt))
      .groupBy(tasks.organizationId, tasks.statusKey);

    // 3. Batched SLA Breaches (all orgs at once)
    const allSlaBreaches = await db
      .select({
        orgId: tasks.organizationId,
        count: count(),
      })
      .from(tasks)
      .where(
        and(
          isNull(tasks.completedAt),
          isNull(tasks.deletedAt),
          sql`${tasks.dueDate} < ${now}`
        )
      )
      .groupBy(tasks.organizationId);

    // 4. Batched Activity Metrics (all orgs at once)
    const allDailyActivity = await db
      .select({
        orgId: activityLogs.organizationId,
        count: count(),
      })
      .from(activityLogs)
      .where(sql`${activityLogs.createdAt} > ${dayAgo}`)
      .groupBy(activityLogs.organizationId);

    // 5. Batched Productivity Metrics (all orgs at once)
    const allDailyTime = await db
      .select({
        orgId: tasks.organizationId,
        total: sum(timeEntries.duration),
      })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .where(sql`${timeEntries.createdAt} > ${dayAgo}`)
      .groupBy(tasks.organizationId);

    // 6. Combine data in memory
    const orgData = new Map();

    // Initialize map
    for (const org of orgs) {
      orgData.set(org.id, {
        taskStats: [],
        slaBreaches: 0,
        dailyActivity: 0,
        dailyTimeSeconds: 0,
      });
    }

    // Fill data
    allTaskStats.forEach((s: any) => {
      if (orgData.has(s.orgId)) orgData.get(s.orgId).taskStats.push(s);
    });
    allSlaBreaches.forEach((s: any) => {
      if (orgData.has(s.orgId)) orgData.get(s.orgId).slaBreaches = s.count;
    });
    allDailyActivity.forEach((s: any) => {
      if (orgData.has(s.orgId))
        orgData.get(s.orgId).dailyActivity = Number(s.count);
    });
    allDailyTime.forEach((s: any) => {
      if (orgData.has(s.orgId))
        orgData.get(s.orgId).dailyTimeSeconds = Number(s.total || 0);
    });

    // 7. Generate snapshot values
    const snapshotsToInsert = [];

    for (const [orgId, data] of orgData.entries()) {
      const totalTasks = data.taskStats.reduce(
        (acc: number, curr: { count: number }) => acc + curr.count,
        0
      );
      const completedTasks =
        data.taskStats.find(
          (s: { status: string; count: number }) => s.status === 'COMPLETED'
        )?.count || 0;

      const metrics = {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: totalTasks - completedTasks,
          byStatus: Object.fromEntries(
            data.taskStats.map((s: { status: string; count: number }) => [
              s.status,
              s.count,
            ])
          ),
        },
        sla: {
          breached: data.slaBreaches,
        },
        productivity: {
          dailyActivity: data.dailyActivity,
          dailyTimeSeconds: data.dailyTimeSeconds,
          averageTimePerTask:
            completedTasks > 0 ? data.dailyTimeSeconds / completedTasks : 0,
        },
      };

      snapshotsToInsert.push({
        organizationId: orgId,
        recordedAt: now,
        metrics,
      });
    }

    // 8. Bulk Insert (if any)
    if (snapshotsToInsert.length > 0) {
      // Chalk-board: We do it in chunks of 50 to be extra safe with SQL params length
      for (let i = 0; i < snapshotsToInsert.length; i += 50) {
        const chunk = snapshotsToInsert.slice(i, i + 50);
        await db.insert(orgAnalyticsSnapshots).values(chunk);
      }
    }

    logger.info(
      `[Analytics Rollup] SUCCESS - Aggregated ${orgs.length} orgs in ${(performance.now() - startTime).toFixed(2)}ms using ${5 + Math.ceil(snapshotsToInsert.length / 50)} subrequests.`
    );
  } catch (error) {
    logger.error('[Analytics Rollup] CRITICAL FAILURE:', error as Error);
  }
};

