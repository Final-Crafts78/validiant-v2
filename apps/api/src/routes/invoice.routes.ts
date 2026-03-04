/**
 * Invoice Routes (Phase 19)
 *
 * Generates CSV invoices aggregating completed tasks and time entries
 * for a project within a given month. Served as a downloadable file.
 */

import { Hono } from 'hono';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import { db, schema } from '../db';

const invoiceRoutes = new Hono();

invoiceRoutes.use('*', authenticate);

/**
 * GET /api/v1/invoices/project/:projectId
 *
 * Query params:
 *   - month: YYYY-MM (defaults to current month)
 *
 * Generates a CSV report of completed tasks with time tracking data.
 */
invoiceRoutes.get('/project/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const monthParam = c.req.query('month'); // YYYY-MM format

    // Parse the month range
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [year, month] = monthParam.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, 1));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    } else {
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      endDate = new Date(
        Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      );
    }

    // Fetch completed tasks in the date range
    const projectTasks = await db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.projectId, projectId),
          gte(schema.tasks.createdAt, startDate),
          lte(schema.tasks.createdAt, endDate)
        )
      );

    // Fetch time entries for those tasks
    const taskIds: string[] = projectTasks.map((t: { id: string }) => t.id);
    const timeEntriesByTask: Record<string, number> = {};

    if (taskIds.length > 0) {
      const timeEntries = await db
        .select({
          taskId: schema.timeEntries.taskId,
          totalSeconds:
            sql<number>`COALESCE(SUM(${schema.timeEntries.duration}), 0)`.mapWith(
              Number
            ),
        })
        .from(schema.timeEntries)
        .where(
          sql`${schema.timeEntries.taskId} IN (${sql.join(
            taskIds.map((id: string) => sql`${id}`),
            sql`, `
          )})`
        )
        .groupBy(schema.timeEntries.taskId);

      for (const entry of timeEntries) {
        timeEntriesByTask[entry.taskId] = entry.totalSeconds;
      }
    }

    // Build CSV
    const csvHeaders = [
      'Task ID',
      'Title',
      'Client Name',
      'Pincode',
      'Status',
      'Priority',
      'Created Date',
      'Completed Date',
      'Time Tracked (hours)',
      'SLA Status',
    ];

    let csv = csvHeaders.join(',') + '\n';

    for (const t of projectTasks) {
      const trackedSeconds = timeEntriesByTask[t.id] || 0;
      const trackedHours = Math.round((trackedSeconds / 3600) * 100) / 100;

      // SLA calculation: check if completed within 72 hours of creation
      let slaStatus = 'N/A';
      if (t.completedAt) {
        const hoursToComplete =
          (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        slaStatus = hoursToComplete <= 72 ? 'On Time' : 'Overdue';
      } else if (t.status !== 'Completed' && t.status !== 'Verified') {
        const hoursElapsed =
          (now.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        slaStatus = hoursElapsed > 72 ? 'Overdue' : 'In Progress';
      }

      const escCsv = (val: string | null | undefined) =>
        `"${(val || '').replace(/"/g, '""')}"`;

      csv +=
        [
          escCsv(t.id),
          escCsv(t.title),
          escCsv(t.clientName),
          escCsv(t.pincode),
          escCsv(t.status),
          escCsv(t.priority),
          escCsv(t.createdAt.toISOString()),
          escCsv(t.completedAt?.toISOString()),
          String(trackedHours),
          escCsv(slaStatus),
        ].join(',') + '\n';
    }

    const monthStr =
      monthParam ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return c.text(csv, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="validiant-invoice-${projectId.slice(0, 8)}-${monthStr}.csv"`,
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return c.json({ success: false, error: 'Failed to generate invoice' }, 500);
  }
});

/**
 * GET /api/v1/invoices/project/:projectId/summary
 *
 * Returns JSON summary instead of CSV download — useful for dashboard preview.
 */
invoiceRoutes.get('/project/:projectId/summary', async (c) => {
  try {
    const projectId = c.req.param('projectId');

    // Aggregate stats
    const [stats] = await db
      .select({
        totalTasks: sql<number>`COUNT(${schema.tasks.id})`.mapWith(Number),
        completedTasks:
          sql<number>`COUNT(CASE WHEN ${schema.tasks.status} IN ('Completed', 'Verified') THEN 1 END)`.mapWith(
            Number
          ),
        totalTimeSeconds: sql<number>`COALESCE(SUM(te.duration), 0)`.mapWith(
          Number
        ),
      })
      .from(schema.tasks)
      .leftJoin(
        schema.timeEntries,
        eq(schema.tasks.id, schema.timeEntries.taskId)
      )
      .where(eq(schema.tasks.projectId, projectId));

    return c.json({
      success: true,
      data: {
        totalTasks: stats?.totalTasks || 0,
        completedTasks: stats?.completedTasks || 0,
        totalTimeHours:
          Math.round(((stats?.totalTimeSeconds || 0) / 3600) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Invoice summary error:', error);
    return c.json(
      { success: false, error: 'Failed to get invoice summary' },
      500
    );
  }
});

export default invoiceRoutes;
