const fs = require('fs');
const files = [
  'e:\\OMS\\client\\src\\components\\support\\StaffClaimRequest.jsx',
  'e:\\OMS\\client\\src\\components\\support\\ClaimList.jsx',
  'e:\\OMS\\client\\src\\components\\account\\NewCase.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Add Support staff to optionLabelJP if missing
  if (!content.includes("'Support staff': 'サポートスタッフ'")) {
    content = content.replace(
      /'Invoice from the client company': 'クライアント会社からの請求書',/g,
      "'Invoice from the client company': 'クライアント会社からの請求書',\n  'Support staff': 'サポートスタッフ',"
    );
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated optionLabelJP in ' + file);
});
