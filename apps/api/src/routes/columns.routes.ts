import { Hono } from 'hono';
import * as columnsController from '../controllers/columns.controller';

const router = new Hono();

/**
 * Type Column Routes - Schema Architect
 */

router.get('/:projectId/types/:typeId/columns', columnsController.listTypeColumns);
router.post('/:projectId/types/:typeId/columns', columnsController.createTypeColumn);
router.put('/:projectId/types/:typeId/columns/:columnId', columnsController.updateTypeColumn);
router.delete('/:projectId/types/:typeId/columns/:columnId', columnsController.deleteTypeColumn);
router.post('/:projectId/types/:typeId/columns/reorder', columnsController.reorderColumns);

export default router;
