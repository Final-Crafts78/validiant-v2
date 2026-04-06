import * as dotenv from 'dotenv';
dotenv.config();
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';

async function finalCheck() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('No DATABASE_URL');
  const sql = neon(url);
  
  try {
    const vt = await sql`SELECT count(*) FROM verification_types`;
    const pj = await sql`SELECT count(*) FROM projects`;
    const users = await sql`SELECT count(*) FROM users`;
    
    const out = `VT: ${vt[0].count}, Projects: ${pj[0].count}, Users: ${users[0].count}`;
    fs.writeFileSync('final_check.txt', out);
  } catch (err: any) {
    fs.writeFileSync('final_check.txt', 'Error: ' + err.message);
  } finally {
    process.exit(0);
  }
}

finalCheck();
