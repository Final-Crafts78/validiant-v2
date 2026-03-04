/**
 * Comment Routes (Phase 14)
 *
 * Task comment endpoints — requires authentication.
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import * as commentController from '../controllers/comment.controller';

const commentRoutes = new Hono();

commentRoutes.use('*', authenticate);

// GET /api/v1/comments/:taskId — List comments for a task
commentRoutes.get('/:taskId', commentController.getTaskComments);

// POST /api/v1/comments/:taskId — Add a comment to a task
commentRoutes.post('/:taskId', commentController.createTaskComment);

export default commentRoutes;
