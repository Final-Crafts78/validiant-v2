/**
 * Inbound BGV Routes
 *
 * Dedicated endpoint for partners to push cases.
 * Secured by HMAC-SHA256 and Rate Limiting.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { inboundCasePushSchema } from '@validiant/shared';
import * as inboundService from '../services/inbound.service';
import { db } from '../db';
import { bgvPartners } from '../db/schema';
import { eq } from 'drizzle-orm';
import { verifyHmac, decryptSecrets } from '../utils/encryption';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import { rateLimit } from '../middleware/rateLimit';
import { ApiError } from '../utils/errors';

const app = new Hono();

/**
 * POST /api/v1/inbound/:partnerKey/cases
 *
 * Inbound Case Pipeline (Mini-Phase 14)
 */
app.post(
  '/:partnerKey/cases',
  // Per-partner rate limiting
  async (c, next) => {
    const partnerKey = c.req.param('partnerKey');
    // Using a dynamic rate limit based on partnerKey
    return rateLimit(100, 60, `rl:inbound:${partnerKey}`)(c, next);
  },
  zValidator('json', inboundCasePushSchema),
  async (c) => {
    const partnerKey = c.req.param('partnerKey');
    const signature = c.req.header('X-Signature');
    const rawBody = await c.req.text();
    const data = JSON.parse(rawBody);

    if (!signature) {
      return c.json(
        {
          success: false,
          error: 'MISSING_SIGNATURE',
          message: 'X-Signature header is required',
        },
        401
      );
    }

    // 1. Resolve Partner
    const [partner] = await db
      .select()
      .from(bgvPartners)
      .where(eq(bgvPartners.partnerKey, partnerKey))
      .limit(1);

    if (!partner || !partner.isActive) {
      return c.json(
        {
          success: false,
          error: 'PARTNER_NOT_FOUND',
          message: 'Invalid or inactive partner key',
        },
        404
      );
    }

    // 2. IP Allowlist Check
    const clientIp =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      'unknown';
    if (partner.allowedIps && partner.allowedIps.length > 0) {
      if (!partner.allowedIps.includes(clientIp)) {
        logger.warn('Inbound access denied: IP not allowed', {
          partnerKey,
          clientIp,
        });
        return c.json(
          {
            success: false,
            error: 'IP_NOT_ALLOWED',
            message: 'Access denied from this IP',
          },
          403
        );
      }
    }

    // 3. Verify Signature
    try {
      if (!partner.webhookSigningSecret) {
        return c.json(
          {
            success: false,
            error: 'MISCONFIGURED_PARTNER',
            message: 'Partner has no signing secret configured',
          },
          500
        );
      }

      const signingSecret = await decryptSecrets(
        partner.webhookSigningSecret,
        env.ENCRYPTION_SECRET
      );
      const isValid = await verifyHmac(rawBody, signature, signingSecret);

      if (!isValid) {
        logger.warn('Inbound access denied: Invalid signature', { partnerKey });
        return c.json(
          {
            success: false,
            error: 'INVALID_SIGNATURE',
            message: 'HMAC signature verification failed',
          },
          401
        );
      }
    } catch (error) {
      logger.error('Signature verification error', { error, partnerKey });
      return c.json(
        {
          success: false,
          error: 'VERIFICATION_ERROR',
          message: 'Failed to verify signature',
        },
        500
      );
    }

    // 4. Process Case
    try {
      const task = await inboundService.processInboundCase(
        partnerKey,
        data,
        partner
      );

      return c.json(
        {
          success: true,
          message: 'Case received and created successfully',
          data: {
            taskId: task.id,
            caseId: task.caseId,
          },
        },
        201
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const name = error instanceof Error ? error.name : 'Error';

      if (name === 'ConflictError') {
        const details = (error as ApiError).details;
        return c.json(
          {
            success: false,
            error: 'DUPLICATE_CASE',
            message: message,
            taskId: details?.taskId,
          },
          409
        );
      }
      if (name === 'NotFoundError') {
        return c.json({ success: false, error: 'NOT_FOUND', message }, 404);
      }

      logger.error('Inbound case processing failed', { error, partnerKey });
      return c.json(
        {
          success: false,
          error: 'PROCESSING_FAILED',
          message: message || 'Internal error',
        },
        500
      );
    }
  }
);

export default app;
