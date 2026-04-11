/* eslint-disable no-console */
/**
 * Surgical SQL Migration Fix: Project Branding Columns
 *
 * Objectives:
 * 1. Add missing 'key' column to 'projects' table (Fixes Issue #14)
 * 2. Add 'theme_color', 'logo_url', and 'auto_dispatch_verified' to 'projects'
 * 3. Ensure all columns match the current Drizzle schema exactly
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

async function fixProjectsSchema() {
  console.log('🚀 Starting surgical migration for projects table...');

  try {
    // 1. Check for existing columns to prevent hard errors
    const checkColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects'
    `);

    const existingColumns = checkColumns.rows.map((r) => r.column_name);
    console.log(`
      Found ${existingColumns.length} existing columns in projects table.
    `);

    const migrations = [
      {
        name: 'key',
        sql: sql`ALTER TABLE projects ADD COLUMN "key" TEXT UNIQUE;`,
        condition: !existingColumns.includes('key'),
      },
      {
        name: 'theme_color',
        sql: sql`ALTER TABLE projects ADD COLUMN "theme_color" VARCHAR(7) DEFAULT '#4F46E5';`,
        condition: !existingColumns.includes('theme_color'),
      },
      {
        name: 'logo_url',
        sql: sql`ALTER TABLE projects ADD COLUMN "logo_url" TEXT;`,
        condition: !existingColumns.includes('logo_url'),
      },
      {
        name: 'auto_dispatch_verified',
        sql: sql`ALTER TABLE projects ADD COLUMN "auto_dispatch_verified" BOOLEAN DEFAULT FALSE NOT NULL;`,
        condition: !existingColumns.includes('auto_dispatch_verified'),
      },
    ];

    for (const migration of migrations) {
      if (migration.condition) {
        console.log(`adding missing column [${migration.name}]...`);
        await db.execute(migration.sql);
        console.log(`✅ column [${migration.name}] added successfully.`);
      } else {
        console.log(`skipping [${migration.name}], it already exists.`);
      }
    }

    console.log('\n✨ Database normalization for projects table complete!');
    process.exit(0);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Migration CRASHED:');
    console.error(err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

fixProjectsSchema();
