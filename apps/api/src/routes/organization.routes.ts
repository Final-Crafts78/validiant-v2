/**
 * Organization Routes
 *
 * Organization management endpoints with edge-native validation.
 * Edge-compatible Hono implementation for Cloudflare Workers.
 *
 * Routes:
 * - POST / - Create organization
 * - GET /my - Get current user's organizations
 * - GET /slug/:slug - Get organization by slug
 * - GET /:id - Get organization by ID
 * - PUT /:id - Update organization
 * - PATCH /:id/settings - Update organization settings
 * - DELETE /:id - Delete organization
 * - GET /:id/members - Get organization members
 * - POST /:id/members - Add member to organization
 * - PATCH /:id/members/:userId/role - Update member role
 * - DELETE /:id/members/:userId - Remove member
 * - POST /:id/leave - Leave organization
 * - POST /:id/transfer-ownership - Transfer ownership
 * - GET /:id/my-role - Get current user's role
 * - GET /:id/is-member - Check if user is member
 *
 * ELITE PATTERN:
 * - Routes use @hono/zod-validator for edge validation
 * - Controllers blindly trust c.req.valid('json')
 * - Middleware handles auth, routes handle validation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrganizationSettingsSchema,
  addOrganizationMemberSchema,
  updateMemberRoleSchema,
  createCustomRoleSchema,
  updateCustomRoleSchema,
} from '@validiant/shared';
import * as organizationController from '../controllers/organization.controller';
import * as projectController from '../controllers/project.controller';

/**
 * Create organization routes Hono instance
 * All routes require authentication
 */
const app = new Hono();

// ============================================================================
// ORGANIZATION CRUD ENDPOINTS
// ============================================================================

/**
 * POST /
 * Create a new organization
 *
 * Validation: createOrganizationSchema (name, slug, description, website, industry, size)
 * Response: 201 Created with organization object
 */
app.post(
  '/',
  zValidator('json', createOrganizationSchema),
  organizationController.createOrganization
);

/**
 * GET /my
 * Get current user's organizations
 *
 * No validation needed (uses auth context)
 * Response: 200 OK with organizations array
 */
app.get('/my', organizationController.getMyOrganizations);

/**
 * POST /accept-invite
 * Accept an organization invitation (authenticated user)
 *
 * Body: { token: string }
 * Response: 200 OK with organization info
 *
 * CRITICAL: Must be before /:id routes to avoid param collision
 */
app.post('/accept-invite', organizationController.acceptInvite);

/**
 * GET /slug/:slug
 * Get organization by slug
 *
 * Params: slug (string)
 * Response: 200 OK with organization object
 */
app.get('/slug/:slug', organizationController.getOrganizationBySlug);

/**
 * GET /:organizationId/projects
 * Get organization's projects
 *
 * Params: organizationId (UUID)
 * Response: 200 OK with projects array
 */
app.get(
  '/:organizationId/projects',
  projectController.listOrganizationProjects
);

/**
 * GET /:id
 * Get organization by ID
 *
 * Params: id (UUID)
 * Response: 200 OK with organization object
 */
app.get('/:id', organizationController.getOrganizationById);

/**
 * PUT /:id
 * Update organization (owner/admin only)
 *
 * Validation: updateOrganizationSchema (name, description, website, industry, size, logoUrl)
 * Response: 200 OK with updated organization object
 */
app.put(
  '/:id',
  zValidator('json', updateOrganizationSchema),
  organizationController.updateOrganization
);

/**
 * PATCH /:id/settings
 * Update organization settings (owner/admin only)
 *
 * Validation: updateOrganizationSettingsSchema (settings object)
 * Response: 200 OK with updated organization object
 */
app.patch(
  '/:id/settings',
  zValidator('json', updateOrganizationSettingsSchema),
  organizationController.updateOrganizationSettings
);

/**
 * DELETE /:id
 * Delete organization (owner only)
 *
 * No validation needed
 * Response: 200 OK with success message
 */
