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

  const existingOrgId = c.get('orgId') || c.get('organizationId');
  if (existingOrgId) {
    console.debug('[Tenant:MW] REDUNDANCY CHECK: orgId already set in context', {
      existingOrgId,
      path: c.req.path,
    });
  }

  // 1. Check for X-Org-Id header (Standard for API clients/Mobile)
  const headerOrgId = c.req.header('X-Org-Id');
  
  // 2. Fallback: Parse from route params or query
  const paramOrgId = c.req.param('orgId');
  const queryOrgId = c.req.query('organizationId') || c.req.query('orgId');

  const orgId = headerOrgId || paramOrgId || queryOrgId;

  // ELITE: Deep Trace for isolation debugging
  console.info('[Tenant:MW] Isolation Trace Entry', {
    path: c.req.path,
    method: c.req.method,
    resolvedOrgId: orgId || 'NONE',
    resolvedFrom: headerOrgId
      ? 'HEADER'
      : paramOrgId
        ? 'PARAM'
        : queryOrgId
          ? 'QUERY'
          : 'NONE',
    sources: {
      header: headerOrgId || 'MISSING',
      param: paramOrgId || 'MISSING',
      queryOrgId: c.req.query('orgId') || 'MISSING',
      queryOrganizationId: c.req.query('organizationId') || 'MISSING',
      jwtContext: user.organizationId || 'MISSING',
      rawXOrgIdHeader: c.req.header('X-Org-Id') || 'NULL',
    },
    contextState: {
      hasOrgId: !!c.get('orgId'),
      hasOrganizationId: !!c.get('organizationId'),
    },
    rawQueries: {
      orgId: c.req.queries('orgId'),
      organizationId: c.req.queries('organizationId'),
    },
    userId: user.userId,
    userAgent: c.req.header('User-Agent') || 'UNKNOWN',
    referer: c.req.header('Referer') || 'NONE',
    timestamp: new Date().toISOString(),
  });

  if (!orgId) {
    console.error('[Tenant:MW] TERMINAL FAILURE - No organization context found', {
      path: c.req.path,
      method: c.req.method,
      userId: user.userId,
      headers: c.req.header(),
      query: c.req.queries(),
      timestamp: new Date().toISOString(),
      suggestion: 'Ensure X-Org-Id header or orgId query parameter is provided.',
    });
    // For non-scoped routes, we allow it to pass, but log the warning
    await next();
    return;
  }

  console.log(`[Tenant:MW] RESOLUTION SUCCESS { orgId: '${orgId}', source: '${headerOrgId ? 'HEADER' : paramOrgId ? 'PARAM' : 'QUERY'}' }`);
  c.set('orgId', orgId);
  c.set('organizationId', orgId); // Legacy support for some controllers

  console.info('[Tenant:Context] Final Scope', {
    userId: user.userId,
    orgId,
    resolvedFrom: headerOrgId ? 'HEADER' : paramOrgId ? 'PARAM' : 'QUERY',
    path: c.req.path,
    timestamp: new Date().toISOString(),
  });

  await next();
};
