/**
 * Organization and Team Schemas
 * 
 * Zod validation schemas for organization and team operations.
 */

import { z } from 'zod';
import { VALIDATION } from '../constants';
import {
  OrganizationRole,
  TeamRole,
  SubscriptionTier,
  SubscriptionStatus,
  InvitationStatus,
} from '../types';

/**
 * Organization role enum schema
 */
export const organizationRoleSchema = z.nativeEnum(OrganizationRole);

/**
 * Team role enum schema
 */
export const teamRoleSchema = z.nativeEnum(TeamRole);

/**
 * Subscription tier enum schema
 */
export const subscriptionTierSchema = z.nativeEnum(SubscriptionTier);

/**
 * Subscription status enum schema
 */
export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);

/**
 * Invitation status enum schema
 */
export const invitationStatusSchema = z.nativeEnum(InvitationStatus);

/**
 * Organization name schema
 */
export const organizationNameSchema = z
  .string()
  .min(VALIDATION.ORGANIZATION_NAME.MIN_LENGTH, `Organization name must be at least ${VALIDATION.ORGANIZATION_NAME.MIN_LENGTH} characters`)
  .max(VALIDATION.ORGANIZATION_NAME.MAX_LENGTH, `Organization name must not exceed ${VALIDATION.ORGANIZATION_NAME.MAX_LENGTH} characters`)
  .trim();

/**
 * Team name schema
 */
export const teamNameSchema = z
  .string()
  .min(VALIDATION.TEAM_NAME.MIN_LENGTH, `Team name must be at least ${VALIDATION.TEAM_NAME.MIN_LENGTH} characters`)
  .max(VALIDATION.TEAM_NAME.MAX_LENGTH, `Team name must not exceed ${VALIDATION.TEAM_NAME.MAX_LENGTH} characters`)
  .trim();

/**
 * Organization slug schema
 */
export const organizationSlugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must not exceed 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .toLowerCase();

/**
 * Organization settings schema
 */
export const organizationSettingsSchema = z.object({
  allowMemberInvites: z.boolean(),
  requireTwoFactor: z.boolean(),
  defaultProjectVisibility: z.enum(['public', 'private']),
  allowPublicProjects: z.boolean(),
  allowGuestAccess: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440).optional(), // Minutes
  ipWhitelist: z.array(z.string().ip()).optional(),
  customDomain: z.string().url().optional(),
  brandingColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logoUrl: z.string().url().optional(),
});

/**
 * Create organization schema
 */
export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema.optional(),
  description: z.string().max(500).optional(),
  website: z.string().url('Invalid website URL').optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+']).optional(),
});

/**
 * Update organization schema
 */
export const updateOrganizationSchema = z.object({
  name: organizationNameSchema.optional(),
  description: z.string().max(500).optional(),
  website: z.string().url('Invalid website URL').optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+']).optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
});

/**
 * Update organization settings schema
 */
export const updateOrganizationSettingsSchema = organizationSettingsSchema.partial();

/**
 * Organization member invitation schema
 */
export const inviteOrganizationMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: organizationRoleSchema,
  teamIds: z.array(z.string().uuid()).optional(),
  message: z.string().max(500).optional(),
});

/**
 * Bulk organization member invitation schema
 */
export const bulkInviteOrganizationMembersSchema = z.object({
  invitations: z.array(
    z.object({
      email: z.string().email(),
      role: organizationRoleSchema,
      teamIds: z.array(z.string().uuid()).optional(),
    })
  ).min(1, 'At least one invitation is required').max(50, 'Maximum 50 invitations at once'),
  message: z.string().max(500).optional(),
});

/**
 * Update organization member role schema
 */
export const updateOrganizationMemberRoleSchema = z.object({
  role: organizationRoleSchema,
});

/**
 * Accept organization invitation schema
 */
export const acceptOrganizationInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

/**
 * Resend organization invitation schema
 */
export const resendOrganizationInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});

/**
 * Create team schema
 */
export const createTeamSchema = z.object({
  name: teamNameSchema,
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  parentTeamId: z.string().uuid().optional(),
});

/**
 * Update team schema
 */
export const updateTeamSchema = z.object({
  name: teamNameSchema.optional(),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
});

/**
 * Add team member schema
 */
