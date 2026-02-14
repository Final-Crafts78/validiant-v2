/**
 * useProjectRealtime Hook - PartyKit WebSocket Integration
 * 
 * Real-time collaboration hook using PartyKit WebSockets.
 * 
 * CRITICAL: Uses PartySocket (NOT raw WebSocket)
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Built specifically for PartyKit
 * 
 * REAL-TIME FLOW:
 * 1. Component mounts → Connect to WebSocket
 * 2. Backend updates task → Broadcasts event
 * 3. WebSocket receives event → Invalidates cache
 * 4. React Query refetches → UI updates
 * 5. User sees changes from other users instantly
 * 
 * EVENT HANDLING:
 * - TASK_CREATED: Refetch task list
 * - TASK_UPDATED: Refetch specific task
 * - TASK_STATUS_CHANGED: Optimized status update
 * - TASK_DELETED: Remove from cache
 * - USER_JOINED/LEFT: Update presence
 * 
 * PRESENCE TRACKING:
 * - Shows which users are active in project
 * - Updates in real-time as users join/leave
 * - Useful for collaboration features
 */

import { useEffect, useState } from 'react';
import usePartySocket from 'partysocket/react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { useAuth } from './useAuth';

/**
 * WebSocket Message Types
 */
export enum RealtimeEventType {
  // Task Events
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  
  // Project Events
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  
  // User Presence Events
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  
  // System Events
  PING = 'PING',
  PONG = 'PONG',
}

/**
 * WebSocket Message Interface
 */
export interface RealtimeMessage {
  type: RealtimeEventType | string;
  payload: {
    taskId?: string;
    projectId: string;
    userId?: string;
    userName?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    removed?: boolean;
    [key: string]: any;
  };
  timestamp: number;
}

/**
 * Online User Interface
 */
export interface OnlineUser {
  userId: string;
  userName: string;
  joinedAt: number;
}

/**
 * PartyKit Configuration
 */
const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_URL || 'localhost:1999';
const PARTYKIT_PROTOCOL = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';

/**
 * Get PartyKit WebSocket URL for project
 */
const getPartyKitURL = (projectId: string, userId?: string, userName?: string): string => {
  const baseURL = `${PARTYKIT_PROTOCOL}://${PARTYKIT_HOST}/parties/main/${projectId}`;
  
  // Add user info to connection (for presence tracking)
  if (userId && userName) {
    const params = new URLSearchParams({
      userId,
      userName: encodeURIComponent(userName),
    });
    return `${baseURL}?${params.toString()}`;
  }
  
  return baseURL;
};

/**
 * useProjectRealtime Hook
 * 
 * Connect to PartyKit WebSocket for real-time project updates.
 * 
 * @param projectId - Project ID to connect to
 * @param enabled - Enable/disable WebSocket connection (default: true)
 * 
 * @returns Connection state and online users
 * 
 * @example
 * ```tsx
 * function ProjectBoard({ projectId }: { projectId: string }) {
 *   const { onlineUsers, connectionState } = useProjectRealtime(projectId);
 *   
 *   return (
 *     <div>
 *       <h2>Project Board</h2>
 *       <div>
 *         {connectionState === 'Open' && (
 *           <span>🟋️ Connected</span>
 *         )}
 *         {connectionState === 'Connecting' && (
 *           <span>⏳ Connecting...</span>
 *         )}
 *         {connectionState === 'Closed' && (
 *           <span>❌ Disconnected</span>
 *         )}
 *       </div>
 *       
 *       <div>
 *         <h3>Online Users ({onlineUsers.length})</h3>
 *         {onlineUsers.map(user => (
 *           <div key={user.userId}>{user.userName}</div>
 *         ))}
 *       </div>
 *       
 *       <TaskList projectId={projectId} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useProjectRealtime(projectId: string, enabled = true) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // Get PartyKit WebSocket URL
  const wsURL = getPartyKitURL(
    projectId,
    user?.id,
    user?.fullName
  );

  // 🔌 CRITICAL: Use PartySocket (NOT raw WebSocket)
  // PartySocket provides automatic reconnection with exponential backoff
  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: projectId,
    party: 'main',
    query: user
      ? {
          userId: user.id,
          userName: user.fullName,
        }
      : undefined,
    
    // Handle incoming messages
    onMessage: (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        handleRealtimeMessage(message, queryClient, setOnlineUsers);
      } catch (error) {
        console.error('[Realtime] Failed to parse message:', error);
      }
    },
    
    // Handle connection open
    onOpen: () => {
      console.log('[Realtime] Connected to project:', projectId);
    },
    
    // Handle connection close
    onClose: () => {
      console.log('[Realtime] Disconnected from project:', projectId);
      // Clear online users
      setOnlineUsers([]);
    },
    
    // Handle connection error
    onError: (error) => {
      console.error('[Realtime] WebSocket error:', error);
    },
  });

  // Send PING every 30 seconds to keep connection alive
  useEffect(() => {
    if (!enabled || !socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [socket, enabled]);

  return {
    // WebSocket instance (for advanced usage)
    socket,
    
    // Connection state
    connectionState: socket?.readyState,
    
    // Is connected
    isConnected: socket?.readyState === WebSocket.OPEN,
    
    // Online users in project
    onlineUsers,
  };
}

/**
 * Handle incoming WebSocket messages
 * 
 * Invalidates React Query cache based on event type.
 */
