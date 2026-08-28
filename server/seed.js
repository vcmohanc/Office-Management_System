import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Case from './models/Case.js';
import Counter from './models/Counter.js';
import ExpenseType from './models/ExpenseType.js';
import Staff from './models/Staff.js';
import HostFarmer from './models/HostFarmer.js';
import PostageRate from './models/PostageRate.js';
import Setting from './models/Setting.js';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system';

// §種別マスタ（要件定義書）
const EXPENSE_TYPES = [
  {
    key: 'postage', label: '郵送費', targetCategory: 'サービススタッフ', targetCategoryFixed: true,
    defaultCostBearer: 'VC', standardProcess: '本人へ振込', order: 1,
    extraFields: [{ key: 'origin', label: '送り元' }, { key: 'destination', label: '送り先' }],
  },
  {
    key: 'transportation', label: '交通費', targetCategory: 'サービススタッフ', targetCategoryFixed: true,
    defaultCostBearer: 'VC', standardProcess: '本人へ振込', order: 2,
    extraFields: [
      { key: 'departure', label: '出発地' }, { key: 'arrival', label: '到着地' },
      { key: 'usageDate', label: '利用日' }, { key: 'transportMethod', label: '交通手段' },
    ],
  },
  {
    key: 'flight', label: 'フライト代', targetCategory: 'サービススタッフ', targetCategoryFixed: true,
    defaultCostBearer: 'VC', standardProcess: '振込または天引き', order: 3,
    extraFields: [
      { key: 'departure', label: '出発地' }, { key: 'arrival', label: '到着地' },
      { key: 'usageDate', label: '利用日' }, { key: 'transportMethod', label: '交通手段' },
    ],
  },
  {
    key: 'visa', label: 'ビザ申請代', targetCategory: 'サービススタッフ', targetCategoryFixed: true,
    defaultCostBearer: 'VC', standardProcess: '給与天引き', order: 4, extraFields: [],
  },
  {
    key: 'dormitory', label: '待機寮', targetCategory: 'サービススタッフ', targetCategoryFixed: true,
    defaultCostBearer: 'サービススタッフ', standardProcess: '給与天引き', order: 5,
    extraFields: [
      { key: 'dormName', label: '寮名' }, { key: 'startDate', label: '利用開始日' },
      { key: 'endDate', label: '利用終了日' },
    ],
  },
  {
    key: 'equipment', label: '備品', targetCategory: null, targetCategoryFixed: false,
    defaultCostBearer: null, standardProcess: 'ー', order: 6,
    extraFields: [
      { key: 'itemName', label: '備品名' }, { key: 'quantity', label: '数量' },
      { key: 'purchaseDate', label: '購入日' }, { key: 'reason', label: '破損・故障・不足等の理由' },
    ],
  },
  {
    key: 'wifi', label: 'WIFI', targetCategory: '派遣先・農家', targetCategoryFixed: true,
    defaultCostBearer: '派遣先・農家', standardProcess: '派遣先請求', order: 7,
    extraFields: [
      { key: 'targetHost', label: '対象派遣先・農家' }, { key: 'startDate', label: '利用開始日' },
    ],
  },
  {
    key: 'hospital', label: '病院代', targetCategory: 'サービススタッフ', targetCategoryFixed: true,
    defaultCostBearer: 'サービススタッフ', standardProcess: '給与天引き', order: 8,
    extraFields: [
      { key: 'visitDate', label: '受診日' }, { key: 'consultationFee', label: '診察代' },
      { key: 'medicineFee', label: '薬代' },
    ],
  },
  {
    key: 'other', label: 'その他', targetCategory: null, targetCategoryFixed: false,
    defaultCostBearer: null, standardProcess: 'ー', order: 9,
    extraFields: [{ key: 'detail', label: '内容（自由記入）' }],
  },
];

const STAFF = [
  { staffId: 'STF-001', name: '田中 太郎', status: '在籍中' },
  { staffId: 'STF-002', name: '鈴木 花子', status: '在籍中' },
  { staffId: 'STF-003', name: '佐藤 健', status: '在籍中' },
  { staffId: 'STF-004', name: '高橋 誠', status: '在籍中' },
  { staffId: 'STF-005', name: '山田 一郎', status: '休職中' },
];

const HOST_FARMERS = [
  { hostId: 'HST-001', name: 'グリーンファーム農園', status: '契約中' },
  { hostId: 'HST-002', name: 'さくら農園', status: '契約中' },
  { hostId: 'HST-003', name: 'みどり牧場', status: '契約中' },
];

