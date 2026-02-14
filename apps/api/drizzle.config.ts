/**
 * Drizzle Kit Configuration
 * 
 * This configuration is used by drizzle-kit for:
 * - Generating migrations from schema changes
 * - Pushing schema directly to database
 * - Running Drizzle Studio for database management
 * 
 * Commands:
 * - pnpm db:generate  → Generate migration files
 * - pnpm db:push      → Push schema to database (no migration files)
 * - pnpm db:studio    → Open Drizzle Studio GUI
 * - pnpm db:migrate   → Apply pending migrations
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please check your .env file.'
  );
}

export default {
  // Schema location - must match the path in src/db/index.ts
  schema: './src/db/schema.ts',

  // Output directory for generated migration files
  out: './drizzle',

  // Database driver (PostgreSQL)
  driver: 'pg',

  // Database connection
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },

  // Verbose logging for debugging
  verbose: true,

  // Strict mode - fail on warnings
  strict: true,
} satisfies Config;
