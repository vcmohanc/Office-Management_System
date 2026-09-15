import express from 'express';
import Settlement from '../models/Settlement.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/case/:caseId', async (req, res) => {
  try {
    const settlements = await Settlement.find({ caseId: req.params.caseId }).sort({ createdAt: -1 });
    res.json(settlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ message: 'Server error fetching settlements' });
  }
});

export default router;
