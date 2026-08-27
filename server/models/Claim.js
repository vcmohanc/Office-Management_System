import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  staffInfo: {
    fullName: { type: String, required: true },
    id: { type: String, required: true },
    location: { type: String, required: true }
  },
  expenseType: { type: String, required: true },
  advancerCategory: { type: String, required: true },
  advancerName: { type: String },
  bearingParty: { type: String, required: true },
  expenseAmount: { type: Number, required: true },
  expensePeriodStart: { type: String },
  expensePeriodEnd: { type: String },
  remark: { type: String },
  receipts: [{ type: String }],
  status: { type: String, default: 'Submitted' }
}, { timestamps: true });

export default mongoose.model('Claim', claimSchema);
