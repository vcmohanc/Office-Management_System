import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Users,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Plus,
  AlertCircle,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';

function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
  return `今週 (${fmt(monday)} - ${fmt(sunday)})`;
}

export default function SupportDashboard({ setActiveTab }) {
  const goTo = (tab) => setActiveTab?.(tab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await apiFetch('/api/dashboard/support');
      if (response.ok) {
        setData(await response.json());
      }
    } catch (error) {
      console.error('Error fetching support dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const td = data?.taskDelegation || { pending: 0, completed: 0, tasks: [] };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#162D50]">サポートチームダッシュボード</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-[#162D50] hover:bg-gray-100 rounded-md transition-colors"
            title="更新"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{getWeekRange()}</span>
            <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Card 1 — Active Claims */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">アクティブな請求（チーム）</h3>
            <div className="p-2 bg-blue-50 rounded-md text-blue-500 opacity-80">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">
              {loading ? '…' : (data?.activeClaims ?? 0)}
            </span>
            <div className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold">
              オープン（追跡中）
            </div>
          </div>
        </div>

        {/* Card 2 — Pending Action */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">要対応クレーム</h3>
            <div className="p-2 bg-gray-100 rounded-md text-gray-400 opacity-80">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">
              {loading ? '…' : (data?.pendingActionClaims ?? 0)}
            </span>
            <div className={`flex items-center px-2 py-1 rounded text-xs font-semibold ${
              (data?.pendingActionClaims ?? 0) > 0
                ? 'bg-orange-50 text-orange-600'
                : 'bg-green-50 text-green-600'
            }`}>
              {(data?.pendingActionClaims ?? 0) > 0 ? '対応が必要' : '全て対応済み'}
            </div>
          </div>
        </div>

        {/* Card 3 — Staff count */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">登録スタッフ数</h3>
            <div className="p-2 bg-gray-100 rounded-md text-gray-400 opacity-80">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">
              {loading ? '…' : (data?.totalStaff ?? 0)}
            </span>
            <div className="flex items-center bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-semibold">
              {loading ? '…' : `${data?.staffCoverageRate ?? 100}% ビザ有効`}
            </div>
          </div>
        </div>

        {/* Card 4 — Task Completion Rate */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">クレーム完了率</h3>
            <div className="p-2 bg-gray-100 rounded-full border-4 border-gray-200 text-gray-400 opacity-80">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">
              {loading ? '…' : `${data?.completionRate ?? 0}%`}
            </span>
            <div className={`flex items-center px-2 py-1 rounded text-xs font-semibold ${
              data?.completionTrend === 'down'
                ? 'bg-red-50 text-red-600'
                : 'bg-green-50 text-green-600'
            }`}>
              {data?.completionTrend === 'down'
                ? <><ArrowDown className="w-3 h-3 mr-1" />減少</>
                : <><ArrowUp className="w-3 h-3 mr-1" />安定</>
              }
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
            <button
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => goTo('Claim List')}
            >
              全ログを表示
            </button>
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
                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">読み込み中…</td>
                  </tr>
                ) : !data?.recentActivity?.length ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">最近のアクティビティはありません。</td>
                  </tr>
                ) : (
                  data.recentActivity.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => goTo('Claim List')}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.staff}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${activity.statusColor}`}>
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
            <h2 className="font-bold text-[#162D50]">クレーム状況</h2>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => goTo('Staff Claim Request')}
              title="新規クレーム"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center text-center mb-6">
              <div className="w-1/2 border-r border-gray-200">
                <div className="text-2xl font-bold text-[#162D50]">
                  {loading ? '…' : td.pending}
                </div>
                <div className="text-xs font-bold text-gray-500 tracking-wider">保留中</div>
              </div>
              <div className="w-1/2">
                <div className="text-2xl font-bold text-green-600">
                  {loading ? '…' : td.completed}
                </div>
                <div className="text-xs font-bold text-gray-500 tracking-wider">完了</div>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-gray-400 text-center py-4">読み込み中…</div>
              ) : td.tasks.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4">進行中のクレームはありません</div>
              ) : (
                td.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-md p-3 flex items-start hover:bg-gray-50 cursor-pointer"
                    onClick={() => goTo('Claim List')}
                  >
                    <div className="mt-0.5 mr-3 flex-shrink-0">
                      {task.isExpired
                        ? <AlertCircle className="w-4 h-4 text-red-500" />
                        : <div className="w-4 h-4 rounded-full border-2 border-blue-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#162D50] truncate">{task.title}</h4>
                      <p className={`text-xs mt-1 truncate ${task.isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                        担当者: {task.person}
                        {task.deadline && (
                          <> &bull; {task.isExpired ? '期限切れ' : `期限: ${task.deadline}`}</>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-auto border-t border-gray-200 p-4 text-center">
            <button
              className="text-sm font-bold text-[#162D50] hover:text-blue-700"
              onClick={() => goTo('Claim List')}
            >
              すべてのクレームを管理
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
