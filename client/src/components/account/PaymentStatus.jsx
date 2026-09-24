import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/apiFetch.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Search, ChevronDown, Calendar, Download, Building, Landmark, AlertCircle, AlertTriangle, ArrowRight, ArrowLeft, Printer, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { toastConfirm } from '../../utils/toastConfirm.jsx';

export default function PaymentStatus() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [viewingDetails, setViewingDetails] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedBatchCases, setSelectedBatchCases] = useState([]);
  const [activePaymentTab, setActivePaymentTab] = useState('Office');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All Types');
  const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');

  // Settlement Form State
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deductions, setDeductions] = useState(0);
  const [destinationDetails, setDestinationDetails] = useState({});
  const [transactionRefId, setTransactionRefId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SSE Subscription
  useEffect(() => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const sse = new EventSource(`${apiUrl}/api/events?token=${token}`);

    sse.addEventListener('CASE_REGISTERED', (e) => {
      const c = JSON.parse(e.data);
      if (c.claim_id) {
        setCases(prev => [{
          ...c,
          advancerCategory: 'Staff',
          finalTotal: c.totalExpenseAmount || c.total_expense_amount || 0,
          staffId: c.staffId || c.staff_id || 'N/A',
          staffName: c.fullName || c.full_name || 'N/A',
          expenseType: c.expenseType || c.expense_type || 'Claim',
          expensePeriodStart: c.expensePeriodStart || c.expense_period_start || c.createdAt,
          expensePeriodEnd: c.expensePeriodEnd || c.expense_period_end || c.createdAt,
        }, ...prev]);
      } else {
        setCases(prev => [{
          ...c,
          advancerCategory: c.advancerCategory || 'Office',
          finalTotal: c.finalTotal || c.totalExpense || c.final_total_amount || 0,
          staffId: c.staffId || c.staff_id || 'N/A',
          staffName: c.staffName || c.staff_name || 'N/A',
          expenseType: c.expenseType || c.expense_type || 'N/A',
          expensePeriodStart: c.expensePeriodStart || c.expense_period_start || c.createdAt,
          expensePeriodEnd: c.expensePeriodEnd || c.expense_period_end || c.createdAt
        }, ...prev]);
      }
    });

    sse.addEventListener('CASE_UPDATED', (e) => {
      const c = JSON.parse(e.data);
      if (c.claim_id) {
        setCases(prev => prev.map(item => item._id === c._id ? {
          ...c,
          advancerCategory: 'Staff',
          finalTotal: c.totalExpenseAmount || c.total_expense_amount || 0,
          staffId: c.staffId || c.staff_id || 'N/A',
          staffName: c.fullName || c.full_name || 'N/A',
          expenseType: c.expenseType || c.expense_type || 'Claim',
          expensePeriodStart: c.expensePeriodStart || c.expense_period_start || c.createdAt,
          expensePeriodEnd: c.expensePeriodEnd || c.expense_period_end || c.createdAt,
        } : item));
      } else {
        setCases(prev => prev.map(item => item._id === c._id ? {
          ...c,
          advancerCategory: c.advancerCategory || 'Office',
          finalTotal: c.finalTotal || c.totalExpense || c.final_total_amount || 0,
          staffId: c.staffId || c.staff_id || 'N/A',
          staffName: c.staffName || c.staff_name || 'N/A',
          expenseType: c.expenseType || c.expense_type || 'N/A',
          expensePeriodStart: c.expensePeriodStart || c.expense_period_start || c.createdAt,
          expensePeriodEnd: c.expensePeriodEnd || c.expense_period_end || c.createdAt
        } : item));
      }
    });

    return () => sse.close();
  }, []);

  useEffect(() => {
    if (selectedCase) {
      const totalTerms = selectedCase.installmentPlan ? (selectedCase.installmentPlan.match(/\d+/) ? parseInt(selectedCase.installmentPlan.match(/\d+/)[0], 10) : 1) : 1;
      const claimAmount = selectedCase.nextPaymentAmount || Math.round((selectedCase.finalTotal || selectedCase.totalExpense || 0) / totalTerms);
      const advanceToRecover = selectedCase.previousBalance || 0;
      
      if (paymentMethod === 'Payroll Deduction') {
        setDeductions(claimAmount);
      } else if (advanceToRecover > 0) {
        setDeductions(Math.round(advanceToRecover / totalTerms));
      } else {
        setDeductions(0);
      }
    }
  }, [selectedCase, paymentMethod]);

  useEffect(() => {
    if (selectedCase) {
      // Auto-populate Payment Method based on agreed terms
      if (selectedCase.advancerCategory === 'Staff') {
        let method = selectedCase.settlement_method || selectedCase.settlementMethod || '';
        if (method === 'Cash') method = 'Petty Cash';
        setPaymentMethod(method);
      } else {
        let method = selectedCase.collection_method || selectedCase.collectionMethod || '';
        setPaymentMethod(method);
      }
    }
  }, [selectedCase]);

  useEffect(() => {
    if (selectedCase) {
      setSelectedBatchCases([selectedCase]);
    } else {
      setSelectedBatchCases([]);
    }
  }, [selectedCase]);

  const handleSelectCase = (c) => {
    setSelectedBatchCases(prev => 
      prev.some(item => item._id === c._id) 
        ? prev.filter(item => item._id !== c._id)
        : [...prev, c]
    );
  };

  const handleExport = (dataToExport) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Case ID', 'Period', 'Expense Type', 'Remaining Amount', 'Status', 'Advancer Category', 'Staff Name'];
    const csvRows = [headers.join(',')];

    for (const row of dataToExport) {
      const caseId = `#CAS-${(row._id || '').slice(-6).toUpperCase()}`;
      const period = `${row.expensePeriodStart ? new Date(row.expensePeriodStart).toLocaleDateString() : 'N/A'} - ${row.expensePeriodEnd ? new Date(row.expensePeriodEnd).toLocaleDateString() : 'N/A'}`;
      const expenseType = row.expenseType || 'N/A';
      
      const totalTerms = row.installment_count || (row.installmentPlan ? (row.installmentPlan.match(/\d+/) ? parseInt(row.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
      const paidTerms = row.paidTerms || 0;
      const nextPaymentAmount = row.nextPaymentAmount || (row.finalTotal || row.totalExpense || 0) / totalTerms;
      const remainingAmount = Math.max(0, (row.finalTotal || row.totalExpense || 0) - (paidTerms * nextPaymentAmount));
      
      const status = row.status || 'N/A';
      const advancerCategory = row.advancerCategory || 'N/A';
      const staffName = row.staffName || row.advancerName || 'N/A';

      const csvRow = [
        `"${caseId}"`,
        `"${period}"`,
        `"${expenseType}"`,
        `"${Math.round(remainingAmount)}"`,
        `"${status}"`,
        `"${advancerCategory}"`,
        `"${staffName}"`
      ];
      csvRows.push(csvRow.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAllCases = (e, currentCases) => {
    if (e.target.checked) {
      const newCases = [...selectedBatchCases];
      currentCases.forEach(c => {
        if (!newCases.some(item => item._id === c._id)) {
          newCases.push(c);
        }
      });
      setSelectedBatchCases(newCases);
    } else {
      const currentIds = currentCases.map(c => c._id);
      setSelectedBatchCases(prev => prev.filter(item => !currentIds.includes(item._id)));
    }
  };

  const handleFormSubmit = async (e, forceConfirmed = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (selectedBatchCases.length === 0 || (!isConfirmed && !forceConfirmed)) return;

    setIsSubmitting(true);
    let allSuccess = true;
    let remainingDeduction = deductions;
    let newCases = [...cases];
    
    for (const currentCase of selectedBatchCases) {
      const totalTerms = currentCase.installmentPlan ? (currentCase.installmentPlan.match(/\d+/) ? parseInt(currentCase.installmentPlan.match(/\d+/)[0], 10) : 1) : 1;
      const claimAmount = currentCase.nextPaymentAmount || Math.round((currentCase.finalTotal || currentCase.totalExpense || 0) / totalTerms);
      
      let caseDeduction = 0;
      if (remainingDeduction > 0) {
        if (remainingDeduction <= claimAmount) {
          caseDeduction = remainingDeduction;
          remainingDeduction = 0;
        } else {
          caseDeduction = claimAmount;
          remainingDeduction -= claimAmount;
        }
      }
      
      const payload = {
        processedBy: 'AdminUser', 
        payeeName: currentCase.staffName || currentCase.advancerName || 'N/A',
        paymentMethod,
        destinationDetails,
        financials: {
          claimAmount,
          deductions: caseDeduction,
          netPayable: claimAmount - caseDeduction
        },
        transactionRefId,
        paymentDate,
        isConfirmed: isConfirmed || forceConfirmed
      };

      try {
        const endpoint = currentCase.advancerCategory === 'Staff' ? `/api/claims/${currentCase._id}/settle` : `/api/cases/${currentCase._id}/settle`;
        const response = await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          newCases = newCases.map(c => {
            if (c._id === currentCase._id) {
              const newPaidTerms = (c.paidTerms || 0) + 1;
              const newStatus = newPaidTerms >= totalTerms ? 'Completed' : 'Processing';
              return { ...c, paidTerms: newPaidTerms, status: newStatus };
            }
            return c;
          });
        } else {
          allSuccess = false;
          const errorData = await response.json();
          toast.error(`Error processing case ${currentCase._id}: ${errorData.message}`);
        }
      } catch (error) {
        console.error('Error processing settlement:', error);
        allSuccess = false;
        toast.error(`Network error while processing case ${currentCase._id}`);
      }
    }
    
    setCases(newCases);
    setIsSubmitting(false);
    
    if (allSuccess) {
      toast.success('Settlement processed successfully for all selected cases!');
      setSelectedCase(null);
      setPaymentMethod('');
      setDeductions(0);
      setDestinationDetails({});
      setTransactionRefId('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setIsConfirmed(false);
      window.location.reload();
    }
  };

  const handleDeleteCase = async (caseObj) => {
    const displayId = caseObj.displayId || `#CAS-${caseObj._id.substring(caseObj._id.length - 6).toUpperCase()}`;
    const confirmed = await toastConfirm(`Are you sure you want to delete ${displayId}?`);
    if (!confirmed) return;
    try {
      const endpoint = caseObj.advancerCategory === 'Staff' ? `/api/claims/${caseObj._id}` : `/api/cases/${caseObj._id}`;
      const response = await apiFetch(endpoint, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCases(cases.filter(c => c._id !== caseObj._id));
      } else {
        const errorData = await response.json();
        toast.error(`Error deleting: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Network error while deleting');
    }
  };

  useEffect(() => {
    Promise.all([
      apiFetch('/api/cases').then(res => res.json()).catch(() => []),
      apiFetch('/api/claims').then(res => res.json()).catch(() => []),
      apiFetch('/api/options').then(res => res.json()).catch(() => [])
    ]).then(([casesData, claimsData, optionsData]) => {
      const mappedCases = casesData.map(c => ({
        ...c,
        advancerCategory: c.advancerCategory || 'Office',
        finalTotal: c.finalTotal || c.totalExpense || c.final_total_amount || 0,
        staffId: c.staffId || c.staff_id || 'N/A',
        staffName: c.staffName || c.staff_name || 'N/A',
        expenseType: c.expenseType || c.expense_type || 'N/A',
        expensePeriodStart: c.expensePeriodStart || c.expense_period_start || c.createdAt,
        expensePeriodEnd: c.expensePeriodEnd || c.expense_period_end || c.createdAt
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

      const allCases = [...mappedCases, ...mappedClaims];
      setCases(allCases);
      if (caseId) {
        const found = allCases.find(c => c._id === caseId || c.case_id === caseId);
        if (found) {
          setSelectedCase(found);
          setViewingDetails(true);
        }
      }
      
      const types = optionsData.filter(opt => opt.type === 'ExpenseType');
      setExpenseTypeOptions(types);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching data:', err);
      setLoading(false);
    });
  }, []);

  const postApprovalCases = cases.filter(c => {
    if (c.status === 'Completed') return false;
    const totalTerms = c.installment_count || (c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
    if (c.paidTerms >= totalTerms && totalTerms > 0) return false;
    
    return ['APPROVED_FOR_PAYMENT', 'Payment Pending', 'Processing', 'Overdue'].includes(c.status) || c.status === 'Approve for Payment' || c.status === 'Approved for Payment';
  });

  const officeCasesCount = postApprovalCases.filter(c => c.advancerCategory === 'Office').length;
  const staffCasesCount = postApprovalCases.filter(c => c.advancerCategory === 'Staff').length;
  const hostCompanyCasesCount = postApprovalCases.filter(c => c.advancerCategory === 'Host Company').length;

  const filteredCases = postApprovalCases.filter(c => {
    const matchesTab = c.advancerCategory === activePaymentTab || (!c.advancerCategory && activePaymentTab === 'Office');
    const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
    const matchesType = expenseTypeFilter === 'All Types' || c.expenseType === expenseTypeFilter;
    
    return matchesTab && matchesStatus && matchesType;
  });

  const tabCases = postApprovalCases.filter(c => c.advancerCategory === activePaymentTab || (!c.advancerCategory && activePaymentTab === 'Office'));

  const getRemainingBalance = (c) => {
    const totalTerms = c.installment_count || (c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
    const paidTerms = c.paidTerms || 0;
    const nextPaymentAmount = c.nextPaymentAmount || (c.finalTotal || c.totalExpense || 0) / totalTerms;
    return Math.max(0, (c.finalTotal || c.totalExpense || 0) - (paidTerms * nextPaymentAmount));
  };

  const totalOfficePayment = postApprovalCases.filter(c => c.advancerCategory === 'Office').reduce((sum, c) => sum + getRemainingBalance(c), 0);
  const totalStaffPayment = postApprovalCases.filter(c => c.advancerCategory === 'Staff').reduce((sum, c) => sum + getRemainingBalance(c), 0);
  const pendingCount = postApprovalCases.filter(c => c.status === 'Payment Pending' || c.status === 'APPROVED_FOR_PAYMENT').length;
  const processingCount = postApprovalCases.filter(c => c.status === 'Processing').length;
  const completedCount = postApprovalCases.filter(c => c.status === 'Completed').length;
  const overdueCount = postApprovalCases.filter(c => c.status === 'Overdue').length;

  if (selectedCase) {
    const personCases = postApprovalCases.filter(c => c.staffId === selectedCase.staffId && (c.advancerCategory === activePaymentTab || (!c.advancerCategory && activePaymentTab === 'Office')));
    const personTotalOfficePayment = personCases.filter(c => c.advancerCategory === 'Office').reduce((sum, c) => sum + getRemainingBalance(c), 0);
    const personTotalStaffPayment = personCases.filter(c => c.advancerCategory === 'Staff').reduce((sum, c) => sum + getRemainingBalance(c), 0);
    const personPendingCount = personCases.filter(c => c.status === 'Payment Pending' || c.status === 'APPROVED_FOR_PAYMENT').length;
    const personProcessingCount = personCases.filter(c => c.status === 'Processing').length;
    
    const filteredPersonCases = personCases.filter(c => {
      const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
      const matchesType = expenseTypeFilter === 'All Types' || c.expenseType === expenseTypeFilter;
      const matchesDateStart = !dateFilterStart || new Date(c.expensePeriodStart || c.createdAt) >= new Date(dateFilterStart);
      const matchesDateEnd = !dateFilterEnd || new Date(c.expensePeriodEnd || c.createdAt) <= new Date(dateFilterEnd);
      return matchesStatus && matchesType && matchesDateStart && matchesDateEnd;
    });

    let batchTotalNextPayment = selectedBatchCases.reduce((total, currentCase) => {
      const totalTerms = currentCase.installment_count || (currentCase.installmentPlan ? (currentCase.installmentPlan.match(/\d+/) ? parseInt(currentCase.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
      return total + (currentCase.nextPaymentAmount || Math.round((currentCase.finalTotal || currentCase.totalExpense || 0) / totalTerms));
    }, 0);

    let batchTotalBaseClaim = selectedBatchCases.reduce((total, currentCase) => {
      return total + (currentCase.finalTotal || currentCase.totalExpense || 0);
    }, 0);

    let batchTotalRemainingBalance = selectedBatchCases.reduce((total, currentCase) => {
      const totalTerms = currentCase.installment_count || (currentCase.installmentPlan ? (currentCase.installmentPlan.match(/\d+/) ? parseInt(currentCase.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
      const paymentAmount = currentCase.nextPaymentAmount || Math.round((currentCase.finalTotal || currentCase.totalExpense || 0) / totalTerms);
      return total + Math.max(0, (currentCase.finalTotal || currentCase.totalExpense || 0) - (((currentCase.paidTerms || 0) + 1) * paymentAmount));
    }, 0);

    // Auto add remaining balance to Net Payable if less than 1000 yen
    if (batchTotalRemainingBalance > 0 && batchTotalRemainingBalance < 1000) {
      batchTotalNextPayment += batchTotalRemainingBalance;
      batchTotalRemainingBalance = 0;
    }

    const selectedCaseTotalTerms = selectedCase.installment_count || (selectedCase.installmentPlan ? (selectedCase.installmentPlan.match(/\d+/) ? parseInt(selectedCase.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
    const selectedCaseCurrentTerm = Math.min((selectedCase.paidTerms || 0) + 1, selectedCaseTotalTerms);
    const generateReceiptPDF = () => {
      try {
        const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const primaryColor = [22, 45, 80];
        const lightBg = [241, 245, 249];
        const margin = { left: 10, right: 10 };
        const fs = (base) => +(base * 1.0).toFixed(1);
        const pad = (base) => +(base * 1.0).toFixed(1);
        const gap = (base) => +(base * 1.0).toFixed(1);
        const headerH = Math.round(26 * 1.0);

        const drawFooter = () => {
          doc.setFillColor(...primaryColor);
          doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(fs(6.5));
          doc.setTextColor(180, 200, 230);
          doc.text('Office Management System — Confidential', 10, pageHeight - 2.8);
          const pg = `Page ${doc.getNumberOfPages()}`;
          doc.text(pg, pageWidth - 10 - doc.getTextWidth(pg), pageHeight - 2.8);
        };

        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, headerH, 'F');
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 3.5, headerH, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fs(13));
        doc.setTextColor(255, 255, 255);
        doc.text('OFFICE MANAGEMENT SYSTEM', 11, headerH * 0.42);

        const title = selectedCase.advancerCategory === 'Staff' ? 'Reimbursement Receipt' : 'Settlement Ledger';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fs(8));
        doc.setTextColor(180, 200, 230);
        doc.text(title, 11, headerH * 0.78);

        doc.setFontSize(fs(7));
        doc.setTextColor(200, 215, 240);
        const dateStr = `Generated: ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`;
        doc.text(dateStr, pageWidth - 10 - doc.getTextWidth(dateStr), headerH * 0.42);
        
        const caseStr = selectedBatchCases.length === 1 ? `Case: #${selectedBatchCases[0]._id.slice(-6).toUpperCase()}` : `${selectedBatchCases.length} Cases Selected`;
        doc.text(caseStr, pageWidth - 10 - doc.getTextWidth(caseStr), headerH * 0.78);

        const statusTop = headerH;
        const statusH = 14;
        doc.setFillColor(...lightBg);
        doc.rect(0, statusTop, pageWidth, statusH, 'F');
        doc.setDrawColor(210, 220, 235);
        doc.setLineWidth(0.25);
        doc.line(0, statusTop + statusH, pageWidth, statusTop + statusH);

        const statusMidY = statusTop + statusH * 0.62;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fs(9.5));
        doc.setTextColor(22, 163, 74);
        doc.text(`Status: Pending Settlement`, 11, statusMidY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fs(8.5));
        doc.setTextColor(...primaryColor);
        const remStr = `Net Payable: JPY ${batchTotalNextPayment.toLocaleString()}`;
        doc.text(remStr, pageWidth - 10 - doc.getTextWidth(remStr), statusMidY);

        let curY = statusTop + statusH + gap(3);
        const cp = pad(2.8);
        const sharedStyles = {
          font: 'helvetica',
          fontSize: fs(8),
          textColor: [30, 40, 55],
          lineColor: [210, 220, 235],
          lineWidth: 0.15,
          cellPadding: { top: cp, bottom: cp, left: cp + 1, right: cp + 1 },
          overflow: 'linebreak',
          minCellHeight: 0,
        };
        const headS = {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: fs(8),
          cellPadding: { top: cp, bottom: cp, left: cp + 1, right: cp + 1 },
        };
        
        const secGap = gap(5);
        const titleGap = gap(3);

        // HEADER DETAILS
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fs(8.5));
        doc.setTextColor(...primaryColor);
        doc.text('HEADER DETAILS', 10, curY);

        autoTable(doc, {
          startY: curY + titleGap,
          margin,
          head: [['Payee', 'Payee ID', 'Base Claim Amount']],
          body: [[
            selectedCase.staffName || selectedCase.advancerName || 'N/A',
            selectedCase.staffId || 'N/A',
            `JPY ${batchTotalBaseClaim.toLocaleString()}`
          ]],
          theme: 'grid',
          styles: sharedStyles,
          headStyles: headS,
        });

        // ITEMIZED CLAIMS
        curY = doc.lastAutoTable.finalY + secGap;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fs(8.5));
        doc.setTextColor(...primaryColor);
        doc.text('ITEMIZED CLAIMS', 10, curY);

        const itemsBody = selectedBatchCases.map((c, idx) => {
          const totalTerms = c.installment_count || (c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
          const claimAmt = c.nextPaymentAmount || Math.round((c.finalTotal || c.totalExpense || 0) / totalTerms);
          return [
            String(idx + 1).padStart(2, '0'),
            `#${c._id.slice(-6).toUpperCase()}`,
            c.expenseType || 'General Expense',
            new Date(c.expensePeriodStart || c.createdAt).toLocaleDateString(),
            `JPY ${claimAmt.toLocaleString()}`
          ];
        });

        autoTable(doc, {
          startY: curY + titleGap,
          margin,
          head: [['No.', 'Claim ID', 'Type', 'Date', 'Amount']],
          body: itemsBody,
          theme: 'grid',
          styles: sharedStyles,
          headStyles: headS,
          alternateRowStyles: { fillColor: lightBg }
        });

        // AGREED TERMS (If Not Staff)
        if (selectedCase.advancerCategory !== 'Staff') {
          curY = doc.lastAutoTable.finalY + secGap;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(fs(8.5));
          doc.setTextColor(...primaryColor);
          doc.text('AGREED TERMS', 10, curY);

          autoTable(doc, {
            startY: curY + titleGap,
            margin,
            head: [['Collection Method', 'Installment Plan', 'Start Month', 'Current Term']],
            body: [[
              selectedCase.collection_method || selectedCase.collectionMethod || 'N/A',
              selectedCase.installment_plan || selectedCase.installmentPlan || 'N/A',
              selectedCase.collection_start_month || selectedCase.collectionStartMonth || 'N/A',
              selectedCaseTotalTerms > 1 ? `Term ${selectedCaseCurrentTerm} of ${selectedCaseTotalTerms}` : 'N/A'
            ]],
            theme: 'grid',
            styles: sharedStyles,
            headStyles: headS,
          });
        }

        if (paymentMethod) {
          curY = doc.lastAutoTable.finalY + secGap;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(fs(8.5));
          doc.setTextColor(...primaryColor);
          doc.text('TRANSACTION DETAILS', 10, curY);

          let txHead = [];
          if (paymentMethod === 'Pay in Salary' || paymentMethod === 'Payroll Deduction') {
            txHead = ['Date', 'Payment Method', 'Payroll Period', 'Ref No.', 'Net Payable'];
          } else if (paymentMethod === 'Company Check') {
            txHead = ['Date', 'Payment Method', 'Check No', 'Delivery Address', 'Ref No.', 'Net Payable'];
          } else if (paymentMethod === 'Corporate Card') {
            txHead = ['Date', 'Payment Method', 'Card Last 4', 'Cardholder Name', 'Ref No.', 'Net Payable'];
          } else {
            txHead = ['Date', 'Payment Method', 'Bank', 'Branch', 'Account', 'Ref No.', 'Net Payable'];
          }

          let txRow = [
            paymentDate ? new Date(paymentDate).toLocaleDateString('en-GB') : '—',
            paymentMethod
          ];

          const dest = destinationDetails || {};
          const refNo = transactionRefId || '—';

          if (paymentMethod === 'Pay in Salary' || paymentMethod === 'Payroll Deduction') {
            txRow.push(dest.payrollPeriod || '—', refNo);
          } else if (paymentMethod === 'Company Check') {
            txRow.push(dest.checkNumber || '—', dest.checkDelivery || '—', refNo);
          } else if (paymentMethod === 'Corporate Card') {
            txRow.push(dest.cardLast4 || '—', dest.cardholderName || '—', refNo);
          } else {
            txRow.push(dest.bankName || '—', dest.branchCode || '—', dest.accountNumber || '—', refNo);
          }

          txRow.push(`JPY ${batchTotalNextPayment.toLocaleString()}`);

          autoTable(doc, {
            startY: curY + titleGap,
            margin,
            head: [txHead],
            body: [txRow],
            theme: 'grid',
            styles: sharedStyles,
            headStyles: headS,
            alternateRowStyles: { fillColor: lightBg }
          });
        }

        drawFooter();
        doc.autoPrint();
        const blobUrl = doc.output('bloburl');
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.print();
            }
          }, 100);
        };

      } catch (err) {
        console.error('Error generating PDF:', err);
        toast.error('Failed to generate PDF: ' + (err.message || 'Unknown error'));
      }
    };

    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 pb-10">
        <button 
          onClick={() => setSelectedCase(null)}
          className="flex items-center text-[#162D50] hover:underline font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Payment List
        </button>

        <div className="mb-6 print:hidden">
          <h2 className="text-2xl font-bold text-[#162D50] mb-1">Staff Name: {selectedCase.staffName}</h2>
          <p className="text-gray-500 text-sm">Staff ID: {selectedCase.staffId}</p>
        </div>

        <div className="print:hidden space-y-6">
          {/* Filter Bar */}
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-4 flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Search</label>
              <div className="relative">
                <input type="text" placeholder="Search Case ID, Staff Name..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
              <div className="relative">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="All Statuses">All Statuses</option>
                  {[...new Set(personCases.map(c => c.status))].filter(Boolean).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-xs font-bold text-gray-600 mb-1">Expense Type</label>
              <div className="relative">
                <select value={expenseTypeFilter} onChange={e => setExpenseTypeFilter(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="All Types">All Types</option>
                  {expenseTypeOptions.map(opt => (
                    <option key={opt._id || opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="w-32">
                <label className="block text-xs font-bold text-gray-600 mb-1">Start Date</label>
                <input type="date" value={dateFilterStart} onChange={e => setDateFilterStart(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-bold text-gray-600 mb-1">End Date</label>
                <input type="date" value={dateFilterEnd} onChange={e => setDateFilterEnd(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap h-[38px]">
                Apply Filters
              </button>
              <button onClick={() => handleExport(filteredPersonCases)} className="flex items-center bg-[#162D50] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm whitespace-nowrap h-[38px]">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden overflow-x-auto mt-6 print:hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-[#F8F9FA]">
            <h3 className="text-lg font-bold text-[#162D50]">Payment History & Related Cases</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-6 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-[#162D50] focus:ring-[#162D50]"
                    checked={filteredPersonCases.length > 0 && filteredPersonCases.every(c => selectedBatchCases.some(item => item._id === c._id))}
                    onChange={(e) => handleSelectAllCases(e, filteredPersonCases)}
                  />
                </th>
                <th className="py-3 px-6">Case ID</th>
                <th className="py-3 px-6">Period</th>
                <th className="py-3 px-6">Expense Type</th>
                <th className="py-3 px-6">Remaining Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredPersonCases.length === 0 ? (
                <tr><td colSpan="6" className="py-4 px-6 text-center text-gray-500">No cases found matching filters.</td></tr>
              ) : (
                filteredPersonCases.map(c => (
                <tr key={c._id} className={`hover:bg-gray-50 transition-colors ${selectedBatchCases.some(item => item._id === c._id) ? 'bg-blue-50' : ''}`}>
                  <td className="py-4 px-6">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#162D50] focus:ring-[#162D50]"
                      checked={selectedBatchCases.some(item => item._id === c._id)}
                      onChange={() => handleSelectCase(c)}
                    />
                  </td>
                  <td className="py-4 px-6 font-medium text-[#162D50]">#CAS-{c._id.slice(-6).toUpperCase()}</td>
                  <td className="py-4 px-6 text-gray-600">{c.expensePeriodStart ? new Date(c.expensePeriodStart).toLocaleDateString() : 'N/A'} - {c.expensePeriodEnd ? new Date(c.expensePeriodEnd).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-4 px-6 text-gray-600">{c.expenseType}</td>
                  <td className="py-4 px-6 font-bold text-[#162D50]">{c.currency === 'JPY' ? '¥' : '$'}{Math.round(getRemainingBalance(c)).toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      c.status === 'Payment Pending' || c.status === 'APPROVED_FOR_PAYMENT' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      c.status === 'Processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      c.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => setSelectedCase(c)} className="text-[#162D50] font-bold hover:underline text-xs">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
        {/* Dynamic Settlement Form / Receipt */}
        <div className="mt-12 font-sans print-area print:mt-0 print:w-full print:[print-color-adjust:exact]" id="settlement-form">
          {/* Jagged top */}
          <div className="h-4 w-full print:hidden" style={{
            background: 'linear-gradient(-45deg, #F5F1E6 8px, transparent 0), linear-gradient(45deg, #F5F1E6 8px, transparent 0)',
            backgroundPosition: 'left-bottom',
            backgroundRepeat: 'repeat-x',
            backgroundSize: '16px 16px'
          }}></div>
          
          <div className="bg-[#F5F1E6] p-8 md:p-12 text-[#162D50] rounded-b-md shadow-sm print:bg-white print:shadow-none print:p-4">
            <div className="border-b-2 border-dashed border-[#162D50] pb-6 mb-8 print:pb-2 print:mb-4 relative text-center">
              <div className="absolute right-0 top-0 print:hidden">
                <button 
                  type="button"
                  onClick={() => generateReceiptPDF()}
                  className="flex items-center px-4 py-2 border-2 border-[#162D50] hover:bg-[#162D50] hover:text-[#F5F1E6] text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
              </div>
              <h3 className="text-2xl font-bold tracking-widest uppercase mb-2">
                {selectedCase.advancerCategory === 'Staff' ? 'Reimbursement Receipt' : 'Settlement Ledger'}
              </h3>
              <p className="font-mono text-sm tracking-widest">
                {selectedBatchCases.length} {selectedBatchCases.length === 1 ? 'CASE' : 'CASES'} SELECTED
              </p>
            </div>
            
            <form className="space-y-8 print:space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const confirm = await toastConfirm("Are you sure you want to record this payment?");
              if (confirm) {
                setIsConfirmed(true);
                setTimeout(() => handleFormSubmit(e, true), 0);
              }
            }}>
              {/* Header Details */}
              <div className="grid grid-cols-2 gap-8 print:gap-4 border-b border-dashed border-[#162D50] pb-8 print:pb-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-gray-500">{selectedCase.advancerCategory === 'Staff' ? 'Employee' : 'Payee'}</label>
                  <div className="font-mono text-xl">{selectedCase.staffName || selectedCase.advancerName || 'N/A'}</div>
                  {selectedCase.staffId && <div className="font-mono text-xs text-gray-500 mt-1">ID: {selectedCase.staffId}</div>}
                </div>
                <div className="text-right">
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-gray-500">Base Claim Amount</label>
                  <div className="font-mono text-2xl">¥ {batchTotalBaseClaim.toLocaleString()}</div>
                </div>
              </div>

              {/* Itemized Case Details */}
              <div className="border-b border-dashed border-[#162D50] pb-8 mb-8 print:pb-4 print:mb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 print:mb-2">Itemized Claims</div>
                <div className="grid grid-cols-12 gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">
                  <div className="col-span-1">No.</div>
                  <div className="col-span-3">Claim ID</div>
                  <div className="col-span-4">Type</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                <div className="space-y-4 print:space-y-2">
                  {selectedBatchCases.map((c, idx) => {
                    const totalTerms = c.installment_count || (c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
                    const claimAmount = c.nextPaymentAmount || Math.round((c.finalTotal || c.totalExpense || 0) / totalTerms);
                    return (
                      <div key={c._id} className="grid grid-cols-12 gap-4 text-sm items-center">
                        <div className="col-span-1 font-mono text-gray-500">{String(idx + 1).padStart(2, '0')}</div>
                        <div className="col-span-3 font-mono">#{c._id.slice(-6).toUpperCase()}</div>
                        <div className="col-span-4 truncate font-medium">{c.expenseType || 'General Expense'}</div>
                        <div className="col-span-2 font-mono text-gray-500 text-xs">
                          {new Date(c.expensePeriodStart || c.createdAt).toLocaleDateString()}
                        </div>
                        <div className="col-span-2 text-right font-mono font-bold">¥ {claimAmount.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agreed Terms (Read-Only) */}
              {selectedCase.advancerCategory !== 'Staff' && (
                <div className="border-b border-dashed border-[#162D50] pb-8 mb-8 print:pb-4 print:mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 print:mb-2">Agreed Terms</div>
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400">Collection / Settlement Method</label>
                      <div className="font-mono text-sm">{selectedCase.advancerCategory === 'Staff' ? (selectedCase.settlement_method || selectedCase.settlementMethod || 'N/A') : (selectedCase.collection_method || selectedCase.collectionMethod || 'N/A')}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400">Installment Plan</label>
                      <div className="font-mono text-sm">{selectedCase.installment_plan || selectedCase.installmentPlan || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400">Start Month</label>
                      <div className="font-mono text-sm">{selectedCase.collection_start_month || selectedCase.collectionStartMonth || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400">Current Term</label>
                      <div className="font-mono text-sm">
                        {selectedCaseTotalTerms > 1 ? `Term ${selectedCaseCurrentTerm} of ${selectedCaseTotalTerms}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method & Deductions Form (Interactive) */}
              <div className="mt-8 print:hidden border-t border-dashed border-[#162D50] pt-8">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Record Payment</div>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method <span className="text-red-500">*</span></label>
                      <select 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border border-gray-400 bg-white/70 rounded-none px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono text-sm"
                        required
                      >
                        <option value="" disabled>Select Method</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        {selectedCase.advancerCategory === 'Staff' ? (
                          <>
                            <option value="Pay in Salary">Pay in Salary</option>
                            <option value="Petty Cash">Petty Cash</option>
                            <option value="Company Check">Company Check</option>
                          </>
                        ) : (
                          <>
                            <option value="Corporate Card">Corporate Card</option>
                            <option value="Cash">Cash</option>
                            <option value="Payroll Deduction">Payroll Deduction</option>
                          </>
                        )}
                      </select>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date <span className="text-red-500">*</span></label>
                      <input 
                        type="date" 
                        required 
                        value={paymentDate} 
                        onChange={(e) => setPaymentDate(e.target.value)} 
                        className="w-full border border-gray-400 bg-white/70 rounded-none px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono text-sm" 
                      />
                    </div>
                  </div>

                  {paymentMethod === 'Bank Transfer' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white/50 p-5 rounded border-2 border-dashed border-gray-300">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Bank Name <span className="text-red-500">*</span></label>
                        <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, bankName: e.target.value})} className="w-full border border-gray-400 bg-white/70 rounded-none px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Branch Code <span className="text-red-500">*</span></label>
                        <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, branchCode: e.target.value})} className="w-full border border-gray-400 bg-white/70 rounded-none px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Account No <span className="text-red-500">*</span></label>
                        <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, accountNumber: e.target.value})} className="w-full border border-gray-400 bg-white/70 rounded-none px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono" required />
                      </div>
                    </div>
                  )}

                  {(paymentMethod === 'Payroll Deduction' || paymentMethod === 'Pay in Salary') && (
                    <div className="space-y-4 bg-white/50 p-5 rounded border-2 border-dashed border-gray-300">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-2">Target Payroll Period <span className="text-red-500">*</span></label>
                        <input type="month" onChange={(e) => setDestinationDetails({...destinationDetails, payrollPeriod: e.target.value})} className="w-full border border-gray-400 bg-white/70 rounded-none px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono" required />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Company Check' && (
                    <div className="grid grid-cols-2 gap-6 bg-white/50 p-5 rounded border-2 border-dashed border-gray-300">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Check Number <span className="text-red-500">*</span></label>
                        <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, checkNumber: e.target.value})} className="w-full border border-gray-400 bg-white/70 rounded-none px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Mailing Address / Delivery <span className="text-red-500">*</span></label>
                        <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, checkDelivery: e.target.value})} className="w-full border border-gray-400 bg-white/70 rounded-none px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono" required />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Corporate Card' && (
                    <div className="grid grid-cols-2 gap-6 bg-white/50 p-5 rounded border-2 border-dashed border-gray-300">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Card Used (Last 4) <span className="text-red-500">*</span></label>
                        <input type="text" maxLength={4} pattern="\d{4}" onChange={(e) => setDestinationDetails({...destinationDetails, cardLast4: e.target.value})} className="w-full border border-gray-400 bg-white/70 rounded-none px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Cardholder Name <span className="text-red-500">*</span></label>
                        <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, cardholderName: e.target.value})} className="w-full border border-gray-400 bg-white/70 rounded-none px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono" required />
                      </div>
                    </div>
                  )}

                  {(paymentMethod === 'Cash' || paymentMethod === 'Petty Cash') && (
                    <div className="bg-white/50 p-5 rounded border-2 border-dashed border-gray-300">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Collected By / Receiver Name <span className="text-red-500">*</span></label>
                      <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, receiverName: e.target.value})} className="w-full border border-gray-400 bg-white/70 rounded-none px-3 py-2 text-sm focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono" required />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Ref</label>
                      <input 
                        type="text" 
                        value={transactionRefId} 
                        onChange={(e) => setTransactionRefId(e.target.value)} 
                        className="w-full border border-gray-400 bg-white/70 rounded-none px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono text-sm" 
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Less Deductions</label>
                      <div className="relative">
                        <span className="absolute left-4 top-2.5 text-gray-500 font-medium font-mono text-sm">¥</span>
                        <input 
                          type="number" 
                          value={deductions} 
                          onChange={(e) => setDeductions(Number(e.target.value) || 0)} 
                          className="w-full pl-9 border border-gray-400 bg-white/70 rounded-none px-4 py-2.5 text-red-600 font-medium focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none font-mono text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/50 p-6 rounded border-2 border-dashed border-[#162D50] mt-6 flex flex-col sm:flex-row justify-between items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Net Payable Amount</p>
                      <div className="font-mono text-xs text-gray-500 mt-1">Remaining Balance: ¥ {batchTotalRemainingBalance.toLocaleString()}</div>
                    </div>
                    <div className="font-mono text-3xl font-bold text-[#162D50] mt-4 sm:mt-0">
                      ¥{Math.max(0, batchTotalNextPayment - deductions).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 mt-6">
                    <button 
                      type="button" 
                      onClick={() => {
                        setPaymentMethod('');
                        setDeductions(0);
                        setDestinationDetails({});
                      }}
                      className="px-6 py-2 border-2 border-[#162D50] rounded-none text-xs font-bold uppercase tracking-widest text-[#162D50] hover:bg-gray-100 transition-colors"
                    >
                      Clear
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !paymentMethod}
                      className="px-8 py-2 bg-[#162D50] text-[#F5F1E6] rounded-none text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? 'Processing...' : 'Record Payment'}
                      {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (viewingDetails) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-10">
        <button 
          onClick={() => setViewingDetails(false)}
          className="flex items-center text-[#162D50] hover:underline font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Payment List
        </button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#162D50] mb-1">Payroll & Settlement Export</h2>
            <p className="text-gray-500 text-sm">Generate bulk data files for payroll integration and banking transfers.</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white text-sm text-gray-700">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              <span>Oct 1 - Oct 31, 2023</span>
            </div>
            <button onClick={() => handleExport(cases)} className="flex items-center bg-[#162D50] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">TOTAL OFFICE PAYMENT</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-[#162D50]">¥{totalOfficePayment.toLocaleString()}</p>
                <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                  <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                  </div>
                  {postApprovalCases.filter(c => c.advancerCategory === 'Office').length} Office Cases
                </div>
              </div>
              <Landmark className="w-10 h-10 text-gray-100" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">TOTAL STAFF PAYMENT</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-[#162D50]">¥{totalStaffPayment.toLocaleString()}</p>
                <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                  <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                  </div>
                  {postApprovalCases.filter(c => c.advancerCategory === 'Staff').length} Staff Cases
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-yellow-400 p-5 rounded-md shadow-sm border-l-4 border-l-yellow-400">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">PENDING ADJUSTMENTS</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-[#162D50]">{pendingCount} items</p>
                <div className="flex items-center mt-2 text-xs text-yellow-600 font-medium">
                  Requires review before
                  <br />export
                </div>
              </div>
              <div className="flex flex-col justify-between h-full items-end">
                <AlertCircle className="w-10 h-10 text-yellow-100" />
                <ArrowRight className="w-4 h-4 text-yellow-600 mt-2 cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-red-400 p-5 rounded-md shadow-sm border-l-4 border-l-red-500">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">BOUNCED PAYMENTS</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-red-600">{processingCount} items</p>
                <div className="flex items-center mt-2 text-xs text-red-500 font-medium">
                  Requires immediate
                  <br />resolution
                </div>
              </div>
              <div className="flex flex-col justify-between h-full items-end">
                <AlertTriangle className="w-10 h-10 text-red-100" />
                <span className="text-red-500 font-bold mt-2 cursor-pointer">!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Table Section */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden overflow-x-auto">
          {/* Tabs and counts */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button className="flex items-center px-4 py-1.5 bg-[#162D50] text-white rounded-full text-sm font-medium">
                Active Installments <span className="ml-2 bg-blue-900 text-white px-2 rounded-full text-xs opacity-80">{pendingCount + processingCount}</span>
              </button>
              <button className="flex items-center px-4 py-1.5 text-gray-500 hover:bg-gray-100 rounded-full text-sm font-medium">
                Completed <span className="ml-2 bg-gray-200 text-gray-600 px-2 rounded-full text-xs">{completedCount}</span>
              </button>
              <button className="flex items-center px-4 py-1.5 text-gray-500 hover:bg-gray-100 rounded-full text-sm font-medium">
                Overdue <span className="ml-2 bg-gray-200 text-gray-600 px-2 rounded-full text-xs">{overdueCount}</span>
              </button>
              
              <div className="flex items-center space-x-2 ml-4 border-l border-gray-200 pl-4">
                <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md text-xs font-bold flex items-center">
                  ! {overdueCount} Overdue
                </span>
                <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-xs font-bold flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" /> {processingCount} Bounced
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: {tabCases.length} items
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 bg-[#F8F9FA] border-b border-gray-200 flex space-x-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search installments by Staff ID or Name..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-300" />
            </div>
            <div className="relative w-48">
              <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm appearance-none focus:outline-none focus:border-gray-300 text-gray-600">
                <option>Filter by Category</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button className="px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500">
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="py-3 px-4">Staff ID & Name</th>
                <th className="py-3 px-4">Payment Term</th>
                <th className="py-3 px-4 w-32">Progress</th>
                <th className="py-3 px-4">Next Payment</th>
                <th className="py-3 px-4 text-center">Bounced</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tabCases.length === 0 ? (
                <tr><td colSpan="8" className="py-4 px-6 text-center text-gray-500">No data found.</td></tr>
              ) : (
                tabCases.map((c, index) => (
                  <tr key={c._id || index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#162D50]">{c.staffId}</div>
                      <div className="text-xs text-gray-500">{c.staffName}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{c.installmentPlan || '1 month'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden overflow-x-auto">
                          <div className="h-full bg-blue-500" style={{ width: c.status === 'Completed' ? '100%' : '50%' }}></div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{c.status === 'Completed' ? '1/1' : '0/1'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-500 text-xs">{new Date(c.expectedSettlementDate).toLocaleDateString('en-US')}</div>
                      <div className="font-bold text-gray-800">{c.currency === 'JPY' ? '¥' : '$'}{(c.finalTotal || 0).toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400">-</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-800">{c.currency === 'JPY' ? '¥' : '$'}{(c.finalTotal || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        c.status === 'Payment Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        c.status === 'Processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        c.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        c.status === 'Overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 pb-10">
      <h2 className="text-2xl font-bold text-[#162D50] mb-4">Payment Application List</h2>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">TOTAL OFFICE PAYMENT</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">¥{totalOfficePayment.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
                {postApprovalCases.filter(c => c.advancerCategory === 'Office').length} Office Cases
              </div>
            </div>
            <Landmark className="w-10 h-10 text-gray-100" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">TOTAL STAFF PAYMENT</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">¥{totalStaffPayment.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
                {postApprovalCases.filter(c => c.advancerCategory === 'Staff').length} Staff Cases
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-yellow-400 p-5 rounded-md shadow-sm border-l-4 border-l-yellow-400">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">PENDING ADJUSTMENTS</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">{pendingCount} items</p>
              <div className="flex items-center mt-2 text-xs text-yellow-600 font-medium">
                Requires review before
                <br />export
              </div>
            </div>
            <div className="flex flex-col justify-between h-full items-end">
              <AlertCircle className="w-10 h-10 text-yellow-100" />
              <ArrowRight className="w-4 h-4 text-yellow-600 mt-2 cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-red-400 p-5 rounded-md shadow-sm border-l-4 border-l-red-500">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">BOUNCED PAYMENTS</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-red-600">{processingCount} items</p>
              <div className="flex items-center mt-2 text-xs text-red-500 font-medium">
                Requires immediate
                <br />resolution
              </div>
            </div>
            <div className="flex flex-col justify-between h-full items-end">
              <AlertTriangle className="w-10 h-10 text-red-100" />
              <span className="text-red-500 font-bold mt-2 cursor-pointer">!</span>
            </div>
          </div>
        </div>
      </div>
      

      {/* Top Tabs */}
      <div className="bg-[#F2F4F7] p-1 rounded-md flex space-x-1 mb-4 border border-gray-200">
        <button 
          onClick={() => setActivePaymentTab('Office')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activePaymentTab === 'Office' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          Office Payment Cases <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activePaymentTab === 'Office' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{officeCasesCount}</span>
        </button>
        <button 
          onClick={() => setActivePaymentTab('Staff')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activePaymentTab === 'Staff' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          Staff Payment Cases <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activePaymentTab === 'Staff' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{staffCasesCount}</span>
        </button>
        <button 
          onClick={() => setActivePaymentTab('Host Company')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activePaymentTab === 'Host Company' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          Host Company Cases <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activePaymentTab === 'Host Company' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{hostCompanyCasesCount}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-4 flex items-end space-x-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">Search</label>
          <div className="relative">
            <input type="text" placeholder="Search Case ID, Staff Name..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
              <option value="All Statuses">All Statuses</option>
              {[...new Set(cases.map(c => c.status))].filter(Boolean).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-600 mb-1">Expense Type</label>
          <div className="relative">
            <select value={expenseTypeFilter} onChange={e => setExpenseTypeFilter(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
              <option value="All Types">All Types</option>
              {expenseTypeOptions.map(opt => (
                <option key={opt._id || opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-600 mb-1">Date Range</label>
          <div className="relative">
            <input type="text" placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap h-[38px]">
            Apply Filters
          </button>
          <button onClick={() => handleExport(filteredCases)} className="flex items-center bg-[#162D50] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm whitespace-nowrap h-[38px]">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-600">
              <th className="py-3 px-6">Case ID</th>
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Staff Name</th>
              <th className="py-3 px-6">Expense Type</th>
              <th className="py-3 px-6">Remaining Amount</th>
              <th className="py-3 px-6">Collection Terms</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-4 px-6 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-4 px-6 text-center text-gray-500">No cases found.</td>
              </tr>
            ) : (
              filteredCases.map(c => {
                const totalTerms = c.installment_count || (c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
                const paidTerms = c.paidTerms || 0;
                const pendingTerms = Math.max(0, totalTerms - paidTerms);
                const isCompleted = paidTerms >= totalTerms;
                
                // Override status badge if completed via installment logic
                const displayStatus = isCompleted ? 'Completed' : c.status;

                return (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-600">
                      {c.advancerCategory === 'Staff' ? '#CLM-' : '#CAS-'}{c._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(c.expensePeriodStart).toLocaleDateString('en-US')}
                    </td>
                    <td className="py-4 px-6 text-gray-800">{c.staffName}</td>
                    <td className="py-4 px-6 text-gray-600">{c.expenseType}</td>
                    <td className="py-4 px-6 font-bold text-gray-800">
                      {c.currency === 'JPY' ? '¥' : '$'}{Math.round(getRemainingBalance(c)).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-800 font-medium whitespace-nowrap">
                        {c.advancerCategory === 'Staff' ? (c.settlement_method || c.settlementMethod || 'N/A') : (c.collection_method || c.collectionMethod || 'N/A')}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap mt-1">
                        {c.installment_plan || c.installmentPlan || 'N/A'}
                      </div>
                      {totalTerms > 1 && (
                        <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                          Term {Math.min(paidTerms, totalTerms)} of {totalTerms} Completed ({pendingTerms} Pending)
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        displayStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        (displayStatus === 'Processing' || displayStatus === 'APPROVED_FOR_PAYMENT') ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        displayStatus === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {totalTerms > 1 ? `${Math.min(paidTerms, totalTerms)}/${totalTerms} Completed` : (displayStatus === 'Processing' ? 'APPROVED_FOR_PAYMENT' : displayStatus)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button onClick={() => setSelectedCase(c)} className="text-[#162D50] font-bold hover:underline mr-4">View Details</button>
                      <button onClick={() => handleDeleteCase(c)} className="text-red-500 font-bold hover:underline inline-flex items-center">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
