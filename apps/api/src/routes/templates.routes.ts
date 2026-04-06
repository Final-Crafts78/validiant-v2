import { Hono } from 'hono';
import * as templatesController from '../controllers/templates.controller';

const router = new Hono();

/**
 * Type Templates Routes
 * Reusable schema components for the Data Universe.
 */

router.get('/', templatesController.listTemplates);
router.post('/', templatesController.createTemplate);
router.get('/:id', templatesController.getTemplate);
router.delete('/:id', templatesController.deleteTemplate);

export default router;
