import { lookupPostalRate, lookupTravelRate } from './regionHelper.js';

export const EXPENSE_RULES_MAPPING = {
  'Postage': {
    advancerCategory: 'Service staff',
    bearingParty: 'VC',
  },
  'Transportation Expenses / Flight Fare': {
    advancerCategory: 'Service staff',
    bearingParty: 'VC',
  },
  'Visa Application Fee': {
    advancerCategory: 'VC',
    bearingParty: 'Service staff',
  },
  'Visa application fee': {
    advancerCategory: 'VC',
    bearingParty: 'Service staff',
  },
  'Accommodation cost': {
    advancerCategory: 'VC',
    bearingParty: 'Service staff',
  },
  'Language Course Fee': {
    advancerCategory: 'VC',
    bearingParty: 'Service staff',
  },
  'Waiting Dormitory Fee': {
    advancerCategory: 'Service staff',
    bearingParty: 'VC',
  },
  'Equipment / Consumable Items': {
    advancerCategory: 'VC',
    bearingParty: 'Dispatch destination: Farm',
  },
  'Equipment/Supplies': {
    advancerCategory: 'VC',
    bearingParty: 'Dispatch destination: Farm',
  },
  'Hospital/ Drugs Expenses': {
    advancerCategory: 'Dispatch destination: Farm',
    bearingParty: 'Service staff',
  },
  'Hospital Fee': {
    advancerCategory: 'Dispatch destination: Farm',
    bearingParty: 'Service staff',
  },
  'Drugs': {
    advancerCategory: 'Dispatch destination: Farm',
    bearingParty: 'Service staff',
  },
  'Wifi': {
    advancerCategory: 'VC',
    bearingParty: 'Dispatch destination: Farm',
  },
  'WIFI': {
    advancerCategory: 'VC',
    bearingParty: 'Dispatch destination: Farm',
  }
};

export const optionLabelJP = {
  // Expense types
  'Postage': '郵便料金',
  'Transportation Expenses / Flight Fare': '交通費 / 航空運賃',
  'Visa Application Fee': 'ビザ申請料',
  'Visa application fee': 'ビザ申請料',
  'Accommodation cost': '宿泊費',
  'Language Course Fee': '語学講習費',
  'Waiting Dormitory Fee': '待機寮費',
  'Hospital/ Drugs Expenses': '病院費/薬代',
  'Hospital Fee': '病院費',
  'Equipment / Consumable Items': '備品・消耗品',
  'Equipment/Supplies': '備品・消耗品',
  'Wifi': 'WIFI',
  'WIFI': 'WIFI',
  'others': 'その他',
  'Others': 'その他',
  'Drugs': '薬代',

  // Advancer / Bearer categories
  'サポートスタッフ': 'サポートスタッフ',
  'Support Staff': 'サポートスタッフ',
  'Support staff': 'サポートスタッフ',
  'VC': 'VC',
  'Farm': 'ファーム',
  'ファーム': 'ファーム',
  'Dispatch destination: Farm': '派遣先: ファーム',
  'Select for each project': 'プロジェクト毎に選択',
  'Office': 'オフィス',
  'Service Staff': 'サービススタッフ',
  'Service staff': 'サービススタッフ',
  'Staff': 'スタッフ',
  'Host Company': 'ホスト企業',

  // Payment / Settlement / Collection Methods
  'salary_addition': '給与に加算',
  'salary_deduction': '給与から控除',
  'client_invoice': '顧客へ請求',
  'direct_transfer': '本人へ振込',
  'bank_transfer': '銀行振込',
  'Bank Transfer': '銀行振込',
  'Company Expense (VC Bears)': '会社経費（VC負担）',
  'Farm and VC Asset Transfer Agreement': 'Farm and VC Asset Transfer Agreement',
  '給与控除': '給与控除',
  '給与振込': '給与振込',
  '請求書発行': '請求書発行',
  '自動引落': '自動引落',
  '相殺処理': '相殺処理',
  '直接集金': '直接集金',
  '農場への直接回収': '農場への直接回収',

  // Statuses
  'Pending': '保留中',
  'Approved': '承認済み',
  'Rejected': '拒否',
  'Returned for Correction': '修正依頼',
  'Resubmitted': '再提出済み',
  'Completed': '完了',
  'NEW': '新た',
  'REJECTED': '拒否',
  'RETURNED_FOR_CORRECTION': '修正依頼',
  'RESUBMITTED': '再提出済み',
  'COMPLETED': '完了',
};

