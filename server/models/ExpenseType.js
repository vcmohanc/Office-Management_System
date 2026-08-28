import mongoose from 'mongoose';

// §1-2 費用種別は固定コードではなくマスタ管理（管理者が追加・編集・停止できる）
const extraFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
}, { _id: false });

const expenseTypeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  // 対象区分（固定）— 種別により対象区分が決まる場合のみ設定する
  targetCategory: { type: String, default: null },
  targetCategoryFixed: { type: Boolean, default: false },
  defaultCostBearer: { type: String, default: null },
  standardProcess: { type: String, default: '' },
  // §1-3 種別ごとの入力項目
  extraFields: { type: [extraFieldSchema], default: [] },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('ExpenseType', expenseTypeSchema);
