import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { columnsService } from '../services/columns.service';
import { queryKeys } from '../lib/query-keys';
import { CreateTypeColumnData, UpdateTypeColumnData } from '@validiant/shared';
import { toast } from 'react-hot-toast';

export const useColumns = (projectId: string, typeId: string) => {
  const queryClient = useQueryClient();

  const { data: columns, isLoading } = useQuery({
    queryKey: queryKeys.columns.byType(projectId, typeId),
    queryFn: () => columnsService.listTypeColumns(projectId, typeId),
    enabled: !!projectId && !!typeId,
  });

  const createColumn = useMutation({
    mutationFn: (data: CreateTypeColumnData) =>
      columnsService.createTypeColumn(projectId, typeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.columns.byType(projectId, typeId),
      });
      toast.success('Column added');
    },
    onError: (error: any) => {
      toast.error(`Failed to add column: ${error.message}`);
    },
  });

  const updateColumn = useMutation({
    mutationFn: ({
      columnId,
      data,
    }: {
      columnId: string;
      data: UpdateTypeColumnData;
    }) => columnsService.updateTypeColumn(projectId, typeId, columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.columns.byType(projectId, typeId),
      });
      toast.success('Column updated');
    },
  });

  const deleteColumn = useMutation({
    mutationFn: (columnId: string) =>
      columnsService.deleteTypeColumn(projectId, typeId, columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.columns.byType(projectId, typeId),
      });
      toast.success('Column deleted');
    },
  });

  const reorderColumns = useMutation({
    mutationFn: (columnIds: string[]) =>
      columnsService.reorderColumns(projectId, typeId, columnIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.columns.byType(projectId, typeId),
      });
    },
  });

  return {
    columns,
    isLoading,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
  };
};
