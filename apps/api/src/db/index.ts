/**
 * Database Connection (Lazy-Loaded Proxy)
 * 
 * Cloudflare Edge-compatible lazy initialization pattern.
 * Waits for first request to grab DATABASE_URL from runtime environment.
 * 
 * Why Lazy Loading?
 * - Cloudflare injects env variables at request time, not build time
 * - Top-level initialization causes DNS errors (1016)
 * - Proxy pattern allows controllers to import `db` normally
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Database instance cache
let _db: ReturnType<typeof drizzle>;

/**
 * Get database instance (lazy initialization)
 * Creates connection on first call using runtime env
 */
const getDb = () => {
  if (!_db) {
    // Access Cloudflare runtime env (injected by middleware)
    const url = (globalThis as any).__ENV__?.DATABASE_URL;
    
    if (!url) {
      throw new Error(
        'DATABASE_URL is missing from Cloudflare environment. ' +
        'Make sure it is set in Cloudflare Dashboard → Workers & Pages → Settings → Variables'
      );
    }
    
    // Initialize Neon connection
    const sql = neon(url);
    _db = drizzle(sql as any, { schema });
    
    console.log('[DB] Lazy-loaded Neon connection initialized');
  }
  
  return _db;
};

/**
 * Database Proxy
 * 
 * Allows controllers to import and use `db` normally:
 * ```typescript
 * import { db } from '@/db';
 * const users = await db.query.users.findMany();
 * ```
 * 
 * The proxy intercepts all property access and method calls,
 * ensuring the database is initialized only when first used.
 */
export const db = new Proxy({} as any, {
  get: (_, prop) => {
    const instance = getDb() as any;
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

// Type exports
export type DbClient = ReturnType<typeof getDb>;
export { schema };
