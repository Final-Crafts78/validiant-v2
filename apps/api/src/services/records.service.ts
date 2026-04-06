import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../db';
import { records, recordHistory, projects } from '../db/schema';
import { logger } from '../utils/logger';
import { createSignedUploadUrl } from './storage.service';
import { broadcastToOrg } from '../utils/broadcast';
import {
  photoCaptureSchema,
  gpsLocationSchema,
  signatureSchema,
  ratingSchema,
} from '@validiant/shared';

/**
 * Record Engine Service - Core Schema Engine (Phase 1/2)
 *
 * Handles the lifecycle of project-scoped records with RBAC projection.
 * "Perfection & Precision" - Data-driven record management.
 */

/**
 * Get all records for a project with RBAC Projection
 */
export const getRecordsByProject = async (
  projectId: string,
  permissions: string[] = [],
  isOwner: boolean = false
) => {
  const allRecords = await db.query.records.findMany({
    where: eq(records.projectId, projectId),
    orderBy: [desc(records.createdAt)],
    with: {
      type: {
        with: {
          columns: true,
        },
      },
    },
  });

  return projectRecords(allRecords, permissions, isOwner);
};

/**
 * Get a single record by ID with full history and RBAC Projection
 */
export const getRecordById = async (
  id: string,
  permissions: string[] = [],
  isOwner: boolean = false
) => {
  const data = await db.query.records.findFirst({
    where: eq(records.id, id),
    with: {
      history: true,
      type: {
        with: {
          columns: true,
        },
      },
    },
  });

  if (!data) return null;
  return projectRecord(data, permissions, isOwner);
};

/**
 * Get immutable audit history for a record
 */
export const getRecordHistory = async (recordId: string) => {
  return await db.query.recordHistory.findMany({
    where: eq(recordHistory.recordId, recordId),
    orderBy: [desc(recordHistory.createdAt)],
    with: {
      user: true,
    },
  });
};

/**
 * CRC32 Implementation for deterministic 32-bit hashing
 * Used for generating Postgres advisory lock keys from UUIDs
 */
const crc32 = (str: string): number => {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  let crc = 0 ^ -1;
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
  }
  return (crc ^ -1) >>> 0;
};

/**
 * RBAC Projection Pipeline (Phase 2 Perfection)
 *
 * Filters record data based on column visibility settings and user permissions.
 * Pattern: Industry-standard Field Level Security (FLS) used by Salesforce/Airtable.
 */
export const projectRecord = (
  record: any,
  permissions: string[],
  isOwner: boolean
) => {
  if (isOwner) return record;

  const type = record.type;
  if (!type || !type.columns) return record;

  const projectedData: Record<string, unknown> = {};
  const currentData = (record.data as Record<string, unknown>) || {};

  type.columns.forEach((col: any) => {
    const settings = (col.settings as Record<string, unknown>) || {};
    const visibleTo = (settings.visibleTo as string[]) || [];

    // 1. Check Visibility Tier
    let isVisible = false;

    if (visibleTo.length === 0) {
      // Default: Visible if user has internal view permission
      isVisible = permissions.includes('field:view_internal');
    } else {
      // Check for specific tier/resolution permissions
      if (
        visibleTo.includes('admin') &&
        permissions.includes('field:view_restricted')
      ) {
        isVisible = true;
      }
      if (
        visibleTo.includes('member') &&
        permissions.includes('field:view_internal')
      ) {
        isVisible = true;
      }
      if (
        visibleTo.includes('field_agent') ||
        visibleTo.includes('client_portal')
      ) {
        isVisible = true;
      }
    }

    if (isVisible) {
      projectedData[col.key] = currentData[col.key];
    }
  });

  // 2. System Field Masking
  const hasAdvancedAccess =
    permissions.includes('org:admin') ||
    permissions.includes('field:view_restricted');

  if (!hasAdvancedAccess) {
    Object.keys(projectedData).forEach((key) => {
      if (key.startsWith('_')) delete projectedData[key];
    });
  }

  return {
    ...record,
    data: projectedData,
  };
};

/**
 * Bulk Projection Wrapper
 */
export const projectRecords = (
  items: any[],
  permissions: string[],
  isOwner: boolean
) => {
  return items.map((item) => projectRecord(item, permissions, isOwner));
};

/**
 * Create Record with Concurrency-Safe Sequential Numbering
 */
export const createRecord = async (
  projectId: string,
  userId: string,
  data: any
) => {
  return await db.transaction(async (tx: any) => {
    // 1. Concurrency Control: Acquire session-level advisory lock
    const lockKey = crc32(projectId);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

    // 2. Fetch Project Metadata & Sequencing
    const projectResult = await tx.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { organizationId: true, key: true },
    });

    if (!projectResult) throw new Error('Project not found');

    const lastRecord = await tx.query.records.findFirst({
      where: eq(records.projectId, projectId),
      orderBy: [desc(records.number)],
      columns: { number: true },
    });

    const nextNumber = (lastRecord?.number || 0) + 1;
    const displayId = projectResult.key
      ? `${projectResult.key}-${nextNumber}`
      : `${nextNumber}`;

    // 3. Insert Atomic Record
    const [newRecord] = await tx
      .insert(records)
      .values({
        projectId,
        typeId: data.typeId,
        number: nextNumber,
        displayId,
        data: data.data,
        status: data.status || 'pending',
        assignedTo: data.assignedTo,
        createdBy: userId,
        createdVia: data.createdVia || 'web',
        gpsLat: data.gpsLat,
        gpsLng: data.gpsLng,
        gpsAccuracy: data.gpsAccuracy,
      })
      .returning();

    // 4. Immutable Audit Log
    await tx.insert(recordHistory).values({
      recordId: newRecord.id,
      changedBy: userId,
      changeType: 'created',
      diff: { data: { old: null, new: data.data } },
    });

    // 5. Real-time Subscription Broadcast
    try {
      await broadcastToOrg(projectResult.organizationId, 'record:created', {
        projectId,
        recordId: newRecord.id,
        data: newRecord,
      });
    } catch (err) {
      logger.error('Failed to broadcast record creation', err as Error);
    }

    return newRecord;
  });
};

