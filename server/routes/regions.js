import express from 'express';
import { z } from 'zod';
import Region from '../models/Region.js';
import PostalCharge from '../models/PostalCharge.js';
import TravelCharge from '../models/TravelCharge.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

const regionSchemaZod = z.object({
  name1: z.string().trim().min(1, 'Region name 1 is required').max(100),
  name2: z.string().trim().min(1, 'Region name 2 is required').max(100)
});

// GET /api/regions
router.get('/', async (req, res) => {
  try {
    const regions = await Region.find({}).sort({ createdAt: 1 });
    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ message: 'Server error fetching regions' });
  }
});

// POST /api/regions
router.post('/', requireRole('admin', 'account'), async (req, res) => {
  try {
    const validatedData = regionSchemaZod.parse(req.body);
    const region = new Region(validatedData);
    await region.save();
    res.status(201).json(region);
  } catch (error) {
    console.error('Error creating region:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.issues || error.errors });
    }
    res.status(500).json({ message: 'Server error creating region' });
  }
});         

// PUT /api/regions/:id
router.put('/:id', requireRole('admin', 'account'), async (req, res) => {
  try {
    const validatedData = regionSchemaZod.partial().parse(req.body);
    const region = await Region.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true }
    );
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    res.json(region);
  } catch (error) {
    console.error('Error updating region:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.issues || error.errors });
    }
    res.status(500).json({ message: 'Server error updating region' });
  }
});

// DELETE /api/regions/:id
router.delete('/:id', requireRole('admin', 'account'), async (req, res) => {
  try {
    const regionId = req.params.id;
    const region = await Region.findByIdAndDelete(regionId);
    
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    // Also remove associated matrices where this region is the departure
    await PostalCharge.findOneAndDelete({ departure: regionId });
    await TravelCharge.findOneAndDelete({ departure: regionId });

    res.json({ message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    res.status(500).json({ message: 'Server error deleting region' });
  }
});

export default router;
