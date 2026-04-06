import { Hono } from 'hono';
import * as typesController from '../controllers/types.controller';

const router = new Hono();

/**
 * Project Type Routes - Schema Architect
 */

router.get('/:projectId/types', typesController.listProjectTypes);
router.post('/:projectId/types', typesController.createProjectType);
router.get('/:projectId/types/:typeId', typesController.getProjectType);
router.put('/:projectId/types/:typeId', typesController.updateProjectType);
router.delete('/:projectId/types/:typeId', typesController.deleteProjectType);

export default router;
