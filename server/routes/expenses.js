import express from 'express';
import PostalCharge from '../models/PostalCharge.js';
import TravelCharge from '../models/TravelCharge.js';

const router = express.Router();

// GET /api/expenses/postal
router.get('/postal', async (req, res) => {
  try {
    const charges = await PostalCharge.find({});
    const matrix = {};
    charges.forEach(doc => {
      // Map stores data in a slightly different format, convert to standard object
      matrix[doc.departure] = Object.fromEntries(doc.charges);
    });
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching postal charges:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/expenses/postal
router.put('/postal', async (req, res) => {
  try {
    const matrix = req.body;
    for (const [departure, charges] of Object.entries(matrix)) {
      await PostalCharge.findOneAndUpdate(
        { departure },
        { departure, charges },
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Postal charges saved successfully' });
  } catch (error) {
    console.error('Error saving postal charges:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/expenses/travel
router.get('/travel', async (req, res) => {
  try {
    const charges = await TravelCharge.find({});
    const matrix = {};
    charges.forEach(doc => {
      matrix[doc.departure] = Object.fromEntries(doc.charges);
    });
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching travel charges:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/expenses/travel
router.put('/travel', async (req, res) => {
  try {
    const matrix = req.body;
    for (const [departure, charges] of Object.entries(matrix)) {
      await TravelCharge.findOneAndUpdate(
        { departure },
        { departure, charges },
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Travel charges saved successfully' });
  } catch (error) {
    console.error('Error saving travel charges:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
