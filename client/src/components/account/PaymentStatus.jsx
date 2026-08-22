import { useState } from 'react';
import { Search, ChevronDown, Calendar, Download, Building, Landmark, AlertCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function PaymentStatus() {
  const [viewingDetails, setViewingDetails] = useState(false);

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
                <p className="text-3xl font-bold text-[#162D50]">¥4,250,000</p>
                <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                  <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                  </div>
                  142 Settlements Ready
                </div>
              </div>
              <Landmark className="w-10 h-10 text-gray-100" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">PAYROLL DEDUCTIONS</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-[#162D50]">¥185,000</p>
                <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                  <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                  </div>
                  28 Recoveries Ready
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-yellow-400 p-5 rounded-md shadow-sm border-l-4 border-l-yellow-400">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">PENDING ADJUSTMENTS</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-[#162D50]">3 items</p>
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
                <p className="text-3xl font-bold text-red-600">7 items</p>
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
                Active Installments <span className="ml-2 bg-blue-900 text-white px-2 rounded-full text-xs opacity-80">86</span>
              </button>
              <button className="flex items-center px-4 py-1.5 text-gray-500 hover:bg-gray-100 rounded-full text-sm font-medium">
                Completed <span className="ml-2 bg-gray-200 text-gray-600 px-2 rounded-full text-xs">142</span>
              </button>
              <button className="flex items-center px-4 py-1.5 text-gray-500 hover:bg-gray-100 rounded-full text-sm font-medium">
                Overdue <span className="ml-2 bg-gray-200 text-gray-600 px-2 rounded-full text-xs">4</span>
              </button>
              
              <div className="flex items-center space-x-2 ml-4 border-l border-gray-200 pl-4">
                <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md text-xs font-bold flex items-center">
                  ! 4 Overdue
                </span>
                <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-xs font-bold flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" /> 7 Bounced
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: 173 items
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
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-[#162D50]">EMP-1042</div>
                  <div className="text-xs text-gray-500">Tanaka, Kenji</div>
                </td>
                <td className="py-3 px-4 text-gray-600">12 months</td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[40%]"></div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">5 / 12</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-gray-500 text-xs">2023-11-15</div>
                  <div className="font-bold text-gray-800">¥12,500</div>
                </td>
                <td className="py-3 px-4 text-center text-gray-400">-</td>
                <td className="py-3 px-4 text-right font-bold text-gray-800">¥87,500</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">On Track</span>
                </td>
              </tr>

              <tr className="border-b border-gray-100 bg-yellow-50">
                <td className="py-3 px-4">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-[#162D50]">EMP-1422</div>
                  <div className="text-xs text-gray-500">Takahashi, Mei</div>
                </td>
                <td className="py-3 px-4 text-gray-600">24 months</td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 w-[75%]"></div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">18 / 24</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-red-500 text-xs">2023-10-25</div>
                  <div className="font-bold text-red-600">¥5,000</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-red-500 text-xs font-bold flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 mr-1" /> 1 item
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-800">¥30,000</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium border border-orange-200">Overdue</span>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-[#162D50]">EMP-0891</div>
                  <div className="text-xs text-gray-500">Sato, Yumi</div>
                </td>
                <td className="py-3 px-4 text-gray-600">6 months</td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[83%]"></div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">5 / 6</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-gray-500 text-xs">2023-11-01</div>
                  <div className="font-bold text-red-600">¥2,500</div>
                </td>
                <td className="py-3 px-4 text-center text-gray-400">-</td>
                <td className="py-3 px-4 text-right font-bold text-gray-800">¥2,500</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">Near Completion</span>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 bg-red-50/30">
                <td className="py-3 px-4">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-[#162D50]">EMP-2091</div>
                  <div className="text-xs text-gray-500">Suzuki, Hiroshi</div>
                </td>
                <td className="py-3 px-4 text-gray-600">12 months</td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 w-[16%]"></div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">2 / 12</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-red-500 text-xs">2023-10-28</div>
                  <div className="font-bold text-red-600">¥15,000</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-red-500 text-xs font-bold flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 mr-1" /> 2 items
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-800">¥150,000</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium border border-orange-200">Action Required</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <h2 className="text-2xl font-bold text-[#162D50] mb-4">Payment Application List</h2>
      
      {/* Top Tabs */}
      <div className="bg-[#F2F4F7] p-1 rounded-md flex space-x-1 mb-4 border border-gray-200">
        <button className="flex-1 py-2 text-sm font-bold text-white bg-[#0A192F] rounded-md shadow-sm transition-colors">
          Office Payment Cases <span className="ml-2 bg-white text-[#0A192F] px-2 py-0.5 rounded-full text-xs">12</span>
        </button>
        <button className="flex-1 py-2 text-sm font-bold text-gray-500 rounded-md hover:bg-gray-200 transition-colors">
          Staff Payment Cases <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">5</span>
        </button>
        <button className="flex-1 py-2 text-sm font-bold text-gray-500 rounded-md hover:bg-gray-200 transition-colors">
          Host Company Cases <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">2</span>
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
            <select className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
              <option>All Statuses</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-600 mb-1">Expense Type</label>
          <div className="relative">
            <select className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
              <option>All Types</option>
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
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-6 text-gray-600">#CAS-2024-001</td>
              <td className="py-4 px-6 text-gray-600">2024-05-20</td>
              <td className="py-4 px-6 text-gray-800">John Doe</td>
              <td className="py-4 px-6 text-gray-600">Postage</td>
              <td className="py-4 px-6 font-bold text-gray-800">¥45.00</td>
              <td className="py-4 px-6">
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200">Pending</span>
              </td>
              <td className="py-4 px-6 text-right">
                <button onClick={() => setViewingDetails(true)} className="text-[#162D50] font-bold hover:underline">View Details</button>
              </td>
            </tr>
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-6 text-gray-600">#CAS-2024-002</td>
              <td className="py-4 px-6 text-gray-600">2024-05-19</td>
              <td className="py-4 px-6 text-gray-800">Jane Smith</td>
              <td className="py-4 px-6 text-gray-600">Hospital Bills</td>
              <td className="py-4 px-6 font-bold text-gray-800">¥1,200.00</td>
              <td className="py-4 px-6">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">Processing</span>
              </td>
              <td className="py-4 px-6 text-right">
                <button onClick={() => setViewingDetails(true)} className="text-[#162D50] font-bold hover:underline">View Details</button>
              </td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="py-4 px-6 text-gray-600">#CAS-2024-003</td>
              <td className="py-4 px-6 text-gray-600">2024-05-18</td>
              <td className="py-4 px-6 text-gray-800">Robert Chen</td>
              <td className="py-4 px-6 text-gray-600">Dorm Fees</td>
              <td className="py-4 px-6 font-bold text-gray-800">¥850.00</td>
              <td className="py-4 px-6">
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium border border-red-200">Missing Receipt</span>
              </td>
              <td className="py-4 px-6 text-right">
                <button onClick={() => setViewingDetails(true)} className="text-[#162D50] font-bold hover:underline">View Details</button>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-4 px-6 text-gray-600">#CAS-2024-004</td>
              <td className="py-4 px-6 text-gray-600">2024-05-15</td>
              <td className="py-4 px-6 text-gray-800">Sarah Wilson</td>
              <td className="py-4 px-6 text-gray-600">Travel</td>
              <td className="py-4 px-6 font-bold text-gray-800">¥320.50</td>
              <td className="py-4 px-6">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">Completed</span>
              </td>
              <td className="py-4 px-6 text-right">
                <button onClick={() => setViewingDetails(true)} className="text-[#162D50] font-bold hover:underline">View Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
