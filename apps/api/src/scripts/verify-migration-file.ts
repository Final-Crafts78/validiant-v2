import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';

(globalThis as any).__ENV__ = {
  DATABASE_URL: process.env.DATABASE_URL,
};

import { db } from '../db/index';
import { projectTypes, typeColumns, records } from '../db/schema';
import { count } from 'drizzle-orm';

async function checkData() {
  try {
    const [ptCount] = await db.select({ value: count() }).from(projectTypes);
    const [tcCount] = await db.select({ value: count() }).from(typeColumns);
    const [rCount] = await db.select({ value: count() }).from(records);

    const out = `
--- Migration Result ---
Project Types: ${ptCount.value}
Type Columns: ${tcCount.value}
Records: ${rCount.value}
`;
    fs.writeFileSync('migration_check.txt', out);
    console.log('Results written to migration_check.txt');
  } catch (error: any) {
    fs.writeFileSync('migration_check.txt', 'Error: ' + error.message);
  } finally {
    process.exit(0);
  }
}

checkData();
