import express from 'express';
import { z } from 'zod';
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

const claimSchemaZod = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  staff_id: z.string().min(1, 'Staff ID is required'),
  location: z.string().min(1, 'Location is required'),
  branch_farm_name: z.string().optional().nullable(),
  visa_status: z.string().optional().nullable(),
  visa_available_time: z.string().optional().nullable(),

  expense_type: z.string().min(1, 'Expense type is required'),
  advancer_category: z.string().min(1, 'Advancer category is required'),
  payment_process_types: z.string().optional().nullable(),
  bearing_party: z.string().min(1, 'Bearing party is required'),
  expense_amount: z.number().min(0),
  expense_period_start: z.string().optional().nullable(),
  expense_period_end: z.string().optional().nullable(),
  bill_receipt_url: z.array(z.string()).optional(),
  remarks: z.string().optional().nullable(),

  total_expense_amount: z.number().min(0),
  currency: z.string().default('JPY'),
  settlement_method: z.string().optional().nullable(),
  expected_settlement_date: z.string().optional().nullable(),
  collection_method: z.string().optional().nullable(),
  installment_plan: z.string().optional().nullable(),
  installment_count: z.number().min(1),
  collection_start_month: z.string().min(1, 'Collection start month is required'),
  monthly_deduction: z.number().min(0)
});

router.post('/', async (req, res) => {
  try {
    const validatedData = claimSchemaZod.parse(req.body);

    const today = new Date();
    const year = today.getFullYear();
    const count = await Claim.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    
    const sequenceNumber = (count + 1).toString().padStart(4, '0');
    const claim_id = `CLM-${year}-${sequenceNumber}`;

    const newClaim = new Claim({
      ...validatedData,
      claim_id,
      status: 'Pending'
    });

    const savedClaim = await newClaim.save();
    res.status(201).json(savedClaim);
  } catch (error) {
    console.error('Error saving claim:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to save claim', error: error.message });
  }
});

export default router;
