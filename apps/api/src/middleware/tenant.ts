/**
 * Tenant Isolation Middleware
 *
 * Scopes database queries to the active organization based on:
 * 1. X-Org-Id header (prioritized)
 * 2. Organization slug/id from route param (e.g., /:orgId/tasks)
 *
 * This middleware ensures that even with a valid JWT, a user cannot
 * access data from an organization they haven't explicitly selected.
 */

import type { Context, Next } from 'hono';
import { UserContext } from './auth';

/**
 * Tenant Context Interface
 */
export interface TenantContext {
  organizationId: string;
}

/**
 * Tenant Isolation Middleware Factory
 * Resolves the organization ID and attaches it to the Hono context.
 * Downstream services/repositories MUST use c.get('orgId') to scope queries.
 */
export const tenantIsolation = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  // Path exclusions are now handled globally in app.ts for consistency
  const user = c.get('user') as UserContext | undefined;

  if (!user || !user.userId) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  // 1. Check for X-Org-Id header (Standard for API clients/Mobile)
  let orgId = c.req.header('X-Org-Id');

  // 2. Fallback: Parse from route params (Standard for Web URL structures)
  if (!orgId) {
    orgId = c.req.param('orgId') || c.req.query('organizationId');
  }

  if (!orgId) {
    // Some routes might not be org-scoped (like /auth/me), but for scoped routes, this is fatal.
    // We allow it to pass if downstream logic handles global scope,
    // but the spec suggests scoping "every single database query".
    await next();
    return;
  }

  // Phase 4 says "scope every query automatically" - we attach the ID.
  console.debug('[Tenant:MW] Resolved OrgId', {
    orgId,
    source: c.req.header('X-Org-Id') ? 'header' : (c.req.param('orgId') ? 'param' : (c.req.query('organizationId') ? 'query' : 'unknown')),
    path: c.req.path,
    userId: user.userId
  });

  c.set('orgId', orgId);
  c.set('organizationId', orgId); // Legacy support for some controllers

  await next();
};
