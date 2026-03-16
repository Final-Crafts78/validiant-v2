/**
 * KYC Routes (Phase 17)
 *
 * Managers can trigger KYC verification for candidates.
 * Creates a Didit session and sends the verification link via email.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { env } from 'hono/adapter';
import { createDiditSession } from '../services/didit.service';
import { sendEmail } from '../services/email.service';

// Inline schema to avoid build-order dependency on @validiant/shared
const kycRequestSchema = z.object({
  taskId: z.string().uuid(),
  candidateEmail: z.string().email(),
  candidateName: z.string().min(2),
});

interface KycEnv extends Record<string, unknown> {
  DIDIT_API_KEY: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL?: string;
}

const kycRoutes = new Hono();

/**
 * POST /api/v1/kyc/request
 * Manager triggers a KYC verification for a candidate.
 */
kycRoutes.post('/request', zValidator('json', kycRequestSchema), async (c) => {
  try {
    const { taskId, candidateEmail, candidateName } = c.req.valid('json');
    const envVars = env<KycEnv>(c);

    // Create Didit verification session
    const session = await createDiditSession(
      { DIDIT_API_KEY: envVars.DIDIT_API_KEY as string },
      candidateName,
      candidateEmail,
      taskId
    );

    if (!session) {
      return c.json(
        { success: false, error: 'Failed to create KYC session' },
        502
      );
    }

    // Email the candidate with the verification link
    await sendEmail(
      {
        RESEND_API_KEY: envVars.RESEND_API_KEY as string,
        RESEND_FROM_EMAIL: envVars.RESEND_FROM_EMAIL as string,
      },
      candidateEmail,
      'Validiant - Identity Verification Required',
      `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #1e293b;">Identity Verification Request</h2>
          <p style="color: #475569;">
            Hi ${candidateName},<br/><br/>
            You have been requested to complete an identity verification for Validiant.
            Please click the button below to start the process.
          </p>
          <a href="${session.url}"
             style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
            Start Verification
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px;">
            If the button doesn't work, paste this URL in your browser:<br/>
            <span style="color:#64748b;">${session.url}</span>
          </p>
        </div>`
    );

    return c.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        message: `Verification link sent to ${candidateEmail}`,
      },
    });
  } catch (error) {
    console.error('KYC request error:', error);
    return c.json({ success: false, error: 'KYC request failed' }, 500);
  }
});

export default kycRoutes;
