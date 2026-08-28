import { useState, useEffect } from 'react';
import { Search, ChevronDown, Calendar, FileText, AlertTriangle, Image } from 'lucide-react';

export default function CaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Office');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All Types');
  const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);

  const officeCasesCount = cases.filter(c => c.advancerCategory === 'Office').length;
  const staffCasesCount = cases.filter(c => c.advancerCategory === 'Staff').length;
  const hostCompanyCasesCount = cases.filter(c => c.advancerCategory === 'Host Company').length;

  const filteredCases = cases.filter(c => {
    const matchesTab = c.advancerCategory === activeTab || (!c.advancerCategory && activeTab === 'Office');
    const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
    const matchesType = expenseTypeFilter === 'All Types' || c.expenseType === expenseTypeFilter;
    return matchesTab && matchesStatus && matchesType;
  });

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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <h2 className="text-2xl font-bold text-[#162D50] mb-4">Case List</h2>
      
      {/* Top Tabs */}
      <div className="bg-[#F2F4F7] p-1 rounded-md flex space-x-1 mb-4 border border-gray-200">
        <button 
          onClick={() => setActiveTab('Office')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'Office' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          Office Case <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'Office' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{officeCasesCount}</span>
        </button>
        <button 
          onClick={() => setActiveTab('Staff')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'Staff' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          Staff Case <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'Staff' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{staffCasesCount}</span>
        </button>
        <button 
          onClick={() => setActiveTab('Host Company')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'Host Company' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          Host Company Case <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'Host Company' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{hostCompanyCasesCount}</span>
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
        <button className="bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap h-[38px]">
          Apply Filters
        </button>
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
              <th className="py-3 px-6">Actions</th>
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
                  <td className="py-4 px-6">
                    <button className="text-[#162D50] font-bold hover:underline">View Details</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Case Detail Preview */}
      <div className="bg-[#F8F9FA] border border-gray-200 rounded-md mt-8">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-md">
          <h3 className="text-[#162D50] text-lg font-bold">Case Detail Preview</h3>
          <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium border border-red-200">Missing Receipt</span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 bg-white">
          {/* CASE INFORMATION */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">CASE INFORMATION</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Case ID</span>
                <span className="font-bold text-gray-800">#CAS-2024-005</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Staff Name</span>
                <span className="font-bold text-gray-800">Sarah Jenkins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expense Type</span>
                <span className="font-bold text-gray-800">Travel Reimbursement</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-bold text-gray-800">¥12,450</span>
              </div>
            </div>
          </div>

          {/* SETTLEMENT BREAKDOWN */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">SETTLEMENT BREAKDOWN</h4>
            <div className="bg-[#E9ECEF] rounded-md p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Settlement to Advancer</span>
                <span className="font-bold text-gray-800">¥12,450</span>
              </div>
              <div className="flex justify-between mb-4 pb-4 border-b border-gray-300">
                <span className="text-gray-500">Method</span>
                <span className="text-gray-800">Bank Transfer</span>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Recovery Method:</div>
                <div className="text-gray-800">Company Expense (VC Bears)</div>
              </div>
            </div>
          </div>

          {/* ATTACHMENTS */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">ATTACHMENTS</h4>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-700">
                  <FileText className="w-4 h-4 mr-2" />
                  dorm_receipt.pdf
                </div>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-700">
                  <Image className="w-4 h-4 mr-2" />
                  pledge_signed.jpg
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 flex justify-end items-center space-x-4 bg-gray-50 rounded-b-md">
          <button className="text-red-500 font-medium px-4 hover:underline">Reject</button>
          <button className="border border-gray-300 bg-white text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50">Return for Correction</button>
          <button className="bg-[#0A192F] text-white px-6 py-2 rounded-md font-bold hover:bg-[#162D50] shadow-sm">Approve for Payment</button>
        </div>
      </div>
    </div>
  );
}
