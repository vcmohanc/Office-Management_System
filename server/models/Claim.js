import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  claim_id: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  staff_id: { type: String, required: true },
  location: { type: String, required: true },
  branch_farm_name: { type: String, default: '' },
  visa_status: { type: String, default: '' },
  visa_available_time: { type: Date, default: null },

  expense_type: { type: String, required: true },
  advancer_category: { type: String, required: true },
  payment_process_types: { type: String, default: '' },
  bearing_party: { type: String, required: true },
  expense_amount: { type: Number, required: true },
  expense_period_start: { type: Date, default: null },
  expense_period_end: { type: Date, default: null },
  bill_receipt_url: [{ type: String }],
  remarks: { type: String, default: '' },

  total_expense_amount: { type: Number, required: true },
  currency: { type: String, default: 'JPY' },
  settlement_method: { type: String, default: '' },
  expected_settlement_date: { type: Date, default: null },
  collection_method: { type: String, default: '' },
  installment_plan: { type: String, default: '' },
  installment_count: { type: Number, required: true },
  collection_start_month: { type: String, required: true },
  monthly_deduction: { type: Number, required: true },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Claim', claimSchema);
