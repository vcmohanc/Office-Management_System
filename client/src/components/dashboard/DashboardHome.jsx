import { ClipboardList, Banknote, Wallet, PlusCircle, Download, List, TrendingUp, CheckCircle, Landmark, User, Tractor, ArrowRight } from 'lucide-react';

export default function DashboardHome({ setActiveTab }) {
  return (
    <>
      <h2 className="text-xl font-bold text-[#162D50] mb-6">Overview</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-[#F8F9FA] rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Pending Settlements</h3>
            <ClipboardList className="text-gray-400 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">24</p>
          <p className="text-xs font-medium text-green-500 flex items-center">
            <span className="mr-1">↓</span> 12% from last week
          </p>
        </div>
        {/* Card 2 */}
        <div className="bg-[#F8F9FA] rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Awaiting Recoveries</h3>
            <Banknote className="text-gray-400 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <span className="text-xl mr-1">¥</span> 45,200
          </p>
          <p className="text-xs font-medium text-red-500 flex items-center">
            <span className="mr-1">↑</span> 5% from last week
          </p>
        </div>
        {/* Card 3 */}
        <div className="bg-[#F8F9FA] rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Monthly Settlement Total</h3>
            <Wallet className="text-gray-400 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <span className="text-xl mr-1">¥</span> 128,500
          </p>
          <p className="text-xs font-medium text-green-500 flex items-center">
            <span className="mr-1">↗</span> On track
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Content (Table) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Team Activity</h3>
            <a href="#" className="text-xs font-medium text-[#162D50] hover:underline">View All</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-5 text-xs font-medium text-gray-500">Staff Name</th>
                  <th className="py-3 px-5 text-xs font-medium text-gray-500">Type</th>
                  <th className="py-3 px-5 text-xs font-medium text-gray-500">Status</th>
                  <th className="py-3 px-5 text-xs font-medium text-gray-500 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-50">
                  <td className="py-4 px-5 text-gray-800">Kenji Sato</td>
                  <td className="py-4 px-5 text-gray-600">Advance Request</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>
                  </td>
                  <td className="py-4 px-5 text-right text-gray-500">Oct 24, 2023</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-4 px-5 text-gray-800">Yui Takahashi</td>
                  <td className="py-4 px-5 text-gray-600">Expense Settlement</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Approved</span>
                  </td>
                  <td className="py-4 px-5 text-right text-gray-500">Oct 23, 2023</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-4 px-5 text-gray-800">Hiroshi Tanaka</td>
                  <td className="py-4 px-5 text-gray-600">Advance Request</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Processing</span>
                  </td>
                  <td className="py-4 px-5 text-right text-gray-500">Oct 22, 2023</td>
                </tr>
                <tr>
                  <td className="py-4 px-5 text-gray-800">Mei Lin</td>
                  <td className="py-4 px-5 text-gray-600">Recovery Update</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Action Required</span>
                  </td>
                  <td className="py-4 px-5 text-right text-gray-500">Oct 21, 2023</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Content (Panels) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Admin User Create</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setActiveTab('Admin New Registration')}
                className="w-full flex items-center justify-center bg-[#162D50] hover:bg-[#0f1f38] text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Registration
              </button>
              <button className="w-full flex items-center justify-center bg-[#E2E8F0] hover:bg-gray-300 text-[#4A5568] py-2.5 px-4 rounded-md text-sm font-medium transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Generate Payroll Export
              </button>
              <button className="w-full flex items-center justify-center bg-[#E2E8F0] hover:bg-gray-300 text-[#4A5568] py-2.5 px-4 rounded-md text-sm font-medium transition-colors">
                <List className="w-4 h-4 mr-2" />
                View Case List
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">Accounting Team Tasks</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">Completed</span>
                  <span className="text-gray-900 font-bold">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">In Progress</span>
                  <span className="text-gray-900 font-bold">20%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">Pending Review</span>
                  <span className="text-gray-900 font-bold">15%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-5 text-center">
              <p className="text-xs text-gray-500">12 tasks require attention today</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
