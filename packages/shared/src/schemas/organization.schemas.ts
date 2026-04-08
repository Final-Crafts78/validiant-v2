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
  .min(
    VALIDATION.ORGANIZATION_NAME.MIN_LENGTH,
    `Organization name must be at least ${VALIDATION.ORGANIZATION_NAME.MIN_LENGTH} characters`
  )
  .max(
    VALIDATION.ORGANIZATION_NAME.MAX_LENGTH,
    `Organization name must not exceed ${VALIDATION.ORGANIZATION_NAME.MAX_LENGTH} characters`
  )
  .trim();

/**
 * Team name schema
 */
export const teamNameSchema = z
  .string()
  .min(
    VALIDATION.TEAM_NAME.MIN_LENGTH,
    `Team name must be at least ${VALIDATION.TEAM_NAME.MIN_LENGTH} characters`
  )
  .max(
    VALIDATION.TEAM_NAME.MAX_LENGTH,
    `Team name must not exceed ${VALIDATION.TEAM_NAME.MAX_LENGTH} characters`
  )
  .trim();

/**
 * Organization slug schema
 */
export const organizationSlugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must not exceed 50 characters')
  .regex(
    /^[a-z0-9-]+$/,
    'Slug can only contain lowercase letters, numbers, and hyphens'
  )
  .toLowerCase();

/**
 * Custom Status schema for organization settings (Phase 9)
 */
export const customStatusSchema = z.object({
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  insertAfter: z.string().min(1).max(50),
  color: z.string().min(1).max(50),
  icon: z.string().min(1).max(50),
  requiresNote: z.boolean().default(false),
});

/**
 * White-Label Branding Config (Phase 10)
 */
export const brandConfigSchema = z.object({
  accentPrimary: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#4f46e5'),
  surfaceBase: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  surfaceSubtle: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  surfaceMuted: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textBase: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textMuted: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderBase: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  criticalBase: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  displayName: z.string().optional(),
  loginPageHeroText: z.string().optional(),
});

/**
 * SLA Engine Configuration (Phase 10)
 */
export const slaConfigSchema = z.object({
  calcMode: z.enum(['calendar', 'business_hours']).default('calendar'),
  atRiskThresholdPercent: z.number().min(5).max(50).default(20),
  businessHours: z
    .object({
      timezone: z.string().default('UTC'),
      workDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
      start: z.string().default('09:00'),
      end: z.string().default('17:00'),
    })
    .optional(),
  orgHolidays: z.array(z.string()).default([]),
  slaExcludeHolidays: z.boolean().default(true),
});

/**
 * Case Reference Config (Phase 10)
 */
export const caseRefConfigSchema = z.object({
  prefix: z.string().max(10).default('CASE'),
  includeYear: z.boolean().default(true),
  paddingLength: z.number().min(3).max(10).default(5),
  separator: z.enum(['-', '_', '', '/']).default('-'),
});

/**
 * Priority Level Config (Phase 10)
 */
export const priorityLevelSchema = z.object({
  key: z.string(),
  label: z.string(),
  color: z.string(),
  slaMultiplier: z.number().default(1.0),
});

export const priorityConfigSchema = z.object({
  enabled: z.boolean().default(true),
  levels: z.array(priorityLevelSchema).default([
    { key: 'low', label: 'Low', color: 'blue', slaMultiplier: 1.5 },
    { key: 'medium', label: 'Medium', color: 'gray', slaMultiplier: 1.0 },
    { key: 'high', label: 'High', color: 'orange', slaMultiplier: 0.75 },
    { key: 'urgent', label: 'Urgent', color: 'red', slaMultiplier: 0.5 },
  ]),
});

/**
 * Rejection Reason Config (Phase 10)
 */
export const rejectionReasonSchema = z.object({
  id: z.string(),
  label: z.string(),
  requiresNote: z.boolean().default(false),
});

export const rejectionConfigSchema = z.object({
  reasons: z.array(rejectionReasonSchema).default([]),
  allowFreeformRejection: z.boolean().default(true),
});

/**
 * Navigation Config (Phase 10)
 */
export const navigationConfigSchema = z.object({
  showAnalytics: z.boolean().default(true),
  showImport: z.boolean().default(true),
  casesLabel: z.string().default('Cases'),
  analyticsLabel: z.string().default('Analytics'),
});

/**
 * Notification Policy (Phase 10)
 */
export const notificationPolicySchema = z.object({
  emailNotificationsEnabled: z.boolean().default(true),
  notificationPolicy: z.record(z.any()).optional(), // Defaults by role
});

/**
 * Organization settings schema
 */
