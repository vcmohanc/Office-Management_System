import React from 'react';
import { Filter, Download, Eye, ChevronDown } from 'lucide-react';

export default function ClaimList() {
  const claims = [
    {
      id: 'PAY-4501',
      paymentType: 'Advance Borrow',
      details: '',
      amount: '¥12,000',
      scheduledDate: '2023-11-25',
      status: 'SCHEDULED',
      statusColor: 'bg-yellow-100 text-yellow-700'
    },
    {
      id: 'PAY-4502',
      paymentType: 'Payroll Deduction',
      details: '',
      amount: '¥8,500',
      scheduledDate: '2023-11-24',
      status: 'PROCESSING',
      statusColor: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'PAY-4503',
      paymentType: 'Bank Transfer',
      details: '',
      amount: '¥25,000',
      scheduledDate: '2023-11-20',
      status: 'COMPLETED',
      statusColor: 'bg-green-100 text-green-700'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header Options */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <h1 className="text-xl font-bold text-[#162D50]">Claim Details</h1>
          
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Month:</span>
              <div className="relative inline-block text-left">
                <button className="flex items-center justify-between bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none w-48">
                  November 2023
                  <ChevronDown className="w-4 h-4 ml-2 -mr-1" />
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 focus:outline-none">
                <Filter className="w-5 h-5" />
              </button>
              <button className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 focus:outline-none">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-y border-gray-200">
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Claim ID</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Payment Type</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Details</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Amount</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Scheduled Date</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-800">
                    <div className="max-w-[80px] break-words whitespace-normal">{claim.id}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">{claim.paymentType}</td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">{claim.details}</td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-900">{claim.amount}</td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">{claim.scheduledDate}</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${claim.statusColor}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-center">
                    <button className="text-gray-500 hover:text-[#162D50] transition-colors focus:outline-none">
                      <Eye className="w-5 h-5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
