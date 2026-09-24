import express from 'express';
import { z } from 'zod';
import Claim from '../models/Claim.js';
import { requireRole } from '../middleware/auth.js';
import { validateBackendExpenseAmount } from '../utils/amountHelper.js';
import { caseEvents } from '../events.js';
import Settlement from '../models/Settlement.js';

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
  sender: z.string().optional().nullable().or(z.literal('')),
  recipient: z.string().optional().nullable().or(z.literal('')),
  departure: z.string().optional().nullable().or(z.literal('')),
  destination: z.string().optional().nullable().or(z.literal('')),
  transport_method: z.string().optional().nullable().or(z.literal('')),

  total_expense_amount: z.number().min(0),
  currency: z.string().default('JPY'),
  settlement_method: z.string().optional().nullable(),
  expected_settlement_date: z.string().optional().nullable(),
  collection_method: z.string().optional().nullable(),
  installment_plan: z.string().optional().nullable(),
  installment_count: z.number().min(1),
  collection_start_month: z.string().min(1, 'Collection start month is required'),
  monthly_deduction: z.number().min(0),
  hasAccountNotification: z.boolean().optional(),
  supportUpdatedFields: z.array(z.string()).optional()
});

router.post('/', requireRole('admin', 'support'), async (req, res) => {
  try {
    const validatedData = claimSchemaZod.parse(req.body);

    const validation = await validateBackendExpenseAmount(
      validatedData.expense_type, 
      validatedData.expense_amount, 
      {
        sender: validatedData.sender,
        recipient: validatedData.recipient,
        departure: validatedData.departure,
        destination: validatedData.destination,
        transport_method: validatedData.transport_method
      }
    );
    if (!validation.isValid) {
      return res.status(400).json({ message: `Entered amount exceeds the suggested amount of ¥${validation.expected.toLocaleString()}` });
    }

    const today = new Date();
    const year = today.getFullYear();
    
    // Find the highest sequence number for this year
    const lastClaim = await Claim.findOne({
      claim_id: new RegExp(`^CLM-${year}-`)
    }).sort({ claim_id: -1 });
    
    let nextCount = 1;
    if (lastClaim && lastClaim.claim_id) {
      const match = lastClaim.claim_id.match(/CLM-\d{4}-(\d{4})/);
      if (match) {
        nextCount = parseInt(match[1], 10) + 1;
      }
    }
    
    const sequenceNumber = nextCount.toString().padStart(4, '0');
    const claim_id = `CLM-${year}-${sequenceNumber}`;

    const newClaim = new Claim({
      ...validatedData,
      claim_id,
      status: 'Pending',
      hasAccountNotification: true
    });

    const savedClaim = await newClaim.save();
    caseEvents.emit('CASE_REGISTERED', savedClaim);
    res.status(201).json(savedClaim);
  } catch (error) {
    console.error('Error saving claim:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to save claim', error: error.message });
  }
});
router.delete('/:id', requireRole('admin', 'account'), async (req, res) => {
  try {
    const claimId = req.params.id;
    const deletedClaim = await Claim.findByIdAndDelete(claimId);
    if (!deletedClaim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json({ message: 'Claim deleted successfully', deletedClaim });
  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({ message: 'Server error deleting claim', error: error.message });
  }
});
router.put('/:id', requireRole('admin', 'account', 'support'), async (req, res) => {
  try {
    const validatedData = claimSchemaZod.partial().parse(req.body);
    const updatedClaim = await Claim.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );
    if (!updatedClaim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ message: 'Server error updating claim', error: error.message });
  }
});

router.patch('/:id/status', requireRole('admin', 'account'), async (req, res) => {
  try {
    const { status, statusMessage, newMessage, clearSupportUpdatedFields, hasSupportNotification } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    let updateQuery = { $set: { status } };
    if (statusMessage !== undefined) {
      updateQuery.$set.statusMessage = statusMessage;
    }
    if (clearSupportUpdatedFields) {
      updateQuery.$set.supportUpdatedFields = [];
    }
    if (hasSupportNotification) {
      updateQuery.$set.hasSupportNotification = true;
    }
    
    if (newMessage) {
      // Whitelist fields to prevent arbitrary subdocument injection
      const { text, date, author } = newMessage;
      updateQuery.$push = { messages: { text, date, author } };
    }

    const updatedClaim = await Claim.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true }
    );
    
    if (!updatedClaim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    
    caseEvents.emit('CASE_UPDATED', updatedClaim);
    
    res.json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({ message: 'Server error updating status' });
  }
});

