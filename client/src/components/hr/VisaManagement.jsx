import { Search, Filter, Download, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';

export default function VisaManagement() {
  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">ビザ管理</h2>
        <p className="text-gray-500 text-sm">スタッフのビザ状況・更新・コンプライアンスを確認・管理します。</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">有効なビザ総数</p>
          <p className="text-3xl font-bold text-[#162D50]">1,248</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">期限間近（30日以内）</p>
          <p className="text-3xl font-bold text-blue-500">42</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">期限切れ・要対応</p>
          <p className="text-3xl font-bold text-red-500">12</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">更新手続き中</p>
          <p className="text-3xl font-bold text-yellow-500">28</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#F8F9FA] p-3 border border-gray-200 rounded-t-md flex justify-between items-center">
        <div className="relative w-80">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="スタッフ名またはIDで検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-white"
          />
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 mr-2" />
            絞り込み
          </button>
          <button className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            出力
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">スタッフID</th>
                <th className="py-4 px-6">氏名</th>
                <th className="py-4 px-6">国籍</th>
                <th className="py-4 px-6">ビザ種別</th>
                <th className="py-4 px-6">有効期限</th>
                <th className="py-4 px-6">状態</th>
                <th className="py-4 px-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-800 font-medium">EMP-0842</td>
                <td className="py-4 px-6 font-bold text-[#162D50]">サラ・ジェンキンス</td>
                <td className="py-4 px-6 text-gray-600">イギリス</td>
                <td className="py-4 px-6 text-gray-600">就労ビザ</td>
                <td className="py-4 px-6 text-gray-600">2025-10-12</td>
                <td className="py-4 px-6">
                  <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">有効</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="text-[#162D50] font-bold hover:underline text-sm">表示</button>
                    <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-800 font-medium">EMP-1105</td>
                <td className="py-4 px-6 font-bold text-[#162D50]">マイケル・チェン</td>
                <td className="py-4 px-6 text-gray-600">シンガポール</td>
                <td className="py-4 px-6 text-gray-600">就労許可</td>
                <td className="py-4 px-6 text-gray-600">2024-11-15</td>
                <td className="py-4 px-6">
                  <span className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">期限間近</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="bg-[#162D50] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-[#0f1f38] transition-colors shadow-sm">更新</button>
                    <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-800 font-medium">EMP-0921</td>
                <td className="py-4 px-6 font-bold text-[#162D50]">エレナ・ロドリゲス</td>
                <td className="py-4 px-6 text-gray-600">スペイン</td>
                <td className="py-4 px-6 text-gray-600">就労ビザ</td>
                <td className="py-4 px-6 text-gray-600">2024-09-30</td>
                <td className="py-4 px-6">
                  <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">期限切れ</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap">要対応</button>
                    <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-800 font-medium">EMP-1256</td>
                <td className="py-4 px-6 font-bold text-[#162D50]">デビッド・クマール</td>
                <td className="py-4 px-6 text-gray-600">インド</td>
                <td className="py-4 px-6 text-gray-600">就労許可</td>
                <td className="py-4 px-6 text-gray-600">2025-01-20</td>
                <td className="py-4 px-6">
                  <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">更新手続き中</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="text-[#162D50] font-bold hover:underline text-sm">詳細</button>
                    <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-white text-sm text-gray-600">
          <div>全1,248件中 1〜4件を表示</div>
          <div className="flex space-x-2">
            <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-400 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
