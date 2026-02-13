/**
 * Database Migration Runner
 * 
 * Simple migration runner for applying SQL migration files.
 * Run with: ts-node src/scripts/migrate.ts
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';

/**
 * Create database connection pool
 */
const createPool = (): Pool => {
  return new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  });
};

/**
 * Create migrations table if it doesn't exist
 */
const createMigrationsTable = async (pool: Pool): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  logger.info('Migrations table ready');
};

/**
 * Get list of executed migrations
 */
const getExecutedMigrations = async (pool: Pool): Promise<string[]> => {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((row) => row.name);
};

/**
 * Get list of pending migrations
 */
const getPendingMigrations = async (pool: Pool): Promise<string[]> => {
  const migrationsDir = path.join(__dirname, '../../migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    logger.warn('Migrations directory not found');
    return [];
  }

  const allMigrations = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const executedMigrations = await getExecutedMigrations(pool);
  
  return allMigrations.filter(
    (migration) => !executedMigrations.includes(migration)
  );
};

/**
 * Execute a single migration
 */
const executeMigration = async (pool: Pool, migrationName: string): Promise<void> => {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const migrationPath = path.join(migrationsDir, migrationName);
  
  logger.info(`Executing migration: ${migrationName}`);
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Execute migration SQL
    await client.query(sql);
    
    // Record migration
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [migrationName]
    );
    
    await client.query('COMMIT');
    
    logger.info(`✅ Migration completed: ${migrationName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`❌ Migration failed: ${migrationName}`, { error });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Run all pending migrations
 */
const runMigrations = async (): Promise<void> => {
  const pool = createPool();
  
  try {
    logger.info('Starting database migrations...');
    
    // Create migrations table
    await createMigrationsTable(pool);
    
    // Get pending migrations
    const pendingMigrations = await getPendingMigrations(pool);
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migration(s)`);
    
    // Execute each migration
    for (const migration of pendingMigrations) {
      await executeMigration(pool, migration);
    }
    
    logger.info('✅ All migrations completed successfully');
  } catch (error) {
    logger.error('❌ Migration process failed', { error });
    process.exit(1);
  } finally {
    await pool.end();
  }
};

/**
 * Rollback last migration (basic implementation)
 */
const rollbackLastMigration = async (): Promise<void> => {
  const pool = createPool();
  
  try {
    logger.info('Rolling back last migration...');
    
    const result = await pool.query(
      'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }
    
    const lastMigration = result.rows[0].name;
    logger.warn(`⚠️  Rolling back: ${lastMigration}`);
    logger.warn('⚠️  Note: This only removes the migration record.');
    logger.warn('⚠️  You must manually revert database changes!');
    
    await pool.query('DELETE FROM migrations WHERE name = $1', [lastMigration]);
    
    logger.info(`✅ Migration record removed: ${lastMigration}`);
  } catch (error) {
    logger.error('❌ Rollback failed', { error });
    process.exit(1);
  } finally {
    await pool.end();
  }
};

/**
 * Show migration status
 */
const showStatus = async (): Promise<void> => {
  const pool = createPool();
  
  try {
    await createMigrationsTable(pool);
    
    const executedMigrations = await getExecutedMigrations(pool);
    const pendingMigrations = await getPendingMigrations(pool);
    
    logger.info('\n=== Migration Status ===\n');
    
    if (executedMigrations.length > 0) {
      logger.info(`Executed migrations (${executedMigrations.length}):`);
      executedMigrations.forEach((name) => logger.info(`  ✅ ${name}`));
    } else {
      logger.info('No executed migrations');
    }
    
    logger.info('');
    
    if (pendingMigrations.length > 0) {
      logger.info(`Pending migrations (${pendingMigrations.length}):`);
      pendingMigrations.forEach((name) => logger.info(`  ⏳ ${name}`));
    } else {
      logger.info('No pending migrations');
    }
    
    logger.info('\n========================\n');
  } catch (error) {
    logger.error('❌ Failed to get migration status', { error });
    process.exit(1);
  } finally {
    await pool.end();
  }
};

/**
 * Main execution
 */
const main = async (): Promise<void> => {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
    case 'migrate':
      await runMigrations();
      break;
    
    case 'down':
    case 'rollback':
      await rollbackLastMigration();
      break;
    
    case 'status':
      await showStatus();
      break;
    
    default:
      logger.info('Database Migration Runner');
      logger.info('\nUsage:');
      logger.info('  npm run migrate          - Run pending migrations');
      logger.info('  npm run migrate:status   - Show migration status');
      logger.info('  npm run migrate:rollback - Rollback last migration');
      logger.info('');
      break;
  }
};

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Migration script error', { error });
      process.exit(1);
    });
}

export { runMigrations, rollbackLastMigration, showStatus };
