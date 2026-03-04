/**
 * Enterprise SSO Routes (Phase 21)
 *
 * Public unauthenticated routes for handling SSO logins.
 */

import { Hono } from 'hono';
import * as ssoController from '../controllers/sso.controller';

const ssoRoutes = new Hono();

// GET /api/v1/sso/providers?domain=xxx
// Look up tenant SSO config before login
ssoRoutes.get('/providers', ssoController.getSSOProviders);

// POST /api/v1/sso/callback
// Process identity provider assertions and issue a JWT session
ssoRoutes.post('/callback', ssoController.ssoCallback);

export default ssoRoutes;
