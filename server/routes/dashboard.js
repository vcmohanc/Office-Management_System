import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.js';
import Case from '../models/Case.js';
import { getRemaining } from '../utils/caseHelpers.js';

const router = express.Router();

// 立替・精算の集計（ホーム画面・精算処理画面の指標カード用）
router.get('/', verifyToken, requirePermission(PERMISSIONS.VIEW), async (req, res) => {
  try {
    const cases = await Case.find();

    const sumRemaining = (list, leg) => list.reduce((sum, c) => sum + getRemaining(c[leg]), 0);

    const transferPending = cases.filter(
      (c) => c.settlement?.method === '本人へ振込' && c.settlement.status !== '完了'
    );
    const payrollPending = cases.filter(
      (c) => c.recovery?.method === '給与天引き' && c.recovery.status !== '完了'
    );
    const billingPending = cases.filter((c) => c.billing && c.billing.status !== '完了');
    const missingAttachment = cases.filter((c) => c.attachments.length === 0);

    const byStatus = cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      stats: {
        totalCases: cases.length,
        byStatus,
        transferAmount: sumRemaining(transferPending, 'settlement'),
        transferCount: transferPending.length,
        payrollAmount: sumRemaining(payrollPending, 'recovery'),
        payrollCount: payrollPending.length,
        billingPendingCount: billingPending.length,
        missingAttachmentCount: missingAttachment.length,
      },
      recentCases: cases
        .sort((a, b) => String(b.occurredOn).localeCompare(String(a.occurredOn)))
        .slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
