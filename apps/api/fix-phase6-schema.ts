import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Use env URL or hardcoded fallback from previous successful fix
  const url =
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_bSnM03WGvPLF@ep-twilight-boat-ai3n61zr.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  console.log('Using database URL:', url.split('@')[1]); // Log host only for safety
  const sql = neon(url);

  try {
    console.log('Starting Phase 6 Schema Fix (Billing & Subscriptions)...');

    // Add missing columns to organizations table
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' NOT NULL;`;
    console.log('- Added column: plan');

    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id text;`;
    console.log('- Added column: stripe_customer_id');

    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id text;`;
    console.log('- Added column: stripe_subscription_id');

    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status text;`;
    console.log('- Added column: subscription_status');

    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;`;
    console.log('- Added column: plan_expires_at');

    fs.writeFileSync('phase6_fix_status.txt', 'SUCCESS', 'utf8');
    console.log('PHASE 6 SCHEMA FIX COMPLETED SUCCESSFULLY');
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    console.error('SCHEMA FIX FAILED:', errorMsg);
    fs.writeFileSync('phase6_fix_status.txt', 'ERROR: ' + errorMsg, 'utf8');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error during schema fix:', err);
  process.exit(1);
});
