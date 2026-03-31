/**
 * Real-Time Broadcast Helper (Durable Objects / SSE Version)
 *
 * Replaces PartyKit with Cloudflare Durable Objects for secure,
 * organization-scoped server-sent events.
 */

import type { DurableObjectNamespace } from '@cloudflare/workers-types';
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

  // Comment Events
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED',
}

/**
 * Broadcast Payload Interface
 */
interface BroadcastPayload {
  [key: string]: unknown;
}

/**
 * Broadcast event to an organization-scoped Durable Object
 *
 * @param orgId - Organization ID
 * @param eventType - Type of event
 * @param payload - Event payload
 */
export const broadcastToOrg = async (
  orgId: string,
  eventType: BroadcastEvent | string,
  payload: BroadcastPayload
): Promise<void> => {
  try {
    // Access global environments attached to the worker from app.ts
    const env = (globalThis as any).__ENV__;

    if (!env || !env.REALTIME_ROOMS) {
      logger.warn(
        '[broadcast] REALTIME_ROOMS binding not available. Skipping broadcast.'
      );
      return;
    }

    const rooms = env.REALTIME_ROOMS as DurableObjectNamespace;
    const id = rooms.idFromName(orgId);
    const room = rooms.get(id);

    // Make an internal fetch call to the DO
    // Cloudflare Workers handle internal DO fetches over a virtual bus.
    // Path: /internal/broadcast (handled in realtime.do.ts)
    // Non-blocking catch-all.
    room
      .fetch('http://realtime/internal/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          payload: {
            ...payload,
            orgId,
          },
        }),
      })
      .then((res) => {
        if (!res.ok) {
          logger.error('[broadcast] DO broadcast failed:', {
            status: res.status,
            orgId,
            eventType,
          });
        }
      })
      .catch((err: any) => {
        logger.error('[broadcast] DO fetch error:', {
          err: err?.message || 'Unknown error',
          orgId,
          eventType,
        });
      });
  } catch (error) {
    logger.error(
      '[broadcast] Setup error:',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * Broadcast task event helper
 *
 * @param orgId - Organization ID
 * @param projectId - Project ID
 * @param taskId - Task ID
 * @param eventType - Event type
 * @param additionalData - Additional payload
 */
export const broadcastTaskEvent = async (
  orgId: string,
  projectId: string,
  taskId: string,
  eventType: BroadcastEvent = BroadcastEvent.TASK_UPDATED,
  additionalData?: Record<string, unknown>
): Promise<void> => {
  await broadcastToOrg(orgId, eventType, {
    projectId,
    taskId,
    ...additionalData,
  });
};

/**
 * Backward compatibility: Broadcast to project
 * Note: Since Phase 25, architecture is Org-scoped.
 * This now requires orgId or it will log a warning.
 */
export const broadcastToProject = async (
  projectId: string,
  eventType: BroadcastEvent | string,
  payload: BroadcastPayload,
  orgId?: string
): Promise<void> => {
  if (!orgId) {
    logger.warn(
      '[broadcast] broadcastToProject called without orgId. SSE requires orgId.'
    );
    return;
  }
  await broadcastToOrg(orgId, eventType, {
    ...payload,
    projectId,
  });
};