app.delete('/:id', organizationController.deleteOrganization);

// ============================================================================
// MEMBER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /:id/members
 * Get organization members (member access)
 *
 * No validation needed
 * Response: 200 OK with members array
 */
app.get('/:id/members', organizationController.getOrganizationMembers);

/**
 * POST /:id/invites
 * Create an invitation to join the organization (owner/admin only)
 *
 * Body: { email: string, role: string }
 * Response: 201 Created with invite URL and token
 */
app.post('/:id/invites', organizationController.createInvite);

/**
 * GET /:id/invitations
 * Alias for invitations list (Phase 26 fix)
 */
app.get('/:id/invitations', organizationController.getOrganizationMembers);

/**
 * POST /:id/members
 * Add member to organization (owner/admin only)
 *
 * Validation: addOrganizationMemberSchema (userId, role, teamIds)
 * Response: 201 Created with member object
 */
app.post(
  '/:id/members',
  zValidator('json', addOrganizationMemberSchema),
  organizationController.addOrganizationMember
);

/**
 * PATCH /:id/members/:userId/role
 * Update member role (owner/admin only)
 *
 * Validation: updateMemberRoleSchema (role)
 * Response: 200 OK with updated member object
 */
app.patch(
  '/:id/members/:userId/role',
  zValidator('json', updateMemberRoleSchema),
  organizationController.updateMemberRole
);

/**
 * DELETE /:id/members/:userId
 * Remove member from organization (owner/admin or self)
 *
 * No validation needed
 * Response: 200 OK with success message
 */
app.delete('/:id/members/:userId', organizationController.removeMember);

// ============================================================================
// ORGANIZATION ACTION ENDPOINTS
// ============================================================================

/**
 * POST /:id/leave
 * Leave organization (member access)
 *
 * No validation needed
 * Response: 200 OK with success message
 */
app.post('/:id/leave', organizationController.leaveOrganization);

/**
 * POST /:id/transfer-ownership
 * Transfer organization ownership (owner only)
 *
 * FUTURE: Add transferOrganizationOwnershipSchema in Phase 5
 * Body: { newOwnerId: string, confirmationCode?: string }
 * Response: 200 OK with success message
 */
app.post('/:id/transfer-ownership', organizationController.transferOwnership);

// ============================================================================
// USER ROLE AND MEMBERSHIP ENDPOINTS
// ============================================================================

/**
 * GET /:id/my-role
 * Get current user's role in organization (member access)
 *
 * No validation needed
 * Response: 200 OK with { role: OrganizationRole }
 */
app.get('/:id/my-role', organizationController.getMyRole);

/**
 * GET /:id/is-member
 * Check if current user is member
 *
 * No validation needed
 * Response: 200 OK with { isMember: boolean }
 */
app.get('/:id/is-member', organizationController.checkMembership);

/**
 * GET /:id/my-membership
 * Get current user's full membership details (Phase 26 fix)
 */
app.get('/:id/my-membership', organizationController.getMyRole);

// ============================================================================
// CUSTOM ROLE ENDPOINTS (Phase 5)
// ============================================================================

/**
 * GET /:id/roles
 * List all custom and system roles for the organization
 */
app.get('/:id/roles', organizationController.getOrganizationRoles);

/**
 * POST /:id/roles
 * Create a new custom role
 * Validation: createCustomRoleSchema
 */
app.post(
  '/:id/roles',
  zValidator('json', createCustomRoleSchema),
  organizationController.createCustomRole
);

/**
 * PATCH /:id/roles/:roleId
 * Update custom role permissions or metadata
 * Validation: updateCustomRoleSchema
 */
app.patch(
  '/:id/roles/:roleId',
  zValidator('json', updateCustomRoleSchema),
  organizationController.updateCustomRole
);

/**
 * DELETE /:id/roles/:roleId
 * Delete custom role
 */
app.delete('/:id/roles/:roleId', organizationController.deleteCustomRole);

export default app;
