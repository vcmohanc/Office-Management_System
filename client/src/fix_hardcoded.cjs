const fs = require('fs');

const file = 'e:\\OMS\\client\\src\\components\\account\\NewCase.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix cases
content = content.replace(/'Service staff'/g, "'Service Staff'");
content = content.replace(/'Dispatch destination: Farm'/g, "'Farme'");
content = content.replace(/'Transfer to the person concerned'/g, "'direct_transfer'");
content = content.replace(/'Salary deduction'/g, "'salary_deduction'");
content = content.replace(/'Invoice from the client company'/g, "'client_invoice'");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed hardcoded values in NewCase.jsx');
