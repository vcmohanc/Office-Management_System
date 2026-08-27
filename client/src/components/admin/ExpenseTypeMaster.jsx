import { useState } from 'react';
import { Search, Edit2 } from 'lucide-react';
import { EXPENSE_TYPES } from '../../constants/expenseTypes';

export default function ExpenseTypeMaster() {
  const [disabledKeys, setDisabledKeys] = useState([]);

  const toggleEnabled = (key) => {
    setDisabledKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">種別マスタ管理</h2>
        <p className="text-gray-500 text-sm">立替案件で使用する費用種別の一覧です。管理者はここで種別の追加・編集・停止を行います。</p>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="種別名で検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
        </div>
        <button className="bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap">
          + 種別を追加
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">種別名</th>
                <th className="py-4 px-6">対象区分（固定）</th>
                <th className="py-4 px-6">費用負担先（デフォルト）</th>
                <th className="py-4 px-6">標準処理</th>
                <th className="py-4 px-6">状態</th>
                <th className="py-4 px-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {EXPENSE_TYPES.map((type) => {
                const isDisabled = disabledKeys.includes(type.key);
                return (
                  <tr key={type.key} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-bold text-gray-900">{type.label}</td>
                    <td className="py-4 px-6 text-gray-600">{type.targetCategory || '案件ごとに選択'}</td>
                    <td className="py-4 px-6 text-gray-600">{type.defaultCostBearer || '案件ごとに選択'}</td>
                    <td className="py-4 px-6 text-gray-600">{type.standardProcess}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleEnabled(type.key)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          isDisabled
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}
                      >
                        {isDisabled ? '停止中' : '有効'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-gray-400 hover:text-[#162D50] transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
