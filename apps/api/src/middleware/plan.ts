import { Context, Next } from 'hono';
import { db } from '../db';
import { organizations, projects, records, orgSubAccounts } from '../db/schema';
import { eq, count } from 'drizzle-orm';
import { getQuotaForPlan } from '../services/billing.service';

/**
 * Plan Enforcement Middleware - Phase 6
 * Blocks resource creation if the organization has reached its plan limits.
 */

export const enforceLimit = (resource: 'projects' | 'records' | 'sub-accounts') => {
  return async (c: Context, next: Next) => {
    const orgId = c.get('orgId') || c.req.param('orgId') || c.req.param('projectId'); 
    // Logic for finding orgId should be consistent with tenant.ts
    
    // 1. Get Org and Plan
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { plan: true },
    });

    if (!org) return c.json({ error: 'Organization not found' }, 404);

    const quotas = getQuotaForPlan(org.plan as any);
    let currentUsage = 0;

    // 2. Count current usage
    if (resource === 'projects') {
      const [result] = await db.select({ value: count() }).from(projects).where(eq(projects.organizationId, orgId));
      currentUsage = result.value;
      if (currentUsage >= quotas.projects) {
        return c.json({
          error: 'Limit Reached',
          message: `Your current plan (${org.plan}) is limited to ${quotas.projects} projects. Upgrade to Pro for more.`,
          code: 'LIMIT_REACHED'
        }, 403);
      }
    } else if (resource === 'records') {
      const projectId = c.req.param('projectId');
      if (!projectId) return c.json({ error: 'Project context missing' }, 400);
      
      const [result] = await db.select({ value: count() }).from(records).where(eq(records.projectId, projectId));
      currentUsage = result.value;
      
      if (currentUsage >= quotas.records) {
        return c.json({
          error: 'Limit Reached',
          message: `Your current plan (${org.plan}) is limited to ${quotas.records} records per project. Upgrade to Pro for more.`,
          code: 'LIMIT_REACHED'
        }, 403);
      }
    } else if (resource === 'sub-accounts') {
      const [result] = await db.select({ value: count() }).from(orgSubAccounts).where(eq(orgSubAccounts.organizationId, orgId));
      currentUsage = result.value;
      
      if (currentUsage >= quotas.subAccounts) {
        return c.json({
          error: 'Limit Reached',
          message: `Your current plan (${org.plan}) is limited to ${quotas.subAccounts} sub-accounts. Upgrade to Pro for more.`,
          code: 'LIMIT_REACHED'
        }, 403);
      }
    }

    await next();
  };
};
