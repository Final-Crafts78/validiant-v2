import { DurableObject } from 'cloudflare:workers';

/**
 * RealtimeRoom Durable Object
 *
 * Maintains organization-specific SSE connections and handles broadcasting.
 * One instance per organization ID.
 */
export class RealtimeRoom extends DurableObject {
  private sessions = new Set<ReadableStreamDefaultController>();

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

    const stream = new ReadableStream({
      start: (controller) => {
        this.sessions.add(controller);

        // Send initial heartbeat/keep-alive
        controller.enqueue(encoder.encode('retry: 10000\n\n'));
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`
          )
        );
      },
      cancel: (controller) => {
        this.sessions.delete(
          controller as unknown as ReadableStreamDefaultController
        );
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
