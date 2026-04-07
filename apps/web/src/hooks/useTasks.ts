/**
 * Task Hooks - Optimistic Updates for Zero-Latency UX
 *
 * Phase 24 Refactor:
 * - Centralized Query Keys
 * - Cursor Pagination Support
 * - Full Optimistic UI for mutations
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { get, patch, post, del } from '@/lib/api';
import { queryKeys, setQueryData, getQueryData } from '@/lib/query-client';
import { TaskStatus, TaskPriority } from '@validiant/shared';

/**
 * Task Interface
 */
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags?: string[];
  assigneeId?: string;
  latitude?: number;
  longitude?: number;
  targetLatitude?: number;
  targetLongitude?: number;
  gpsDeviationThreshold?: number;
  customFields?: Record<string, unknown>;
  createdBy: string;
  position: number;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;

  project?: {
    id: string;
    name: string;
    organizationId: string;
  };
  assignees?: Array<{
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }>;
  verificationType?: {
    id: string;
    name: string;
    fieldSchema?: any;
  };
  caseId?: string;
  slaMetrics?: {
    status: 'on_track' | 'at_risk' | 'breached';
    deadline: string;
    percentage: number;
    remainingHours: number;
  };
}

/**
 * Task Filters
 */
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  search?: string;
  parentTaskId?: string | null;
  tags?: string[];
  perPage?: number;
}

/**
 * Tasks List Response (Cursor Paginated)
 */
interface TasksCursorResponse {
  success: true;
  data: {
    tasks: Task[];
    nextCursor: string | null;
  };
}

/**
 * Single Task Response
 */
interface TaskResponse {
  success: true;
  data: {
    task: Task;
  };
}

/**
 * Fetch tasks (Cursor Paginated for useInfiniteQuery)
 */
const fetchTasks = async ({
  projectId,
  filters,
  cursor,
}: {
  projectId: string;
  filters?: TaskFilters;
  cursor?: string;
}): Promise<TasksCursorResponse['data']> => {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.assignedTo) params.append('assigneeId', filters.assignedTo);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.parentTaskId !== undefined)
    params.append('parentTaskId', String(filters.parentTaskId));
  if (filters?.tags) filters.tags.forEach((t) => params.append('tags[]', t));
  if (filters?.perPage) params.append('perPage', String(filters.perPage));
  if (cursor) params.append('cursor', cursor);

  const paramsString = params.toString();
  const url = `/projects/${projectId}/tasks${paramsString ? `?${paramsString}` : ''}`;

  console.debug('[Tasks:FetchInitiated]', {
    url,
    projectId,
    hasFilters: !!filters,
  });
  const response = await get<TasksCursorResponse>(url);
  return response.data.data;
};

/**
 * useTasks Hook (Infinite Scroll / Cursor Paginated)
 */
export function useTasks(projectId: string, filters?: TaskFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.projects.tasks(projectId, filters),
    queryFn: ({ pageParam }) =>
      fetchTasks({ projectId, filters, cursor: pageParam as string }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!projectId,
  });
}

/**
 * useTask Hook
 */
export function useTask(taskId: string) {
  return useQuery<Task, Error>({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: async () => {
      const response = await get<TaskResponse>(`/tasks/${taskId}`);
      return response.data.data.task;
    },
    enabled: !!taskId,
  });
}

/**
 * useUpdateTask Hook (Optimistic UI Enabled)
 */
export function useUpdateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string;
      projectId: string;
      data: Partial<Task>;
    }) => {
      if (!taskId || taskId === 'undefined') {
        console.error(
          '[useUpdateTask] CRITICAL: Attempted to update task with invalid ID',
          { taskId, data }
        );
        throw new Error('Task ID is missing or invalid');
      }
      const response = await patch<TaskResponse>(`/tasks/${taskId}`, data);
      return response.data.data.task;
    },
    onMutate: async ({ taskId, projectId, data }) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      await qc.cancelQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });

      // Snapshot previous
      const previousTask = getQueryData<Task>(queryKeys.tasks.detail(taskId));

      // Optimistically update detail
      if (previousTask) {
        setQueryData<Task>(queryKeys.tasks.detail(taskId), {
          ...previousTask,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousTask, taskId, projectId };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTask) {
        setQueryData(
          queryKeys.tasks.detail(context.taskId),
          context.previousTask
        );
      }
    },
    onSettled: (_data, _err, variables, _context) => {
      qc.invalidateQueries({
        queryKey: queryKeys.tasks.detail(variables.taskId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.projectId),
      });
    },
  });
}

/**
 * useAssignTask Hook (Optimistic UI Enabled)
 */
export function useAssignTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      userId,
      assign = true,
    }: {
      taskId: string;
      projectId: string;
      userId: string;
      assign?: boolean;
    }) => {
      if (!taskId || taskId === 'undefined') {
        console.error(
          '[useAssignTask] CRITICAL: Attempted to assign task with invalid ID',
          { taskId, userId, assign }
        );
        throw new Error('Task ID is missing or invalid');
      }
      if (assign) {
        return await post(`/tasks/${taskId}/assign`, { userId });
      } else {
        return await del(`/tasks/${taskId}/assign/${userId}`);
      }
    },
    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.tasks.detail(variables.taskId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.projectId),
      });
    },
  });
}

/**
 * useDeleteTask Hook
 */
export function useDeleteTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string; projectId: string }) => {
      return await del(`/tasks/${taskId}`);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.projectId),
      });
    },
  });
}

/**
 * useBulkAssignTasks Hook
 */
export function useBulkAssignTasks() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      taskIds,
      userId,
    }: {
      projectId: string;
      taskIds: string[];
      userId: string;
    }) => {
      return await post(`/projects/${projectId}/tasks/bulk-assign`, {
        taskIds,
        userId,
      });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.projects.tasks(variables.projectId),
      });
    },
  });
}

/**
 * useBulkUpdateTaskStatus Hook
 */
export function useBulkUpdateTaskStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      taskIds,
      status,
    }: {
      projectId: string;
      taskIds: string[];
      status: TaskStatus;
    }) => {
      return await post(`/projects/${projectId}/tasks/bulk-status`, {
        taskIds,
        status,
      });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.projects.tasks(variables.projectId),
      });
    },
  });
}

/**
 * useBulkDeleteTasks Hook
 */
export function useBulkDeleteTasks() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      taskIds,
    }: {
      projectId: string;
      taskIds: string[];
    }) => {
      return await post(`/projects/${projectId}/tasks/bulk-delete`, {
        taskIds,
      });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.projects.tasks(variables.projectId),
      });
    },
  });
}
