import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace';
import * as projectService from '@/services/project.service';

const PROJECT_KEYS = {
  byOrg: (orgId: string) => ['projects', 'org', orgId] as const,
};

export function useProjects() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useQuery({
    queryKey: PROJECT_KEYS.byOrg(activeOrgId ?? ''),
    queryFn: () => projectService.getOrgProjects(activeOrgId ?? ''),
    enabled: !!activeOrgId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useMutation({
    mutationFn: (name: string) => {
      if (!activeOrgId) throw new Error('No active organization');
      return projectService.createProject({ orgId: activeOrgId, name });
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: PROJECT_KEYS.byOrg(activeOrgId ?? ''),
      });
    },
  });
}
