/* eslint-disable no-console */
/**
 * Surgical SQL Migration Fix: Project Branding & API Columns (COMPLETE VERSION)
 *
 * Objectives:
 * 1. Add ALL missing columns in 'projects' table detected by failed production traces
 * 2. Handle 'client_api_key', 'is_api_enabled', 'theme_color', 'logo_url', etc.
 * 3. Ensure idempotency (check if column exists first)
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing from environment');
  process.exit(1);
}

const db = drizzle(neon(DATABASE_URL));

async function fixProjectsSchemaFull() {
  console.log(
    '🚀 Starting surgical migration for projects table (Full Scope)...'
  );

  try {
    // 🔍 AUDIT: Check existing columns
    const checkColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects'
    `);

    const existingColumns = checkColumns.rows.map((r) => String(r.column_name));
    console.log(
      `Found ${existingColumns.length} existing columns in 'projects' table.`
    );

    const migrations = [
      {
        name: 'key',
        sql: sql`ALTER TABLE "projects" ADD COLUMN "key" TEXT UNIQUE;`,
        condition: !existingColumns.includes('key'),
      },
      {
        name: 'theme_color',
        sql: sql`ALTER TABLE "projects" ADD COLUMN "theme_color" VARCHAR(7) DEFAULT '#4F46E5';`,
        condition: !existingColumns.includes('theme_color'),
      },
      {
        name: 'logo_url',
        sql: sql`ALTER TABLE "projects" ADD COLUMN "logo_url" TEXT;`,
        condition: !existingColumns.includes('logo_url'),
      },
      {
        name: 'auto_dispatch_verified',
        sql: sql`ALTER TABLE "projects" ADD COLUMN "auto_dispatch_verified" BOOLEAN DEFAULT FALSE NOT NULL;`,
        condition: !existingColumns.includes('auto_dispatch_verified'),
      },
      {
        name: 'is_api_enabled',
        sql: sql`ALTER TABLE "projects" ADD COLUMN "is_api_enabled" BOOLEAN DEFAULT FALSE NOT NULL;`,
        condition: !existingColumns.includes('is_api_enabled'),
      },
      {
        name: 'client_api_key',
        sql: sql`ALTER TABLE "projects" ADD COLUMN "client_api_key" TEXT UNIQUE;`,
        condition: !existingColumns.includes('client_api_key'),
      },
      {
        name: 'budget',
        sql: sql`ALTER TABLE "projects" ADD COLUMN "budget" INTEGER;`,
        condition: !existingColumns.includes('budget'),
      },
    ];

    let changesApplied = 0;
    for (const migration of migrations) {
      if (migration.condition) {
        console.log(`[+] Adding missing column: ${migration.name}...`);
        await db.execute(migration.sql);
        console.log(`    ✅ Success: ${migration.name}`);
        changesApplied++;
      } else {
        console.log(`[ ] Skipping ${migration.name} (already exists).`);
      }
    }

    if (changesApplied > 0) {
      console.log(`\n✨ Migration complete. ${changesApplied} columns added.`);
    } else {
      console.log('\n✅ Schema is already up to date.');
    }

    process.exit(0);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('\n❌ Migration FAILED:');
    console.error(err.message);
    process.exit(1);
  }
}

fixProjectsSchemaFull();
