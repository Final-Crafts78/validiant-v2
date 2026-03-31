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
  const startTime = performance.now();
  // Path exclusions are now handled globally in app.ts for consistency
  const user = c.get('user') as UserContext | undefined;

  if (!user || !user.userId) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  const existingOrgId = c.get('orgId') || c.get('organizationId');
  if (existingOrgId) {
    console.debug(
      '[Tenant:MW] REDUNDANCY CHECK: orgId already set in context',
      {
        existingOrgId,
        path: c.req.path,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`,
      }
    );
  }

  // 1. Check for X-Org-Id header (Standard for API clients/Mobile)
  const headerOrgId = c.req.header('X-Org-Id');

  // 2. Fallback: Parse from route params or query
  const paramOrgId = c.req.param('orgId');
  const queryOrgId = c.req.query('organizationId') || c.req.query('orgId');

  // 3. Final Fallback: Use the organizationId attached to the user's JWT session
  // This ensures that if a user is "logged into" an org, we use it as the default.
  let orgId = headerOrgId || paramOrgId || queryOrgId;
  const isFallbackUsed = !orgId && !!user.organizationId;
  
  if (isFallbackUsed) {
    orgId = user.organizationId;
  }

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
          : isFallbackUsed
            ? 'JWT_CONTEXT'
            : 'NONE',
    isSSE: c.req.path.includes('stream') || c.req.header('Accept') === 'text/event-stream',
    sources: {
      header: headerOrgId || 'MISSING',
      param: paramOrgId || 'MISSING',
      queryOrgId: c.req.query('orgId') || 'MISSING',
      queryOrganizationId: c.req.query('organizationId') || 'MISSING',
      jwtContext: user.organizationId || 'MISSING',
    },
    userId: user.userId,
    timestamp: new Date().toISOString(),
  });

  // ELITE: Catch literal "undefined" or "null" strings from frontend logic errors
  if (orgId === 'undefined' || orgId === 'null') {
    console.error(
      '[Tenant:MW] CRITICAL FAILURE - Literal "undefined" or "null" ID detected',
      {
        path: c.req.path,
        method: c.req.method,
        resolvedOrgId: orgId,
        userId: user.userId,
        timestamp: new Date().toISOString(),
      }
    );
    return c.json(
      {
        success: false,
        error: `Invalid Organization ID: ${orgId}. Check frontend client for missing state.`,
      },
      400
    );
  }

  if (!orgId) {
    console.warn(
      '[Tenant:MW] WARNING - No organization context found for scoped route',
      {
        path: c.req.path,
        method: c.req.method,
        userId: user.userId,
        timestamp: new Date().toISOString(),
      }
    );
    // For non-scoped routes, we allow it to pass, but log the warning
    await next();
    return;
  }

  console.log(
    `[Tenant:MW] RESOLUTION SUCCESS { orgId: '${orgId}', source: '${headerOrgId ? 'HEADER' : paramOrgId ? 'PARAM' : queryOrgId ? 'QUERY' : 'JWT_FALLBACK'}', isSSE: ${c.req.path.includes('stream')} }`
  );
  c.set('orgId', orgId);
  c.set('organizationId', orgId); // Legacy support for some controllers

  await next();
};
