import Stripe from 'stripe';
import { db } from '../db';
import { organizations } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

// Prices from Stripe Dashboard (Placeholders for Phase 6)
const PLAN_PRICES = {
  pro: 'price_validiant_pro_monthly',
  enterprise: 'price_validiant_enterprise_custom',
};

const PLAN_LIMITS = {
  free: { projects: 1, records: 100, subAccounts: 2 },
  pro: { projects: 10, records: 5000, subAccounts: 20 },
  enterprise: { projects: 999999, records: 999999, subAccounts: 999999 },
};

/**
 * Billing Engine - Phase 6 Monetization
 */
export const getStripeClient = (c: any) => {
  const secretKey = c.env?.STRIPE_SECRET_KEY;
  if (!secretKey) {
    logger.error('STRIPE_SECRET_KEY is missing from environment');
    throw new Error('Billing configuration error');
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16', // Latest stable
  });
};

export const createCheckoutSession = async (
  c: any,
  orgId: string,
  plan: 'pro' | 'enterprise',
  successUrl: string,
  cancelUrl: string
) => {
  const stripe = getStripeClient(c);
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  if (!org) throw new Error('Organization not found');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: PLAN_PRICES[plan],
        quantity: 1,
      },
    ],
    mode: 'subscription',
    client_reference_id: orgId,
    customer_email: org.ownerId ? undefined : undefined, // Potential improvement: fetch owner email
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      orgId,
      plan,
    },
  });

  return session;
};

export const handleStripeWebhook = async (c: any, body: string, signature: string) => {
  const stripe = getStripeClient(c);
  const webhookSecret = c.env?.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    throw err;
  }

  const session = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.payment_succeeded':
      const orgId = session.client_reference_id || session.metadata?.orgId;
      const plan = session.metadata?.plan as any;

      if (orgId && plan) {
        await db
          .update(organizations)
          .set({
            plan,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            subscriptionStatus: 'active',
          })
          .where(eq(organizations.id, orgId));
        
        logger.info(`Organization ${orgId} upgraded to ${plan}`);
      }
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .update(organizations)
        .set({
          plan: 'free',
          subscriptionStatus: 'canceled',
        })
        .where(eq(organizations.stripeSubscriptionId, subscription.id));
      break;
  }

  return { received: true };
};

export const getQuotaForPlan = (plan: 'free' | 'pro' | 'enterprise') => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};
