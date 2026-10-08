import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, TrendingUp, Clipboard, CheckCircle, Landmark, User, Tractor, ArrowRight, Briefcase, Users, Building, Building2 } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';

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
          workPlace: c.workPlace || 'N/A'
        }));

        const mappedClaims = claimsData.map(c => ({
          ...c,
          advancerCategory: c.advancer_category || c.advancerCategory || 'Staff',
          finalTotal: c.totalExpense金額 || c.total_expense_amount || 0,
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

  const getEntityDetails = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('farm') || n.includes('農家')) {
      return { name: '農家', icon: Tractor, colorName: 'green', arrowColor: 'text-blue-500', lineColor: 'bg-blue-500' };
    }
    if (n.includes('support') || n.includes('サポート')) {
      return { name: 'サポートスタッフ', icon: User, colorName: 'green', arrowColor: 'text-blue-500', lineColor: 'bg-blue-500' };
    }
    if (n.includes('staff') || n.includes('サービス') || n.includes('スタッフ')) {
      return { name: 'サービススタッフ', icon: User, colorName: 'green', arrowColor: 'text-blue-500', lineColor: 'bg-blue-500' };
    }
    if (n.includes('vc') || n.includes('fund') || n.includes('ファンド')) {
      return { name: 'VCファンド', icon: Landmark, colorName: 'purple', arrowColor: 'text-purple-400', lineColor: 'bg-purple-400' };
    }
    if (n.includes('client') || n.includes('クライアント')) {
      return { name, icon: Users, colorName: 'blue', arrowColor: 'text-green-400', lineColor: 'bg-green-400' };
    }
    if (n.includes('vendor') || n.includes('host') || n.includes('ベンダー') || n.includes('企業')) {
      return { name, icon: Building, colorName: 'orange', arrowColor: 'text-orange-400', lineColor: 'bg-orange-400' };
    }
    return { name, icon: Building2, colorName: 'gray', arrowColor: 'text-gray-400', lineColor: 'bg-gray-400' };
  };

  const paymentOptions = useMemo(() => {
    const dynamicGroups = {
      'VCファンド-サービススタッフ': {
        id: 'VCファンド-サービススタッフ',
        flowTitle: 'VCfund → サービススタッフ',
        sourceName: 'VCファンド',
        sourceIcon: Landmark,
        targetName: 'サービススタッフ',
        targetIcon: User,
        arrowText: '前払い',
        arrowSubText: '(流出)',
        arrowColor: 'text-blue-500',
        lineColor: 'bg-blue-500',
        textLabel1: '前払金合計',
        textLabel2: '回収金合計',
        netLabel: '正味エクスポージャー',
        amountColor1: 'text-red-500',
        amountColor2: 'text-green-500',
        barColor1: 'bg-green-500',
        barColor2: 'bg-red-500',
        relatedCases: [],
        expenseTypes: new Set(['ビザ申請料', '宿泊費', '語学講習費'])
      },
      'サービススタッフ-VCファンド': {
        id: 'サービススタッフ-VCファンド',
        flowTitle: 'サービススタッフ → VCfund 回収',
        sourceName: 'サービススタッフ',
        sourceIcon: User,
        targetName: 'VCファンド',
        targetIcon: Landmark,
        arrowText: '回収',
        arrowSubText: '(流入)',
        arrowColor: 'text-green-500',
        lineColor: 'bg-green-500',
        textLabel1: '前払金合計',
        textLabel2: '回収金合計',
        netLabel: '正味エクスポージャー',
        amountColor1: 'text-green-500',
        amountColor2: 'text-red-500',
        barColor1: 'bg-red-500',
        barColor2: 'bg-green-500',
        relatedCases: [],
        expenseTypes: new Set(['郵便料金', '交通費 / 航空運賃', '待機寮費'])
      },
      '農家-VCファンド': {
        id: '農家-VCファンド',
        flowTitle: '農家 → VCfund 回収',
        sourceName: '農家',
        sourceIcon: Tractor,
        targetName: 'VCファンド',
        targetIcon: Landmark,
        arrowText: '回収',
        arrowSubText: '(流入)',
        arrowColor: 'text-green-500',
        lineColor: 'bg-green-500',
        textLabel1: '前払金合計',
        textLabel2: '回収金合計',
        netLabel: '正味エクスポージャー',
        amountColor1: 'text-green-500',
        amountColor2: 'text-red-500',
        barColor1: 'bg-red-500',
        barColor2: 'bg-green-500',
        relatedCases: [],
        expenseTypes: new Set(['返金', '過払い回収'])
      },
      'VCファンド-サポートスタッフ': {
        id: 'VCファンド-サポートスタッフ',
        flowTitle: 'VCfund → サポートスタッフ',
        sourceName: 'VCファンド',
        sourceIcon: Landmark,
        targetName: 'サポートスタッフ',
        targetIcon: User,
        arrowText: '前払い',
        arrowSubText: '(流出)',
        arrowColor: 'text-blue-500',
        lineColor: 'bg-blue-500',
        textLabel1: '前払金合計',
        textLabel2: '回収金合計',
        netLabel: '正味エクスポージャー',
        amountColor1: 'text-red-500',
        amountColor2: 'text-green-500',
        barColor1: 'bg-green-500',
        barColor2: 'bg-red-500',
        relatedCases: [],
        expenseTypes: new Set(['機材費', '出張費'])
      }
    };
    cases.forEach(c => {
      let advancer = c.advancerCategory || 'Office';
      let bearing = c.bearingParty || c.bearing_party || 'Office';

      if (advancer === 'Staff' || advancer === 'スタッフ') advancer = (c.workPlace && c.workPlace !== 'N/A') ? c.workPlace : 'スタッフ';
      if (bearing === 'Staff' || bearing === '自己負担' || bearing === 'Employee' || bearing === 'スタッフ') bearing = (c.workPlace && c.workPlace !== 'N/A') ? c.workPlace : 'スタッフ';

      let source = bearing;
      let target = advancer;

      if (source === target) {
        if (source === 'Office' || source === 'VC' || source === 'VC Fund') {
          target = 'ベンダー';
        }
      }
      
      const formatName = (n) => {
        if (!n) return 'VCファンド';
        if (n.toLowerCase().includes('farm') || n.includes('農家')) return '農家';
        if (n.toLowerCase().includes('support') || n.includes('サポート')) return 'サポートスタッフ';
        if (n.toLowerCase().includes('staff') || n.includes('サービス') || n.includes('スタッフ')) return 'サービススタッフ';
        if (n.toLowerCase().includes('client')) return 'クライアント';
        if (n.toLowerCase().includes('vendor')) return 'ベンダー';
        if (n === 'VC' || n.toLowerCase().includes('vc') || n.includes('ファンド')) return 'VCファンド';
        return n;
      };

      source = formatName(source);
      target = formatName(target);

      const sourceDetails = getEntityDetails(source);
      const targetDetails = getEntityDetails(target);
      
      const key = `${sourceDetails.name}-${targetDetails.name}`;
      
      if (!dynamicGroups[key]) {
        const isIncoming = targetDetails.name === 'Office' || targetDetails.name === 'VCファンド';
        dynamicGroups[key] = {
          id: key,
          flowTitle: `${sourceDetails.name} → ${targetDetails.name}`,
          sourceName: sourceDetails.name,
          sourceIcon: sourceDetails.icon,
          targetName: targetDetails.name,
          targetIcon: targetDetails.icon,
          arrowText: isIncoming ? '入金' : '支払',
          arrowSubText: isIncoming ? '(流入)' : '(流出)',
          arrowColor: targetDetails.arrowColor,
          lineColor: targetDetails.lineColor,
          textLabel1: isIncoming ? '入金予定合計' : '支払予定合計',
          textLabel2: isIncoming ? '回収済合計' : '支払済合計',
          netLabel: isIncoming ? '未回収残高' : '未払残高',
          amountColor1: 'text-red-500',
          amountColor2: 'text-green-500',
          barColor1: 'bg-green-500',
          barColor2: 'bg-red-500',
          relatedCases: [],
          expenseTypes: new Set()
        };
      }
      dynamicGroups[key].relatedCases.push(c);
      dynamicGroups[key].expenseTypes.add(c.expenseType || 'その他');
    });
    
    const order = [
      'VCファンド-サービススタッフ',
      'サービススタッフ-VCファンド',
      '農家-VCファンド',
      'VCファンド-サポートスタッフ'
    ];
    
    return Object.values(dynamicGroups).map(g => ({
      ...g,
      expenseTypes: Array.from(g.expenseTypes)
    })).sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return b.relatedCases.length - a.relatedCases.length;
    });
  }, [cases]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  const getWidths = (advanced, recovered) => {
    const total = advanced + recovered;
    if (total === 0) return { advancedWidth: '50%', recoveredWidth: '50%' };
    return {
      advancedWidth: `${(advanced / total) * 100}%`,
      recoveredWidth: `${(recovered / total) * 100}%`
    };
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
            {loading ? '...' : formatCurrency(data.totalActiveAdvances)}
          </p>
          <p className={`text-xs font-medium flex items-center ${data.activeAdvancesMoM >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
            <TrendingUp className="w-3 h-3 mr-1" /> 先月比 {data.activeAdvancesMoM >= 0 ? '+' : ''}{data.activeAdvancesMoM || 0}%
          </p>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">保留中の決済</h3>
            <Clipboard className="text-yellow-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-[#162D50] mb-2">
            {loading ? '...' : data.pendingSettlements}
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
            {loading ? '...' : formatCurrency(data.recoveredThisPeriod)}
          </p>
          <p className="text-xs font-medium text-gray-500">
            回収率 {data.overallRecoveryRate || 0}%
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#162D50] mb-6">資金の流れ</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paymentOptions.map((option, index) => {
          const relatedCases = option.relatedCases || [];
          const relatedCount = relatedCases.length;
          
          let totalAmount = 0;
          let paidAmount = 0;
          
          relatedCases.forEach(c => {
            const totalTerms = c.installment_count || (c.installmentPlan ? (c.installmentPlan.match(/\d+/) ? parseInt(c.installmentPlan.match(/\d+/)[0], 10) : 1) : 1);
            const paidTerms = c.paidTerms || 0;
            const amt = c.finalTotal || c.totalExpense || 0;
            const nextPayment = c.nextPayment金額 || amt / totalTerms;
            const remaining = Math.max(0, amt - (paidTerms * nextPayment));
            totalAmount += amt;
            paidAmount += (amt - remaining);
          });
          
          const netExposure = Math.max(0, totalAmount - paidAmount);

          return (
            <div key={option.id} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-4 pb-0">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[#162D50] text-[16px]">PTN-{index + 1}: {option.flowTitle}</span>
                <span className="text-[13px] text-gray-800">(Active: {relatedCount})</span>
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
                      <option.sourceIcon className="w-8 h-8 text-[#162D50]" />
                    </div>
                    <span className="font-bold text-[13px] text-[#162D50]">{option.sourceName}</span>
                  </div>
                  <div className="flex-1 px-4 flex flex-col items-center relative -mt-3">
                    <div className={`w-full h-[2px] ${option.lineColor} absolute top-1/2`}></div>
                    <ArrowRight className={`${option.arrowColor} absolute top-1/2 -right-1 transform -translate-y-1/2 w-5 h-5`} />
                    <div className="bg-white px-2 z-10 flex flex-col items-center -mt-3">
                      <span className={`text-[12px] font-bold ${option.arrowColor}`}>{option.arrowText}</span>
                      <span className={`text-[12px] ${option.arrowColor}`}>{option.arrowSubText}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white flex items-center justify-center mb-1">
                      <option.targetIcon className="w-8 h-8 text-[#162D50]" />
                    </div>
                    <span className="font-bold text-[13px] text-[#162D50]">{option.targetName}</span>
                  </div>
                </div>
                
                <div className="mt-auto bg-[#E9EDF1] rounded-b-xl p-4 -mx-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[12px] text-gray-700 font-bold">{option.textLabel1.replace('予定', '').replace('合計', '金合計')} <span className={`text-[13px] font-bold ${option.amountColor1}`}>{formatCurrency(totalAmount)}</span></p>
                    <p className="text-[12px] text-gray-700 font-bold">{option.textLabel2.replace('済', '').replace('合計', '金合計')} <span className={`text-[13px] font-bold ${option.amountColor2}`}>{formatCurrency(paidAmount)}</span></p>
                  </div>
                  <div className="w-full h-[6px] flex rounded-full overflow-hidden mb-2 bg-gray-200">
                    <div className={`${option.barColor2}`} style={{ width: getWidths(totalAmount - paidAmount, paidAmount).recoveredWidth }}></div>
                    <div className={`${option.barColor1}`} style={{ width: getWidths(totalAmount - paidAmount, paidAmount).advancedWidth }}></div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-gray-800">正味エクスポージャー: {formatCurrency(netExposure)}</p>
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
