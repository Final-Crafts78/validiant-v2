import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';

async function main() {
  const url =
    'postgresql://neondb_owner:npg_bSnM03WGvPLF@ep-twilight-boat-ai3n61zr.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const sql = neon(url);
  try {
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS domain text;`;
    await sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_enabled boolean DEFAULT false NOT NULL;`;
    try {
      await sql`ALTER TABLE organizations ADD CONSTRAINT organizations_domain_unique UNIQUE(domain);`;
    } catch (e) {
      // Ignore if constraint already exists
    }
    fs.writeFileSync('fix_status.txt', 'SUCCESS', 'utf8');
  } catch (e: unknown) {
    if (e instanceof Error) {
      fs.writeFileSync('fix_status.txt', 'ERROR: ' + e.message, 'utf8');
    } else {
      fs.writeFileSync('fix_status.txt', 'ERROR: Unknown error', 'utf8');
    }
  }
}

main().catch((err) => {
  console.error('Unhandled error schema fix:', err);
  process.exit(1);
});
