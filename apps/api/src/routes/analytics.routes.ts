/**
 * Analytics Routes
 *
 * GET /api/analytics/latest
 * GET /api/analytics/history?days=N
 */

import { Hono } from 'hono';
import * as analyticsController from '../controllers/analytics.controller';
const analytics = new Hono();

analytics.get('/latest', analyticsController.getLatestMetrics);
analytics.get('/history', analyticsController.getHistory);

export default analytics;
