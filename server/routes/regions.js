import express from 'express';
import Region from '../models/Region.js';
import PostalCharge from '../models/PostalCharge.js';
import TravelCharge from '../models/TravelCharge.js';
import { requireRole } from '../middleware/auth.js';

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
router.post('/', requireRole('admin'), async (req, res) => {
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

// PUT /api/regions/:id
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { name1, name2 } = req.body;
    const region = await Region.findByIdAndUpdate(
      req.params.id,
      { name1, name2 },
      { new: true }
    );
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    res.json(region);
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/regions/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const regionId = req.params.id;
    const region = await Region.findByIdAndDelete(regionId);
    
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    // Also remove associated matrices where this region is the departure
    await PostalCharge.findOneAndDelete({ departure: regionId });
    await TravelCharge.findOneAndDelete({ departure: regionId });

    // Note: We don't strictly need to iterate over all other charges to unset the destination key,
    // because the frontend checks if both departure and destination IDs exist in `regions` before attempting to look up costs.

    res.json({ message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
