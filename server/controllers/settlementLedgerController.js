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
  lessDeductions: z.number().min(0).default(0)
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
    const payments = await SettlementPayment.find({ caseId }).sort({ termNo: 1 });

    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.netPayable, 0);
      
    const remainingBalance = ledger.baseClaimAmount - totalPaid;

    const paidTermsCount = payments.filter(p => p.status === 'paid').length;
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
    const validation = payTermSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const data = validation.data;
    
    const ledger = await SettlementLedger.findOne({ caseId });
    if (!ledger) {
      return res.status(404).json({ error: 'Ledger not found' });
    }

    const term = await SettlementPayment.findOne({ caseId, termNo });
    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }

    if (term.status === 'paid') {
      return res.status(400).json({ error: 'Term is already paid' });
    }

    // Update term
    term.status = 'paid';
    term.paymentMethod = data.paymentMethod;
    if (data.paymentMethod === 'bank_transfer') {
      term.bankDetails = data.bankDetails;
    }
    term.transactionRef = data.transactionRef;
    term.paymentDate = data.paymentDate;
    term.lessDeductions = data.lessDeductions;
    term.enteredBy = req.user?.id;

    // Calculate remaining balance after this payment
    const allPayments = await SettlementPayment.find({ caseId }).sort({ termNo: 1 });
    let totalPaidSoFar = 0;
    for (const p of allPayments) {
      if (p.status === 'paid' && p.termNo !== term.termNo) {
        totalPaidSoFar += p.netPayable;
      }
    }
    totalPaidSoFar += term.netPayable; // including this one
    term.remainingBalanceAfter = ledger.baseClaimAmount - totalPaidSoFar;

    await term.save();

    // Check if all terms are paid
    const allPaid = allPayments.every(p => 
      p.termNo === term.termNo ? true : p.status === 'paid'
    );
    
    if (allPaid) {
      ledger.status = 'completed';
    } else if (ledger.status === 'draft') {
      ledger.status = 'in_progress';
    }
    await ledger.save();

    res.json(term);

  } catch (error) {
    console.error('Error paying term:', error);
    res.status(500).json({ error: 'Server error paying term' });
  }
};

export const updateTermAmount = async (req, res) => {
  try {
    const { caseId, termNo } = req.params;
    const { netPayable } = req.body;

    if (typeof netPayable !== 'number' || netPayable < 0) {
      return res.status(400).json({ error: 'Invalid netPayable amount' });
    }

    const term = await SettlementPayment.findOne({ caseId, termNo });
    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }

    if (term.status === 'paid') {
      return res.status(400).json({ error: 'Cannot modify a paid term' });
    }

    term.netPayable = netPayable;
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
    const payments = await SettlementPayment.find({ caseId }).sort({ termNo: 1 });
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
