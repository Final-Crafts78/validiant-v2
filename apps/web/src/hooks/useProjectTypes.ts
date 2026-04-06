import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { typesService } from '../services/types.service';
import { queryKeys } from '../lib/query-keys';
import { 
  CreateProjectTypeData, 
  UpdateProjectTypeData 
} from '@validiant/shared';
import { toast } from 'react-hot-toast';

/**
 * useProjectTypes - Hook for project type discovery and management in Phase 8
 */
export const useProjectTypes = (projectId: string) => {
  const queryClient = useQueryClient();

  // Fetch all types for a project
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.types.byProject(projectId),
    queryFn: () => typesService.listProjectTypes(projectId),
    enabled: !!projectId,
  });

  // Create type mutation
  const createType = useMutation({
    mutationFn: (data: CreateProjectTypeData) => 
      typesService.createProjectType(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.types.byProject(projectId) 
      });
      toast.success('New data archetype defined');
    },
  });

  // Update type mutation
  const updateType = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectTypeData }) =>
      typesService.updateProjectType(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.types.byProject(projectId) 
      });
      toast.success('Archetype updated');
    },
  });

  // Delete type mutation
  const deleteType = useMutation({
    mutationFn: (id: string) => typesService.deleteProjectType(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.types.byProject(projectId) 
      });
      toast.success('Archetype removed from universe');
    },
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    createType,
    updateType,
    deleteType,
  };
};
