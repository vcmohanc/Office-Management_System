import mongoose from 'mongoose';

// 郵送費レート表マスタ — 送り元・送り先（都道府県）ごとの上限額
const postageRateSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  amount: { type: Number, required: true },
}, { timestamps: true });

postageRateSchema.index({ origin: 1, destination: 1 }, { unique: true });

export default mongoose.model('PostageRate', postageRateSchema);
