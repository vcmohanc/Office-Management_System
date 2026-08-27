import { useState } from 'react';
import { Search, ChevronDown, Calendar, Download, Landmark, AlertCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';

const INSTALLMENTS = [
  { id: 'EMP-1042', name: '田中 健二', term: '12ヶ月', done: 5, total: 12, nextDate: '2023-11-15', nextAmount: 12500, remaining: 87500, status: '順調', note: '本人希望による分割（待機寮費）' },
  { id: 'EMP-1422', name: '高橋 芽依', term: '24ヶ月', done: 18, total: 24, nextDate: '2023-10-25', nextAmount: 5000, remaining: 30000, status: '延滞', overdue: 1, note: '上限金額超過のため分割提案・本人合意済み' },
  { id: 'EMP-0891', name: '佐藤 由美', term: '6ヶ月', done: 5, total: 6, nextDate: '2023-11-01', nextAmount: 2500, remaining: 2500, status: 'ほぼ完了', note: '' },
  { id: 'EMP-2091', name: '鈴木 浩', term: '12ヶ月', done: 2, total: 12, nextDate: '2023-10-28', nextAmount: 15000, remaining: 150000, status: '要対応', overdue: 2, note: '分割回数について再調整中' },
];

const INSTALLMENT_STATUS_STYLES = {
  '順調': 'bg-green-100 text-green-700 border-green-200',
  '延滞': 'bg-orange-100 text-orange-700 border-orange-200',
  'ほぼ完了': 'bg-blue-100 text-blue-700 border-blue-200',
  '要対応': 'bg-orange-100 text-orange-700 border-orange-200',
};

const BILLING_ROWS = [
  { host: 'グリーンファーム農園', month: '2024年5月', staff: '田中 健二', type: 'WIFI', amount: 6800, reason: '派遣先請求額から控除', status: '処理中' },
  { host: 'さくら農園', month: '2024年5月', staff: '佐藤 由美', type: '備品', amount: 15000, reason: '派遣先請求額から控除', status: '未処理' },
  { host: 'みどり牧場', month: '2024年4月', staff: '高橋 芽依', type: 'WIFI', amount: 5200, reason: '派遣先請求額から控除', status: '完了' },
];

export default function PaymentStatus() {
  const [activeSection, setActiveSection] = useState('payroll');
  const [installmentTab, setInstallmentTab] = useState('active');

  const visibleInstallments = INSTALLMENTS.filter((row) => {
    if (installmentTab === 'active') return row.done < row.total;
    if (installmentTab === 'completed') return row.done >= row.total;
    if (installmentTab === 'overdue') return !!row.overdue;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-1">精算・回収処理</h2>
          <p className="text-gray-500 text-sm">給与天引き・派遣先請求控除の処理状況を確認し、必要に応じてCSVを出力します。</p>
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
              <p className="text-3xl font-bold text-[#162D50]">¥4,250,000</p>
              <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
                精算準備完了 142件
              </div>
            </div>
            <Landmark className="w-10 h-10 text-gray-100" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-md shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">給与天引き対象額</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">¥185,000</p>
              <div className="flex items-center mt-2 text-xs text-green-600 font-medium">
                <div className="w-3 h-3 rounded-full border-2 border-green-600 flex items-center justify-center mr-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
                回収準備完了 28件
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-yellow-400 p-5 rounded-md shadow-sm border-l-4 border-l-yellow-400">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">派遣先請求控除待ち</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-[#162D50]">3件</p>
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
              <p className="text-3xl font-bold text-red-600">7件</p>
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

      {activeSection === 'payroll' && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          {/* Tabs and counts */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setInstallmentTab('active')}
                className={`flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${installmentTab === 'active' ? 'bg-[#162D50] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                天引き中 <span className="ml-2 bg-blue-900/20 px-2 rounded-full text-xs opacity-80">86</span>
              </button>
              <button
                onClick={() => setInstallmentTab('completed')}
                className={`flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${installmentTab === 'completed' ? 'bg-[#162D50] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                完了 <span className="ml-2 bg-gray-200 text-gray-600 px-2 rounded-full text-xs">142</span>
              </button>
              <button
                onClick={() => setInstallmentTab('overdue')}
                className={`flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${installmentTab === 'overdue' ? 'bg-[#162D50] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                延滞 <span className="ml-2 bg-gray-200 text-gray-600 px-2 rounded-full text-xs">4</span>
              </button>
            </div>
            <div className="text-sm text-gray-500">全 173 件</div>
          </div>

          {/* Filters */}
          <div className="p-3 bg-[#F8F9FA] border-b border-gray-200 flex space-x-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="スタッフID・氏名で検索" className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-300" />
            </div>
            <div className="relative w-48">
              <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm appearance-none focus:outline-none focus:border-gray-300 text-gray-600">
                <option>種別で絞り込み</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500">
                <th className="py-3 px-4">対象スタッフ</th>
                <th className="py-3 px-4">分割回数</th>
                <th className="py-3 px-4 w-32">天引き進捗</th>
                <th className="py-3 px-4">次回天引き予定額</th>
                <th className="py-3 px-4 text-right">残額</th>
                <th className="py-3 px-4 text-center">処理状態</th>
                <th className="py-3 px-4">備考</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {visibleInstallments.map((row) => (
                <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-50 ${row.overdue ? 'bg-red-50/30' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#162D50]">{row.id}</div>
                    <div className="text-xs text-gray-500">{row.name}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{row.term}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${row.overdue ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.round((row.done / row.total) * 100)}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{row.done} / {row.total}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`text-xs ${row.overdue ? 'text-red-500' : 'text-gray-500'}`}>{row.nextDate}</div>
                    <div className={`font-bold ${row.overdue ? 'text-red-600' : 'text-gray-800'}`}>¥{row.nextAmount.toLocaleString()}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-800">¥{row.remaining.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${INSTALLMENT_STATUS_STYLES[row.status]}`}>{row.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs max-w-[200px]">{row.note || 'ー'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 bg-[#F8F9FA] border-t border-gray-200 text-xs text-gray-500">
            退職が決まったスタッフの天引き残額は、案件詳細内の「退職時の給与天引き管理」セクションで個別に確認・処理してください。
          </div>
        </div>
      )}

      {activeSection === 'billing' && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="p-3 bg-[#F8F9FA] border-b border-gray-200 flex space-x-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="派遣先・農家名で検索" className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-300" />
            </div>
            <div className="relative w-48">
              <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm appearance-none focus:outline-none focus:border-gray-300 text-gray-600">
                <option>対象請求月で絞り込み</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500">
                <th className="py-3 px-4">対象派遣先・農家</th>
                <th className="py-3 px-4">対象請求月</th>
                <th className="py-3 px-4">対象スタッフ</th>
                <th className="py-3 px-4">費用種別</th>
                <th className="py-3 px-4 text-right">請求額・控除額</th>
                <th className="py-3 px-4">控除理由</th>
                <th className="py-3 px-4 text-center">処理状態</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {BILLING_ROWS.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-[#162D50]">{row.host}</td>
                  <td className="py-3 px-4 text-gray-600">{row.month}</td>
                  <td className="py-3 px-4 text-gray-800">{row.staff}</td>
                  <td className="py-3 px-4 text-gray-600">{row.type}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-800">¥{row.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{row.reason}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === 'csv' && (
        <div className="bg-white border border-gray-200 rounded-md p-8 space-y-4">
          <p className="text-sm text-gray-500 mb-4">対象月のデータをCSV形式で出力します。用途に応じて出力ファイルを選択してください。</p>
          {[
            { title: '立替案件一覧', desc: '登録されているすべての立替案件の一覧をCSVで出力します。' },
            { title: '給与天引き用', desc: '給与システムへ取り込むための天引き対象データを出力します。' },
            { title: '派遣先請求・控除用', desc: '派遣先・農家への請求および控除データを出力します。' },
          ].map((item) => (
            <div key={item.title} className="flex items-center justify-between border border-gray-200 rounded-md p-4">
              <div className="flex items-center">
                <FileSpreadsheet className="w-8 h-8 text-[#162D50] mr-4" />
                <div>
                  <p className="font-bold text-[#162D50]">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => alert(`${item.title} を出力しました`)}
                className="flex items-center bg-[#162D50] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                出力
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
