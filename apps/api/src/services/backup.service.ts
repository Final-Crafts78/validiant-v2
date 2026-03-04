/**
 * Backup Service (Phase 21)
 *
 * Handles automated generation of JSON/CSV backups for Enterprise organizations
 * and stores them in Cloudflare R2 bucket (`BACKUP_BUCKET`).
 */

import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { R2Bucket } from '@cloudflare/workers-types';

/**
 * Generate a JSON backup of all tasks and activity logs for an organization,
 * then upload it to the provided R2 bucket.
 */
export async function generateOrganizationBackup(
  orgId: string,
  bucket: R2Bucket
) {
  if (!bucket) {
    throw new Error('BACKUP_BUCKET is not bound to this Worker environment.');
  }

  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1);

  if (!org) {
    throw new Error(`Organization ${orgId} not found`);
  }

  // 1. Fetch all Tasks
  const tasks = await db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.organizationId, orgId));

  // 2. Fetch all Activity Logs
  const activityLogs = await db
    .select()
    .from(schema.activityLogs)
    .where(eq(schema.activityLogs.organizationId, orgId));

  // 3. Assemble full backup payload
  const backupPayload = {
    organization: org,
    generatedAt: new Date().toISOString(),
    tasks,
    activityLogs,
  };

  const jsonContent = JSON.stringify(backupPayload, null, 2);

  // 4. Generate a unique key e.g., "orgId/YYYY-MM-DD-backup.json"
  const dateStr = new Date().toISOString().split('T')[0];
  const objectKey = `${orgId}/${dateStr}-backup.json`;

  // 5. Upload to R2 Bucket
  await bucket.put(objectKey, jsonContent, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: {
      organizationId: org.id,
      organizationName: org.name,
      generatedAt: new Date().toISOString(),
    },
  });

  return {
    success: true,
    key: objectKey,
    sizeBytes: jsonContent.length,
  };
}

/**
 * Run backups for ALL Enterprise organizations.
 * Usually triggered by the Cloudflare Cron Scheduler.
 */
export async function runAllEnterpriseBackups(bucket: R2Bucket) {
  if (!bucket) {
    console.warn('[backup] Missing BACKUP_BUCKET binding. Skipping.');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[backup] Starting automated enterprise backups...');

  // Identify enterprise orgs — assume any org is eligible for now,
  // or add a plan='enterprise' check on the schema.organizations if present.
  const enterpriseOrgs = await db
    .select({ id: schema.organizations.id })
    .from(schema.organizations);

  let successCount = 0;
  let failCount = 0;

  for (const org of enterpriseOrgs) {
    try {
      await generateOrganizationBackup(org.id, bucket);
      successCount++;
    } catch (err) {
      console.error(`[backup] Failed backup for org ${org.id}:`, err);
      failCount++;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[backup] Finished! ${successCount} successful, ${failCount} failed.`
  );
}
