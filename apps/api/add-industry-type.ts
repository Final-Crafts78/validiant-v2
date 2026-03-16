/* eslint-disable no-console */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  const sql = neon(url);
  console.log('Connecting to database...');
  try {
    console.log('Adding industry_type column to organizations table...');
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_type text DEFAULT 'bgv' NOT NULL;`;
    console.log('✅ Column industry_type added successfully!');
  } catch (error) {
    console.error('❌ Failed to add column:', error);
    process.exit(1);
  }
}

main();
