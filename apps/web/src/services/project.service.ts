import { get, post, patch, del } from '@/lib/api';
import type { APIResponse } from '@/lib/api';
import type {
  Project,
  CreateProjectData,
  UpdateProjectData,
} from '@validiant/shared';

export type { Project };

export const getOrgProjects = async (orgId: string): Promise<Project[]> =>
  get<APIResponse<{ projects: Project[] }>>(
    `/organizations/${orgId}/projects`
  ).then((res) => res.data.data?.projects ?? []);

export const getProjectById = async (id: string): Promise<Project> =>
  get<APIResponse<{ project: Project }>>(`/projects/${id}`).then((res) => {
    if (!res.data.data?.project) throw new Error('Project not found');
    return res.data.data.project;
  });

export const createProject = async (
  payload: CreateProjectData
): Promise<Project> =>
  post<APIResponse<{ project: Project }>>(
    `/organizations/${payload.organizationId}/projects`,
    payload
  ).then((res) => {
    if (!res.data.data?.project) throw new Error('Project creation failed');
    return res.data.data.project;
  });

export const updateProject = async (
  id: string,
  data: UpdateProjectData
): Promise<Project> =>
  patch<APIResponse<{ project: Project }>>(`/projects/${id}`, data).then(
    (res) => {
      if (!res.data.data?.project) throw new Error('Update failed');
      return res.data.data.project;
    }
  );

export const deleteProject = async (id: string): Promise<void> =>
  del(`/projects/${id}`).then(() => undefined);

export const addProjectMember = async (
  projectId: string,
  payload: { userId: string; role: 'admin' | 'member' | 'viewer' }
): Promise<void> =>
  post(`/projects/${projectId}/members`, payload).then(() => undefined);

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

export const getProjectMembers = async (
  projectId: string
): Promise<ProjectMember[]> =>
  get<APIResponse<{ members: ProjectMember[] }>>(
    `/projects/${projectId}/members`
  ).then((res) => res.data.data?.members ?? []);

export const removeProjectMember = async (
  projectId: string,
  userId: string
): Promise<void> =>
  del(`/projects/${projectId}/members/${userId}`).then(() => undefined);
