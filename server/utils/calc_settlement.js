import mongoose from 'mongoose';
import SettlementLedger from '../models/SettlementLedger.js';
import SettlementClaimItem from '../models/SettlementClaimItem.js';
import SettlementPayment from '../models/SettlementPayment.js';

/**
 * Generates the settlement ledger, claim items, and payment terms for a case.
 * 
 * @param {Object} caseDoc - The case document
 */
export const generateLedgerForCase = async (caseDoc) => {
  try {
    // Check if ledger already exists
    const existingLedger = await SettlementLedger.findOne({ caseId: caseDoc._id });
    if (existingLedger) {
      console.log(`Ledger already exists for case ${caseDoc._id}`);
      return existingLedger;
    }

    // Determine settlement method
    let settlementMethod = 'bank_transfer';
    const rawMethod = (caseDoc.settlement_method || caseDoc.collection_method || '').toLowerCase();
    if (rawMethod.includes('cash')) settlementMethod = 'cash';

    let startMonthDate = new Date();
    if (caseDoc.collection_start_month) {
      // Assuming format is YYYY-MM
      startMonthDate = new Date(caseDoc.collection_start_month + '-01');
    } else if (caseDoc.expense_period_start) {
        startMonthDate = new Date(caseDoc.expense_period_start);
    }

    // 1. Create Ledger
    const ledger = new SettlementLedger({
      caseId: caseDoc._id,
      staffId: caseDoc.staff_id || 'N/A',
      payeeName: caseDoc.staff_name || 'N/A',
      baseClaimAmount: caseDoc.final_total_amount || caseDoc.total_expense || 0,
      agreedTerms: {
        settlementMethod: settlementMethod,
        installmentPlan: caseDoc.installment_plan || 'Custom',
        installmentTotalTerms: caseDoc.installment_count || 1,
        startMonth: startMonthDate
      },
      status: 'in_progress'
    });
    
    await ledger.save();

    // 2. Create Claim Item (representing the base expense)
    const claim = new SettlementClaimItem({
      caseId: caseDoc._id,
      lineNo: 1,
      claimRef: caseDoc.case_id || caseDoc._id.toString(),
      description: caseDoc.expense_type || 'General Expense',
      claimDate: caseDoc.expense_period_start || caseDoc.createdAt || new Date(),
      amount: ledger.baseClaimAmount
    });

    await claim.save();

    // 3. Create Payment Terms
    const totalTerms = ledger.agreedTerms.installmentTotalTerms;
    const baseAmount = ledger.baseClaimAmount;
    
    // Determine the monthly deduction amount
    let termAmount = caseDoc.monthly_deduction || Math.round(baseAmount / totalTerms);
    
    let accumulated = 0;
    const payments = [];

    for (let i = 1; i <= totalTerms; i++) {
      let currentTermAmount = termAmount;
      
      // If it's the last term, assign the remaining balance
      if (i === totalTerms) {
        currentTermAmount = Math.max(0, baseAmount - accumulated);
      } else if (accumulated + currentTermAmount > baseAmount) {
        // Prevent overcharging if monthly_deduction is unusually high
        currentTermAmount = Math.max(0, baseAmount - accumulated);
      }

      const dueMonth = new Date(startMonthDate);
      dueMonth.setMonth(dueMonth.getMonth() + (i - 1));

      const payment = new SettlementPayment({
        caseId: caseDoc._id,
        termNo: i,
        dueMonth: dueMonth,
        netPayable: currentTermAmount,
        status: 'pending'
      });

      payments.push(payment);
      accumulated += currentTermAmount;
    }

    await SettlementPayment.insertMany(payments);
    console.log(`Generated ledger and ${payments.length} payment terms for case ${caseDoc._id}`);
    
    return ledger;

  } catch (error) {
    console.error(`Error generating ledger for case ${caseDoc._id}:`, error);
    throw error;
  }
};
