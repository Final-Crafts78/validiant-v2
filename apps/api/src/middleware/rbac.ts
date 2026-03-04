/**
 * RBAC Middleware (Role-Based Access Control)
 *
 * Edge-native middleware to verify Organization and Project roles.
 * Uses Drizzle ORM queries against the membership join tables.
 *
 * Organization Roles: 'owner' | 'admin' | 'member'
 * Project Roles:      'manager' | 'contributor' | 'viewer'
 */

import type { Context, Next } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import type { UserContext } from './auth';

/**
 * Verify user has the required Organization role.
 * Reads orgId from route param `:orgId` or query string `organizationId`.
 */
export const requireOrgRole = (allowedRoles: string[]) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const user = c.get('user') as UserContext | undefined;
    if (!user || !user.userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const orgId = c.req.param('orgId') || c.req.query('organizationId');
    if (!orgId) {
      return c.json({ success: false, error: 'Organization ID required' }, 400);
    }

    try {
      const [membership] = await db
        .select()
        .from(schema.organizationMembers)
        .where(
          and(
            eq(schema.organizationMembers.organizationId, orgId),
            eq(schema.organizationMembers.userId, user.userId)
          )
        )
        .limit(1);

      if (!membership || !allowedRoles.includes(membership.role)) {
        return c.json(
          { success: false, error: 'Insufficient organization permissions' },
          403
        );
      }

      // Attach org role to context for downstream use
      c.set('orgRole', membership.role);
      await next();
    } catch (error) {
      console.error('RBAC org check failed:', error);
      return c.json({ success: false, error: 'Permission check failed' }, 500);
    }
  };
};

/**
 * Verify user has the required Project role.
 * Reads projectId from route param `:projectId` or from JSON body.
 */
export const requireProjectRole = (allowedRoles: string[]) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const user = c.get('user') as UserContext | undefined;
    if (!user || !user.userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Try route param first, then query string, then JSON body
    let projectId = c.req.param('projectId') || c.req.query('projectId');
    if (!projectId) {
      try {
        const body = await c.req.json().catch(() => ({}));
        projectId = body.projectId;
      } catch {
        // ignore parse errors
      }
    }

    if (!projectId) {
      return c.json({ success: false, error: 'Project ID required' }, 400);
    }

    try {
      const [membership] = await db
        .select()
        .from(schema.projectMembers)
        .where(
          and(
            eq(schema.projectMembers.projectId, projectId),
            eq(schema.projectMembers.userId, user.userId)
          )
        )
        .limit(1);

      if (!membership || !allowedRoles.includes(membership.role)) {
        return c.json(
          { success: false, error: 'Insufficient project permissions' },
          403
        );
      }

      // Attach project role to context for downstream use
      c.set('projectRole', membership.role);
      await next();
    } catch (error) {
      console.error('RBAC project check failed:', error);
      return c.json({ success: false, error: 'Permission check failed' }, 500);
    }
  };
};
