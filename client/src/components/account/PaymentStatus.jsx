import { useState, useEffect } from 'react';
import { Search, ChevronDown, Calendar, Download, Landmark, AlertCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { ROLES, PERMISSIONS, can } from '../../constants/roles';
import {
  MOCK_CASES,
  PROCESS_STATUS_COLORS,
  getRemaining,
  isAwaitingHostBilling,
  hasMissingAttachment,
} from '../../constants/cases';
import { exportCaseListCsv, exportPayrollCsv, exportHostBillingCsv } from '../../utils/csv';
import { fetchCases, downloadExport, updateProcess, updateBilling } from '../../api/client';
import { ProcessDialog, BillingDialog } from './CaseDialogs';
import { useExpenseTypes } from '../../hooks/useMasters';

const yen = (n) => `¥${Number(n || 0).toLocaleString()}`;

// §1-9 給与天引き管理の行データを案件から組み立てる
const buildPayrollRows = (cases) =>
  cases
    .filter((c) => c.recovery?.method === '給与天引き')
    .map((c) => ({
      source: c,
      caseId: c.id,
      staff: c.target,
      type: c.type,
      splitLabel: c.installments.length > 0 ? `分割（${c.installments.length}回）` : '一括',
      done: c.installments.length > 0 ? c.installments.filter((i) => i.status === '完了').length : (c.recovery.status === '完了' ? 1 : 0),
      total: c.installments.length > 0 ? c.installments.length : 1,
      targetMonth: c.recovery.targetMonth,
      planned: c.recovery.plannedAmount,
      processed: c.recovery.processedAmount,
      remaining: getRemaining(c.recovery),
      processedOn: c.recovery.processedOn,
      status: c.recovery.status,
      note: c.recovery.note || c.installmentNote,
    }));

export default function PaymentStatus() {
  const user = JSON.parse(localStorage.getItem('user')) || { role: ROLES.ACCOUNTING };
  const [activeSection, setActiveSection] = useState('payroll');
  const [payrollTab, setPayrollTab] = useState('未処理');
  const [payrollKeyword, setPayrollKeyword] = useState('');
  const [payrollType, setPayrollType] = useState('');
  const [billingKeyword, setBillingKeyword] = useState('');
  const [billingMonth, setBillingMonth] = useState('');

  const { types: expenseTypes } = useExpenseTypes();
  const [cases, setCases] = useState([]);
  const [offline, setOffline] = useState(false);
  const [exportError, setExportError] = useState('');
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [editingBilling, setEditingBilling] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchCases()
      .then((result) => { setCases(result); setOffline(false); })
      // APIに接続できないときはサンプルデータで画面を確認できるようにする
      .catch(() => { setCases(MOCK_CASES); setOffline(true); });
  }, []);

  const payrollRows = buildPayrollRows(cases);

  // §1-7 集計（ヘッダーの指標カード）
  const transferPending = cases.filter((c) => c.settlement?.method === '本人へ振込' && c.settlement.status !== '完了');
  const transferAmount = transferPending.reduce((sum, c) => sum + getRemaining(c.settlement), 0);
  const payrollPending = payrollRows.filter((r) => r.status !== '完了');
  const payrollAmount = payrollPending.reduce((sum, r) => sum + r.remaining, 0);
  const billingPending = cases.filter(isAwaitingHostBilling);
  const missingAttachment = cases.filter(hasMissingAttachment);

  const visiblePayroll = payrollRows.filter((row) => {
    if (payrollTab !== 'すべて' && row.status !== payrollTab) return false;
    if (payrollKeyword && !`${row.staff} ${row.caseId}`.includes(payrollKeyword)) return false;
    if (payrollType && row.type !== payrollType) return false;
    return true;
  });

  const billingRows = cases.filter((c) => !!c.billing).map((c) => ({ caseId: c.id, source: c, ...c.billing }));
  const billingMonths = [...new Set(billingRows.map((r) => r.month))];
  const visibleBilling = billingRows.filter((row) => {
    if (billingKeyword && !row.host.includes(billingKeyword)) return false;
    if (billingMonth && row.month !== billingMonth) return false;
    return true;
  });

  const canExport = can(user.role, PERMISSIONS.EXPORT_CSV);

  const canUpdateProcess = can(user.role, PERMISSIONS.UPDATE_PROCESS);

  const replaceCase = (updated) =>
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  // §1-9 給与天引きの処理状態を更新する
  const handlePayrollSubmit = async (payload) => {
    setActionError('');
    try {
      replaceCase(await updateProcess(editingPayroll.caseId, 'recovery', payload));
      setEditingPayroll(null);
    } catch (err) {
      setActionError(err.message);
      setEditingPayroll(null);
    }
  };

  // §1-12 派遣先請求・控除の処理状態を更新する
  const handleBillingSubmit = async (payload) => {
    setActionError('');
    try {
      replaceCase(await updateBilling(editingBilling.caseId, payload));
      setEditingBilling(null);
    } catch (err) {
      setActionError(err.message);
      setEditingBilling(null);
    }
  };

  // §1-19 CSV出力はサーバーで生成する。接続できない場合は表示中のデータから出力する。
  const runExport = async (kind, filename, fallback) => {
    setExportError('');
    if (offline) {
      fallback(cases);
      return;
    }
    try {
      await downloadExport(kind, filename);
    } catch (err) {
      setExportError(err.message);
    }
  };

  const csvItems = [
    {
      title: '立替案件一覧',
      desc: '登録されているすべての立替案件の一覧をCSVで出力します。',
      run: () => runExport('cases', '立替案件一覧.csv', exportCaseListCsv),
    },
    {
      title: '給与天引き用',
      desc: '給与システムへ取り込むための天引き対象データを出力します。',
      run: () => runExport('payroll', '給与天引き.csv', exportPayrollCsv),
    },
    {
      title: '派遣先請求・控除用',
      desc: '派遣先・農家への請求および控除データを出力します。',
      run: () => runExport('host-billing', '派遣先請求・控除.csv', exportHostBillingCsv),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-1">精算・回収処理</h2>
          <p className="text-gray-500 text-sm">給与天引き・派遣先請求控除の処理状況を確認し、必要に応じてCSVを出力します。</p>
          {offline && (
            <p className="text-xs text-yellow-700 mt-2">サーバーに接続できないため、サンプルデータを表示しています。</p>
          )}
          {actionError && (
            <p className="text-xs text-red-600 mt-2">{actionError}</p>
          )}
        </div>
        <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white text-sm text-gray-700">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <span>2024年5月 対象月</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">立替者への振込予定額</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">{yen(transferAmount)}</p>
              <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
                精算準備完了 {transferPending.length}件
              </div>
            </div>
            <Landmark className="w-10 h-10 text-gray-100" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">給与天引き対象額</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">{yen(payrollAmount)}</p>
              <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
                回収準備完了 {payrollPending.length}件
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-yellow-400 p-5 rounded-md shadow-sm border-l-4 border-l-yellow-400">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">派遣先請求控除待ち</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">{billingPending.length}件</p>
              <div className="flex items-center mt-2 text-xs text-yellow-600 font-medium">
                出力前に確認が
                <br />必要です
              </div>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-100" />
          </div>
        </div>

        <div className="bg-white border border-red-400 p-5 rounded-md shadow-sm border-l-4 border-l-red-500">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">添付不足のため処理不可</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-red-600">{missingAttachment.length}件</p>
              <div className="flex items-center mt-2 text-xs text-red-500 font-medium">
                至急、添付書類の
                <br />確認が必要です
              </div>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-100" />
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-[#F2F4F7] p-1 rounded-md flex space-x-1 mb-4 border border-gray-200 max-w-xl">
        {[
          { key: 'payroll', label: '給与天引き管理' },
          { key: 'billing', label: '派遣先請求・控除管理' },
          { key: 'csv', label: 'CSV出力' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
              activeSection === tab.key ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* §1-9 給与天引き管理 */}
      {activeSection === 'payroll' && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {['未処理', '処理中', '完了'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPayrollTab(tab)}
                  className={`flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${payrollTab === tab ? 'bg-[#162D50] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {tab}
                  <span className={`ml-2 px-2 rounded-full text-xs ${payrollTab === tab ? 'bg-blue-900/20 opacity-80' : 'bg-gray-200 text-gray-600'}`}>
                    {payrollRows.filter((r) => r.status === tab).length}
                  </span>
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500">全 {payrollRows.length} 件</div>
          </div>

          {/* Filters */}
          <div className="p-3 bg-[#F8F9FA] border-b border-gray-200 flex space-x-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={payrollKeyword}
                onChange={(e) => setPayrollKeyword(e.target.value)}
                placeholder="ケースID・スタッフ名で検索"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-300"
              />
            </div>
            <div className="relative w-48">
              <select
                value={payrollType}
                onChange={(e) => setPayrollType(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm appearance-none focus:outline-none focus:border-gray-300 text-gray-600"
              >
                <option value="">種別で絞り込み</option>
                {expenseTypes.map((t) => <option key={t.key} value={t.label}>{t.label}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500">
                <th className="py-3 px-4">対象スタッフ</th>
                <th className="py-3 px-4">一括・分割</th>
                <th className="py-3 px-4 w-32">天引き進捗</th>
                <th className="py-3 px-4">対象給与月</th>
                <th className="py-3 px-4 text-right">天引き予定額</th>
                <th className="py-3 px-4 text-right">天引き済み額</th>
                <th className="py-3 px-4 text-right">残額</th>
                <th className="py-3 px-4">処理日</th>
                <th className="py-3 px-4 text-center">処理状態</th>
                <th className="py-3 px-4">備考</th>
                {canUpdateProcess && <th className="py-3 px-4 text-right">操作</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {visiblePayroll.map((row) => (
                <tr key={row.caseId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#162D50]">{row.staff}</div>
                    <div className="text-xs text-gray-500">{row.caseId} / {row.type}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{row.splitLabel}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${Math.round((row.done / row.total) * 100)}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{row.done} / {row.total}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{row.targetMonth || 'ー'}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{yen(row.planned)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{yen(row.processed)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-800">{yen(row.remaining)}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{row.processedOn || 'ー'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${PROCESS_STATUS_COLORS[row.status]}`}>{row.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs max-w-[200px]">{row.note || 'ー'}</td>
                  {canUpdateProcess && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingPayroll(row)}
                        className="text-[#162D50] font-bold hover:underline whitespace-nowrap"
                      >
                        処理
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {visiblePayroll.length === 0 && (
                <tr><td colSpan={canUpdateProcess ? 11 : 10} className="py-10 text-center text-gray-400">該当するデータはありません</td></tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="p-4 bg-[#F8F9FA] border-t border-gray-200 text-xs text-gray-500">
            退職が決まったスタッフの天引き残額は、案件詳細内の「退職時の給与天引き管理」セクションで個別に確認・処理してください。
          </div>
        </div>
      )}

      {/* §1-12 派遣先請求・控除管理 */}
      {activeSection === 'billing' && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="p-3 bg-[#F8F9FA] border-b border-gray-200 flex space-x-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={billingKeyword}
                onChange={(e) => setBillingKeyword(e.target.value)}
                placeholder="派遣先・農家名で検索"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-300"
              />
            </div>
            <div className="relative w-48">
              <select
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm appearance-none focus:outline-none focus:border-gray-300 text-gray-600"
              >
                <option value="">対象請求月で絞り込み</option>
                {billingMonths.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500">
                <th className="py-3 px-4">対象派遣先・農家</th>
                <th className="py-3 px-4">対象請求月</th>
                <th className="py-3 px-4">対象スタッフ</th>
                <th className="py-3 px-4">費用種別</th>
                <th className="py-3 px-4 text-right">請求額・控除額</th>
                <th className="py-3 px-4">控除理由</th>
                <th className="py-3 px-4">請求書への表示内容</th>
                <th className="py-3 px-4 text-center">処理状態</th>
                <th className="py-3 px-4">処理日</th>
                <th className="py-3 px-4">担当者</th>
                <th className="py-3 px-4">備考</th>
                {canUpdateProcess && <th className="py-3 px-4 text-right">操作</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {visibleBilling.map((row) => (
                <tr key={row.caseId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-[#162D50]">{row.host}</td>
                  <td className="py-3 px-4 text-gray-600">{row.month}</td>
                  <td className="py-3 px-4 text-gray-800">{row.staff}</td>
                  <td className="py-3 px-4 text-gray-600">{row.type}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-800">
                    {row.kind === '控除' ? `-${yen(row.amount)}` : yen(row.amount)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{row.reason}</td>
                  <td className="py-3 px-4 text-gray-600">{row.display}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${PROCESS_STATUS_COLORS[row.status]}`}>{row.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{row.processedOn || 'ー'}</td>
                  <td className="py-3 px-4 text-gray-600">{row.handler || 'ー'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{row.note || 'ー'}</td>
                  {canUpdateProcess && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingBilling(row)}
                        className="text-[#162D50] font-bold hover:underline whitespace-nowrap"
                      >
                        処理
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {visibleBilling.length === 0 && (
                <tr><td colSpan={canUpdateProcess ? 12 : 11} className="py-10 text-center text-gray-400">該当するデータはありません</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* §1-19 CSV出力 */}
      {editingPayroll && (
        <ProcessDialog
          leg="recovery"
          process={editingPayroll.source.recovery}
          onClose={() => setEditingPayroll(null)}
          onSubmit={handlePayrollSubmit}
        />
      )}
      {editingBilling && (
        <BillingDialog
          billing={editingBilling.source.billing}
          onClose={() => setEditingBilling(null)}
          onSubmit={handleBillingSubmit}
        />
      )}

      {activeSection === 'csv' && (
        <div className="bg-white border border-gray-200 rounded-md p-8 space-y-4">
          <p className="text-sm text-gray-500 mb-4">対象月のデータをCSV形式で出力します。用途に応じて出力ファイルを選択してください。</p>
          {csvItems.map((item) => (
            <div key={item.title} className="flex items-center justify-between border border-gray-200 rounded-md p-4">
              <div className="flex items-center">
                <FileSpreadsheet className="w-8 h-8 text-[#162D50] mr-4" />
                <div>
                  <p className="font-bold text-[#162D50]">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={item.run}
                disabled={!canExport}
                className="flex items-center bg-[#162D50] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                出力
              </button>
            </div>
          ))}
          {exportError && (
            <p className="text-xs text-red-600">{exportError}</p>
          )}
          {!canExport && (
            <p className="text-xs text-gray-400">CSV出力の権限がありません。経理・給与処理担当者またはシステム管理者に依頼してください。</p>
          )}
        </div>
      )}
    </div>
  );
}
