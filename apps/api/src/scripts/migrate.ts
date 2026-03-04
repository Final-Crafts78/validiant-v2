/**
 * Database Migration Script
 *
 * Runs Drizzle migrations against the database.
 */

import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from '../db/index';

const runMigrations = async () => {
  console.log('🔄 Running database migrations...');

  try {
    await migrate(db, {
      migrationsFolder: './drizzle',
    });

    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
