import express from 'express';
import Option from '../models/Option.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

const isOthers = (o) => {
  const v = (o.value || '').toLowerCase();
  const l = (o.label || '').toLowerCase();
  return v === 'others' || v === 'other' || v === 'その他' || l === 'others' || l === 'other' || l === 'その他';
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
    const { label, value, defaultAdvancerCategory, defaultBearingParty, defaultPaymentMethod, order } = req.body;
    const option = await Option.findById(req.params.id);
    if (!option) {
      return res.status(404).json({ error: '対象の項目が見つかりません。' });
    }

    // Protect 'others' value key from breaking system fallback logic
    if (isOthers(option) && value && value !== option.value) {
      return res.status(400).json({ error: '「その他」のシステムコードは変更できません。' });
    }

    if (label !== undefined) option.label = label.trim();
    if (value !== undefined && !isOthers(option)) {
      const trimmedVal = value.trim();
      if (trimmedVal !== option.value) {
        // Check duplicate
        const dup = await Option.findOne({ _id: { $ne: option._id }, type: option.type, value: trimmedVal });
        if (dup) {
          return res.status(400).json({ error: `同種別の項目（コード: ${trimmedVal}）が既に存在します。` });
        }
        option.value = trimmedVal;
      }
    }
    if (defaultAdvancerCategory !== undefined) option.defaultAdvancerCategory = defaultAdvancerCategory;
    if (defaultBearingParty !== undefined) option.defaultBearingParty = defaultBearingParty;
    if (defaultPaymentMethod !== undefined) option.defaultPaymentMethod = defaultPaymentMethod;
    if (order !== undefined) option.order = order;

    await option.save();
    res.json(option);
  } catch (err) {
    console.error('Error updating option:', err);
    res.status(500).json({ error: '項目の更新に失敗しました。' });
  }
});

// DELETE /api/options/:id - Delete an option
router.delete('/:id', requireRole('account', 'admin'), async (req, res) => {
  try {
    const option = await Option.findById(req.params.id);
    if (!option) {
      return res.status(404).json({ error: '対象の項目が見つかりません。' });
    }

    // Protect 'others' from deletion
    if (isOthers(option)) {
      return res.status(400).json({ error: '「その他」はシステムの基本項目のため削除できません。' });
    }

    await Option.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '項目を削除しました。' });
  } catch (err) {
    console.error('Error deleting option:', err);
    res.status(500).json({ error: '項目の削除に失敗しました。' });
  }
});

export default router;
