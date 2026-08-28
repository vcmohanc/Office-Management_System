import { Search, Calendar, Filter, UserPlus, Eye, Edit2 } from 'lucide-react';

export default function StaffList() {
  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">スタッフ一覧</h2>
        <p className="text-gray-500 text-sm">オフィス・サービス・農場の各部門に所属するスタッフを管理・確認します。</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">スタッフ総数</p>
          <p className="text-3xl font-bold text-[#162D50]">124</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">今月の新規採用</p>
          <p className="text-3xl font-bold text-[#162D50]">12</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">現在の配属数</p>
          <p className="text-3xl font-bold text-[#162D50]">108</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button className="border-[#162D50] text-[#162D50] whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm">
            すべてのスタッフ
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            オフィススタッフ
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            サービススタッフ
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            農場スタッフ
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="氏名またはスタッフIDで検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <input
            type="text"
            placeholder="入社日"
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
          <Calendar className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
        <button className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto">
          <Filter className="w-4 h-4 mr-2" />
          絞り込み
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">スタッフID</th>
                <th className="py-4 px-6">氏名</th>
                <th className="py-4 px-6">区分</th>
                <th className="py-4 px-6">役職</th>
                <th className="py-4 px-6">入社日</th>
                <th className="py-4 px-6">状態</th>
                <th className="py-4 px-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-[#162D50]">#STF-8824</td>
                <td className="py-4 px-6 font-bold text-gray-900">ラメシュ</td>
                <td className="py-4 px-6 text-gray-600">オフィススタッフ</td>
                <td className="py-4 px-6 text-gray-600">経理担当</td>
                <td className="py-4 px-6 text-gray-600">2023-10-12</td>
                <td className="py-4 px-6">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">在籍中</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3 text-gray-400">
                    <button className="hover:text-[#162D50] transition-colors"><UserPlus className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Eye className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-[#162D50]">#STF-8815</td>
                <td className="py-4 px-6 font-bold text-gray-900">スニタ</td>
                <td className="py-4 px-6 text-gray-600">サービススタッフ</td>
                <td className="py-4 px-6 text-gray-600">サービスリーダー</td>
                <td className="py-4 px-6 text-gray-600">2023-10-20</td>
                <td className="py-4 px-6">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">在籍中</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3 text-gray-400">
                    <button className="hover:text-[#162D50] transition-colors"><UserPlus className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Eye className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-[#162D50]">#STF-7742</td>
                <td className="py-4 px-6 font-bold text-gray-900">ビカス</td>
                <td className="py-4 px-6 text-gray-600">農場スタッフ</td>
                <td className="py-4 px-6 text-gray-600">農場マネージャー</td>
                <td className="py-4 px-6 text-gray-600">2022-01-15</td>
                <td className="py-4 px-6">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">休職中</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3 text-gray-400">
                    <button className="hover:text-[#162D50] transition-colors"><UserPlus className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Eye className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-[#162D50]">#STF-8819</td>
                <td className="py-4 px-6 font-bold text-gray-900">アルジュン</td>
                <td className="py-4 px-6 text-gray-600">オフィススタッフ</td>
                <td className="py-4 px-6 text-gray-600">総務担当</td>
                <td className="py-4 px-6 text-gray-600">2023-10-22</td>
                <td className="py-4 px-6 flex flex-col items-start">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-1">保留</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">確認待ち</span>
                </td>
                <td className="py-4 px-6 text-right align-top pt-5">
                  <div className="flex items-center justify-end space-x-3 text-gray-400">
                    <button className="hover:text-[#162D50] transition-colors"><UserPlus className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Eye className="w-5 h-5" /></button>
                    <button className="hover:text-[#162D50] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
