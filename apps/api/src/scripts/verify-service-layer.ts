import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/api/.env' });

// Standard for our lazy-loaded db.ts
(globalThis as any).__ENV__ = {
  DATABASE_URL: process.env.DATABASE_URL,
};

import { db } from '../db/index';
import {
  projects,
  projectTypes,
  typeColumns,
  records,
  recordHistory,
} from '../db/schema';
import { createRecord } from '../services/records.service';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

async function verify() {
  console.log('🧪 Starting Service Layer Verification...');
  let log = '';

  try {
    // 1. Find the first project
    const [project] = await db.select().from(projects).limit(1);
    if (!project) throw new Error('No project found for testing');
    log += `Found Project: ${project.name} (${project.id})\n`;

    // 2. Create a Test Type
    const typeId = crypto.randomUUID();
    await db.insert(projectTypes).values({
      id: typeId,
      projectId: project.id,
      name: 'Verification Mock',
      icon: 'ShieldCheck',
      color: '#4F46E5',
    });
    log += `Created ProjectType: Verification Mock (${typeId})\n`;

    // 3. Create a Test Column
    await db.insert(typeColumns).values({
      id: crypto.randomUUID(),
      typeId,
      projectId: project.id,
      name: 'Status Test',
      key: 'status_test',
      columnType: 'TEXT',
    });
    log += `Created TypeColumn: status_test\n`;

    // 4. Create a Record using the Service (testing Advisory Lock & Sequential Numbering)
    const newRecord = await createRecord(project.id, project.ownerId, {
      typeId,
      data: { status_test: 'SUCCESS_VERIFIED' },
      status: 'pending',
    });
    log += `Created Record via Service: Number ${newRecord.number}, DisplayId ${newRecord.displayId}\n`;

    // 5. Cleanup
    await db
      .delete(recordHistory)
      .where(eq(recordHistory.recordId, newRecord.id));
    await db.delete(records).where(eq(records.id, newRecord.id));
    await db.delete(typeColumns).where(eq(typeColumns.typeId, typeId));
    await db.delete(projectTypes).where(eq(projectTypes.id, typeId));
    log += 'Cleanup complete.\n';

    fs.writeFileSync('service_verification.txt', log);
    console.log('✅ Service Layer Verification Passed');
  } catch (err: any) {
    console.error('❌ Service Layer Verification Failed:', err);
    fs.writeFileSync(
      'service_verification.txt',
      'Failed: ' + err.message + '\n' + log
    );
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

verify();
