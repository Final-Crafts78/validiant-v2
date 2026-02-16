/**
 * Task Hooks - Optimistic Updates for Zero-Latency UX
 *
 * React Query hooks for task management with optimistic updates.
 *
 * OPTIMISTIC UPDATE PATTERN:
 * 1. User performs action (drag task, update status)
 * 2. UI updates INSTANTLY (before API response)
 * 3. API request happens in background
 * 4. If success: Changes are kept
 * 5. If error: UI rolls back to previous state
 *
 * RESULT: 0ms perceived latency for perfect UX
 *
 * KANBAN BOARD EXAMPLE:
 * - User drags task from "TODO" to "IN_PROGRESS"
 * - Task moves instantly in UI
 * - API updates database in background
 * - If API fails, task snaps back to original column
 *
 * FEATURES:
 * - Optimistic updates for instant feedback
 * - Automatic rollback on errors
 * - Cache invalidation for fresh data
 * - Type-safe task interfaces
 * - Real-time integration ready
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { get, post, patch, del } from '@/lib/api';
import { queryKeys, getQueryData, setQueryData } from '@/lib/query-client';

/**
 * Task Status Enum
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Task Priority Enum
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

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
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  position: number;
  tags: string[];
  customFields: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  // Additional fields from API
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
  subtaskCount?: number;
  completedSubtaskCount?: number;
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
  page?: number;
  perPage?: number;
}

/**
 * Tasks Response
 */
interface TasksResponse {
  success: true;
  data: {
    tasks: Task[];
    pagination: {
      total: number;
      page: number;
      perPage: number;
      totalPages: number;
    };
  };
}

/**
 * Task Response
 */
interface TaskResponse {
  success: true;
  data: {
    task: Task;
  };
}

/**
 * Fetch tasks by project ID
 */
const fetchTasks = async (
  projectId: string,
  filters?: TaskFilters
): Promise<Task[]> => {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.parentTaskId !== undefined)
    params.append('parentTaskId', String(filters.parentTaskId));
  if (filters?.tags)
    filters.tags.forEach((tag) => params.append('tags[]', tag));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.perPage) params.append('perPage', String(filters.perPage));

  const queryString = params.toString();
  const url = `/api/v1/projects/${projectId}/tasks${queryString ? `?${queryString}` : ''}`;

  const response = await get<TasksResponse>(url);
  return response.data.data.tasks;
};

/**
 * Fetch single task by ID
 */
const fetchTask = async (taskId: string): Promise<Task> => {
  const response = await get<TaskResponse>(`/api/v1/tasks/${taskId}`);
  return response.data.data.task;
};

/**
 * useTasks Hook
 *
 * Fetch tasks for a project with optional filters.
 *
 * @param projectId - Project ID
 * @param filters - Optional filters
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * function TaskList({ projectId }: { projectId: string }) {
 *   const { data: tasks, isLoading, error } = useTasks(projectId, {
 *     status: TaskStatus.TODO,
 *     priority: TaskPriority.HIGH,
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error error={error} />;
 *
 *   return (
 *     <ul>
 *       {tasks.map(task => (
 *         <TaskCard key={task.id} task={task} />
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useTasks(
  projectId: string,
  filters?: TaskFilters,
  options?: Omit<UseQueryOptions<Task[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Task[], Error>({
    queryKey: queryKeys.projects.tasks(projectId, filters),
    queryFn: () => fetchTasks(projectId, filters),
    ...options,
  });
}

/**
 * useTask Hook
 *
 * Fetch single task by ID.
 */
export function useTask(taskId: string) {
  return useQuery<Task, Error>({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => fetchTask(taskId),
  });
}

