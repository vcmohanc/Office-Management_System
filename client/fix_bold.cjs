const fs = require('fs');
const files = [
  'src/components/account/PaymentEntry.jsx',
  'src/components/account/PaymentStatus.jsx',
  'src/components/hr/VisaManagement.jsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/fontStyle:\s*'bold'/g, "fontStyle: 'normal'");
  fs.writeFileSync(f, content, 'utf8');
  console.log('Fixed', f);
});
