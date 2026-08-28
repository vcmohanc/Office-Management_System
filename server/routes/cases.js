import express from 'express';
import Case from '../models/Case.js';
import { verifyToken } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.js';
import {
  nextCaseId,
  applyDerivedStatus,
  addHistory,
  timestamp,
  today,
  installmentTotal,
} from '../utils/caseHelpers.js';

const router = express.Router();

// §1-16 検索・絞り込み条件をMongoのクエリに変換する
const buildQuery = (q) => {
  const query = {};

  if (q.keyword) {
    const rx = new RegExp(q.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ caseId: rx }, { advancer: rx }, { target: rx }, { registeredBy: rx }];
  }
  if (q.type) query.type = q.type;
  if (q.typeKey) query.typeKey = q.typeKey;
  if (q.status) query.status = q.status;
  if (q.costBearer) query.costBearerCategory = q.costBearer;
  if (q.advancer) query.advancer = new RegExp(q.advancer, 'i');

  // 期間（発生日）
  if (q.from || q.to) {
    query.occurredOn = {};
    if (q.from) query.occurredOn.$gte = q.from;
    if (q.to) query.occurredOn.$lte = q.to;
  }

  // 対象スタッフ／対象派遣先・農家は対象区分と組み合わせて絞り込む
  if (q.targetStaff) {
    query.targetCategory = 'サービススタッフ';
    query.target = new RegExp(q.targetStaff, 'i');
  }
  if (q.targetHost) {
    query.targetCategory = '派遣先・農家';
    query.target = new RegExp(q.targetHost, 'i');
  }

  // 給与天引き待ち
  if (q.awaitingPayroll === 'true') {
    query['recovery.method'] = '給与天引き';
    query['recovery.status'] = { $ne: '完了' };
  }
  // 派遣先請求控除待ち
  if (q.awaitingBilling === 'true') {
    query['billing.status'] = { $ne: '完了' };
    query.billing = { $ne: null };
  }
  // 添付不足
  if (q.missingAttachment === 'true') {
    query.attachments = { $size: 0 };
  }

  return query;
};

