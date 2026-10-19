export const expenseRules = {
  'Postage': {
    advancerCategory: 'Service Staff',
    bearingParty: 'VC',
    advancerName: 'salary_addition'
  },
  'Transportation Expenses / Flight Fare': {
    advancerCategory: 'Service Staff',
    bearingParty: 'VC',
    advancerName: 'salary_addition'
  },
  'Visa Application Fee': {
    advancerCategory: 'VC',
    bearingParty: 'Service Staff',
    advancerName: 'salary_deduction'
  },
  'Accommodation cost': {
    advancerCategory: 'VC',
    bearingParty: 'Service Staff',
    advancerName: 'salary_deduction'
  },
  'Language Course Fee': {
    advancerCategory: 'VC',
    bearingParty: 'Service Staff',
    advancerName: 'salary_deduction'
  },
  'Waiting Dormitory Fee': {
    advancerCategory: 'Service Staff',
    bearingParty: 'VC',
    advancerName: 'salary_addition'
  },
  'Accommodation cost': {
    advancerCategory: 'VC',
    bearingParty: 'Service Staff',
    advancerName: 'salary_deduction'
  },
  'Equipment / Consumable Items': {
    advancerCategory: 'VC',
    bearingParty: 'Farm',
    advancerName: 'Farm and VC Asset Transfer Agreement'
  },
  'Hospital/ Drugs Expenses': {
    advancerCategory: 'Farm',
    bearingParty: 'Service Staff',
    advancerName: 'salary_deduction'
  },
  'Drugs': {
    advancerCategory: 'Farm',
    bearingParty: 'Service Staff',
    advancerName: 'salary_deduction'
  },
  'Wifi': {
    advancerCategory: 'VC',
    bearingParty: 'Farm',
    advancerName: 'Farm and VC Asset Transfer Agreement'
  }
};

export const isHostCompanyPairing = (advancer = '', bearer = '') => {
  const a = String(advancer || '').trim().toLowerCase();
  const b = String(bearer || '').trim().toLowerCase();

  const isVC = (val) => val === 'vc';
  const isFarm = (val) => val.includes('farm') || val.includes('ファーム');

  return (isVC(a) && isFarm(b)) || (isFarm(a) && isVC(b));
};

export const HOST_COMPANY_COLLECTION_METHODS = [
  '銀行振込',
  '農場への直接回収'
];

export const isValidCollectionMethodForPairing = (collectionMethod = '', advancer = '', bearer = '') => {
  if (isHostCompanyPairing(advancer, bearer)) {
    return HOST_COMPANY_COLLECTION_METHODS.includes(collectionMethod);
  }
  return true;
};
