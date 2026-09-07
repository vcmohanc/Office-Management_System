import express from 'express';
import Region from '../models/Region.js';

const router = express.Router();

// GET /api/regions
router.get('/', async (req, res) => {
  try {
    const regions = await Region.find({}).sort({ createdAt: 1 });
    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/regions
router.post('/', async (req, res) => {
  try {
    const { name1, name2 } = req.body;
    const region = new Region({ name1, name2 });
    await region.save();
    res.status(201).json(region);
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
