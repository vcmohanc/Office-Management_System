const fs = require('fs');
const path = require('path');

const files = [
  'e:/OMS/client/src/components/account/NewCase.jsx',
  'e:/OMS/client/src/components/support/StaffClaimRequest.jsx',
  'e:/OMS/client/src/components/support/ClaimList.jsx'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update imports
  content = content.replace(
    /import \{ expenseRules \} from '\.\.\/\.\.\/utils\/expenseRules\.js';/g,
    "import { getAutoFill, getPaymentMethod } from '../../utils/expenseRules.js';"
  );

  // 2. Update initial cases state for editable, sender, recipient (handles variations in whitespace)
  content = content.replace(
    /bearingParty:\s*'負担先を選択',\s*expense金額:\s*(?:0|''),\s*advancerName:\s*''(\s*)\}\]\)/g,
    "bearingParty: '負担先を選択',\n    expense金額: $1.includes('0') ? 0 : '',\n    advancerName: '',\n    sender: '',\n    recipient: '',\n    editable: false\n  }])"
  );
  // Actually the expense金額 is 0 in NewCase but '' in StaffClaimRequest!
  // Let's do a more robust replace for initial state
  content = content.replace(
    /(bearingParty:\s*'負担先を選択',\n\s*expense金額:\s*[^,]+,\n\s*)(suggested金額:\s*0,\n\s*)?(advancerName:\s*'',?\n\s*)(receipts:\s*\[\],\n\s*remark:\s*''\n\s*)?\}\]/g,
    "$1$2$3sender: '',\n      recipient: '',\n      editable: false,\n      $4}]"
  );
  
  // Wait, let's just do it directly on the components' specific blocks if the above fails.
  // Actually, I can just replace the updateCase logic first.
  const oldUpdateCaseRegex = /if \(field === 'expenseType'\) \{\s*switch \(value\) \{\s*case 'Postage':[\s\S]*?case 'WIFI':[\s\S]*?break;\s*\}\s*\}/;
  
  const newUpdateCaseLogic = `if (field === 'expenseType') {
      const autoFill = getAutoFill(value);
      Object.assign(newCases[index], autoFill);
    }

    if ((field === 'advancerCategory' || field === 'bearingParty') && newCases[index].editable !== false) {
      newCases[index].advancerName = getPaymentMethod(newCases[index].advancerCategory, newCases[index].bearingParty);
    }`;
  
  content = content.replace(oldUpdateCaseRegex, newUpdateCaseLogic);

  // Update disabled props on inputs
  content = content.replace(
    /(<select\s+value=\{caseItem.advancerCategory\}\s+onChange=\{\(e\) => updateCase\(index, 'advancerCategory', e\.target\.value\)\})\s*(className=")/g,
    "$1 disabled={caseItem.editable === false} className={`${caseItem.editable === false ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''} "
  );

  content = content.replace(
    /(<select\s+value=\{caseItem.bearingParty\}\s+onChange=\{\(e\) => updateCase\(index, 'bearingParty', e\.target\.value\)\})\s*(className=")/g,
    "$1 disabled={caseItem.editable === false} className={`${caseItem.editable === false ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''} "
  );

  content = content.replace(
    /(<input\s+type="text"\s+placeholder="名前を入力"\s+value=\{caseItem.advancerName\}\s+onChange=\{\(e\) => updateCase\(index, 'advancerName', e\.target\.value\)\})\s*(className=")/g,
    "$1 disabled={caseItem.editable === false} className={`${caseItem.editable === false ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''} "
  );

  // For the blue box with sender and recipient.
  // We need to inject the blue box right above renderDynamicFields
  const blueBoxStr = `
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">差出人</label>
              <input type="text" value={caseItem.sender || ''} onChange={(e) => updateCase(index, 'sender', e.target.value)} disabled={caseItem.editable === false} placeholder="差出人を入力" className={\`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] \${caseItem.editable === false ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}\`} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">受取人</label>
              <input type="text" value={caseItem.recipient || ''} onChange={(e) => updateCase(index, 'recipient', e.target.value)} disabled={caseItem.editable === false} placeholder="受取人を入力" className={\`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] \${caseItem.editable === false ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}\`} />
            </div>
          </div>
  `;
  
  // Insert it before {renderDynamicFields
  content = content.replace(/(\{\s*renderDynamicFields\(caseItem\.expenseType,\s*index,\s*caseItem\)\s*\})/g, blueBoxStr + "\n          $1");

  // Remove the old Postage sender/recipient from renderDynamicFields
  const oldPostageRegex = /case 'Postage':\s*return \(\s*<div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">\s*<div>\s*<label className="block text-sm font-bold text-gray-700 mb-2">差出人<\/label>[\s\S]*?<\/div>\s*<\/div>\s*\);/;
  
  // Some files might have different formatting, let's just use string replacement if possible or a more flexible regex
  const oldPostageStr = `case 'Postage':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">差出人</label>
              <input type="text" list={\`sender-list-\${index}\`} value={caseItem.sender || ''} onChange={(e) => updateCase(index, 'sender', e.target.value)} placeholder="差出人を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={\`sender-list-\${index}\`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name1} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">受取人</label>
              <input type="text" list={\`recipient-list-\${index}\`} value={caseItem.recipient || ''} onChange={(e) => updateCase(index, 'recipient', e.target.value)} placeholder="受取人を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={\`recipient-list-\${index}\`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name2} />
                ))}
              </datalist>
            </div>
          </div>
        );`;
  
  content = content.replace(oldPostageStr, "case 'Postage':\n        return null;");
  
  // Same for other files which might have slight differences
  // If exact match fails, fallback to regex
  if (content.includes("case 'Postage':")) {
      content = content.replace(/case 'Postage':[\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*case 'Transportation/g, "case 'Postage':\n        return null;\n      case 'Transportation");
  }

  // To fix initial state, I'll just find where advancerName: '' is inside the object that has expenseType: '種類を選択'
  // There are 3 instances (useState, handleAddAnotherCase, and handle送信 reset)
  // Let's replace them carefully
  content = content.replace(/advancerName:\s*''\s*\}/g, "advancerName: '',\n    sender: '',\n    recipient: '',\n    editable: false\n  }");
  content = content.replace(/advancerName:\s*'',\s*receipts/g, "advancerName: '',\n      sender: '',\n      recipient: '',\n      editable: false,\n      receipts");
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Script completed.');
