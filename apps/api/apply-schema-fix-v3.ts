/* eslint-disable no-console */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function applyProductionSchemaFix() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const logFile = path.resolve(__dirname, './schema_fix_v3_log.txt');
  const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  };

  try {
    log('Connecting to Neon database...');
    const sql = neon(connectionString);

    const fixStatements = [
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_dispatch_verified BOOLEAN DEFAULT FALSE NOT NULL',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7) DEFAULT \'#4F46E5\'',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url TEXT',
      'ALTER TABLE verification_types ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT FALSE NOT NULL'
    ];

    log(`Applying ${fixStatements.length} schema fixes...`);

    for (const statement of fixStatements) {
      log(`Executing: ${statement}`);
      try {
        await sql(statement);
        log('✅ Success');
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          log('ℹ️ Column already exists, skipping.');
        } else {
          log(`❌ Error: ${e.message}`);
          throw e;
        }
      }
    }

    log('🎉 All schema fixes applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Critical Failure during schema fix:', error);
    process.exit(1);
  }
}

applyProductionSchemaFix();
