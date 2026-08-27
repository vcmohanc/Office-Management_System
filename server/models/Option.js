import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Option', optionSchema);
