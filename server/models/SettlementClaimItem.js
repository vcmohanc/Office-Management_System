import mongoose from 'mongoose';

const settlementClaimItemSchema = new mongoose.Schema({
  caseId: { type: String, required: true, index: true },
  lineNo: { type: Number, required: true },
  claimRef: { type: String, required: true },
  description: { type: String, required: true },
  claimDate: { type: Date, required: true },
  amount: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('SettlementClaimItem', settlementClaimItemSchema, 'settlement_claim_items');
