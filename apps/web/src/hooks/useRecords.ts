import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recordService } from '../services/record.service';
import { queryKeys } from '../lib/query-keys';
import {
  CreateRecordDataInput,
  UpdateRecordDataInput,
} from '@validiant/shared';
import { toast } from 'react-hot-toast';

/**
 * useRecords - Hook for managing project records in Phase 5
 */
export const useRecords = (projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch all records for a project
  const { data: records, isLoading } = useQuery({
    queryKey: queryKeys.records.byProject(projectId || ''),
    queryFn: () => recordService.listProjectRecords(projectId || ''),
    enabled: !!projectId,
  });

  // Create record mutation
  const createRecord = useMutation({
    mutationFn: (data: CreateRecordDataInput) =>
      recordService.createRecord(projectId || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.records.byProject(projectId || ''),
      });
      toast.success('Record created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Creation failed: ${error.message}`);
    },
  });

  // Update record mutation
  const updateRecord = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecordDataInput }) =>
      recordService.updateRecord(projectId || '', id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.records.byProject(projectId || ''),
      });
      toast.success(`Record #${updated.number} updated`);
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  // Lock record mutation (Phase 8 Precision)
  const lockRecord = useMutation({
    mutationFn: (id: string) => recordService.lockRecord(projectId || '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.records.byProject(projectId || ''),
      });
    },
  });

  // Unlock record mutation (Phase 8 Precision)
  const unlockRecord = useMutation({
    mutationFn: (id: string) => recordService.unlockRecord(projectId || '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.records.byProject(projectId || ''),
      });
    },
  });

  // Bulk create records mutation
  const bulkCreateRecords = useMutation({
    mutationFn: (records: CreateRecordDataInput[]) =>
      recordService.bulkCreateRecords(projectId || '', records),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.records.byProject(projectId || ''),
      });
      toast.success(
        `Bulk operation complete: ${result.created} created, ${result.updated} updated`
      );
    },
    onError: (error: Error) => {
      toast.error(`Bulk ingestion failed: ${error.message}`);
    },
  });

  return {
    records,
    isLoading,
    createRecord,
    updateRecord,
    bulkCreateRecords,
    lockRecord,
    unlockRecord,
  };
};

/**
 * Hook for record history
 */
export const useRecordHistory = (projectId: string, recordId: string) => {
  return useQuery({
    queryKey: queryKeys.records.history(projectId, recordId),
    queryFn: () => recordService.getRecordHistory(projectId, recordId),
    enabled: !!projectId && !!recordId,
  });
};
