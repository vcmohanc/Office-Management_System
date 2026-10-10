import express from 'express';
import PostalCharge from '../models/PostalCharge.js';
import TravelCharge from '../models/TravelCharge.js';
import Region from '../models/Region.js';
import Option from '../models/Option.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to safely check if string is a valid MongoDB ObjectId
const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

// GET /api/expenses/postal-rates (Prefecture NxN matrix)
router.get('/postal-rates', async (req, res) => {
  try {
    const option = await Option.findOne({ type: 'POSTAL_RATE_MATRIX' });
    if (option && option.value) {
      try {
        return res.json(JSON.parse(option.value));
      } catch (e) {
        return res.json({});
      }
    }
    res.json({});
  } catch (error) {
    console.error('Error fetching postal rates matrix:', error);
    res.status(500).json({ message: 'Server error fetching postal rates matrix' });
  }
});

// PUT /api/expenses/postal-rates
router.put('/postal-rates', requireRole('admin', 'account'), async (req, res) => {
  try {
    const rates = req.body;
    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ message: 'Invalid payload: expected rates dictionary' });
    }

    await Option.findOneAndUpdate(
      { type: 'POSTAL_RATE_MATRIX' },
      { type: 'POSTAL_RATE_MATRIX', label: 'Postage Rate Matrix', value: JSON.stringify(rates) },
      { upsert: true, new: true }
    );

    res.json({ message: 'Postal rates matrix saved successfully' });
  } catch (error) {
    console.error('Error saving postal rates matrix:', error);
    res.status(500).json({ message: 'Server error saving postal rates matrix' });
  }
});

// GET /api/expenses/japanese-regions (Hierarchical regions & prefectures)
router.get('/japanese-regions', async (req, res) => {
  try {
    const option = await Option.findOne({ type: 'JAPANESE_REGIONS_CONFIG' });
    if (option && option.value) {
      try {
        const parsed = JSON.parse(option.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json(parsed);
        }
      } catch (e) {
        return res.json([]);
      }
    }
    res.json([]);
  } catch (error) {
    console.error('Error fetching Japanese regions config:', error);
    res.status(500).json({ message: 'Server error fetching Japanese regions' });
  }
});

// PUT /api/expenses/japanese-regions
router.put('/japanese-regions', requireRole('admin', 'account'), async (req, res) => {
  try {
    const regions = req.body;
    if (!Array.isArray(regions)) {
      return res.status(400).json({ message: 'Invalid payload: expected regions array' });
    }

    await Option.findOneAndUpdate(
      { type: 'JAPANESE_REGIONS_CONFIG' },
      { type: 'JAPANESE_REGIONS_CONFIG', label: 'Japanese Regions Configuration', value: JSON.stringify(regions) },
      { upsert: true, new: true }
    );

    res.json({ message: 'Japanese regions configuration saved successfully' });
  } catch (error) {
    console.error('Error saving Japanese regions config:', error);
    res.status(500).json({ message: 'Server error saving Japanese regions' });
  }
});

// GET /api/expenses/travel-rates (Prefecture NxN travel matrix)
router.get('/travel-rates', async (req, res) => {
  try {
    const option = await Option.findOne({ type: 'TRAVEL_RATE_MATRIX' });
    if (option && option.value) {
      try {
        return res.json(JSON.parse(option.value));
      } catch (e) {
        return res.json({});
      }
    }
    res.json({});
  } catch (error) {
    console.error('Error fetching travel rates matrix:', error);
    res.status(500).json({ message: 'Server error fetching travel rates matrix' });
  }
});

// PUT /api/expenses/travel-rates
router.put('/travel-rates', requireRole('admin', 'account'), async (req, res) => {
  try {
    const rates = req.body;
    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ message: 'Invalid payload: expected rates dictionary' });
    }

    await Option.findOneAndUpdate(
      { type: 'TRAVEL_RATE_MATRIX' },
      { type: 'TRAVEL_RATE_MATRIX', label: 'Travel Rate Matrix', value: JSON.stringify(rates) },
      { upsert: true, new: true }
    );

    res.json({ message: 'Travel rates matrix saved successfully' });
  } catch (error) {
    console.error('Error saving travel rates matrix:', error);
    res.status(500).json({ message: 'Server error saving travel rates matrix' });
  }
});

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
