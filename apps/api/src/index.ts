/**
 * Cloudflare Workers Entry Point
 *
 * Exports the Hono app instance for Workers runtime.
 * Includes scheduled Cron Trigger handler for background SLA checks.
 */

import { app } from './app';
import { runAllEnterpriseBackups } from './services/backup.service';
import { checkSLAs } from './workers/sla-monitor';
import { rollupAnalytics } from './workers/analytics-rollup';
import { purgeAuditLogs } from './workers/audit-retention';
import { RealtimeRoom } from './durable-objects/realtime.do';

// Export Durable Objects for Cloudflare Workers runtime
export { RealtimeRoom };

export default {
  // 1. Standard HTTP requests handled by Hono
  fetch: app.fetch,

  // 2. Cloudflare Queues Consumer (Phase 13.5)
  async queue(batch: MessageBatch<any>, env: any, ctx: ExecutionContext) {
    const { processWebhookQueue } = require('./services/webhook.service');
    // Supply env statically if needed inside db layer
    (globalThis as any).__ENV__ = env;
    ctx.waitUntil(processWebhookQueue(batch));
  },

  // 2. Scheduled Cron Jobs handled natively by Cloudflare
  // Configure in wrangler.toml under [triggers] crons
  async scheduled(
    event: ScheduledEvent,
    _env: import('./app').Env,
    ctx: ExecutionContext
  ) {
    ctx.waitUntil(
      (async () => {
        try {
          // Initialize global env for DB access within workers
          (globalThis as any).__ENV__ = _env;

          console.log(
            `[cron] Running background jobs at ${new Date(event.scheduledTime).toISOString()}`
          );

          // 1. SLA Monitoring (Mini-Phase 26)
          await checkSLAs();

          // 2. Automated Enterprise R2 Backups (Mini-Phase 24)
          if (_env.BACKUP_BUCKET) {
            await runAllEnterpriseBackups(_env.BACKUP_BUCKET);
          }

          // 3. Analytics Rollup (Mini-Phase 27)
          await rollupAnalytics();

          // 4. Audit Retention (Mini-Phase 28)
          await purgeAuditLogs();
        } catch (error) {
          console.error('[cron] Background job failed:', error);
        }
      })()
    );
  },
};
