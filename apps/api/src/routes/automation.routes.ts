/**
 * Automation Routes (Phase 21)
 *
 * CRUD endpoints for automation rules (Zapier-like workflows).
 * All routes require authentication.
 */

import { Hono } from 'hono';
import * as automationController from '../controllers/automation.controller';

const automationRoutes = new Hono();

// GET /api/v1/automations — List automations for an org
automationRoutes.get('/', automationController.listAutomations);

// GET /api/v1/automations/stats — Aggregate stats
automationRoutes.get('/stats', automationController.getAutomationStats);

// GET /api/v1/automations/:id — Get a single automation
automationRoutes.get('/:id', automationController.getAutomation);

// POST /api/v1/automations — Create an automation
automationRoutes.post('/', automationController.createAutomation);

// PUT /api/v1/automations/:id — Update an automation
automationRoutes.put('/:id', automationController.updateAutomation);

// DELETE /api/v1/automations/:id — Delete an automation
automationRoutes.delete('/:id', automationController.deleteAutomation);

export default automationRoutes;
