import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  expenseType: { type: String, required: true },
  expenseDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  expenseCategory: { type: String, required: true },
  costBearer: { type: String, required: true },
  staffName: { type: String, required: true },
  projectRef: { type: String, default: '' },
  paymentMethod: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'Submitted' }
}, { timestamps: true });

export default mongoose.model('Claim', claimSchema);
