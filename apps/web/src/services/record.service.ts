import { get, post, put, del } from '@/lib/api';
import { 
  ProjectRecord, 
  CreateRecordDataInput, 
  UpdateRecordDataInput 
} from '@validiant/shared';

import { APIResponse } from '@/lib/api';

/**
 * Record Engine Service - Phase 2 architect
 * Refactored to use functional API utilities with correct APIResponse nesting.
 */

/**
 * List records for a project
 */
export const listProjectRecords = async (projectId: string): Promise<ProjectRecord[]> => {
  const response = await get<APIResponse<{ records: ProjectRecord[] }>>(
    `/projects/${projectId}/records`
  );
  return response.data.data?.records ?? [];
};

/**
 * Get a single record
 */
export const getRecord = async (projectId: string, id: string): Promise<ProjectRecord> => {
  const response = await get<APIResponse<{ record: ProjectRecord }>>(
    `/projects/${projectId}/records/${id}`
  );
  const record = response.data.data?.record;
  if (!record) throw new Error('Record not found');
  return record;
};

/**
 * Create a new record
 */
export const createRecord = async (
  projectId: string,
  data: CreateRecordDataInput
): Promise<ProjectRecord> => {
  const response = await post<APIResponse<{ record: ProjectRecord }>>(
    `/projects/${projectId}/records`,
    data
  );
  const record = response.data.data?.record;
  if (!record) throw new Error('Failed to create record');
  return record;
};

/**
 * Update an existing record
 */
export const updateRecord = async (
  projectId: string,
  id: string,
  data: UpdateRecordDataInput
): Promise<ProjectRecord> => {
  const response = await put<APIResponse<{ record: ProjectRecord }>>(
    `/projects/${projectId}/records/${id}`,
    data
  );
  const record = response.data.data?.record;
  if (!record) throw new Error('Failed to update record');
  return record;
};

/**
 * Request a signed upload URL for media (Photo/Signature)
 */
export const getMediaUploadUrl = async (
  projectId: string,
  fieldKey: string,
  ext: string = 'png'
): Promise<{ uploadUrl: string; publicUrl: string; path: string }> => {
  const response = await get<APIResponse<{ uploadUrl: string; publicUrl: string; path: string }>>(
    `/projects/${projectId}/records/upload-url`,
    { params: { fieldKey, ext } }
  );
  if (!response.data.data) throw new Error('Failed to get upload URL');
  return response.data.data;
};

/**
 * Get record history/audit trail
 */
export const getRecordHistory = async (
  projectId: string,
  recordId: string
): Promise<any[]> => {
  const response = await get<APIResponse<{ history: any[] }>>(
    `/projects/${projectId}/records/${recordId}/history`
  );
  return response.data.data?.history ?? [];
};

/**
 * Unified Media Upload
 * 1. Get signed URL
 * 2. Upload file directly to R2 (via Supabase Storage proxy)
 */
export const uploadMedia = async (
  projectId: string,
  fieldKey: string,
  file: File | Blob
): Promise<string> => {
  const ext = file instanceof File ? file.name.split('.').pop() || 'png' : 'png';
  const { uploadUrl, publicUrl } = await getMediaUploadUrl(
    projectId,
    fieldKey,
    ext
  );

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to upload media to storage');
  }

  return publicUrl;
};

/**
 * Lock a record for editing (Phase 8 Precision)
 */
export const lockRecord = async (projectId: string, recordId: string): Promise<ProjectRecord> => {
  const response = await post<APIResponse<{ record: ProjectRecord }>>(
    `/projects/${projectId}/records/${recordId}/lock`
  );
  return response.data.data?.record!;
};

/**
 * Unlock a record after editing (Phase 8 Precision)
 */
export const unlockRecord = async (projectId: string, recordId: string): Promise<ProjectRecord> => {
  const response = await del<APIResponse<{ record: ProjectRecord }>>(
    `/projects/${projectId}/records/${recordId}/lock`
  );
  return response.data.data?.record!;
};

// Internal service object for legacy imports
export const recordService = {
  listProjectRecords,
  getRecord,
  createRecord,
  updateRecord,
  getMediaUploadUrl,
  uploadMedia,
  getRecordHistory,
  lockRecord,
  unlockRecord
};

export default recordService;
