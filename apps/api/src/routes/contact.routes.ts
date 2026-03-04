/**
 * Contact Routes
 *
 * Public contact form endpoint using Resend HTTP API.
 * No authentication required.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sendEmail } from '../services/email.service';
import { env } from 'hono/adapter';

interface ContactEnv extends Record<string, unknown> {
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL?: string;
}

const contactRoutes = new Hono();

// Public route — No auth required
contactRoutes.post(
  '/',
  zValidator(
    'json',
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      message: z.string().min(10),
    })
  ),
  async (c) => {
    try {
      const { name, email: senderEmail, message } = c.req.valid('json');
      const envVars = env<ContactEnv>(c);

      const success = await sendEmail(
        envVars,
        'support@validiant.com',
        `New Contact from ${name}`,
        `<p><strong>Name:</strong> ${name}</p>
         <p><strong>Email:</strong> ${senderEmail}</p>
         <p><strong>Message:</strong></p>
         <p>${message}</p>`
      );

      if (!success) {
        return c.json({ success: false, error: 'Failed to send message' }, 500);
      }

      return c.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      console.error('Contact error:', error);
      return c.json(
        { success: false, error: 'Failed to process contact form' },
        500
      );
    }
  }
);

export default contactRoutes;
