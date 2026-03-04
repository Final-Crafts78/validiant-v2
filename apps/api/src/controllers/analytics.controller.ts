/**
 * Analytics Controller
 *
 * Project-scoped analytics with parallel Drizzle aggregation queries.
 * All queries are tenant-isolated by projectId.
 */

import { Context } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { db, schema } from '../db';

/**
 * GET /api/v1/analytics/project/:projectId
 * Returns dashboard stats: status counts, priority counts, and recent completions.
 */
export const getProjectAnalytics = async (c: Context) => {
  try {
    const projectId = c.req.param('projectId');

    // Run all aggregations in parallel to minimize Edge execution time
    const [statusCounts, priorityCounts, recentTasks] = await Promise.all([
      // 1. Tasks Grouped by Status
      db
        .select({
          status: schema.tasks.status,
          count: sql<number>`count(${schema.tasks.id})`.mapWith(Number),
        })
        .from(schema.tasks)
        .where(eq(schema.tasks.projectId, projectId))
        .groupBy(schema.tasks.status),

      // 2. Tasks Grouped by Priority
      db
        .select({
          priority: schema.tasks.priority,
          count: sql<number>`count(${schema.tasks.id})`.mapWith(Number),
        })
        .from(schema.tasks)
        .where(eq(schema.tasks.projectId, projectId))
        .groupBy(schema.tasks.priority),

      // 3. Recently completed or verified tasks (Limit 5)
      db
        .select({
          id: schema.tasks.id,
          title: schema.tasks.title,
          status: schema.tasks.status,
          completedAt: schema.tasks.completedAt,
        })
        .from(schema.tasks)
        .where(
          and(
            eq(schema.tasks.projectId, projectId),
            sql`${schema.tasks.status} IN ('Completed', 'Verified')`
          )
        )
        .orderBy(sql`${schema.tasks.completedAt} DESC`)
        .limit(5),
    ]);

    return c.json({
      success: true,
      data: {
        statusCounts,
        priorityCounts,
        recentTasks,
        totalTasks: statusCounts.reduce(
          (acc: number, curr: { count: number }) => acc + curr.count,
          0
        ),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ success: false, error: 'Failed to fetch analytics' }, 500);
  }
};
