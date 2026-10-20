export const PATTERN_CONFIG = [
  {
    id: 'PTN-1',
    flowTitle: 'VC → サービススタッフ',
    flowTitleEn: 'VC Fund → Service Staff',
    advancer: 'Service Staff',
    bearer: 'VC Fund',
    advancerJP: 'サービススタッフ',
    bearerJP: 'VC',
    flowType: 'Reimburse', // outflow from fund
    flowTypeLabel: '精算',
    expenseTypes: ['郵便料金', '交通費 / 航空運賃', '待機寮費']
  },
  {
    id: 'PTN-2',
    flowTitle: 'サービススタッフ → VC',
    flowTitleEn: 'Service Staff → VC Fund',
    advancer: 'VC Fund',
    bearer: 'Service Staff',
    advancerJP: 'VC',
    bearerJP: 'サービススタッフ',
    flowType: 'Collect', // inflow to fund
    flowTypeLabel: '回収',
    expenseTypes: ['ビザ申請料', '宿泊費', '語学講習費']
  },
  {
    id: 'PTN-3',
    flowTitle: 'ファーム → VC',
    flowTitleEn: 'Farm → VC Fund',
    advancer: 'VC Fund',
    bearer: 'Farm',
    advancerJP: 'VC',
    bearerJP: 'ファーム',
    flowType: 'Collect', // inflow to fund
    flowTypeLabel: '回収',
    expenseTypes: ['機材費', 'Wi-Fi']
  },
  {
    id: 'PTN-4',
    flowTitle: 'VC → サポートスタッフ',
    flowTitleEn: 'VC Fund → Support Staff',
    advancer: 'Support Staff',
    bearer: 'VC Fund',
    advancerJP: 'サポートスタッフ',
    bearerJP: 'VC',
    flowType: 'Reimburse', // outflow from fund
    flowTypeLabel: '精算',
    expenseTypes: ['その他']
  },
  {
    id: 'PTN-5',
    flowTitle: 'ファーム → サービススタッフ',
    flowTitleEn: 'Farm → Service Staff',
    advancer: 'Farm',
    bearer: 'Service Staff',
    advancerJP: 'ファーム',
    bearerJP: 'サービススタッフ',
    flowType: 'Transfer', // outside fund
    flowTypeLabel: '振替',
    expenseTypes: ['病院代 / 薬代']
  }
];

export const PARTY_JP = {
  'VC Fund': 'VC',
  'VC': 'VC',
  'Service Staff': 'サービススタッフ',
  'Support Staff': 'サポートスタッフ',
  'Farm': 'ファーム',
  'Host Company': 'ホスト企業・農場',
  'Dispatch destination: Farm': 'ファーム',
  'Office': 'オフィス',
  'Staff': 'スタッフ'
};

export const normalizeParty = (party = '') => {
  if (!party) return '';
  const p = String(party).trim().toLowerCase();
  if (p === 'vc' || p.includes('vc fund') || p === 'vc') return 'VC';
  if (p.includes('service staff') || p === 'servicestaff' || p.includes('サービススタッフ') || p === 'staff' || p === 'スタッフ') return 'Service Staff';
  if (p.includes('support staff') || p === 'supportstaff' || p.includes('サポートスタッフ')) return 'Support Staff';
  if (p.includes('farm') || p.includes('ファーム') || p.includes('host company') || p.includes('ホスト') || p.includes('dispatch destination')) return 'Farm';
  if (p.includes('office') || p.includes('オフィス')) return 'VC';
  return party;
};

export const toPartyJP = (name) => {
  const norm = normalizeParty(name);
  return PARTY_JP[name] || PARTY_JP[norm] || name;
};

export const FLOW_TYPE_JP = {
  'Reimburse': '精算',
  'Collect': '回収',
  'Transfer': '振替'
};

export const toFlowTypeJP = (type) => FLOW_TYPE_JP[type] || type;

export const EXPENSE_TYPE_TO_PATTERN_ID = {
  // PTN-1
  'Postage': 'PTN-1',
  '郵便料金': 'PTN-1', // existing app terminology support
  'Transportation / Airfare': 'PTN-1',
  '交通費 / 航空運賃': 'PTN-1',
  'Waiting dormitory fees': 'PTN-1',
  '待機寮費': 'PTN-1',

  // PTN-2
  'Visa application fee': 'PTN-2',
  'ビザ申請料': 'PTN-2',
  'Accommodation costs': 'PTN-2',
  '宿泊費': 'PTN-2',
  'Language course fees': 'PTN-2',
  '語学講習費': 'PTN-2',

  // PTN-3
  'Equipment / Consumables': 'PTN-3',
  '機材費': 'PTN-3',
  '過払い回収': 'PTN-3',
  '返金': 'PTN-3',
  'Wi-Fi': 'PTN-3',
  'Wifi': 'PTN-3',
  'WIFI': 'PTN-3',

  // PTN-4
  'Other': 'PTN-4',
  '出張費': 'PTN-4',
  'その他': 'PTN-4',

  // PTN-5
  'Hospital fees / Medicine': 'PTN-5',
  '病院代 / 薬代': 'PTN-5',
  'relocation costs': 'PTN-5',
};

