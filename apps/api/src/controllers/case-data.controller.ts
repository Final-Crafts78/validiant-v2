/**
 * Case Data Controller
 *
 * Handles HTTP requests for task field values and document metadata.
 */

import { Context } from 'hono';
import * as caseDataService from '../services/case-data.service';
import * as taskService from '../services/task.service';
import * as storageService from '../services/storage.service';

/**
 * Get Case Hub (Task by Case ID) for Detail View
 * GET /api/v1/tasks/case/:caseId
 */
export const getCaseHub = async (c: Context) => {
  try {
    const user = c.get('user');
    const caseId = c.req.param('caseId');

    if (!user || !user.organizationId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const task = await taskService.getTaskByCaseId(user.organizationId, caseId);

    return c.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Get case hub error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to find case hub',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Update field values for a task
 */
export const updateFieldValues = async (c: Context) => {
  try {
    const taskId = c.req.param('taskId');
    const user = c.get('user');
    const body = await c.req.json();

    await caseDataService.saveFieldValues(taskId, user.userId, body.values);

    return c.json({
      success: true,
      message: 'Field values updated successfully',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to update field values',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get field values and documents for a task
 */
export const getTaskData = async (c: Context) => {
  try {
    const taskId = c.req.param('taskId');

    const [values, documents] = await Promise.all([
      caseDataService.getTaskFieldValues(taskId),
      caseDataService.getTaskDocuments(taskId),
    ]);

    return c.json({
      success: true,
      data: {
        values,
        documents,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to get task data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Log a document upload (Traditional Multipart - Legacy)
 */
export const logDocument = async (c: Context) => {
  try {
    const taskId = c.req.param('taskId');
    const user = c.get('user');
    const body = await c.req.json();

    const upload = await caseDataService.logDocumentUpload(
      taskId,
      body.fieldKey,
      user.userId,
      body.uploadData
    );

    return c.json({
      success: true,
      message: 'Document logged successfully',
      data: upload,
    });
  } catch (error) {
    console.error('Log document error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to log document',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Generate Presigned Upload URL (Phase 21)
 * POST /api/v1/tasks/:taskId/upload-url
 */
export const getUploadUrl = async (c: Context) => {
  try {
    const taskId = c.req.param('taskId');
    const user = c.get('user');
    const body = await c.req.json();
    const { fileName, fileSize, mimeType, fieldKey, geoTag } = body;

    // 1. Pre-validate field requirements
    if (!fieldKey || !fileName || !fileSize) {
      return c.json(
        { success: false, error: 'Missing upload parameters' },
        400
      );
    }

    // 2. Pre-create pending record in DB
    const upload = await caseDataService.createPendingUpload(
      taskId,
      fieldKey,
      user.userId,
      {
        fileName,
        mimeType,
        fileSize,
        geoTag,
      }
    );

    // 3. Generate path: {taskId}/{uploadId}_{fileName}
    const path = `${taskId}/${upload.id}_${fileName}`;

    // 4. Request signed URL from Storage Engine
    const signedData = await storageService.createSignedUploadUrl(path);

    // 5. Update record with the public/access URL
    await caseDataService.updateUploadUrl(upload.id, signedData.publicUrl);

    return c.json({
      success: true,
      data: {
        uploadId: upload.id,
        uploadUrl: signedData.url,
        token: signedData.token,
      },
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to generate upload URL',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Confirm Upload & Verify Hash (Phase 21)
 * POST /api/v1/tasks/:taskId/documents/:fileId/confirm
 */
export const confirmUpload = async (c: Context) => {
  try {
    const fileId = c.req.param('fileId');
    const { uploadHash } = await c.req.json();

    if (!uploadHash) {
      return c.json({ success: false, error: 'Integrity hash required' }, 400);
    }

    // 1. Mark as verifying
    await caseDataService.updateUploadStatus(fileId, 'verifying', uploadHash);

    // 2. Trigger async verification
    const result = await caseDataService.verifyUploadIntegrity(fileId);

    return c.json({
      success: true,
      message: 'Upload confirmed and integrity verified',
      data: { status: result.status },
    });
  } catch (error) {
    console.error('Confirm upload error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to confirm upload',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Upload Forensic Evidence (Phase 20 - Multipart implementation)
 * @deprecated Use getUploadUrl + confirmUpload flow for large files
 */
export const uploadEvidence = async (c: Context) => {
  try {
    const taskId = c.req.param('taskId');
    const user = c.get('user');
    const body = await c.req.parseBody();

    const file = body.file as File;
    const fieldKey = body.fieldKey as string;
    const geoTagStr = body.geoTag as string;
    const geoTag = JSON.parse(geoTagStr);

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    const mockUrl = `https://storage.validiant.com/evidence/${taskId}/${file.name}`;

    const upload = await caseDataService.logDocumentUpload(
      taskId,
      fieldKey,
      user.userId,
      {
        fileName: file.name,
        fileUrl: mockUrl,
        mimeType: file.type,
        fileSize: file.size,
        geoTag,
      }
    );

    return c.json({
      success: true,
      message: 'Forensic evidence captured and logged',
      data: upload,
    });
  } catch (error) {
    console.error('Evidence upload error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to upload evidence',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
