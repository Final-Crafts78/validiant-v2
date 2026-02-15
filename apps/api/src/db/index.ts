/**
 * Database Connection
 * 
 * Neon PostgreSQL connection with Drizzle ORM.
 * Edge-compatible serverless connection pooling.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { env } from '../config/env.config';

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Create Neon SQL client
const sql = neon(env.DATABASE_URL);

// Create Drizzle instance with schema (cast for Neon strictness)
export const db = drizzle(sql as any, { schema });

export type DbClient = typeof db;

// Export schema for controllers
export { schema };
