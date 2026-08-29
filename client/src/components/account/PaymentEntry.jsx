import { useState, useEffect } from 'react';
import { Landmark, Users, Briefcase, ArrowRight, ArrowLeft, Building2, Building, AlertTriangle } from 'lucide-react';

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
      const response = await fetch(`http://localhost:5000/api/cases/${selectedCaseToProcess._id}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
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

  useEffect(() => {
    fetch('http://localhost:5000/api/cases')
      .then(res => res.json())
      .then(data => {
        setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching cases:', err);
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
      const totalTerms = c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1;
      const paidTerms = c.paidTerms || 0;
      const nextPaymentAmount = c.nextPaymentAmount || (c.finalTotal || c.totalExpense || 0) / totalTerms;
      const remainingBalance = (c.finalTotal || c.totalExpense || 0) - (paidTerms * nextPaymentAmount);

      // Status mapping based on overdue logic
      let status = 'On Track';
      if (c.bouncedCount > 0) status = 'Overdue';
      else if (paidTerms === totalTerms) status = 'Completed';
      else if (paidTerms >= totalTerms - 1 && totalTerms > 1) status = 'Near Completion';
      
      return {
        id: `#CAS-${c._id.slice(-6).toUpperCase()}`,
        rawId: c._id,
        name: c.staffName || c.advancerName || 'Unknown',
        paymentTerm: c.installmentPlan || 'N/A',
        paidTerms,
        totalTerms,
        nextPaymentDate: c.nextPaymentDate ? new Date(c.nextPaymentDate).toLocaleDateString() : 'TBD',
        nextPaymentAmount,
        bouncedCount: c.bouncedCount || 0,
        remainingBalance: Math.max(0, remainingBalance),
        status,
        originalCase: c
      };
    });
    
    return (
      <div className="max-w-6xl mx-auto pb-10">
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

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col mb-6">
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
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mb-8">
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
                  <th className="py-4 px-6">Payment Term</th>
                  <th className="py-4 px-6">Progress</th>
                  <th className="py-4 px-6">Next Payment</th>
                  <th className="py-4 px-6 text-center">Bounced</th>
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
                        <div className="text-xs text-gray-500 mt-0.5">{record.name}</div>
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
                        <div className={`font-medium ${isOverdue || isActionRequired ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>
                          ¥{record.nextPaymentAmount.toLocaleString()}
                        </div>
                        <div className={`text-xs mt-0.5 ${isOverdue || isActionRequired ? 'text-rose-500' : 'text-gray-500'}`}>
                          {record.nextPaymentDate}
                        </div>
                      </td>
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
                      <td className="py-4 px-6 text-right font-bold text-[#162D50]">
                        ¥{record.remainingBalance.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => setSelectedCaseToProcess(record.originalCase)}
                          className="text-[#162D50] font-bold hover:underline text-xs bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Settlement Form */}
        {selectedCaseToProcess ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col" id="settlement-form">
            <div className="p-6 border-b border-gray-200 bg-[#F2F4F7] flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#162D50]">Settlement Form: #CAS-{selectedCaseToProcess._id.slice(-6).toUpperCase()}</h3>
              <button 
                onClick={() => setSelectedCaseToProcess(null)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Cancel Process
              </button>
            </div>
            
            <form className="p-8 space-y-6" onSubmit={handleFormSubmit}>
              {/* Payee Info (Read Only for now) */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Payee Name</label>
                  <input type="text" readOnly value={selectedCaseToProcess.staffName || selectedCaseToProcess.advancerName || 'N/A'} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Total Claim Amount (This Term)</label>
                  <input type="text" readOnly value={(selectedCaseToProcess.nextPaymentAmount || (selectedCaseToProcess.finalTotal || selectedCaseToProcess.totalExpense || 0) / (selectedCaseToProcess.installmentPlan ? (selectedCaseToProcess.installmentPlan.match(/\d+/) ? parseInt(selectedCaseToProcess.installmentPlan.match(/\d+/)[0], 10) : 1) : 1)).toLocaleString()} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-medium" />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#162D50] focus:border-[#162D50]"
                  required
                >
                  <option value="" disabled>Select Method</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Corporate Card">Corporate Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Payroll Deduction">Payroll Deduction</option>
                </select>
              </div>

              {/* Dynamic Destination Details */}
              {paymentMethod === 'Bank Transfer' && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name</label>
                    <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, bankName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Branch Code</label>
                    <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, branchCode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Account Number</label>
                    <input type="text" onChange={(e) => setDestinationDetails({...destinationDetails, accountNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
                  </div>
                </div>
              )}
              {paymentMethod === 'Payroll Deduction' && (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Payroll Period</label>
                  <input type="month" onChange={(e) => setDestinationDetails({...destinationDetails, payrollPeriod: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="grid grid-cols-3 gap-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deductions (Tax/Advance)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">¥</span>
                    <input 
                      type="number" 
                      value={deductions} 
                      onChange={(e) => setDeductions(Number(e.target.value) || 0)} 
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#162D50] focus:border-[#162D50]" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#162D50] mb-1">Net Payable Amount</label>
                  <div className="w-full px-4 py-2 border border-blue-200 rounded-md bg-blue-100 text-[#162D50] font-black text-lg text-right shadow-inner">
                    ¥ {((selectedCaseToProcess.nextPaymentAmount || Math.round((selectedCaseToProcess.finalTotal || selectedCaseToProcess.totalExpense || 0) / (selectedCaseToProcess.installmentPlan ? (selectedCaseToProcess.installmentPlan.match(/\d+/) ? parseInt(selectedCaseToProcess.installmentPlan.match(/\d+/)[0], 10) : 1) : 1))) - deductions).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">New Remaining Balance</label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 font-bold text-lg text-right">
                    ¥ {Math.max(0, (selectedCaseToProcess.finalTotal || selectedCaseToProcess.totalExpense || 0) - (((selectedCaseToProcess.paidTerms || 0) + 1) * (selectedCaseToProcess.nextPaymentAmount || Math.round((selectedCaseToProcess.finalTotal || selectedCaseToProcess.totalExpense || 0) / (selectedCaseToProcess.installmentPlan ? (selectedCaseToProcess.installmentPlan.match(/\d+/) ? parseInt(selectedCaseToProcess.installmentPlan.match(/\d+/)[0], 10) : 1) : 1))))).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Confirmation */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Transaction Ref ID</label>
                  <input type="text" value={transactionRefId} onChange={(e) => setTransactionRefId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Payment Date</label>
                  <input type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-md bg-gray-50">
                <input 
                  type="checkbox" 
                  id="confirm" 
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-[#162D50] focus:ring-[#162D50]" 
                  required
                />
                <label htmlFor="confirm" className="text-sm font-medium text-gray-700">
                  I confirm that the above payment details are correct and authorize this settlement transition.
                </label>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !isConfirmed || !paymentMethod}
                  className="bg-[#162D50] text-white px-8 py-3 rounded-md font-bold shadow-md hover:bg-[#0f1f38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Submit Settlement'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-8">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Select a case to process</h3>
                <p className="text-gray-500 max-w-md">
                  Click the "Process" button on any related application above to open the settlement form.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
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
              {relatedCount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span>
                  {relatedCount} pending
                </div>
              )}

              <div className="flex items-start justify-between mb-4 mt-2">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${option.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                {!relatedCount && (
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#162D50] transition-colors">
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                )}
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

