import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Clipboard, CheckCircle, Landmark, User, Tractor, ArrowRight } from 'lucide-react';
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiFetch('/api/dashboard/account');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching account dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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
          <p className="text-xs font-medium text-blue-500 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> 先月比 +12%
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
            回収率 98%
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#162D50] mb-6">資金の流れ</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pattern 1 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="bg-[#F8F9FA] border-b border-gray-100 p-3 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center space-x-3">
              <span className="bg-[#E2E8F0] text-[#4A5568] px-2 py-0.5 rounded text-xs font-bold">PTN-1</span>
              <span className="font-bold text-[#162D50] text-sm">VCfund → Staff Advance</span>
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">Active: {data.fundFlowPatterns.ptn1.activeCount}</span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-10 px-8 mt-4">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#F2F4F7] rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <Landmark className="w-7 h-7 text-[#162D50]" />
                </div>
                <span className="font-bold text-sm text-[#162D50]">VCファンド</span>
              </div>
              <div className="flex-1 px-4 flex flex-col items-center relative">
                <div className="w-full h-px bg-blue-400 absolute top-1/2"></div>
                <ArrowRight className="text-blue-400 absolute top-1/2 right-4 transform -translate-y-1/2 w-4 h-4" />
                <div className="bg-white px-2 z-10 flex flex-col items-center">
                  <span className="text-xs font-bold text-blue-500">前払い</span>
                  <span className="text-xs text-red-500">(流出)</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#F2F4F7] rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <User className="w-7 h-7 text-[#162D50]" />
                </div>
                <span className="font-bold text-sm text-[#162D50]">スタッフ</span>
              </div>
            </div>
            <div className="mt-auto bg-[#F8F9FA] rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">前払金合計</p>
                  <p className="text-lg font-bold text-red-500">{formatCurrency(data.fundFlowPatterns.ptn1.totalAdvanced)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">回収金合計</p>
                  <p className="text-lg font-bold text-green-500">{formatCurrency(data.fundFlowPatterns.ptn1.totalRecovered)}</p>
                </div>
              </div>
              <div className="w-full h-2 flex rounded-full overflow-hidden mb-3">
                <div className="bg-green-500" style={{ width: getWidths(data.fundFlowPatterns.ptn1.totalAdvanced, data.fundFlowPatterns.ptn1.totalRecovered).recoveredWidth }}></div>
                <div className="bg-red-500" style={{ width: getWidths(data.fundFlowPatterns.ptn1.totalAdvanced, data.fundFlowPatterns.ptn1.totalRecovered).advancedWidth }}></div>
              </div>
              <div className="text-right border-t border-gray-200 pt-2">
                <p className="text-xs font-bold text-gray-800">正味エクスポージャー: {formatCurrency(data.fundFlowPatterns.ptn1.netExposure)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern 2 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="bg-[#F8F9FA] border-b border-gray-100 p-3 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center space-x-3">
              <span className="bg-[#E2E8F0] text-[#4A5568] px-2 py-0.5 rounded text-xs font-bold">PTN-2</span>
              <span className="font-bold text-[#162D50] text-sm">VCfund → 農家 前払い</span>
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">Active: {data.fundFlowPatterns.ptn2.activeCount}</span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-10 px-8 mt-4">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#F2F4F7] rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <Landmark className="w-7 h-7 text-[#162D50]" />
                </div>
                <span className="font-bold text-sm text-[#162D50]">VCファンド</span>
              </div>
              <div className="flex-1 px-4 flex flex-col items-center relative">
                <div className="w-full h-px bg-blue-400 absolute top-1/2"></div>
                <ArrowRight className="text-blue-400 absolute top-1/2 right-4 transform -translate-y-1/2 w-4 h-4" />
                <div className="bg-white px-2 z-10 flex flex-col items-center">
                  <span className="text-xs font-bold text-blue-500">前払い</span>
                  <span className="text-xs text-red-500">(流出)</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#F2F4F7] rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <Tractor className="w-7 h-7 text-[#162D50]" />
                </div>
                <span className="font-bold text-sm text-[#162D50]">農家</span>
              </div>
            </div>
            <div className="mt-auto bg-[#F8F9FA] rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">前払金合計</p>
                  <p className="text-lg font-bold text-red-500">{formatCurrency(data.fundFlowPatterns.ptn2.totalAdvanced)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">回収金合計</p>
                  <p className="text-lg font-bold text-green-500">{formatCurrency(data.fundFlowPatterns.ptn2.totalRecovered)}</p>
                </div>
              </div>
              <div className="w-full h-2 flex rounded-full overflow-hidden mb-3">
                <div className="bg-green-500" style={{ width: getWidths(data.fundFlowPatterns.ptn2.totalAdvanced, data.fundFlowPatterns.ptn2.totalRecovered).recoveredWidth }}></div>
                <div className="bg-red-500" style={{ width: getWidths(data.fundFlowPatterns.ptn2.totalAdvanced, data.fundFlowPatterns.ptn2.totalRecovered).advancedWidth }}></div>
              </div>
              <div className="text-right border-t border-gray-200 pt-2">
                <p className="text-xs font-bold text-gray-800">正味エクスポージャー: {formatCurrency(data.fundFlowPatterns.ptn2.netExposure)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern 3 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="bg-[#F8F9FA] border-b border-gray-100 p-3 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center space-x-3">
              <span className="bg-[#E2E8F0] text-[#4A5568] px-2 py-0.5 rounded text-xs font-bold">PTN-3</span>
              <span className="font-bold text-[#162D50] text-sm">農家 → VCfund 回収</span>
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">Active: {data.fundFlowPatterns.ptn3.activeCount}</span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-10 px-8 mt-4">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#F2F4F7] rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <Tractor className="w-7 h-7 text-[#162D50]" />
                </div>
                <span className="font-bold text-sm text-[#162D50]">農家</span>
              </div>
              <div className="flex-1 px-4 flex flex-col items-center relative">
                <div className="w-full h-px bg-green-400 absolute top-1/2"></div>
                <ArrowRight className="text-green-400 absolute top-1/2 right-4 transform -translate-y-1/2 w-4 h-4" />
                <div className="bg-white px-2 z-10 flex flex-col items-center">
                  <span className="text-xs font-bold text-green-500">回収</span>
                  <span className="text-xs text-green-500">(流入)</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#F2F4F7] rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <Landmark className="w-7 h-7 text-[#162D50]" />
                </div>
                <span className="font-bold text-sm text-[#162D50]">VCファンド</span>
              </div>
            </div>
            <div className="mt-auto bg-[#F8F9FA] rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">回収金合計</p>
                  <p className="text-lg font-bold text-green-500">{formatCurrency(data.fundFlowPatterns.ptn3.totalRecovered)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">前払金合計</p>
                  <p className="text-lg font-bold text-red-500">{formatCurrency(data.fundFlowPatterns.ptn3.totalAdvanced)}</p>
                </div>
              </div>
              <div className="w-full h-2 flex rounded-full overflow-hidden mb-3">
                <div className="bg-green-500" style={{ width: getWidths(data.fundFlowPatterns.ptn3.totalAdvanced, data.fundFlowPatterns.ptn3.totalRecovered).recoveredWidth }}></div>
                <div className="bg-red-500" style={{ width: getWidths(data.fundFlowPatterns.ptn3.totalAdvanced, data.fundFlowPatterns.ptn3.totalRecovered).advancedWidth }}></div>
              </div>
              <div className="text-right border-t border-gray-200 pt-2">
                <p className="text-xs font-bold text-gray-800">正味エクスポージャー: {formatCurrency(data.fundFlowPatterns.ptn3.netExposure)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern 4 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="bg-[#F8F9FA] border-b border-gray-100 p-3 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center space-x-3">
              <span className="bg-[#E2E8F0] text-[#4A5568] px-2 py-0.5 rounded text-xs font-bold">PTN-4</span>
              <span className="font-bold text-[#162D50] text-sm">スタッフ → VCfund 回収</span>
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">Active: {data.fundFlowPatterns.ptn4.activeCount}</span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-10 px-8 mt-4">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#F2F4F7] rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <User className="w-7 h-7 text-[#162D50]" />
                </div>
                <span className="font-bold text-sm text-[#162D50]">スタッフ</span>
              </div>
              <div className="flex-1 px-4 flex flex-col items-center relative">
                <div className="w-full h-px bg-green-400 absolute top-1/2"></div>
                <ArrowRight className="text-green-400 absolute top-1/2 right-4 transform -translate-y-1/2 w-4 h-4" />
                <div className="bg-white px-2 z-10 flex flex-col items-center">
                  <span className="text-xs font-bold text-green-500">回収</span>
                  <span className="text-xs text-green-500">(流入)</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#F2F4F7] rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <Landmark className="w-7 h-7 text-[#162D50]" />
                </div>
                <span className="font-bold text-sm text-[#162D50]">VCファンド</span>
              </div>
            </div>
            <div className="mt-auto bg-[#F8F9FA] rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">回収金合計</p>
                  <p className="text-lg font-bold text-green-500">{formatCurrency(data.fundFlowPatterns.ptn4.totalRecovered)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">前払金合計</p>
                  <p className="text-lg font-bold text-red-500">{formatCurrency(data.fundFlowPatterns.ptn4.totalAdvanced)}</p>
                </div>
              </div>
              <div className="w-full h-2 flex rounded-full overflow-hidden mb-3">
                <div className="bg-green-500" style={{ width: getWidths(data.fundFlowPatterns.ptn4.totalAdvanced, data.fundFlowPatterns.ptn4.totalRecovered).recoveredWidth }}></div>
                <div className="bg-red-500" style={{ width: getWidths(data.fundFlowPatterns.ptn4.totalAdvanced, data.fundFlowPatterns.ptn4.totalRecovered).advancedWidth }}></div>
              </div>
              <div className="text-right border-t border-gray-200 pt-2">
                <p className="text-xs font-bold text-gray-800">正味エクスポージャー: {formatCurrency(data.fundFlowPatterns.ptn4.netExposure)}</p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
}
