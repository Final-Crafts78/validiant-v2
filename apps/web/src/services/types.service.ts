import { get, post, put, del } from '@/lib/api';
import {
  ProjectType,
  CreateProjectTypeData,
  UpdateProjectTypeData,
  ApiResponse,
} from '@validiant/shared';

/**
 * Project Types Service - Schema Architect (Phase 5)
 */

export const listProjectTypes = async (
  projectId: string
): Promise<ProjectType[]> => {
  const response = await get<ApiResponse<{ types: ProjectType[] }>>(
    `/projects/${projectId}/types`
  );
  if (response.data.success) {
    return response.data.data.types;
  }
  return [];
};

export const getProjectType = async (
  projectId: string,
  typeId: string
): Promise<ProjectType> => {
  const response = await get<ApiResponse<{ type: ProjectType }>>(
    `/projects/${projectId}/types/${typeId}`
  );
  if (response.data.success) {
    return response.data.data.type;
  }
  throw new Error('Project Type not found');
};

export const createProjectType = async (
  projectId: string,
  data: CreateProjectTypeData
): Promise<ProjectType> => {
  const response = await post<ApiResponse<{ type: ProjectType }>>(
    `/projects/${projectId}/types`,
    data
  );
  if (response.data.success) {
    return response.data.data.type;
  }
  throw new Error('Failed to create project type');
};

export const updateProjectType = async (
  projectId: string,
  typeId: string,
  data: UpdateProjectTypeData
): Promise<ProjectType> => {
  const response = await put<ApiResponse<{ type: ProjectType }>>(
    `/projects/${projectId}/types/${typeId}`,
    data
  );
  if (response.data.success) {
    return response.data.data.type;
  }
  throw new Error('Failed to update project type');
};

export const deleteProjectType = async (
  projectId: string,
  typeId: string
): Promise<void> => {
  await del(`/projects/${projectId}/types/${typeId}`);
};

export const typesService = {
  listProjectTypes,
  getProjectType,
  createProjectType,
  updateProjectType,
  deleteProjectType,
};

export default typesService;
