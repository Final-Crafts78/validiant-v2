import { Hono } from 'hono';
import * as subAccountController from '../controllers/sub-accounts.controller';

const router = new Hono();

/**
 * Sub-Account Management Routes
 * Specialized roles for the Validiant Data Universe.
 */

router.get('/:orgId', subAccountController.listSubAccounts);
router.post('/:orgId', subAccountController.createSubAccount);
router.get('/detail/:id', subAccountController.getSubAccount);
router.patch('/:id', subAccountController.updateSubAccount);
router.delete('/:id', subAccountController.deleteSubAccount);

export default router;
