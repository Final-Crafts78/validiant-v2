import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

/**
 * Migration Script: Add external_id to records table
 * and enforce unique constraint for deduplication.
 */
async function migrate() {
  logger.info('Starting Inbound API Deduplication Migration...');

  try {
    // 1. Add column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE records 
      ADD COLUMN IF NOT EXISTS external_id TEXT;
    `);
    logger.info('Added external_id column.');

    // 2. Add Index
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS records_external_id_idx ON records(external_id);
    `);
    logger.info('Created external_id index.');

    // 3. Add Unique Constraint
    // Note: We name it specifically to match the schema.ts definition for consistency
    await db.execute(sql`
      ALTER TABLE records 
      DROP CONSTRAINT IF EXISTS records_external_id_unique;
    `);

    await db.execute(sql`
      ALTER TABLE records 
      ADD CONSTRAINT records_external_id_unique 
      UNIQUE (project_id, type_id, external_id);
    `);
    logger.info('Applied unique constraint records_external_id_unique.');

    logger.info('Migration COMPLETED successfully.');
  } catch (error) {
    logger.error('Migration FAILED:', error as Error);
    process.exit(1);
  }
}

// Set global env for the lazy-loaded db proxy if needed (hack for scripts)
(globalThis as any).__ENV__ = process.env;

migrate();
