/**
 * Organization and Team Types
 * 
 * Type definitions for organization entities, team management,
 * and membership structures.
 */

import { UserRole } from './user.types';

/**
 * Organization subscription tier
 * Different feature sets based on subscription level
 */
export enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

/**
 * Organization status
 */
export enum OrganizationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

/**
 * Member role within organization
 * Extends base UserRole with organization-specific permissions
 */
export enum OrganizationMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

/**
 * Team member role
 * Specific to team-level permissions
 */
export enum TeamMemberRole {
  LEAD = 'lead',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * Organization settings
 * Configurable organization-wide settings
 */
export interface OrganizationSettings {
  allowGuestInvites: boolean;
  requireEmailVerification: boolean;
  enableTwoFactorAuth: boolean;
  allowPublicProjects: boolean;
  defaultProjectVisibility: 'public' | 'private';
  allowExternalCollaborators: boolean;
  sessionTimeout: number; // in minutes
  allowedEmailDomains?: string[];
  customBranding: {
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
  };
}

/**
 * Organization subscription details
 */
export interface OrganizationSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  seats: number;
  usedSeats: number;
}

/**
 * Organization usage statistics
 */
export interface OrganizationUsage {
  projects: {
    total: number;
    limit: number;
  };
  storage: {
    used: number; // in bytes
    limit: number; // in bytes
  };
  apiCalls: {
    current: number;
    limit: number;
    resetDate: Date;
  };
  integrations: {
    active: number;
    limit: number;
  };
}

/**
 * Core Organization interface
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  websiteUrl?: string;
  logoUrl?: string;
  status: OrganizationStatus;
  settings: OrganizationSettings;
  subscription: OrganizationSubscription;
  usage: OrganizationUsage;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization member
 * Links users to organizations with specific roles
 */
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  permissions: string[];
  joinedAt: Date;
  invitedBy?: string;
  lastActiveAt?: Date;
}

/**
 * Organization invitation
 * Pending invitations to join an organization
 */
export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationMemberRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}

/**
 * Team within an organization
 */
export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  slug: string;
  avatarUrl?: string;
  settings: TeamSettings;
  parentTeamId?: string; // For hierarchical teams
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team settings
 */
export interface TeamSettings {
  isPrivate: boolean;
  allowMemberInvites: boolean;
  defaultProjectRole: 'admin' | 'member' | 'viewer';
  notifyOnMemberJoin: boolean;
}

/**
 * Team member
 * Links users to teams with specific roles
 */
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  joinedAt: Date;
  addedBy: string;
}

/**
 * Team invitation
 */
export interface TeamInvitation {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  respondedAt?: Date;
}

/**
 * Organization with populated data
 * Includes additional computed/joined data
 */
export interface OrganizationWithDetails extends Organization {
  memberCount: number;
  projectCount: number;
  teamCount: number;
  owner: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

/**
 * Team with populated data
 */
export interface TeamWithDetails extends Team {
  memberCount: number;
  projectCount: number;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Organization creation data
 */
export interface CreateOrganizationData {
  name: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
}

/**
 * Organization update data
 */
export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  websiteUrl?: string;
  logoUrl?: string;
  settings?: Partial<OrganizationSettings>;
}

/**
 * Team creation data
 */
export interface CreateTeamData {
  name: string;
  slug?: string;
  description?: string;
  parentTeamId?: string;
  settings?: Partial<TeamSettings>;
}

/**
 * Team update data
 */
export interface UpdateTeamData {
  name?: string;
  description?: string;
  avatarUrl?: string;
  settings?: Partial<TeamSettings>;
}

/**
 * Organization member with user details
 */
export interface OrganizationMemberWithUser extends OrganizationMember {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    role: UserRole;
  };
}

/**
 * Team member with user details
 */
export interface TeamMemberWithUser extends TeamMember {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

/**
 * Default organization settings
 */
export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  allowGuestInvites: true,
  requireEmailVerification: true,
  enableTwoFactorAuth: false,
  allowPublicProjects: false,
  defaultProjectVisibility: 'private',
  allowExternalCollaborators: false,
  sessionTimeout: 60,
  customBranding: {},
};

/**
 * Default team settings
 */
export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  isPrivate: false,
  allowMemberInvites: true,
  defaultProjectRole: 'member',
  notifyOnMemberJoin: true,
};

/**
 * Subscription tier limits
 */
export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, {
  projects: number;
  storage: number; // in GB
  seats: number;
  apiCalls: number; // per month
  integrations: number;
}> = {
  [SubscriptionTier.FREE]: {
    projects: 3,
    storage: 1,
    seats: 5,
    apiCalls: 1000,
    integrations: 2,
  },
  [SubscriptionTier.STARTER]: {
    projects: 10,
    storage: 10,
    seats: 10,
    apiCalls: 10000,
    integrations: 5,
  },
  [SubscriptionTier.PROFESSIONAL]: {
    projects: 50,
    storage: 100,
    seats: 50,
    apiCalls: 100000,
    integrations: 20,
  },
  [SubscriptionTier.ENTERPRISE]: {
    projects: -1, // unlimited
    storage: -1, // unlimited
    seats: -1, // unlimited
    apiCalls: -1, // unlimited
    integrations: -1, // unlimited
  },
};

/**
 * Type guard to check if user is organization owner
 */
export const isOrganizationOwner = (
  organizationId: string,
  userId: string,
  organization: Organization
): boolean => {
  return organization.ownerId === userId;
};

/**
 * Type guard to check if user is organization admin
 */
export const isOrganizationAdmin = (
  member: OrganizationMember
): boolean => {
  return member.role === OrganizationMemberRole.OWNER || 
         member.role === OrganizationMemberRole.ADMIN;
};

/**
 * Type guard to check if user is team lead
 */
export const isTeamLead = (member: TeamMember): boolean => {
  return member.role === TeamMemberRole.LEAD;
};

/**
 * Helper to check if organization has reached limit
 */
export const hasReachedLimit = (
  usage: OrganizationUsage,
  resource: 'projects' | 'storage' | 'apiCalls' | 'integrations'
): boolean => {
  const resourceUsage = usage[resource];
  if (resourceUsage.limit === -1) return false; // unlimited
  return resourceUsage.current >= resourceUsage.limit || 
         (resource === 'storage' && resourceUsage.used >= resourceUsage.limit);
};