function handleRealtimeMessage(
  message: RealtimeMessage,
  queryClient: ReturnType<typeof useQueryClient>,
  setOnlineUsers: React.Dispatch<React.SetStateAction<OnlineUser[]>>
) {
  const { type, payload } = message;

  console.log('[Realtime] Received event:', type, payload);

  switch (type) {
    // Task Events
    case RealtimeEventType.TASK_CREATED:
    case RealtimeEventType.TASK_UPDATED:
    case RealtimeEventType.TASK_STATUS_CHANGED:
    case RealtimeEventType.TASK_ASSIGNED:
      // Invalidate task-related queries
      if (payload.taskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(payload.taskId) });
      }
      if (payload.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(payload.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(payload.projectId) });
      }
      break;

    case RealtimeEventType.TASK_DELETED:
      // Remove task from cache
      if (payload.taskId) {
        queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(payload.taskId) });
      }
      if (payload.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(payload.projectId) });
      }
      break;

    // Project Events
    case RealtimeEventType.PROJECT_UPDATED:
      if (payload.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(payload.projectId) });
      }
      break;

    case RealtimeEventType.PROJECT_DELETED:
      if (payload.projectId) {
        queryClient.removeQueries({ queryKey: queryKeys.projects.detail(payload.projectId) });
      }
      break;

    // User Presence Events
    case RealtimeEventType.USER_JOINED:
      if (payload.userId && payload.userName) {
        setOnlineUsers((prev) => [
          ...prev.filter((u) => u.userId !== payload.userId),
          {
            userId: payload.userId!,
            userName: payload.userName!,
            joinedAt: message.timestamp,
          },
        ]);
      }
      break;

    case RealtimeEventType.USER_LEFT:
      if (payload.userId) {
        setOnlineUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
      }
      break;

    // System Events
    case RealtimeEventType.PONG:
      // Keep-alive response, no action needed
      break;

    default:
      console.warn('[Realtime] Unknown event type:', type);
  }
}

/**
 * useTaskRealtime Hook
 * 
 * Connect to real-time updates for a specific task.
 * Useful for task detail pages.
 */
export function useTaskRealtime(taskId: string, projectId: string, enabled = true) {
  const queryClient = useQueryClient();
  const { socket } = useProjectRealtime(projectId, enabled);

  // Listen for task-specific updates
  useEffect(() => {
    if (!enabled || !socket) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        
        // Only handle messages for this specific task
        if (message.payload.taskId === taskId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
        }
      } catch (error) {
        console.error('[TaskRealtime] Failed to parse message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, taskId, enabled, queryClient]);

  return {
    socket,
    isConnected: socket?.readyState === WebSocket.OPEN,
  };
}
