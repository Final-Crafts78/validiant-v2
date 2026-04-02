import { DurableObject } from 'cloudflare:workers';

/**
 * RealtimeRoom Durable Object
 *
 * Maintains organization-specific SSE connections and handles broadcasting.
 * One instance per organization ID.
 */
export class RealtimeRoom extends DurableObject<import('../app').Env> {
  private sessions = new Set<ReadableStreamDefaultController>();
  private heartbeatInterval: any = null;

  constructor(state: DurableObjectState, env: import('../app').Env) {
    super(state, env);
  }

  /**
   * Main fetch handler for the DO
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 1. Internal handle for broadcasts
    if (url.pathname === '/internal/broadcast') {
      const data = await request.json();
      this.broadcast(data);
      return new Response('OK');
    }

    // 2. Handle SSE connection request
    if (url.pathname === '/stream') {
      return this.handleSSE();
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Establish SSE connection and pipe stream to client
   */
  private handleSSE(): Response {
    const encoder = new TextEncoder();
    let currentController: ReadableStreamDefaultController | null = null;
    const sessionId = crypto.randomUUID().substring(0, 8);

    const stream = new ReadableStream({
      start: (controller) => {
        currentController = controller;
        this.sessions.add(controller);

        // eslint-disable-next-line no-console
        console.info('[Realtime:DO] Session ADDED', {
          sessionId,
          activeSessions: this.sessions.size,
          timestamp: new Date().toISOString(),
        });

        // Start heartbeat if not running
        this.ensureHeartbeat();

        // Send initial heartbeat/keep-alive
        controller.enqueue(encoder.encode('retry: 10000\n\n'));
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({
              sessionId,
              timestamp: Date.now(),
            })}\n\n`
          )
        );
      },
      cancel: (reason) => {
        if (currentController) {
          this.sessions.delete(currentController);
        }
        // eslint-disable-next-line no-console
        console.info('[Realtime:DO] Session REMOVED', {
          sessionId,
          reason: reason || 'CLIENT_DISCONNECT',
          activeSessions: this.sessions.size,
          timestamp: new Date().toISOString(),
        });

        if (this.sessions.size === 0 && this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  /**
   * Ensure heartbeat interval is running
   */
  private ensureHeartbeat() {
    if (this.heartbeatInterval) return;

    const encoder = new TextEncoder();
    const heartbeat = encoder.encode(': heartbeat\n\n');

    this.heartbeatInterval = setInterval(() => {
      if (this.sessions.size === 0) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
        return;
      }

      // eslint-disable-next-line no-console
      console.debug(
        `[Realtime:DO] Sending HEARTBEAT to ${this.sessions.size} sessions`
      );

      for (const session of this.sessions) {
        try {
          session.enqueue(heartbeat);
        } catch {
          this.sessions.delete(session);
        }
      }
    }, 20000); // 20 seconds
  }

  /**
   * Broadcast message to all connected sessions
   */
  private broadcast(data: unknown): void {
    const encoder = new TextEncoder();
    const message = `event: message\ndata: ${JSON.stringify(data)}\n\n`;
    const encoded = encoder.encode(message);

    for (const session of this.sessions) {
      try {
        session.enqueue(encoded);
      } catch {
        // Session closed or error - cleanup
        this.sessions.delete(session);
      }
    }
  }
}
