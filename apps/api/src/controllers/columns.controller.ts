import { Context } from 'hono';
import * as columnService from '../services/columns.service';

/**
 * Columns Controller - Phase 2 Schema Architect
 */

export const listTypeColumns = async (c: Context) => {
  const typeId = c.req.param('typeId');
  const columns = await columnService.listTypeColumns(typeId);
  return c.json({
    success: true,
    data: { columns },
  });
};

export const createTypeColumn = async (c: Context) => {
  const typeId = c.req.param('typeId');
  const body = await c.req.json();
  const projectId = c.req.param('projectId');

  const column = await columnService.createTypeColumn(typeId, projectId, body);
  return c.json({
    success: true,
    data: { column },
  });
};

export const updateTypeColumn = async (c: Context) => {
  const id = c.req.param('columnId');
  const body = await c.req.json();
  const column = await columnService.updateTypeColumn(id, body);
  return c.json({
    success: true,
    data: { column },
  });
};

export const deleteTypeColumn = async (c: Context) => {
  const id = c.req.param('columnId');
  await columnService.deleteTypeColumn(id);
  return c.json({
    success: true,
    message: 'Column deleted',
  });
};

export const reorderColumns = async (c: Context) => {
  const typeId = c.req.param('typeId');
  const { columnIds } = await c.req.json();
  
  if (!Array.isArray(columnIds)) {
    return c.json({ success: false, error: 'columnIds array required' }, 400);
  }

  await columnService.reorderColumns(typeId, columnIds);
  return c.json({
    success: true,
    message: 'Columns reordered',
  });
};
