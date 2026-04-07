import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/api';
import { TypeColumn } from '@validiant/shared';
import { queryKeys } from '../lib/query-keys';
import { toast } from 'react-hot-toast';

/**
 * useTypeColumns - Hook for managing dynamic schema elements within a project type.
 * Part of Phase 8 — "Data Driven Perfection"
 */
export const useTypeColumns = (projectId: string, typeId?: string) => {
  const queryClient = useQueryClient();

  // Fetch columns for a specific type
  const { data: columns, isLoading } = useQuery({
    queryKey: queryKeys.projects.typeColumns(projectId, typeId || ''),
    queryFn: async () => {
      const response = await get<{ data: { columns: TypeColumn[] } }>(
        `/projects/${projectId}/types/${typeId}/columns`
      );
      return response.data.data.columns;
    },
    enabled: !!projectId && !!typeId,
  });

  // Create column mutation
  const createColumn = useMutation({
    mutationFn: async (data: Partial<TypeColumn>) => {
      const response = await post<{ data: { column: TypeColumn } }>(
        `/projects/${projectId}/types/${typeId}/columns`,
        data
      );
      return response.data.data.column;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.typeColumns(projectId, typeId || ''),
      });
      // Also invalidate types as they might have column counts
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.types(projectId),
      });
      toast.success('Schema element injected');
    },
  });

  // Update column mutation
  const updateColumn = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TypeColumn>;
    }) => {
      const response = await put<{ data: { column: TypeColumn } }>(
        `/projects/${projectId}/types/${typeId}/columns/${id}`,
        data
      );
      return response.data.data.column;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.typeColumns(projectId, typeId || ''),
      });
      toast.success('Schema updated');
    },
  });

  // Delete column mutation
  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      await del(`/projects/${projectId}/types/${typeId}/columns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.typeColumns(projectId, typeId || ''),
      });
      toast.success('Element removed from universe');
    },
  });

  return {
    columns,
    isLoading,
    createColumn,
    updateColumn,
    deleteColumn,
  };
};