export const toJP = (label) => {
  if (!label) return '';
  return optionLabelJP[label] ?? label;
};

/**
 * Sorts a list of expense types so that 'Others' / 'others' / 'その他'
 * always appears at the very end of the list.
 * Supports array of option objects ({ label, value, ... }) or array of strings.
 *
 * @param {Array} optionsList
 * @returns {Array} sorted array with 'その他' placed at the end
 */
export function sortExpenseTypes(optionsList = []) {
  if (!Array.isArray(optionsList) || optionsList.length === 0) return [];

  const isOthers = (opt) => {
    if (!opt) return false;
    const val = typeof opt === 'string' ? opt : (opt.value || opt.label || '');
    const lbl = typeof opt === 'string' ? opt : (opt.label || '');
    const vLower = String(val).trim().toLowerCase();
    const lLower = String(lbl).trim().toLowerCase();
    const jp = typeof opt === 'string' ? toJP(opt) : toJP(opt.label || opt.value || '');
    return (
      vLower === 'others' || vLower === 'other' || vLower === 'その他' ||
      lLower === 'others' || lLower === 'other' || lLower === 'その他' ||
      jp === 'その他'
    );
  };

  const normal = [];
  const others = [];

  for (const opt of optionsList) {
    if (isOthers(opt)) {
      others.push(opt);
    } else {
      normal.push(opt);
    }
  }

  return [...normal, ...others];
}


/**
 * Normalizes an option value against the active list of options from the DB,
 * handling case sensitivity, alias variations, or partial matches.
 * @param {Array} optionsList - Array of { label, value } option items from DB
 * @param {string} currentValue - The currently assigned value string
 * @param {string} fallbackKeyword - Optional substring to match (e.g. 'staff', 'farm', 'project')
 * @returns {string} The normalized option value
 */
export function normalizeOptionValue(optionsList = [], currentValue = '', fallbackKeyword = '') {
  if (!Array.isArray(optionsList) || optionsList.length === 0) {
    return currentValue || '';
  }
  const cur = (currentValue || '').trim();
  const curLower = cur.toLowerCase();

  // 1. Exact match on value or label
  const exact = optionsList.find(opt => opt.value === cur || opt.label === cur);
  if (exact) return exact.value;

  // 2. Case-insensitive match on value or label
  const caseMatch = optionsList.find(opt => 
    (opt.value || '').toLowerCase() === curLower ||
    (opt.label || '').toLowerCase() === curLower
  );
  if (caseMatch) return caseMatch.value;

  // 3. Fallback keyword match if provided (e.g. 'staff', 'farm')
  if (fallbackKeyword) {
    const kwLower = fallbackKeyword.toLowerCase();
    if (curLower.includes(kwLower)) {
      const kwMatch = optionsList.find(opt => 
        (opt.value || '').toLowerCase().includes(kwLower) ||
        (opt.label || '').toLowerCase().includes(kwLower)
      );
      if (kwMatch) return kwMatch.value;
    }
  }

  return cur;
}

/**
 * Derives the payment method based on payer and bearer.
 * @param {string} payer - Advancer Category
 * @param {string} bearer - Bearing Party
 * @returns {string} The payment processing type string
 */
export function getPaymentMethod(payer = '', bearer = '') {
  const p = (payer || '').toLowerCase().trim();
  const b = (bearer || '').toLowerCase().trim();

  if (p === 'vc' && (b === 'farm' || b.includes('farm') || b.includes('ファーム'))) {
    return 'direct_transfer';
  }
  if (b.includes('service staff') || b === 'servicestaff' || b.includes('staff') || b.includes('スタッフ')) {
    return 'salary_deduction';
  }
  if (p.includes('service staff') || p === 'servicestaff' || p.includes('staff') || p.includes('スタッフ')) {
    return 'salary_addition';
  }
  return 'client_invoice';
}

/**
 * Returns auto-fill values for a given expense type, matching against available options if provided.
 * @param {string} expenseKey - 経費の種類
 * @param {Array} availableAdvancers - Optional list of option objects from DB
 * @param {Array} availableBearers - Optional list of option objects from DB
 * @returns {Object|null} An object containing the auto-filled fields
 */
