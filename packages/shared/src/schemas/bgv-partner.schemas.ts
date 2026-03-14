/**
 * BGV Partner Zod Schemas
 *
 * For managing external background verification partners.
 */

import { z } from 'zod';

/**
 * Create BGV Partner schema
 */
export const createBgvPartnerSchema = z.object({
  partnerKey: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-z0-9_-]+$/,
      'Partner key must be lowercase alphanumeric with hyphens/underscores'
    ),
  name: z.string().min(1).max(100),
  logoUrl: z.string().url().optional(),

  // Security (Inbound)
  inboundApiToken: z.string().min(32).optional(), // Can be auto-generated if not provided

  // Connectivity (Outbound)
  outboundApiKey: z.string().optional(),
  webhookSigningSecret: z.string().optional(),

  allowedIps: z.array(z.string().ip()).default([]),
  rateLimit: z.number().int().positive().default(60),
});

/**
 * Update BGV Partner schema
 */
export const updateBgvPartnerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().optional(),
  outboundApiKey: z.string().optional(),
  webhookSigningSecret: z.string().optional(),
  allowedIps: z.array(z.string().ip()).optional(),
  rateLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Delivery Log Filter schema
 */
export const deliveryLogFiltersSchema = z.object({
  taskId: z.string().uuid().optional(),
  partnerId: z.string().uuid().optional(),
  triggerStatus: z.string().optional(),
});

export type CreateBgvPartnerInput = z.infer<typeof createBgvPartnerSchema>;
export type UpdateBgvPartnerInput = z.infer<typeof updateBgvPartnerSchema>;
