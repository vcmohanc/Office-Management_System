import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, TrendingUp, Clipboard, CheckCircle, Landmark, User, Tractor, ArrowRight, Briefcase, Users, Building, Building2 } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';
import { PATTERN_CONFIG, getPatternForExpense, getPatternByParties, calculateSettlementMetrics, toPartyJP, toFlowTypeJP } from '../../utils/settlementPatterns.js';

export default function AccountDashboard() {
  const [data, setData] = useState({
    totalActiveAdvances: 0,
    pendingSettlements: 0,
    recoveredThisPeriod: 0,
    fundFlowPatterns: {
      ptn1: { activeCount: 0, totalAdvanced: 0, totalRecovered: 0, netExposure: 0 },
      ptn2: { activeCount: 0, totalAdvanced: 0, totalRecovered: 0, netExposure: 0 },
      ptn3: { activeCount: 0, totalAdvanced: 0, totalRecovered: 0, netExposure: 0 },
      ptn4: { activeCount: 0, totalAdvanced: 0, totalRecovered: 0, netExposure: 0 }
    }
  });
  const [loading, setLoading] = useState(true);

  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, casesRes, claimsRes] = await Promise.all([
          apiFetch('/api/dashboard/account'),
          apiFetch('/api/cases'),
          apiFetch('/api/claims')
        ]);
        
        if (dashRes.ok) {
          setData(await dashRes.json());
        }
        
        let casesData = [];
        let claimsData = [];
        if (casesRes.ok) casesData = await casesRes.json();
        if (claimsRes.ok) claimsData = await claimsRes.json();
        
        const mappedCases = casesData.map(c => ({
          ...c,
          advancerCategory: c.advancerCategory || 'Office',
          finalTotal: c.finalTotal || c.totalExpense || c.final_total_amount || 0,
          expenseType: c.expenseType || c.expense_type || 'Other',
          workPlace: c.workPlace || 'N/A'
        }));

        const mappedClaims = claimsData.map(c => ({
          ...c,
          isClaim: true,
          advancerCategory: c.advancer_category || c.advancerCategory || 'Staff',
          finalTotal: c.totalExpense金額 || c.total_expense_amount || 0,
          expenseType: c.expenseType || c.expense_type || 'Claim',
          workPlace: c.workPlace || 'N/A'
        }));

        setCases([...mappedCases, ...mappedClaims]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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
    return { text: 'text-gray-500', bg: 'bg-gray-500' }; // Transfer / 振替
  };

  const paymentOptions = useMemo(() => {
    // Group records by pattern
    const patternGroups = {};
    PATTERN_CONFIG.forEach(p => {
      patternGroups[p.id] = { ...p, records: [] };
    });

    const activeCases = cases.filter(c => {
      if (!c || c.isDeleted) return false;
      if (['Pending', 'New', 'Registered', '新た', 'REJECTED', '拒否', 'RETURNED_FOR_CORRECTION', '保留中 Correction', 'Payment 保留中', '保留中'].includes(c.status)) return false;
      return true;
    });

    activeCases.forEach(c => {
      const expType = c.expenseType || 'Other';
      
      let pattern = getPatternForExpense(expType);
      
      if (pattern.id === 'PTN-4' && expType !== 'Other' && expType !== '出張費' && expType !== 'その他') {
        const partyPattern = getPatternByParties(c.advancerCategory, c.bearing_party || c.bearer);
        if (partyPattern) {
          pattern = partyPattern;
        }
      }

      if (pattern && patternGroups[pattern.id]) {
        patternGroups[pattern.id].records.push(c);
      }
    });

    return PATTERN_CONFIG.map(p => {
      const group = patternGroups[p.id];
      const metrics = calculateSettlementMetrics(group.records);
      return {
        ...p,
        ...metrics
      };
    });
  }, [cases]);

  const summaryMetrics = useMemo(() => {
    let totalAdvanced = 0;
    let totalRecovered = 0;
    let totalNetExposure = 0;
    let activeCount = 0;

    paymentOptions.forEach(p => {
      totalAdvanced += p.totalAdvanced || 0;
      totalRecovered += p.totalRecovered || 0;
      totalNetExposure += p.netExposure || 0;
      activeCount += p.active || 0;
    });

    const pendingApprovals = cases.filter(c => {
      if (!c || c.isDeleted) return false;
      return ['Pending', 'New', 'Registered', '新た', '保留中', 'Payment 保留中', 'APPROVED_FOR_PAYMENT'].includes(c.status);
    }).length;

    const overallRate = totalAdvanced > 0 
      ? Math.round((totalRecovered / totalAdvanced) * 100) 
      : (data.overallRecoveryRate || 0);

    return {
      totalActiveAdvances: totalNetExposure > 0 ? totalNetExposure : (data.totalActiveAdvances || totalAdvanced || 0),
      pendingSettlements: activeCount > 0 ? activeCount : (pendingApprovals || data.pendingSettlements || 0),
      recoveredThisPeriod: data.recoveredThisPeriod || totalRecovered || 0,
      overallRecoveryRate: overallRate || data.overallRecoveryRate || 0,
      activeAdvancesMoM: data.activeAdvancesMoM || 0
    };
  }, [paymentOptions, cases, data]);

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

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">今期の回収額</h3>
            <CheckCircle className="text-green-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-green-500 mb-2">
            {loading ? '...' : formatCurrency(summaryMetrics.recoveredThisPeriod)}
          </p>
          <p className="text-xs font-medium text-gray-500">
            回収率 {summaryMetrics.overallRecoveryRate || 0}%
          </p>
        </div>
      </div>

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
