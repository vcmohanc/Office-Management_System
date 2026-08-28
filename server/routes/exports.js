import express from 'express';
import Case from '../models/Case.js';
import Staff from '../models/Staff.js';
import HostFarmer from '../models/HostFarmer.js';
import { verifyToken } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.js';
import { getRemaining } from '../utils/caseHelpers.js';

const router = express.Router();

const escapeCell = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Excelで文字化けしないようBOM付きUTF-8で返す
const sendCsv = (res, filename, headers, rows) => {
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.send('﻿' + csv);
};

const csvGuard = [verifyToken, requirePermission(PERMISSIONS.EXPORT_CSV)];

// §1-19 立替案件一覧
router.get('/cases', csvGuard, async (req, res) => {
  try {
    const cases = await Case.find().sort({ occurredOn: -1 });
    const headers = ['ケースID', '発生日', '種別', '立替者', '対象', '費用負担先', '金額', '精算方法', '回収方法', '処理状態'];
    const rows = cases.map((c) => [
      c.caseId, c.occurredOn, c.type, c.advancer, c.target, c.costBearer, c.amount,
      c.settlement?.method || '', c.recovery?.method || '', c.status,
    ]);
    sendCsv(res, '立替案件一覧.csv', headers, rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// §1-19 給与天引き用
router.get('/payroll', csvGuard, async (req, res) => {
  try {
    const cases = await Case.find({ 'recovery.method': '給与天引き' }).sort({ occurredOn: -1 });
    const staffList = await Staff.find();
    const staffIdOf = (name) => staffList.find((s) => s.name === name)?.staffId || '';

    const headers = ['対象給与月', 'スタッフID', 'スタッフ名', 'ケースID', '種別', '天引き予定額', '天引き済み額', '残額', '備考'];
    const rows = [];

    cases.forEach((c) => {
      if (c.installments.length > 0) {
        // 分割天引きは対象月ごとに1行 §1-10
        c.installments.forEach((inst) => {
          rows.push([
            inst.month, staffIdOf(c.target), c.target, c.caseId, c.type,
            inst.amount,
            inst.status === '完了' ? inst.amount : 0,
            inst.status === '完了' ? 0 : inst.amount,
            inst.status === '完了' ? `処理日 ${inst.processedOn}` : c.recovery.note,
          ]);
        });
      } else {
        rows.push([
          c.recovery.targetMonth, staffIdOf(c.target), c.target, c.caseId, c.type,
          c.recovery.plannedAmount, c.recovery.processedAmount, getRemaining(c.recovery),
          c.recovery.note,
        ]);
      }
    });

    sendCsv(res, '給与天引き.csv', headers, rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// §1-19 派遣先請求・控除用
router.get('/host-billing', csvGuard, async (req, res) => {
  try {
    const cases = await Case.find({ billing: { $ne: null } }).sort({ occurredOn: -1 });
    const hosts = await HostFarmer.find();
    const hostIdOf = (name) => hosts.find((h) => h.name === name)?.hostId || '';

    const headers = ['対象請求月', '派遣先ID', '派遣先名', 'ケースID', '対象スタッフ', '種別', '請求額・控除額', '処理状態', '備考'];
    const rows = cases.map((c) => [
      c.billing.month, hostIdOf(c.billing.host), c.billing.host, c.caseId, c.billing.staff, c.billing.type,
      c.billing.kind === '控除' ? -c.billing.amount : c.billing.amount,
      c.billing.status, c.billing.reason,
    ]);

    sendCsv(res, '派遣先請求・控除.csv', headers, rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
