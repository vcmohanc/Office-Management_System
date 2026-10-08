const fs = require('fs');

const files = [
  'e:/OMS/client/src/components/account/NewCase.jsx',
  'e:/OMS/client/src/components/support/StaffClaimRequest.jsx',
  'e:/OMS/client/src/components/support/ClaimList.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Add import
  if (!content.includes('expenseRules')) {
    content = content.replace("import { validateExpenseAmount } from '../../utils/amountHelper.js';", "import { validateExpenseAmount } from '../../utils/amountHelper.js';\nimport { expenseRules } from '../../utils/expenseRules.js';");
  }

  // Add PAYMENT_PROCESS_OPTIONS if not exists
  if (!content.includes('PAYMENT_PROCESS_OPTIONS')) {
    content = content.replace("const optionLabelJP = {", `const PAYMENT_PROCESS_OPTIONS = [
  { value: 'Transfer to the person concerned', label: '本人への振込' },
  { value: 'Salary deduction', label: '給与控除' },
  { value: 'Invoice from the client company', label: 'クライアント会社からの請求書' },
];

const optionLabelJP = {`);
  }

  // Update updateCase function
  const oldUpdateCase = `    if (field === 'expenseType') {
      switch (value) {
        case 'Postage':
        case 'Transportation Expenses / Flight Fare':
          newCases[index].advancerCategory = 'Service staff';
          newCases[index].bearingParty = 'VC';
          newCases[index].advancerName = 'Transfer to the person concerned';
          break;
        case 'Visa application fee':
        case 'Hostel Fee':
        case 'Language Class Fee':
          newCases[index].advancerCategory = 'Service staff';
          newCases[index].bearingParty = 'VC';
          newCases[index].advancerName = 'Salary deduction';
          break;
        case 'Waiting Dormitory Fee':
          newCases[index].advancerCategory = 'Service staff';
          newCases[index].bearingParty = 'Service staff';
          newCases[index].advancerName = 'Salary deduction';
          break;
        case 'Hospital/ Drugs Expenses':
          newCases[index].advancerCategory = 'Dispatch destination: Farm';
          newCases[index].bearingParty = 'Service staff';
          newCases[index].advancerName = 'Salary deduction';
          break;
        case 'Equipment/Supplies':
        case 'others':
          newCases[index].advancerCategory = 'Select for each project';
          newCases[index].bearingParty = 'Select for each project';
          newCases[index].advancerName = '';
          break;
        case 'WIFI':
          newCases[index].advancerCategory = 'VC';
          newCases[index].bearingParty = 'Dispatch destination: Farm';
          newCases[index].advancerName = 'Invoice from the client company';
          break;
      }
    }`;

  const newUpdateCase = `    if (field === 'expenseType') {
      const rule = expenseRules[value];
      if (rule) {
        newCases[index].advancerCategory = rule.advancerCategory;
        newCases[index].bearingParty = rule.bearingParty;
        newCases[index].advancerName = rule.advancerName;
        if (value !== 'Postage') {
          newCases[index].sender = '';
          newCases[index].recipient = '';
        }
      } else if (value === 'others') {
        newCases[index].advancerCategory = '';
        newCases[index].bearingParty = '';
        newCases[index].advancerName = '';
      } else {
        newCases[index].advancerCategory = 'カテゴリを選択';
        newCases[index].bearingParty = '負担先を選択';
        newCases[index].advancerName = '';
      }
    }`;

  content = content.replace(oldUpdateCase, newUpdateCase);

  // Update advancerCategory
  const oldAdvancerCategory = `<select 
                  value={caseItem.advancerCategory}
                  onChange={(e) => updateCase(index, 'advancerCategory', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">`;

  const newAdvancerCategory = `const isLocked = caseItem.expenseType && caseItem.expenseType !== 'others';
                return (<>
                <select 
                  value={caseItem.advancerCategory}
                  onChange={(e) => updateCase(index, 'advancerCategory', e.target.value)}
                  disabled={isLocked}
                  className={\`w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] \${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-gray-600'}\`}>`;

  // We need to inject the `const isLocked` before the select, wait, this is inside JSX.
  // Better to use an IIFE or just evaluate `{caseItem.expenseType !== 'others' && !!caseItem.expenseType}`
  
  const oldAdvCategory = `<select 
                  value={caseItem.advancerCategory}
                  onChange={(e) => updateCase(index, 'advancerCategory', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">`;
                  
  const newAdvCategory = `<select 
                  value={caseItem.advancerCategory}
                  onChange={(e) => updateCase(index, 'advancerCategory', e.target.value)}
                  disabled={caseItem.expenseType !== 'others' && !!caseItem.expenseType}
                  className={\`w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] \${caseItem.expenseType !== 'others' && !!caseItem.expenseType ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-gray-600'}\`}>`;
                  
  content = content.replace(oldAdvCategory, newAdvCategory);

  const oldBearingParty = `<select 
                  value={caseItem.bearingParty}
                  onChange={(e) => updateCase(index, 'bearingParty', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">`;
                  
  const newBearingParty = `<select 
                  value={caseItem.bearingParty}
                  onChange={(e) => updateCase(index, 'bearingParty', e.target.value)}
                  disabled={caseItem.expenseType !== 'others' && !!caseItem.expenseType}
                  className={\`w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] \${caseItem.expenseType !== 'others' && !!caseItem.expenseType ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-gray-600'}\`}>`;

  content = content.replace(oldBearingParty, newBearingParty);

  const oldAdvancerName = `<input 
                type="text" 
                placeholder="名前を入力" 
                value={caseItem.advancerName}
                onChange={(e) => updateCase(index, 'advancerName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" 
              />`;

  const newAdvancerName = `<div className="relative">
                <select 
                  value={caseItem.advancerName}
                  onChange={(e) => updateCase(index, 'advancerName', e.target.value)}
                  disabled={caseItem.expenseType !== 'others' && !!caseItem.expenseType}
                  className={\`w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] \${caseItem.expenseType !== 'others' && !!caseItem.expenseType ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-gray-600'}\`}>
                  <option value="">タイプを選択</option>
                  {PAYMENT_PROCESS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>`;
              
  content = content.replace(oldAdvancerName, newAdvancerName);

  // Add helper text under the three fields
  const oldAdvCatChevron = `</select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">負担先`;

  const newAdvCatChevron = `</select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              {caseItem.expenseType !== 'others' && !!caseItem.expenseType && <p className="text-xs text-gray-500 mt-1">経費の種類により自動設定されます</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">負担先`;
              
  content = content.replace(oldAdvCatChevron, newAdvCatChevron);

  const oldBearPartyChevron = `</select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>`;

  const newBearPartyChevron = `</select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              {caseItem.expenseType !== 'others' && !!caseItem.expenseType && <p className="text-xs text-gray-500 mt-1">経費の種類により自動設定されます</p>}
            </div>
          </div>`;
          
  content = content.replace(oldBearPartyChevron, newBearPartyChevron);

  const oldAdvNameEnd = `<ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">経費金額 (¥)`;
              
  const newAdvNameEnd = `<ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              {caseItem.expenseType !== 'others' && !!caseItem.expenseType && <p className="text-xs text-gray-500 mt-1">経費の種類により自動設定されます</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">経費金額 (¥)`;
              
  content = content.replace(oldAdvNameEnd, newAdvNameEnd);

  fs.writeFileSync(file, content);
});

console.log('Frontend updated.');
