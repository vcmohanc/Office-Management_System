import mongoose from 'mongoose';

const B2BPartnerSchema = new mongoose.Schema({
  partner_name: { type: String, required: true, trim: true },
  industry:     { type: String, required: true, trim: true },
  priority:     { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Expiring Soon', 'Terminated'],
    required: true,
  },
  contract_start_date: { type: Date, default: null },
  contract_end_date:   { type: Date, default: null },
  monthly_revenue:     { type: Number, default: 0 },
  contact_name:        { type: String, default: '', trim: true },
  contact_email:       { type: String, default: '', trim: true, lowercase: true },
  contact_phone:       { type: String, default: '', trim: true },
  website:             { type: String, default: '', trim: true },
  notes:               { type: String, default: '', trim: true },
  workplaceCategories: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.model('B2BPartner', B2BPartnerSchema);
