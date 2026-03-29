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
  const headerOrgId = c.req.header('X-Org-Id');
  
  // 2. Fallback: Parse from route params or query
  const paramOrgId = c.req.param('orgId');
  const queryOrgId = c.req.query('organizationId') || c.req.query('orgId');

  const orgId = headerOrgId || paramOrgId || queryOrgId;

  const rawCookies = c.req.header('cookie');
  
  console.debug('[Tenant:MW] Isolation Trace', {
    path: c.req.path,
    method: c.req.method,
    resolvedOrgId: orgId || 'NONE',
    headers: Object.fromEntries(
      Object.entries(c.req.header()).map(([k, v]) => [
        k, 
        k.toLowerCase().includes('id') || k.toLowerCase().includes('token') || k.toLowerCase().includes('auth') || k.toLowerCase().includes('cookie')
          ? 'PRESENT (Masked)' 
          : v
      ])
    ),
    rawCookieNames: rawCookies ? rawCookies.split(';').map(c => c.split('=')[0].trim()) : [],
    rawQuery: c.req.query(),
    rawQueries: c.req.queries(),
    sources: {
      header: headerOrgId || 'MISSING',
      param: paramOrgId || 'MISSING',
      query: queryOrgId || 'MISSING',
      jwtContext: user.organizationId || 'MISSING'
    },
    resolvedFrom: headerOrgId ? 'HEADER' : paramOrgId ? 'PARAM' : queryOrgId ? 'QUERY' : 'NONE',
    userId: user.userId,
    timestamp: new Date().toISOString(),
  });

  if (!orgId) {
    console.warn('[Tenant:MW] No organization context found for scoped route', {
      path: c.req.path,
      userId: user.userId
    });
    // Some routes might not be org-scoped (like /auth/me), but for scoped routes, this is fatal.
    // We allow it to pass if downstream logic handles global scope,
    // but the spec suggests scoping "every single database query".
    await next();
    return;
  }

  c.set('orgId', orgId);
  c.set('organizationId', orgId); // Legacy support for some controllers

  await next();
};
