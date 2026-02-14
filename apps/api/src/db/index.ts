/**
 * Drizzle Database Client (Edge-Compatible)
 * 
 * This client uses Neon's serverless HTTP connection, which is required for:
 * - Cloudflare Workers (no TCP connections)
 * - Edge runtime environments
 * - Serverless functions with connection pooling
 * 
 * Key differences from traditional PostgreSQL clients:
 * - Uses HTTP protocol instead of TCP
 * - No connection pooling needed (handled by Neon)
 * - Sub-10ms latency for edge-optimized queries
 * - Automatic connection management
 * 
 * Usage:
 *   import { db } from './db';
 *   const users = await db.select().from(schema.users);
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is required. ' +
    'Please ensure it is set in your .env file or deployment environment.'
  );
}

/**
 * Neon serverless SQL client
 * Uses HTTP protocol for edge compatibility
 */
const sql = neon(process.env.DATABASE_URL);

/**
 * Drizzle ORM instance with full schema and type inference
 * 
 * Features:
 * - Type-safe queries with TypeScript inference
 * - Automatic relation resolution
 * - Edge-compatible (no TCP)
 * - Connection pooling via Neon
 */
export const db = drizzle(sql, { schema });

/**
 * Re-export schema for convenient imports
 * 
 * Usage:
 *   import { db, schema } from './db';
 *   await db.select().from(schema.users);
 */
export { schema };

/**
 * Type exports for application use
 */
export type {
  User,
  NewUser,
  Organization,
  NewOrganization,
  OrganizationMember,
  NewOrganizationMember,
  Project,
  NewProject,
  Task,
  NewTask,
} from './schema';
