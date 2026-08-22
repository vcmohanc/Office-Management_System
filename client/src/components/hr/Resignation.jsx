import { Search, Filter, Plus } from 'lucide-react';

export default function Resignation() {
  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">Resignation Management</h2>
        <p className="text-gray-500 text-sm">Track and manage staff resignation procedures, clearance status, and final settlements.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2 font-medium">Active Notices</p>
          <p className="text-3xl font-bold text-[#162D50]">8</p>
        </div>
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2 font-medium">Pending Clearance</p>
          <p className="text-3xl font-bold text-[#162D50]">5</p>
        </div>
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2 font-medium">Exit Interviews Scheduled</p>
          <p className="text-3xl font-bold text-[#162D50]">3</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search staff by name or ID..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-white"
          />
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="flex items-center justify-center bg-[#0A192F] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#162D50] transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            New Resignation
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-sm font-bold text-[#162D50]">
                <th className="py-4 px-6">Staff ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Resignation Date</th>
                <th className="py-4 px-6">Last Working Day</th>
                <th className="py-4 px-6">Clearance Status</th>
                <th className="py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-600">EMP-2045</td>
                <td className="py-4 px-6 font-bold text-gray-900">Sarah Jenkins</td>
                <td className="py-4 px-6 text-gray-600">Oct 12, 2023</td>
                <td className="py-4 px-6 text-gray-600">Nov 12, 2023</td>
                <td className="py-4 px-6">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">Notice Period</span>
                </td>
                <td className="py-4 px-6">
                  <button className="text-[#162D50] font-bold hover:underline text-sm">View Details</button>
                </td>
              </tr>
              
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-600">EMP-1982</td>
                <td className="py-4 px-6 font-bold text-gray-900">Michael Chen</td>
                <td className="py-4 px-6 text-gray-600">Oct 05, 2023</td>
                <td className="py-4 px-6 text-gray-600">Nov 05, 2023</td>
                <td className="py-4 px-6">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">Exit Interview</span>
                </td>
                <td className="py-4 px-6">
                  <button className="text-[#162D50] font-bold hover:underline text-sm">View Details</button>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-600">EMP-2103</td>
                <td className="py-4 px-6 font-bold text-gray-900">Elena Rodriguez</td>
                <td className="py-4 px-6 text-gray-600">Sep 28, 2023</td>
                <td className="py-4 px-6 text-gray-600">Oct 28, 2023</td>
                <td className="py-4 px-6">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Accounting Clearance</span>
                </td>
                <td className="py-4 px-6">
                  <button className="text-[#162D50] font-bold hover:underline text-sm">View Details</button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-600">EMP-1855</td>
                <td className="py-4 px-6 font-bold text-gray-900">David Smith</td>
                <td className="py-4 px-6 text-gray-600">Sep 15, 2023</td>
                <td className="py-4 px-6 text-gray-600">Oct 15, 2023</td>
                <td className="py-4 px-6">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Completed</span>
                </td>
                <td className="py-4 px-6">
                  <button className="text-[#162D50] font-bold hover:underline text-sm">View Details</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
