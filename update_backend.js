const fs = require('fs');

function updateCasesBackend() {
  const file = 'e:/OMS/server/routes/cases.js';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('expenseRules')) {
    content = content.replace("import { validateBackendExpenseAmount } from '../utils/amountHelper.js';", "import { validateBackendExpenseAmount } from '../utils/amountHelper.js';\nimport { expenseRules } from '../utils/expenseRules.js';");
  }

  const injectionPoint = `    const validation = await validateBackendExpenseAmount(`;
  
  const ruleLogic = `
    if (validatedData.expense_type !== 'others') {
      const rule = expenseRules[validatedData.expense_type];
      if (rule) {
        validatedData.advancer_category = rule.advancerCategory;
        validatedData.bearing_party = rule.bearingParty;
        validatedData.payment_process_type = rule.advancerName;
      }
    } else {
      if (!validatedData.advancer_category || !validatedData.bearing_party || !validatedData.payment_process_type) {
        return res.status(400).json({ message: '「その他」を選択した場合は、立替者カテゴリ、負担先、支払処理タイプをすべて指定してください。' });
      }
    }

    const validation = await validateBackendExpenseAmount(`;

  if (!content.includes("expenseRules[validatedData.expense_type]")) {
    content = content.replace(injectionPoint, ruleLogic);
  }

  fs.writeFileSync(file, content);
}

function updateClaimsBackend() {
  const file = 'e:/OMS/server/routes/claims.js';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('expenseRules')) {
    content = content.replace("import { validateBackendExpenseAmount } from '../utils/amountHelper.js';", "import { validateBackendExpenseAmount } from '../utils/amountHelper.js';\nimport { expenseRules } from '../utils/expenseRules.js';");
  }

  const injectionPoint = `    const validation = await validateBackendExpenseAmount(`;
  
  const ruleLogic = `
    if (validatedData.expense_type !== 'others') {
      const rule = expenseRules[validatedData.expense_type];
      if (rule) {
        validatedData.advancer_category = rule.advancerCategory;
        validatedData.bearing_party = rule.bearingParty;
        validatedData.payment_process_types = rule.advancerName;
      }
    } else {
      if (!validatedData.advancer_category || !validatedData.bearing_party || !validatedData.payment_process_types) {
        return res.status(400).json({ message: '「その他」を選択した場合は、立替者カテゴリ、負担先、支払処理タイプをすべて指定してください。' });
      }
    }

    const validation = await validateBackendExpenseAmount(`;

  if (!content.includes("expenseRules[validatedData.expense_type]")) {
    content = content.replace(injectionPoint, ruleLogic);
  }

  fs.writeFileSync(file, content);
}

updateCasesBackend();
updateClaimsBackend();
console.log('Backend enforcement added.');
