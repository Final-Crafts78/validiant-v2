import { DurableObject } from 'cloudflare:workers';

/**
 * RealtimeRoom Durable Object
 *
 * Maintains organization-specific SSE connections and handles broadcasting.
 * One instance per organization ID.
 */
export class RealtimeRoom extends DurableObject<import('../app').Env> {
  private sessions = new Map<string, ReadableStreamDefaultController>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

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
      return this.handleSSE(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle Durable Object Alarms
   */
  async alarm() {
    // eslint-disable-next-line no-console
    console.warn('[Realtime:DO] ALARM_TRIGGER', {
      timestamp: new Date().toISOString(),
      activeSessions: this.sessions.size,
    });
  }

  /**
   * Establish SSE connection and pipe stream to client
   */
  private handleSSE(request: Request): Response {
    const encoder = new TextEncoder();
    const sessionId = crypto.randomUUID().substring(0, 8);
    const sessionStartTime = Date.now();

    const stream = new ReadableStream({
      start: (controller) => {
        this.sessions.set(sessionId, controller);

        // eslint-disable-next-line no-console
        console.info('[Realtime:DO] Session ESTABLISHED', {
          sessionId,
          activeSessions: this.sessions.size,
          timestamp: new Date().toISOString(),
          // 🔍 PROXY-AWARE: Capture metadata to track edge drops
          ray: request.headers.get('cf-ray') || 'NONE',
          country: request.headers.get('cf-ipcountry') || 'UNKNOWN',
          ua: request.headers.get('user-agent')?.substring(0, 50) || 'NONE',
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
        this.sessions.delete(sessionId);

        const sessionDuration = (
          (Date.now() - sessionStartTime) /
          1000
        ).toFixed(2);

        // eslint-disable-next-line no-console
        console.warn('[Realtime:DO] Session TERMINATED', {
          sessionId,
          duration: `${sessionDuration}s`,
          reason: reason || 'CLIENT_OR_NETWORK_DISCONNECT',
          activeSessions: this.sessions.size,
          timestamp: new Date().toISOString(),
          // ELITE: Identify if disconnect happened at specific timeout thresholds (e.g. 150s)
          isTimeoutLikely:
            Number(sessionDuration) > 145 && Number(sessionDuration) < 165,
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
      if (this.sessions.size === 0 && this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
        return;
      }

      const now = Date.now();
      const drift = now - (this.lastHeartbeatAt || now) - 8000;
      this.lastHeartbeatAt = now;

      // eslint-disable-next-line no-console
      console.debug(
        `[Realtime:DO] Sending HEARTBEAT to ${this.sessions.size} sessions`,
        { drift: `${drift}ms`, timestamp: new Date().toISOString() }
      );

      for (const [sid, session] of this.sessions.entries()) {
        try {
          session.enqueue(heartbeat);
        } catch (err: unknown) {
          // eslint-disable-next-line no-console
          console.error('[Realtime:DO] HEARTBEAT_DISCONNECT', {
            sessionId: sid,
            error:
              err instanceof Error ? err.stack || err.message : String(err),
            timestamp: new Date().toISOString(),
          });
          this.sessions.delete(sid);
        }
      }
    }, 8000); // 8 seconds - More aggressive for strict Edge Proxies (Issue #20)
  }

  private lastHeartbeatAt: number = 0;

  /**
   * Broadcast message to all connected sessions
   */
  private broadcast(data: unknown): void {
    const encoder = new TextEncoder();
    const message = `event: message\ndata: ${JSON.stringify(data)}\n\n`;
    const encoded = encoder.encode(message);

    for (const [sid, session] of this.sessions.entries()) {
      try {
        session.enqueue(encoded);
      } catch (err: unknown) {
        // Session closed or error - cleanup
        // eslint-disable-next-line no-console
        console.error('[Realtime:DO] BROADCAST_DISCONNECT', {
          sessionId: sid,
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        });
        this.sessions.delete(sid);
      }
    }
  }
}
