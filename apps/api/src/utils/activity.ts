/**
 * Activity Logger Utility (Edge-Compatible)
 *
 * Writes audit records to the activityLogs table.
 * Designed to never fail the parent request — errors are caught and logged.
 */

import { desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { calculateActivityHash } from './audit';

export interface ActivityLogParams {
  organizationId?: string;
  userId?: string | null;
  action: string;
  entityId?: string | null;
  entityType?: 'task' | 'project' | 'user' | 'organization' | string;
  oldValue?: unknown;
  newValue?: unknown;
  details?: string;
  ipAddress?: string;
  deviceType?: string;
  userAgent?: string;
  appVersion?: string;
}

/**
 * Log an activity to the audit trail.
 * Non-blocking: catches and logs errors without propagating.
 * Implements cryptographic hash chaining for forensic integrity.
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    // 1. Get the previous hash for this organization to maintain the chain
    let prevHash: string | null = null;
    if (params.organizationId) {
      const lastLog = await db
        .select({ contentHash: schema.activityLogs.contentHash })
        .from(schema.activityLogs)
        .where(eq(schema.activityLogs.organizationId, params.organizationId))
        .orderBy(desc(schema.activityLogs.createdAt))
        .limit(1);

      if (lastLog.length > 0) {
        prevHash = lastLog[0].contentHash;
      }
    }

    // 2. Prepare the content for hashing
    const contentToHash = JSON.stringify({
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      entityId: params.entityId,
      entityType: params.entityType,
      oldValue: params.oldValue,
      newValue: params.newValue,
      details: params.details,
    });

    // 3. Compute the current hash
    const contentHash = await calculateActivityHash(prevHash, contentToHash);

    // 4. Insert the record
    await db.insert(schema.activityLogs).values({
      organizationId: params.organizationId,
      userId: params.userId as any,
      action: params.action,
      entityId: params.entityId as any,
      entityType: params.entityType as any,
      oldValue: params.oldValue,
      newValue: params.newValue,
      details: params.details,
      ipAddress: params.ipAddress,
      deviceType: params.deviceType,
      userAgent: params.userAgent,
      appVersion: params.appVersion,
      prevHash,
      contentHash,
    });
  } catch (error) {
    // Never fail the main request if logging fails
    console.error('Activity Log Failed:', error);
  }
}
