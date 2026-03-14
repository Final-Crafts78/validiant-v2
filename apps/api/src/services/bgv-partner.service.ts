/**
 * BGV Partner Service
 *
 * Handles management of external BGV partner configurations,
 * including encryption of sensitive outbound keys.
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { bgvPartners, outboundDeliveryLogs } from '../db/schema';
import { encryptSecrets, decryptSecrets } from '../utils/encryption';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import { assertExists, ConflictError } from '../utils/errors';
import {
  CreateBgvPartnerInput,
  UpdateBgvPartnerInput,
} from '@validiant/shared';

/**
 * Create a new BGV Partner
 */
export const createPartner = async (
  organizationId: string,
  data: CreateBgvPartnerInput
) => {
  // Check uniqueness of partnerKey within org
  const existing = await db
    .select({ id: bgvPartners.id })
    .from(bgvPartners)
    .where(
      and(
        eq(bgvPartners.organizationId, organizationId),
        eq(bgvPartners.partnerKey, data.partnerKey)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError('Partner key already exists for this organization');
  }

  // Encrypt outbound secrets if provided
  let encryptedApiKey: string | undefined;
  let encryptedWebhookSecret: string | undefined;

  if (data.outboundApiKey) {
    encryptedApiKey = await encryptSecrets(
      data.outboundApiKey,
      env.ENCRYPTION_SECRET
    );
  }
  if (data.webhookSigningSecret) {
    encryptedWebhookSecret = await encryptSecrets(
      data.webhookSigningSecret,
      env.ENCRYPTION_SECRET
    );
  }

  const [partner] = await db
    .insert(bgvPartners)
    .values({
      organizationId,
      partnerKey: data.partnerKey,
      name: data.name,
      logoUrl: data.logoUrl,
      inboundApiToken: data.inboundApiToken, // Note: In Phase 14 we might hash this
      outboundApiKey: encryptedApiKey,
      webhookSigningSecret: encryptedWebhookSecret,
      allowedIps: data.allowedIps,
      rateLimit: data.rateLimit,
    })
    .returning();

  logger.info('BGV Partner created', {
    organizationId,
    partnerId: partner.id,
    partnerKey: partner.partnerKey,
  });
  return partner;
};

/**
 * Update a BGV Partner
 */
export const updatePartner = async (
  partnerId: string,
  data: UpdateBgvPartnerInput
) => {
  const [existing] = await db
    .select()
    .from(bgvPartners)
    .where(eq(bgvPartners.id, partnerId))
    .limit(1);
  assertExists(existing, 'BGV Partner');

  const updateData: Partial<typeof bgvPartners.$inferInsert> = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.outboundApiKey) {
    updateData.outboundApiKey = await encryptSecrets(
      data.outboundApiKey,
      env.ENCRYPTION_SECRET
    );
  }
  if (data.webhookSigningSecret) {
    updateData.webhookSigningSecret = await encryptSecrets(
      data.webhookSigningSecret,
      env.ENCRYPTION_SECRET
    );
  }

  const [updated] = await db
    .update(bgvPartners)
    .set(updateData)
    .where(eq(bgvPartners.id, partnerId))
    .returning();

  logger.info('BGV Partner updated', { partnerId });
  return updated;
};

/**
 * Get all partners for an organization
 */
export const getPartners = async (
  organizationId: string,
  activeOnly = true
) => {
  const query = db
    .select()
    .from(bgvPartners)
    .where(eq(bgvPartners.organizationId, organizationId));

  if (activeOnly) {
    return await query.where(eq(bgvPartners.isActive, true));
  }

  return await query;
};

/**
 * Get partner by ID (with optional decryption of secrets)
 */
export const getPartnerById = async (id: string, decrypt = false) => {
  const [partner] = await db
    .select()
    .from(bgvPartners)
    .where(eq(bgvPartners.id, id))
    .limit(1);
  assertExists(partner, 'BGV Partner');

  if (decrypt) {
    if (partner.outboundApiKey) {
      partner.outboundApiKey = await decryptSecrets(
        partner.outboundApiKey,
        env.ENCRYPTION_SECRET
      );
    }
    if (partner.webhookSigningSecret) {
      partner.webhookSigningSecret = await decryptSecrets(
        partner.webhookSigningSecret,
        env.ENCRYPTION_SECRET
      );
    }
  }

  return partner;
};

/**
 * Log an outbound delivery attempt
 */
export const logDeliveryAttempt = async (data: {
  taskId: string;
  partnerId: string;
  triggerStatus: string;
  payloadSent: unknown;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  deliveredAt?: Date;
}) => {
  return await db.insert(outboundDeliveryLogs).values(data).returning();
};
