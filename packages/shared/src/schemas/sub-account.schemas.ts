import { z } from 'zod';

/**
 * Sub-Account Creation Schema
 */
export const createSubAccountSchema = z.object({
  accountType: z.enum(['field_agent', 'client_viewer', 'partner']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  projectAccess: z
    .array(
      z.object({
        projectId: z.string().uuid(),
        role: z.string(),
      })
    )
    .default([]),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Sub-Account Update Schema
 */
export const updateSubAccountSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  projectAccess: z
    .array(
      z.object({
        projectId: z.string().uuid(),
        role: z.string(),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateSubAccountInput = z.infer<typeof createSubAccountSchema>;
export type UpdateSubAccountInput = z.infer<typeof updateSubAccountSchema>;