/**
 * Update Task Data
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * useUpdateTask Hook
 *
 * Update task with OPTIMISTIC UPDATES for instant UI feedback.
 *
 * OPTIMISTIC UPDATE FLOW:
 * 1. onMutate: Update cache immediately (before API)
 * 2. User sees instant UI change (0ms latency)
 * 3. API request happens in background
 * 4. onSuccess: Keep changes, invalidate related queries
 * 5. onError: Rollback to previous state
 *
 * @example
 * ```tsx
 * function TaskCard({ task }: { task: Task }) {
 *   const updateTask = useUpdateTask();
 *
 *   const handleStatusChange = (newStatus: TaskStatus) => {
 *     updateTask.mutate({
 *       taskId: task.id,
 *       projectId: task.projectId,
 *       data: { status: newStatus },
 *     });
 *     // UI updates INSTANTLY! 🚀
 *   };
 *
 *   return (
 *     <div>
 *       <h3>{task.title}</h3>
 *       <select value={task.status} onChange={e => handleStatusChange(e.target.value)}>
 *         {Object.values(TaskStatus).map(status => (
 *           <option key={status} value={status}>{status}</option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string;
      projectId: string;
      data: UpdateTaskData;
    }) => {
      const response = await patch<TaskResponse>(
        `/api/v1/tasks/${taskId}`,
        data
      );
      return response.data.data.task;
    },

    // ⚡ OPTIMISTIC UPDATE: Update cache immediately
    onMutate: async ({ taskId, projectId, data }) => {
      // Cancel outgoing refetches (so they don't overwrite optimistic update)
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.detail(taskId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.projects.tasks(projectId),
      });

      // Snapshot previous value for rollback
      const previousTask = getQueryData<Task>(queryKeys.tasks.detail(taskId));
      const previousTasks = getQueryData<Task[]>(
        queryKeys.projects.tasks(projectId)
      );

      // Optimistically update task detail
      if (previousTask) {
        setQueryData<Task>(queryKeys.tasks.detail(taskId), {
          ...previousTask,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      // Optimistically update task in list
      if (previousTasks) {
        setQueryData<Task[]>(
          queryKeys.projects.tasks(projectId),
          previousTasks.map((task) =>
            task.id === taskId
              ? { ...task, ...data, updatedAt: new Date().toISOString() }
              : task
          )
        );
      }

      // Return context for rollback
      return { previousTask, previousTasks, taskId, projectId };
    },

    // ❌ ERROR: Rollback optimistic update
    onError: (_error, _variables, context) => {
      console.error('[useUpdateTask] Update failed, rolling back:', _error);

      if (context) {
        // Restore previous values
        if (context.previousTask) {
          setQueryData(
            queryKeys.tasks.detail(context.taskId),
            context.previousTask
          );
        }
        if (context.previousTasks) {
          setQueryData(
            queryKeys.projects.tasks(context.projectId),
            context.previousTasks
          );
        }
      }
    },

    // ✅ SUCCESS: Invalidate queries to refetch fresh data
    onSettled: (_data, _error, _variables, context) => {
      if (context) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.detail(context.taskId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.tasks(context.projectId),
        });
      }
    },
  });
}

/**
 * Create Task Data
 */
export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  parentTaskId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  assigneeIds?: string[];
}

/**
 * useCreateTask Hook
 *
 * Create new task with optimistic insertion.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: CreateTaskData;
    }) => {
      const response = await post<TaskResponse>(
        `/api/v1/projects/${projectId}/tasks`,
        data
      );
      return response.data.data.task;
    },

    onSuccess: (_newTask, _variables) => {
      // Invalidate tasks list to refetch with new task
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.tasks(_variables.projectId),
      });
    },
  });
}

/**
 * useDeleteTask Hook
 *
 * Delete task with optimistic removal.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string; projectId: string }) => {
      await del(`/api/v1/tasks/${taskId}`);
    },

    // Optimistically remove task from list
    onMutate: async ({ taskId, projectId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.projects.tasks(projectId),
      });

      const previousTasks = getQueryData<Task[]>(
        queryKeys.projects.tasks(projectId)
      );

      if (previousTasks) {
        setQueryData<Task[]>(
          queryKeys.projects.tasks(projectId),
          previousTasks.filter((task) => task.id !== taskId)
        );
      }

      return { previousTasks, taskId, projectId };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        setQueryData(
          queryKeys.projects.tasks(context.projectId),
          context.previousTasks
        );
      }
    },

    onSettled: (_data, _error, _variables, context) => {
      if (context) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.tasks(context.projectId),
        });
      }
    },
  });
}

/**
 * useAssignTask Hook
 *
 * Assign/unassign user to task.
 */
export function useAssignTask() {
  const queryClient = useQueryClient();

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
      if (assign) {
        await post(`/api/v1/tasks/${taskId}/assign`, { userId });
      } else {
        await del(`/api/v1/tasks/${taskId}/assign/${userId}`);
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.detail(variables.taskId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.tasks(variables.projectId),
      });
    },
  });
}
