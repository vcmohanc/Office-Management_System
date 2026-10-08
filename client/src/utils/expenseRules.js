export const EXPENSE_RULES_MAPPING = {
  'Postage': {
    advancerCategory: 'Service Staff',
    bearingParty: 'VC',
  },
  'Transportation Expenses / Flight Fare': {
    advancerCategory: 'Service Staff',
    bearingParty: 'VC',
  },
  'Visa Application Fee': {
    advancerCategory: 'VC',
    bearingParty: 'Service Staff',
  },
  'Accommodation cost': {
    advancerCategory: 'VC',
    bearingParty: 'Service Staff',
  },
  'Language Course Fee': {
    advancerCategory: 'VC',
    bearingParty: 'Service Staff',
  },
  'Waiting Dormitory Fee': {
    advancerCategory: 'Service Staff',
    bearingParty: 'VC',
  },
  'Accommodation cost': {
    advancerCategory: 'VC',
    bearingParty: 'Service Staff',
  },
  'Equipment / Consumable Items': {
    advancerCategory: 'VC',
    bearingParty: 'Farm',
  },
  'Hospital/ Drugs Expenses': {
    advancerCategory: 'Farm',
    bearingParty: 'Service Staff',
  },
  'Drugs': {
    advancerCategory: 'Farm',
    bearingParty: 'Service Staff',
  },
  'Wifi': {
    advancerCategory: 'VC',
    bearingParty: 'Farm',
  }
};

/**
 * Derives the payment method based on payer and bearer.
 * @param {string} payer - Advancer Category
 * @param {string} bearer - Bearing Party
 * @returns {string} The payment processing type string
 */
export function getPaymentMethod(payer, bearer) {
  if (payer === 'VC' && bearer === 'Farm') {
    return 'Farm and VC Asset Transfer Agreement';
  }
  if (bearer === 'Service Staff') {
    return 'salary_deduction';
  }
  if (payer === 'Service Staff') {
    return 'salary_addition';
  }
  return 'client_invoice';
}

/**
 * Returns auto-fill values for a given expense type.
 * @param {string} expenseKey - 経費の種類
 * @returns {Object} An object containing the auto-filled fields
 */
export function getAutoFill(expenseKey) {
  const rule = EXPENSE_RULES_MAPPING[expenseKey];
  if (rule) {
    const advancerName = getPaymentMethod(rule.advancerCategory, rule.bearingParty);
    return {
      advancerCategory: rule.advancerCategory,
      bearingParty: rule.bearingParty,
      advancerName: advancerName
    };
  }
  return null;
}
