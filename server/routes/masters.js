import express from 'express';
import ExpenseType from '../models/ExpenseType.js';
import Staff from '../models/Staff.js';
import HostFarmer from '../models/HostFarmer.js';
import PostageRate from '../models/PostageRate.js';
import Setting from '../models/Setting.js';
import { verifyToken } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.js';

const router = express.Router();

const manage = [verifyToken, requirePermission(PERMISSIONS.MANAGE_MASTER)];
const read = [verifyToken, requirePermission(PERMISSIONS.VIEW)];

// 汎用のCRUDを組み立てる（マスタごとの差分は識別キーのみ）
const crud = (basePath, Model, idField, sort) => {
  router.get(basePath, read, async (req, res) => {
    try {
      // 案件登録の選択肢には有効なものだけを出す
      const filter = req.query.enabledOnly === 'true' ? { enabled: true } : {};
      res.json(await Model.find(filter).sort(sort));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post(basePath, manage, async (req, res) => {
    try {
      const created = await Model.create(req.body);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put(`${basePath}/:id`, manage, async (req, res) => {
    try {
      const updated = await Model.findOneAndUpdate(
        { [idField]: req.params.id },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ error: '対象が見つかりません' });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete(`${basePath}/:id`, manage, async (req, res) => {
    try {
      const removed = await Model.findOneAndDelete({ [idField]: req.params.id });
      if (!removed) return res.status(404).json({ error: '対象が見つかりません' });
      res.json({ message: '削除しました' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// §1-2 費用種別マスタ（追加・編集・停止）
crud('/expense-types', ExpenseType, 'key', { order: 1 });
// サービススタッフマスタ
crud('/staff', Staff, 'staffId', { staffId: 1 });
// 派遣先・農家マスタ
crud('/host-farmers', HostFarmer, 'hostId', { hostId: 1 });

// 郵送費レート表（_id で更新する）
crud('/postage-rates', PostageRate, '_id', { origin: 1, destination: 1 });

// 分割提案の上限金額などのシステム設定
router.get('/settings/:key', read, async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    res.json(setting || { key: req.params.key, value: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings/:key', manage, async (req, res) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { $set: { value: req.body.value } },
      { new: true, upsert: true }
    );
    res.json(setting);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
