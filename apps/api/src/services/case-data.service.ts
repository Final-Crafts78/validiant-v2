/**
 * Case Data Service
 *
 * Handles storage and retrieval of dynamic field values (EAV)
 * and document uploads associated with verification tasks.
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import {
  caseFieldValues,
  caseDocumentUploads,
  tasks,
  CaseFieldValue,
} from '../db/schema';
import { assertExists } from '../utils/errors';
import { logger } from '../utils/logger';
import { isWithinThreshold } from '@validiant/shared';

/**
 * Save multiple field values for a task
 */
export const saveFieldValues = async (
  taskId: string,
  userId: string,
  values: Record<string, unknown>
) => {
  // Check if task exists
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  assertExists(task, 'Task');

  const insertPromises = Object.entries(values).map(async ([key, value]) => {
    // Determine which column to use based on value type
    const insertData: Partial<typeof caseFieldValues.$inferInsert> & {
      updatedAt: Date;
    } = {
      taskId,
      fieldKey: key,
      filledBy: userId,
      updatedAt: new Date(),
    };

    if (typeof value === 'string') insertData.valueText = value;
    else if (typeof value === 'number') insertData.valueNumber = value;
    else if (typeof value === 'boolean') insertData.valueBoolean = value;
    else if (value instanceof Date) insertData.valueDate = value;
    else if (typeof value === 'object')
      insertData.valueJson = value as Record<string, unknown>;

    // Use upsert pattern (manual check for simplicity in edge env without full upsert helper)
    const existing = await db
      .select({ id: caseFieldValues.id })
      .from(caseFieldValues)
      .where(
        and(
          eq(caseFieldValues.taskId, taskId),
          eq(caseFieldValues.fieldKey, key)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return await db
        .update(caseFieldValues)
        .set(insertData)
        .where(eq(caseFieldValues.id, existing[0].id));
    } else {
      return await db.insert(caseFieldValues).values(insertData);
    }
  });

  await Promise.all(insertPromises);
  logger.info('Task field values updated', {
    taskId,
    fieldCount: Object.keys(values).length,
  });
};

/**
 * Get all field values for a task
 */
export const getTaskFieldValues = async (taskId: string) => {
  const results = await db
    .select()
    .from(caseFieldValues)
    .where(eq(caseFieldValues.taskId, taskId));

  // Reduce to a simple key-value map
  return results.reduce((acc: Record<string, unknown>, row: CaseFieldValue) => {
    acc[row.fieldKey] =
      row.valueText ??
      row.valueNumber ??
      row.valueDate ??
      row.valueBoolean ??
      row.valueJson;
    return acc;
  }, {});
};

/**
 * Log a document upload
 */
export const logDocumentUpload = async (
  taskId: string,
  fieldKey: string,
  userId: string,
  data: {
    fileName: string;
    fileUrl: string;
    mimeType?: string;
    fileSize?: number;
    uploadHash?: string;
    geoTag?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: number;
    };
  }
) => {
  // Check for geo-fencing if coordinates are provided
  let outsideRange = false;
  if (data.geoTag?.latitude && data.geoTag?.longitude) {
    const [task] = await db
      .select({
        targetLatitude: tasks.targetLatitude,
        targetLongitude: tasks.targetLongitude,
        gpsDeviationThreshold: tasks.gpsDeviationThreshold,
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (
      task?.targetLatitude &&
      task?.targetLongitude &&
      task?.gpsDeviationThreshold
    ) {
      if (data.geoTag) {
        const { isWithin, distance } = isWithinThreshold(
          { lat: data.geoTag.latitude, lng: data.geoTag.longitude },
          { lat: task.targetLatitude, lng: task.targetLongitude },
          task.gpsDeviationThreshold
        );

        if (!isWithin) {
          outsideRange = true;
          logger.warn('Document upload outside target range', {
            taskId,
            distance,
            threshold: task.gpsDeviationThreshold,
          });
        }
      }
    }
  }

  const [upload] = await db
    .insert(caseDocumentUploads)
    .values({
      taskId,
      fieldKey,
      uploadedBy: userId,
      outsideRange,
      ...data,
    })
    .returning();

  logger.info('Document upload logged', {
    taskId,
    fieldKey,
    uploadId: upload.id,
  });
  return upload;
};

/**
 * Get document uploads for a task
 */
export const getTaskDocuments = async (taskId: string) => {
  return await db
    .select()
    .from(caseDocumentUploads)
    .where(eq(caseDocumentUploads.taskId, taskId))
    .orderBy(caseDocumentUploads.createdAt);
};

/**
 * Pre-create a pending upload record (Phase 21)
 */
export const createPendingUpload = async (
  taskId: string,
  fieldKey: string,
  userId: string,
  data: {
    fileName: string;
    mimeType?: string;
    fileSize?: number;
    geoTag?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: number;
    };
  }
) => {
  const [upload] = await db
    .insert(caseDocumentUploads)
    .values({
      taskId,
      fieldKey,
      uploadedBy: userId,
      status: 'pending',
      fileUrl: 'pending', // Temporary placeholder until URL is generated
      ...data,
    })
    .returning();

  return upload;
};

/**
 * Update the download URL for an upload
 */
export const updateUploadUrl = async (uploadId: string, fileUrl: string) => {
  return await db
    .update(caseDocumentUploads)
    .set({ fileUrl })
    .where(eq(caseDocumentUploads.id, uploadId));
};

/**
 * Update upload status and hash
 */
export const updateUploadStatus = async (
  uploadId: string,
  status: string,
  uploadHash?: string
) => {
  return await db
    .update(caseDocumentUploads)
    .set({ status, uploadHash })
    .where(eq(caseDocumentUploads.id, uploadId));
};

/**
 * Verify upload integrity (Mocked for Phase 21 MVP)
 */
export const verifyUploadIntegrity = async (uploadId: string) => {
  // In a real implementation with Queues, this would be async.
  // For now, we'll mark as 'uploaded' if hash is present.
  const [upload] = await db
    .select()
    .from(caseDocumentUploads)
    .where(eq(caseDocumentUploads.id, uploadId))
    .limit(1);

  if (!upload) throw new Error('Upload not found');

  // Logic: In Phase 21, we instantly trust the hash if small.
  const newStatus = upload.uploadHash ? 'uploaded' : 'failed';

  await db
    .update(caseDocumentUploads)
    .set({
      status: newStatus,
      tampered: newStatus === 'failed',
    })
    .where(eq(caseDocumentUploads.id, uploadId));

  return { status: newStatus };
};
