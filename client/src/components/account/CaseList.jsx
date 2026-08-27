import { useState } from 'react';
import { Search, ChevronDown, FileText, AlertTriangle, Filter } from 'lucide-react';
import {
  EXPENSE_TYPES,
  COST_BEARER_CATEGORIES,
  CASE_STATUSES,
  CASE_STATUS_COLORS,
} from '../../constants/expenseTypes';
import { ROLES } from '../../constants/roles';

const MOCK_CASES = [
  { id: '#CAS-2024-011', date: '2024-05-20', type: '郵送費', advancer: '田中 太郎', target: '田中 太郎', costBearer: 'VC', amount: 4500, status: '未処理', hasAttachment: true, group: 'staff' },
  { id: '#CAS-2024-010', date: '2024-05-19', type: '病院代', advancer: '鈴木 花子', target: '鈴木 花子', costBearer: 'サービススタッフ', amount: 12000, status: '処理中', hasAttachment: true, group: 'staff' },
  { id: '#CAS-2024-009', date: '2024-05-18', type: '待機寮', advancer: 'VC', target: '佐藤 健', costBearer: 'サービススタッフ', amount: 85000, status: '差戻し', hasAttachment: false, group: 'staff' },
  { id: '#CAS-2024-008', date: '2024-05-17', type: 'WIFI', advancer: 'VC', target: 'グリーンファーム農園', costBearer: '派遣先・農家', amount: 6800, status: '完了', hasAttachment: true, group: 'host' },
  { id: '#CAS-2024-007', date: '2024-05-16', type: 'フライト代', advancer: '高橋 誠', target: '高橋 誠', costBearer: 'VC', amount: 68000, status: '保留', hasAttachment: true, group: 'staff' },
  { id: '#CAS-2024-006', date: '2024-05-15', type: '交通費', advancer: '山田 一郎', target: '山田 一郎', costBearer: 'VC', amount: 3200, status: '取消', hasAttachment: false, group: 'staff' },
];

