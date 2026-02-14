/**
 * Organization Routes (Hono Version)
 * 
 * Organization management endpoints with edge-native validation.
 * Migrated from Express to Hono for Cloudflare Workers deployment.
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
} from '@validiant/shared';
import * as organizationController from '../controllers/organization.controller.hono';
import { authenticate } from '../middleware/auth.hono';

/**
 * Create organization routes Hono instance
 * All routes require authentication
 */
const app = new Hono();

/**
 * Apply authentication middleware to all organization routes
 * CRITICAL: Must be authenticated to access any organization endpoint
 */
app.use('*', authenticate);

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
 * GET /slug/:slug
 * Get organization by slug
 * 
 * Params: slug (string)
 * Response: 200 OK with organization object
 */
app.get('/slug/:slug', organizationController.getOrganizationBySlug);

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

export default app;
