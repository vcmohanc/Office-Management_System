const fs = require('fs');
if (fs.existsSync('client/src/components/account/PaymentStatus_tmp.jsx')) {
    let pStatus = fs.readFileSync('client/src/components/account/PaymentStatus_tmp.jsx', 'utf8');
    pStatus = pStatus.replace(/<option value="給与控除">給与控除<\/option>/g, '<option value="給与控除">給与控除</option>\n                            <option value="給与に加算">給与に加算</option>');
    fs.writeFileSync('client/src/components/account/PaymentStatus_tmp.jsx', pStatus);
    console.log('Replaced successfully');
}
