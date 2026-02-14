/**
 * Cloudflare Workers Entry Point
 * 
 * This is the entry point for Cloudflare Workers deployment.
 * It exports the Hono app's fetch handler to handle all incoming requests.
 * 
 * Cloudflare Workers architecture:
 * - Runs on V8 isolates (not full Node.js runtime)
 * - 0ms cold starts globally
 * - Automatic edge deployment to 275+ cities
 * - No TCP connections (HTTP only)
 * 
 * File size: ~30 lines (minimal by design)
 */

import { app } from './hono-app';

/**
 * Cloudflare Workers export
 * 
 * The Workers runtime expects a default export with a `fetch` method.
 * Hono automatically provides this interface.
 * 
 * Request flow:
 * 1. Cloudflare receives request
 * 2. Routes to nearest edge location
 * 3. Calls this fetch handler
 * 4. Hono processes request through middleware and routes
 * 5. Returns response to client
 */
export default {
  fetch: app.fetch,
};
