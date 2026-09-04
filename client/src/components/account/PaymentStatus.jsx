import { useState, useEffect } from 'react';
import { Search, ChevronDown, Calendar, Download, Building, Landmark, AlertCircle, AlertTriangle, ArrowRight, ArrowLeft, Printer } from 'lucide-react';

export default function PaymentStatus() {
  const [viewingDetails, setViewingDetails] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [activePaymentTab, setActivePaymentTab] = useState('Office');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All Types');
  const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/cases`)
      .then(res => res.json())
      .then(data => {
        setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching cases:', err);
        setLoading(false);
      });

    fetch(`${import.meta.env.VITE_API_URL}/api/options`)
      .then(res => res.json())
      .then(data => {
        const types = data.filter(opt => opt.type === 'ExpenseType');
        setExpenseTypeOptions(types);
      })
      .catch(err => console.error('Error fetching options:', err));
  }, []);

  const officeCasesCount = cases.filter(c => c.advancerCategory === 'Office').length;
  const staffCasesCount = cases.filter(c => c.advancerCategory === 'Staff').length;
  const hostCompanyCasesCount = cases.filter(c => c.advancerCategory === 'Host Company').length;

  const filteredCases = cases.filter(c => {
    // Only show post-approval cases in Payment Status
    const isPostApproval = ['Payment Pending', 'Processing', 'Completed', 'Overdue'].includes(c.status);
    
    const matchesTab = c.advancerCategory === activePaymentTab || (!c.advancerCategory && activePaymentTab === 'Office');
    const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
    const matchesType = expenseTypeFilter === 'All Types' || c.expenseType === expenseTypeFilter;
    
    return isPostApproval && matchesTab && matchesStatus && matchesType;
  });

  const totalBankTransfers = cases.filter(c => c.settlementMethod === 'Bank Transfer').reduce((sum, c) => sum + (c.finalTotal || 0), 0);
  const totalDeductions = cases.filter(c => c.collectionMethod === 'Deduction').reduce((sum, c) => sum + (c.finalTotal || 0), 0);
  const pendingCount = cases.filter(c => c.status === 'Payment Pending').length;
  const processingCount = cases.filter(c => c.status === 'Processing').length;
  const completedCount = cases.filter(c => c.status === 'Completed').length;
  const overdueCount = cases.filter(c => c.status === 'Overdue').length;

  if (selectedCase) {
    const personCases = cases.filter(c => c.staffId === selectedCase.staffId);
    const personTotalBankTransfers = personCases.filter(c => c.settlementMethod === 'Bank Transfer').reduce((sum, c) => sum + (c.finalTotal || c.totalExpense || 0), 0);
    const personTotalDeductions = personCases.filter(c => c.collectionMethod === 'Deduction').reduce((sum, c) => sum + (c.finalTotal || c.totalExpense || 0), 0);
    const personPendingCount = personCases.filter(c => c.status === 'Payment Pending').length;
    const personProcessingCount = personCases.filter(c => c.status === 'Processing').length;
    
    const filteredPersonCases = personCases.filter(c => {
      const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
      const matchesType = expenseTypeFilter === 'All Types' || c.expenseType === expenseTypeFilter;
      return matchesStatus && matchesType;
    });

    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        <button 
          onClick={() => setSelectedCase(null)}
          className="flex items-center text-[#162D50] hover:underline font-medium mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Payment List
        </button>

        <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm print-area print:shadow-none print:border-none print:p-8 print:w-full print:bg-white print:[print-color-adjust:exact]">
          
          {/* Print Only Header */}
          <div className="hidden print:flex justify-between items-end border-b-4 border-[#162D50] pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-[#162D50] tracking-tight uppercase">Settlement Record</h1>
              <p className="text-gray-500 text-sm mt-2 font-medium">Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-[#162D50] text-white p-2 rounded-md mb-2">
                <Building className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#162D50]">OMS Corporation</p>
            </div>
          </div>

          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#162D50] mb-1 print:text-3xl">Case Details: {selectedCase.staffName}</h2>
              <p className="text-gray-500 text-sm print:text-base">Staff ID: <span className="font-medium text-gray-800">{selectedCase.staffId}</span></p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => window.print()}
                className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors print:hidden"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print
              </button>
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium border print:border-2 ${
                selectedCase.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 print:bg-yellow-100 print:text-yellow-800' :
                selectedCase.status === 'Processing' ? 'bg-blue-100 text-blue-700 border-blue-200 print:bg-blue-100 print:text-blue-800' :
                selectedCase.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200 print:bg-green-100 print:text-green-800' :
                'bg-gray-100 text-gray-700 border-gray-200 print:bg-gray-100 print:text-gray-800'
              }`}>
                {selectedCase.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-12">
            <div className="bg-gray-50 print:bg-white rounded-lg p-5 print:p-0 border border-gray-100 print:border-none">
              <div className="flex items-center mb-4 border-b border-gray-200 pb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 print:bg-blue-50">
                  <Landmark className="w-4 h-4 text-blue-700" />
                </div>
                <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider print:text-base">Expense Information</h3>
              </div>
              <div className="space-y-4 text-sm print:text-base">
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Case ID</span> <span className="font-bold text-gray-800">#CAS-{selectedCase._id.slice(-6).toUpperCase()}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Expense Type</span> <span className="font-medium text-gray-800">{selectedCase.expenseType}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Total Amount</span> <span className="font-black text-[#162D50] text-lg">{selectedCase.currency === 'JPY' ? '¥' : '$'}{(selectedCase.finalTotal || selectedCase.totalExpense || 0).toLocaleString()}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Period</span> <span className="font-medium text-gray-800">{new Date(selectedCase.expensePeriodStart).toLocaleDateString()} - {new Date(selectedCase.expensePeriodEnd).toLocaleDateString()}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Location</span> <span className="font-medium text-gray-800">{selectedCase.location}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Remark</span> <span className="font-medium text-gray-800">{selectedCase.remark || 'N/A'}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 print:bg-white rounded-lg p-5 print:p-0 border border-gray-100 print:border-none">
              <div className="flex items-center mb-4 border-b border-gray-200 pb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 print:bg-indigo-50">
                  <Download className="w-4 h-4 text-indigo-700" />
                </div>
                <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider print:text-base">Settlement Details</h3>
              </div>
              <div className="space-y-4 text-sm print:text-base">
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Category</span> <span className="font-medium text-gray-800">{selectedCase.advancerCategory}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Payment Process Types</span> <span className="font-medium text-gray-800">{selectedCase.advancerName}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Settlement Method</span> <span className="font-medium text-gray-800">{selectedCase.settlementMethod}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Collection Method</span> <span className="font-medium text-gray-800">{selectedCase.collectionMethod}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200"><span className="text-gray-500">Installment Plan</span> <span className="font-medium text-gray-800">{selectedCase.installmentPlan}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Expected Settlement</span> <span className="font-bold text-[#162D50]">{new Date(selectedCase.expectedSettlementDate).toLocaleDateString()}</span></div>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="hidden print:flex justify-between items-center mt-16 pt-8 border-t border-gray-200 text-xs text-gray-400">
            <p>This is a computer-generated document. No signature is required.</p>
            <p>Ref: CAS-{selectedCase._id}</p>
          </div>
        </div>

        <div className="print:hidden space-y-6 mt-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">TOTAL BANK TRANSFERS</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold text-[#162D50]">¥{personTotalBankTransfers.toLocaleString()}</p>
                  <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                    <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    </div>
                    {personCases.filter(c => c.settlementMethod === 'Bank Transfer').length} Settlements Ready
                  </div>
                </div>
                <Landmark className="w-10 h-10 text-gray-100" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">PAYROLL DEDUCTIONS</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold text-[#162D50]">¥{personTotalDeductions.toLocaleString()}</p>
                  <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                    <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    </div>
                    {personCases.filter(c => c.collectionMethod === 'Deduction').length} Recoveries Ready
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-yellow-400 p-5 rounded-md shadow-sm border-l-4 border-l-yellow-400">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">PENDING ADJUSTMENTS</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold text-[#162D50]">{personPendingCount} items</p>
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
                  <p className="text-3xl font-bold text-red-600">{personProcessingCount} items</p>
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
              <button className="flex items-center bg-[#162D50] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm whitespace-nowrap h-[38px]">
                <Download className="w-4 h-4 mr-2" />
                Generate Export
              </button>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden mt-6 print:hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-[#F8F9FA]">
            <h3 className="text-lg font-bold text-[#162D50]">Payment History & Related Cases</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-6">Case ID</th>
                <th className="py-3 px-6">Period</th>
                <th className="py-3 px-6">Expense Type</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredPersonCases.length === 0 ? (
                <tr><td colSpan="6" className="py-4 px-6 text-center text-gray-500">No cases found matching filters.</td></tr>
              ) : (
                filteredPersonCases.map(c => (
                <tr key={c._id} className={`hover:bg-gray-50 transition-colors ${c._id === selectedCase._id ? 'bg-blue-50' : ''}`}>
                  <td className="py-4 px-6 font-medium text-[#162D50]">#CAS-{c._id.slice(-6).toUpperCase()}</td>
                  <td className="py-4 px-6 text-gray-600">{new Date(c.expensePeriodStart).toLocaleDateString()} - {new Date(c.expensePeriodEnd).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-gray-600">{c.expenseType}</td>
                  <td className="py-4 px-6 font-bold text-[#162D50]">{c.currency === 'JPY' ? '¥' : '$'}{(c.finalTotal || c.totalExpense || 0).toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      c.status === 'Payment Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      c.status === 'Processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      c.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {c._id !== selectedCase._id && (
                      <button onClick={() => setSelectedCase(c)} className="text-[#162D50] font-bold hover:underline text-xs">View</button>
                    )}
                    {c._id === selectedCase._id && (
                      <span className="text-gray-400 text-xs font-medium">Viewing</span>
                    )}
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

  if (viewingDetails) {
    return (
      <div className="max-w-6xl mx-auto pb-10">
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
            <button className="flex items-center bg-[#162D50] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Generate Export
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">TOTAL BANK TRANSFERS</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-[#162D50]">¥{totalBankTransfers.toLocaleString()}</p>
                <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                  <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                  </div>
                  {cases.filter(c => c.settlementMethod === 'Bank Transfer').length} Settlements Ready
                </div>
              </div>
              <Landmark className="w-10 h-10 text-gray-100" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">PAYROLL DEDUCTIONS</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-[#162D50]">¥{totalDeductions.toLocaleString()}</p>
                <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                  <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                  </div>
                  {cases.filter(c => c.collectionMethod === 'Deduction').length} Recoveries Ready
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
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
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
              Total: {cases.length} items
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
              {cases.length === 0 ? (
                <tr><td colSpan="8" className="py-4 px-6 text-center text-gray-500">No data found.</td></tr>
              ) : (
                cases.map((c, index) => (
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
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <h2 className="text-2xl font-bold text-[#162D50] mb-4">Payment Application List</h2>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">TOTAL BANK TRANSFERS</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">¥{totalBankTransfers.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
                {cases.filter(c => c.settlementMethod === 'Bank Transfer').length} Settlements Ready
              </div>
            </div>
            <Landmark className="w-10 h-10 text-gray-100" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">PAYROLL DEDUCTIONS</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">¥{totalDeductions.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
                {cases.filter(c => c.collectionMethod === 'Deduction').length} Recoveries Ready
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
      
      {/* Installment Status Row */}
      <div className="bg-white border border-gray-200 rounded-md p-4 flex justify-between items-center mb-6">
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
          Total: {cases.length} items
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
          <button className="flex items-center bg-[#162D50] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm whitespace-nowrap h-[38px]">
            <Download className="w-4 h-4 mr-2" />
            Generate Export
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-600">
              <th className="py-3 px-6">Case ID</th>
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Staff Name</th>
              <th className="py-3 px-6">Expense Type</th>
              <th className="py-3 px-6">Total Amount</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-4 px-6 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-4 px-6 text-center text-gray-500">No cases found.</td>
              </tr>
            ) : (
              filteredCases.map(c => (
                <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-gray-600">#CAS-{c._id.slice(-6).toUpperCase()}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {new Date(c.expensePeriodStart).toLocaleDateString('en-US')}
                  </td>
                  <td className="py-4 px-6 text-gray-800">{c.staffName}</td>
                  <td className="py-4 px-6 text-gray-600">{c.expenseType}</td>
                  <td className="py-4 px-6 font-bold text-gray-800">
                    {c.currency === 'JPY' ? '¥' : '$'}{c.totalExpense.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      c.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      c.status === 'Processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      c.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => setSelectedCase(c)} className="text-[#162D50] font-bold hover:underline">View Details</button>
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
