const fs = require('fs');

const files = [
  'e:/OMS/client/src/components/account/NewCase.jsx',
  'e:/OMS/client/src/components/support/StaffClaimRequest.jsx',
  'e:/OMS/client/src/components/support/ClaimList.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace PAYMENT_PROCESS_OPTIONS
  const oldOptions = `const PAYMENT_PROCESS_OPTIONS = [
  { value: 'Transfer to the person concerned', label: '本人への振込' },
  { value: 'Salary deduction', label: '給与控除' },
  { value: 'Invoice from the client company', label: 'クライアント会社からの請求書' },
];`;

  const newOptions = `const PAYMENT_PROCESS_OPTIONS = [
  { value: 'salary_addition', label: '給与に加算' },
  { value: 'salary_deduction', label: '給与から控除' },
  { value: 'client_invoice', label: 'クライアントへ請求' },
  { value: 'direct_transfer', label: '本人へ振込' },
];`;

  if (content.includes(oldOptions)) {
    content = content.replace(oldOptions, newOptions);
  }

  // Update optionLabelJP if it exists and has old values
  const oldLabel1 = `'Transfer to the person concerned': '本人への振込',`;
  const oldLabel2 = `'Salary deduction': '給与控除',`;
  const oldLabel3 = `'Invoice from the client company': 'クライアント会社からの請求書',`;
  
  const newLabels = `'salary_addition': '給与に加算',
  'salary_deduction': '給与から控除',
  'client_invoice': 'クライアントへ請求',
  'direct_transfer': '本人へ振込',`;

  if (content.includes(oldLabel1)) {
    content = content.replace(oldLabel1, newLabels);
    content = content.replace(oldLabel2, '');
    content = content.replace(oldLabel3, '');
  }

  fs.writeFileSync(file, content);
});

console.log('Options updated in React files.');
