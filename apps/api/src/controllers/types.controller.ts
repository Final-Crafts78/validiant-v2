import { Context } from 'hono';
import * as typeService from '../services/types.service';

/**
 * Types Controller - Phase 2 Schema Architect
 */

export const listProjectTypes = async (c: Context) => {
  const projectId = c.req.param('projectId');
  const projectTypes = await typeService.listProjectTypes(projectId);
  return c.json({
    success: true,
    data: { projectTypes },
  });
};

export const createProjectType = async (c: Context) => {
  const projectId = c.req.param('projectId');
  const body = await c.req.json();
  const projectType = await typeService.createProjectType(projectId, body);
  return c.json({
    success: true,
    data: { projectType },
  });
};

export const getProjectType = async (c: Context) => {
  const id = c.req.param('typeId');
  const projectType = await typeService.getProjectTypeById(id);
  if (!projectType) return c.json({ error: 'Not Found' }, 404);
  return c.json({
    success: true,
    data: { projectType },
  });
};

export const updateProjectType = async (c: Context) => {
  const id = c.req.param('typeId');
  const body = await c.req.json();
  const projectType = await typeService.updateProjectType(id, body);
  return c.json({
    success: true,
    data: { projectType },
  });
};

export const deleteProjectType = async (c: Context) => {
  const id = c.req.param('typeId');
  await typeService.deleteProjectType(id);
  return c.json({
    success: true,
    message: 'Project type deleted',
  });
};
