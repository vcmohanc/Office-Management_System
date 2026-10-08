const fs = require('fs');
const files = [
  'e:/OMS/client/src/components/support/ClaimList.jsx',
  'e:/OMS/client/src/components/support/StaffClaimRequest.jsx',
  'e:/OMS/client/src/components/account/NewCase.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const hasValidVisa = emp\.visaEndDate && new Date\(emp\.visaEndDate\) >= new Date\(\);/g, 'const hasValidVisa = !emp.visaEndDate || new Date(emp.visaEndDate) >= new Date();');
  content = content.replace(/if \(!staffInfo\.fullName \|\| !staffInfo\.id \|\| !staffInfo\.branchAndFarmName \|\| staffInfo\.branchAndFarmName === '配属先を選択'\)/g, 'if (!staffInfo.fullName || !staffInfo.id)');
  content = content.replace(/配属先 <span className="text-red-500">\*<\/span><\/label>/g, '配属先</label>');
  content = content.replace(/staff_name: staffInfo\.fullName \|\| "N\/A",/g, 'full_name: staffInfo.fullName || "N/A",');
  content = content.replace(/payment_process_type: caseItem\.advancerName \|\| "N\/A",/g, 'payment_process_types: caseItem.advancerName || "direct_transfer",');
  content = content.replace(/receipts: caseItem\.receipts \|\| \[\],/g, 'bill_receipt_url: caseItem.receipts || [],');
  content = content.replace(/remark: caseItem\.remark \|\| caseItem\.damageReason \|\| "",/g, 'remarks: caseItem.remark || caseItem.damageReason || "",');
  content = content.replace(/total_expense: totalExpense金額,/g, 'total_expense_amount: totalExpense金額,');
  content = content.replace(/installment_count: installmentCount,/g, 'installment_count: installmentCount,\n            monthly_deduction: 0,');
  content = content.replace(/toast\.error\("案件の送信に失敗しました。詳細はコンソールを確認してください。"\);/g, 'toast.error("案件の送信に失敗しました。詳細はコンソールを確認してください。: " + (error.message || error));');
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Done');