const POSTAGE_RATES = [
  { origin: '東京都', destination: '北海道', amount: 1800 },
  { origin: '東京都', destination: '大阪府', amount: 900 },
  { origin: '東京都', destination: '福岡県', amount: 1500 },
  { origin: '東京都', destination: '沖縄県', amount: 2200 },
  { origin: '大阪府', destination: '東京都', amount: 900 },
  { origin: '大阪府', destination: '福岡県', amount: 1100 },
];

// 4つの処理パターンを網羅したサンプル案件（要件定義書 §13）
const CASES = [
  {
    caseId: 'CAS-2024-0011', registeredBy: '山本 明日香', occurredOn: '2024-05-20',
    typeKey: 'postage', type: '郵送費',
    advancerCategory: 'サービススタッフ', advancer: '田中 太郎',
    targetCategory: 'サービススタッフ', target: '田中 太郎',
    costBearerCategory: 'VC', costBearer: 'VC',
    amount: 4500, reason: '異動に伴う私物の郵送', detail: '東京都 → 北海道（宅配便2箱）',
    extras: { 送り元: '東京都', 送り先: '北海道' },
    attachments: [
      { name: 'receipt_0520.pdf', kind: '領収書', uploadedBy: '山本 明日香', uploadedAt: '2024-05-20 09:30' },
      { name: 'slip_0520.jpg', kind: '配送伝票', uploadedBy: '山本 明日香', uploadedAt: '2024-05-20 09:30' },
    ],
    settlement: {
      method: '本人へ振込', plannedAmount: 4500, processedAmount: 0,
      targetMonth: '2024年6月', status: '未処理', note: '6月給与に上乗せ予定',
    },
    recovery: { method: '回収不要', status: '対象外', note: 'VC負担のため回収なし' },
    comments: [{ by: '佐々木 内容確認', at: '2024-05-21 10:12', text: '配送伝票の宛先を確認しました。問題ありません。' }],
    history: [
      { at: '2024-05-20 09:30', by: '山本 明日香', action: '登録' },
      { at: '2024-05-21 10:12', by: '佐々木 内容確認', action: '承認', field: 'ステータス', before: '未処理', after: '処理中' },
    ],
  },
  {
    caseId: 'CAS-2024-0010', registeredBy: '山本 明日香', occurredOn: '2024-05-19',
    typeKey: 'hospital', type: '病院代',
    advancerCategory: '派遣先・農家', advancer: 'グリーンファーム農園',
    targetCategory: 'サービススタッフ', target: '鈴木 花子',
    costBearerCategory: 'サービススタッフ', costBearer: 'サービススタッフ',
    amount: 12000, reason: '就業中の体調不良による受診', detail: '診察代 8,000円／薬代 4,000円',
    note: '農家が窓口で立替',
    extras: { 受診日: '2024-05-19', 診察代: '8,000', 薬代: '4,000' },
    attachments: [{ name: 'medical_0519.pdf', kind: '診療明細', uploadedBy: '山本 明日香', uploadedAt: '2024-05-19 16:40' }],
    // §1-8 農家への処理は完了、スタッフへの処理は未処理 → 案件全体は「処理中」
    settlement: {
      method: '派遣先への請求額から控除', plannedAmount: 12000, processedAmount: 12000,
      targetMonth: '2024年5月', processedOn: '2024-05-22', handler: '経理 井上',
      status: '完了', note: '5月請求分から控除済み',
    },
    recovery: {
      method: '給与天引き', plannedAmount: 12000, processedAmount: 0,
      targetMonth: '2024年6月', status: '未処理',
    },
    billing: {
      host: 'グリーンファーム農園', month: '2024年5月', staff: '鈴木 花子', type: '病院代',
      amount: 12000, kind: '控除', reason: '農家立替分の精算', display: '立替精算（病院代）',
      status: '完了', processedOn: '2024-05-22', handler: '経理 井上',
    },
    history: [
      { at: '2024-05-19 16:40', by: '山本 明日香', action: '登録' },
      { at: '2024-05-22 11:05', by: '経理 井上', action: '精算処理', field: '立替者への精算', before: '未処理', after: '完了' },
    ],
  },
  {
    caseId: 'CAS-2024-0009', registeredBy: '中村 事務', occurredOn: '2024-05-18',
    typeKey: 'dormitory', type: '待機寮',
    advancerCategory: 'VC', advancer: 'VC',
    targetCategory: 'サービススタッフ', target: '佐藤 健',
    costBearerCategory: 'サービススタッフ', costBearer: 'サービススタッフ',
    amount: 85000, reason: '配属前の待機期間の寮費', detail: '第2待機寮／2024-04-01〜2024-05-15',
    extras: { 寮名: '第2待機寮', 利用開始日: '2024-04-01', 利用終了日: '2024-05-15' },
    attachments: [],
    status: '差戻し',
    settlement: { method: 'VC経費処理', plannedAmount: 85000, status: '対象外', note: 'VC立替のため精算不要' },
    recovery: {
      method: '給与天引き', plannedAmount: 85000, processedAmount: 0,
      targetMonth: '2024年6月〜', status: '未処理', note: '上限金額超過のため分割',
    },
    installments: [
      { month: '2024年6月', amount: 30000, status: '未処理' },
      { month: '2024年7月', amount: 30000, status: '未処理' },
      { month: '2024年8月', amount: 25000, status: '未処理' },
    ],
    installmentNote: '本人希望は3回。詳細は経理担当と調整済み。',
    wantsInstallment: true,
    comments: [{ by: '佐々木 内容確認', at: '2024-05-20 09:02', text: '天引き誓約書の添付をお願いします。' }],
    rejection: { reason: '添付書類（天引き誓約書）が未提出のため、再提出をお願いします。', by: '佐々木 内容確認', at: '2024-05-20 09:02' },
    history: [
      { at: '2024-05-18 13:20', by: '中村 事務', action: '登録' },
      { at: '2024-05-20 09:02', by: '佐々木 内容確認', action: '差戻し', field: 'ステータス', before: '未処理', after: '差戻し' },
    ],
  },
  {
    caseId: 'CAS-2024-0008', registeredBy: '中村 事務', occurredOn: '2024-05-17',
    typeKey: 'wifi', type: 'WIFI',
    advancerCategory: 'VC', advancer: 'VC',
    targetCategory: '派遣先・農家', target: 'グリーンファーム農園',
    costBearerCategory: '派遣先・農家', costBearer: '派遣先・農家',
    amount: 6800, reason: '寮のインターネット回線契約', detail: '2024-05-01 利用開始',
    extras: { 対象派遣先農家: 'グリーンファーム農園', 利用開始日: '2024-05-01' },
    attachments: [{ name: 'invoice_wifi_05.pdf', kind: '請求書', uploadedBy: '中村 事務', uploadedAt: '2024-05-17 10:05' }],
    settlement: {
      method: 'VC経費処理', plannedAmount: 6800, processedAmount: 6800,
      targetMonth: '2024年5月', processedOn: '2024-05-19', handler: '経理 井上', status: '完了',
    },
    recovery: {
      method: '派遣先へ請求', plannedAmount: 6800, processedAmount: 0,
      targetMonth: '2024年5月', status: '処理中', note: '5月請求書に計上予定',
    },
    billing: {
      host: 'グリーンファーム農園', month: '2024年5月', staff: 'ー', type: 'WIFI',
      amount: 6800, kind: '請求', reason: 'VC立替分の請求', display: 'WIFI利用料（5月分）',
      status: '処理中', handler: '経理 井上',
    },
    history: [
      { at: '2024-05-17 10:05', by: '中村 事務', action: '登録' },
      { at: '2024-05-19 15:30', by: '経理 井上', action: '精算処理', field: '立替者への精算', before: '未処理', after: '完了' },
    ],
  },
  {
    caseId: 'CAS-2024-0007', registeredBy: '山本 明日香', occurredOn: '2024-05-16',
    typeKey: 'flight', type: 'フライト代',
    advancerCategory: 'サービススタッフ', advancer: '高橋 誠',
    targetCategory: 'サービススタッフ', target: '高橋 誠',
    costBearerCategory: 'サービススタッフ', costBearer: 'サービススタッフ',
    amount: 68000, reason: '一時帰国のための航空券', detail: '成田 → ハノイ（往復）',
    note: '退職に伴い最終給与で回収予定',
    extras: { 出発地: '成田', 到着地: 'ハノイ', 利用日: '2024-06-10', 交通手段: '航空機' },
    attachments: [
      { name: 'ticket.pdf', kind: '領収書', uploadedBy: '山本 明日香', uploadedAt: '2024-05-16 08:45' },
      { name: 'pledge_takahashi.pdf', kind: '天引き誓約書', uploadedBy: '労務 大西', uploadedAt: '2024-05-30 14:20' },
    ],
    settlement: {
      method: '本人へ振込', plannedAmount: 68000, processedAmount: 68000,
      targetMonth: '2024年5月', processedOn: '2024-05-24', handler: '経理 井上', status: '完了',
    },
    recovery: {
      method: '給与天引き', plannedAmount: 68000, processedAmount: 20000,
      targetMonth: '2024年6月〜', processedOn: '2024-06-25', handler: '経理 井上',
      status: '処理中', note: '分割天引き中',
    },
    installments: [
      { month: '2024年6月', amount: 20000, status: '完了', processedOn: '2024-06-25' },
      { month: '2024年7月', amount: 24000, status: '未処理' },
      { month: '2024年8月', amount: 24000, status: '未処理' },
    ],
    installmentNote: '上限金額超過のため分割を提案。本人合意済み（3回）。',
    wantsInstallment: true,
    resignation: {
      consentedOn: '2024-05-30', pledgeAttached: true, confirmedBy: '労務 大西',
      recoverableFromFinalSalary: false, uncollectableAmount: 24000,
      followUp: '最終給与で回収できない残額は本人へ請求書を送付し、指定口座へ振込。',
      note: '2024年7月末 退職予定',
    },
    comments: [{ by: '労務 大西', at: '2024-05-30 14:20', text: '天引き誓約書を受領し、本人同意を確認しました。' }],
    history: [
      { at: '2024-05-16 08:45', by: '山本 明日香', action: '登録' },
      { at: '2024-05-24 16:00', by: '経理 井上', action: '精算処理', field: '立替者への精算', before: '未処理', after: '完了' },
      { at: '2024-06-25 10:00', by: '経理 井上', action: '回収処理', field: '天引き済み額', before: '0', after: '20000' },
    ],
  },
  {
    caseId: 'CAS-2024-0006', registeredBy: '中村 事務', occurredOn: '2024-05-15',
    typeKey: 'transportation', type: '交通費',
    advancerCategory: 'サービススタッフ', advancer: '山田 一郎',
    targetCategory: 'サービススタッフ', target: '山田 一郎',
    costBearerCategory: 'VC', costBearer: 'VC',
    amount: 3200, reason: '面談のための移動', detail: '大阪府 → 東京都（新幹線）',
    extras: { 出発地: '大阪府', 到着地: '東京都', 利用日: '2024-05-15', 交通手段: '新幹線' },
    attachments: [{ name: 'ticket_0515.jpg', kind: '領収書', uploadedBy: '中村 事務', uploadedAt: '2024-05-15 11:10' }],
    settlement: {
      method: '本人へ振込', plannedAmount: 3200, processedAmount: 3200,
      targetMonth: '2024年5月', processedOn: '2024-05-18', handler: '経理 井上', status: '完了',
    },
    recovery: { method: '回収不要', status: '対象外', note: 'VC負担のため回収なし' },
    history: [
      { at: '2024-05-15 11:10', by: '中村 事務', action: '登録' },
      { at: '2024-05-18 09:40', by: '経理 井上', action: '精算処理', field: '立替者への精算', before: '未処理', after: '完了' },
    ],
  },
];

