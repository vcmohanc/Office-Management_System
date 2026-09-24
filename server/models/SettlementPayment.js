import mongoose from 'mongoose';

const settlementPaymentSchema = new mongoose.Schema({
  caseId: { type: String, required: true, index: true },
  termNumber: { type: Number, required: true },
  dueMonth: { type: String, required: true }, // YYYY-MM
  scheduledAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  deductionAmount: { type: Number, default: 0 },
  deductionReason: { type: String, default: null },
  status: { type: String, enum: ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'WAIVED'], default: 'PENDING' },
  
  paymentDate: { type: Date },
  transactionRef: { type: String, default: null },
  
  // Bank details (only for BANK_TRANSFER)
  bankDetails: {
    bankCode: { type: String }, // 4 digits
    bankName: { type: String },
    branchCode: { type: String }, // 3 digits
    branchName: { type: String },
    accountType: { type: String, enum: ['普通', '当座'] },
    accountNumber: { type: String }, // 7 digits
    accountHolderKana: { type: String } // full-width katakana
  },
  
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true });

settlementPaymentSchema.index({ caseId: 1, termNumber: 1 }, { unique: true });

export default mongoose.model('SettlementPayment', settlementPaymentSchema, 'settlement_payments');