/**
 * Update Record with Audit Trail
 */
export const updateRecord = async (
  id: string,
  userId: string,
  data: any
) => {
  return await db.transaction(async (tx: any) => {
    const existing = await tx.query.records.findFirst({
      where: eq(records.id, id),
    });

    if (!existing) throw new Error('Record not found');

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.status && data.status !== existing.status) {
      if (data.status === 'submitted') {
        updateData.submittedAt = new Date();
      } else if (data.status === 'closed' || data.status === 'completed') {
        updateData.closedAt = new Date();
      }
    }

    const [updated] = await tx
      .update(records)
      .set(updateData)
      .where(eq(records.id, id))
      .returning();

    await tx.insert(recordHistory).values({
      recordId: id,
      changedBy: userId,
      changeType: 'updated',
      diff: {
        data: { old: existing.data, new: updated.data },
        status: { old: existing.status, new: updated.status },
        assignedTo: { old: existing.assignedTo, new: updated.assignedTo },
      },
    });

    const projectResult = await tx.query.projects.findFirst({
      where: eq(projects.id, existing.projectId),
      columns: { organizationId: true },
    });

    if (projectResult) {
      try {
        await broadcastToOrg(projectResult.organizationId, 'record:updated', {
          projectId: existing.projectId,
          recordId: id,
          data: updated,
        });
      } catch (err) {
        logger.error('Failed to broadcast record update', err as Error);
      }
    }

    return updated;
  });
};

/**
 * Media Access Layer: Signed Upload URLs
 */
export const getRecordMediaUploadUrl = async (
  projectId: string,
  fieldKey: string,
  extension = 'png'
) => {
  const fileName = `${fieldKey}_${Date.now()}.${extension}`;
  const path = `projects/${projectId}/records/media/${fileName}`;

  const signed = await createSignedUploadUrl(path);

  return {
    uploadUrl: signed.url,
    publicUrl: signed.publicUrl,
    path: path,
  };
};

/**
 * Advanced Field Validator (Photo, GPS, Signature)
 */
export const validateAdvancedField = (type: string, value: any) => {
  try {
    switch (type) {
      case 'photo_capture':
        return photoCaptureSchema.parse(value);
      case 'gps_location':
        return gpsLocationSchema.parse(value);
      case 'signature':
        return signatureSchema.parse(value);
      case 'rating':
        return ratingSchema.parse(value);
      default:
        return true;
    }
  } catch (err: any) {
    logger.error(`[RecordService:ValidationFailed] Type: ${type}`, err);
    throw err;
  }
};

/**
 * High-Performance Analytics Aggregation
 */
export const getRecordProjectStats = async (projectId: string) => {
  const allRecords = await db.query.records.findMany({
    where: eq(records.projectId, projectId),
    with: {
      type: true,
    },
  });

  const total = allRecords.length;
  const verified = allRecords.filter((r: any) => r.status === 'verified').length;
  const pending = allRecords.filter((r: any) => r.status === 'pending').length;
  const inProgress = allRecords.filter((r: any) => r.status === 'in_progress')
    .length;
  const submitted = allRecords.filter((r: any) => r.status === 'submitted')
    .length;

  const now = new Date();
  let breachedCount = 0;

  allRecords.forEach((r: any) => {
    if (r.status === 'verified' || r.status === 'closed') return;
    const slaHours = (r.type?.settings as any)?.slaHours || 72;
    if (now.getTime() - r.createdAt.getTime() > slaHours * 3600000) {
      breachedCount++;
    }
  });

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const trend = last7Days.map((day) => {
    const dayStr = day.toISOString().split('T')[0];
    const createdOnDay = allRecords.filter(
      (r: any) => r.createdAt.toISOString().split('T')[0] === dayStr
    ).length;
    const completedOnDay = allRecords.filter((r: any) => {
      const submittedDate = r.submittedAt?.toISOString().split('T')[0];
      return submittedDate === dayStr;
    }).length;

    return {
      date: dayStr,
      created: createdOnDay,
      completed: completedOnDay,
    };
  });

  return {
    summary: {
      total,
      completed: verified + submitted,
      pending,
      inProgress,
      completionRate: total > 0 ? ((verified + submitted) / total) * 100 : 0,
      slaFulfillment: total > 0 ? ((total - breachedCount) / total) * 100 : 100,
    },
    distribution: {
      pending,
      inProgress,
      completed: verified + submitted,
    },
    trend,
  };
};
/**
 * Real-time Locking (Phase 8 Precision)
 * Patterns: Industry-standard cooperative locking for data integrity.
 */
export const lockRecord = async (recordId: string, userId: string) => {
  const [updated] = await db
    .update(records)
    .set({
      lockedBy: userId,
      lockedAt: new Date(),
    })
    .where(eq(records.id, recordId))
    .returning();

  return updated;
};

export const unlockRecord = async (recordId: string, _userId: string) => {
  const [updated] = await db
    .update(records)
    .set({
      lockedBy: null,
      lockedAt: null,
    })
    .where(eq(records.id, recordId))
    .returning();

  return updated;
};
