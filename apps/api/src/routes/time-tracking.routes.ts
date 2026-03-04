/**
 * Time Tracking Routes (Phase 19)
 *
 * Endpoints for tracking time spent on tasks.
 * All routes require authentication.
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import * as timeTrackingController from '../controllers/time-tracking.controller';

const timeTrackingRoutes = new Hono();

timeTrackingRoutes.use('*', authenticate);

// POST /api/v1/time-tracking/start — Start a timer on a task
timeTrackingRoutes.post('/start', timeTrackingController.startTimer);

// POST /api/v1/time-tracking/stop — Stop the running timer
timeTrackingRoutes.post('/stop', timeTrackingController.stopTimer);

// GET /api/v1/time-tracking/current — Get currently running timer
timeTrackingRoutes.get('/current', timeTrackingController.getCurrentTimer);

// GET /api/v1/time-tracking/task/:taskId — Get time entries for a task
timeTrackingRoutes.get(
  '/task/:taskId',
  timeTrackingController.getTaskTimeEntries
);

// GET /api/v1/time-tracking/user — Get time entries for the logged-in user
timeTrackingRoutes.get('/user', timeTrackingController.getUserTimeEntries);

// DELETE /api/v1/time-tracking/:entryId — Delete a time entry
timeTrackingRoutes.delete('/:entryId', timeTrackingController.deleteTimeEntry);

export default timeTrackingRoutes;
