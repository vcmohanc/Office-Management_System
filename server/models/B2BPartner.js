import mongoose from 'mongoose';

const B2BPartnerSchema = new mongoose.Schema({
  partner_name: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  contract_start_date: {
    type: Date,
    default: null
  },
  contract_end_date: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Expiring Soon', 'Terminated'],
    required: true
  },
  monthly_revenue: {
    type: Number,
    default: 0.00
  }
}, { timestamps: true });

export default mongoose.model('B2BPartner', B2BPartnerSchema);
