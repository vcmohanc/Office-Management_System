import express from 'express';
import Option from '../models/Option.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const options = await Option.find();

    const isOthers = (o) => {
      const v = (o.value || '').toLowerCase();
      const l = (o.label || '').toLowerCase();
      return v === 'others' || v === 'other' || v === 'その他' || l === 'others' || l === 'other' || l === 'その他';
    };

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

export default router;
