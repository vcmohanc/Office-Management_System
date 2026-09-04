const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const srcDir = path.join(__dirname, 'src');
const files = walkSync(srcDir);

let modifiedCount = 0;

files.forEach(file => {
  if (!file.endsWith('.jsx') && !file.endsWith('.js')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace plain strings: 'http://localhost:5000/api/...' -> `${import.meta.env.VITE_API_URL}/api/...`
  content = content.replace(/'http:\/\/localhost:5000(.*?)'/g, '`${import.meta.env.VITE_API_URL}$1`');
  
  // Replace inside template literals: `http://localhost:5000/api/...` -> `${import.meta.env.VITE_API_URL}/api/...`
  content = content.replace(/`http:\/\/localhost:5000(.*?)`/g, '`${import.meta.env.VITE_API_URL}$1`');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Modified: ${file}`);
    modifiedCount++;
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
