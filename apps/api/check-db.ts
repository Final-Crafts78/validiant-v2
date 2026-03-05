/* eslint-disable no-console */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL missing');
    return;
  }
  const sql = neon(url);
  try {
    const result =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'domain'`;
    console.log('RESULT:' + JSON.stringify(result));
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('ERROR:' + e.message);
    } else {
      console.error('ERROR: Unknown error');
    }
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
