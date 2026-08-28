// 立替案件データ（プロトタイプ用モック）
// 項目は要件定義書 §1-1（登録項目）／§1-7（精算・回収処理）／§1-8（農家処理・スタッフ処理）
// ／§1-10（分割天引き）／§1-11（退職時）／§1-12（派遣先請求・控除）／§1-21（操作履歴）に対応。

// 各処理（立替者への精算／費用負担先からの回収）の状態 §1-7
export const PROCESS_STATUSES = ['未処理', '処理中', '完了', '対象外'];

export const PROCESS_STATUS_COLORS = {
  '未処理': 'bg-gray-100 text-gray-700 border-gray-200',
  '処理中': 'bg-blue-100 text-blue-700 border-blue-200',
  '完了': 'bg-green-100 text-green-700 border-green-200',
  '対象外': 'bg-gray-50 text-gray-400 border-gray-200',
};

// §1-13 想定する添付書類
export const ATTACHMENT_KINDS = [
  '領収書',
  'レシート',
  '配送伝票',
  '行先証明',
  '定額小為替',
  '診療明細',
  '請求書',
  '天引き誓約書',
  '破損・故障写真',
  'その他',
];

// ケースIDの自動採番 §1-1
const CASE_ID_PREFIX = 'CAS';
export const formatCaseId = (year, seq) => `${CASE_ID_PREFIX}-${year}-${String(seq).padStart(4, '0')}`;

