// §1-19 CSV出力機能 — 出力項目は要件定義書の指定どおり。
import { STAFF_MASTER, FARMER_MASTER } from '../constants/parties';
import { deriveCaseStatus, getRemaining } from '../constants/cases';

const escapeCell = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (headers, rows) =>
  [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');

export const downloadCsv = (filename, headers, rows) => {
  // Excelで文字化けしないようBOM付きUTF-8で出力する
  const blob = new Blob(['﻿' + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const staffIdOf = (name) => STAFF_MASTER.find((s) => s.name === name)?.id || '';
const farmerIdOf = (name) => FARMER_MASTER.find((f) => f.name === name)?.id || '';

// 立替案件一覧
export const exportCaseListCsv = (cases) => {
  const headers = [
    'ケースID', '発生日', '種別', '立替者', '対象', '費用負担先', '金額', '精算方法', '回収方法', '処理状態',
  ];
  const rows = cases.map((c) => [
    c.id,
    c.occurredOn,
    c.type,
    c.advancer,
    c.target,
    c.costBearer,
    c.amount,
    c.settlement?.method || '',
    c.recovery?.method || '',
    deriveCaseStatus(c),
  ]);
  downloadCsv('立替案件一覧.csv', headers, rows);
};

// 給与天引き用
export const exportPayrollCsv = (cases) => {
  const headers = [
    '対象給与月', 'スタッフID', 'スタッフ名', 'ケースID', '種別', '天引き予定額', '天引き済み額', '残額', '備考',
  ];
  const rows = [];
  cases
    .filter((c) => c.recovery?.method === '給与天引き')
    .forEach((c) => {
      const staffName = c.target;
      if (c.installments.length > 0) {
        // 分割天引きは対象月ごとに1行 §1-10
        c.installments.forEach((inst) => {
          rows.push([
            inst.month,
            staffIdOf(staffName),
            staffName,
            c.id,
            c.type,
            inst.amount,
            inst.status === '完了' ? inst.amount : 0,
            inst.status === '完了' ? 0 : inst.amount,
            inst.status === '完了' ? `処理日 ${inst.processedOn}` : c.recovery.note,
          ]);
        });
      } else {
        rows.push([
          c.recovery.targetMonth,
          staffIdOf(staffName),
          staffName,
          c.id,
          c.type,
          c.recovery.plannedAmount,
          c.recovery.processedAmount,
          getRemaining(c.recovery),
          c.recovery.note,
        ]);
      }
    });
  downloadCsv('給与天引き.csv', headers, rows);
};

// 派遣先請求・控除用
export const exportHostBillingCsv = (cases) => {
  const headers = [
    '対象請求月', '派遣先ID', '派遣先名', 'ケースID', '対象スタッフ', '種別', '請求額・控除額', '処理状態', '備考',
  ];
  const rows = cases
    .filter((c) => !!c.billing)
    .map((c) => [
      c.billing.month,
      farmerIdOf(c.billing.host),
      c.billing.host,
      c.id,
      c.billing.staff,
      c.billing.type,
      c.billing.kind === '控除' ? -c.billing.amount : c.billing.amount,
      c.billing.status,
      c.billing.reason,
    ]);
  downloadCsv('派遣先請求・控除.csv', headers, rows);
};
