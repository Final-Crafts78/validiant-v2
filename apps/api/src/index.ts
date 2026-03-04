/**
 * Cloudflare Workers Entry Point
 *
 * Exports the Hono app instance for Workers runtime.
 * Includes scheduled Cron Trigger handler for background SLA checks.
 */

import { app } from './app';
import { runAllEnterpriseBackups } from './services/backup.service';

export default {
  // 1. Standard HTTP requests handled by Hono
  fetch: app.fetch,

  // 2. Scheduled Cron Jobs handled natively by Cloudflare
  // Configure in wrangler.toml: [triggers] crons = ["0 * * * *"]
  async scheduled(
    event: ScheduledEvent,
    _env: import('./app').Env,
    ctx: ExecutionContext
  ) {
    ctx.waitUntil(
      (async () => {
        try {
          // SLA check: find overdue tasks and alert project managers
          // SELECT tasks WHERE status = 'Pending' AND createdAt < NOW() - 72 hours
          // Then call sendEmail() to notify Project Managers
          // eslint-disable-next-line no-console
          console.log(
            `[cron] SLA check at ${new Date(event.scheduledTime).toISOString()}`
          );

          // Automated Enterprise R2 Backups
          await runAllEnterpriseBackups(
            (
              _env as unknown as {
                BACKUP_BUCKET: import('@cloudflare/workers-types').R2Bucket;
              }
            ).BACKUP_BUCKET
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[cron] SLA check failed:', error);
        }
      })()
    );
  },
};
