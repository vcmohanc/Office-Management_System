import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
  type: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: String, required: true },
  defaultAdvancerCategory: { type: String, default: '' },
  defaultBearingParty: { type: String, default: '' },
  defaultPaymentMethod: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Option', optionSchema);
