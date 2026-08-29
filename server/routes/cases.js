import express from 'express';
import Case from '../models/Case.js';
import Settlement from '../models/Settlement.js';

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

