/**
 * useRealtime Hook - Server-Sent Events (SSE) Integration
 *
 * Real-time updates using Cloudflare Durable Objects and SSE.
 * Replaces the old PartyKit WebSocket implementation.
 *
 * ARCHITECTURE:
 * 1. Hook opens a persistent GET connection to /api/v1/realtime/stream
 * 2. Backend (Durable Object) keeps the connection open
 * 3. On any data change, Backend sends an SSE message
 * 4. Hook receives the message and invalidates the TanStack Query cache
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useWorkspaceStore } from '@/store/workspace';
import { useAuthStore } from '@/store/auth';

/**
 * Event Types from Backend
 */
export enum RealtimeEvent {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  MEMBER_ROLE_CHANGED = 'MEMBER_ROLE_CHANGED',
  NOTIFICATION_CREATED = 'NOTIFICATION_CREATED',
}

interface RealtimeMessage {
  eventType: RealtimeEvent | string;
  payload: {
    taskId?: string;
    projectId?: string;
    orgId?: string;
    [key: string]: any;
  };
}

/**
 * useRealtime Hook
 *
 * Subscribes to the organization's real-time event stream.
 * Automatically reconnects on organization change or connection drop.
 */
export function useRealtime() {
  const queryClient = useQueryClient();
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const userId = useAuthStore((s) => s.user?.id);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Guards: Don't connect if not in an org or not authenticated
    if (!activeOrgId || !userId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Read token from auth store
    const accessToken = useAuthStore.getState().accessToken;

    if (!accessToken) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      console.log('[Realtime] Closing stale connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // ELITE: Connection Debouncing
    // Prevents "Canceled" logs when hooks remount rapidly during state transitions
    const connectionTimeout = setTimeout(() => {
      // Create new EventSource connection
      const rawApiBase =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      // Normalize: Remove trailing slash -> Remove /api/v1 -> Re-add /api/v1
      // This prevents double /api/v1 if the env var has a trailing slash.
      const apiBase = rawApiBase.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
      const sseUrl = `${apiBase}/api/v1/realtime/stream?token=${accessToken}&orgId=${activeOrgId}`;

      console.debug('[Realtime] CONNECTION START', {
        activeOrgId,
        userId,
        sseUrl: sseUrl.replace(/token=[^&]+/, 'token=REDACTED'),
        apiBase,
        rawApiBase,
        timestamp: new Date().toISOString(),
        windowLocation: typeof window !== 'undefined' ? window.location.href : 'NONE',
        origin: typeof window !== 'undefined' ? window.location.origin : 'NONE',
      });

      const es = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = es;

      // Handle connection state transitions
      es.onopen = () => {
        console.log('[Realtime] SSE Connection OPEN', {
          url: es.url.replace(/token=[^&]+/, 'token=REDACTED'),
          timestamp: new Date().toISOString(),
        });
      };

      // Handle incoming messages
      es.onmessage = (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          handleMessage(data, queryClient, userId);
        } catch (error) {
          console.error('[Realtime] Failed to parse SSE message:', error);
        }
      };

      es.onerror = (error) => {
        console.error('[Realtime] SSE Error Detail', {
          readyState: es.readyState,
          url: es.url.replace(/token=[^&]+/, 'token=REDACTED'),
          error,
          // Capture as much from the error event as possible
          eventPhase: (error as any).eventPhase,
          type: error.type,
          timestamp: new Date().toISOString(),
        });
      };

      es.addEventListener('connected', (_e: any) => {
        console.log('[Realtime] SSE Connected');
      });
    }, 500);

    return () => {
      clearTimeout(connectionTimeout);
      if (eventSourceRef.current) {
        console.log('[Realtime] Cleaning up SSE connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [activeOrgId, userId, queryClient]); // Removed token from deps to avoid refresh-loops; it's read inside
}

/**
 * Handle Realtime Messages
 *
 * Surgically invalidates the TanStack Query cache.
 */
function handleMessage(
  message: RealtimeMessage,
  queryClient: any,
  userId?: string
) {
  const { eventType, payload } = message;

  console.log('[Realtime] Event Received:', eventType, payload);

  switch (eventType) {
    case RealtimeEvent.TASK_CREATED:
    case RealtimeEvent.TASK_UPDATED:
    case RealtimeEvent.TASK_STATUS_CHANGED:
    case RealtimeEvent.TASK_ASSIGNED:
      if (payload.taskId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.detail(payload.taskId),
        });
      }
      if (payload.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.tasks(payload.projectId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.byProject(payload.projectId),
        });
      }
      break;

    case RealtimeEvent.TASK_DELETED:
      if (payload.taskId) {
        queryClient.removeQueries({
          queryKey: queryKeys.tasks.detail(payload.taskId),
        });
      }
      if (payload.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.tasks(payload.projectId),
        });
      }
      break;

    case RealtimeEvent.PROJECT_UPDATED:
      if (payload.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(payload.projectId),
        });
      }
      break;

    case RealtimeEvent.PROJECT_DELETED:
      if (payload.projectId) {
        queryClient.removeQueries({
          queryKey: queryKeys.projects.detail(payload.projectId),
        });
      }
      break;

    case RealtimeEvent.MEMBER_ADDED:
    case RealtimeEvent.MEMBER_REMOVED:
    case RealtimeEvent.MEMBER_ROLE_CHANGED:
      if (payload.orgId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizations.members(payload.orgId),
        });
      }
      break;

    case RealtimeEvent.NOTIFICATION_CREATED:
      // Only process if it's for this user
      if (payload.userId === userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all,
        });

        // Sensory Rule 1: Sound Chime
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.play().catch(() => {
            /* Autoplay blocked */
          });
        } catch (e) {
          /* Audio not supported */
        }

        // Sensory Rule 2: Document Title Flash
        const originalTitle = document.title;
        let isFlash = false;
        const flashInterval = setInterval(() => {
          document.title = isFlash ? originalTitle : `🔴 (1) ${originalTitle}`;
          isFlash = !isFlash;
        }, 1000);

        // Stop flashing after 10 seconds or on focus
        const stopFlash = () => {
          clearInterval(flashInterval);
          document.title = originalTitle;
          window.removeEventListener('focus', stopFlash);
        };
        window.addEventListener('focus', stopFlash);
        setTimeout(stopFlash, 10000);

        // Sensory Rule 3: Browser API Notification
        if (
          'Notification' in window &&
          Notification.permission === 'granted' &&
          payload.priority === 'urgent'
        ) {
          new Notification(payload.title || 'Urgent Alert', {
            body: payload.body,
            icon: '/favicon.ico',
          });
        }
      }
      break;

    default:
      // Generic invalidation for unknown events that might affect lists
      if (payload.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.tasks(payload.projectId),
        });
      }
  }
}
