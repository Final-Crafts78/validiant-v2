/**
 * KYC Zod Schemas
 *
 * Validation schemas for KYC/Background Verification endpoints.
 * Used in Phase 17 — Didit Integration.
 */

import { z } from 'zod';

/**
 * KYC request schema — sent by a manager to initiate KYC for a candidate
 */
export const kycRequestSchema = z.object({
  taskId: z.string().uuid(),
  candidateEmail: z.string().email(),
  candidateName: z.string().min(2),
});

// Type exports
export type KycRequestInput = z.infer<typeof kycRequestSchema>;
