import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  case_id: { type: String, required: true, unique: true },
  case_type: { type: String, required: true },
  staff_name: { type: String, required: true },
  staff_id: { type: String, required: true },
  location: { type: String, required: true },
  branch_farm_name: { type: String },
  visa_status: { type: String },
  visa_available_time: { type: Date },
  expense_type: { type: String, required: true },
  advancer_category: { type: String, required: true },
  payment_process_type: { type: String, required: true }, // Was advancerName
  bearing_party: { type: String, required: true },
  expense_amount: { type: Number, required: true },
  expense_period_start: { type: Date, required: true },
  expense_period_end: { type: Date, required: true },
  sender: { type: String },
  recipient: { type: String },
  receipts: [{ type: String }],
  remark: { type: String },
  total_expense: { type: Number, required: true },
  currency: { type: String, default: 'JPY' },
  previous_unsettled_balance: { type: Number, default: 0 },
  includeBalance: { type: Boolean, default: false }, // Keeping this one as it wasn't requested changed but is useful
  final_total_amount: { type: Number, required: true },
  settlement_method: { type: String, required: true },
  expected_settlement_date: { type: Date, required: true },
  collection_method: { type: String, required: true },
  installment_plan: { type: String, required: true },
  installment_count: { type: Number, required: true },
  collection_start_month: { type: String, required: true },
  monthly_deduction: { type: Number, required: true },
  paidTerms: { type: Number, default: 0 },
  bouncedCount: { type: Number, default: 0 },
  nextPaymentDate: { type: Date },
  nextPaymentAmount: { type: Number },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Case', caseSchema);
