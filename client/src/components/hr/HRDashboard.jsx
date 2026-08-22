import { UserPlus, BedDouble, Radio, Tractor, Building, UserCheck, ChevronDown, Eye } from 'lucide-react';

export default function HRDashboard() {
  return (
    <div className="flex flex-col space-y-6">
      {/* Banner */}
      <div className="bg-[#1e3a5f] rounded-xl p-8 flex flex-col items-center justify-center text-white shadow-md">
        <UserPlus className="w-8 h-8 mb-3 text-blue-200" />
        <h2 className="text-sm font-bold tracking-widest text-blue-100">NEW HIRING STAFF (PRIMARY)</h2>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Hotel Staff (Active style) */}
        <div className="bg-[#0f1f38] rounded-xl p-5 flex flex-col items-center justify-center text-white shadow-sm border border-[#0f1f38]">
          <BedDouble className="w-6 h-6 mb-2 text-blue-200" />
          <p className="text-2xl font-bold mb-1">12</p>
          <p className="text-[10px] font-bold tracking-wider text-blue-100 uppercase">Hotel Staff</p>
        </div>

        {/* Telecom Staff */}
        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200">
          <Radio className="w-6 h-6 mb-2 text-[#162D50]" />
          <p className="text-2xl font-bold mb-1">8</p>
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Telecom Staff</p>
        </div>

        {/* Farm Staff */}
        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200">
          <Tractor className="w-6 h-6 mb-2 text-[#162D50]" />
          <p className="text-2xl font-bold mb-1">145</p>
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Farm Staff</p>
        </div>

        {/* Office Staff */}
        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200">
          <Building className="w-6 h-6 mb-2 text-[#162D50]" />
          <p className="text-2xl font-bold mb-1">24</p>
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Office Staff</p>
        </div>

        {/* Active Staff */}
        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200">
          <UserCheck className="w-6 h-6 mb-2 text-green-600" />
          <p className="text-2xl font-bold mb-1">145</p>
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Active Staff</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-[#F8F9FA] p-5 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-[#162D50] text-lg font-bold">New Staff Registration & Onboarding</h2>
          <div className="bg-white border border-gray-300 rounded-md px-3 py-1.5 flex items-center shadow-sm cursor-pointer">
            <span className="text-sm text-gray-700 mr-2">All Departments</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-6 text-xs font-bold text-[#162D50] uppercase">Staff ID</th>
                <th className="py-3 px-6 text-xs font-bold text-[#162D50] uppercase">Full Name</th>
                <th className="py-3 px-6 text-xs font-bold text-[#162D50] uppercase">Department</th>
                <th className="py-3 px-6 text-xs font-bold text-[#162D50] uppercase">Join Date</th>
                <th className="py-3 px-6 text-xs font-bold text-[#162D50] uppercase">Onboarding Status</th>
                <th className="py-3 px-6 text-xs font-bold text-[#162D50] uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {/* Group 1 */}
              <tr className="bg-[#F2F4F7]">
                <td colSpan="6" className="py-2 px-6 text-xs font-bold text-[#162D50] uppercase">
                  Audit & Compliance
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-white">
                <td className="py-5 px-6 text-gray-600 font-medium">#STF-8821</td>
                <td className="py-5 px-6 text-gray-900">Eleanor Vance</td>
                <td className="py-5 px-6 text-gray-600">Audit & Compliance</td>
                <td className="py-5 px-6 text-gray-600">Oct 24, 2023</td>
                <td className="py-5 px-6">
                  <span className="px-3 py-1 bg-[#F5D056] text-[#6b5207] rounded-full text-xs font-bold inline-block w-[130px] text-center">
                    Verification Pending
                  </span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button className="text-[#162D50] hover:text-blue-700">
                    <Eye className="w-5 h-5 mx-auto" />
                  </button>
                </td>
              </tr>

              {/* Group 2 */}
              <tr className="bg-[#F2F4F7]">
                <td colSpan="6" className="py-2 px-6 text-xs font-bold text-[#162D50] uppercase">
                  Taxation
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-white">
                <td className="py-5 px-6 text-gray-600 font-medium">#STF-8819</td>
                <td className="py-5 px-6 text-gray-900">Marcus Thorne</td>
                <td className="py-5 px-6 text-gray-600">Taxation</td>
                <td className="py-5 px-6 text-gray-600">Oct 22, 2023</td>
                <td className="py-5 px-6">
                  <span className="px-3 py-1 bg-[#4CAF50] text-white rounded-full text-xs font-bold inline-block w-[130px] text-center">
                    Active
                  </span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button className="text-[#162D50] hover:text-blue-700">
                    <Eye className="w-5 h-5 mx-auto" />
                  </button>
                </td>
              </tr>

              {/* Group 3 */}
              <tr className="bg-[#F2F4F7]">
                <td colSpan="6" className="py-2 px-6 text-xs font-bold text-[#162D50] uppercase">
                  Payroll
                </td>
              </tr>
              <tr className="border-b border-gray-100 bg-white">
                <td className="py-5 px-6 text-gray-600 font-medium">#STF-8815</td>
                <td className="py-5 px-6 text-gray-900">Sarah Jenkins</td>
                <td className="py-5 px-6 text-gray-600">Payroll</td>
                <td className="py-5 px-6 text-gray-600">Oct 20, 2023</td>
                <td className="py-5 px-6">
                  <span className="px-3 py-1 bg-[#D32F2F] text-white rounded-full text-xs font-bold inline-block w-[130px] text-center">
                    Missing Pledges
                  </span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button className="text-[#162D50] hover:text-blue-700">
                    <Eye className="w-5 h-5 mx-auto" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
