/* eslint-disable no-console */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  try {
    const sql = neon(connectionString);
    const result = await sql`SELECT 1 as connected`;
    console.log('Connection successful:', result);

    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' AND column_name = 'domain';
    `;
    console.log('Domain column exists:', columns.length > 0);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

main();
