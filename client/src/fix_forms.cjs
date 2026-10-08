const fs = require('fs');

const files = [
  'e:/OMS/client/src/components/account/NewCase.jsx',
  'e:/OMS/client/src/components/support/StaffClaimRequest.jsx',
  'e:/OMS/client/src/components/support/ClaimList.jsx'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the syntax error injected by the previous script
  content = content.replace(
    /expense金額: \r?\n\s*\.includes\('0'\) \? 0 : '',/g,
    "expense金額: '',"
  );
  
  // Actually, if it's newcases it was `expense金額: \n  .includes('0') ? 0 : '',`
  content = content.replace(
    /expense金額:\s*[^a-zA-Z0-9'"]*\.includes\('0'\) \? 0 : '',/g,
    "expense金額: '',"
  );

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fix script completed.');
