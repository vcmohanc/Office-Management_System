import { useState, useEffect } from 'react';
import { Search, ChevronDown, Calendar, Download, Building, Landmark, AlertCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function PaymentStatus() {
  const [viewingDetails, setViewingDetails] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState('Office');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All Types');
  const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);

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

    fetch('http://localhost:5000/api/options')
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
    const matchesTab = c.advancerCategory === activePaymentTab || (!c.advancerCategory && activePaymentTab === 'Office');
    const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
    const matchesType = expenseTypeFilter === 'All Types' || c.expenseType === expenseTypeFilter;
    return matchesTab && matchesStatus && matchesType;
  });

  const totalBankTransfers = cases.filter(c => c.settlementMethod === 'Bank Transfer').reduce((sum, c) => sum + (c.finalTotal || 0), 0);
  const totalDeductions = cases.filter(c => c.collectionMethod === 'Deduction').reduce((sum, c) => sum + (c.finalTotal || 0), 0);
  const pendingCount = cases.filter(c => c.status === 'Pending').length;
  const processingCount = cases.filter(c => c.status === 'Processing').length;
  const completedCount = cases.filter(c => c.status === 'Completed').length;
  const overdueCount = cases.filter(c => c.status === 'Overdue').length;

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
                        c.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        c.status === 'Processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        c.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
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
                    <button onClick={() => setViewingDetails(true)} className="text-[#162D50] font-bold hover:underline">View Details</button>
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
