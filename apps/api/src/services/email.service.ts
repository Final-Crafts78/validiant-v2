/**
 * Email Service (Edge-Native)
 *
 * Uses the Resend HTTP API via standard fetch().
 * Compatible with Cloudflare Workers (NO nodemailer).
 */

interface EmailEnv {
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL?: string;
}

/**
 * Send an email using the Resend HTTP API.
 * Returns true on success, false on failure.
 */
export async function sendEmail(
  env: EmailEnv,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    if (!env.RESEND_API_KEY) {
      console.error('[email] RESEND_API_KEY is not configured');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL || 'Validiant <noreply@validiant.com>',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[email] Resend Error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Send failed:', err);
    return false;
  }
}
