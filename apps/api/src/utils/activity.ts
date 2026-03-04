/**
 * Activity Logger Utility (Edge-Compatible)
 *
 * Writes audit records to the activityLogs table.
 * Designed to never fail the parent request — errors are caught and logged.
 */

import { db, schema } from '../db';

export interface ActivityLogParams {
  organizationId?: string;
  userId: string;
  action: string;
  entityId: string;
  entityType: 'task' | 'project' | 'user' | 'organization';
  oldValue?: unknown;
  newValue?: unknown;
  details?: string;
  ipAddress?: string;
  deviceType?: string;
}

/**
 * Log an activity to the audit trail.
 * Non-blocking: catches and logs errors without propagating.
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    await db.insert(schema.activityLogs).values({
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      entityId: params.entityId,
      entityType: params.entityType,
      oldValue: params.oldValue,
      newValue: params.newValue,
      details: params.details,
      ipAddress: params.ipAddress,
      deviceType: params.deviceType,
    });
  } catch (error) {
    // Never fail the main request if logging fails
    console.error('Activity Log Failed:', error);
  }
}