export const MOCK_CASES = [
  {
    id: formatCaseId(2024, 11),
    registeredBy: 'ボハラ',
    occurredOn: '2024-05-20',
    updatedOn: '2024-05-21',
    typeKey: 'postage',
    type: '郵送費',
    advancerCategory: 'サービススタッフ',
    advancer: 'ラメシュ',
    targetCategory: 'サービススタッフ',
    target: 'ラメシュ',
    costBearerCategory: 'VC',
    costBearer: 'VC',
    amount: 4500,
    reason: '異動に伴う私物の郵送',
    detail: '東京都 → 北海道（宅配便2箱）',
    note: '',
    group: 'staff',
    extras: { 送り元: '東京都', 送り先: '北海道' },
    attachments: [
      { name: 'receipt_0520.pdf', kind: '領収書' },
      { name: 'slip_0520.jpg', kind: '配送伝票' },
    ],
    status: '処理中',
    settlement: {
      method: '本人へ振込',
      plannedAmount: 4500,
      processedAmount: 0,
      targetMonth: '2024年6月',
      processedOn: '',
      handler: '',
      status: '未処理',
      note: '6月給与に上乗せ予定',
    },
    recovery: {
      method: '回収不要',
      plannedAmount: 0,
      processedAmount: 0,
      targetMonth: '',
      processedOn: '',
      handler: '',
      status: '対象外',
      note: 'VC負担のため回収なし',
    },
    installments: [],
    installmentNote: '',
    billing: null,
    resignation: null,
    comments: [
      { by: 'モハン', at: '2024-05-21 10:12', text: '配送伝票の宛先を確認しました。問題ありません。' },
    ],
    history: [
      { at: '2024-05-20 09:30', by: 'ボハラ', action: '登録', field: '', before: '', after: '' },
      { at: '2024-05-21 10:12', by: 'モハン', action: '承認', field: 'ステータス', before: '未処理', after: '処理中' },
    ],
    rejection: null,
    cancellation: null,
  },
  {
    id: formatCaseId(2024, 10),
    registeredBy: 'ボハラ',
    occurredOn: '2024-05-19',
    updatedOn: '2024-05-22',
    typeKey: 'hospital',
    type: '病院代',
    advancerCategory: '派遣先・農家',
    advancer: 'グリーンファーム農園',
    targetCategory: 'サービススタッフ',
    target: 'スニタ',
    costBearerCategory: 'サービススタッフ',
    costBearer: 'サービススタッフ',
    amount: 12000,
    reason: '就業中の体調不良による受診',
    detail: '診察代 8,000円／薬代 4,000円',
    note: '農家が窓口で立替',
    group: 'staff',
    extras: { 受診日: '2024-05-19', 診察代: '8,000', 薬代: '4,000' },
    attachments: [{ name: 'medical_0519.pdf', kind: '診療明細' }],
    status: '処理中',
    // §1-8 農家への処理（派遣先請求額から控除）
    settlement: {
      method: '派遣先への請求額から控除',
      plannedAmount: 12000,
      processedAmount: 12000,
      targetMonth: '2024年5月',
      processedOn: '2024-05-22',
      handler: 'プラカシュ',
      status: '完了',
      note: '5月請求分から控除済み',
    },
    // §1-8 スタッフへの処理（給与天引き）— 片方のみ完了のため案件全体は「処理中」
    recovery: {
      method: '給与天引き',
      plannedAmount: 12000,
      processedAmount: 0,
      targetMonth: '2024年6月',
      processedOn: '',
      handler: '',
      status: '未処理',
      note: '',
    },
    installments: [],
    installmentNote: '',
    billing: {
      host: 'グリーンファーム農園',
      month: '2024年5月',
      staff: 'スニタ',
      type: '病院代',
      amount: 12000,
      kind: '控除',
      reason: '農家立替分の精算',
      display: '立替精算（病院代）',
      status: '完了',
      processedOn: '2024-05-22',
      handler: 'プラカシュ',
      note: '',
    },
    resignation: null,
    comments: [],
    history: [
      { at: '2024-05-19 16:40', by: 'ボハラ', action: '登録', field: '', before: '', after: '' },
      { at: '2024-05-22 11:05', by: 'プラカシュ', action: '精算処理', field: '農家処理', before: '未処理', after: '完了' },
    ],
    rejection: null,
    cancellation: null,
  },
  {
    id: formatCaseId(2024, 9),
    registeredBy: 'ディペシュ',
    occurredOn: '2024-05-18',
    updatedOn: '2024-05-20',
    typeKey: 'dormitory',
    type: '待機寮',
    advancerCategory: 'VC',
    advancer: 'VC',
    targetCategory: 'サービススタッフ',
    target: 'ビカス',
    costBearerCategory: 'サービススタッフ',
    costBearer: 'サービススタッフ',
    amount: 85000,
    reason: '配属前の待機期間の寮費',
    detail: '第2待機寮／2024-04-01〜2024-05-15',
    note: '',
    group: 'staff',
    extras: { 寮名: '第2待機寮', 利用開始日: '2024-04-01', 利用終了日: '2024-05-15' },
    attachments: [],
    status: '差戻し',
    settlement: {
      method: 'VC経費処理',
      plannedAmount: 85000,
      processedAmount: 0,
      targetMonth: '',
      processedOn: '',
      handler: '',
      status: '対象外',
      note: 'VC立替のため精算不要',
    },
    recovery: {
      method: '給与天引き',
      plannedAmount: 85000,
      processedAmount: 0,
      targetMonth: '2024年6月〜',
      processedOn: '',
      handler: '',
      status: '未処理',
      note: '上限金額超過のため分割',
    },
    // §1-10 分割天引き
    installments: [
      { month: '2024年6月', amount: 30000, status: '未処理', processedOn: '' },
      { month: '2024年7月', amount: 30000, status: '未処理', processedOn: '' },
      { month: '2024年8月', amount: 25000, status: '未処理', processedOn: '' },
    ],
    installmentNote: '本人希望は3回。詳細は経理担当と調整済み。',
    billing: null,
    resignation: null,
    comments: [
      { by: 'モハン', at: '2024-05-20 09:02', text: '天引き誓約書の添付をお願いします。' },
    ],
    history: [
      { at: '2024-05-18 13:20', by: 'ディペシュ', action: '登録', field: '', before: '', after: '' },
      { at: '2024-05-20 09:02', by: 'モハン', action: '差戻し', field: 'ステータス', before: '未処理', after: '差戻し' },
    ],
    rejection: {
      reason: '添付書類（天引き誓約書）が未提出のため、再提出をお願いします。',
      by: 'モハン',
      at: '2024-05-20 09:02',
    },
    cancellation: null,
  },
  {
    id: formatCaseId(2024, 8),
    registeredBy: 'ディペシュ',
    occurredOn: '2024-05-17',
    updatedOn: '2024-05-19',
    typeKey: 'wifi',
    type: 'WIFI',
    advancerCategory: 'VC',
    advancer: 'VC',
    targetCategory: '派遣先・農家',
    target: 'グリーンファーム農園',
    costBearerCategory: '派遣先・農家',
    costBearer: '派遣先・農家',
    amount: 6800,
    reason: '寮のインターネット回線契約',
    detail: '2024-05-01 利用開始',
    note: '',
    group: 'host',
    extras: { 対象派遣先農家: 'グリーンファーム農園', 利用開始日: '2024-05-01' },
    attachments: [{ name: 'invoice_wifi_05.pdf', kind: '請求書' }],
    status: '処理中',
    settlement: {
      method: 'VC経費処理',
      plannedAmount: 6800,
      processedAmount: 6800,
      targetMonth: '2024年5月',
      processedOn: '2024-05-19',
      handler: 'プラカシュ',
      status: '完了',
      note: '',
    },
    recovery: {
      method: '派遣先へ請求',
      plannedAmount: 6800,
      processedAmount: 0,
      targetMonth: '2024年5月',
      processedOn: '',
      handler: '',
      status: '処理中',
      note: '5月請求書に計上予定',
    },
    installments: [],
    installmentNote: '',
    billing: {
      host: 'グリーンファーム農園',
      month: '2024年5月',
      staff: 'ー',
      type: 'WIFI',
      amount: 6800,
      kind: '請求',
      reason: 'VC立替分の請求',
      display: 'WIFI利用料（5月分）',
      status: '処理中',
      processedOn: '',
      handler: 'プラカシュ',
      note: '',
    },
    resignation: null,
    comments: [],
    history: [
      { at: '2024-05-17 10:05', by: 'ディペシュ', action: '登録', field: '', before: '', after: '' },
      { at: '2024-05-19 15:30', by: 'プラカシュ', action: '精算処理', field: '立替者への精算', before: '未処理', after: '完了' },
    ],
    rejection: null,
    cancellation: null,
  },
  {
    id: formatCaseId(2024, 7),
    registeredBy: 'ボハラ',
    occurredOn: '2024-05-16',
    updatedOn: '2024-05-24',
    typeKey: 'flight',
    type: 'フライト代',
    advancerCategory: 'サービススタッフ',
    advancer: 'アルジュン',
    targetCategory: 'サービススタッフ',
    target: 'アルジュン',
    costBearerCategory: 'サービススタッフ',
    costBearer: 'サービススタッフ',
    amount: 68000,
    reason: '一時帰国のための航空券',
    detail: '成田 → ハノイ（往復）',
    note: '退職に伴い最終給与で回収予定',
    group: 'staff',
    extras: { 出発地: '成田', 到着地: 'ハノイ', 利用日: '2024-06-10', 交通手段: '航空機' },
    attachments: [
      { name: 'ticket.pdf', kind: '領収書' },
      { name: 'pledge_takahashi.pdf', kind: '天引き誓約書' },
    ],
    status: '処理中',
    settlement: {
      method: '本人へ振込',
      plannedAmount: 68000,
      processedAmount: 68000,
      targetMonth: '2024年5月',
      processedOn: '2024-05-24',
      handler: 'プラカシュ',
      status: '完了',
      note: '',
    },
    recovery: {
      method: '給与天引き',
      plannedAmount: 68000,
      processedAmount: 20000,
      targetMonth: '2024年6月〜',
      processedOn: '2024-06-25',
      handler: 'プラカシュ',
      status: '処理中',
      note: '分割天引き中',
    },
    installments: [
      { month: '2024年6月', amount: 20000, status: '完了', processedOn: '2024-06-25' },
      { month: '2024年7月', amount: 24000, status: '未処理', processedOn: '' },
      { month: '2024年8月', amount: 24000, status: '未処理', processedOn: '' },
    ],
    installmentNote: '上限金額超過のため分割を提案。本人合意済み（3回）。',
    billing: null,
    // §1-11 退職時の給与天引き管理
    resignation: {
      consentedOn: '2024-05-30',
      pledgeAttached: true,
      confirmedBy: 'ビノド',
      recoverableFromFinalSalary: false,
      uncollectableAmount: 24000,
      followUp: '最終給与で回収できない残額は本人へ請求書を送付し、指定口座へ振込。',
      note: '2024年7月末 退職予定',
    },
    comments: [
      { by: 'ビノド', at: '2024-05-30 14:20', text: '天引き誓約書を受領し、本人同意を確認しました。' },
    ],
    history: [
      { at: '2024-05-16 08:45', by: 'ボハラ', action: '登録', field: '', before: '', after: '' },
      { at: '2024-05-24 16:00', by: 'プラカシュ', action: '精算処理', field: '立替者への精算', before: '未処理', after: '完了' },
      { at: '2024-06-25 10:00', by: 'プラカシュ', action: '回収処理', field: '天引き済み額', before: '0', after: '20000' },
    ],
    rejection: null,
    cancellation: null,
  },
  {
    id: formatCaseId(2024, 6),
    registeredBy: 'ディペシュ',
    occurredOn: '2024-05-15',
    updatedOn: '2024-05-18',
    typeKey: 'transportation',
    type: '交通費',
    advancerCategory: 'サービススタッフ',
    advancer: 'サンジャイ',
    targetCategory: 'サービススタッフ',
    target: 'サンジャイ',
    costBearerCategory: 'VC',
    costBearer: 'VC',
    amount: 3200,
    reason: '面談のための移動',
    detail: '大阪府 → 東京都（新幹線）',
    note: '',
    group: 'staff',
    extras: { 出発地: '大阪府', 到着地: '東京都', 利用日: '2024-05-15', 交通手段: '新幹線' },
    attachments: [{ name: 'ticket_0515.jpg', kind: '領収書' }],
    status: '完了',
    settlement: {
      method: '本人へ振込',
      plannedAmount: 3200,
      processedAmount: 3200,
      targetMonth: '2024年5月',
      processedOn: '2024-05-18',
      handler: 'プラカシュ',
      status: '完了',
      note: '',
    },
    recovery: {
      method: '回収不要',
      plannedAmount: 0,
      processedAmount: 0,
      targetMonth: '',
      processedOn: '',
      handler: '',
      status: '対象外',
      note: 'VC負担のため回収なし',
    },
    installments: [],
    installmentNote: '',
    billing: null,
    resignation: null,
    comments: [],
    history: [
      { at: '2024-05-15 11:10', by: 'ディペシュ', action: '登録', field: '', before: '', after: '' },
      { at: '2024-05-18 09:40', by: 'プラカシュ', action: '精算処理', field: '立替者への精算', before: '未処理', after: '完了' },
    ],
    rejection: null,
    cancellation: null,
  },
];

