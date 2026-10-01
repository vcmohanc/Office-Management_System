import express from 'express';
import Resignation from '../models/Resignation.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// GET all resignations with populated employee data
router.get('/', async (req, res) => {
  try {
    const resignations = await Resignation.find().populate('employeeId');
    res.json(resignations);
  } catch (error) {
    console.error('Error fetching resignations:', error);
    res.status(500).json({ message: 'Server error fetching resignations' });
  }
});

// POST a new resignation
router.post('/', async (req, res) => {
  try {
    const newResignation = new Resignation(req.body);
    const savedResignation = await newResignation.save();

    // Also update the employee to reflect they are in the resignation process
    if (req.body.employeeId) {
      await Employee.findByIdAndUpdate(req.body.employeeId, {
        resignationStatus: req.body.status,
        resignationData: req.body
      });
    }

    res.status(201).json(savedResignation);
  } catch (error) {
    console.error('Error creating resignation:', error);
    res.status(500).json({ message: 'Server error creating resignation' });
  }
});

export default router;
