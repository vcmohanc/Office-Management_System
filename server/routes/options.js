import express from 'express';
import mongoose from 'mongoose';
import Option from '../models/Option.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

const isOthers = (o) => {
  const v = (o.value || '').toLowerCase();
  const l = (o.label || '').toLowerCase();
  return v === 'others' || v === 'other' || v === 'その他' || l === 'others' || l === 'other' || l === 'その他';
};

const buildOptionIdQuery = (id) => {
  const raw = String(id || '').trim();
  if (/^[0-9a-fA-F]{24}$/.test(raw) && mongoose.Types.ObjectId.isValid(raw)) {
    return {
      $or: [
        { _id: new mongoose.Types.ObjectId(raw) },
        { _id: raw }
      ]
    };
  }
  return { _id: raw };
};

// GET /api/options - Fetch all options (ordered, with others at the end for ExpenseType)
router.get('/', async (req, res) => {
  try {
    const options = await Option.find().sort({ order: 1, createdAt: 1 });

    const nonExpense = options.filter(o => o.type !== 'ExpenseType');
    const expenses = options.filter(o => o.type === 'ExpenseType');
    const expNormal = expenses.filter(o => !isOthers(o));
    const expOthers = expenses.filter(o => isOthers(o));

    res.json([...nonExpense, ...expNormal, ...expOthers]);
  } catch (err) {
    console.error('Error fetching options:', err);
    res.status(500).json({ error: 'Server error fetching options' });
  }
});

// POST /api/options - Create a new option
router.post('/', requireRole('account', 'admin'), async (req, res) => {
  try {
    const { type, label, value, defaultAdvancerCategory, defaultBearingParty, defaultPaymentMethod, order } = req.body;
    if (!type || !label) {
      return res.status(400).json({ error: '種別（type）と名称（label）は必須です。' });
    }

    const finalValue = (value && value.trim()) ? value.trim() : label.trim();

    // Check duplicate value for same type
    const existing = await Option.findOne({ type, value: finalValue });
    if (existing) {
      return res.status(400).json({ error: `同種別の項目（コード: ${finalValue}）が既に存在します。` });
    }

    const newOption = new Option({
      type,
      label: label.trim(),
      value: finalValue,
      defaultAdvancerCategory: defaultAdvancerCategory || '',
      defaultBearingParty: defaultBearingParty || '',
      defaultPaymentMethod: defaultPaymentMethod || '',
      order: order || 0
    });

    await newOption.save();
    res.status(201).json(newOption);
  } catch (err) {
    console.error('Error creating option:', err);
    res.status(500).json({ error: '項目の登録に失敗しました。' });
  }
});

// PUT /api/options/:id - Update an option
router.put('/:id', requireRole('account', 'admin'), async (req, res) => {
  try {
    const { type, label, value, defaultAdvancerCategory, defaultBearingParty, defaultPaymentMethod, order } = req.body;
    const option = await Option.findOne(buildOptionIdQuery(req.params.id));
    if (!option) {
      return res.status(404).json({ error: '対象の項目が見つかりません。' });
    }

    // Protect 'others' value key from breaking system fallback logic
    if (isOthers(option) && value && value !== option.value) {
      return res.status(400).json({ error: '「その他」のシステムコードは変更できません。' });
    }

    const targetType = (type && !isOthers(option)) ? String(type).trim() : option.type;

    if (label !== undefined) option.label = String(label).trim();
    if (!isOthers(option)) {
      const trimmedVal = typeof value === 'string' ? value.trim() : '';
      const targetVal = trimmedVal || option.value;
      if (targetVal !== option.value || targetType !== option.type) {
        // Check duplicate
        const dup = await Option.collection.findOne({ _id: { $ne: option._id }, type: targetType, value: targetVal });
        if (dup) {
          return res.status(400).json({ error: `同種別の項目（コード: ${targetVal}）が既に存在します。` });
        }
        option.type = targetType;
        option.value = targetVal;
      }
    }

    const updateFields = {
      type: option.type,
      label: option.label,
      value: option.value,
      defaultAdvancerCategory: defaultAdvancerCategory !== undefined ? defaultAdvancerCategory : (option.defaultAdvancerCategory || ''),
      defaultBearingParty: defaultBearingParty !== undefined ? defaultBearingParty : (option.defaultBearingParty || ''),
      defaultPaymentMethod: defaultPaymentMethod !== undefined ? defaultPaymentMethod : (option.defaultPaymentMethod || ''),
      order: order !== undefined ? order : (option.order ?? 0),
      updatedAt: new Date()
    };

    await Option.collection.updateOne({ _id: option._id }, { $set: updateFields });
    const updatedOption = await Option.findOne({ _id: option._id });
    res.json(updatedOption || { ...option.toObject(), ...updateFields });
  } catch (err) {
    console.error('Error updating option:', err);
    res.status(500).json({ error: '項目の更新に失敗しました。' });
  }
});

// DELETE /api/options/:id - Delete an option
router.delete('/:id', requireRole('account', 'admin'), async (req, res) => {
  try {
    let option = null;
    const rawId = String(req.params.id || '').trim();
    if (rawId && rawId !== 'undefined' && rawId !== 'null' && rawId !== 'by-key') {
      option = await Option.findOne(buildOptionIdQuery(rawId));
    }

    // Fallback lookup by (type, value) if ID did not match (e.g. legacy string _id or missing _id)
    if (!option && req.query?.type && req.query?.value) {
      option = await Option.findOne({
        type: String(req.query.type).trim(),
        value: String(req.query.value).trim()
      });
    }

    if (!option) {
      return res.status(404).json({ error: '対象の項目が見つかりません。' });
    }

    // Protect the last remaining 'others' from deletion, while allowing duplicate cleanup
    if (isOthers(option)) {
      const sameTypeOptions = await Option.find({ type: option.type }).lean();
      const othersCount = sameTypeOptions.filter(isOthers).length;
      if (othersCount <= 1) {
        return res.status(400).json({ error: '「その他」はシステムの基本項目のため削除できません。' });
      }
    }

    let delResult = await Option.collection.deleteOne({ _id: option._id });
    if (delResult.deletedCount === 0 && rawId && rawId !== 'by-key') {
      delResult = await Option.collection.deleteOne(buildOptionIdQuery(rawId));
    }

    if (delResult.deletedCount === 0) {
      return res.status(404).json({ error: '対象の項目が見つかりません。' });
    }

    res.json({ success: true, message: '項目を削除しました。' });
  } catch (err) {
    console.error('Error deleting option:', err);
    res.status(500).json({ error: '項目の削除に失敗しました。' });
  }
});

export default router;
