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



