import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle,
  ArrowUp,
  Plus,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';

export default function SupportDashboard() {
  const [data, setData] = useState({
    activeClaims: 0,
    pendingLeaves: 7,
    scheduledShifts: 18,
    taskCompletionRate: '82%',
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiFetch('/api/dashboard/support');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching support dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#162D50]">サポートチームダッシュボード</h1>
        <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>今週 (10月23日 - 10月29日)</span>
          <ChevronDownIcon className="w-4 h-4 text-gray-500 ml-2" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">アクティブな請求（チーム）</h3>
            <div className="p-2 bg-blue-50 rounded-md text-blue-500 opacity-80">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">
              {loading ? '...' : data.activeClaims}
            </span>
            <div className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold">
              オープン（追跡中）
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">休暇申請（保留中）</h3>
            <div className="p-2 bg-gray-100 rounded-md text-gray-400 opacity-80">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">
              {loading ? '...' : data.pendingLeaves}
            </span>
            <div className="flex items-center bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs font-semibold">
              対応が必要
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">本日の予定シフト</h3>
            <div className="p-2 bg-gray-100 rounded-md text-gray-400 opacity-80">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">
              {loading ? '...' : data.scheduledShifts}
            </span>
            <div className="flex items-center bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-semibold">
              90% カバレッジ
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">タスク完了率</h3>
            <div className="p-2 bg-gray-100 rounded-full border-4 border-gray-200 text-gray-400 opacity-80">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">
              {loading ? '...' : data.taskCompletionRate}
            </span>
            <div className="flex items-center bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-semibold">
              <ArrowUp className="w-3 h-3 mr-1" />
              安定
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-[#162D50]">チームの最近のアクティビティ</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">全ログを表示</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">スタッフ</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">申請タイプ</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">日付/時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">読み込み中...</td>
                  </tr>
                ) : data.recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">最近のアクティビティはありません。</td>
                  </tr>
                ) : (
                  data.recentActivity.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.staff}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium border border-transparent ${activity.statusColor} border-current border-opacity-20`}>
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Delegation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-[#162D50]">タスク委任</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-center text-center mb-6">
              <div className="w-1/2 border-r border-gray-200">
                <div className="text-2xl font-bold text-[#162D50]">12</div>
                <div className="text-xs font-bold text-gray-500 tracking-wider">保留中</div>
              </div>
              <div className="w-1/2">
                <div className="text-2xl font-bold text-green-600">45</div>
                <div className="text-xs font-bold text-gray-500 tracking-wider">完了</div>
              </div>
            </div>

            <div className="space-y-3">
              
              <div className="border border-gray-200 rounded-md p-3 flex items-start">
                <div className="mt-0.5 mr-3">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400"></div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#162D50]">Q3経費監査</h4>
                  <p className="text-xs text-gray-500 mt-1">担当者: Sarah J. &bull; 期限: 10月27日</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-3 flex items-start">
                <div className="mt-0.5 mr-3">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#162D50]">残業ログの確認</h4>
                  <p className="text-xs text-red-500 mt-1">担当者: Michael C. &bull; 期限切れ</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-3 flex items-start">
                <div className="mt-0.5 mr-3">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400"></div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#162D50]">ポリシードキュメントの更新</h4>
                  <p className="text-xs text-gray-500 mt-1">担当者: Emily R. &bull; 期限: 11月01日</p>
                </div>
              </div>

            </div>
          </div>
          
          <div className="mt-auto border-t border-gray-200 p-4 text-center">
            <button className="text-sm font-bold text-[#162D50] hover:text-blue-700">すべてのタスクを管理</button>
          </div>
        </div>

      </div>
    </div>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
