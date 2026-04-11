/**
 * Case Hub Hook - Special interface for the Case Command Center
 *
 * Refactored for Phase 24 Centralized Keys.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch, post } from '@/lib/api';
import { Task } from './useTasks';
import { queryKeys } from '@/lib/query-keys';

/**
 * useCaseHub Hook
 *
 * Fetches a task (case) by its atomic case reference (e.g. CASE-2024-001)
 */
export function useCaseHub(caseId: string) {
  return useQuery<Task, Error>({
    queryKey: queryKeys.cases.hub(caseId),
    queryFn: async () => {
      const response = await get<{ success: boolean; data: { task: Task } }>(
        `/tasks/case/${caseId}`
      );
      return response.data.data.task;
    },
    enabled: !!caseId,
    refetchInterval: 30000, // Refresh every 30s for SLA tracking
  });
}

/**
 * useUpdateCaseFields Hook
 *
 * Update dynamic field values for a case
 */
export function useUpdateCaseFields() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      values,
    }: {
      taskId: string;
      caseId: string;
      values: Record<string, unknown>;
    }) => {
      const response = await patch<{ success: boolean }>(
        `/tasks/${taskId}/fields`,
        { values }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the case hub query
      qc.invalidateQueries({
        queryKey: queryKeys.cases.hub(variables.caseId),
      });
      // Also invalidate general task detail if cached
      qc.invalidateQueries({
        queryKey: queryKeys.tasks.detail(variables.taskId),
      });
    },
  });
}

/**
 * computeSHA256 - Helper to generate integrity hash for tamper verification
 */
async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * useUploadEvidence Hook (Phase 21 - Presigned URL Flow)
 */
export function useUploadEvidence() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      caseId: _caseId,
      fieldKey,
      file,
      geoTag,
    }: {
      taskId: string;
      caseId: string;
      fieldKey: string;
      file: File;
      geoTag: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        timestamp?: number;
      };
    }) => {
      // 1. Get Presigned URL
      const { data: urlData } = await post<{
        success: boolean;
        data: { uploadId: string; uploadUrl: string; token?: string };
      }>(`/tasks/${taskId}/upload-url`, {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fieldKey,
        geoTag,
      });

      const { uploadId, uploadUrl } = urlData.data;

      // 2. Compute Integrity Hash (SHA-256)
      const uploadHash = await computeSHA256(file);

      // 3. Upload directly to Storage (PUT)
      // Note: We bypass our API for the heavy binary
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Storage upload failed');
      }

      // 4. Confirm upload with our API and provide the hash
      const { data: confirmData } = await post<{
        success: boolean;
        data: { status: string };
      }>(`/tasks/${taskId}/documents/${uploadId}/confirm`, {
        uploadHash,
      });

      return confirmData.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.cases.hub(variables.caseId),
      });
    },
  });
}
