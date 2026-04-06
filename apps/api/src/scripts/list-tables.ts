import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import { neon } from '@neondatabase/serverless';

async function listTables() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('No DATABASE_URL');
  
  const sql = neon(url);
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tables = result.map(r => r.table_name).join('\n');
    fs.writeFileSync('db_tables.txt', tables);
  } catch (err: any) {
    fs.writeFileSync('db_tables.txt', 'Error: ' + err.message);
  } finally {
    process.exit(0);
  }
}

listTables();
