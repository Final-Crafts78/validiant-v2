import { Context } from 'hono';
import * as recordService from '../services/records.service';
import * as projectService from '../services/project.service';
import * as organizationService from '../services/organization.service';
import { recordCreateSchema, recordUpdateSchema } from '@validiant/shared';
import { z } from 'zod';

/**
 * Records Controller - Schema Engine (Phase 2 Architect)
 */

const checkProjectAccess = async (projectId: string, userId: string) => {
  return await projectService.isProjectMember(projectId, userId);
};

export const createRecord = async (c: Context) => {
  try {
    const user = c.get('user');
    const projectId = c.req.param('projectId');

    if (!user || !user.userId) return c.json({ error: 'Unauthorized' }, 401);

    const hasAccess = await checkProjectAccess(projectId, user.userId);
    if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);

    const validatedData = (await c.req.json()) as z.infer<
      typeof recordCreateSchema
    >;

    const record = await recordService.createRecord(
      projectId,
      user.userId,
      validatedData
    );

    return c.json({ success: true, data: { record } }, 201);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to create record',
        message: (error as Error).message,
      },
      500
    );
  }
};

export const updateRecord = async (c: Context) => {
  try {
    const user = c.get('user');
    const recordId = c.req.param('recordId');

    if (!user || !user.userId) return c.json({ error: 'Unauthorized' }, 401);

    const record = await recordService.getRecordById(recordId);
    if (!record) return c.json({ error: 'Not Found' }, 404);

    const hasAccess = await checkProjectAccess(record.projectId, user.userId);
    if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);

    const validatedData = (await c.req.json()) as z.infer<
      typeof recordUpdateSchema
    >;

    const updated = await recordService.updateRecord(
      recordId,
      user.userId,
      validatedData
    );

    return c.json({ success: true, data: { record: updated } });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to update record',
        message: (error as Error).message,
      },
      500
    );
  }
};

export const getRecord = async (c: Context) => {
  try {
    const user = c.get('user');
    const recordId = c.req.param('recordId');

    if (!user || !user.userId) return c.json({ error: 'Unauthorized' }, 401);

    const record = await recordService.getRecordById(recordId);
    if (!record) return c.json({ error: 'Not Found' }, 404);

    const hasAccess = await checkProjectAccess(record.projectId, user.userId);
    if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);

    // Perfection: Resolve Security Context
    const project = await projectService.getProjectById(record.projectId);
    const orgId = project.organizationId;
    const [permissions, organization] = await Promise.all([
      organizationService.resolvePermissions(orgId, user.userId),
      organizationService.getOrganizationById(orgId),
    ]);

    const isOwner = organization.ownerId === user.userId;

    // Apply Projection
    const projectedRecord = await recordService.getRecordById(
      recordId,
      permissions,
      isOwner
    );

    return c.json({ success: true, data: { record: projectedRecord } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed' }, 500);
  }
};

export const getRecordHistory = async (c: Context) => {
  try {
    const user = c.get('user');
    const recordId = c.req.param('recordId');

    if (!user || !user.userId) return c.json({ error: 'Unauthorized' }, 401);

    const record = await recordService.getRecordById(recordId);
    if (!record) return c.json({ error: 'Not Found' }, 404);

    const hasAccess = await checkProjectAccess(record.projectId, user.userId);
    if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);

    const history = await recordService.getRecordHistory(recordId);
    return c.json({ success: true, data: { history } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch history' }, 500);
  }
};

export const listRecords = async (c: Context) => {
  try {
    const user = c.get('user');
    const projectId = c.req.param('projectId');

    if (!user || !user.userId) return c.json({ error: 'Unauthorized' }, 401);

    const hasAccess = await checkProjectAccess(projectId, user.userId);
    if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);

    // Perfection: Resolve Security Context
    const project = await projectService.getProjectById(projectId);
    const orgId = project.organizationId;
    const [permissions, organization] = await Promise.all([
      organizationService.resolvePermissions(orgId, user.userId),
      organizationService.getOrganizationById(orgId),
    ]);

    const isOwner = organization.ownerId === user.userId;

    const records = await recordService.getRecordsByProject(
      projectId,
      permissions,
      isOwner
    );
    return c.json({ success: true, data: { records } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed' }, 500);
  }
};

/**
 * PHASE 2: Media Upload URL Generation
 */
export const getMediaUploadUrl = async (c: Context) => {
  try {
    const user = c.get('user');
    const projectId = c.req.param('projectId');
    const fieldKey = c.req.query('fieldKey');
    const extension = c.req.query('ext') || 'png';

    if (!user || !user.userId) return c.json({ error: 'Unauthorized' }, 401);
    if (!fieldKey) return c.json({ error: 'fieldKey required' }, 400);

    const hasAccess = await checkProjectAccess(projectId, user.userId);
    if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);

    const mediaData = await recordService.getRecordMediaUploadUrl(
      projectId,
      fieldKey,
      extension
    );

    return c.json({ success: true, data: mediaData });
  } catch (error) {
    return c.json({ success: false, error: 'Failed' }, 500);
  }
};

/**
 * Get Project Stats (Phase 5 Analytics)
 */
export const getProjectStats = async (c: Context) => {
  try {
    const user = c.get('user');
    const projectId = c.req.param('projectId');

    if (!user || !user.userId) return c.json({ error: 'Unauthorized' }, 401);

    const hasAccess = await checkProjectAccess(projectId, user.userId);
    if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);

    const stats = await recordService.getRecordProjectStats(projectId);
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('[RecordsController:StatsError]', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
};
/**
 * Real-time Locking (Phase 8 Precision)
 */

export const lockRecord = async (c: Context) => {
  try {
    const user = c.get('user');
    const recordId = c.req.param('recordId');

    if (!user || !user.userId) return c.json({ error: 'Unauthorized' }, 401);

    const record = await recordService.getRecordById(recordId);
    if (!record) return c.json({ error: 'Not Found' }, 404);

    const hasAccess = await checkProjectAccess(record.projectId, user.userId);
    if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);

    const updated = await recordService.lockRecord(recordId, user.userId);
    return c.json({ success: true, data: { record: updated } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed' }, 500);
  }
};

export const unlockRecord = async (c: Context) => {
  try {
    const user = c.get('user');
    const recordId = c.req.param('recordId');

    if (!user || !user.userId) return c.json({ error: 'Unauthorized' }, 401);

    const record = await recordService.getRecordById(recordId);
    if (!record) return c.json({ error: 'Not Found' }, 404);

    const hasAccess = await checkProjectAccess(record.projectId, user.userId);
    if (!hasAccess) return c.json({ error: 'Forbidden' }, 403);

    const updated = await recordService.unlockRecord(recordId, user.userId);
    return c.json({ success: true, data: { record: updated } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed' }, 500);
  }
};
