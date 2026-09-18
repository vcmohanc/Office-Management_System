import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { toastConfirm } from '../../utils/toastConfirm.jsx';

import { Landmark, Users, Briefcase, ArrowRight, ArrowLeft, Building2, Building, AlertTriangle, Trash2, Download, Printer, Search, Calendar, ChevronDown, Filter } from 'lucide-react';

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

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const generateGlobalPDF = (action = 'download', currentFilteredRecords = []) => {
    // We use a small setTimeout to ensure we don't block the UI thread during PDF generation
    setTimeout(() => {
      try {
        const recordsToExport = selectedRows.length > 0 
          ? currentFilteredRecords.filter(r => selectedRows.includes(r.rawId))
          : currentFilteredRecords;

        if (recordsToExport.length === 0) return toast.error("No records to export.");

        const doc = new jsPDF();
        
        // --- Classic & Professional Header ---
        const pageWidth = doc.internal.pageSize.width;
        
        // Company Name / Logo Placeholder
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(30, 30, 30);
        doc.text('OFFICE MANAGEMENT SYSTEM', 14, 22);
        
        // Report Title
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text('Payment Tracking Report', 14, 28);
        
        // Right-aligned Metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const dateStr = `Date: ${new Date().toLocaleDateString()}`;
        const recordStr = `Total Records: ${recordsToExport.length}`;
        doc.text(dateStr, pageWidth - 14 - doc.getTextWidth(dateStr), 22);
        doc.text(recordStr, pageWidth - 14 - doc.getTextWidth(recordStr), 28);
        
        // Horizontal divider line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 34, pageWidth - 14, 34);
        
        const tableData = recordsToExport.map(r => [
          r.id,
          r.name,
          r.workPlace,
          r.expenseType,
          `${r.startDate}\n${r.endDate}`,
          `${r.paidTerms} / ${r.totalTerms}`,
          `¥${r.remainingBalance.toLocaleString()}`,
          r.status
        ]);
        
        autoTable(doc, {
          startY: 40,
          head: [['Case ID', 'Name', 'Work Place', 'Expense Type', 'Date (Start/End)', 'Progress', 'Remaining', 'Status']],
          body: tableData,
          theme: 'grid',
          styles: { 
            font: 'times',
            fontSize: 9,
            textColor: [40, 40, 40],
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            cellPadding: 4
          },
          headStyles: { 
            fillColor: [245, 245, 245], 
            textColor: [20, 20, 20],
            fontStyle: 'bold',
            lineColor: [200, 200, 200]
          },
          alternateRowStyles: {
            fillColor: [252, 252, 252]
          },
          didDrawPage: function (data) {
            // Footer with page number
            const str = "Page " + doc.internal.getNumberOfPages();
            doc.setFont('times', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text(str, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
          }
        });
        
        if (action === 'print') {
          doc.autoPrint();
          const pdfBlob = doc.output('bloburl');
          
          // Print via a hidden iframe to avoid opening a new tab
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          iframe.src = pdfBlob;
          
          document.body.appendChild(iframe);
          
          // Clean up the iframe after printing (giving it enough time to spool)
          setTimeout(() => {
            document.body.removeChild(iframe);
            // URL.revokeObjectURL(pdfBlob) is handled internally by jsPDF/bloburl, but good practice
          }, 30000); // 30 seconds is safe for the user to interact with the print dialog
        } else {
          doc.save('payment_tracking_export.pdf');
        }
      } catch (err) {
        console.error("Error generating PDF:", err);
        toast.error("Failed to generate PDF. See console for details.");
      }
    }, 50);
  };

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
        toast.success('Settlement processed successfully!');
        
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
        toast.error(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error processing settlement:', error);
      toast.error('Network error while processing settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (record) => {
    const confirmed = await toastConfirm(`Are you sure you want to delete ${record.id}?`);
    if (!confirmed) return;
    try {
      const endpoint = record.originalCase.advancerCategory === 'Staff' ? `/api/claims/${record.rawId}` : `/api/cases/${record.rawId}`;
      const response = await apiFetch(endpoint, { method: 'DELETE' });
      if (response.ok) {
        setCases(cases.filter(c => c._id !== record.rawId));
        toast.success('Record deleted successfully');
      } else {
        const err = await response.json();
        toast.error(`Error: ${err.message}`);
      }
    } catch (e) {
      toast.error('Network error during deletion');
    }
  };

  const handleDownloadPDF = async (record) => {
    try {
      const doc = new jsPDF();
      
      // --- Classic & Professional Header ---
      const pageWidth = doc.internal.pageSize.width;
      
      // Company Name / Logo Placeholder
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      doc.text('OFFICE MANAGEMENT SYSTEM', 14, 22);
      
      // Report Title
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text('Payment Tracking Report', 14, 28);
      
      // Right-aligned Metadata
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dateStr = `Date: ${new Date().toLocaleDateString()}`;
      const recordStr = `Total Records: 1`;
      doc.text(dateStr, pageWidth - 14 - doc.getTextWidth(dateStr), 22);
      doc.text(recordStr, pageWidth - 14 - doc.getTextWidth(recordStr), 28);
      
      // Horizontal divider line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, 34, pageWidth - 14, 34);
      
      const tableData = [[
        record.id,
        record.name,
        record.workPlace,
        record.expenseType,
        `${record.startDate}\n${record.endDate}`,
        `${record.paidTerms} / ${record.totalTerms}`,
        `¥${record.remainingBalance.toLocaleString()}`,
        record.status
      ]];
      
      autoTable(doc, {
        startY: 40,
        head: [['Case ID', 'Name', 'Work Place', 'Expense Type', 'Date (Start/End)', 'Progress', 'Remaining', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { 
          font: 'times',
          fontSize: 9,
          textColor: [40, 40, 40],
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
          cellPadding: 4
        },
        headStyles: { 
          fillColor: [245, 245, 245], 
          textColor: [20, 20, 20],
          fontStyle: 'bold',
          lineColor: [200, 200, 200]
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        didDrawPage: function (data) {
          // Footer with page number
          const str = "Page " + doc.internal.getNumberOfPages();
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
      });
      
      doc.save(`${record.id}_Payment_Tracking.pdf`);
    } catch (e) {
      console.error(e);
      toast.error('Error generating PDF.');
    }
  };

  const handlePrintRecord = async (record) => {
    try {
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.width;
      
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      doc.text('OFFICE MANAGEMENT SYSTEM', 14, 22);
      
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text('Payment Tracking Report', 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dateStr = `Date: ${new Date().toLocaleDateString()}`;
      const recordStr = `Total Records: 1`;
      doc.text(dateStr, pageWidth - 14 - doc.getTextWidth(dateStr), 22);
      doc.text(recordStr, pageWidth - 14 - doc.getTextWidth(recordStr), 28);
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, 34, pageWidth - 14, 34);
      
      const tableData = [[
        record.id,
        record.name,
        record.workPlace,
        record.expenseType,
        `${record.startDate}\n${record.endDate}`,
        `${record.paidTerms} / ${record.totalTerms}`,
        `¥${record.remainingBalance.toLocaleString()}`,
        record.status
      ]];
      
      autoTable(doc, {
        startY: 40,
        head: [['Case ID', 'Name', 'Work Place', 'Expense Type', 'Date (Start/End)', 'Progress', 'Remaining', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { 
          font: 'times',
          fontSize: 9,
          textColor: [40, 40, 40],
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
          cellPadding: 4
        },
        headStyles: { 
          fillColor: [245, 245, 245], 
          textColor: [20, 20, 20],
          fontStyle: 'bold',
          lineColor: [200, 200, 200]
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        didDrawPage: function (data) {
          const str = "Page " + doc.internal.getNumberOfPages();
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
      });
      
      doc.autoPrint();
      const pdfBlob = doc.output('bloburl');
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = pdfBlob;
      
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 30000);
      
    } catch (e) {
      console.error(e);
      toast.error('Error generating print view.');
    }
  };

  useEffect(() => {
    Promise.all([
      apiFetch('/api/cases').then(res => res.json()).catch(() => []),
      apiFetch('/api/claims').then(res => res.json()).catch(() => []),
      apiFetch('/api/employees').then(res => res.json()).catch(() => [])
    ]).then(([casesData, claimsData, employeesData]) => {
      // Map employees for quick lookup by staffId or name
      const employeeMap = {};
      employeesData.forEach(emp => {
        const workplace = (emp.department && emp.department.length > 0) ? emp.department.join(', ') : 'N/A';
        if (emp.staffId) employeeMap[emp.staffId.toLowerCase()] = workplace;
        if (emp.romajiName) employeeMap[emp.romajiName.toLowerCase()] = workplace;
        if (emp.katakanaName) employeeMap[emp.katakanaName.toLowerCase()] = workplace;
      });

      const getWorkPlace = (staffId, name) => {
        if (staffId && employeeMap[staffId.toLowerCase()]) return employeeMap[staffId.toLowerCase()];
        if (name && employeeMap[name.toLowerCase()]) return employeeMap[name.toLowerCase()];
        return 'N/A';
      };

      const mappedCases = casesData.map(c => ({
        ...c,
        advancerCategory: c.advancerCategory || 'Office',
        finalTotal: c.finalTotal || c.totalExpense || c.final_total_amount || 0,
        staffId: c.staffId || c.staff_id || 'N/A',
        staffName: c.staffName || c.staff_name || 'N/A',
        expenseType: c.expenseType || c.expense_type || 'N/A',
        workPlace: getWorkPlace(c.staffId || c.staff_id, c.staffName || c.staff_name)
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
        workPlace: getWorkPlace(c.staffId || c.staff_id, c.fullName || c.full_name)
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
      
      const startDate = c.expensePeriodStart ? new Date(c.expensePeriodStart).toLocaleDateString() : (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A');
      
      let lastInstallmentDate = 'N/A';
      if (c.installment_records && c.installment_records.length > 0) {
        lastInstallmentDate = new Date(c.installment_records[c.installment_records.length - 1].due_date).toLocaleDateString();
      } else if (c.expected_settlement_date) {
        lastInstallmentDate = new Date(c.expected_settlement_date).toLocaleDateString();
      } else {
        lastInstallmentDate = c.expensePeriodEnd ? new Date(c.expensePeriodEnd).toLocaleDateString() : (c.nextPaymentDate ? new Date(c.nextPaymentDate).toLocaleDateString() : 'N/A');
      }
      const endDate = lastInstallmentDate;

      return {
        id: `${c.advancerCategory === 'Staff' ? '#CLM-' : '#CAS-'}${c._id.slice(-6).toUpperCase()}`,
        rawId: c._id,
        staffId: c.staffId || 'N/A',
        name: c.staffName || c.advancerName || 'Unknown',
        startDate,
        endDate,
        workPlace: c.workPlace || 'N/A',
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

    const filteredRecords = mappedRecords.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        r.id.toLowerCase().includes(searchLower) || 
        r.staffId.toLowerCase().includes(searchLower) || 
        r.name.toLowerCase().includes(searchLower);
      
      const matchesExpense = expenseTypeFilter === 'All' || r.expenseType === expenseTypeFilter;
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesDate = !dateFilter || r.nextPaymentDate === new Date(dateFilter).toLocaleDateString() || new Date(r.originalCase.nextPaymentDate).toISOString().split('T')[0] === dateFilter;

      return matchesSearch && matchesExpense && matchesStatus && matchesDate;
    });
    
    const hasBouncedPayments = filteredRecords.some(r => r.bouncedCount > 0);

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

        {/* Modern Premium Header */}
        <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm mb-8 group transition-all duration-300 hover:shadow-md">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 via-blue-50/20 to-transparent rounded-full blur-3xl opacity-70 pointer-events-none" />
          
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${selectedOption.color} shadow-sm ring-4 ring-gray-50 transition-transform duration-500 group-hover:scale-105`}>
              <Icon className="w-8 h-8" strokeWidth={1.5} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {selectedOption.title} Entry
                </h2>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                  Module
                </span>
              </div>
              <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
                {selectedOption.description}
              </p>
            </div>
          </div>
          
          {/* Bottom decorative accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#162D50] to-blue-400 opacity-90" />
        </div>

        {/* Modern Payment Tracking Data Table */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-[#F8F9FA] flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#162D50]">Installment / Payment Tracking</h3>
            <span className="text-sm text-gray-500">{filteredRecords.length} records found</span>
          </div>
          
          {/* Action Toolbar */}
          <div className="px-6 py-3 border-b border-gray-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Case ID, Staff ID, or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full md:w-80"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="relative">
                  <select 
                    value={expenseTypeFilter}
                    onChange={(e) => setExpenseTypeFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="All">All Expense Types</option>
                    <option value="Waiting Dormitory Fee">Waiting Dormitory Fee</option>
                    <option value="WIFI">WIFI</option>
                    <option value="Travel">Travel</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="On Track">On Track</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedRows.length > 0 && (
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  {selectedRows.length} items selected
                </span>
              )}
              <button onClick={() => generateGlobalPDF('download', filteredRecords)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button onClick={() => generateGlobalPDF('print', filteredRecords)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="border-b border-gray-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#162D50] focus:ring-[#162D50]"
                      checked={selectedRows.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRows(filteredRecords.map(r => r.rawId));
                        else setSelectedRows([]);
                      }}
                    />
                  </th>
                  <th className="py-4 px-6">Case ID</th>
                  <th className="py-4 px-6">Staff ID & Name</th>
                  <th className="py-4 px-6">Work Place</th>
                  <th className="py-4 px-6">Expense Type</th>
                  <th className="py-4 px-6">Payment Date (Start - End)</th>
                  <th className="py-4 px-6">Progress</th>
                  <th className="py-4 px-6">Next Payment / Total Paid</th>
                  {hasBouncedPayments && <th className="py-4 px-6 text-center">Bounced</th>}
                  <th className="py-4 px-6 text-right">Remaining Balance</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="py-8 text-center text-gray-500">
                      No records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    const isSelected = selectedRows.includes(record.rawId);
                    const isOverdue = record.status === 'Overdue';
                    const isActionRequired = record.status === 'Action Required';
                    const isNearCompletion = record.status === 'Near Completion';
                    const isOnTrack = record.status === 'On Track';
                    
                    let rowBg = 'bg-white hover:bg-gray-50';
                    if (isSelected) rowBg = 'bg-blue-50/50 border-l-4 border-[#162D50]';
                    else if (isOverdue) rowBg = 'bg-amber-50/50 hover:bg-amber-50';
                    else if (isActionRequired) rowBg = 'bg-rose-50/50 hover:bg-rose-50';
                    else if (index % 2 !== 0) rowBg = 'bg-[#FAFAFA] hover:bg-gray-50';

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
                    else if (record.status === 'Paid' || record.status === 'Completed') statusBadge = 'bg-gray-100 text-gray-700';

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
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-800">{record.staffId}</div>
                          <div className="text-xs text-gray-500 mt-1">{record.name}</div>
                        </td>
                        <td className="py-4 px-6 text-gray-700 font-medium">
                          {record.workPlace}
                        </td>
                        <td className="py-4 px-6 text-gray-700 font-medium">
                          {record.expenseType}
                        </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-800 font-medium">{record.startDate}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <ArrowRight className="w-3 h-3 text-gray-400 mr-1" />
                          {record.endDate}
                        </div>
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
                })
                )}
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

