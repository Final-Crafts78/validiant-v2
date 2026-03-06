import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace';
import * as projectService from '@/services/project.service';
import {
  getProjectMembers,
  removeProjectMember,
} from '@/services/project.service';
import type { ProjectMember } from '@/services/project.service';
import type { CreateProjectData, UpdateProjectData } from '@validiant/shared';

export const PROJECT_KEYS = {
  byOrg: (orgId: string) => ['projects', 'org', orgId] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export function useProjects() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useQuery({
    queryKey: PROJECT_KEYS.byOrg(activeOrgId ?? ''),
    queryFn: () => projectService.getOrgProjects(activeOrgId ?? ''),
    enabled: !!activeOrgId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(id),
    queryFn: () => projectService.getProjectById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useMutation({
    mutationFn: (data: Omit<CreateProjectData, 'organizationId'>) => {
      if (!activeOrgId) throw new Error('No active organization');
      return projectService.createProject({
        ...data,
        organizationId: activeOrgId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.byOrg(activeOrgId ?? '') });
    },
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useMutation({
    mutationFn: (data: UpdateProjectData) =>
      projectService.updateProject(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(PROJECT_KEYS.detail(id), updated);
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.byOrg(activeOrgId ?? '') });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.byOrg(activeOrgId ?? '') });
    },
  });
}
export const PROJECT_MEMBER_KEYS = {
  byProject: (id: string) => ['projects', 'members', id] as const,
};

export function useProjectMembers(projectId: string) {
  return useQuery<ProjectMember[]>({
    queryKey: PROJECT_MEMBER_KEYS.byProject(projectId),
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}

export function useAddProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      userId: string;
      role: 'admin' | 'member' | 'viewer';
    }) => projectService.addProjectMember(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: PROJECT_MEMBER_KEYS.byProject(projectId),
      });
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeProjectMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: PROJECT_MEMBER_KEYS.byProject(projectId),
      });
    },
  });
}
