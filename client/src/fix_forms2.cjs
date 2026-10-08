const fs = require('fs');

const files = [
  'e:/OMS/client/src/components/account/NewCase.jsx',
  'e:/OMS/client/src/components/support/StaffClaimRequest.jsx',
  'e:/OMS/client/src/components/support/ClaimList.jsx'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');

  // We need to find: className={`${...} w-full ... "
  // and replace the trailing " with `}
  
  // A regex that matches the opening part of the broken className and captures everything up to the next double quote
  const brokenClassRegex = /(className=\{`\$\{caseItem\.editable === false \? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''\} [^"]*)"/g;
  
  content = content.replace(brokenClassRegex, "$1`}");

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fix script 2 completed.');
