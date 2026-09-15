import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Landmark, Users, Briefcase, ArrowRight, ArrowLeft, Building2, Building, AlertTriangle, Trash2, Download, Printer } from 'lucide-react';

// Removed mockPaymentRecords
export default function PaymentEntry() {
  const [selectedEntryType, setSelectedEntryType] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settlement Form State
  const [selectedCaseToProcess, setSelectedCaseToProcess] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deductions, setDeductions] = useState(0);
  const [destinationDetails, setDestinationDetails] = useState({});
  const [transactionRefId, setTransactionRefId] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedCaseToProcess) {
      const totalTerms = selectedCaseToProcess.installmentPlan ? (selectedCaseToProcess.installmentPlan.match(/\d+/) ? parseInt(selectedCaseToProcess.installmentPlan.match(/\d+/)[0], 10) : 1) : 1;
      const claimAmount = selectedCaseToProcess.nextPaymentAmount || Math.round((selectedCaseToProcess.finalTotal || selectedCaseToProcess.totalExpense || 0) / totalTerms);
      const advanceToRecover = selectedCaseToProcess.previousBalance || 0;
      
      if (paymentMethod === 'Payroll Deduction') {
        // If it's a payroll deduction, the entire claim amount is a deduction
        setDeductions(claimAmount);
      } else if (advanceToRecover > 0) {
        setDeductions(Math.round(advanceToRecover / totalTerms));
      } else {
        setDeductions(0);
      }
    }
  }, [selectedCaseToProcess, paymentMethod]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCaseToProcess || !isConfirmed) return;

    setIsSubmitting(true);
    const totalTerms = selectedCaseToProcess.installmentPlan ? (selectedCaseToProcess.installmentPlan.match(/\d+/) ? parseInt(selectedCaseToProcess.installmentPlan.match(/\d+/)[0], 10) : 1) : 1;
    const claimAmount = selectedCaseToProcess.nextPaymentAmount || 
                        Math.round((selectedCaseToProcess.finalTotal || selectedCaseToProcess.totalExpense || 0) / totalTerms);
    
    const payload = {
      processedBy: 'AdminUser', // In a real app, this would be the logged in user
      payeeName: selectedCaseToProcess.staffName || selectedCaseToProcess.advancerName || 'N/A',
      paymentMethod,
      destinationDetails,
      financials: {
        claimAmount,
        deductions,
        netPayable: claimAmount - deductions
      },
      transactionRefId,
      paymentDate: e.target[e.target.length - 3].value, // Getting date from form
      isConfirmed
    };

    try {
      const response = await apiFetch(`/api/cases/${selectedCaseToProcess._id}/settle`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Success
        alert('Settlement processed successfully!');
        
        // Update local cases list to reflect settled status and increment paid terms
        setCases(cases.map(c => {
          if (c._id === selectedCaseToProcess._id) {
            const newPaidTerms = (c.paidTerms || 0) + 1;
            const totalTerms = c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1;
            const newStatus = newPaidTerms >= totalTerms ? 'Completed' : 'Processing';
            return { ...c, paidTerms: newPaidTerms, status: newStatus };
          }
          return c;
        }));
        
        // Reset form
        setSelectedCaseToProcess(null);
        setPaymentMethod('');
        setDeductions(0);
        setDestinationDetails({});
        setTransactionRefId('');
        setIsConfirmed(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error processing settlement:', error);
      alert('Network error while processing settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Are you sure you want to delete ${record.id}?`)) return;
    try {
      const endpoint = record.originalCase.advancerCategory === 'Staff' ? `/api/claims/${record.rawId}` : `/api/cases/${record.rawId}`;
      const response = await apiFetch(endpoint, { method: 'DELETE' });
      if (response.ok) {
        setCases(cases.filter(c => c._id !== record.rawId));
        alert('Record deleted successfully');
      } else {
        const err = await response.json();
        alert(`Error: ${err.message}`);
      }
    } catch (e) {
      alert('Network error during deletion');
    }
  };

  const handleDownloadPDF = async (record) => {
    try {
      // Use existing case details and fetch settlements
      const caseData = record.originalCase;
      
      const settlementsRes = await apiFetch(`/api/settlements/case/${record.rawId}`);
      const settlements = settlementsRes.ok ? await settlementsRes.json() : [];

      const doc = new jsPDF();
      
      // Constants & Colors
      const primaryColor = [22, 45, 80]; // #162D50
      const accentColor = [100, 100, 100];
      const pageHeight = doc.internal.pageSize.height;
      
      // Header - Card Style
      let title = 'Client Payment';
      let subtitle = 'Record incoming payments from clients for services rendered.';
      let catColor = [22, 45, 80]; // Blue
      let iconColor = [230, 240, 255]; 
      
      const cat = caseData.advancerCategory || '';
      if (cat.toLowerCase().includes('staff')) {
        title = 'Staff Payment / Advance';
        subtitle = 'Process salary, advances, or expense reimbursements for staff.';
        catColor = [30, 130, 70]; // Green
        iconColor = [220, 245, 225];
      } else if (cat.toLowerCase().includes('vendor') || cat.toLowerCase().includes('host')) {
        title = 'Vendor / Host Company';
        subtitle = 'Process payments to external vendors or host companies.';
        catColor = [200, 100, 30]; // Orange
        iconColor = [255, 235, 220];
      } else if (cat.toLowerCase().includes('vc')) {
        title = 'VC Fund Transfer';
        subtitle = 'Log fund transfers and recoveries related to VC fund management.';
        catColor = [130, 50, 180]; // Purple
        iconColor = [245, 230, 255];
      }
      
      // Draw Card Border
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, 15, 182, 24, 2, 2, 'FD');
      
      // Draw Icon Box
      doc.setFillColor(...iconColor);
      doc.roundedRect(18, 19, 12, 12, 2, 2, 'F');
      
      // Draw Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(title, 34, 24);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(subtitle, 34, 30);
      
      // Document meta info
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 45);
      doc.text(`Document ID: REF-${Date.now().toString().slice(-6)}`, 142, 45);
      
      let nextY = 50;
      
      const addSectionHeader = (title, y) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...primaryColor);
        doc.text(title, 14, y);
        return y + 4;
      };

      // 1. CASE DETAILS
      nextY = addSectionHeader('CASE DETAILS', nextY);
      autoTable(doc, {
        startY: nextY,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', textColor: accentColor, cellWidth: 50 } },
        body: [
          ['Case ID:', record.id],
          ['Staff ID:', caseData.staffId || 'N/A'],
          ['Staff Name:', caseData.staffName || caseData.advancerName || 'N/A'],
          ['Expense Type:', caseData.expenseType || 'N/A'],
          ['Category:', caseData.advancerCategory || 'N/A']
        ]
      });
      nextY = doc.lastAutoTable.finalY + 6;

      // 2. PAYMENT PROGRESS & FINANCIAL SUMMARY
      nextY = addSectionHeader('FINANCIAL & PROGRESS SUMMARY', nextY);
      
      const totalTerms = caseData.installment_count || (caseData.installmentPlan ? (caseData.installmentPlan.match(/\d+/) ? parseInt(caseData.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
      const finalTotal = caseData.finalTotal || caseData.totalExpense || 0;
      const nextPaymentAmount = caseData.nextPaymentAmount || Math.round(finalTotal / totalTerms);
      const remainingBalance = Math.max(0, finalTotal - ((caseData.paidTerms || 0) * nextPaymentAmount));

      autoTable(doc, {
        startY: nextY,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 10 },
        styles: { fontSize: 10, cellPadding: 4 },
        head: [['Base Claim Amount', 'Status', 'Installment Plan', 'Terms Paid', 'Remaining Balance']],
        body: [
          [
            `${caseData.currency === 'JPY' ? '¥' : '$'}${finalTotal.toLocaleString()}`,
            caseData.status || 'N/A',
            caseData.installmentPlan || caseData.installment_plan || 'N/A',
            `${caseData.paidTerms || 0} / ${totalTerms}`,
            `${caseData.currency === 'JPY' ? '¥' : '$'}${remainingBalance.toLocaleString()}`
          ]
        ]
      });
      nextY = doc.lastAutoTable.finalY + 6;

      // 3. SETTLEMENT DETAILS
      nextY = addSectionHeader('SETTLEMENT DETAILS', nextY);
      autoTable(doc, {
        startY: nextY,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', textColor: accentColor, cellWidth: 50 } },
        body: [
          ['Settlement Method:', caseData.advancerCategory === 'Staff' ? (caseData.settlement_method || caseData.settlementMethod || 'N/A') : (caseData.collection_method || caseData.collectionMethod || 'N/A')],
          ['Start Month:', caseData.collection_start_month || caseData.collectionStartMonth || 'N/A']
        ]
      });
      nextY = doc.lastAutoTable.finalY + 6;

      // 4. TRANSACTION DETAILS
      nextY = addSectionHeader('TRANSACTION DETAILS', nextY);
      
      const transactionsBody = Array.from({ length: totalTerms }).map((_, index) => {
        const settlement = settlements[index];
        return [
          `Term ${index + 1}/${totalTerms}`,
          settlement ? new Date(settlement.paymentDate).toLocaleDateString() : '-',
          `${caseData.currency === 'JPY' ? '¥' : '$'}${nextPaymentAmount.toLocaleString()}`,
          settlement ? 'Paid' : 'Pending',
          settlement ? (settlement.destinationDetails?.bankName || 'N/A') : '-',
          settlement ? (settlement.destinationDetails?.accountNumber || 'N/A') : '-',
          settlement ? (settlement.transactionRefId || 'N/A') : '-'
        ];
      });

      autoTable(doc, {
        startY: nextY,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        head: [['Term', 'Date', 'Amount', 'Status', 'Bank', 'Account', 'Ref No.']],
        body: transactionsBody
      });
      
      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${totalPages}`, 196, pageHeight - 10, { align: 'right' });
        doc.text('This document is system-generated and valid without signature.', 14, pageHeight - 10);
      }

      doc.save(`${record.id}_Payment_Ledger.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error fetching settlement details for PDF extraction.');
    }
  };

  const handlePrintRecord = async (record) => {
    try {
      const response = await apiFetch(`/api/settlements/case/${record.rawId}`);
      const settlements = response.ok ? await response.json() : [];
      const latestSettlement = settlements.length > 0 ? settlements[0] : null;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print - ${record.id}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f8f9fa; width: 30%; font-weight: bold; }
              h2 { color: #162D50; border-bottom: 2px solid #162D50; padding-bottom: 10px; }
            </style>
          </head>
          <body>
            <h2>Payment Record: ${record.id}</h2>
            <table>
              <tr><th>Name</th><td>${latestSettlement ? latestSettlement.payeeName : record.name}</td></tr>
              <tr><th>Payment Method</th><td>${latestSettlement ? latestSettlement.paymentMethod : 'N/A'}</td></tr>
              <tr><th>Transaction Ref ID</th><td>${latestSettlement && latestSettlement.transactionRefId ? latestSettlement.transactionRefId : 'N/A'}</td></tr>
              <tr><th>Net Payable</th><td>¥${latestSettlement ? latestSettlement.financials.netPayable.toLocaleString() : '0'}</td></tr>
              <tr><th>Payment Date</th><td>${latestSettlement ? new Date(latestSettlement.paymentDate).toLocaleDateString() : 'N/A'}</td></tr>
            </table>
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (e) {
      alert('Error fetching settlement details for printing.');
    }
  };

  useEffect(() => {
    Promise.all([
      apiFetch('/api/cases').then(res => res.json()).catch(() => []),
      apiFetch('/api/claims').then(res => res.json()).catch(() => [])
    ]).then(([casesData, claimsData]) => {
      const mappedCases = casesData.map(c => ({
        ...c,
        advancerCategory: c.advancerCategory || 'Office',
        finalTotal: c.finalTotal || c.totalExpense || c.final_total_amount || 0,
        staffId: c.staffId || c.staff_id || 'N/A',
        staffName: c.staffName || c.staff_name || 'N/A',
        expenseType: c.expenseType || c.expense_type || 'N/A'
      }));

      const mappedClaims = claimsData.map(c => ({
        ...c,
        advancerCategory: 'Staff',
        finalTotal: c.totalExpenseAmount || c.total_expense_amount || 0,
        staffId: c.staffId || c.staff_id || 'N/A',
        staffName: c.fullName || c.full_name || 'N/A',
        expenseType: c.expenseType || c.expense_type || 'Claim',
        expensePeriodStart: c.expensePeriodStart || c.expense_period_start || c.createdAt,
        expensePeriodEnd: c.expensePeriodEnd || c.expense_period_end || c.createdAt,
      }));

      setCases([...mappedCases, ...mappedClaims]);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching data:', err);
      setLoading(false);
    });
  }, []);

  const paymentOptions = [
    {
      id: 'client',
      title: 'Client Payment',
      description: 'Record incoming payments from clients for services rendered.',
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
      borderColor: 'border-blue-200 hover:border-blue-500',
      categoryMatch: 'Office' // Map to Office for now
    },
    {
      id: 'staff',
      title: 'Staff Payment / Advance',
      description: 'Process salary, advances, or expense reimbursements for staff.',
      icon: Briefcase,
      color: 'bg-green-100 text-green-700',
      borderColor: 'border-green-200 hover:border-green-500',
      categoryMatch: 'Staff'
    },
    {
      id: 'vc_fund',
      title: 'VC Fund Transfer',
      description: 'Log fund transfers and recoveries related to VC fund management.',
      icon: Landmark,
      color: 'bg-purple-100 text-purple-700',
      borderColor: 'border-purple-200 hover:border-purple-500',
      categoryMatch: 'VC Fund' // Specific type mapping if available
    },
    {
      id: 'vendor',
      title: 'Vendor / Host Company',
      description: 'Process payments to external vendors or host companies.',
      icon: Building,
      color: 'bg-orange-100 text-orange-700',
      borderColor: 'border-orange-200 hover:border-orange-500',
      categoryMatch: 'Host Company'
    }
  ];

  if (selectedEntryType) {
    const selectedOption = paymentOptions.find(opt => opt.id === selectedEntryType);
    const Icon = selectedOption.icon;
    
    // Filter cases by matching category
    // Assuming 'client' = 'Office', 'staff' = 'Staff', 'vendor' = 'Host Company'
    // This logic can be refined based on actual data
    const relatedCases = cases.filter(c => 
      c.advancerCategory === selectedOption.categoryMatch || 
      (!c.advancerCategory && selectedOption.categoryMatch === 'Office')
    );

    const mappedRecords = relatedCases.map(c => {
      const totalTerms = c.installment_count || (c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
      const paidTerms = c.paidTerms || 0;
      const nextPaymentAmount = c.nextPaymentAmount || (c.finalTotal || c.totalExpense || 0) / totalTerms;
      const remainingBalance = (c.finalTotal || c.totalExpense || 0) - (paidTerms * nextPaymentAmount);

      // Status mapping based on overdue logic
      let status = 'On Track';
      if (c.bouncedCount > 0) status = 'Overdue';
      else if (paidTerms === totalTerms) status = 'Paid';
      else if (paidTerms >= totalTerms - 1 && totalTerms > 1) status = 'Near Completion';
      
      return {
        id: `${c.advancerCategory === 'Staff' ? '#CLM-' : '#CAS-'}${c._id.slice(-6).toUpperCase()}`,
        rawId: c._id,
        staffId: c.staffId || 'N/A',
        name: c.staffName || c.advancerName || 'Unknown',
        paymentTerm: c.installmentPlan || 'N/A',
        paidTerms,
        totalTerms,
        nextPaymentDate: c.nextPaymentDate ? new Date(c.nextPaymentDate).toLocaleDateString() : 'TBD',
        nextPaymentAmount,
        bouncedCount: c.bouncedCount || 0,
        remainingBalance: Math.max(0, remainingBalance),
        status,
        expenseType: c.expenseType || 'N/A',
        originalCase: c
      };
    }).filter(r => r.paidTerms > 0);
    
    const hasBouncedPayments = mappedRecords.some(r => r.bouncedCount > 0);

    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-10">
        <button 
          onClick={() => {
            setSelectedEntryType(null);
            setSelectedCaseToProcess(null);
          }}
          className="flex items-center text-[#162D50] hover:underline font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Selection
        </button>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto flex flex-col mb-6">
          <div className="bg-[#F8F9FA] p-6 border-b border-gray-200 flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedOption.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#162D50]">{selectedOption.title} Entry</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedOption.description}</p>
            </div>
          </div>
        </div>

        {/* Modern Payment Tracking Data Table */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden overflow-x-auto mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-[#F8F9FA] flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#162D50]">Installment / Payment Tracking</h3>
            <span className="text-sm text-gray-500">{mappedRecords.length} records found</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="border-b border-gray-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#162D50] focus:ring-[#162D50]"
                      checked={selectedRows.length === mappedRecords.length && mappedRecords.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRows(mappedRecords.map(r => r.rawId));
                        else setSelectedRows([]);
                      }}
                    />
                  </th>
                  <th className="py-4 px-6">Staff ID & Name</th>
                  <th className="py-4 px-6">Expense Type</th>
                  <th className="py-4 px-6">Payment Term</th>
                  <th className="py-4 px-6">Progress</th>
                  <th className="py-4 px-6">Next Payment / Total Paid</th>
                  {hasBouncedPayments && <th className="py-4 px-6 text-center">Bounced</th>}
                  <th className="py-4 px-6 text-right">Remaining Balance</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {mappedRecords.map(record => {
                  const isSelected = selectedRows.includes(record.rawId);
                  const isOverdue = record.status === 'Overdue';
                  const isActionRequired = record.status === 'Action Required';
                  const isNearCompletion = record.status === 'Near Completion';
                  const isOnTrack = record.status === 'On Track';
                  
                  let rowBg = 'bg-white hover:bg-gray-50';
                  if (isSelected) rowBg = 'bg-blue-50/50 border-l-4 border-[#162D50]';
                  else if (isOverdue) rowBg = 'bg-amber-50/50 hover:bg-amber-50';
                  else if (isActionRequired) rowBg = 'bg-rose-50/50 hover:bg-rose-50';

                  const progressPct = record.totalTerms > 0 ? Math.round((record.paidTerms / record.totalTerms) * 100) : 0;
                  let progressColor = 'bg-green-500';
                  if (isOverdue) progressColor = 'bg-amber-500';
                  if (isActionRequired) progressColor = 'bg-rose-500';
                  if (isNearCompletion) progressColor = 'bg-blue-500';

                  let statusBadge = '';
                  if (isOnTrack) statusBadge = 'bg-green-100 text-green-700';
                  else if (isOverdue) statusBadge = 'bg-amber-100 text-amber-700';
                  else if (isNearCompletion) statusBadge = 'bg-blue-100 text-blue-700';
                  else if (isActionRequired) statusBadge = 'bg-rose-100 text-rose-700';
                  else if (record.status === 'Completed') statusBadge = 'bg-gray-100 text-gray-700';

                  return (
                    <tr key={record.rawId} className={`${rowBg} transition-colors ${isSelected ? 'border-l-4 border-l-[#162D50]' : 'border-l-4 border-l-transparent'}`}>
                      <td className="py-4 px-6">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-[#162D50] focus:ring-[#162D50]"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedRows([...selectedRows, record.rawId]);
                            else setSelectedRows(selectedRows.filter(id => id !== record.rawId));
                          }}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#162D50]">{record.id}</div>
                        <div className="text-xs font-semibold text-gray-600 mt-1">{record.staffId}</div>
                        <div className="text-xs text-gray-500">{record.name}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-700 font-medium">
                        {record.expenseType}
                      </td>
                      <td className="py-4 px-6 text-gray-700 font-medium">
                        {record.paymentTerm}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${progressPct}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500 font-medium w-10 text-right">{record.paidTerms} / {record.totalTerms}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {record.status === 'Paid' ? (
                          <>
                            <div className="font-medium text-green-600 font-bold">
                              ¥{(record.originalCase.finalTotal || record.originalCase.totalExpense || 0).toLocaleString()}
                            </div>
                            <div className="text-xs mt-0.5 text-green-500 font-bold uppercase tracking-wider">
                              Total Paid
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`font-medium ${isOverdue || isActionRequired ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>
                              ¥{Math.round(record.nextPaymentAmount).toLocaleString()}
                            </div>
                            <div className={`text-xs mt-0.5 ${isOverdue || isActionRequired ? 'text-rose-500' : 'text-gray-500'}`}>
                              {record.nextPaymentDate}
                            </div>
                          </>
                        )}
                      </td>
                      {hasBouncedPayments && (
                        <td className="py-4 px-6 text-center">
                          {record.bouncedCount === 0 ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <div className="inline-flex items-center px-2 py-1 bg-red-50 border border-red-100 rounded-md text-red-600 text-xs font-bold">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {record.bouncedCount} item(s)
                            </div>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-6 text-right font-bold text-[#162D50]">
                        ¥{record.remainingBalance.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {record.status === 'Paid' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleDownloadPDF(record)}
                              title="Download PDF Receipt"
                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handlePrintRecord(record)}
                              title="Print Record"
                              className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteRecord(record)}
                              title="Delete Record"
                              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-2">Payment Entry Selection</h2>
          <p className="text-gray-500 text-sm">Please select the type of payment entry you want to process.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentOptions.map((option) => {
          const Icon = option.icon;
          
          const relatedCount = cases.filter(c => 
            c.advancerCategory === option.categoryMatch || 
            (!c.advancerCategory && option.categoryMatch === 'Office')
          ).length;

          return (
            <div 
              key={option.id}
              onClick={() => setSelectedEntryType(option.id)}
              className={`bg-white rounded-xl border ${option.borderColor} p-6 cursor-pointer shadow-sm hover:shadow-md transition-all group flex flex-col relative`}
            >
              <div className="flex items-start justify-between mb-4 mt-2">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${option.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#162D50] transition-colors">
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-[#162D50] mb-2">{option.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {option.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