// §1-8 「農家への処理」「スタッフへの処理」を案件から取り出す。
// 立替者への精算の相手は立替者、費用負担先からの回収の相手は費用負担先。
export const getFarmerProcess = (c) => {
  if (c.advancerCategory === '派遣先・農家') return { label: '立替者への精算', process: c.settlement };
  if (c.costBearerCategory === '派遣先・農家') return { label: '費用負担先からの回収', process: c.recovery };
  return null;
};

export const getStaffProcess = (c) => {
  if (c.advancerCategory === 'サービススタッフ') return { label: '立替者への精算', process: c.settlement };
  if (c.costBearerCategory === 'サービススタッフ') return { label: '費用負担先からの回収', process: c.recovery };
  return null;
};

// §1-8 一方のみ完了している場合、案件全体は「処理中」とする。
export const deriveCaseStatus = (c) => {
  if (['差戻し', '保留', '取消'].includes(c.status)) return c.status;
  const legs = [c.settlement, c.recovery].filter((l) => l && l.status !== '対象外');
  if (legs.length === 0) return c.status;
  if (legs.every((l) => l.status === '完了')) return '完了';
  if (legs.some((l) => l.status === '完了' || l.status === '処理中')) return '処理中';
  return '未処理';
};

export const getRemaining = (process) =>
  process ? Math.max(0, (process.plannedAmount || 0) - (process.processedAmount || 0)) : 0;

// §1-10 分割金額の合計が天引き総額と一致するかの確認
export const installmentTotal = (installments = []) =>
  installments.reduce((sum, i) => sum + (i.amount || 0), 0);

export const isInstallmentBalanced = (c) =>
  c.installments.length === 0 || installmentTotal(c.installments) === (c.recovery?.plannedAmount || 0);

// §1-16 絞り込み用フラグ
export const isAwaitingPayroll = (c) =>
  c.recovery?.method === '給与天引き' && c.recovery.status !== '完了';

export const isAwaitingHostBilling = (c) =>
  !!c.billing && c.billing.status !== '完了';

export const hasMissingAttachment = (c) => c.attachments.length === 0;
