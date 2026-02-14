/**
 * Organization Routes
 * 
 * Defines all organization management endpoints with proper middleware.
 */

import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller';
import {
  authenticate,
  requireOrganization,
  requireOrganizationRoles,
  requireOrganizationAdmin,
} from '../middleware/auth';
import { validate } from '../middleware';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrganizationSettingsSchema,
  addOrganizationMemberSchema,
  updateMemberRoleSchema,
} from '@validiant/shared';
import { OrganizationRole } from '@validiant/shared';

const router = Router();

/**
 * All organization routes require authentication
 */
router.use(authenticate);

/**
 * Organization CRUD endpoints
 */

/**
 * @route   POST /api/v1/organizations
 * @desc    Create a new organization
 * @access  Private
 */
router.post(
  '/',
  validate(createOrganizationSchema, 'body'),
  organizationController.createOrganization
);

/**
 * @route   GET /api/v1/organizations/my
 * @desc    Get current user's organizations
 * @access  Private
 */
router.get('/my', organizationController.getMyOrganizations);

/**
 * @route   GET /api/v1/organizations/slug/:slug
 * @desc    Get organization by slug
 * @access  Private (member)
 */
router.get('/slug/:slug', organizationController.getOrganizationBySlug);

/**
 * @route   GET /api/v1/organizations/:id
 * @desc    Get organization by ID
 * @access  Private (member)
 */
router.get('/:id', organizationController.getOrganizationById);

/**
 * @route   PUT /api/v1/organizations/:id
 * @desc    Update organization
 * @access  Private (owner/admin)
 */
router.put(
  '/:id',
  validate(updateOrganizationSchema, 'body'),
  organizationController.updateOrganization
);

/**
 * @route   PATCH /api/v1/organizations/:id/settings
 * @desc    Update organization settings
 * @access  Private (owner/admin)
 */
router.patch(
  '/:id/settings',
  validate(updateOrganizationSettingsSchema, 'body'),
  organizationController.updateOrganizationSettings
);

/**
 * @route   DELETE /api/v1/organizations/:id
 * @desc    Delete organization
 * @access  Private (owner only)
 */
router.delete('/:id', organizationController.deleteOrganization);

/**
 * Member management endpoints
 */

/**
 * @route   GET /api/v1/organizations/:id/members
 * @desc    Get organization members
 * @access  Private (member)
 */
router.get('/:id/members', organizationController.getOrganizationMembers);

/**
 * @route   POST /api/v1/organizations/:id/members
 * @desc    Add member to organization
 * @access  Private (owner/admin)
 */
router.post(
  '/:id/members',
  validate(addOrganizationMemberSchema, 'body'),
  organizationController.addOrganizationMember
);

/**
 * @route   PATCH /api/v1/organizations/:id/members/:userId/role
 * @desc    Update member role
 * @access  Private (owner/admin)
 */
router.patch(
  '/:id/members/:userId/role',
  validate(updateMemberRoleSchema, 'body'),
  organizationController.updateMemberRole
);

/**
 * @route   DELETE /api/v1/organizations/:id/members/:userId
 * @desc    Remove member from organization
 * @access  Private (owner/admin or self)
 */
router.delete('/:id/members/:userId', organizationController.removeMember);

/**
 * Organization action endpoints
 */

/**
 * @route   POST /api/v1/organizations/:id/leave
 * @desc    Leave organization
 * @access  Private (member)
 */
router.post('/:id/leave', organizationController.leaveOrganization);

/**
 * @route   POST /api/v1/organizations/:id/transfer-ownership
 * @desc    Transfer organization ownership
 * @access  Private (owner only)
 */
router.post('/:id/transfer-ownership', organizationController.transferOwnership);

/**
 * User role and membership endpoints
 */

/**
 * @route   GET /api/v1/organizations/:id/my-role
 * @desc    Get current user's role in organization
 * @access  Private (member)
 */
router.get('/:id/my-role', organizationController.getMyRole);

/**
 * @route   GET /api/v1/organizations/:id/is-member
 * @desc    Check if current user is member
 * @access  Private
 */
router.get('/:id/is-member', organizationController.checkMembership);

/**
 * Export router
 */
export default router;
