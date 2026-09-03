import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Case from '../models/Case.js';
import Settlement from '../models/Settlement.js';

const router = express.Router();

const caseSchemaZod = z.object({
  case_type: z.string().min(1),
  staff_name: z.string().min(1),
  staff_id: z.string().min(1),
  location: z.string().min(1),
  branch_farm_name: z.string().optional().nullable().or(z.literal('')),
  visa_status: z.string().optional().nullable().or(z.literal('')),
  visa_available_time: z.coerce.date().optional().nullable().or(z.literal('')),
  expense_type: z.string().min(1),
  advancer_category: z.string().min(1),
  payment_process_type: z.string().min(1),
  bearing_party: z.string().min(1),
  expense_amount: z.number().min(0),
  expense_period_start: z.coerce.date(),
  expense_period_end: z.coerce.date(),
  sender: z.string().optional().nullable().or(z.literal('')),
  recipient: z.string().optional().nullable().or(z.literal('')),
  receipts: z.array(z.string()).optional(),
  remark: z.string().optional().nullable().or(z.literal('')),
  total_expense: z.number(),
  currency: z.string().default('JPY'),
  previous_unsettled_balance: z.number().default(0),
  includeBalance: z.boolean().default(false),
  final_total_amount: z.number(),
  settlement_method: z.string().min(1),
  expected_settlement_date: z.coerce.date(),
  collection_method: z.string().min(1),
  installment_plan: z.string().min(1),
  installment_count: z.number().min(1),
  collection_start_month: z.string().min(1),
  monthly_deduction: z.number().min(0)
}).passthrough();

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
    // Validate request
    const validatedData = caseSchemaZod.parse(req.body);
    
    // Auto-generate case_id if not present
    if (!validatedData.case_id) {
      validatedData.case_id = `CAS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const newCase = new Case(validatedData);
    await newCase.save();
    
    res.status(201).json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    if (error?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error: ' + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), errors: error.errors });
    }
    res.status(400).json({ message: 'Error creating case: ' + error.message, error: error.message });
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

// Create a settlement for a case
router.post('/:id/settle', async (req, res) => {
  try {
    const caseId = req.params.id;
    const {
      processedBy,
      payeeName,
      paymentMethod,
      destinationDetails,
      financials,
      transactionRefId,
      paymentDate,
      proofDocument,
      isConfirmed
    } = req.body;

    if (!isConfirmed) {
      return res.status(400).json({ message: 'Settlement must be confirmed' });
    }

    // Verify case exists
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Verify financials
    const calculatedNet = financials.claimAmount - (financials.deductions || 0);
    if (calculatedNet !== financials.netPayable) {
      return res.status(400).json({ message: 'Net payable mismatch' });
    }

    const settlement = new Settlement({
      caseId,
      processedBy,
      payeeName,
      paymentMethod,
      destinationDetails,
      financials,
      transactionRefId,
      paymentDate,
      proofDocument,
      isConfirmed,
      auditLog: [{
        action: 'Settlement Created',
        user: processedBy
      }]
    });

    await settlement.save();

    // Update case status and installment progress
    existingCase.paidTerms = (existingCase.paidTerms || 0) + 1;
    
    // Parse total terms from installmentPlan (e.g. "12 months" -> 12)
    const totalTerms = existingCase.installmentPlan ? (existingCase.installmentPlan.match(/\d+/) ? parseInt(existingCase.installmentPlan.match(/\d+/)[0], 10) : 1) || 1 : 1;
    
    if (existingCase.paidTerms >= totalTerms) {
      existingCase.status = 'Completed';
    } else {
      existingCase.status = 'Processing';
    }
    
    await existingCase.save();

    res.status(201).json({ message: 'Settlement processed successfully', settlement });
  } catch (error) {
    console.error('Error processing settlement:', error);
    res.status(500).json({ message: 'Server error processing settlement', error: error.message });
  }
});

export default router;