export function getAutoFill(expenseKey, availableAdvancers = [], availableBearers = []) {
  const rule = EXPENSE_RULES_MAPPING[expenseKey];
  if (rule) {
    let advCat = rule.advancerCategory;
    let bearParty = rule.bearingParty;

    if (Array.isArray(availableAdvancers) && availableAdvancers.length > 0) {
      const match = availableAdvancers.find(o => 
        (o.value || '').toLowerCase() === advCat.toLowerCase() ||
        (o.label || '').toLowerCase() === advCat.toLowerCase() ||
        (advCat.toLowerCase().includes('staff') && (o.value || '').toLowerCase().includes('staff'))
      );
      if (match) advCat = match.value;
    }

    if (Array.isArray(availableBearers) && availableBearers.length > 0) {
      const match = availableBearers.find(o => 
        (o.value || '').toLowerCase() === bearParty.toLowerCase() ||
        (o.label || '').toLowerCase() === bearParty.toLowerCase() ||
        (bearParty.toLowerCase().includes('farm') && (o.value || '').toLowerCase().includes('farm'))
      );
      if (match) bearParty = match.value;
    }

    const advancerName = getPaymentMethod(advCat, bearParty);
    return {
      advancerCategory: advCat,
      bearingParty: bearParty,
      advancerName: advancerName
    };
  }
  return null;
}

/**
 * Unified calculation for suggested costs (Postage & Transportation).
 */
export function calculateSuggestedExpenseCost({
  expenseType,
  sender,
  recipient,
  departure,
  destination,
  transportMethod,
  regions = [],
  postalMatrix = {},
  travelMatrix = {},
  japaneseRegions = [],
  prefPostalRates = {},
  prefTravelRates = {}
}) {
  if (expenseType === 'Postage') {
    if (!sender || !recipient) return 0;
    let numericCost = 0;
    const senderId = regions.find(r => r.name1 === sender || r.name2 === sender)?._id;
    const recipientId = regions.find(r => r.name2 === recipient || r.name1 === recipient)?._id;

    if (senderId && recipientId && postalMatrix[senderId] && postalMatrix[senderId][recipientId]) {
      const rawCost = postalMatrix[senderId][recipientId];
      if (rawCost === 'なし') {
        numericCost = 0;
      } else {
        numericCost = typeof rawCost === 'string' ? Number(rawCost.replace(/,/g, '')) : Number(rawCost);
      }
    }
    if (!numericCost || isNaN(numericCost)) {
      numericCost = lookupPostalRate(sender, recipient, japaneseRegions, prefPostalRates);
    }
    return isNaN(numericCost) ? 0 : Number(numericCost);
  }

  if (expenseType === 'Transportation Expenses / Flight Fare') {
    if (!departure || !destination) return 0;
    let numericCost = 0;
    const departureId = regions.find(r => r.name1 === departure || r.name2 === departure)?._id;
    const destinationId = regions.find(r => r.name2 === destination || r.name1 === destination)?._id;

    if (departureId && destinationId && travelMatrix[departureId] && travelMatrix[departureId][destinationId]) {
      const rawCost = travelMatrix[departureId][destinationId];
      if (typeof rawCost === 'string' || typeof rawCost === 'number') {
        numericCost = typeof rawCost === 'string' ? Number(String(rawCost).replace(/,/g, '')) : Number(rawCost);
      } else if (rawCost && typeof rawCost === 'object') {
        const busCost = rawCost.bus ? Number(String(rawCost.bus).replace(/,/g, '')) : 0;
        const flightCost = rawCost.flight ? Number(String(rawCost.flight).replace(/,/g, '')) : 0;
        if (transportMethod === 'バス') numericCost = busCost;
        else if (transportMethod === '飛行機') numericCost = flightCost;
        else numericCost = Math.max(busCost, flightCost);
      }
    }
    if (!numericCost || isNaN(numericCost)) {
      numericCost = lookupTravelRate(departure, destination, transportMethod, japaneseRegions, prefTravelRates);
    }
    return isNaN(numericCost) ? 0 : Number(numericCost);
  }

  return 0;
}

/**
 * Standard Payment Processing Type options for select inputs.
 */
export const PAYMENT_PROCESSING_OPTIONS = [
  { value: 'salary_deduction', label: '給与控除 (Salary deduction)' },
  { value: 'salary_addition', label: '給与に加算 (Addition to salary)' },
  { value: 'client_invoice', label: '請求書発行・顧客へ請求 (Invoice from client company)' },
  { value: 'direct_transfer', label: '本人へ振込・銀行振込 (Transfer to person concerned)' },
];

