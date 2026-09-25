const fs = require('fs');
const file = 'src/components/account/PaymentEntry.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace dynamic bold style assignments inside didParseCell
content = content.replace(/styles\.fontStyle = 'bold'/g, "styles.fontStyle = 'normal'");
content = content.replace(/fontStyle = 'bold'/g, "fontStyle = 'normal'");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed dynamic bolds in PaymentEntry');
