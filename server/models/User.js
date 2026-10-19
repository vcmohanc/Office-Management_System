import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'employee' },
  tokenVersion: { type: Number, default: 0 },
  assignedPartners: [{ type: String, trim: true }],
  assignedBranches: [{ type: String, trim: true }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
