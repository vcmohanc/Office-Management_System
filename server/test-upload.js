const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // wait, fetch is built-in in node 18+
const FormData = require('form-data');

async function upload() {
  fs.writeFileSync('test.jpg', 'fake image data');
  const form = new FormData();
  form.append('files', fs.createReadStream('test.jpg'));
  
  const token = process.argv[2];
  
  const res = await fetch('http://localhost:5000/api/upload', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token
    },
    body: form
  });
  
  const data = await res.json();
  console.log('Upload response:', data);
  
  if (data.fileNames && data.fileNames.length > 0) {
      const getRes = await fetch('http://localhost:5000/api/uploads/' + data.fileNames[0] + '?token=' + token);
      console.log('Get response status:', getRes.status);
      console.log('Get response body:', await getRes.text());
  }
}

upload().catch(console.error);
