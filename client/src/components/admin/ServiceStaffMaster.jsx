import { useState } from 'react';
import { Search, Plus, Edit2 } from 'lucide-react';
import { STAFF_MASTER } from '../../constants/parties';

export default function ServiceStaffMaster() {
  const [query, setQuery] = useState('');

  const filtered = STAFF_MASTER.filter((s) => s.name.includes(query) || s.id.includes(query));

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">サービススタッフマスタ</h2>
        <p className="text-gray-500 text-sm">案件登録画面の「立替者」「対象」選択で使用するサービススタッフの一覧です。</p>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ID・氏名で検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
        </div>
        <button className="flex items-center bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" /> スタッフを追加
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6 whitespace-nowrap">スタッフID</th>
                <th className="py-4 px-6 whitespace-nowrap">氏名</th>
                <th className="py-4 px-6 whitespace-nowrap">状態</th>
                <th className="py-4 px-6 text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-[#162D50]">{s.id}</td>
                  <td className="py-4 px-6 font-bold text-gray-900">{s.name}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${s.status === '在籍中' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                      {s.status}
                    </span>
                  </td>
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
