import express from 'express';
import { z } from 'zod';
import Resignation from '../models/Resignation.js';
import Employee from '../models/Employee.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

const resignationSchemaZod = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  status: z.enum(['In Progress', '完了', 'キャンセル']).default('In Progress'),
  reasonType: z.string().min(1, 'Reason type is required'),
  reasonDetail: z.string().optional().nullable(),
  submitDate: z.coerce.date().optional().nullable(),
  resignationDate: z.coerce.date().optional().nullable(),
  lastWorkingDate: z.coerce.date().optional().nullable(),
  usePaidLeave: z.boolean().optional().nullable(),
  fireReason: z.string().optional().nullable(),
  fireNoticeDate: z.coerce.date().optional().nullable(),
  payFireAllowance: z.boolean().optional().nullable(),
  visaNoticeDate: z.coerce.date().optional().nullable(),
  returnDate: z.coerce.date().optional().nullable(),
  departureDate: z.coerce.date().optional().nullable(),
  accountStopDate: z.coerce.date().optional().nullable(),
  interviewEnabled: z.boolean().optional().nullable(),
  interviewDate: z.string().optional().nullable(),
  interviewTime: z.string().optional().nullable(),
  interviewPerson: z.string().optional().nullable(),
  interviewType: z.string().optional().nullable(),
  interviewUrl: z.string().optional().nullable(),
  interviewMemo: z.string().optional().nullable(),
  finalPayDate: z.coerce.date().optional().nullable(),
  hasSeverance: z.boolean().optional().nullable(),
  severanceAmount: z.number().optional().nullable()
});

// GET all resignations with populated employee data (Admin and HR only)
router.get('/', requireRole('admin', 'hr'), async (req, res) => {
  try {
    const resignations = await Resignation.find().populate('employeeId');
    res.json(resignations);
  } catch (error) {
    console.error('Error fetching resignations:', error);
    res.status(500).json({ message: 'Server error fetching resignations' });
  }
});

// POST a new resignation (Admin and HR only)
router.post('/', requireRole('admin', 'hr'), async (req, res) => {
  try {
    const validatedData = resignationSchemaZod.parse(req.body);
    const newResignation = new Resignation(validatedData);
    const savedResignation = await newResignation.save();

    // Also update the employee to reflect they are in the resignation process
    if (validatedData.employeeId) {
      await Employee.findByIdAndUpdate(validatedData.employeeId, {
        resignationStatus: validatedData.status,
        resignationData: validatedData
      });
    }

    res.status(201).json(savedResignation);
  } catch (error) {
    console.error('Error creating resignation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.issues || error.errors });
    }
    res.status(500).json({ message: 'Server error creating resignation' });
  }
});

export default router;
