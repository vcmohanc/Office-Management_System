import mongoose from 'mongoose';

// §1-7 精算・回収処理管理機能 — 1件の案件に紐づく個々の処理
const processSchema = new mongoose.Schema({
  method: { type: String, default: '' },
  plannedOn: { type: String, default: '' },   // 精算・回収の予定日
  plannedAmount: { type: Number, default: 0 },
  processedAmount: { type: Number, default: 0 },
  targetMonth: { type: String, default: '' },
  processedOn: { type: String, default: '' },
  handler: { type: String, default: '' },
  status: { type: String, enum: ['未処理', '処理中', '完了', '対象外'], default: '未処理' },
  note: { type: String, default: '' },
}, { _id: false });

// §1-10 分割天引き明細
const installmentSchema = new mongoose.Schema({
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['未処理', '処理中', '完了'], default: '未処理' },
  processedOn: { type: String, default: '' },
}, { _id: false });

// §1-12 派遣先請求・控除
const billingSchema = new mongoose.Schema({
  host: { type: String, default: '' },
  month: { type: String, default: '' },
  staff: { type: String, default: '' },
  type: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  kind: { type: String, enum: ['請求', '控除'], default: '請求' },
  reason: { type: String, default: '' },
  display: { type: String, default: '' },
  status: { type: String, enum: ['未処理', '処理中', '完了'], default: '未処理' },
  processedOn: { type: String, default: '' },
  handler: { type: String, default: '' },
  note: { type: String, default: '' },
}, { _id: false });

// §1-11 退職時の給与天引き管理
const resignationSchema = new mongoose.Schema({
  consentedOn: { type: String, default: '' },
  pledgeAttached: { type: Boolean, default: false },
  confirmedBy: { type: String, default: '' },
  recoverableFromFinalSalary: { type: Boolean, default: true },
  uncollectableAmount: { type: Number, default: 0 },
  followUp: { type: String, default: '' },
  note: { type: String, default: '' },
}, { _id: false });

// §1-13 添付ファイル
const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  kind: { type: String, default: 'その他' },
  storedName: { type: String, default: '' },
  size: { type: Number, default: 0 },
  mimeType: { type: String, default: '' },
  uploadedBy: { type: String, default: '' },
  uploadedAt: { type: String, default: '' },
}, { _id: false });

const commentSchema = new mongoose.Schema({
  by: { type: String, required: true },
  at: { type: String, required: true },
  text: { type: String, required: true },
}, { _id: false });

// §1-21 操作履歴（操作者・操作日時・操作内容・変更前・変更後）
const historySchema = new mongoose.Schema({
  at: { type: String, required: true },
  by: { type: String, required: true },
  action: { type: String, required: true },
  field: { type: String, default: '' },
  before: { type: String, default: '' },
  after: { type: String, default: '' },
}, { _id: false });

const decisionSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  by: { type: String, required: true },
  at: { type: String, required: true },
}, { _id: false });

// §1-1 立替案件登録機能
const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true, index: true },
  registeredBy: { type: String, required: true },
  occurredOn: { type: String, default: '' },

  typeKey: { type: String, required: true },
  type: { type: String, required: true },

  // 立替者・対象・費用負担先は、それぞれ別の情報として管理する（基本業務ルール）
  advancerCategory: { type: String, enum: ['サービススタッフ', '派遣先・農家', 'VC'], required: true },
  advancer: { type: String, default: '' },
  targetCategory: { type: String, enum: ['サービススタッフ', '派遣先・農家', 'その他'], required: true },
  target: { type: String, default: '' },
  costBearerCategory: { type: String, enum: ['サービススタッフ', '派遣先・農家', 'VC'], required: true },
  costBearer: { type: String, default: '' },

  amount: { type: Number, default: 0 },
  reason: { type: String, default: '' },
  detail: { type: String, default: '' },
  note: { type: String, default: '' },
  extras: { type: Map, of: String, default: {} },

  // §1-14 ステータス管理
  status: {
    type: String,
    enum: ['未処理', '処理中', '完了', '差戻し', '保留', '取消'],
    default: '未処理',
  },

  settlement: { type: processSchema, default: () => ({}) },
  recovery: { type: processSchema, default: () => ({}) },

  installments: { type: [installmentSchema], default: [] },
  installmentNote: { type: String, default: '' },
  wantsInstallment: { type: Boolean, default: false },

  billing: { type: billingSchema, default: null },
  resignation: { type: resignationSchema, default: null },

  attachments: { type: [attachmentSchema], default: [] },
  comments: { type: [commentSchema], default: [] },
  history: { type: [historySchema], default: [] },

  rejection: { type: decisionSchema, default: null },
  cancellation: { type: decisionSchema, default: null },
}, { timestamps: true });

// 一覧の既定の並び順と絞り込みでよく使う組み合わせ
caseSchema.index({ occurredOn: -1 });
caseSchema.index({ status: 1, typeKey: 1 });

// 派遣先・農家に関する案件か、スタッフに関する案件かのクイック区分
caseSchema.virtual('group').get(function () {
  return this.targetCategory === '派遣先・農家' ? 'host' : 'staff';
});

caseSchema.set('toJSON', { virtuals: true });
caseSchema.set('toObject', { virtuals: true });

export default mongoose.model('Case', caseSchema);
