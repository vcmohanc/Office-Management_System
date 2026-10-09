export const PATTERN_CONFIG = [
  {
    id: 'PTN-1',
    flowTitle: 'VC Fund → Service Staff',
    advancer: 'Service Staff',
    bearer: 'VC Fund',
    flowType: 'Reimburse', // outflow from fund
    expenseTypes: ['郵便料金', '交通費 / 航空運賃', '待機寮費']
  },
  {
    id: 'PTN-2',
    flowTitle: 'Service Staff → VC Fund',
    advancer: 'VC Fund',
    bearer: 'Service Staff',
    flowType: 'Collect', // inflow to fund
    expenseTypes: ['ビザ申請料', '宿泊費', '語学講習費']
  },
  {
    id: 'PTN-3',
    flowTitle: 'Farm → VC Fund',
    advancer: 'VC Fund',
    bearer: 'Farm',
    flowType: 'Collect', // inflow to fund
    expenseTypes: ['機材費', 'Wi-Fi']
  },
  {
    id: 'PTN-4',
    flowTitle: 'VC Fund → Support Staff',
    advancer: 'Support Staff',
    bearer: 'VC Fund',
    flowType: 'Reimburse', // outflow from fund
    expenseTypes: ['その他']
  },
  {
    id: 'PTN-5',
    flowTitle: 'Farm → Service Staff',
    advancer: 'Farm',
    bearer: 'Service Staff',
    flowType: 'Transfer', // outside fund
    expenseTypes: ['病院代 / 薬代']
  }
];

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
  '機材費': 'PTN-3', // Note: AccountDashboard uses this for Support Staff but spec says Farm
  '過払い回収': 'PTN-3', // existing app fallback mapping
  '返金': 'PTN-3',
  'Wi-Fi': 'PTN-3',

  // PTN-4
  'Other': 'PTN-4',
  '出張費': 'PTN-4',
  'その他': 'PTN-4',

  // PTN-5
  'Hospital fees / Medicine': 'PTN-5',
  'relocation costs': 'PTN-5', // Fallback from screenshot
};

export function getPatternForExpense(expenseType) {
  const patternId = EXPENSE_TYPE_TO_PATTERN_ID[expenseType] || 'PTN-4'; // Default to PTN-4 ('Other') if not found
  return PATTERN_CONFIG.find(p => p.id === patternId);
}

export function getPatternByParties(advancerCategory, bearingParty) {
  if (!advancerCategory || !bearingParty) return null;
  const advancer = advancerCategory.toLowerCase();
  const bearer = bearingParty.toLowerCase();
  return PATTERN_CONFIG.find(p => p.advancer.toLowerCase() === advancer && p.bearer.toLowerCase() === bearer);
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
