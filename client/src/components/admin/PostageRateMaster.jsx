import { useState } from 'react';
import { Plus, Edit2, MapPin } from 'lucide-react';
import { POSTAGE_RATES } from '../../constants/postageRates';

export default function PostageRateMaster() {
  const [rates] = useState(POSTAGE_RATES);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">郵送費レート表</h2>
        <p className="text-gray-500 text-sm">送り元・送り先の組み合わせごとの標準郵送費です。新規案件登録で郵送費を選択すると、この表から金額が自動反映されます。</p>
      </div>

      <div className="flex justify-end mb-6">
        <button className="flex items-center bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" /> レートを追加
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6 whitespace-nowrap">送り元</th>
                <th className="py-4 px-6 whitespace-nowrap">送り先</th>
                <th className="py-4 px-6 text-right whitespace-nowrap">標準金額</th>
                <th className="py-4 px-6 text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rates.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-gray-800 flex items-center"><MapPin className="w-4 h-4 mr-2 text-gray-400" />{r.origin}</td>
                  <td className="py-4 px-6 text-gray-800">{r.destination}</td>
                  <td className="py-4 px-6 text-right font-bold text-gray-800">¥{r.amount.toLocaleString()}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-gray-400 hover:text-[#162D50] transition-colors">
                      <Edit2 className="w-4 h-4" />
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