// §1-15 立替一覧表示　§1-16 検索・絞り込み
router.get('/', verifyToken, requirePermission(PERMISSIONS.VIEW), async (req, res) => {
  try {
    const cases = await Case.find(buildQuery(req.query)).sort({ occurredOn: -1, createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// §1-17 詳細表示
router.get('/:caseId', verifyToken, requirePermission(PERMISSIONS.VIEW), async (req, res) => {
  try {
    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });
    res.json(found);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// §1-1 立替案件登録
router.post('/', verifyToken, requirePermission(PERMISSIONS.CREATE), async (req, res) => {
  try {
    const body = req.body;
    const caseId = await nextCaseId();

    const newCase = new Case({
      ...body,
      caseId,
      registeredBy: body.registeredBy || req.user.username,
      status: '未処理',
      history: [],
    });

    applyDerivedStatus(newCase);
    addHistory(newCase, { by: req.user.username, action: '登録' });

    await newCase.save();
    res.status(201).json(newCase);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-17 編集（§1-21 変更前・変更後を履歴に記録）
const TRACKED_FIELDS = ['occurredOn', 'type', 'typeKey', 'advancerCategory', 'advancer', 'targetCategory',
  'target', 'costBearerCategory', 'costBearer', 'amount', 'reason', 'detail', 'note'];

router.put('/:caseId', verifyToken, requirePermission(PERMISSIONS.EDIT), async (req, res) => {
  try {
    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    TRACKED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined && String(req.body[field]) !== String(found[field])) {
        addHistory(found, {
          by: req.user.username,
          action: '編集',
          field,
          before: found[field],
          after: req.body[field],
        });
        found[field] = req.body[field];
      }
    });

    ['extras', 'installments', 'installmentNote', 'wantsInstallment', 'billing', 'resignation'].forEach((field) => {
      if (req.body[field] !== undefined) found[field] = req.body[field];
    });

    applyDerivedStatus(found);
    await found.save();
    res.json(found);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-7 処理状態更新（立替者への精算／費用負担先からの回収）
router.put('/:caseId/process/:leg', verifyToken, requirePermission(PERMISSIONS.UPDATE_PROCESS), async (req, res) => {
  try {
    const { leg } = req.params;
    if (!['settlement', 'recovery'].includes(leg)) {
      return res.status(400).json({ error: 'settlement または recovery を指定してください' });
    }

    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    const legLabel = leg === 'settlement' ? '立替者への精算' : '費用負担先からの回収';
    const target = found[leg];
    const before = target.status;

    ['method', 'plannedOn', 'plannedAmount', 'processedAmount', 'targetMonth', 'processedOn', 'status', 'note'].forEach((field) => {
      if (req.body[field] !== undefined) target[field] = req.body[field];
    });
    target.handler = req.body.handler || req.user.username;
    if (target.status === '完了' && !target.processedOn) target.processedOn = today();

    addHistory(found, {
      by: req.user.username,
      action: leg === 'settlement' ? '精算処理' : '回収処理',
      field: legLabel,
      before,
      after: target.status,
    });

    applyDerivedStatus(found);
    await found.save();
    res.json(found);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-10 分割天引きの各月を個別に更新する
router.put('/:caseId/installments/:index', verifyToken, requirePermission(PERMISSIONS.UPDATE_PROCESS), async (req, res) => {
  try {
    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    const index = Number(req.params.index);
    const installment = found.installments[index];
    if (!installment) return res.status(404).json({ error: '対象月が見つかりません' });

    const before = installment.status;
    if (req.body.amount !== undefined) installment.amount = req.body.amount;
    if (req.body.status !== undefined) installment.status = req.body.status;
    if (installment.status === '完了' && !installment.processedOn) {
      installment.processedOn = req.body.processedOn || today();
    }

    // 天引き済み額は完了した月の合計から算出する
    found.recovery.processedAmount = found.installments
      .filter((i) => i.status === '完了')
      .reduce((sum, i) => sum + i.amount, 0);

    const allDone = found.installments.every((i) => i.status === '完了');
    found.recovery.status = allDone ? '完了' : (found.recovery.processedAmount > 0 ? '処理中' : '未処理');
    if (allDone && !found.recovery.processedOn) found.recovery.processedOn = today();
    found.recovery.handler = req.user.username;

    addHistory(found, {
      by: req.user.username,
      action: '回収処理',
      field: `分割天引き（${installment.month}）`,
      before,
      after: installment.status,
    });

    applyDerivedStatus(found);
    await found.save();
    res.json(found);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-10 分割金額の合計が天引き総額と一致するか確認する
router.get('/:caseId/installments/check', verifyToken, requirePermission(PERMISSIONS.VIEW), async (req, res) => {
  try {
    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    const total = installmentTotal(found.installments);
    const planned = found.recovery?.plannedAmount || 0;
    res.json({ total, planned, balanced: found.installments.length === 0 || total === planned });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// §1-12 派遣先請求・控除の処理状態更新
router.put('/:caseId/billing', verifyToken, requirePermission(PERMISSIONS.UPDATE_PROCESS), async (req, res) => {
  try {
    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });
    if (!found.billing) return res.status(400).json({ error: 'この案件に派遣先請求・控除はありません' });

    const before = found.billing.status;
    ['host', 'month', 'staff', 'type', 'amount', 'kind', 'reason', 'display', 'status', 'processedOn', 'note']
      .forEach((field) => {
        if (req.body[field] !== undefined) found.billing[field] = req.body[field];
      });
    found.billing.handler = req.body.handler || req.user.username;
    if (found.billing.status === '完了' && !found.billing.processedOn) found.billing.processedOn = today();

    addHistory(found, {
      by: req.user.username,
      action: '請求・控除処理',
      field: '派遣先請求・控除',
      before,
      after: found.billing.status,
    });

    await found.save();
    res.json(found);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-11 退職時の給与天引き管理
router.put('/:caseId/resignation', verifyToken, requirePermission(PERMISSIONS.UPDATE_PROCESS), async (req, res) => {
  try {
    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    found.resignation = { ...(found.resignation?.toObject?.() || {}), ...req.body };

    // 誓約書が未添付のまま回収を進めないよう警告を返す
    const pledgeAttached = found.resignation.pledgeAttached
      || found.attachments.some((a) => a.kind === '天引き誓約書');
    found.resignation.pledgeAttached = pledgeAttached;

    addHistory(found, {
      by: req.user.username,
      action: '退職時天引き更新',
      field: '退職時の給与天引き',
      before: '',
      after: pledgeAttached ? '誓約書あり' : '誓約書未添付',
    });

    await found.save();
    res.json({ case: found, warning: pledgeAttached ? null : '天引き誓約書が未添付です' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-18 承認
router.post('/:caseId/approve', verifyToken, requirePermission(PERMISSIONS.APPROVE), async (req, res) => {
  try {
    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    const before = found.status;
    found.rejection = null;
    // 差戻し状態を解除したうえで、処理の進捗からステータスを再判定する
    found.status = '未処理';
    applyDerivedStatus(found);

    addHistory(found, {
      by: req.user.username,
      action: '承認',
      field: 'ステータス',
      before,
      after: found.status,
    });

    await found.save();
    res.json(found);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-18 差戻し（理由必須）
router.post('/:caseId/reject', verifyToken, requirePermission(PERMISSIONS.REJECT), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) return res.status(400).json({ error: '差戻し理由を入力してください' });

    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    const before = found.status;
    found.status = '差戻し';
    found.rejection = { reason, by: req.user.username, at: timestamp() };

    addHistory(found, { by: req.user.username, action: '差戻し', field: 'ステータス', before, after: '差戻し' });

    await found.save();
    res.json(found);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-18 取消（取消理由・取消者・取消日時を記録）
router.post('/:caseId/cancel', verifyToken, requirePermission(PERMISSIONS.CANCEL), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) return res.status(400).json({ error: '取消理由を入力してください' });

    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    // 処理済みの案件は取消せない。修正が必要な場合は差戻しで対応する。
    const hasProcessed = [found.settlement, found.recovery]
      .some((leg) => leg && leg.processedAmount > 0);
    if (hasProcessed) {
      return res.status(400).json({
        error: '精算・回収が処理済みのため取消できません。経理担当者に処理の取り消しを依頼してください。',
      });
    }

    const before = found.status;
    found.status = '取消';
    found.cancellation = { reason, by: req.user.username, at: timestamp() };

    addHistory(found, { by: req.user.username, action: '取消', field: 'ステータス', before, after: '取消' });

    await found.save();
    res.json(found);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-14 保留などの任意のステータス変更
router.post('/:caseId/status', verifyToken, requirePermission(PERMISSIONS.EDIT), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['未処理', '処理中', '完了', '保留'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `ステータスは ${allowed.join('／')} のいずれかを指定してください` });
    }

    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    const before = found.status;
    found.status = status;
    addHistory(found, { by: req.user.username, action: 'ステータス変更', field: 'ステータス', before, after: status });

    await found.save();
    res.json(found);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// §1-17 コメント
router.post('/:caseId/comments', verifyToken, requirePermission(PERMISSIONS.VIEW), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'コメントを入力してください' });

    const found = await Case.findOne({ caseId: req.params.caseId });
    if (!found) return res.status(404).json({ error: '案件が見つかりません' });

    found.comments.push({ by: req.user.username, at: timestamp(), text });
    await found.save();
    res.json(found);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
