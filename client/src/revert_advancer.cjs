const fs = require('fs');

const file = 'e:\\OMS\\client\\src\\components\\account\\NewCase.jsx';
let content = fs.readFileSync(file, 'utf8');

// Revert advancerName for text input
content = content.replace(/newCases\[index\]\.advancerName = 'direct_transfer';/g, "newCases[index].advancerName = 'Transfer to the person concerned';");
content = content.replace(/newCases\[index\]\.advancerName = 'salary_deduction';/g, "newCases[index].advancerName = 'Salary deduction';");
content = content.replace(/newCases\[index\]\.advancerName = 'client_invoice';/g, "newCases[index].advancerName = 'Invoice from the client company';");

fs.writeFileSync(file, content, 'utf8');
console.log('Reverted advancerName values in NewCase.jsx');
