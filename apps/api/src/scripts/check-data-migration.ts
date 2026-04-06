import * as dotenv from 'dotenv';
dotenv.config();

// Standard for our lazy-loaded db.ts
(globalThis as any).__ENV__ = {
  DATABASE_URL: process.env.DATABASE_URL,
};

import { db } from '../db/index';
import { verificationTypes, tasks, caseFieldValues } from '../db/schema';
import { count } from 'drizzle-orm';

async function checkData() {
  console.log('🏁 Starting data check...');
  try {
    const [vtCount] = await db.select({ value: count() }).from(verificationTypes);
    const [taskCount] = await db.select({ value: count() }).from(tasks);
    const [fieldCount] = await db.select({ value: count() }).from(caseFieldValues);

    console.log('--- Data Stats ---');
    console.log('Verification Types:', vtCount.value);
    console.log('Tasks:', taskCount.value);
    console.log('Field Values:', fieldCount.value);
  } catch (error) {
    console.error('❌ Data check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkData();
