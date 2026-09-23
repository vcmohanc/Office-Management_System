import mongoose from 'mongoose';

const settlementPaymentSchema = new mongoose.Schema({
  caseId: { type: String, required: true, index: true },
  termNo: { type: Number, required: true },
  dueMonth: { type: Date, required: true },
  netPayable: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  
  // These fields are populated only when the term is paid
  paymentMethod: { type: String, enum: ['bank_transfer', 'cash'] },
  bankDetails: {
    bankName: { type: String },
    branchCode: { type: String },
    accountNumber: { type: String }
  },
  transactionRef: { type: String, default: null },
  paymentDate: { type: Date },
  lessDeductions: { type: Number, default: 0 },
  remainingBalanceAfter: { type: Number },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

settlementPaymentSchema.index({ caseId: 1, termNo: 1 }, { unique: true });

export default mongoose.model('SettlementPayment', settlementPaymentSchema, 'settlement_payments');
