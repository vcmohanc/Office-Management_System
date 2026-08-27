import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  staffName: { type: String, required: true },
  staffId: { type: String, required: true },
  location: { type: String, required: true },
  expenseType: { type: String, required: true },
  advancerCategory: { type: String, required: true },
  advancerName: { type: String, required: true },
  bearingParty: { type: String, required: true },
  amount: { type: Number, required: true },
  expensePeriodStart: { type: Date, required: true },
  expensePeriodEnd: { type: Date, required: true },
  receipts: [{ type: String }],
  remark: { type: String },
  totalExpense: { type: Number, required: true },
  currency: { type: String, default: 'JPY' },
  previousBalance: { type: Number, default: 0 },
  includeBalance: { type: Boolean, default: false },
  finalTotal: { type: Number, required: true },
  settlementMethod: { type: String, required: true },
  expectedSettlementDate: { type: Date, required: true },
  collectionMethod: { type: String, required: true },
  installmentPlan: { type: String, required: true },
  collectionStartMonth: { type: String, required: true },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Case', caseSchema);
