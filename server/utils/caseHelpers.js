import Counter from '../models/Counter.js';

export const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const today = () => timestamp().slice(0, 10);

// §1-1 ケースIDはシステムで自動採番する
export const nextCaseId = async () => {
  const year = new Date().getFullYear();
  const counter = await Counter.findByIdAndUpdate(
    `case-${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CAS-${year}-${String(counter.seq).padStart(4, '0')}`;
};

// §1-8 一方のみ完了している場合、案件全体は「処理中」とする。
// 差戻し・保留・取消は処理の進捗に関わらず維持する。
export const deriveCaseStatus = (doc) => {
  if (['差戻し', '保留', '取消'].includes(doc.status)) return doc.status;
  const legs = [doc.settlement, doc.recovery].filter((l) => l && l.status !== '対象外');
  if (legs.length === 0) return doc.status;
  if (legs.every((l) => l.status === '完了')) return '完了';
  if (legs.some((l) => l.status === '完了' || l.status === '処理中')) return '処理中';
  return '未処理';
};

export const applyDerivedStatus = (doc) => {
  doc.status = deriveCaseStatus(doc);
  return doc;
};

// §1-21 操作履歴を追加する
export const addHistory = (doc, { by, action, field = '', before = '', after = '' }) => {
  doc.history.push({
    at: timestamp(),
    by,
    action,
    field,
    before: before === null || before === undefined ? '' : String(before),
    after: after === null || after === undefined ? '' : String(after),
  });
};

export const getRemaining = (process) =>
  process ? Math.max(0, (process.plannedAmount || 0) - (process.processedAmount || 0)) : 0;

// §1-10 分割金額の合計が天引き総額と一致するか
export const installmentTotal = (installments = []) =>
  installments.reduce((sum, i) => sum + (i.amount || 0), 0);

// §1-8 農家への処理・スタッフへの処理を取り出す。
// 立替者への精算の相手は立替者、費用負担先からの回収の相手は費用負担先。
export const getFarmerProcess = (doc) => {
  if (doc.advancerCategory === '派遣先・農家') return doc.settlement;
  if (doc.costBearerCategory === '派遣先・農家') return doc.recovery;
  return null;
};

export const getStaffProcess = (doc) => {
  if (doc.advancerCategory === 'サービススタッフ') return doc.settlement;
  if (doc.costBearerCategory === 'サービススタッフ') return doc.recovery;
  return null;
};
