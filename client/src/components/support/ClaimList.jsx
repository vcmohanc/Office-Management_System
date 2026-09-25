import React, { useState, useEffect } from 'react';
import { Filter, Download, Eye, ChevronDown } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';

// Japanese translation map for option labels from DB
const optionLabelJP = {
  'Postage': '郵便料金',
  'Transportation Expenses / Flight Fare': '交通費 / 航空運賃',
  'Visa application fee': 'ビザ申請料',
  'Waiting Dormitory Fee': '待機寮費',
  'Hospital Fee': '病院費',
  'Equipment/Supplies': '備品・消耗品',
  'WIFI': 'WIFI',
  'others': 'その他',
  'Service staff': 'サービススタッフ',
  'VC': 'VC',
  'Dispatch destination: Farm': '派遣先：農園',
  'Select for each project': 'プロジェクト毎に選択',
  'Office': 'オフィス',
  'Staff': 'スタッフ',
  'Host Company': 'ホスト企業',
  'Transfer to the person concerned': '本人への振込',
  'Salary deduction': '給与控除',
  'Invoice from the client company': 'クライアント会社からの請求書',
};
const toJP = (label) => optionLabelJP[label] ?? label;



export default function ClaimList() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/claims')
      .then(res => res.json())
      .then(data => {
        setClaims(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching claims:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header Options */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <h1 className="text-xl font-bold text-[#162D50]">請求詳細</h1>
          
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">月:</span>
              <div className="relative inline-block text-left">
                <button className="flex items-center justify-between bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none w-48">
                  2023年11月
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
                <th className="px-6 py-4 text-sm font-bold text-gray-600">請求ID</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">支払いタイプ</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">詳細</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">金額</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">日付</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">ステータス</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-5 text-center text-gray-500">読み込み中...</td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-5 text-center text-gray-500">請求は見つかりませんでした。</td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-800">
                      <div className="max-w-[80px] break-words whitespace-normal">{claim.claim_id || `#CLM-${claim._id.slice(-6).toUpperCase()}`}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">{claim.payment_process_types ? toJP(claim.payment_process_types) : '-'}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">{toJP(claim.expense_type)}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-900">¥{(claim.expense_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">
                      {claim.expense_period_start ? new Date(claim.expense_period_start).toLocaleDateString('en-US') : '-'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        claim.status === '保留中' ? 'bg-blue-100 text-blue-700' :
                        claim.status === '承認済' ? 'bg-green-100 text-green-700' :
                        claim.status === '拒否' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-center">
                      <button className="text-gray-500 hover:text-[#162D50] transition-colors focus:outline-none">
                        <Eye className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
