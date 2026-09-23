import express from 'express';
import * as ledgerController from '../controllers/settlementLedgerController.js';

const router = express.Router();

router.get('/:staffId/cases', ledgerController.getStaffCases);

export default router;
