import mongoose from 'mongoose';

const settlementLedgerSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true, index: true },
  staffId: { type: String, required: true, index: true },
  payeeName: { type: String, required: true },
  baseClaimAmount: { type: Number, required: true },
  agreedTerms: {
    settlementMethod: { type: String, enum: ['bank_transfer', 'cash'], required: true },
    installmentPlan: { type: String, required: true },
    installmentTotalTerms: { type: Number, required: true },
    startMonth: { type: Date, required: true }
  },
  status: { type: String, enum: ['draft', 'in_progress', 'completed', 'cancelled'], default: 'draft' }
}, { timestamps: true });

export default mongoose.model('SettlementLedger', settlementLedgerSchema, 'settlement_ledgers');
