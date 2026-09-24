import mongoose from 'mongoose';
import SettlementLedger from '../models/SettlementLedger.js';
import SettlementClaimItem from '../models/SettlementClaimItem.js';
import SettlementPayment from '../models/SettlementPayment.js';
import { z } from 'zod';

const payTermSchema = z.object({
  paymentMethod: z.enum(['bank_transfer', 'cash']),
  bankDetails: z.object({
    bankName: z.string().optional(),
    branchCode: z.string().optional(),
    accountNumber: z.string().optional()
  }).optional(),
  transactionRef: z.string().nullable().optional(),
  paymentDate: z.coerce.date(),
  deductionAmount: z.number().min(0).default(0),
  deductionReason: z.string().optional()
}).refine(data => {
  if (data.paymentMethod === 'bank_transfer') {
    return data.bankDetails?.bankName && data.bankDetails?.branchCode && data.bankDetails?.accountNumber;
  }
  return true;
}, {
  message: "Bank details are required when payment method is bank_transfer",
  path: ["bankDetails"]
});

export const getLedger = async (req, res) => {
  try {
    const { caseId } = req.params;

    const ledger = await SettlementLedger.findOne({ caseId });
    if (!ledger) {
      return res.status(404).json({ error: 'Ledger not found for this case' });
    }

    const claims = await SettlementClaimItem.find({ caseId }).sort({ lineNo: 1 });
    const payments = await SettlementPayment.find({ caseId }).sort({ termNumber: 1 });

    const totalPaid = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.paidAmount + p.deductionAmount), 0);
      
    const remainingBalance = ledger.baseClaimAmount - totalPaid;

    const paidTermsCount = payments.filter(p => p.status === 'PAID').length;
    const currentTerm = Math.min(paidTermsCount + 1, ledger.agreedTerms.installmentTotalTerms);

    res.json({
      ledger,
      claims,
      payments,
      summary: {
        currentTerm,
        remainingBalance
      }
    });

  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ error: 'Server error fetching ledger' });
  }
};

export const payTerm = async (req, res) => {
  try {
    const { caseId, termNo } = req.params;
    const termNumber = parseInt(termNo, 10);
    const validation = payTermSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const data = validation.data;
    
    const ledger = await SettlementLedger.findOne({ caseId });
    if (!ledger) {
      return res.status(404).json({ error: 'Ledger not found' });
    }

    const term = await SettlementPayment.findOne({ caseId, termNumber });
    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }

    if (term.status === 'PAID') {
      return res.status(400).json({ error: 'Term is already paid' });
    }

    // Update term
    term.status = 'PAID';
    term.paymentDate = data.paymentDate;
    if (data.paymentMethod === 'bank_transfer') {
      term.bankDetails = data.bankDetails;
    }
    term.transactionRef = data.transactionRef;
    term.deductionAmount = data.deductionAmount;
    term.deductionReason = data.deductionReason || null;
    term.paidAmount = term.scheduledAmount - term.deductionAmount;
    term.approvedBy = req.user?.id;
    term.approvedAt = new Date();

    // Check if all terms are paid
    const allPayments = await SettlementPayment.find({ caseId }).sort({ termNumber: 1 });
    const allPaid = allPayments.every(p => 
      p.termNumber === term.termNumber ? true : p.status === 'PAID'
    );
    
    if (allPaid) {
      ledger.status = 'completed';
    } else if (ledger.status === 'draft') {
      ledger.status = 'in_progress';
    }
    await ledger.save();
    await term.save();

    res.json(term);

  } catch (error) {
    console.error('Error paying term:', error);
    res.status(500).json({ error: 'Server error paying term' });
  }
};

export const payRemainingBalance = async (req, res) => {
  try {
    const { caseId } = req.params;
    const validation = payTermSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const data = validation.data;
    
    const ledger = await SettlementLedger.findOne({ caseId });
    if (!ledger) {
      return res.status(404).json({ error: 'Ledger not found' });
    }

    const pendingTerms = await SettlementPayment.find({ caseId, status: { $ne: 'PAID' } });
    
    if (pendingTerms.length === 0) {
      return res.status(400).json({ error: 'No pending terms to pay' });
    }

    // Since deductionAmount can't easily be distributed, we just put it on the first pending term or split it.
    // Easiest is just applying to the last term or first. Let's apply deduction 0 to all except first.
    let remainingDeduction = data.deductionAmount || 0;

    for (const term of pendingTerms) {
      term.status = 'PAID';
      term.paymentDate = data.paymentDate;
      if (data.paymentMethod === 'bank_transfer') {
        term.bankDetails = data.bankDetails;
      }
      term.transactionRef = data.transactionRef;
      
      const termDeduction = Math.min(term.scheduledAmount, remainingDeduction);
      term.deductionAmount = termDeduction;
      term.deductionReason = data.deductionReason || null;
      term.paidAmount = term.scheduledAmount - termDeduction;
      remainingDeduction -= termDeduction;

      term.approvedBy = req.user?.id;
      term.approvedAt = new Date();
      await term.save();
    }

    ledger.status = 'completed';
    await ledger.save();

    res.json({ message: 'All remaining terms paid', terms: pendingTerms });
  } catch (error) {
    console.error('Error paying remaining balance:', error);
    res.status(500).json({ error: 'Server error paying remaining balance' });
  }
};

export const updateTermAmount = async (req, res) => {
  try {
    const { caseId, termNo } = req.params;
    const termNumber = parseInt(termNo, 10);
    const { scheduledAmount } = req.body;

    if (typeof scheduledAmount !== 'number' || scheduledAmount < 0) {
      return res.status(400).json({ error: 'Invalid scheduledAmount amount' });
    }

    const term = await SettlementPayment.findOne({ caseId, termNumber });
    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }

    if (term.status === 'PAID') {
      return res.status(400).json({ error: 'Cannot modify a paid term' });
    }

    term.scheduledAmount = scheduledAmount;
    await term.save();

    res.json(term);
  } catch (error) {
    console.error('Error updating term amount:', error);
    res.status(500).json({ error: 'Server error updating term' });
  }
};

// Kept for compatibility if needed, but getLedger returns all payments anyway
export const getPayments = async (req, res) => {
  try {
    const { caseId } = req.params;
    const payments = await SettlementPayment.find({ caseId }).sort({ termNumber: 1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Server error fetching payments' });
  }
};

export const getStaffCases = async (req, res) => {
  try {
    const { staffId } = req.params;
    const ledgers = await SettlementLedger.find({ staffId });
    res.json(ledgers);
  } catch (error) {
    console.error('Error fetching staff cases:', error);
    res.status(500).json({ error: 'Server error fetching staff cases' });
  }
};
