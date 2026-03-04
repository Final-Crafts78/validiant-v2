/**
 * Backup Controller (Phase 21)
 *
 * Allows organization admins to trigger backups and list existing backups
 * stored in the R2 bucket.
 */

import { Context } from 'hono';
import type { UserContext } from '../middleware/auth';
import type { R2Bucket } from '@cloudflare/workers-types';
import { generateOrganizationBackup } from '../services/backup.service';

/**
 * POST /api/v1/backups/trigger
 * Manually trigger a backup for the current user's organization.
 */
export const triggerBackup = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const env = c.env as { BACKUP_BUCKET?: R2Bucket };
    const bucket = env.BACKUP_BUCKET;

    if (!bucket) {
      return c.json(
        { success: false, error: 'R2 Backup Bucket is not configured' },
        501
      );
    }

    if (!user.organizationId) {
      return c.json(
        { success: false, error: 'User does not belong to an organization' },
        400
      );
    }

    // Await generating the backup
    const result = await generateOrganizationBackup(
      user.organizationId,
      bucket
    );

    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    console.error('Trigger backup error:', error);
    return c.json({ success: false, error: 'Failed to generate backup' }, 500);
  }
};

/**
 * GET /api/v1/backups
 * List all generated backups for the user's organization.
 */
export const listBackups = async (c: Context) => {
  try {
    const user = c.get('user') as UserContext;
    const env = c.env as { BACKUP_BUCKET?: R2Bucket };
    const bucket = env.BACKUP_BUCKET;

    if (!bucket) {
      return c.json(
        { success: false, error: 'R2 Backup Bucket is not configured' },
        501
      );
    }

    if (!user.organizationId) {
      return c.json(
        { success: false, error: 'User does not belong to an organization' },
        400
      );
    }

    // List objects in R2 prefixed by the organizationId
    const listed = await bucket.list({ prefix: `${user.organizationId}/` });

    const backups = listed.objects.map(
      (obj: {
        key: string;
        size: number;
        uploaded: string | Date;
        customMetadata?: Record<string, string>;
      }) => ({
        key: obj.key,
        size: obj.size,
        uploadedAt: obj.uploaded,
        metadata: obj.customMetadata,
      })
    );

    // Sort newest first
    backups.sort(
      (a: { uploadedAt: string | Date }, b: { uploadedAt: string | Date }) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return c.json({ success: true, data: backups });
  } catch (error) {
    console.error('List backups error:', error);
    return c.json({ success: false, error: 'Failed to list backups' }, 500);
  }
};
