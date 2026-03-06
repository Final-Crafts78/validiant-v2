import { get, post } from '@/lib/api';
import type { APIResponse } from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  status: string;
  organizationId: string;
  createdAt: string;
}

export const getOrgProjects = async (orgId: string): Promise<Project[]> => {
  return get<APIResponse<{ projects: Project[] }>>(
    `/organizations/${orgId}/projects`
  ).then((res) => res.data.data?.projects ?? []);
};

export const createProject = async (payload: {
  orgId: string;
  name: string;
}): Promise<Project> => {
  return post<APIResponse<{ project: Project }>>(
    `/organizations/${payload.orgId}/projects`,
    { name: payload.name }
  ).then((res) => {
    if (!res.data.data?.project) {
      throw new Error('Project creation failed to return project data');
    }
    return res.data.data.project;
  });
};

export const addProjectMember = async (
  projectId: string,
  payload: { userId: string; role: 'manager' | 'contributor' | 'viewer' }
): Promise<void> => {
  return post(`/projects/${projectId}/members`, payload).then(() => undefined);
};
