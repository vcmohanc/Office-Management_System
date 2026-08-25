import { Briefcase, Building, Handshake, FileText, ChevronDown, Eye, FileSignature, TrendingUp } from 'lucide-react';

export default function B2BDashboard() {
  return (
    <div className="flex flex-col space-y-6">
      {/* Banner */}
      <div className="bg-[#1e3a5f] rounded-xl p-8 flex flex-col items-center justify-center text-white shadow-md">
        <Handshake className="w-8 h-8 mb-3 text-blue-200" />
        <h2 className="text-sm font-bold tracking-widest text-blue-100">BUSINESS PARTNERSHIPS & CONTRACTS</h2>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Partners */}
        <div className="bg-[#0f1f38] rounded-xl p-5 flex flex-col items-center justify-center text-white shadow-sm border border-[#0f1f38] transition-transform hover:scale-105">
          <Building className="w-6 h-6 mb-2 text-blue-200" />
          <p className="text-2xl font-bold mb-1">34</p>
          <p className="text-[10px] font-bold tracking-wider text-blue-100 uppercase">Active Partners</p>
        </div>

        {/* Ongoing Contracts */}
        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200 transition-transform hover:scale-105">
          <FileSignature className="w-6 h-6 mb-2 text-[#162D50]" />
          <p className="text-2xl font-bold mb-1">52</p>
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Ongoing Contracts</p>
        </div>

        {/* Pending Proposals */}
        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200 transition-transform hover:scale-105">
          <FileText className="w-6 h-6 mb-2 text-orange-500" />
          <p className="text-2xl font-bold mb-1">8</p>
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Pending Proposals</p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200 transition-transform hover:scale-105">
          <TrendingUp className="w-6 h-6 mb-2 text-green-600" />
          <p className="text-2xl font-bold mb-1">$1.2M</p>
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Monthly Revenue</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-[#F8F9FA] p-5 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Briefcase className="w-5 h-5 text-[#162D50]" />
            <h2 className="text-[#162D50] text-lg font-bold">Active B2B Engagements</h2>
          </div>
          <div className="bg-white border border-gray-300 rounded-md px-3 py-1.5 flex items-center shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-700 mr-2">Filter by Status</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Partner Name</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Industry</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Contract Start Date</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              
              <tr className="hover:bg-gray-50 transition-colors bg-white">
                <td className="py-5 px-6 font-medium text-gray-900">TechCorp Solutions</td>
                <td className="py-5 px-6 text-gray-600">Software & IT</td>
                <td className="py-5 px-6 text-gray-600">Jan 15, 2026</td>
                <td className="py-5 px-6">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-block w-[110px] text-center">
                    Active
                  </span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" title="View Details">
                    <Eye className="w-5 h-5 mx-auto" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 transition-colors bg-white">
                <td className="py-5 px-6 font-medium text-gray-900">Global Logistics Inc.</td>
                <td className="py-5 px-6 text-gray-600">Transportation</td>
                <td className="py-5 px-6 text-gray-600">Mar 02, 2026</td>
                <td className="py-5 px-6">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-block w-[110px] text-center">
                    Active
                  </span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" title="View Details">
                    <Eye className="w-5 h-5 mx-auto" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 transition-colors bg-white">
                <td className="py-5 px-6 font-medium text-gray-900">Nexus Healthcare</td>
                <td className="py-5 px-6 text-gray-600">Medical</td>
                <td className="py-5 px-6 text-gray-600">--</td>
                <td className="py-5 px-6">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold inline-block w-[110px] text-center">
                    Pending
                  </span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" title="View Details">
                    <Eye className="w-5 h-5 mx-auto" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 transition-colors bg-white">
                <td className="py-5 px-6 font-medium text-gray-900">Apex Manufacturing</td>
                <td className="py-5 px-6 text-gray-600">Industrial</td>
                <td className="py-5 px-6 text-gray-600">Sep 10, 2023</td>
                <td className="py-5 px-6">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold inline-block w-[110px] text-center">
                    Expiring Soon
                  </span>
                </td>
                <td className="py-5 px-6 text-center">
                  <button className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" title="View Details">
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
