import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SettlementLedger from './models/SettlementLedger.js';
import SettlementClaimItem from './models/SettlementClaimItem.js';
import SettlementPayment from './models/SettlementPayment.js';

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system';

const seedData = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    await SettlementLedger.deleteMany({});
    await SettlementClaimItem.deleteMany({});
    await SettlementPayment.deleteMany({});
    console.log('Cleared existing settlement data');

    const caseId = '19E3E8';
    const staffId = 'STF272CBF';
    const baseClaimAmount = 16667;
    const totalTerms = 3;
    const startMonth = new Date('2026-11-01');
    
    const ledger = new SettlementLedger({
      caseId,
      staffId,
      payeeName: 'Kimura Takuya',
      baseClaimAmount,
      agreedTerms: {
        settlementMethod: 'bank_transfer',
        installmentPlan: 'payroll_deduction',
        installmentTotalTerms: totalTerms,
        startMonth
      },
      status: 'in_progress'
    });
    
    await ledger.save();
    console.log('Inserted SettlementLedger');

    const claimItem = new SettlementClaimItem({
      caseId,
      lineNo: 1,
      claimRef: '#77A15A',
      description: 'WIFI',
      claimDate: new Date('2026-09-02'),
      amount: 50000
    });
    
    await claimItem.save();
    console.log('Inserted SettlementClaimItem');

    // Pre-generate pending terms
    let remaining = baseClaimAmount;
    for (let i = 1; i <= totalTerms; i++) {
      let netPayable = Math.floor(baseClaimAmount / totalTerms);
      if (i === 1) { // Unequal split example: remainder goes to first term
        netPayable += (baseClaimAmount % totalTerms); 
      }
      
      const dueMonth = new Date(startMonth);
      dueMonth.setMonth(dueMonth.getMonth() + (i - 1));

      const term = new SettlementPayment({
        caseId,
        termNo: i,
        dueMonth,
        netPayable,
        status: 'pending'
      });
      await term.save();
    }
    console.log('Pre-generated 3 terms');

    // Mark Term 1 as paid to demonstrate partial completion
    const term1 = await SettlementPayment.findOne({ caseId, termNo: 1 });
    term1.status = 'paid';
    term1.paymentMethod = 'bank_transfer';
    term1.paymentDate = new Date('2026-09-15');
    term1.transactionRef = 'TXN-001';
    term1.remainingBalanceAfter = baseClaimAmount - term1.netPayable;
    await term1.save();
    
    console.log('Marked Term 1 as paid');

    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
