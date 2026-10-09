const fs = require('fs');
let content = fs.readFileSync('client/src/components/account/PaymentEntry.jsx', 'utf8');

const regex = /<option value="Waiting Dormitory Fee">寮費待機<\/option>\s*<option value="WIFI">WIFI<\/option>\s*<option value="Travel">交通費<\/option>/;

const replacement = `{option.expenseTypes.map((type, idx) => (
                      <option key={idx} value={type}>{type}</option>
                    ))}`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('client/src/components/account/PaymentEntry.jsx', content);
  console.log('Replaced successfully');
} else {
  console.log('Target not found!');
}
