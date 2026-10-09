const fs = require('fs');
let pStatus = fs.readFileSync('client/src/components/account/PaymentStatus.jsx', 'utf8');
pStatus = pStatus.replace(/<option value="給与控除">給与控除<\/option>/g, '<option value="給与控除">給与控除</option>\n                            <option value="給与に加算">給与に加算</option>');
fs.writeFileSync('client/src/components/account/PaymentStatus.jsx', pStatus);

let pEntry = fs.readFileSync('client/src/components/account/PaymentEntry.jsx', 'utf8');
pEntry = pEntry.replace(/<option value="Payroll Deduction">給与控除<\/option>/g, '<option value="Payroll Deduction">給与控除</option>\n                  <option value="給与に加算">給与に加算</option>');
fs.writeFileSync('client/src/components/account/PaymentEntry.jsx', pEntry);
console.log('Replaced successfully');
