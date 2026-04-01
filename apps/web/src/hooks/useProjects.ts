import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace';
import * as projectService from '@/services/project.service';
import {
  getProjectMembers,
  removeProjectMember,
} from '@/services/project.service';
import type { ProjectMember } from '@/services/project.service';
import type { CreateProjectData, UpdateProjectData } from '@validiant/shared';
import { queryKeys } from '@/lib/query-keys';

export function useProjects() {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useQuery({
    queryKey: queryKeys.projects.org(activeOrgId ?? ''),
    queryFn: () => projectService.getOrgProjects(activeOrgId ?? ''),
    enabled: !!activeOrgId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
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
      qc.invalidateQueries({
        queryKey: queryKeys.projects.org(activeOrgId ?? ''),
      });
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
      qc.setQueryData(queryKeys.projects.detail(id), updated);
      qc.invalidateQueries({
        queryKey: queryKeys.projects.org(activeOrgId ?? ''),
      });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.projects.org(activeOrgId ?? ''),
      });
    },
  });
}

export function useArchiveProject(id: string) {
  const qc = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useMutation({
    mutationFn: () => projectService.archiveProject(id),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.projects.detail(id), updated);
      qc.invalidateQueries({
        queryKey: queryKeys.projects.org(activeOrgId ?? ''),
      });
    },
  });
}

export function useUnarchiveProject(id: string) {
  const qc = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useMutation({
    mutationFn: () => projectService.unarchiveProject(id),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.projects.detail(id), updated);
      qc.invalidateQueries({
        queryKey: queryKeys.projects.org(activeOrgId ?? ''),
      });
    },
  });
}

export function useCompleteProject(id: string) {
  const qc = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useMutation({
    mutationFn: () => projectService.completeProject(id),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.projects.detail(id), updated);
      qc.invalidateQueries({
        queryKey: queryKeys.projects.org(activeOrgId ?? ''),
      });
    },
  });
}

export function useLeaveProject(id: string) {
  const qc = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  return useMutation({
    mutationFn: () => projectService.leaveProject(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.projects.org(activeOrgId ?? ''),
      });
    },
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery<ProjectMember[]>({
    queryKey: queryKeys.projects.members(projectId),
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
        queryKey: queryKeys.projects.members(projectId),
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
        queryKey: queryKeys.projects.members(projectId),
      });
    },
  });
}
