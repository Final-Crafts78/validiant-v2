import { Hono } from 'hono';
import * as recordController from '../controllers/records.controller';
import { recordCreateSchema, recordUpdateSchema } from '@validiant/shared';
import { zValidator } from '@hono/zod-validator';

const router = new Hono();

/**
 * Project Record Routes - Precision Schema Engine
 */

router.get('/:projectId/records', recordController.listRecords);
router.get('/:projectId/records/stats', recordController.getProjectStats);
router.get('/:projectId/records/media-url', recordController.getMediaUploadUrl);
router.get('/:projectId/records/:recordId', recordController.getRecord);
router.get(
  '/:projectId/records/:recordId/history',
  recordController.getRecordHistory
);

router.post(
  '/:projectId/records',
  zValidator('json', recordCreateSchema),
  recordController.createRecord
);

router.post('/:projectId/records/:recordId/lock', recordController.lockRecord);

router.delete(
  '/:projectId/records/:recordId/lock',
  recordController.unlockRecord
);

router.patch(
  '/:projectId/records/:recordId',
  zValidator('json', recordUpdateSchema),
  recordController.updateRecord
);

export default router;
