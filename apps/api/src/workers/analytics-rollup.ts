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
  logger.info('[Analytics Rollup] Starting optimized batched aggregation...');

  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. ELITE: Use db.batch for the initial aggregation phase (5 queries in 1 subrequest)
    const [
      activeOrgs,
      allTaskStats,
      allSlaBreaches,
      allDailyActivity,
      allDailyTime,
    ] = await db.batch([
      db
        .select({ id: organizations.id })
        .from(organizations)
        .where(isNull(organizations.deletedAt)),

      db
        .select({
          orgId: tasks.organizationId,
          status: tasks.statusKey,
          count: count(),
        })
        .from(tasks)
        .where(isNull(tasks.deletedAt))
        .groupBy(tasks.organizationId, tasks.statusKey),

      db
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
        .groupBy(tasks.organizationId),

      db
        .select({
          orgId: activityLogs.organizationId,
          count: count(),
        })
        .from(activityLogs)
        .where(sql`${activityLogs.createdAt} > ${dayAgo}`)
        .groupBy(activityLogs.organizationId),

      db
        .select({
          orgId: tasks.organizationId,
          total: sum(timeEntries.duration),
        })
        .from(timeEntries)
        .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
        .where(sql`${timeEntries.createdAt} > ${dayAgo}`)
        .groupBy(tasks.organizationId),
    ]);

    if (activeOrgs.length === 0) {
      logger.info('[Analytics Rollup] No organizations found. Skipping.');
      return;
    }

    // 2. Combine data in memory
    const orgData = new Map();

    // Initialize map
    for (const org of activeOrgs) {
      orgData.set(org.id, {
        taskStats: [],
        slaBreaches: 0,
        dailyActivity: 0,
        dailyTimeSeconds: 0,
      });
    }

    // Fill data with robust numeric conversion
    (allTaskStats as any[]).forEach((s) => {
      if (orgData.has(s.orgId)) {
        orgData.get(s.orgId).taskStats.push({
          status: s.status,
          count: Number(s.count || 0),
        });
      }
    });
    (allSlaBreaches as any[]).forEach((s) => {
      if (orgData.has(s.orgId))
        orgData.get(s.orgId).slaBreaches = Number(s.count || 0);
    });
    (allDailyActivity as any[]).forEach((s) => {
      if (orgData.has(s.orgId))
        orgData.get(s.orgId).dailyActivity = Number(s.count || 0);
    });
    (allDailyTime as any[]).forEach((s) => {
      if (orgData.has(s.orgId))
        orgData.get(s.orgId).dailyTimeSeconds = Number(s.total || 0);
    });

    // 3. Generate snapshot values
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

    // 4. Persistence Phase - Also using db.batch if possible, or large chunks
    if (snapshotsToInsert.length > 0) {
      // D1 limit is 100 values or so per insert, but batching allows 50 statements
      // We'll chunk at 50 to minimize round trips while avoiding statement limits
      const batchCommands = [];
      for (let i = 0; i < snapshotsToInsert.length; i += 50) {
        const chunk = snapshotsToInsert.slice(i, i + 50);
        batchCommands.push(db.insert(orgAnalyticsSnapshots).values(chunk));
      }

      if (batchCommands.length > 0) {
        await db.batch(batchCommands as any);
      }
    }

    logger.info(
      `[Analytics Rollup] SUCCESS - Aggregated ${activeOrgs.length} orgs in ${(performance.now() - startTime).toFixed(2)}ms. Subrequests: Phase 1 (1) + Phase 2 (1) = 2 TOTAL.`
    );
  } catch (error) {
    logger.error('[Analytics Rollup] CRITICAL FAILURE:', error as Error);
  }
};