// §1-8 一方のみ完了している場合、案件全体は「処理中」とする
const deriveStatus = (c) => {
  if (['差戻し', '保留', '取消'].includes(c.status)) return c.status;
  const legs = [c.settlement, c.recovery].filter((l) => l && l.status !== '対象外');
  if (legs.length === 0) return c.status || '未処理';
  if (legs.every((l) => l.status === '完了')) return '完了';
  if (legs.some((l) => l.status === '完了' || l.status === '処理中')) return '処理中';
  return '未処理';
};

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}), Case.deleteMany({}), Counter.deleteMany({}),
      ExpenseType.deleteMany({}), Staff.deleteMany({}), HostFarmer.deleteMany({}),
      PostageRate.deleteMany({}), Setting.deleteMany({}),
    ]);
    console.log('Cleared existing collections');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const users = [
      { username: 'admin', password: hashedPassword, role: 'admin' },
      { username: 'reviewer_user', password: hashedPassword, role: 'reviewer' },
      { username: 'accounting_user', password: hashedPassword, role: 'accounting' },
      { username: 'applicant_user', password: hashedPassword, role: 'applicant' },
    ];
    await User.insertMany(users);
    console.log(`Users seeded: ${users.length}`);

    await ExpenseType.insertMany(EXPENSE_TYPES);
    await Staff.insertMany(STAFF);
    await HostFarmer.insertMany(HOST_FARMERS);
    await PostageRate.insertMany(POSTAGE_RATES);
    await Setting.create({ key: 'installmentThreshold', value: 50000 });
    console.log('Masters seeded (種別・スタッフ・派遣先農家・郵送費レート・分割上限)');

    await Case.insertMany(CASES.map((c) => ({ ...c, status: deriveStatus(c) })));
    // 採番カウンタを既存の最大連番に合わせる
    await Counter.create({ _id: 'case-2024', seq: 11 });
    console.log(`Cases seeded: ${CASES.length}`);

    await mongoose.disconnect();
    console.log('Done.');
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seed();
