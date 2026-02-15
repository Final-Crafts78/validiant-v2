/**
 * Real-Time Broadcast Helper
 * 
 * HTTP-to-WebSocket bridge for triggering real-time updates.
 * 
 * Architecture:
 * 1. Hono service completes database transaction
 * 2. Calls broadcastToProject() with event type and payload
 * 3. Makes HTTP POST to PartyKit room URL
 * 4. PartyKit broadcasts to all connected WebSocket clients
 * 5. Frontend React Query invalidates and refetches data
 * 
 * Non-Blocking:
 * - Broadcast happens asynchronously (fire-and-forget)
 * - API responses are not delayed
 * - Errors are logged but don't affect API responses
 * 
 * Lightweight Payloads:
 * - Only send IDs and minimal data
 * - Frontend fetches full data via React Query
 * - Reduces WebSocket bandwidth
 */

import { env } from '../config/env.config';
import { logger } from './logger';

/**
 * Broadcast Event Types
 */
export enum BroadcastEvent {
  // Task Events
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  
  // Project Events
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  
  // Member Events
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  MEMBER_ROLE_CHANGED = 'MEMBER_ROLE_CHANGED',
  
  // Comment Events (future)
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED',
}

/**
 * Broadcast Payload Interface
 */
interface BroadcastPayload {
  [key: string]: any;
}

/**
 * Get PartyKit URL
 * 
 * Automatically detects development vs production
 */
const getPartyKitURL = (): string => {
  // Development: PartyKit runs on localhost:1999
  if (env.NODE_ENV === 'development') {
    return 'http://localhost:1999';
  }
  
  // Production: Use PartyKit deployment URL
  // TODO: Replace with actual production URL after deployment
  return env.PARTYKIT_URL || 'https://validiant-realtime.partykit.dev';
};

/**
 * Broadcast event to a project room
 * 
 * This is the main function used by Hono services to trigger real-time updates.
 * 
 * @param projectId - Project ID (room identifier)
 * @param eventType - Type of event (TASK_UPDATED, etc.)
 * @param payload - Event payload (keep lightweight - IDs only)
 * @param excludeUserId - Optional user ID to exclude from broadcast
 * 
 * @example
 * ```typescript
 * // After creating a task
 * await broadcastToProject(
 *   task.projectId,
 *   BroadcastEvent.TASK_CREATED,
 *   { taskId: task.id, status: task.status }
 * );
 * ```
 */
export const broadcastToProject = async (
  projectId: string,
  eventType: BroadcastEvent | string,
  payload: BroadcastPayload,
  excludeUserId?: string
): Promise<void> => {
  try {
    const partyKitURL = getPartyKitURL();
    const roomURL = `${partyKitURL}/parties/main/${projectId}`;
    
    // Make HTTP POST to PartyKit room
    // This is non-blocking - we don't await the response
    fetch(roomURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        payload: {
          ...payload,
          projectId, // Always include projectId in payload
        },
        excludeUserId,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          logger.error('PartyKit broadcast failed:', {
            status: response.status,
            projectId,
            eventType,
          });
        } else {
          logger.debug('Broadcast sent:', {
            projectId,
            eventType,
            payload,
          });
        }
      })
      .catch((error) => {
        // Log error but don't throw - broadcast failure should not break API
        logger.error('PartyKit broadcast error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          projectId,
          eventType,
        });
      });
  } catch (error) {
    // Catch any synchronous errors (shouldn't happen)
    logger.error('Broadcast setup error:', error as Error);
  }
};

/**
 * Broadcast to multiple projects
 * 
 * Useful when an action affects multiple projects.
 * 
 * @param projectIds - Array of project IDs
 * @param eventType - Type of event
 * @param payload - Event payload
 */
export const broadcastToProjects = async (
  projectIds: string[],
  eventType: BroadcastEvent | string,
  payload: BroadcastPayload
): Promise<void> => {
  // Broadcast to each project in parallel
  await Promise.all(
    projectIds.map((projectId) =>
      broadcastToProject(projectId, eventType, payload)
    )
  );
};

/**
 * Broadcast task event helper
 * 
 * Convenience function for task-related events.
 * Automatically includes taskId in payload.
 * 
 * @param projectId - Project ID
 * @param taskId - Task ID
 * @param eventType - Event type (defaults to TASK_UPDATED)
 * @param additionalData - Additional payload data
 */
export const broadcastTaskEvent = async (
  projectId: string,
  taskId: string,
  eventType: BroadcastEvent = BroadcastEvent.TASK_UPDATED,
  additionalData?: Record<string, any>
): Promise<void> => {
  await broadcastToProject(projectId, eventType, {
    taskId,
    ...additionalData,
  });
};

/**
 * Broadcast project event helper
 * 
 * Convenience function for project-related events.
 * 
 * @param projectId - Project ID
 * @param eventType - Event type
 * @param additionalData - Additional payload data
 */
export const broadcastProjectEvent = async (
  projectId: string,
  eventType: BroadcastEvent,
  additionalData?: Record<string, any>
): Promise<void> => {
  await broadcastToProject(projectId, eventType, {
    ...additionalData,
  });
};
