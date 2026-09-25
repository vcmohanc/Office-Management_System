const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'src', 'components', 'account', 'PaymentStatus.jsx'),
  path.join(__dirname, 'src', 'components', 'hr', 'VisaManagement.jsx')
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  if (content.includes('jspdf-autotable') && !content.includes('fontBase64')) {
    content = content.replace(/import autoTable from 'jspdf-autotable';/g, "import autoTable from 'jspdf-autotable';\nimport { fontBase64 } from '../../fonts/Kosugi-Regular.js';");
  }

  // Handle doc creation
  content = content.replace(/const doc = new jsPDF\((.*?)\);\n(.*?)const pageWidth/g, 
    "const doc = new jsPDF($1);\n        doc.addFileToVFS('Kosugi-Regular.ttf', fontBase64);\n        doc.addFont('Kosugi-Regular.ttf', 'Kosugi', 'normal');\n$2const pageWidth");

  // Visa management specific replacement
  content = content.replace(/const pdf = new jsPDF\('p', 'pt', 'a4'\);/g, 
    "const pdf = new jsPDF('p', 'pt', 'a4');\n      pdf.addFileToVFS('Kosugi-Regular.ttf', fontBase64);\n      pdf.addFont('Kosugi-Regular.ttf', 'Kosugi', 'normal');");

  // Global helvetica replace
  content = content.replace(/'helvetica', 'bold'/g, "'Kosugi', 'normal'");
  content = content.replace(/'helvetica', 'normal'/g, "'Kosugi', 'normal'");
  content = content.replace(/'helvetica', 'italic'/g, "'Kosugi', 'normal'");
  content = content.replace(/font: 'helvetica'/g, "font: 'Kosugi'");
  content = content.replace(/pdf\.setFont\('helvetica'\)/g, "pdf.setFont('Kosugi')");
  content = content.replace(/pdf\.setFont\('helvetica', 'bold'\)/g, "pdf.setFont('Kosugi', 'normal')");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}
