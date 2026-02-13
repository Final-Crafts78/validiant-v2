/**
 * Database Migration Runner
 * 
 * Handles running SQL migrations for the database schema.
 * Usage:
 *   npm run migrate         - Run all pending migrations
 *   npm run migrate:status  - Check migration status
 *   npm run migrate:rollback - Rollback last migration
 */

import fs from 'fs';
import path from 'path';
import { db } from '../config/database.config';
import { logger } from '../utils/logger';

/**
 * Migration record interface
 */
interface Migration {
  id: number;
  name: string;
  executed_at: Date;
}

/**
 * Migration file interface
 */
interface MigrationFile {
  id: number;
  name: string;
  path: string;
}

/**
 * Get migrations directory
 */
const getMigrationsDir = (): string => {
  return path.join(__dirname, '../../../migrations');
};

/**
 * Ensure migrations table exists
 */
const ensureMigrationsTable = async (): Promise<void> => {
  await db.raw(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
};

/**
 * Get executed migrations from database
 */
const getExecutedMigrations = async (): Promise<Migration[]> => {
  return db.any<Migration>(
    'SELECT id, name, executed_at FROM migrations ORDER BY id ASC'
  );
};

/**
 * Get migration files from filesystem
 */
const getMigrationFiles = (): MigrationFile[] => {
  const migrationsDir = getMigrationsDir();

  if (!fs.existsSync(migrationsDir)) {
    logger.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir);
  const migrations: MigrationFile[] = [];

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (match) {
        migrations.push({
          id: parseInt(match[1], 10),
          name: match[2],
          path: path.join(migrationsDir, file),
        });
      }
    }
  }

  return migrations.sort((a, b) => a.id - b.id);
};

/**
 * Get pending migrations
 */
const getPendingMigrations = async (): Promise<MigrationFile[]> => {
  const executed = await getExecutedMigrations();
  const executedIds = new Set(executed.map((m) => m.id));
  const allMigrations = getMigrationFiles();

  return allMigrations.filter((m) => !executedIds.has(m.id));
};

/**
 * Run a single migration
 */
const runMigration = async (migration: MigrationFile): Promise<void> => {
  logger.info(`Running migration: ${migration.id}_${migration.name}`);

  const sql = fs.readFileSync(migration.path, 'utf-8');

  try {
    // Execute migration SQL
    await db.raw(sql);

    // Record migration
    await db.raw(
      'INSERT INTO migrations (id, name) VALUES ($1, $2)',
      [migration.id, migration.name]
    );

    logger.info(`✅ Migration completed: ${migration.id}_${migration.name}`);
  } catch (error) {
    logger.error(`❌ Migration failed: ${migration.id}_${migration.name}`, { error });
    throw error;
  }
};

/**
 * Run all pending migrations
 */
const runMigrations = async (): Promise<void> => {
  await ensureMigrationsTable();

  const pending = await getPendingMigrations();

  if (pending.length === 0) {
    logger.info('✅ No pending migrations');
    return;
  }

  logger.info(`Found ${pending.length} pending migration(s)`);

  for (const migration of pending) {
    await runMigration(migration);
  }

  logger.info(`✅ All migrations completed successfully`);
};

/**
 * Show migration status
 */
const showStatus = async (): Promise<void> => {
  await ensureMigrationsTable();

  const executed = await getExecutedMigrations();
  const allMigrations = getMigrationFiles();
  const executedIds = new Set(executed.map((m) => m.id));

  console.log('\n' + '='.repeat(60));
  console.log('DATABASE MIGRATION STATUS');
  console.log('='.repeat(60) + '\n');

  if (allMigrations.length === 0) {
    console.log('No migrations found.\n');
    return;
  }

  for (const migration of allMigrations) {
    const isExecuted = executedIds.has(migration.id);
    const status = isExecuted ? '✅ Executed' : '⏳ Pending';
    const executedMigration = executed.find((m) => m.id === migration.id);
    const executedAt = executedMigration
      ? new Date(executedMigration.executed_at).toLocaleString()
      : '-';

    console.log(`${status}  ${migration.id}_${migration.name}`);
    if (isExecuted) {
      console.log(`           Executed at: ${executedAt}`);
    }
    console.log('');
  }

  const pending = allMigrations.filter((m) => !executedIds.has(m.id));
  console.log('='.repeat(60));
  console.log(`Total: ${allMigrations.length} migrations`);
  console.log(`Executed: ${executed.length}`);
  console.log(`Pending: ${pending.length}`);
  console.log('='.repeat(60) + '\n');
};

/**
 * Rollback last migration
 */
const rollbackMigration = async (): Promise<void> => {
  await ensureMigrationsTable();

  const executed = await getExecutedMigrations();

  if (executed.length === 0) {
    logger.info('No migrations to rollback');
    return;
  }

  const lastMigration = executed[executed.length - 1];
  logger.warn(`⚠️  Rolling back migration: ${lastMigration.id}_${lastMigration.name}`);

  // Note: This is a simple rollback that just removes the record.
  // In a production system, you'd want to have separate rollback SQL files.
  await db.raw('DELETE FROM migrations WHERE id = $1', [lastMigration.id]);

  logger.info(`✅ Migration rollback completed: ${lastMigration.id}_${lastMigration.name}`);
  logger.warn('⚠️  Note: This only removed the migration record.');
  logger.warn('⚠️  You may need to manually revert database changes.');
};

/**
 * Main function
 */
const main = async (): Promise<void> => {
  const command = process.argv[2] || 'up';

  try {
    logger.info('Connecting to database...');
    await db.raw('SELECT 1');
    logger.info('✅ Database connected');

    switch (command) {
      case 'up':
        await runMigrations();
        break;

      case 'status':
        await showStatus();
        break;

      case 'down':
        await rollbackMigration();
        break;

      default:
        logger.error(`Unknown command: ${command}`);
        logger.info('Available commands: up, status, down');
        process.exit(1);
    }

    await db.end();
    process.exit(0);
  } catch (error) {
    logger.error('Migration error', { error });
    await db.end();
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  main();
}

export { runMigrations, showStatus, rollbackMigration };