/**
 * Dependency mapping: Payment Processing Type (支払処理タイプ) → Allowed Collection Methods (回収方法).
 */
export const PAYMENT_TO_COLLECTION_MAP = {
  'salary_deduction': [
    { value: '給与控除', label: '給与控除 (Deduction from salary)' },
    { value: '自動引落', label: '自動引落 (Automatic Debit)' }
  ],
  'salary_addition': [
    { value: '給与振込', label: '給与振込 (Payroll Transfer)' },
    { value: '銀行振込', label: '銀行振込 (Bank Transfer)' }
  ],
  'client_invoice': [
    { value: '請求書発行', label: '請求書発行 (Invoice Issuance)' },
    { value: '銀行振込', label: '銀行振込 (Bank Transfer)' },
    { value: '相殺処理', label: '相殺処理 (Offset / Settlement)' }
  ],
  'direct_transfer': [
    { value: '銀行振込', label: '銀行振込 (Bank Transfer)' },
    { value: '直接集金', label: '直接集金 (Direct Collection)' },
    { value: '給与控除', label: '給与控除 (Deduction from salary)' }
  ]
};

/**
 * Collection methods specific to VC <-> Farm host company transactions.
 */
export const HOST_COMPANY_COLLECTION_METHODS = [
  { value: '銀行振込', label: '銀行振込 (Bank Transfer)' },
  { value: '農場への直接回収', label: '農場への直接回収 (Direct collection to Farm)' }
];

/**
 * Returns available Collection Methods (回収方法) based on Payment Processing Type and optional Advancer / Bearer pairing.
 * When pairing matches VC and Farm, restricts methods directly to 銀行振込 (Bank Transfer) or 農場への直接回収 (Direct collection to Farm).
 * @param {string} paymentType
 * @param {string} [advancer]
 * @param {string} [bearer]
 * @returns {Array<{value: string, label: string}>}
 */
export function getAvailableCollectionMethods(paymentType = '', advancer = '', bearer = '') {
  if (advancer && bearer && isHostCompanyPairing(advancer, bearer)) {
    return HOST_COMPANY_COLLECTION_METHODS;
  }

  if (!paymentType) return [];
  const pt = String(paymentType).trim();
  const normalizedKey = pt.toLowerCase().replace(/[\s-]/g, '_');

  if (PAYMENT_TO_COLLECTION_MAP[normalizedKey]) {
    return PAYMENT_TO_COLLECTION_MAP[normalizedKey];
  }
  if (normalizedKey.includes('deduction') || normalizedKey.includes('控除')) {
    return PAYMENT_TO_COLLECTION_MAP['salary_deduction'];
  }
  if (normalizedKey.includes('addition') || normalizedKey.includes('加算') || normalizedKey.includes('給与')) {
    return PAYMENT_TO_COLLECTION_MAP['salary_addition'];
  }
  if (normalizedKey.includes('invoice') || normalizedKey.includes('請求')) {
    return PAYMENT_TO_COLLECTION_MAP['client_invoice'];
  }
  if (normalizedKey.includes('transfer') || normalizedKey.includes('振込')) {
    return PAYMENT_TO_COLLECTION_MAP['direct_transfer'];
  }

  // Fallback default
  return [
    { value: '給与控除', label: '給与控除 (Deduction from salary)' },
    { value: '銀行振込', label: '銀行振込 (Bank Transfer)' },
    { value: '請求書発行', label: '請求書発行 (Invoice Issuance)' }
  ];
}

/**
 * Checks whether the pairing of Advancer Category and Expense Bearer represents
 * a transaction between VC and Farm (e.g. VC → Farm or Farm → VC).
 * @param {string} advancer - Advancer category
 * @param {string} bearer - Expense bearer (burden party)
 * @returns {boolean}
 */
export function isHostCompanyPairing(advancer = '', bearer = '') {
  const a = String(advancer || '').trim().toLowerCase();
  const b = String(bearer || '').trim().toLowerCase();

  const isVC = (val) => val === 'vc';
  const isFarm = (val) => val.includes('farm') || val.includes('ファーム');

  return (isVC(a) && isFarm(b)) || (isFarm(a) && isVC(b));
}
