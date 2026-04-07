import { get, post, put, del } from '@/lib/api';
import {
  ProjectTypeColumn,
  CreateTypeColumnData,
  UpdateTypeColumnData,
  ApiResponse,
} from '@validiant/shared';

/**
 * Type Columns Service - Schema Architect (Phase 5)
 */

export const listTypeColumns = async (
  projectId: string,
  typeId: string
): Promise<ProjectTypeColumn[]> => {
  const response = await get<ApiResponse<{ columns: ProjectTypeColumn[] }>>(
    `/projects/${projectId}/types/${typeId}/columns`
  );
  if (response.data.success) {
    return response.data.data.columns;
  }
  return [];
};

export const createTypeColumn = async (
  projectId: string,
  typeId: string,
  data: CreateTypeColumnData
): Promise<ProjectTypeColumn> => {
  const response = await post<ApiResponse<{ column: ProjectTypeColumn }>>(
    `/projects/${projectId}/types/${typeId}/columns`,
    data
  );
  if (response.data.success) {
    return response.data.data.column;
  }
  throw new Error('Failed to create column');
};

export const updateTypeColumn = async (
  projectId: string,
  typeId: string,
  columnId: string,
  data: UpdateTypeColumnData
): Promise<ProjectTypeColumn> => {
  const response = await put<ApiResponse<{ column: ProjectTypeColumn }>>(
    `/projects/${projectId}/types/${typeId}/columns/${columnId}`,
    data
  );
  if (response.data.success) {
    return response.data.data.column;
  }
  throw new Error('Failed to update column');
};

export const deleteTypeColumn = async (
  projectId: string,
  typeId: string,
  columnId: string
): Promise<void> => {
  await del(`/projects/${projectId}/types/${typeId}/columns/${columnId}`);
};

export const reorderColumns = async (
  projectId: string,
  typeId: string,
  columnIds: string[]
): Promise<void> => {
  await post(`/projects/${projectId}/types/${typeId}/columns/reorder`, {
    columnIds,
  });
};

export const columnsService = {
  listTypeColumns,
  createTypeColumn,
  updateTypeColumn,
  deleteTypeColumn,
  reorderColumns,
};

export default columnsService;