export function getPatternForExpense(expenseType) {
  const patternId = EXPENSE_TYPE_TO_PATTERN_ID[expenseType] || 'PTN-4';
  return PATTERN_CONFIG.find(p => p.id === patternId) || PATTERN_CONFIG[3];
}

export function getPatternByParties(advancerCategory = '', bearingParty = '') {
  const adv = normalizeParty(advancerCategory);
  const br = normalizeParty(bearingParty);

  if (!adv && !br) return PATTERN_CONFIG[0];

  // Canonical pairs:
  // PTN-1: Service Staff -> VC
  if (adv === 'Service Staff' && br === 'VC') return PATTERN_CONFIG.find(p => p.id === 'PTN-1');
  // PTN-2: VC -> Service Staff
  if (adv === 'VC' && br === 'Service Staff') return PATTERN_CONFIG.find(p => p.id === 'PTN-2');
  // PTN-3: VC -> Farm (or Farm -> VC)
  if ((adv === 'VC' && br === 'Farm') || (adv === 'Farm' && br === 'VC')) return PATTERN_CONFIG.find(p => p.id === 'PTN-3');
  // PTN-4: Support Staff -> VC (or VC -> Support Staff)
  if ((adv === 'Support Staff' && br === 'VC') || (adv === 'VC' && br === 'Support Staff')) return PATTERN_CONFIG.find(p => p.id === 'PTN-4');
  // PTN-5: Farm -> Service Staff
  if (adv === 'Farm' && br === 'Service Staff') return PATTERN_CONFIG.find(p => p.id === 'PTN-5');

  // General match across PATTERN_CONFIG
  const directMatch = PATTERN_CONFIG.find(p => {
    const pAdv = normalizeParty(p.advancer);
    const pBr = normalizeParty(p.bearer);
    return (pAdv === adv && pBr === br) || (pAdv === br && pBr === adv);
  });

  return directMatch || PATTERN_CONFIG[0];
}

export function getPatternForCase(c) {
  if (!c) return PATTERN_CONFIG[0];
  const adv = normalizeParty(c.advancerCategory || c.advancer_category);
  const br = normalizeParty(c.bearingParty || c.bearing_party || c.bearer);

  // If distinct parties are present
  if (adv && br && adv !== br) {
    const p = getPatternByParties(adv, br);
    if (p) return p;
  }

  // Fallback to expense type mapping if parties are identical or missing
  const expType = c.expenseType || c.expense_type;
  if (expType) {
    const p = getPatternForExpense(expType);
    if (p) return p;
  }

  if (adv || br) {
    const p = getPatternByParties(adv, br);
    if (p) return p;
  }

  return PATTERN_CONFIG[0];
}

export function getPartiesDisplayJP(advancer, bearer) {
  const advJP = toPartyJP(advancer) || 'VC';
  const brJP = toPartyJP(bearer) || 'VC';
  return { advJP, brJP, display: `${advJP} → ${brJP}` };
}

export function calculateSettlementMetrics(records) {
  let totalAdvanced = 0;
  let totalRecovered = 0;
  let active = 0;

  records.forEach(c => {
    // Determine total amount
    const amt = parseFloat(c.finalTotal || c.totalExpense || c.final_total_amount || 0);
    
    // Determine paid amount
    const totalTerms = c.installment_count || (c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
    const paidTerms = c.paidTerms || 0;
    
    let nextPayment = c.nextPayment金額 || amt / totalTerms;
    if (nextPayment * totalTerms > amt + 100) {
      nextPayment = amt / totalTerms;
    }
    
    const remaining = Math.max(0, amt - (paidTerms * nextPayment));
    const recovered = amt - remaining;

    totalAdvanced += amt;
    totalRecovered += recovered;
    
    if (remaining > 0) {
      active += 1;
    }
  });

  const netExposure = Math.max(0, totalAdvanced - totalRecovered);
  const progressRaw = totalAdvanced === 0 ? 0 : (totalRecovered / totalAdvanced) * 100;
  const progress = Math.min(100, Math.max(0, progressRaw));

  return {
    totalAdvanced,
    totalRecovered,
    netExposure,
    progress,
    active
  };
}
