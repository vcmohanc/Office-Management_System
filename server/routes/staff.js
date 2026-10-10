import express from 'express';
import * as ledgerController from '../controllers/settlementLedgerController.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/:staffId/cases', requireRole('admin', 'account'), ledgerController.getStaffCases);

export default router;
