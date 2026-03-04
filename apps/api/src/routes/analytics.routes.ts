/**
 * Analytics Routes
 *
 * Project-scoped analytics endpoints with RBAC protection.
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { requireProjectRole } from '../middleware/rbac';
import * as analyticsController from '../controllers/analytics.controller';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';

const analyticsRoutes = new Hono();

analyticsRoutes.use('*', authenticate);

// Get dashboard stats for a specific project
analyticsRoutes.get(
  '/project/:projectId',
  requireProjectRole([
    'manager',
    'contributor',
    'viewer',
    'owner',
    'admin',
    'member',
  ]),
  analyticsController.getProjectAnalytics
);

// Export tasks to CSV with SLA logic
analyticsRoutes.get(
  '/project/:projectId/export',
  requireProjectRole(['manager', 'owner', 'admin']),
  async (c) => {
    try {
      const projectId = c.req.param('projectId');
      const projectTasks = await db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.projectId, projectId));

      let csv =
        'CaseID,ClientName,Pincode,Status,CreatedDate,CompletedDate,SLAStatus\n';

      for (const t of projectTasks) {
        let slaStatus = 'N/A';
        if (t.createdAt) {
          const endTime = (t.completedAt || new Date()).getTime();
          const hours = (endTime - t.createdAt.getTime()) / (1000 * 60 * 60);
          slaStatus = hours <= 72 ? 'On Time' : 'Overdue';
        }
        csv += `"${t.title}","${t.clientName || ''}","${t.pincode || ''}","${t.status}","${t.createdAt || ''}","${t.completedAt || ''}","${slaStatus}"\n`;
      }

      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="validiant-export-${Date.now()}.csv"`,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      return c.json({ success: false, error: 'CSV export failed' }, 500);
    }
  }
);

export default analyticsRoutes;
