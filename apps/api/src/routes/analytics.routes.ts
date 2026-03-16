/**
 * Analytics Routes
 *
 * GET /api/analytics/latest
 * GET /api/analytics/history?days=N
 */

import { Hono } from 'hono';
import * as analyticsController from '../controllers/analytics.controller';
import { tenantIsolation } from '../middleware/tenant';

const analytics = new Hono();

// Apply auth and org context middleware
analytics.use('*', tenantIsolation);

analytics.get('/latest', analyticsController.getLatestMetrics);
analytics.get('/history', analyticsController.getHistory);

export default analytics;
