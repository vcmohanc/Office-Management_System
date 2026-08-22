import { Search, ChevronDown, Calendar, FileText, AlertTriangle, Image } from 'lucide-react';

export default function CaseList() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <h2 className="text-2xl font-bold text-[#162D50] mb-4">Case List</h2>
      
      {/* Top Tabs */}
      <div className="bg-[#F2F4F7] p-1 rounded-md flex space-x-1 mb-4 border border-gray-200">
        <button className="flex-1 py-2 text-sm font-bold text-gray-500 rounded-md hover:bg-gray-200 transition-colors">
          Office Case <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">12</span>
        </button>
        <button className="flex-1 py-2 text-sm font-bold text-white bg-[#0A192F] rounded-md shadow-sm">
          Staff Case <span className="ml-2 bg-white text-[#0A192F] px-2 py-0.5 rounded-full text-xs">5</span>
        </button>
        <button className="flex-1 py-2 text-sm font-bold text-gray-500 rounded-md hover:bg-gray-200 transition-colors">
          Host Company Case <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">2</span>
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
            <input type="text" placeholder="年 /月/日" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
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
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-6 text-gray-600">#CAS-2024-001</td>
              <td className="py-4 px-6 text-gray-600">2024-05-20</td>
              <td className="py-4 px-6 text-gray-800">John Doe</td>
              <td className="py-4 px-6 text-gray-600">Postage</td>
              <td className="py-4 px-6 font-bold text-gray-800">¥45.00</td>
              <td className="py-4 px-6">
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200">Pending</span>
              </td>
              <td className="py-4 px-6">
                <button className="text-[#162D50] font-bold hover:underline">View Details</button>
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
              <td className="py-4 px-6">
                <button className="text-[#162D50] font-bold hover:underline">View Details</button>
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
              <td className="py-4 px-6">
                <button className="text-[#162D50] font-bold hover:underline">View Details</button>
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
              <td className="py-4 px-6">
                <button className="text-[#162D50] font-bold hover:underline">View Details</button>
              </td>
            </tr>
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
