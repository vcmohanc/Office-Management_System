import express from 'express';
import PostalCharge from '../models/PostalCharge.js';
import TravelCharge from '../models/TravelCharge.js';
import Region from '../models/Region.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to safely check if string is a valid MongoDB ObjectId
const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

// GET /api/expenses/postal
router.get('/postal', async (req, res) => {
  try {
    const charges = await PostalCharge.find({}).populate('departure');
    const matrix = {};
    charges.forEach(doc => {
      if (doc.departure && doc.charges) {
        matrix[doc.departure._id] = Object.fromEntries(doc.charges);
      }
    });
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching postal charges:', error);
    res.status(500).json({ message: 'Server error fetching postal charges' });
  }
});

// PUT /api/expenses/postal
router.put('/postal', requireRole('admin', 'account'), async (req, res) => {
  try {
    const matrix = req.body;
    if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) {
      return res.status(400).json({ message: 'Invalid payload: expected an object matrix' });
    }

    for (const [departureId, charges] of Object.entries(matrix)) {
      // Prevent prototype pollution & validate valid MongoDB ID
      if (departureId === '__proto__' || departureId === 'constructor' || departureId === 'prototype') continue;
      if (!isValidObjectId(departureId)) continue;
      if (!charges || typeof charges !== 'object') continue;

      await PostalCharge.findOneAndUpdate(
        { departure: departureId },
        { departure: departureId, charges },
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Postal charges saved successfully' });
  } catch (error) {
    console.error('Error saving postal charges:', error);
    res.status(500).json({ message: 'Server error saving postal charges' });
  }
});

// GET /api/expenses/travel
router.get('/travel', async (req, res) => {
  try {
    const charges = await TravelCharge.find({}).populate('departure');
    const matrix = {};
    charges.forEach(doc => {
      if (doc.departure && doc.charges) {
        matrix[doc.departure._id] = Object.fromEntries(doc.charges);
      }
    });
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching travel charges:', error);
    res.status(500).json({ message: 'Server error fetching travel charges' });
  }
});

// PUT /api/expenses/travel
router.put('/travel', requireRole('admin', 'account'), async (req, res) => {
  try {
    const matrix = req.body;
    if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) {
      return res.status(400).json({ message: 'Invalid payload: expected an object matrix' });
    }

    for (const [departureId, charges] of Object.entries(matrix)) {
      if (departureId === '__proto__' || departureId === 'constructor' || departureId === 'prototype') continue;
      if (!isValidObjectId(departureId)) continue;
      if (!charges || typeof charges !== 'object') continue;

      await TravelCharge.findOneAndUpdate(
        { departure: departureId },
        { departure: departureId, charges },
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Travel charges saved successfully' });
  } catch (error) {
    console.error('Error saving travel charges:', error);
    res.status(500).json({ message: 'Server error saving travel charges' });
  }
});

export default router;
