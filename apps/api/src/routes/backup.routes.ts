/**
 * Backup Routes (Phase 21)
 *
 * R2 Backup endpoints inside api.
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import * as backupController from '../controllers/backup.controller';

const backupRoutes = new Hono();

backupRoutes.use('*', authenticate);

// GET /api/v1/backups — List backups available
backupRoutes.get('/', backupController.listBackups);

// POST /api/v1/backups/trigger — Trigger immediate backup
backupRoutes.post('/trigger', backupController.triggerBackup);

export default backupRoutes;
