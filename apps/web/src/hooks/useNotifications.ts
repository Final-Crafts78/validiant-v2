import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch, del } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useWorkspaceStore } from '@/store/workspace';
import { useAuthStore } from '@/store/auth';

/**
 * Notification Interface
 */
export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: string;
  title: string;
  body: string;
  priority: 'urgent' | 'high' | 'normal';
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  groupKey: string | null;
  isGrouped: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook for fetching user notifications
 */
export const useNotifications = () => {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<Notification[]>({
    queryKey: queryKeys.notifications.list(activeOrgId || ''),
    queryFn: async () => {
      if (!activeOrgId || !accessToken) return [];
      const response = await get<{ data: Notification[] }>('/notifications');
      return response.data.data;
    },
    enabled: !!activeOrgId && !!accessToken,
  });
};

/**
 * Mutation to mark a notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);

  return useMutation({
    mutationFn: (id: string) => patch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      if (activeOrgId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.list(activeOrgId),
        });
      }
    },
  });
};

/**
 * Mutation to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);

  return useMutation({
    mutationFn: () => patch('/notifications/read-all', {}),
    onSuccess: () => {
      if (activeOrgId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.list(activeOrgId),
        });
      }
    },
  });
};

/**
 * Mutation to delete a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);

  return useMutation({
    mutationFn: (id: string) => del(`/notifications/${id}`),
    onSuccess: () => {
      if (activeOrgId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.list(activeOrgId),
        });
      }
    },
  });
};
