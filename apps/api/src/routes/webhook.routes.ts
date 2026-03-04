/**
 * Webhook Routes (Phase 15 + Phase 17)
 *
 * Handles incoming webhooks from external services (Didit KYC).
 * Verifies HMAC signatures for security.
 */

import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { logActivity } from '../utils/activity';

interface WebhookEnv extends Record<string, unknown> {
  DIDIT_WEBHOOK_SECRET: string;
}

const webhookRoutes = new Hono();

/**
 * Verify HMAC-SHA256 signature for incoming webhooks.
 */
async function verifyHmacSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSig = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(body)
    );

    const expectedHex = Array.from(new Uint8Array(expectedSig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedHex;
  } catch {
    return false;
  }
}

/**
 * POST /api/v1/webhooks/didit
 * Handles KYC verification result callbacks from Didit.
 */
webhookRoutes.post('/didit', async (c) => {
  try {
    const envVars = env<WebhookEnv>(c);
    const body = await c.req.text();
    const signature = c.req.header('x-didit-signature') || '';

    if (envVars.DIDIT_WEBHOOK_SECRET) {
      const isValid = await verifyHmacSignature(
        body,
        signature,
        envVars.DIDIT_WEBHOOK_SECRET
      );
      if (!isValid) {
        return c.json({ success: false, error: 'Invalid signature' }, 403);
      }
    }

    const payload = JSON.parse(body) as {
      session_id: string;
      status: string;
      task_id?: string;
    };

    // If the verification passed and a task_id is attached, update the task
    if (payload.status === 'approved' && payload.task_id) {
      await db
        .update(schema.tasks)
        .set({
          status: 'Verified',
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.tasks.id, payload.task_id));

      await logActivity({
        userId: 'system',
        action: 'KYC_VERIFIED',
        entityId: payload.task_id,
        entityType: 'task',
        newValue: { diditSessionId: payload.session_id },
      });
    }

    return c.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ success: false, error: 'Webhook processing failed' }, 500);
  }
});

export default webhookRoutes;
