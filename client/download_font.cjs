const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/googlefonts/kosugi/main/fonts/ttf/Kosugi-Regular.ttf';

const dir = path.join(__dirname, 'src', 'fonts');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

console.log('Downloading...');
https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error('Failed', res.statusCode);
    return;
  }
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    const b64 = buf.toString('base64');
    fs.writeFileSync(path.join(dir, 'Kosugi-Regular.js'), 'export const fontBase64 = "' + b64 + '";\n');
    console.log('Saved src/fonts/Kosugi-Regular.js, size:', b64.length);
  });
});
