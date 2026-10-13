import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Clipboard, CheckCircle, Landmark, User, ArrowRight, Building, Building2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';
import { PATTERN_CONFIG, toPartyJP, toFlowTypeJP } from '../../utils/settlementPatterns.js';

export default function AccountDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await apiFetch('/api/dashboard/account');
        if (res.ok) setData(await res.json());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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

    return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">アクティブな前払金合計</h3>
            <Wallet className="text-[#162D50] w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-[#162D50] mb-2">
            {loading ? '...' : formatCurrency(summaryMetrics.totalActiveAdvances)}
          </p>
          <p className={`text-xs font-medium flex items-center ${summaryMetrics.activeAdvancesMoM >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
            <TrendingUp className="w-3 h-3 mr-1" /> 先月比 {summaryMetrics.activeAdvancesMoM >= 0 ? '+' : ''}{summaryMetrics.activeAdvancesMoM || 0}%
          </p>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">保留中の決済</h3>
            <Clipboard className="text-yellow-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-[#162D50] mb-2">
            {loading ? '...' : summaryMetrics.pendingSettlements}
          </p>
          <p className="text-xs font-medium text-gray-500">
            承認待ちの案件
          </p>
        </div>

        {/* Card 3 — clickable to show breakdown */}
        <div
          className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm cursor-pointer hover:border-green-300 hover:shadow-md transition-all"
          onClick={handleToggleBreakdown}
          title="クリックして内訳を表示"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">今期の回収額</h3>
            <div className="flex items-center gap-1">
              <CheckCircle className="text-green-500 w-5 h-5" />
              {showBreakdown ? <ChevronUp className="text-gray-400 w-4 h-4" /> : <ChevronDown className="text-gray-400 w-4 h-4" />}
            </div>
          </div>
          <p className="text-3xl font-bold text-green-500 mb-2">
            {loading ? '...' : formatCurrency(summaryMetrics.recoveredThisPeriod)}
          </p>
          <p className="text-xs font-medium text-gray-500">
            回収率 {summaryMetrics.overallRecoveryRate || 0}% &nbsp;·&nbsp; 内訳を{showBreakdown ? '閉じる' : '表示'}
          </p>
        </div>
      </div>

      {/* Recovery Breakdown Panel */}
      {showBreakdown && (
        <div className="mb-6 bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3 bg-green-50 border-b border-green-200">
            <div>
              <h3 className="font-bold text-green-800 text-sm">今期の回収一覧</h3>
              {breakdown && (
                <p className="text-xs text-green-600 mt-0.5">
                  {breakdown.month} ／ 合計: {formatCurrency(breakdown.total)} （{breakdown.rows?.length || 0}件）
                </p>
              )}
            </div>
            <button onClick={() => setShowBreakdown(false)} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {breakdownLoading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">読み込み中...</div>
          ) : !breakdown?.rows?.length ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">今月の回収データはありません。</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">案件番号</th>
                    <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">スタッフ名</th>
                    <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">経費種別</th>
                    <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">回数</th>
                    <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase text-right">回収額</th>
                    <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">支払日</th>
                    <th className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">種別</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {breakdown.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-[#162D50]">{row.caseRef || '-'}</td>
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
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          row.source === 'payment'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}>
                          {row.source === 'payment' ? '分割払い' : '決済'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-green-50 border-t-2 border-green-200">
                    <td colSpan="4" className="px-4 py-3 text-sm font-bold text-green-800">合計</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-800 text-right">
                      {formatCurrency(breakdown.total || 0)}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <p className="font-bold mb-1 text-gray-700">フロー種別の凡例:</p>
        <div className="flex gap-4">
          <span className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div> 精算（資金流出）</span>
          <span className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div> 回収（資金流入）</span>
          <span className="flex items-center"><div className="w-3 h-3 bg-gray-500 rounded-full mr-1"></div> 振替（ファンド外移動）</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#162D50] mb-6">経費精算パターン</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentOptions.map((option) => {
          const advancerLabel = option.advancerJP || toPartyJP(option.advancer);
          const bearerLabel = option.bearerJP || toPartyJP(option.bearer);
          const flowTypeLabel = option.flowTypeLabel || option.flowTypeJP || toFlowTypeJP(option.flowType);
          const SourceIcon = getEntityIcon(option.advancer);
          const TargetIcon = getEntityIcon(option.bearer);
          const flowColors = getFlowColors(option.flowType);
          
          return (
            <div key={option.id} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-4 pb-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#162D50] text-[16px]">{option.id} : {option.flowTitle}</h3>
                <span className="text-[13px] text-gray-800 font-medium">進行中: {option.active}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {option.expenseTypes.map((type, i) => (
                  <span key={i} className="bg-[#E2E8F0] text-[#4A5568] px-2 py-0.5 rounded-md text-[11px] font-bold">
                    {type}
                  </span>
                ))}
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-8 px-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white flex items-center justify-center mb-1">
                      <SourceIcon className="w-8 h-8 text-[#162D50]" aria-hidden="true" />
                    </div>
                    <span className="font-bold text-[13px] text-[#162D50]">{advancerLabel}</span>
                  </div>
                  <div className="flex-1 px-4 flex flex-col items-center relative -mt-3">
                    <div className={`w-full h-[2px] ${flowColors.bg} absolute top-1/2`}></div>
                    <ArrowRight className={`${flowColors.text} absolute top-1/2 -right-1 transform -translate-y-1/2 w-5 h-5`} aria-hidden="true" />
                    <div className="bg-white px-2 z-10 flex flex-col items-center -mt-3">
                      <span className={`text-[12px] font-bold ${flowColors.text}`}>{flowTypeLabel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white flex items-center justify-center mb-1">
                      <TargetIcon className="w-8 h-8 text-[#162D50]" aria-hidden="true" />
                    </div>
                    <span className="font-bold text-[13px] text-[#162D50]">{bearerLabel}</span>
                  </div>
                </div>
                
                <div className="mt-auto bg-[#E9EDF1] rounded-b-xl p-4 -mx-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[12px] text-gray-700 font-bold">
                      立替総額 ({advancerLabel}): <span className="text-[13px] font-bold text-red-500">{formatCurrency(option.totalAdvanced)}</span>
                    </p>
                    <p className="text-[12px] text-gray-700 font-bold">
                      回収総額 ({bearerLabel}): <span className="text-[13px] font-bold text-green-500">{formatCurrency(option.totalRecovered)}</span>
                    </p>
                  </div>
                  <div className="w-full h-[6px] flex rounded-full overflow-hidden mb-2 bg-gray-200">
                    <div className={`${flowColors.bg}`} style={{ width: `${option.progress}%` }}></div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[12px] font-bold ${option.netExposure > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      差引残額: {formatCurrency(option.netExposure)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
