import mongoose from 'mongoose';

// サービススタッフマスタ（立替者・対象の選択元）
const staffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, default: '在籍中' },
}, { timestamps: true });

export default mongoose.model('Staff', staffSchema);
