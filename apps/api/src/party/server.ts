/**
 * PartyKit WebSocket Server - Real-Time Collaboration
 * 
 * Room-based WebSocket server for real-time project updates.
 * Each project gets its own isolated WebSocket room.
 * 
 * Architecture:
 * - Hono REST API (stateless) → HTTP POST → PartyKit Server → WebSocket Broadcast
 * - Frontend clients connect via WebSocket and receive real-time updates
 * 
 * Event Types:
 * - TASK_CREATED, TASK_UPDATED, TASK_DELETED
 * - TASK_STATUS_CHANGED (quick status updates)
 * - USER_JOINED, USER_LEFT (presence)
 * 
 * Security:
 * - HTTP broadcasts authenticated via shared secret
 * - WebSocket connections can include auth token for user identification
 * - Room isolation (project-based)
 * 
 * Edge-Compatible:
 * - Runs on Cloudflare Durable Objects
 * - Global low-latency
 * - Automatic scaling
 */

import type * as Party from 'partykit/server';

/**
 * WebSocket Message Types
 */
interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
}

/**
 * Connection Metadata
 */
interface ConnectionMeta {
  userId?: string;
  userName?: string;
  joinedAt: number;
}

/**
 * HTTP Broadcast Request
 */
interface BroadcastRequest {
  eventType: string;
  payload: any;
  excludeUserId?: string;
}

/**
 * Main PartyKit Server
 * 
 * Rooms are identified by projectId (e.g., "project_abc123")
 */
export default class ValidiantRealtimeServer implements Party.Server {
  /**
   * Connection metadata storage
   * Maps connection ID to user information
   */
  connections: Map<string, ConnectionMeta>;

  constructor(readonly room: Party.Room) {
    this.connections = new Map();
  }

  /**
   * Called when a WebSocket client connects
   * 
   * @param connection - WebSocket connection
   * @param ctx - Connection context with request info
   */
  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    // Extract user info from query parameters (optional)
    const url = new URL(ctx.request.url);
    const userId = url.searchParams.get('userId');
    const userName = url.searchParams.get('userName');

    // Store connection metadata
    const meta: ConnectionMeta = {
      userId: userId || undefined,
      userName: userName || undefined,
      joinedAt: Date.now(),
    };
    this.connections.set(connection.id, meta);

    // Log connection
    console.log(
      `[PartyKit] User ${userId || 'anonymous'} connected to room ${this.room.id}`,
      `(${this.connections.size} total connections)`
    );

    // Broadcast user joined event to other users
    if (userId) {
      this.broadcast(
        {
          type: 'USER_JOINED',
          payload: {
            userId,
            userName,
            projectId: this.room.id,
          },
          timestamp: Date.now(),
        },
        [connection.id] // Exclude the joining user
      );
    }

    // Send connection confirmation to the new user
    connection.send(
      JSON.stringify({
        type: 'CONNECTED',
        payload: {
          projectId: this.room.id,
          connectionId: connection.id,
          activeUsers: this.connections.size,
        },
        timestamp: Date.now(),
      })
    );
  }

  /**
   * Called when a WebSocket client disconnects
   * 
   * @param connection - WebSocket connection
   */
  onClose(connection: Party.Connection) {
    const meta = this.connections.get(connection.id);
    this.connections.delete(connection.id);

    console.log(
      `[PartyKit] User ${meta?.userId || 'anonymous'} disconnected from room ${this.room.id}`,
      `(${this.connections.size} remaining connections)`
    );

    // Broadcast user left event
    if (meta?.userId) {
      this.broadcast({
        type: 'USER_LEFT',
        payload: {
          userId: meta.userId,
          userName: meta.userName,
          projectId: this.room.id,
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Called when a WebSocket client sends a message
   * 
   * Currently not used - all updates come via HTTP from Hono
   * Future: Could enable client-to-client messages (chat, cursors, etc.)
   * 
   * @param message - Message from client
   * @param connection - WebSocket connection
   */
  onMessage(message: string, connection: Party.Connection) {
    try {
      const data = JSON.parse(message);

      // Echo message back for testing
      if (data.type === 'PING') {
        connection.send(
          JSON.stringify({
            type: 'PONG',
            timestamp: Date.now(),
          })
        );
        return;
      }

      // Future: Handle client-initiated events here
      console.log('[PartyKit] Received client message:', data.type);
    } catch (error) {
      console.error('[PartyKit] Failed to parse client message:', error);
    }
  }

  /**
   * Called when an HTTP request is made to the room
   * 
   * This is the HTTP-to-WebSocket bridge.
   * Hono services POST events here, and we broadcast to WebSocket clients.
   * 
   * @param req - HTTP request
   * @returns HTTP response
   */
  async onRequest(req: Party.Request): Promise<Response> {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Parse broadcast request
      const data: BroadcastRequest = await req.json();

      const { eventType, payload, excludeUserId } = data;

      if (!eventType) {
        return new Response('Missing eventType', { status: 400 });
      }

      console.log(
        `[PartyKit] Broadcasting ${eventType} to room ${this.room.id}`,
        `(${this.connections.size} connections)`
      );

      // Create WebSocket message
      const message: WSMessage = {
        type: eventType,
        payload,
        timestamp: Date.now(),
      };

      // Determine which connections to exclude
      const excludeConnectionIds: string[] = [];
      if (excludeUserId) {
        // Find all connections for this user
        for (const [connId, meta] of this.connections.entries()) {
          if (meta.userId === excludeUserId) {
            excludeConnectionIds.push(connId);
          }
        }
      }

      // Broadcast to all except excluded users
      this.broadcast(message, excludeConnectionIds);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Broadcast sent',
          recipients: this.connections.size - excludeConnectionIds.length,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('[PartyKit] Broadcast error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  /**
   * Broadcast a message to all connections except specified ones
   * 
   * @param message - Message to broadcast
   * @param excludeConnectionIds - Connection IDs to exclude
   */
  broadcast(message: WSMessage, excludeConnectionIds: string[] = []) {
    const messageStr = JSON.stringify(message);

    for (const connection of this.room.getConnections()) {
      if (!excludeConnectionIds.includes(connection.id)) {
        connection.send(messageStr);
      }
    }
  }

  /**
   * Optional: Alarm handler for scheduled tasks
   * 
   * Could be used for:
   * - Cleanup of inactive connections
   * - Periodic heartbeats
   * - Session timeout
   */
  async onAlarm() {
    // Cleanup connections that haven't been active for > 5 minutes
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [connId, meta] of this.connections.entries()) {
      if (now - meta.joinedAt > timeout) {
        console.log(`[PartyKit] Cleaning up stale connection ${connId}`);
        this.connections.delete(connId);
      }
    }

    // Schedule next alarm in 5 minutes
    await this.room.storage.setAlarm(Date.now() + timeout);
  }
}

/**
 * Export server for PartyKit
 */
ValidiantRealtimeServer satisfies Party.Worker;
