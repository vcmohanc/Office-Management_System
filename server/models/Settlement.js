import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  processedBy: { type: String, required: true },
  payeeName: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  destinationDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  financials: {
    claimAmount: { type: Number, required: true },
    deductions: { type: Number, default: 0 },
    netPayable: { type: Number, required: true }
  },
  transactionRefId: { type: String },
  paymentDate: { type: Date, required: true },
  proofDocument: { type: String },
  isConfirmed: { type: Boolean, required: true },
  auditLog: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    user: String
  }]
}, { timestamps: true });

export default mongoose.model('Settlement', settlementSchema);
