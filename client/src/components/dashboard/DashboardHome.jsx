import React, { useState, useEffect } from 'react';
import {
  Users, PlusCircle, Settings, List,
  Clock, AlertTriangle, FileText, Briefcase,
  HeartHandshake, TrendingUp, RefreshCw, Bell, ChevronRight,
  UserCheck, UserX, CreditCard, Zap, Landmark, Headphones
} from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';

export default function DashboardHome({ setActiveTab }) {
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentUsers, setRecentUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);

  const formatJapaneseDate = (date) =>
    date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const formatTime = (date) =>
    date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        apiFetch('/api/auth/users'),
        apiFetch('/api/dashboard'),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setTotalUsers(data.length);
        setRecentUsers(data.slice(0, 6));
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setDashboardStats(data.stats);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(clockInterval);
  }, []);

  const alertCount =
    (dashboardStats?.hr?.pendingVisas || 0) +
    (dashboardStats?.support?.criticalIssues || 0);

  const getRoleLabel = (role) => {
    const labels = { admin: '管理者', hr: '人事', account: '経理', support: 'サポート', b2b: 'B2B' };
    return labels[role] || role;
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-700 border border-purple-200',
      hr: 'bg-blue-100 text-blue-700 border border-blue-200',
      account: 'bg-green-100 text-green-700 border border-green-200',
      support: 'bg-orange-100 text-orange-700 border border-orange-200',
      b2b: 'bg-pink-100 text-pink-700 border border-pink-200',
    };
    return styles[role] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const getInitialsBg = (role) => {
    const colors = {
      admin: 'bg-purple-500', hr: 'bg-blue-500', account: 'bg-green-500',
      support: 'bg-orange-500', b2b: 'bg-pink-500',
    };
    return colors[role] || 'bg-gray-500';
  };

  const getUserInitials = (username) =>
    username ? username.substring(0, 2).toUpperCase() : '??';

  const hrUtilization = () => {
    const total = dashboardStats?.hr?.totalStaff || 0;
    const resigned = dashboardStats?.hr?.recentResignations || 0;
    return total > 0 ? Math.min(100, Math.round(((total - resigned) / total) * 100)) : 0;
  };

  const settlementRate = () => {
    const open = dashboardStats?.account?.openCases || 0;
    const pending = dashboardStats?.account?.pendingSettlements || 0;
    const total = open + pending;
    return total > 0 ? Math.round(((total - pending) / total) * 100) : 100;
  };

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#162D50] to-[#1e4080] rounded-2xl p-6 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white opacity-5 pointer-events-none"></div>
        <div className="absolute -bottom-10 right-24 w-28 h-28 rounded-full bg-white opacity-5 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 relative z-10">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">管理者ポータル</p>
            <h2 className="text-2xl font-bold">システム概要</h2>
            <p className="text-blue-200 text-sm mt-1">全部門のリアルタイム状況を確認できます。</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {!loading && alertCount > 0 && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2">
                <Bell className="w-4 h-4 text-red-300" />
                <span className="text-red-200 text-sm font-semibold">{alertCount}件の要対応</span>
              </div>
            )}

            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end text-blue-200 text-xs mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatJapaneseDate(currentTime)}</span>
              </div>
              <p className="text-xl font-bold tracking-tight">{formatTime(currentTime)}</p>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              title="データを更新"
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-blue-300 text-xs mt-4 relative z-10">
            最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
          </p>
        )}
      </div>

      {/* ===== ALERT BANNER ===== */}
      {!loading && alertCount > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">注意が必要な項目があります</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              {(dashboardStats?.hr?.pendingVisas || 0) > 0 && (
                <span className="text-xs text-amber-700">
                  • ビザ申請 {dashboardStats.hr.pendingVisas}件 が保留中
                </span>
              )}
              {(dashboardStats?.support?.criticalIssues || 0) > 0 && (
                <span className="text-xs text-amber-700">
                  • 重大なサポート問題 {dashboardStats.support.criticalIssues}件
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== KPI STRIP ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">登録ユーザー数</span>
            <div className="w-8 h-8 rounded-lg bg-[#162D50]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#162D50]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? <span className="text-gray-200 animate-pulse">—</span> : totalUsers}
          </p>
          <p className="text-xs text-gray-400 mt-1">全ロール合計</p>
        </div>

        {/* Total Staff */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">在籍スタッフ数</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? <span className="text-gray-200 animate-pulse">—</span> : (dashboardStats?.hr?.totalStaff || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">人事部門管理</p>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">本日の収益</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 truncate leading-tight mt-1">
            {loading
              ? <span className="text-gray-200 animate-pulse">—</span>
              : formatCurrency(dashboardStats?.account?.todaysRevenue || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">経理部門計上</p>
        </div>

        {/* Pending Visas */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">ビザ申請中</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(dashboardStats?.hr?.pendingVisas || 0) > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <FileText className={`w-4 h-4 ${(dashboardStats?.hr?.pendingVisas || 0) > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${(dashboardStats?.hr?.pendingVisas || 0) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {loading ? <span className="text-gray-200 animate-pulse">—</span> : (dashboardStats?.hr?.pendingVisas || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">保留中</p>
        </div>

        {/* Open Claims */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">未解決の請求</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(dashboardStats?.support?.openClaims || 0) > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <AlertTriangle className={`w-4 h-4 ${(dashboardStats?.support?.openClaims || 0) > 0 ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${(dashboardStats?.support?.openClaims || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {loading ? <span className="text-gray-200 animate-pulse">—</span> : (dashboardStats?.support?.openClaims || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">サポート対応中</p>
        </div>
      </div>

      {/* ===== DEPARTMENT CARDS ===== */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">部門別サマリー</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* HR */}
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
            onClick={() => setActiveTab('人事部門')}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-400/50 rounded-lg">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-bold text-white text-sm">人事部門</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />全スタッフ数
                </span>
                <span className="font-bold text-gray-800">
                  {loading ? '…' : (dashboardStats?.hr?.totalStaff || 0)}
                  <span className="text-xs font-normal text-gray-400 ml-1">名</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />ビザ申請保留
                </span>
                <span className={`font-bold ${(dashboardStats?.hr?.pendingVisas || 0) > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
                  {loading ? '…' : (dashboardStats?.hr?.pendingVisas || 0)}
                  <span className="text-xs font-normal text-gray-400 ml-1">件</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5" />最近の退職者
                </span>
                <span className={`font-bold ${(dashboardStats?.hr?.recentResignations || 0) > 0 ? 'text-red-500' : 'text-gray-800'}`}>
                  {loading ? '…' : (dashboardStats?.hr?.recentResignations || 0)}
                  <span className="text-xs font-normal text-gray-400 ml-1">名</span>
                </span>
              </div>
              <div className="pt-1">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>稼働状況</span>
                  <span>{loading || !dashboardStats ? '—' : `${hrUtilization()}%`}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-700"
                    style={{ width: loading || !dashboardStats ? '0%' : `${hrUtilization()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Account */}
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
            onClick={() => setActiveTab('経理部門')}
          >
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-400/50 rounded-lg">
                    <Landmark className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-bold text-white text-sm">経理部門</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-green-200 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />保留中の案件
                </span>
                <span className="font-bold text-gray-800">
                  {loading ? '…' : (dashboardStats?.account?.openCases || 0)}
                  <span className="text-xs font-normal text-gray-400 ml-1">件</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />保留中の決済
                </span>
                <span className={`font-bold ${(dashboardStats?.account?.pendingSettlements || 0) > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
                  {loading ? '…' : (dashboardStats?.account?.pendingSettlements || 0)}
                  <span className="text-xs font-normal text-gray-400 ml-1">件</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />本日の収益
                </span>
                <span className="font-bold text-emerald-600 text-xs">
                  {loading ? '…' : formatCurrency(dashboardStats?.account?.todaysRevenue || 0)}
                </span>
              </div>
              <div className="pt-1">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>決済完了率</span>
                  <span>{loading || !dashboardStats ? '—' : `${settlementRate()}%`}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                    style={{ width: loading || !dashboardStats ? '0%' : `${settlementRate()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Support */}
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-purple-200 transition-all group"
            onClick={() => setActiveTab('サポート部門')}
          >
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-violet-400/50 rounded-lg">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-bold text-white text-sm">サポート部門</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />未解決の請求
                </span>
                <span className={`font-bold ${(dashboardStats?.support?.openClaims || 0) > 0 ? 'text-red-500' : 'text-gray-800'}`}>
                  {loading ? '…' : (dashboardStats?.support?.openClaims || 0)}
                  <span className="text-xs font-normal text-gray-400 ml-1">件</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />平均解決時間
                </span>
                <span className="font-bold text-gray-800">
                  {loading ? '…' : (dashboardStats?.support?.avgResolutionTime || '—')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />重大な問題
                </span>
                <span className={`font-bold ${(dashboardStats?.support?.criticalIssues || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {loading ? '…' : (dashboardStats?.support?.criticalIssues || 0)}
                  <span className="text-xs font-normal text-gray-400 ml-1">件</span>
                </span>
              </div>
              <div className="pt-1">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>問題解決率</span>
                  <span className={!loading && (dashboardStats?.support?.criticalIssues || 0) === 0 ? 'text-green-500' : 'text-red-400'}>
                    {!loading
                      ? ((dashboardStats?.support?.criticalIssues || 0) === 0 ? '良好' : '要対応')
                      : '—'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-700 ${(dashboardStats?.support?.criticalIssues || 0) > 0 ? 'bg-red-400' : 'bg-emerald-500'}`}
                    style={{ width: loading ? '0%' : ((dashboardStats?.support?.criticalIssues || 0) > 0 ? '40%' : '90%') }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM SECTION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Users */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-800">最新の登録ユーザー</h3>
              <p className="text-xs text-gray-400 mt-0.5">直近登録された{recentUsers.length}名のユーザー</p>
            </div>
            <button
              onClick={() => setActiveTab('Admin User List')}
              className="flex items-center gap-1 text-xs font-semibold text-[#162D50] hover:text-blue-700 transition-colors"
            >
              すべて表示 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-2.5 bg-gray-100 rounded w-1/5"></div>
                    </div>
                    <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
                  </div>
                ))
              : recentUsers.length === 0
              ? (
                  <div className="py-14 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-25" />
                    <p className="text-sm">ユーザーが見つかりません</p>
                  </div>
                )
              : recentUsers.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${getInitialsBg(u.role)}`}>
                      {getUserInitials(u.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{u.username}</p>
                      <p className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('ja-JP')}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getRoleBadge(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0 ml-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      アクティブ
                    </span>
                  </div>
                ))}
          </div>
        </div>

        {/* Right Panels */}
        <div className="space-y-4">
          {/* Admin Operations */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">管理操作</h3>
            </div>
            <div className="divide-y divide-gray-50">
              <button
                onClick={() => setActiveTab('Admin New Registration')}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-blue-50 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#162D50] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">新規ユーザー登録</p>
                  <p className="text-xs text-gray-400 mt-0.5">スタッフアカウントを新規作成</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#162D50] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>

              <button
                onClick={() => setActiveTab('Admin User List')}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-indigo-50 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                  <List className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">ユーザーアカウント管理</p>
                  <p className="text-xs text-gray-400 mt-0.5">システムログインアカウントの確認・編集</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>

              <button
                onClick={() => setActiveTab('Settings')}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 transition-colors">
                  <Settings className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">全体設定</p>
                  <p className="text-xs text-gray-400 mt-0.5">システム環境の設定・変更</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">システム健全性</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-600 font-semibold">正常稼働</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">ストレージ使用量</span>
                  <span className="text-gray-800 font-bold">45%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">DB負荷</span>
                  <span className="text-gray-800 font-bold">28%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">メモリ使用量</span>
                  <span className="text-gray-800 font-bold">60%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-amber-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
              <div className="bg-green-50 rounded-lg py-2.5 px-2">
                <p className="text-lg font-bold text-green-700">99.9%</p>
                <p className="text-xs text-green-500 mt-0.5">稼働率</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-2.5 px-2">
                <p className="text-lg font-bold text-gray-800">0</p>
                <p className="text-xs text-gray-400 mt-0.5">セキュリティ警告</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
