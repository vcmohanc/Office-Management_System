import express from 'express';
import ExpenseSetup from '../models/ExpenseSetup.js';

const router = express.Router();

// Get specific type configuration
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (type !== 'postal' && type !== 'travel') {
      return res.status(400).json({ message: 'Invalid setup type' });
    }
    
    const setup = await ExpenseSetup.findOne({ type });
    if (!setup) {
      return res.json({ data: null });
    }
    
    res.json({ data: setup.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update or create configuration
router.put('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { data } = req.body;
    
    if (type !== 'postal' && type !== 'travel') {
      return res.status(400).json({ message: 'Invalid setup type' });
    }

    const setup = await ExpenseSetup.findOneAndUpdate(
      { type },
      { data },
      { new: true, upsert: true }
    );
    
    res.json(setup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
