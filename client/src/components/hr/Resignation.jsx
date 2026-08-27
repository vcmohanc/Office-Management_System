import { Search, Filter, Plus } from 'lucide-react';

export default function Resignation() {
  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">退職管理</h2>
        <p className="text-gray-500 text-sm">スタッフの退職手続き、引き継ぎ状況、最終精算を管理します。</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2 font-medium">退職予告中</p>
          <p className="text-3xl font-bold text-[#162D50]">8</p>
        </div>
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2 font-medium">引き継ぎ待ち</p>
          <p className="text-3xl font-bold text-[#162D50]">5</p>
        </div>
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-2 font-medium">退職面談予定</p>
          <p className="text-3xl font-bold text-[#162D50]">3</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="氏名またはIDで検索..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-white"
          />
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 mr-2" />
            絞り込み
          </button>
          <button className="flex items-center justify-center bg-[#0A192F] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#162D50] transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            退職手続きを登録
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-sm font-bold text-[#162D50]">
                <th className="py-4 px-6">スタッフID</th>
                <th className="py-4 px-6">氏名</th>
                <th className="py-4 px-6">退職届出日</th>
                <th className="py-4 px-6">最終出勤日</th>
                <th className="py-4 px-6">引き継ぎ状況</th>
                <th className="py-4 px-6">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-600">EMP-2045</td>
                <td className="py-4 px-6 font-bold text-gray-900">サラ・ジェンキンス</td>
                <td className="py-4 px-6 text-gray-600">2023-10-12</td>
                <td className="py-4 px-6 text-gray-600">2023-11-12</td>
                <td className="py-4 px-6">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">予告期間中</span>
                </td>
                <td className="py-4 px-6">
                  <button className="text-[#162D50] font-bold hover:underline text-sm">詳細を表示</button>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-600">EMP-1982</td>
                <td className="py-4 px-6 font-bold text-gray-900">マイケル・チェン</td>
                <td className="py-4 px-6 text-gray-600">2023-10-05</td>
                <td className="py-4 px-6 text-gray-600">2023-11-05</td>
                <td className="py-4 px-6">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">退職面談待ち</span>
                </td>
                <td className="py-4 px-6">
                  <button className="text-[#162D50] font-bold hover:underline text-sm">詳細を表示</button>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-600">EMP-2103</td>
                <td className="py-4 px-6 font-bold text-gray-900">エレナ・ロドリゲス</td>
                <td className="py-4 px-6 text-gray-600">2023-09-28</td>
                <td className="py-4 px-6 text-gray-600">2023-10-28</td>
                <td className="py-4 px-6">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">経理確認中</span>
                </td>
                <td className="py-4 px-6">
                  <button className="text-[#162D50] font-bold hover:underline text-sm">詳細を表示</button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-600">EMP-1855</td>
                <td className="py-4 px-6 font-bold text-gray-900">デビッド・スミス</td>
                <td className="py-4 px-6 text-gray-600">2023-09-15</td>
                <td className="py-4 px-6 text-gray-600">2023-10-15</td>
                <td className="py-4 px-6">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">完了</span>
                </td>
                <td className="py-4 px-6">
                  <button className="text-[#162D50] font-bold hover:underline text-sm">詳細を表示</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
