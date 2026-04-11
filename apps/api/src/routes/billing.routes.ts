import { Hono } from 'hono';
import * as billingService from '../services/billing.service';
import { logger } from '../utils/logger';

const app = new Hono();

/**
 * Billing Routes - Phase 6 Monetization
 * Handles Stripe Checkout and Webhooks
 */

app.post('/checkout', async (c) => {
  try {
    const { orgId, plan, successUrl, cancelUrl } = await c.req.json();

    if (!orgId || !plan) {
      return c.json({ error: 'Missing orgId or plan' }, 400);
    }

    const session = await billingService.createCheckoutSession(
      c,
      orgId,
      plan as 'pro' | 'enterprise',
      successUrl,
      cancelUrl
    );

    return c.json({ success: true, url: session.url });
  } catch (err: any) {
    logger.error('Checkout error', err);
    return c.json(
      { error: 'Failed to create checkout session', message: err.message },
      500
    );
  }
});

/**
 * Stripe Webhook Path
 * Note: Should be added to Stripe Dashboard as {API_URL}/api/v1/billing/webhook
 */
app.post('/webhook', async (c) => {
  const body = await c.req.text();
  const signature = c.req.header('stripe-signature') || '';

  try {
    const result = await billingService.handleStripeWebhook(c, body, signature);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: 'Webhook Error', message: err.message }, 400);
  }
});

export default app;
