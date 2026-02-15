/**
 * Cloudflare Workers Entry Point
 * 
 * This is the production entry point for Cloudflare Workers deployment.
 * Exports the Hono app instance for Workers runtime.
 */

import { app } from './app';

// Export app for Cloudflare Workers
export default app;
