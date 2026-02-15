/**
 * Cloudflare Workers Entry Point
 * 
 * This is the entry point for Cloudflare Workers deployment.
 * It exports the Hono app directly, which natively implements the
 * Cloudflare Workers ExportedHandler interface.
 * 
 * Cloudflare Workers architecture:
 * - Runs on V8 isolates (not full Node.js runtime)
 * - 0ms cold starts globally
 * - Automatic edge deployment to 275+ cities
 * - No TCP connections (HTTP only)
 * 
 * Type Safety:
 * Hono apps implement ExportedHandler<Env> natively, so we export
 * the app directly rather than wrapping it in { fetch: app.fetch }.
 * This ensures proper TypeScript declaration generation.
 */

import { app } from './app';

/**
 * Cloudflare Workers export
 * 
 * Hono automatically provides the ExportedHandler interface.
 * Direct export ensures type inference works correctly.
 * 
 * Request flow:
 * 1. Cloudflare receives request
 * 2. Routes to nearest edge location
 * 3. Calls the app's fetch handler
 * 4. Hono processes request through middleware and routes
 * 5. Returns response to client
 */
export default app;
