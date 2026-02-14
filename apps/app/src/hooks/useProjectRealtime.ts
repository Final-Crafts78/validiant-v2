/**
 * Mobile Real-Time Hook - PartyKit WebSocket
 * 
 * Identical pattern to web app for cross-platform consistency.
 */

import { useEffect, useState } from 'react';
import usePartySocket from 'partysocket/react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-client';
import Constants from 'expo-constants';

export enum RealtimeEventType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  PING = 'PING',
  PONG = 'PONG',
}

export interface RealtimeMessage {
  type: RealtimeEventType | string;
  payload: {
    taskId?: string;
    projectId: string;
    userId?: string;
    userName?: string;
    [key: string]: any;
  };
  timestamp: number;
}

export interface OnlineUser {
  userId: string;
  userName: string;
  joinedAt: number;
}

const PARTYKIT_HOST = Constants.expoConfig?.extra?.partyKitUrl || 'localhost:1999';

export function useProjectRealtime(projectId: string, userId?: string, userName?: string, enabled = true) {
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: projectId,
    party: 'main',
    query: userId && userName ? { userId, userName } : undefined,
    
    onMessage: (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        handleRealtimeMessage(message, queryClient, setOnlineUsers);
      } catch (error) {
        console.error('[Realtime] Failed to parse message:', error);
      }
    },
    
    onOpen: () => {
      console.log('[Realtime] Connected to project:', projectId);
    },
    
    onClose: () => {
      console.log('[Realtime] Disconnected from project:', projectId);
      setOnlineUsers([]);
    },
    
    onError: (error) => {
      console.error('[Realtime] WebSocket error:', error);
    },
  });

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
    socket,
    connectionState: socket?.readyState,
    isConnected: socket?.readyState === WebSocket.OPEN,
    onlineUsers,
  };
}

function handleRealtimeMessage(
  message: RealtimeMessage,
  queryClient: ReturnType<typeof useQueryClient>,
  setOnlineUsers: React.Dispatch<React.SetStateAction<OnlineUser[]>>
) {
  const { type, payload } = message;

  switch (type) {
    case RealtimeEventType.TASK_CREATED:
    case RealtimeEventType.TASK_UPDATED:
    case RealtimeEventType.TASK_STATUS_CHANGED:
      if (payload.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(payload.projectId) });
      }
      break;

    case RealtimeEventType.TASK_DELETED:
      if (payload.taskId) {
        queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(payload.taskId) });
      }
      if (payload.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(payload.projectId) });
      }
      break;

    case RealtimeEventType.USER_JOINED:
      if (payload.userId && payload.userName) {
        setOnlineUsers((prev) => [
          ...prev.filter((u) => u.userId !== payload.userId),
          { userId: payload.userId!, userName: payload.userName!, joinedAt: message.timestamp },
        ]);
      }
      break;

    case RealtimeEventType.USER_LEFT:
      if (payload.userId) {
        setOnlineUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
      }
      break;

    case RealtimeEventType.PONG:
      break;

    default:
      console.warn('[Realtime] Unknown event type:', type);
  }
}
