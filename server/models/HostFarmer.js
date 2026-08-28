import mongoose from 'mongoose';

// 派遣先・農家マスタ（立替者・対象・請求先の選択元）
const hostFarmerSchema = new mongoose.Schema({
  hostId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, default: '契約中' },
}, { timestamps: true });

export default mongoose.model('HostFarmer', hostFarmerSchema);
