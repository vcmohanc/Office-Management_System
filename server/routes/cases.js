import express from 'express';
import Case from '../models/Case.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ message: 'Server error fetching cases' });
  }
});
router.post('/', async (req, res) => {
  try {
    const newCase = new Case(req.body);
    await newCase.save();
    res.status(201).json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(400).json({ message: 'Error creating case', error: error.message });
  }
});
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updatedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    res.json(updatedCase);
  } catch (error) {
    console.error('Error updating case status:', error);
    res.status(500).json({ message: 'Server error updating status' });
  }
});

export default router;
