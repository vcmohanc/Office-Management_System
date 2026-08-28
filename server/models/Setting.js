import mongoose from 'mongoose';

// システム設定（分割提案の上限金額など）
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);