export default function CaseList() {
  const user = JSON.parse(localStorage.getItem('user')) || { role: ROLES.APPLICANT };
  const isReviewer = user.role === ROLES.REVIEWER;

  const [quickFilter, setQuickFilter] = useState('all');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [selectedCase, setSelectedCase] = useState(MOCK_CASES[2]);

  const filteredCases = MOCK_CASES.filter((c) => {
    if (quickFilter === 'staff') return c.group === 'staff';
    if (quickFilter === 'host') return c.group === 'host';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <h2 className="text-2xl font-bold text-[#162D50] mb-4">{isReviewer ? '案件確認（レビューキュー）' : 'マイ案件一覧'}</h2>

      {/* Quick Filter Tabs */}
      <div className="bg-[#F2F4F7] p-1 rounded-md flex space-x-1 mb-4 border border-gray-200">
        {[
          { key: 'all', label: 'すべて' },
          { key: 'staff', label: 'サービススタッフ関連' },
          { key: 'host', label: '派遣先・農家関連' },
        ].map((tab) => {
          const count = tab.key === 'all' ? MOCK_CASES.length : MOCK_CASES.filter((c) => c.group === tab.key).length;
          const active = quickFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setQuickFilter(tab.key)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
                active ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab.label} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-4 space-y-4">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-600 mb-1">検索</label>
            <div className="relative">
              <input type="text" placeholder="ケースID・立替者・対象名で検索" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="w-44">
            <label className="block text-xs font-bold text-gray-600 mb-1">種別</label>
            <div className="relative">
              <select className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                <option>すべての種別</option>
                {EXPENSE_TYPES.map((t) => <option key={t.key}>{t.label}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="w-44">
            <label className="block text-xs font-bold text-gray-600 mb-1">ステータス</label>
            <div className="relative">
              <select className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                <option>すべてのステータス</option>
                {CASE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="w-44">
            <label className="block text-xs font-bold text-gray-600 mb-1">費用負担先</label>
            <div className="relative">
              <select className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                <option>すべて</option>
                {COST_BEARER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={() => setShowAdvancedFilter((v) => !v)}
            className="border border-gray-300 bg-white text-gray-600 px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap h-[38px] flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" /> 詳細フィルタ
          </button>
          <button className="bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap h-[38px]">
            適用
          </button>
        </div>

        {showAdvancedFilter && (
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">立替者</label>
              <input type="text" placeholder="立替者名で絞り込み" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">対象（スタッフ／派遣先・農家）</label>
              <input type="text" placeholder="対象名で絞り込み" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <label className="flex items-center text-sm text-gray-700 mt-6">
              <input type="checkbox" className="w-4 h-4 mr-2 accent-[#162D50]" /> 給与天引き待ちのみ
            </label>
            <label className="flex items-center text-sm text-gray-700 mt-6">
              <input type="checkbox" className="w-4 h-4 mr-2 accent-[#162D50]" /> 添付不足のみ
            </label>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-600">
              <th className="py-3 px-6 whitespace-nowrap">ケースID</th>
              <th className="py-3 px-6 whitespace-nowrap">発生日</th>
              <th className="py-3 px-6 whitespace-nowrap">種別</th>
              <th className="py-3 px-6 whitespace-nowrap">立替者</th>
              <th className="py-3 px-6 whitespace-nowrap">対象</th>
              <th className="py-3 px-6 whitespace-nowrap">費用負担先</th>
              <th className="py-3 px-6 whitespace-nowrap">金額</th>
              <th className="py-3 px-6 whitespace-nowrap">ステータス</th>
              <th className="py-3 px-6 whitespace-nowrap">添付</th>
              <th className="py-3 px-6 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredCases.map((c) => (
              <tr
                key={c.id}
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedCase?.id === c.id ? 'bg-gray-50' : ''}`}
                onClick={() => setSelectedCase(c)}
              >
                <td className="py-4 px-6 text-gray-600">{c.id}</td>
                <td className="py-4 px-6 text-gray-600">{c.date}</td>
                <td className="py-4 px-6 text-gray-600">{c.type}</td>
                <td className="py-4 px-6 text-gray-800">{c.advancer}</td>
                <td className="py-4 px-6 text-gray-800">{c.target}</td>
                <td className="py-4 px-6 text-gray-600">{c.costBearer}</td>
                <td className="py-4 px-6 font-bold text-gray-800">¥{c.amount.toLocaleString()}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${CASE_STATUS_COLORS[c.status]}`}>{c.status}</span>
                </td>
                <td className="py-4 px-6">
                  {c.hasAttachment ? <FileText className="w-4 h-4 text-gray-400" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                </td>
                <td className="py-4 px-6">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedCase(c); }} className="text-[#162D50] font-bold hover:underline">詳細</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Case Detail Preview */}
      {selectedCase && (
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-md mt-8">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-md">
            <h3 className="text-[#162D50] text-lg font-bold">案件詳細プレビュー — {selectedCase.id}</h3>
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${CASE_STATUS_COLORS[selectedCase.status]}`}>{selectedCase.status}</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 bg-white">
            {/* 基本情報 */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">基本情報</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ケースID</span>
                  <span className="font-bold text-gray-800">{selectedCase.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">立替者</span>
                  <span className="font-bold text-gray-800">{selectedCase.advancer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">対象</span>
                  <span className="font-bold text-gray-800">{selectedCase.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">種別</span>
                  <span className="font-bold text-gray-800">{selectedCase.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">金額</span>
                  <span className="font-bold text-gray-800">¥{selectedCase.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 精算・回収状況 */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">精算・回収状況</h4>
              <div className="bg-[#E9ECEF] rounded-md p-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">立替者への精算</span>
                  <span className="font-bold text-gray-800">¥{selectedCase.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-4 pb-4 border-b border-gray-300">
                  <span className="text-gray-500">方法</span>
                  <span className="text-gray-800">本人へ振込</span>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">費用負担先からの回収方法</div>
                  <div className="text-gray-800">{selectedCase.costBearer === 'VC' ? 'VC経費処理（回収不要）' : '給与天引き'}</div>
                </div>
              </div>
              {selectedCase.status === '差戻し' && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-600">
                  差戻し理由：添付書類（誓約書）が未提出のため、再提出をお願いします。
                </div>
              )}
            </div>

            {/* 添付書類 */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">添付書類</h4>
              <div className="space-y-3">
                {selectedCase.hasAttachment ? (
                  <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex justify-between items-center text-sm">
                    <div className="flex items-center text-gray-700">
                      <FileText className="w-4 h-4 mr-2" />
                      receipt.pdf
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex justify-between items-center text-sm">
                    <span className="text-gray-400">添付なし</span>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Extra sections */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-t border-gray-100">
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">分割天引き明細</h4>
              <p className="text-sm text-gray-400">分割払いの指定はありません</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">処理履歴</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>{selectedCase.date} 案件登録（申請者）</li>
                {selectedCase.status !== '未処理' && <li>2024-05-21 内容確認者が確認</li>}
              </ul>
            </div>
          </div>

          {/* Action Buttons (role-gated) */}
          <div className="p-4 border-t border-gray-200 flex justify-end items-center space-x-4 bg-gray-50 rounded-b-md">
            {isReviewer ? (
              <>
                <button className="text-red-500 font-medium px-4 hover:underline">差戻し</button>
                <button className="border border-gray-300 bg-white text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50">取消</button>
                <button className="bg-[#0A192F] text-white px-6 py-2 rounded-md font-bold hover:bg-[#162D50] shadow-sm">承認</button>
              </>
            ) : (
              <>
                <button className="border border-gray-300 bg-white text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50">取消</button>
                {selectedCase.status === '差戻し' && (
                  <button className="bg-[#0A192F] text-white px-6 py-2 rounded-md font-bold hover:bg-[#162D50] shadow-sm">編集して再申請</button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
