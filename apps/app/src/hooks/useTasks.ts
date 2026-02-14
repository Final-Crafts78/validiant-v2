/**
 * Mobile Task Hooks - Optimistic Updates
 * 
 * Identical pattern to web app for cross-platform consistency.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '../services/api';
import { queryKeys, getQueryData, setQueryData } from '../lib/query-client';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface TasksResponse {
  success: true;
  data: { tasks: Task[] };
}

interface TaskResponse {
  success: true;
  data: { task: Task };
}

const fetchTasks = async (projectId: string): Promise<Task[]> => {
  const response = await get<TasksResponse>(`/api/v1/projects/${projectId}/tasks`);
  return response.data.data.tasks;
};

export function useTasks(projectId: string) {
  return useQuery<Task[], Error>({
    queryKey: queryKeys.projects.tasks(projectId),
    queryFn: () => fetchTasks(projectId),
  });
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; projectId: string; data: UpdateTaskData }) => {
      const response = await patch<TaskResponse>(`/api/v1/tasks/${taskId}`, data);
      return response.data.data.task;
    },
    
    onMutate: async ({ taskId, projectId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.tasks(projectId) });
      
      const previousTasks = getQueryData<Task[]>(queryKeys.projects.tasks(projectId));
      
      if (previousTasks) {
        setQueryData<Task[]>(
          queryKeys.projects.tasks(projectId),
          previousTasks.map(task =>
            task.id === taskId ? { ...task, ...data, updatedAt: new Date().toISOString() } : task
          )
        );
      }
      
      return { previousTasks, taskId, projectId };
    },
    
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        setQueryData(queryKeys.projects.tasks(context.projectId), context.previousTasks);
      }
    },
    
    onSettled: (data, error, variables, context) => {
      if (context) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(context.projectId) });
      }
    },
  });
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: CreateTaskData }) => {
      const response = await post<TaskResponse>(`/api/v1/projects/${projectId}/tasks`, data);
      return response.data.data.task;
    },
    
    onSuccess: (newTask, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(variables.projectId) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string; projectId: string }) => {
      await del(`/api/v1/tasks/${taskId}`);
    },
    
    onMutate: async ({ taskId, projectId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.tasks(projectId) });
      
      const previousTasks = getQueryData<Task[]>(queryKeys.projects.tasks(projectId));
      
      if (previousTasks) {
        setQueryData<Task[]>(
          queryKeys.projects.tasks(projectId),
          previousTasks.filter(task => task.id !== taskId)
        );
      }
      
      return { previousTasks, taskId, projectId };
    },
    
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        setQueryData(queryKeys.projects.tasks(context.projectId), context.previousTasks);
      }
    },
    
    onSettled: (data, error, variables, context) => {
      if (context) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(context.projectId) });
      }
    },
  });
}
