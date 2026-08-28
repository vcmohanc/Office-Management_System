// 種別マスタ — canonical list of expense types and their default classification.
// Source: 立替・精算管理システム 要件定義.docx §種別マスタ / §1-3.
export const EXPENSE_TYPES = [
  {
    key: 'postage',
    label: '郵送費',
    targetCategory: 'サービススタッフ',
    targetCategoryFixed: true,
    defaultCostBearer: 'VC',
    standardProcess: '本人へ振込',
    extraFields: [
      { key: 'origin', label: '送り元' },
      { key: 'destination', label: '送り先' },
    ],
  },
  {
    key: 'transportation',
    label: '交通費',
    targetCategory: 'サービススタッフ',
    targetCategoryFixed: true,
    defaultCostBearer: 'VC',
    standardProcess: '本人へ振込',
    extraFields: [
      { key: 'departure', label: '出発地' },
      { key: 'arrival', label: '到着地' },
      { key: 'usageDate', label: '利用日' },
      { key: 'transportMethod', label: '交通手段' },
    ],
  },
  {
    key: 'flight',
    label: 'フライト代',
    targetCategory: 'サービススタッフ',
    targetCategoryFixed: true,
    defaultCostBearer: 'VC',
    standardProcess: '振込または天引き',
    extraFields: [
      { key: 'departure', label: '出発地' },
      { key: 'arrival', label: '到着地' },
      { key: 'usageDate', label: '利用日' },
      { key: 'transportMethod', label: '交通手段' },
    ],
  },
  {
    key: 'visa',
    label: 'ビザ申請代',
    targetCategory: 'サービススタッフ',
    targetCategoryFixed: true,
    defaultCostBearer: 'VC',
    standardProcess: '給与天引き',
    extraFields: [],
  },
  {
    key: 'dormitory',
    label: '待機寮',
    targetCategory: 'サービススタッフ',
    targetCategoryFixed: true,
    defaultCostBearer: 'サービススタッフ',
    standardProcess: '給与天引き',
    extraFields: [
      { key: 'dormName', label: '寮名' },
      { key: 'startDate', label: '利用開始日' },
      { key: 'endDate', label: '利用終了日' },
    ],
  },
  {
    key: 'equipment',
    label: '備品',
    targetCategory: null,
    targetCategoryFixed: false,
    defaultCostBearer: null,
    standardProcess: 'ー',
    extraFields: [
      { key: 'itemName', label: '備品名' },
      { key: 'quantity', label: '数量' },
      { key: 'purchaseDate', label: '購入日' },
      { key: 'reason', label: '破損・故障・不足等の理由' },
    ],
  },
  {
    key: 'wifi',
    label: 'WIFI',
    targetCategory: '派遣先・農家',
    targetCategoryFixed: true,
    defaultCostBearer: '派遣先・農家',
    standardProcess: '派遣先請求',
    extraFields: [
      { key: 'targetHost', label: '対象派遣先・農家' },
      { key: 'startDate', label: '利用開始日' },
    ],
  },
  {
    key: 'hospital',
    label: '病院代',
    targetCategory: 'サービススタッフ',
    targetCategoryFixed: true,
    defaultCostBearer: 'サービススタッフ',
    standardProcess: '給与天引き',
    extraFields: [
      { key: 'visitDate', label: '受診日' },
      { key: 'consultationFee', label: '診察代' },
      { key: 'medicineFee', label: '薬代' },
    ],
  },
  {
    key: 'other',
    label: 'その他',
    targetCategory: null,
    targetCategoryFixed: false,
    defaultCostBearer: null,
    standardProcess: 'ー',
    extraFields: [
      { key: 'detail', label: '内容（自由記入）' },
    ],
  },
];

export const getExpenseType = (key) => EXPENSE_TYPES.find((t) => t.key === key);

export const ADVANCER_CATEGORIES = ['サービススタッフ', '派遣先・農家', 'VC'];
export const TARGET_CATEGORIES = ['サービススタッフ', '派遣先・農家', 'その他'];
export const COST_BEARER_CATEGORIES = ['サービススタッフ', '派遣先・農家', 'VC'];

export const SETTLEMENT_METHODS = [
  '本人へ振込',
  '派遣先への請求額から控除',
  '現金精算',
  'VC経費処理',
  '精算不要',
  'その他',
];

export const COLLECTION_METHODS = [
  '給与天引き',
  '派遣先へ請求',
  '現金回収',
  'VC負担',
  '回収不要',
  'その他',
];

// 費用負担先 → 推奨される精算・回収方法（xlsxの補足メモに基づく初期提案。ユーザーが変更可能）
export const SUGGESTED_METHODS_BY_COST_BEARER = {
  'サービススタッフ': { settlement: '本人へ振込', recovery: '給与天引き' },
  '派遣先・農家': { settlement: '派遣先への請求額から控除', recovery: '派遣先へ請求' },
  'VC': { settlement: 'VC経費処理', recovery: 'VC負担' },
};

export const CASE_STATUSES = ['未処理', '処理中', '完了', '差戻し', '保留', '取消'];

export const CASE_STATUS_COLORS = {
  '未処理': 'bg-gray-100 text-gray-700 border-gray-200',
  '処理中': 'bg-blue-100 text-blue-700 border-blue-200',
  '完了': 'bg-green-100 text-green-700 border-green-200',
  '差戻し': 'bg-red-100 text-red-600 border-red-200',
  '保留': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '取消': 'bg-gray-200 text-gray-500 border-gray-300',
};

export const ATTACHMENT_HINT = '領収書・請求書・配送伝票・行先証明・定額小為替・診療明細・天引き誓約書・破損/故障写真 など';
