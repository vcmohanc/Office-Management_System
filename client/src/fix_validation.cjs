const fs = require('fs');

const files = [
  'e:\\OMS\\client\\src\\components\\account\\NewCase.jsx',
  'e:\\OMS\\client\\src\\components\\support\\ClaimList.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace unconditional staff validation with conditional one
  content = content.replace(
    /if \(!staffInfo\.fullName \|\| !staffInfo\.id \|\| !staffInfo\.branchAndFarmName \|\| staffInfo\.branchAndFarmName === '配属先を選択'\) \{\s*toast\.error\('必要なスタッフ情報をすべて入力してください。'\);\s*return;\s*\}/g,
    `const showStaffInfo = cases.some(c => ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.advancerCategory) || ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.bearingParty));
            if (showStaffInfo && (!staffInfo.fullName || !staffInfo.id || !staffInfo.branchAndFarmName || staffInfo.branchAndFarmName === '配属先を選択')) {
              toast.error('必要なスタッフ情報をすべて入力してください。');
              return;
            }`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed validation in ' + file);
});
