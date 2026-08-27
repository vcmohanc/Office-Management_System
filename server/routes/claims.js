import express from 'express';
import Claim from '../models/Claim.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ message: 'Server error fetching claims' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newClaim = new Claim(req.body);
    const savedClaim = await newClaim.save();
    res.status(201).json(savedClaim);
  } catch (error) {
    console.error('Error saving claim:', error);
    res.status(400).json({ message: 'Failed to save claim', error: error.message });
  }
});

export default router;
