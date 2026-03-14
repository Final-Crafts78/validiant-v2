/**
 * Inbound Case Zod Schemas
 *
 * For BGV partners pushing cases into Validiant.
 */

import { z } from 'zod';

/**
 * Inbound Case Push schema
 */
export const inboundCasePushSchema = z.object({
  caseId: z.string().min(1).max(100), // The partner's unique reference
  checkType: z.string().min(1).max(50), // Maps to VerificationType.code
  candidateName: z.string().min(1).max(200),
  candidateEmail: z.string().email(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  customFields: z.record(z.any()).optional(),
  projectId: z.string().uuid().optional(), // Optional: can be routed to a default project
});

export type InboundCasePushInput = z.infer<typeof inboundCasePushSchema>;
