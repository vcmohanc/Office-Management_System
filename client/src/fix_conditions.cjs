const fs = require('fs');

const files = [
  'e:\\OMS\\client\\src\\components\\support\\StaffClaimRequest.jsx',
  'e:\\OMS\\client\\src\\components\\support\\ClaimList.jsx',
  'e:\\OMS\\client\\src\\components\\account\\NewCase.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // For NewCase.jsx and ClaimList.jsx rendering condition
  content = content.replace(
    /cases\.some\(c => \['サポートスタッフ', 'サービススタッフ'\]\.includes\(c\.advancerCategory\) \|\| \['サポートスタッフ', 'サービススタッフ'\]\.includes\(c\.bearingParty\)\)/g,
    "cases.some(c => ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.advancerCategory) || ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.bearingParty))"
  );

  content = content.replace(
    /cases\.some\(c => \['サポEトスタチE', 'サービススタチE'\]\.includes\(c\.advancerCategory\) \|\| \['サポEトスタチE', 'サービススタチE'\]\.includes\(c\.bearingParty\)\)/g,
    "cases.some(c => ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.advancerCategory) || ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.bearingParty))"
  );
  
  // Just in case it has c => c.advancerCategory === '...'
  content = content.replace(
    /cases\.some\(c => c\.advancerCategory === 'サポートスタッフ' \|\| c\.bearingParty === 'サポートスタッフ' \|\| c\.advancerCategory === 'サービススタッフ' \|\| c\.bearingParty === 'サービススタッフ'\)/g,
    "cases.some(c => ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.advancerCategory) || ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.bearingParty))"
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed conditions in ' + file);
});
