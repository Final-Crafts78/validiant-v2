/**
 * Project Routes
 * 
 * Defines all project management endpoints with proper middleware.
 */

import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectSettingsSchema,
  addProjectMemberSchema,
  projectListQuerySchema,
} from '@validiant/shared';

const router = Router();

/**
 * All project routes require authentication
 */
router.use(authenticate);

/**
 * Project CRUD endpoints
 */

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Private (org member)
 */
router.post(
  '/',
  validate(createProjectSchema, 'body'),
  projectController.createProject
);

/**
 * @route   GET /api/v1/projects/my
 * @desc    Get current user's projects
 * @access  Private
 */
router.get('/my', projectController.getMyProjects);

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get project by ID
 * @access  Private (project member)
 */
router.get('/:id', projectController.getProjectById);

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    Update project
 * @access  Private (project member)
 */
router.put(
  '/:id',
  validate(updateProjectSchema, 'body'),
  projectController.updateProject
);

/**
 * @route   PATCH /api/v1/projects/:id/settings
 * @desc    Update project settings
 * @access  Private (project member)
 */
router.patch(
  '/:id/settings',
  validate(updateProjectSettingsSchema, 'body'),
  projectController.updateProjectSettings
);

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Delete project
 * @access  Private (org owner/admin)
 */
router.delete('/:id', projectController.deleteProject);

/**
 * Project action endpoints
 */

/**
 * @route   POST /api/v1/projects/:id/archive
 * @desc    Archive project
 * @access  Private (project member)
 */
router.post('/:id/archive', projectController.archiveProject);

/**
 * @route   POST /api/v1/projects/:id/unarchive
 * @desc    Unarchive project
 * @access  Private (project member)
 */
router.post('/:id/unarchive', projectController.unarchiveProject);

/**
 * @route   POST /api/v1/projects/:id/complete
 * @desc    Mark project as completed
 * @access  Private (project member)
 */
router.post('/:id/complete', projectController.completeProject);

/**
 * @route   POST /api/v1/projects/:id/leave
 * @desc    Leave project
 * @access  Private (project member)
 */
router.post('/:id/leave', projectController.leaveProject);

/**
 * Member management endpoints
 */

/**
 * @route   GET /api/v1/projects/:id/members
 * @desc    Get project members
 * @access  Private (project member)
 */
router.get('/:id/members', projectController.getProjectMembers);

/**
 * @route   POST /api/v1/projects/:id/members
 * @desc    Add member to project
 * @access  Private (project member)
 */
router.post(
  '/:id/members',
  validate(addProjectMemberSchema, 'body'),
  projectController.addProjectMember
);

/**
 * @route   DELETE /api/v1/projects/:id/members/:userId
 * @desc    Remove member from project
 * @access  Private (project member or org admin/owner)
 */
router.delete('/:id/members/:userId', projectController.removeProjectMember);

/**
 * Export router
 */
export default router;
