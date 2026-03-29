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
import { PermissionKey, PLATFORM_ROLE_PERMISSIONS } from '@validiant/shared';

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

    const contextOrgId = c.get('orgId');
    const paramOrgId = c.req.param('orgId');
    const queryOrgId = c.req.query('organizationId');
    
    const orgId = contextOrgId || paramOrgId || queryOrgId;

    console.info(`[RBAC:Org] Role Check started`, {
      path: c.req.path,
      method: c.req.method,
      requiredRoles: allowedRoles,
      resolvedOrgId: orgId || 'MISSING',
      contextOrgId: contextOrgId || 'MISSING',
      paramOrgId: paramOrgId || 'MISSING',
      queryOrgId: queryOrgId || 'MISSING',
      userId: user.userId,
    });

    if (!orgId) {
      console.warn('[RBAC:Org] 400 - Organization ID required', {
        path: c.req.path,
        method: c.req.method,
        userId: user.userId,
        suggestion: 'Ensure X-Org-Id header is passed OR organizationId query param.',
      });
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

      console.info(`[RBAC:Org] Membership Lookup Result`, {
        userId: user.userId,
        orgId: orgId,
        found: !!membership,
        role: membership?.role || 'NONE',
        allowedRoles,
      });

      if (!membership || !allowedRoles.includes(membership.role)) {
        console.warn(`[RBAC:Org] Forbidden - Insufficient permissions`, {
          userId: user.userId,
          orgId: orgId,
          userRole: membership?.role || 'NONE',
          requiredRoles: allowedRoles,
        });
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

/**
 * Generic Permission Checker (Edge-Native, No DB)
 *
 * Verifies the user has a specific permission by:
 * 1. Checking the 'permissions' array in the JWT (Phase 5 compliance)
 * 2. Falling back to the Platfrom Role permission map (Phase 3 compliance)
 */
export const requirePermission = (action: PermissionKey) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const user = c.get('user') as UserContext | undefined;
    if (!user || !user.userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // 1. Check direct permissions in JWT (if available)
    const jwtPermissions = user.permissions;
    if (jwtPermissions?.includes(action)) {
      await next();
      return;
    }

    // 2. Fallback: Check Platform Role permissions
    if (user.role) {
      const rolePermissions = PLATFORM_ROLE_PERMISSIONS[user.role];
      if (rolePermissions?.includes(action)) {
        await next();
        return;
      }
    }

    // Special Case: superadmin always has access
    if (user.role === 'superadmin') {
      await next();
      return;
    }

    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: `Insufficient permissions: ${action}`,
      },
      403
    );
  };
};
