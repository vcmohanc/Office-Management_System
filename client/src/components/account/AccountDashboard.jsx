import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, TrendingDown, Clipboard, CheckCircle, Landmark, User, ArrowRight, Building, Building2, X, ChevronDown, ChevronUp, Trash2, ArrowUpRight, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';
import { PATTERN_CONFIG, toPartyJP, toFlowTypeJP } from '../../utils/settlementPatterns.js';
import { toJP } from '../../utils/expenseRules.js';

export default function AccountDashboard({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/dashboard/account');
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // SSE real-time sync for live updates when cases/claims are registered or updated
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || '';
    let sse = null;
    let reconnectTimer = null;

    const connectSSE = () => {
      try {
        sse = new EventSource(`${apiUrl}/api/events?token=${token}`);
        sse.addEventListener('CASE_REGISTERED', () => fetchDashboardData());
        sse.addEventListener('CASE_UPDATED', () => fetchDashboardData());
        sse.onerror = () => {
          if (sse) sse.close();
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.error('SSE connection error:', err);
      }
    };

    connectSSE();

    // Periodic 20s background refresh to guarantee freshness
    const interval = setInterval(fetchDashboardData, 20000);

    return () => {
      if (sse) sse.close();
      clearTimeout(reconnectTimer);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const handleToggleBreakdown = async () => {
    if (showBreakdown) { setShowBreakdown(false); return; }
    setShowBreakdown(true);
    if (breakdown) return;
    setBreakdownLoading(true);
    try {
      const res = await apiFetch('/api/dashboard/account/recovery-breakdown');
      if (res.ok) setBreakdown(await res.json());
    } catch (e) {
      console.error('Error fetching breakdown:', e);
    } finally {
      setBreakdownLoading(false);
    }
  };

  const handleDeleteRow = async (row) => {
    setDeletingId(row.id);
    try {
      const res = await apiFetch(`/api/dashboard/account/recovery-breakdown/${row.source}/${row.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setBreakdown(prev => {
        const rows = prev.rows.filter(r => String(r.id) !== String(row.id));
        const total = rows.reduce((s, r) => s + r.amount, 0);
        return { ...prev, rows, total };
      });
      // Refresh the top-level KPI card so 今期の回収額 updates
      const dash = await apiFetch('/api/dashboard/account');
      if (dash.ok) setData(await dash.json());
    } catch {
      // silently fail — row stays in list
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const getEntityIcon = (name) => {
    if (!name) return Building;
    if (name.includes('VC')) return Landmark;
    if (name.includes('Staff') || name.includes('スタッフ')) return User;
    if (name.includes('Farm') || name.includes('ファーム')) return Building2;
    return Building;
  };

  const getFlowColors = (flowType) => {
    if (flowType === 'Reimburse' || flowType === '精算') return { text: 'text-blue-500', bg: 'bg-blue-500' };
    if (flowType === 'Collect' || flowType === '回収') return { text: 'text-green-500', bg: 'bg-green-500' };
    return { text: 'text-gray-500', bg: 'bg-gray-500' };
  };

  // Merge server-computed metrics with client pattern config for rendering
  const paymentOptions = PATTERN_CONFIG.map(p => {
    const m = data?.patternMetrics?.[p.id] || { totalAdvanced: 0, totalRecovered: 0, netExposure: 0, progress: 0, active: 0 };
    return { ...p, ...m };
  });

  const summaryMetrics = {
    totalActiveAdvances: data?.totalActiveAdvances || 0,
    pendingSettlements: data?.pendingSettlements || 0,
    recoveredThisPeriod: data?.recoveredThisPeriod || 0,
    overallRecoveryRate: data?.overallRecoveryRate || 0,
    activeAdvancesMoM: data?.activeAdvancesMoM || 0,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  const momPositive = summaryMetrics.activeAdvancesMoM >= 0;

  return (
    <div className="space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-r from-[#162D50] to-[#1e4080] rounded-2xl p-6 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -right-2 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-4 right-32 w-14 h-14 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-0.5">
              財務・精算管理
            </p>
            <h2 className="text-2xl font-bold text-white leading-tight">経理部門</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              前払金の精算・回収状況を一元管理します。
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Card 1 — Total Active Advances */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#162D50]/10 flex items-center justify-center">
              <Wallet className="text-[#162D50] w-4 h-4" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            アクティブな前払金合計
          </p>
          <p className="text-3xl font-bold text-[#162D50] mb-2 leading-none">
            {loading ? (
              <span className="inline-block w-32 h-8 bg-gray-100 animate-pulse rounded" />
            ) : (
              formatCurrency(summaryMetrics.totalActiveAdvances)
            )}
          </p>
          <p className={`text-xs font-medium flex items-center gap-1 ${momPositive ? 'text-blue-500' : 'text-red-500'}`}>
            {momPositive
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            先月比 {momPositive ? '+' : ''}{summaryMetrics.activeAdvancesMoM || 0}%
          </p>
        </div>

        {/* Card 2 — Pending Settlements (clickable) */}
        <div
          onClick={() => {
            sessionStorage.setItem('caseListTab', 'All');
            setActiveTab?.('Case List');
          }}
          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group"
          title="クリックして案件一覧を表示"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors flex items-center justify-center">
              <Clipboard className={`w-4 h-4 ${summaryMetrics.pendingSettlements > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            </div>
            <span className="text-xs text-amber-600 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              案件一覧へ →
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            保留中の決済
          </p>
          <p className={`text-3xl font-bold mb-2 leading-none ${summaryMetrics.pendingSettlements > 0 ? 'text-amber-500' : 'text-[#162D50]'}`}>
            {loading ? (
              <span className="inline-block w-16 h-8 bg-gray-100 animate-pulse rounded" />
            ) : (
              summaryMetrics.pendingSettlements
            )}
          </p>
          <p className="text-xs font-medium text-gray-500">承認待ちの案件 · クリックで一覧表示</p>
        </div>

        {/* Card 3 — Recovery This Period (clickable) */}
        <div
          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm cursor-pointer hover:border-green-300 hover:shadow-md transition-all"
          onClick={handleToggleBreakdown}
          title="クリックして内訳を表示"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="text-green-600 w-4 h-4" />
            </div>
            <div className="flex items-center gap-0.5 text-gray-400">
              {showBreakdown
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />
              }
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            今期の回収額
          </p>
          <p className="text-3xl font-bold text-green-600 mb-2 leading-none">
            {loading ? (
              <span className="inline-block w-32 h-8 bg-gray-100 animate-pulse rounded" />
            ) : (
              formatCurrency(summaryMetrics.recoveredThisPeriod)
            )}
          </p>
          <p className="text-xs font-medium text-gray-500">
            回収率 {summaryMetrics.overallRecoveryRate || 0}%
            &nbsp;·&nbsp;
            内訳を{showBreakdown ? '閉じる' : '表示'}
          </p>
        </div>
      </div>

      {/* ── Recovery Breakdown Panel ── */}
      {showBreakdown && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3 bg-green-50 border-b border-green-200">
            <div>
              <h3 className="font-bold text-green-800 text-sm">今期の回収一覧</h3>
              {breakdown && (
                <p className="text-xs text-green-600 mt-0.5">
                  {breakdown.month} ／ 合計: {formatCurrency(breakdown.total)} （{breakdown.rows?.length || 0}件）
                </p>
              )}
            </div>
            <button
              onClick={() => setShowBreakdown(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-green-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {breakdownLoading ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              <div className="inline-block w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin mb-2" />
              <p>読み込み中...</p>
            </div>
          ) : !breakdown?.rows?.length ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              今月の回収データはありません。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">案件番号</th>
                    <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">スタッフ名</th>
                    <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">経費種別</th>
                    <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">回数</th>
                    <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">回収額</th>
                    <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">支払日</th>
                    <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">種別</th>
                    <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {breakdown.rows.map((row) => {
                    const rowId = String(row.id);
                    const isConfirming = confirmId === rowId;
                    const isDeleting = deletingId === rowId;
                    return (
                      <tr key={rowId} className={`transition-colors ${isConfirming ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3 text-sm font-mono text-[#162D50] font-semibold">{row.caseRef || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{row.staffName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.expenseType || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">
                          {row.termNumber ? `第${row.termNumber}回` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                          {formatCurrency(row.amount || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString('ja-JP') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            row.source === 'payment'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            {row.source === 'payment' ? '分割払い' : '決済'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isConfirming ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleDeleteRow(row)}
                                disabled={isDeleting}
                                className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
                              >
                                {isDeleting ? '削除中…' : '確認'}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                disabled={isDeleting}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(rowId)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-green-50 border-t-2 border-green-200">
                    <td colSpan="4" className="px-4 py-3 text-sm font-bold text-green-800">合計</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-800 text-right">
                      {formatCurrency(breakdown.total || 0)}
                    </td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Pending Cases Section ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
            <h3 className="font-bold text-[#162D50] text-base">承認待ち案件一覧</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {data?.pendingCases?.length || summaryMetrics.pendingSettlements || 0} 件
            </span>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem('caseListTab', 'All');
              setActiveTab?.('Case List');
            }}
            className="text-xs font-bold text-[#162D50] hover:text-blue-700 flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
          >
            すべての案件一覧を見る <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-[#162D50] rounded-full animate-spin mb-2" />
            <p>読み込み中...</p>
          </div>
        ) : !data?.pendingCases || data.pendingCases.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            現在、承認待ちの案件はありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">案件ID</th>
                  <th className="px-4 py-3">区分</th>
                  <th className="px-4 py-3">スタッフ名</th>
                  <th className="px-4 py-3">経費の種類</th>
                  <th className="px-4 py-3 text-right">金額</th>
                  <th className="px-4 py-3">申請日</th>
                  <th className="px-4 py-3">ステータス</th>
                  <th className="px-4 py-3 text-right">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {data.pendingCases.map((c) => (
                  <tr key={c.id || c.displayId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#162D50] font-mono text-xs">
                      {c.displayId}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap ${
                        c.type === 'Staff Case' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        c.type === 'Host Company Case' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {c.type === 'Staff Case' ? 'スタッフ' : c.type === 'Host Company Case' ? 'ホスト会社' : 'オフィス'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {c.staffName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {toJP(c.expenseType)}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800 text-right">
                      {formatCurrency(c.amount || 0)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {c.date ? new Date(c.date).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        新た
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          sessionStorage.setItem('openCaseDetailId', String(c.id));
                          sessionStorage.setItem('openCaseIsClaim', c.isClaim ? 'true' : 'false');
                          sessionStorage.setItem('caseListTab', 'All');
                          setActiveTab?.('Case List');
                        }}
                        className="text-xs font-bold text-white bg-[#162D50] hover:bg-[#0f1f3d] px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        確認・承認 <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-3 flex-wrap items-center">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">凡例:</span>
        <span className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-600">
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
          精算（資金流出）
        </span>
        <span className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-600">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
          回収（資金流入）
        </span>
        <span className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-600">
          <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></span>
          振替（ファンド外移動）
        </span>
      </div>

      {/* ── Payment Pattern Section ── */}
      <div>
        <div className="flex items-center border-l-4 border-[#162D50] pl-3 mb-5">
          <h2 className="text-lg font-bold text-[#162D50]">経費精算パターン</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {paymentOptions.map((option) => {
            const advancerLabel = option.advancerJP || toPartyJP(option.advancer);
            const bearerLabel = option.bearerJP || toPartyJP(option.bearer);
            const flowTypeLabel = option.flowTypeLabel || option.flowTypeJP || toFlowTypeJP(option.flowType);
            const SourceIcon = getEntityIcon(option.advancer);
            const TargetIcon = getEntityIcon(option.bearer);
            const flowColors = getFlowColors(option.flowType);

            return (
              <div key={option.id} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">

                {/* Card Header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#162D50]/10 text-[#162D50] px-2 py-0.5 rounded text-xs font-bold">
                        {option.id}
                      </span>
                      <h3 className="font-bold text-[#162D50] text-sm leading-snug">{option.flowTitle}</h3>
                    </div>
                    <span className="text-xs text-gray-500 font-semibold whitespace-nowrap ml-2 mt-0.5">
                      進行中: <span className="text-[#162D50]">{option.active}</span>
                    </span>
                  </div>

                  {/* Expense type chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {option.expenseTypes.map((type, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Flow Diagram */}
                <div className="flex justify-between items-center px-8 py-5">
                  {/* Source node */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <SourceIcon className="w-6 h-6 text-[#162D50]" aria-hidden="true" />
                    </div>
                    <span className="font-bold text-[12px] text-[#162D50] text-center leading-tight max-w-[70px]">
                      {advancerLabel}
                    </span>
                  </div>

                  {/* Arrow + label */}
                  <div className="flex-1 px-3 flex flex-col items-center relative">
                    <div className={`w-full h-[2px] ${flowColors.bg} absolute top-1/2 -translate-y-1/2`}></div>
                    <ArrowRight
                      className={`${flowColors.text} absolute top-1/2 -right-1 -translate-y-1/2 w-4 h-4`}
                      aria-hidden="true"
                    />
                    <div className="relative bg-white px-2 z-10">
                      <span className={`text-[11px] font-bold ${flowColors.text}`}>{flowTypeLabel}</span>
                    </div>
                  </div>

                  {/* Target node */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <TargetIcon className="w-6 h-6 text-[#162D50]" aria-hidden="true" />
                    </div>
                    <span className="font-bold text-[12px] text-[#162D50] text-center leading-tight max-w-[70px]">
                      {bearerLabel}
                    </span>
                  </div>
                </div>

                {/* Bottom Stats Bar */}
                <div className="mt-auto bg-gray-50 rounded-b-xl p-4 border-t border-gray-100">
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">立替総額</p>
                      <p className="text-[13px] font-bold text-red-500">{formatCurrency(option.totalAdvanced)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">回収総額</p>
                      <p className="text-[13px] font-bold text-green-600">{formatCurrency(option.totalRecovered)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">差引残額</p>
                      <p className={`text-[13px] font-bold ${option.netExposure > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatCurrency(option.netExposure)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${flowColors.bg} transition-all duration-500`}
                      style={{ width: `${Math.min(100, option.progress || 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