export const organizationSettingsSchema = z.object({
  // Basic Settings
  allowMemberInvites: z.boolean().default(true),
  requireTwoFactor: z.boolean().default(false),
  defaultProjectVisibility: z.enum(['public', 'private']).default('private'),
  allowPublicProjects: z.boolean().default(false),
  allowGuestAccess: z.boolean().default(false),
  sessionTimeout: z.number().min(5).max(1440).optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
  customDomain: z.string().url().optional(),

  // Enterprise Config Hub (Phase 10)
  brandConfig: brandConfigSchema.default({}),
  slaConfig: slaConfigSchema.default({}),
  auditLogRetentionDays: z.number().default(365),
  caseRefConfig: caseRefConfigSchema.default({}),
  priorityConfig: priorityConfigSchema.default({}),
  rejectionConfig: rejectionConfigSchema.default({}),
  navigationConfig: navigationConfigSchema.default({}),
  notificationPolicy: notificationPolicySchema.default({}),
  enabledFeatures: z.array(z.string()).default([]),
  disabledFeatures: z.array(z.string()).default([]),
  customStatuses: z.array(customStatusSchema).optional(),
  analyticsKpiConfig: z.record(z.any()).optional(),
  csvImportTemplates: z.array(z.any()).default([]),
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
  size: z
    .enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'])
    .optional(),
});

/**
 * Update organization schema
 */
export const updateOrganizationSchema = z.object({
  name: organizationNameSchema.optional(),
  description: z.string().max(500).optional(),
  website: z.string().url('Invalid website URL').optional(),
  industry: z.string().max(100).optional(),
  size: z
    .enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'])
    .optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
});

/**
 * Update organization settings schema
 */
export const updateOrganizationSettingsSchema = z.object({
  settings: organizationSettingsSchema.partial(),
});

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
 * Add organization member schema (for direct member addition)
 * ELITE PATTERN: Separate from invitation flow
 */
export const addOrganizationMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: organizationRoleSchema,
  teamIds: z.array(z.string().uuid()).optional(),
});

/**
 * Bulk organization member invitation schema
 */
export const bulkInviteOrganizationMembersSchema = z.object({
  invitations: z
    .array(
      z.object({
        email: z.string().email(),
        role: organizationRoleSchema,
        teamIds: z.array(z.string().uuid()).optional(),
      })
    )
    .min(1, 'At least one invitation is required')
    .max(50, 'Maximum 50 invitations at once'),
  message: z.string().max(500).optional(),
});

/**
 * Update organization member role schema
 */
export const updateOrganizationMemberRoleSchema = z.object({
  role: organizationRoleSchema,
});

/**
 * Update member role schema (shorter alias for backward compatibility)
 * ELITE PATTERN: Alias for cleaner route definitions
 */
export const updateMemberRoleSchema = updateOrganizationMemberRoleSchema;

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
  members: z
    .array(
      z.object({
        userId: z.string().uuid(),
        role: teamRoleSchema,
      })
    )
    .min(1, 'At least one member is required')
    .max(100, 'Maximum 100 members at once'),
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
  billingAddress: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string(),
      country: z.string().length(2), // ISO country code
    })
    .optional(),
});

/**
 * Organization filters schema
 */
export const organizationFiltersSchema = z.object({
  search: z.string().optional(),
  subscriptionTier: subscriptionTierSchema.optional(),
  subscriptionStatus: subscriptionStatusSchema.optional(),
  industry: z.string().optional(),
  size: z
    .enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'])
    .optional(),
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
  confirmationText: z.string().refine((val) => val === 'DELETE', {
    message: 'Please type DELETE to confirm',
  }),
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
export const updateBillingAddressSchema = billingAddressSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * Organization statistics request schema
 */
export const organizationStatsRequestSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metrics: z
    .array(
      z.enum([
        'projects',
        'tasks',
        'members',
        'timeTracked',
        'completionRate',
        'activeUsers',
      ])
    )
    .optional(),
});

/**
 * Custom role creation schema (Phase 5)
 */
export const createCustomRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).default([]),
});

/**
 * Custom role update schema (Phase 5)
 */
export const updateCustomRoleSchema = createCustomRoleSchema.partial();

/**
 * Type inference helpers
 */
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateOrganizationSettingsInput = z.infer<
  typeof updateOrganizationSettingsSchema
>;
export type InviteOrganizationMemberInput = z.infer<
  typeof inviteOrganizationMemberSchema
>;
export type AddOrganizationMemberInput = z.infer<
  typeof addOrganizationMemberSchema
>;
export type BulkInviteOrganizationMembersInput = z.infer<
  typeof bulkInviteOrganizationMembersSchema
>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
export type OrganizationFiltersInput = z.infer<
  typeof organizationFiltersSchema
>;
export type TeamFiltersInput = z.infer<typeof teamFiltersSchema>;
export type CreateCustomRoleInput = z.infer<typeof createCustomRoleSchema>;
export type UpdateCustomRoleInput = z.infer<typeof updateCustomRoleSchema>;
