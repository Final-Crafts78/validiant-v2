/* eslint-disable no-console */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function runManualMigration() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_bSnM03WGvPLF@ep-twilight-boat-ai3n61zr.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  try {
    const logFile = path.resolve(__dirname, './migration_log.txt');
    const log = (msg: string) => {
      console.log(msg);
      fs.appendFileSync(logFile, msg + '\n');
    };

    log('Connecting to Neon...');
    const sql = neon(connectionString);

    const migrationPath = path.resolve(
      __dirname,
      './migrations/004_multi_tenant_orgs.sql'
    );
    log(`Reading migration: ${migrationPath}`);

    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    log('Applying migration...');
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      log(`Executing: ${statement.substring(0, 50)}...`);
      try {
        await sql(statement);
      } catch (e) {
        log(`Error in statement: ${statement.substring(0, 50)}...`);
        log(e instanceof Error ? e.message : 'Unknown error');
        // Continue or throw? Let's throw for the first fail.
        throw e;
      }
    }

    log('✅ Manual migration 004 completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runManualMigration();
