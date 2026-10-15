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
  AlertTriangle,
  Activity,
  RefreshCw,
  Clock,
  ChevronRight,
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

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
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
  const totalClaims = td.pending + td.completed;
  const completionPct = totalClaims > 0 ? Math.round((td.completed / totalClaims) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-r from-[#162D50] to-[#1e4080] rounded-2xl p-6 text-white shadow-lg overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 right-24 w-28 h-28 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: titles */}
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
              カスタマーサポート管理
            </p>
            <h2 className="text-2xl font-bold text-white leading-tight">サポート部門</h2>
            <p className="text-blue-200 text-sm mt-1">
              スタッフの請求・クレーム処理状況を管理します。
            </p>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              title="更新"
            >
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="bg-white/10 text-white text-sm rounded-xl px-3 py-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-200 flex-shrink-0" />
              <span className="whitespace-nowrap">{getWeekRange()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1 — Active Claims */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">アクティブな請求</span>
            <div className="w-8 h-8 rounded-lg bg-[#162D50]/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#162D50]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#162D50]">
            {loading ? <span className="text-gray-300">…</span> : (data?.activeClaims ?? 0)}
          </div>
          <div className="mt-1 text-xs text-gray-400">オープン（追跡中）</div>
        </div>

        {/* Card 2 — Pending Action */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">要対応クレーム</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${(data?.pendingActionClaims ?? 0) > 0 ? 'text-orange-500' : 'text-[#162D50]'}`}>
            {loading ? <span className="text-gray-300">…</span> : (data?.pendingActionClaims ?? 0)}
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {(data?.pendingActionClaims ?? 0) > 0 ? '対応が必要' : '全て対応済み'}
          </div>
        </div>

        {/* Card 3 — Staff Count */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">登録スタッフ数</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#162D50]">
            {loading ? <span className="text-gray-300">…</span> : (data?.totalStaff ?? 0)}
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {loading ? '…' : `${data?.staffCoverageRate ?? 100}% ビザ有効`}
          </div>
        </div>

        {/* Card 4 — Completion Rate */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">クレーム完了率</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold text-green-600">
              {loading ? <span className="text-gray-300">…</span> : `${data?.completionRate ?? 0}%`}
            </div>
            {!loading && (
              <span className={`mb-0.5 flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                data?.completionTrend === 'down'
                  ? 'bg-red-50 text-red-500'
                  : 'bg-green-50 text-green-600'
              }`}>
                {data?.completionTrend === 'down'
                  ? <><ArrowDown className="w-3 h-3 mr-0.5" />減少</>
                  : <><ArrowUp className="w-3 h-3 mr-0.5" />安定</>
                }
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-400">今週の完了率</div>
        </div>

      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {/* Table header */}
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#162D50]" />
              <span className="font-semibold text-[#162D50] text-sm">最近のアクティビティ</span>
            </div>
            <button
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              onClick={() => goTo('Claim List')}
            >
              全ログを表示
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">スタッフ</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">申請タイプ</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">ステータス</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">日付/時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </td>
                      <td className="px-5 py-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-5 py-3"><div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" /></td>
                      <td className="px-5 py-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : !data?.recentActivity?.length ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center">
                      <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">最近のアクティビティはありません。</p>
                    </td>
                  </tr>
                ) : (
                  data.recentActivity.map((activity, idx) => (
                    <tr
                      key={activity.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => goTo('Claim List')}
                    >
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                            {getInitials(activity.staff)}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{activity.staff}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{activity.type}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${activity.statusColor}`}>
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-400">{activity.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right — Claims Status Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          {/* Panel header */}
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-[#162D50] text-sm">クレーム状況</span>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#162D50] hover:bg-gray-200 transition-colors"
              onClick={() => goTo('Staff Claim Request')}
              title="新規クレーム"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5 flex-1">
            {/* Stats row */}
            <div className="flex items-stretch">
              <div className="flex-1 text-center pr-4 border-r border-gray-100">
                <div className="text-2xl font-bold text-[#162D50]">
                  {loading ? <span className="text-gray-300">…</span> : td.pending}
                </div>
                <div className="text-xs font-semibold text-gray-400 tracking-wider mt-0.5">保留中</div>
              </div>
              <div className="flex-1 text-center pl-4">
                <div className="text-2xl font-bold text-green-600">
                  {loading ? <span className="text-gray-300">…</span> : td.completed}
                </div>
                <div className="text-xs font-semibold text-gray-400 tracking-wider mt-0.5">完了</div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>完了率</span>
                <span className="font-semibold text-green-600">{completionPct}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-2 flex-1">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              ) : td.tasks.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-6">
                  進行中のクレームはありません
                </div>
              ) : (
                td.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-gray-100 hover:bg-gray-50 p-3 flex items-start gap-3 cursor-pointer transition-colors"
                    onClick={() => goTo('Claim List')}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {task.isExpired
                        ? <AlertCircle className="w-4 h-4 text-red-500" />
                        : <div className="w-4 h-4 rounded-full border-2 border-blue-400" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{task.title}</h4>
                      <p className={`text-xs mt-0.5 truncate ${task.isExpired ? 'text-red-400' : 'text-gray-400'}`}>
                        <span className="font-medium">担当者:</span> {task.person}
                        {task.deadline && (
                          <span className={task.isExpired ? 'text-red-400' : 'text-gray-400'}>
                            {' '}・{task.isExpired ? '期限切れ' : `期限: ${task.deadline}`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-4 text-center">
            <button
              className="text-sm font-semibold text-[#162D50] hover:text-blue-700 flex items-center gap-1 mx-auto transition-colors"
              onClick={() => goTo('Claim List')}
            >
              すべてのクレームを管理
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ── Bottom Quick Actions ── */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => goTo('Staff Claim Request')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#162D50] text-[#162D50] text-sm font-semibold hover:bg-[#162D50]/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規クレーム申請
        </button>
        <button
          onClick={() => goTo('Claim List')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-4 h-4" />
          クレーム一覧
        </button>
      </div>

    </div>
  );
}