router.patch('/:id/messages/read', async (req, res) => {
  try {
    const updatedClaim = await Claim.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { "messages.$[].readBySupport": true } },
      { new: true }
    );
    if (!updatedClaim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(updatedClaim);
  } catch (error) {
    console.error('Error updating read status:', error);
    res.status(500).json({ message: 'Server error updating read status' });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const updatedClaim = await Claim.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          messages: {
            text,
            author: author || 'system',
            date: new Date()
          }
        },
        $set: {
          hasSupportNotification: author === 'account_user',
          hasAccountNotification: author === 'support_user'
        }
      },
      { new: true }
    );

    if (!updatedClaim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    caseEvents.emit('CASE_UPDATED', updatedClaim);

    res.status(201).json(updatedClaim.messages);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Server error adding message' });
  }
});

router.post('/:id/deduct-term', requireRole('admin', 'account'), async (req, res) => {
  try {
    const claimId = req.params.id;
    const existingClaim = await Claim.findById(claimId);
    if (!existingClaim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Increment paidTerms
    existingClaim.paidTerms = (existingClaim.paidTerms || 0) + 1;
    
    // Find next pending record and mark it DEDUCTED
    if (existingClaim.installment_records && existingClaim.installment_records.length > 0) {
      const nextPending = existingClaim.installment_records.find(r => r.status === 'PENDING');
      if (nextPending) {
        nextPending.status = 'DEDUCTED';
      }
    }

    // Recalculate pending terms
    const totalTerms = existingClaim.installment_count || 1;
    if (existingClaim.paidTerms >= totalTerms) {
      existingClaim.status = 'Completed';
    } else {
      existingClaim.status = 'Processing';
    }

    await existingClaim.save();
    caseEvents.emit('CASE_UPDATED', existingClaim);

    res.status(200).json({ message: 'Term deducted successfully', claim: existingClaim });
  } catch (error) {
    console.error('Error deducting term:', error);
    res.status(500).json({ message: 'Server error deducting term', error: error.message });
  }
});

// Create a settlement for a claim
router.post('/:id/settle', requireRole('admin', 'account'), async (req, res) => {
  try {
    const claimId = req.params.id;
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

    // Verify claim exists
    const existingClaim = await Claim.findById(claimId);
    if (!existingClaim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Verify financials with floating point tolerance
    const calculatedNet = financials.claimAmount - (financials.deductions || 0);
    if (Math.abs(calculatedNet - financials.netPayable) > 0.01) {
      return res.status(400).json({ message: 'Net payable mismatch' });
    }

    const settlement = new Settlement({
      caseId: claimId,
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

    // Update claim status and installment progress
    existingClaim.paidTerms = (existingClaim.paidTerms || 0) + 1;
    
    // Find next pending record and mark it DEDUCTED
    if (existingClaim.installment_records && existingClaim.installment_records.length > 0) {
      const nextPending = existingClaim.installment_records.find(r => r.status === 'PENDING');
      if (nextPending) {
        nextPending.status = 'DEDUCTED';
      }
    }

    // Parse total terms from installment_count
    const totalTerms = existingClaim.installment_count || 1;
    
    if (existingClaim.paidTerms >= totalTerms) {
      existingClaim.status = 'Completed';
    } else {
      existingClaim.status = 'Processing';
    }
    
    await existingClaim.save();

    res.status(201).json({ message: 'Settlement processed successfully', settlement });
  } catch (error) {
    console.error('Error processing settlement:', error);
    res.status(500).json({ message: 'Server error processing settlement', error: error.message });
  }
});

export default router;
