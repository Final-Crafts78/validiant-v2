import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { APIResponse } from '@/lib/api';

export interface ProjectStats {
  summary: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    completionRate: number;
    slaFulfillment: number;
  };
  distribution: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  trend: Array<{
    date: string;
    created: number;
    completed: number;
  }>;
}

export function useProjectStats(projectId: string) {
  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () =>
      get<APIResponse<ProjectStats>>(`/tasks/projects/${projectId}/stats`).then(
        (res) => res.data.data
      ),
    enabled: !!projectId,
  });
}
