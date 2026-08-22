import { Search, Calendar, Filter, UserPlus, Eye, Edit2 } from 'lucide-react';

export default function StaffList() {
  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">Staff List</h2>
        <p className="text-gray-500 text-sm">Manage and track all staff across office, service, and farm departments.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Total Staff</p>
          <p className="text-3xl font-bold text-[#162D50]">124</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">New Hires (This Month)</p>
          <p className="text-3xl font-bold text-[#162D50]">12</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Active Deployments</p>
          <p className="text-3xl font-bold text-[#162D50]">108</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button className="border-[#162D50] text-[#162D50] whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm">
            All Staff
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Office Staff
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Service Staff
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Farm Staff
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or Staff ID..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <input 
            type="text" 
            placeholder="Join Date" 
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
          <Calendar className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
        <button className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">Staff ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Join Date</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-[#162D50]">#STF-8824</td>
                <td className="py-4 px-6 font-bold text-gray-900">Ravi Nepali</td>
                <td className="py-4 px-6 text-gray-600">Office Staff</td>
                <td className="py-4 px-6 text-gray-600">Accountant</td>
                <td className="py-4 px-6 text-gray-600">Oct 12, 2023</td>
                <td className="py-4 px-6">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Active</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3 text-gray-400">
                    <button className="hover:text-[#162D50] transition-colors"><UserPlus className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Eye className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
              
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-[#162D50]">#STF-8815</td>
                <td className="py-4 px-6 font-bold text-gray-900">Sarah Jenkins</td>
                <td className="py-4 px-6 text-gray-600">Service Staff</td>
                <td className="py-4 px-6 text-gray-600">Service Lead</td>
                <td className="py-4 px-6 text-gray-600">Oct 20, 2023</td>
                <td className="py-4 px-6">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Active</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3 text-gray-400">
                    <button className="hover:text-[#162D50] transition-colors"><UserPlus className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Eye className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-[#162D50]">#STF-7742</td>
                <td className="py-4 px-6 font-bold text-gray-900">Kenji Sato</td>
                <td className="py-4 px-6 text-gray-600">Farm Staff</td>
                <td className="py-4 px-6 text-gray-600">Farm Manager</td>
                <td className="py-4 px-6 text-gray-600">Jan 15, 2022</td>
                <td className="py-4 px-6">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">On Leave</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3 text-gray-400">
                    <button className="hover:text-[#162D50] transition-colors"><UserPlus className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Eye className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-[#162D50]">#STF-8819</td>
                <td className="py-4 px-6 font-bold text-gray-900">Marcus Thorne</td>
                <td className="py-4 px-6 text-gray-600">Office Staff</td>
                <td className="py-4 px-6 text-gray-600">Office Admin</td>
                <td className="py-4 px-6 text-gray-600">Oct 22, 2023</td>
                <td className="py-4 px-6 flex flex-col items-start">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-1">Pending</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Verification</span>
                </td>
                <td className="py-4 px-6 text-right align-top pt-5">
                  <div className="flex items-center justify-end space-x-3 text-gray-400">
                    <button className="hover:text-[#162D50] transition-colors"><UserPlus className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Eye className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
