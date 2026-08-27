import express from 'express';
import Option from '../models/Option.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const options = await Option.find();
    res.json(options);
  } catch (err) {
    console.error('Error fetching options:', err);
    res.status(500).json({ error: 'Server error fetching options' });
  }
});

export default router;