export const addTeamMemberSchema = z.object({
  userId: z.string().uuid(),
  role: teamRoleSchema.default(TeamRole.MEMBER),
});

/**
 * Bulk add team members schema
 */
export const bulkAddTeamMembersSchema = z.object({
  members: z.array(
    z.object({
      userId: z.string().uuid(),
      role: teamRoleSchema,
    })
  ).min(1, 'At least one member is required').max(100, 'Maximum 100 members at once'),
});

/**
 * Update team member role schema
 */
export const updateTeamMemberRoleSchema = z.object({
  role: teamRoleSchema,
});

/**
 * Subscription update schema
 */
export const updateSubscriptionSchema = z.object({
  tier: subscriptionTierSchema,
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
  paymentMethodId: z.string().optional(),
});

/**
 * Subscription cancellation schema
 */
export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
  feedback: z.string().max(1000).optional(),
  cancelAtPeriodEnd: z.boolean().default(true),
});

/**
 * Payment method schema
 */
export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_account', 'paypal']),
  cardNumber: z.string().optional(),
  cardExpMonth: z.number().min(1).max(12).optional(),
  cardExpYear: z.number().min(2024).optional(),
  cardCvc: z.string().length(3).or(z.string().length(4)).optional(),
  billingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    country: z.string().length(2), // ISO country code
  }).optional(),
});

/**
 * Organization filters schema
 */
export const organizationFiltersSchema = z.object({
  search: z.string().optional(),
  subscriptionTier: subscriptionTierSchema.optional(),
  subscriptionStatus: subscriptionStatusSchema.optional(),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+']).optional(),
});

/**
 * Team filters schema
 */
export const teamFiltersSchema = z.object({
  search: z.string().optional(),
  isPrivate: z.boolean().optional(),
  parentTeamId: z.string().uuid().optional(),
});

/**
 * Member filters schema
 */
export const memberFiltersSchema = z.object({
  search: z.string().optional(),
  role: organizationRoleSchema.optional(),
  teamId: z.string().uuid().optional(),
});

/**
 * Organization sort schema
 */
export const organizationSortSchema = z.object({
  field: z.enum(['createdAt', 'updatedAt', 'name', 'memberCount']),
  direction: z.enum(['asc', 'desc']),
});

/**
 * Team sort schema
 */
export const teamSortSchema = z.object({
  field: z.enum(['createdAt', 'updatedAt', 'name', 'memberCount']),
  direction: z.enum(['asc', 'desc']),
});

/**
 * Transfer organization ownership schema
 */
export const transferOrganizationOwnershipSchema = z.object({
  newOwnerId: z.string().uuid(),
  confirmationCode: z.string().min(1, 'Confirmation code is required'),
});

/**
 * Organization deletion schema
 */
export const deleteOrganizationSchema = z.object({
  confirmationText: z.string().refine(
    (val) => val === 'DELETE',
    { message: 'Please type DELETE to confirm' }
  ),
  password: z.string().min(1, 'Password is required for confirmation'),
});

/**
 * Team deletion schema
 */
export const deleteTeamSchema = z.object({
  reassignProjectsToTeamId: z.string().uuid().optional(),
});

/**
 * Billing address schema
 */
export const billingAddressSchema = z.object({
  companyName: z.string().max(100).optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().length(2, 'Country must be 2-letter ISO code'),
  taxId: z.string().optional(),
});

/**
 * Update billing address schema
 */
export const updateBillingAddressSchema = billingAddressSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

/**
 * Organization statistics request schema
 */
export const organizationStatsRequestSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metrics: z.array(z.enum([
    'projects',
    'tasks',
    'members',
    'timeTracked',
    'completionRate',
    'activeUsers',
  ])).optional(),
});

/**
 * Type inference helpers
 */
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateOrganizationSettingsInput = z.infer<typeof updateOrganizationSettingsSchema>;
export type InviteOrganizationMemberInput = z.infer<typeof inviteOrganizationMemberSchema>;
export type BulkInviteOrganizationMembersInput = z.infer<typeof bulkInviteOrganizationMembersSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
export type OrganizationFiltersInput = z.infer<typeof organizationFiltersSchema>;
export type TeamFiltersInput = z.infer<typeof teamFiltersSchema>;
