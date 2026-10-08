const fs = require('fs');
const files = [
  'e:\\OMS\\client\\src\\components\\support\\StaffClaimRequest.jsx',
  'e:\\OMS\\client\\src\\components\\support\\ClaimList.jsx',
  'e:\\OMS\\client\\src\\components\\account\\NewCase.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // For NewCase.jsx
  content = content.replace(
    /\{cases\.some\(c => \['サポートスタッフ', 'Staff', 'サービススタッフ'\]\.includes\(c\.advancerCategory\) \|\| \['サポートスタッフ', 'Staff', 'サービススタッフ'\]\.includes\(c\.bearingParty\)\) && \(\(\) => \{/g,
    "{cases.some(c => ['サポートスタッフ', 'サービススタッフ'].includes(c.advancerCategory) || ['サポートスタッフ', 'サービススタッフ'].includes(c.bearingParty)) && (() => {"
  );
  content = content.replace(
    /const showStaffInfo = cases\.some\(c => \['サポートスタッフ', 'Staff', 'サービススタッフ'\]\.includes\(c\.advancerCategory\) \|\| \['サポートスタッフ', 'Staff', 'サービススタッフ'\]\.includes\(c\.bearingParty\)\);/g,
    "const showStaffInfo = cases.some(c => ['サポートスタッフ', 'サービススタッフ'].includes(c.advancerCategory) || ['サポートスタッフ', 'サービススタッフ'].includes(c.bearingParty));"
  );
  
  // For StaffClaimRequest.jsx and ClaimList.jsx
  content = content.replace(
    /\{cases\.some\(c => c\.advancerCategory === 'サポートスタッフ' \|\| c\.bearingParty === 'サポートスタッフ' \|\| c\.advancerCategory === 'サポートスタッフ' \|\| c\.bearingParty === 'サポートスタッフ'\) && \(\(\) => \{/g,
    "{cases.some(c => ['サポートスタッフ', 'サービススタッフ'].includes(c.advancerCategory) || ['サポートスタッフ', 'サービススタッフ'].includes(c.bearingParty)) && (() => {"
  );
  
  // Fix validation in StaffClaimRequest.jsx and ClaimList.jsx
  content = content.replace(
    /        <button \n          onClick=\{\(\) => \{\n            if \(!staffInfo\.fullName \|\| !staffInfo\.id \|\| !staffInfo\.branchAndFarmName \|\| staffInfo\.branchAndFarmName === '配属先を選択'\) \{/g,
    "        <button \n          onClick={() => {\n            const showStaffInfo = cases.some(c => ['サポートスタッフ', 'サービススタッフ'].includes(c.advancerCategory) || ['サポートスタッフ', 'サービススタッフ'].includes(c.bearingParty));\n            if (showStaffInfo && (!staffInfo.fullName || !staffInfo.id || !staffInfo.branchAndFarmName || staffInfo.branchAndFarmName === '配属先を選択')) {"
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
});
