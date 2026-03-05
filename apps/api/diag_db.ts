import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  let out = 'START\n';
  if (!url) {
    fs.writeFileSync('db_test_result.txt', 'DATABASE_URL is missing\n');
    return;
  }
  try {
    const sql = neon(url);
    const res = await sql`SELECT 1 as test`;
    out += 'CONNECTION_OK: ' + JSON.stringify(res) + '\n';

    const colCheck =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'domain'`;
    out += 'COLUMN_CHECK: ' + JSON.stringify(colCheck) + '\n';
  } catch (err: unknown) {
    if (err instanceof Error) {
      out += 'ERROR: ' + err.message + '\n';
    } else {
      out += 'ERROR: Unknown error\n';
    }
  }
  fs.writeFileSync('db_test_result.txt', out);
}
run().catch((err) => {
  console.error('Unhandled error diagnostics:', err);
  process.exit(1);
});
