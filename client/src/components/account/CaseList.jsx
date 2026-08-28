import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, FileText, AlertTriangle, Filter, Pencil, UploadCloud, Trash2, Download } from 'lucide-react';
import {
  COST_BEARER_CATEGORIES,
  CASE_STATUSES,
  CASE_STATUS_COLORS,
} from '../../constants/expenseTypes';
import { ROLES, PERMISSIONS, can } from '../../constants/roles';
import { getPattern } from '../../constants/patterns';
import {
  MOCK_CASES,
  PROCESS_STATUS_COLORS,
  deriveCaseStatus,
  getFarmerProcess,
  getStaffProcess,
  getRemaining,
  installmentTotal,
  isInstallmentBalanced,
  isAwaitingPayroll,
  isAwaitingHostBilling,
  hasMissingAttachment,
} from '../../constants/cases';
import {
  fetchCases, rejectCase, cancelCase, approveCase, updateCase, updateProcess,
  updateInstallment, updateBilling, updateResignation, addComment,
  uploadAttachments, deleteAttachment, openAttachment, setCaseStatus,
} from '../../api/client';
import {
  ReasonDialog, ProcessDialog, BillingDialog, ResignationDialog, EditCaseDialog,
} from './CaseDialogs';
import { useExpenseTypes } from '../../hooks/useMasters';

const EMPTY_FILTERS = {
  keyword: '',
  type: '',
  status: '',
  costBearer: '',
  from: '',
  to: '',
  advancer: '',
  targetStaff: '',
  targetHost: '',
  awaitingPayroll: false,
  awaitingBilling: false,
  missingAttachment: false,
};

const yen = (n) => `¥${Number(n || 0).toLocaleString()}`;

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-800 text-right">{value || 'ー'}</span>
    </div>
  );
}

// §1-7 各処理の管理項目
function ProcessCard({ title, process, onEdit }) {
  if (!process) return null;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-gray-500 tracking-wider">{title}</h4>
        {onEdit && (
          <button onClick={onEdit} className="flex items-center text-xs font-bold text-[#162D50] hover:underline">
            <Pencil className="w-3 h-3 mr-1" /> 更新
          </button>
        )}
      </div>
      <div className="bg-[#E9ECEF] rounded-md p-4 text-sm space-y-2">
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-300">
          <span className="text-gray-600">{process.method || '未設定'}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${PROCESS_STATUS_COLORS[process.status]}`}>
            {process.status}
          </span>
        </div>
        <Row label="処理予定額" value={yen(process.plannedAmount)} />
        <Row label="処理予定日" value={process.plannedOn} />
        <Row label="処理済み額" value={yen(process.processedAmount)} />
        <Row label="残額" value={yen(getRemaining(process))} />
        <Row label="対象月" value={process.targetMonth} />
        <Row label="処理日" value={process.processedOn} />
        <Row label="処理担当者" value={process.handler} />
        <Row label="備考" value={process.note} />
      </div>
    </div>
  );
}

export default function CaseList() {
  const user = JSON.parse(localStorage.getItem('user')) || { role: ROLES.APPLICANT, username: '申請者' };
  const isReviewer = user.role === ROLES.REVIEWER;

  const { types: expenseTypes } = useExpenseTypes();
  const [cases, setCases] = useState([]);
  const [offline, setOffline] = useState(false);
  const [actionError, setActionError] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState(null);
  const [dialogMode, setDialogMode] = useState(null);
  const [processLeg, setProcessLeg] = useState(null);
  const [editingBilling, setEditingBilling] = useState(false);
  const [editingResignation, setEditingResignation] = useState(false);
  const [editingCase, setEditingCase] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [uploading, setUploading] = useState(false);

  const setDraft = (key, value) => setDraftFilters((prev) => ({ ...prev, [key]: value }));

  // §1-16 検索・絞り込みはサーバー側で行う
  const loadCases = useCallback(async () => {
    try {
      const result = await fetchCases(filters);
      setCases(result);
      setOffline(false);
    } catch {
      // APIに接続できないときはサンプルデータで画面を確認できるようにする
      setCases(MOCK_CASES);
      setOffline(true);
    }
  }, [filters]);

  useEffect(() => { loadCases(); }, [loadCases]);

  // サーバーで絞り込めないオフライン時のみ、クライアント側で絞り込む
  const filteredCases = cases.filter((c) => {
    if (quickFilter === 'staff' && c.group !== 'staff') return false;
    if (quickFilter === 'host' && c.group !== 'host') return false;
    if (!offline) return true;

    const f = filters;
    if (f.keyword) {
      const kw = f.keyword.toLowerCase();
      const haystack = [c.id, c.advancer, c.target, c.registeredBy].join(' ').toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    if (f.type && c.type !== f.type) return false;
    if (f.status && deriveCaseStatus(c) !== f.status) return false;
    if (f.costBearer && c.costBearerCategory !== f.costBearer) return false;
    if (f.from && c.occurredOn < f.from) return false;
    if (f.to && c.occurredOn > f.to) return false;
    if (f.advancer && !c.advancer.includes(f.advancer)) return false;
    if (f.targetStaff && !(c.targetCategory === 'サービススタッフ' && c.target.includes(f.targetStaff))) return false;
    if (f.targetHost && !(c.targetCategory === '派遣先・農家' && c.target.includes(f.targetHost))) return false;
    if (f.awaitingPayroll && !isAwaitingPayroll(c)) return false;
    if (f.awaitingBilling && !isAwaitingHostBilling(c)) return false;
    if (f.missingAttachment && !hasMissingAttachment(c)) return false;
    return true;
  });

  // 選択中の案件が絞り込みで消えた場合は先頭を表示する（描画時に決めるので同期用の効果は不要）
  const selectedCase = cases.find((c) => c.id === selectedId) || cases[0] || null;

  const canEdit = can(user.role, PERMISSIONS.EDIT);
  const canUpdateProcess = can(user.role, PERMISSIONS.UPDATE_PROCESS);

  const replaceCase = (updated) =>
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  // §1-18 差戻し・取消（理由はサーバーに記録され、§1-21 の履歴に残る）
  const applyDecision = async (reason) => {
    setActionError('');
    try {
      const updated = dialogMode === 'reject'
        ? await rejectCase(selectedCase.id, reason)
        : await cancelCase(selectedCase.id, reason);
      replaceCase(updated);
    } catch (err) {
      setActionError(err.message);
    }
    setDialogMode(null);
  };

  // §1-18 承認
  const handleApprove = async () => {
    setActionError('');
    try {
      replaceCase(await approveCase(selectedCase.id));
    } catch (err) {
      setActionError(err.message);
    }
  };

  // 更新系のハンドラは同じ形なので共通化する
  const runUpdate = async (action, onDone) => {
    setActionError('');
    try {
      replaceCase(await action());
      if (onDone) onDone();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // §1-7 精算・回収処理の更新
  const handleProcessSubmit = (payload) =>
    runUpdate(() => updateProcess(selectedCase.id, processLeg, payload), () => setProcessLeg(null));

  // §1-10 分割天引きの各月を完了にする／戻す
  const handleInstallmentToggle = (index, current) =>
    runUpdate(() => updateInstallment(selectedCase.id, index, { status: current === '完了' ? '未処理' : '完了' }));

  // §1-12 派遣先請求・控除の更新
  const handleBillingSubmit = (payload) =>
    runUpdate(() => updateBilling(selectedCase.id, payload), () => setEditingBilling(false));

  // §1-11 退職時の給与天引きの更新
  const handleResignationSubmit = (payload) =>
    runUpdate(async () => (await updateResignation(selectedCase.id, payload)).case, () => setEditingResignation(false));

  // §1-17 案件の編集
  const handleEditSubmit = (payload) =>
    runUpdate(() => updateCase(selectedCase.id, payload), () => setEditingCase(false));

  // §1-17 コメントの投稿
  const handleAddComment = () =>
    runUpdate(() => addComment(selectedCase.id, commentText), () => setCommentText(''));

  // §1-14 保留
  const handleHold = () => runUpdate(() => setCaseStatus(selectedCase.id, '保留'));

  // §1-13 添付の追加・削除
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    await runUpdate(() => uploadAttachments(selectedCase.id, files, files.map(() => '領収書')));
    setUploading(false);
  };

  const handleDeleteAttachment = (storedName) =>
    runUpdate(() => deleteAttachment(selectedCase.id, storedName));

  const handleOpenAttachment = async (storedName) => {
    setActionError('');
    try {
      await openAttachment(selectedCase.id, storedName);
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <h2 className="text-2xl font-bold text-[#162D50] mb-4">{isReviewer ? '案件確認（レビューキュー）' : 'マイ案件一覧'}</h2>

      {offline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs text-yellow-700">
          サーバーに接続できないため、サンプルデータを表示しています。差戻し・取消・承認は保存されません。
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-600">{actionError}</div>
      )}

      {/* Quick Filter Tabs */}
      <div className="bg-[#F2F4F7] p-1 rounded-md flex space-x-1 mb-4 border border-gray-200">
        {[
          { key: 'all', label: 'すべて' },
          { key: 'staff', label: 'サービススタッフ関連' },
          { key: 'host', label: '派遣先・農家関連' },
        ].map((tab) => {
          const count = tab.key === 'all' ? cases.length : cases.filter((c) => c.group === tab.key).length;
          const active = quickFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setQuickFilter(tab.key)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
                active ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab.label} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-4 space-y-4">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-600 mb-1">検索</label>
            <div className="relative">
              <input
                type="text"
                value={draftFilters.keyword}
                onChange={(e) => setDraft('keyword', e.target.value)}
                placeholder="ケースID・立替者・対象名で検索"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="w-44">
            <label className="block text-xs font-bold text-gray-600 mb-1">種別</label>
            <div className="relative">
              <select
                value={draftFilters.type}
                onChange={(e) => setDraft('type', e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
              >
                <option value="">すべての種別</option>
                {expenseTypes.map((t) => <option key={t.key} value={t.label}>{t.label}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="w-44">
            <label className="block text-xs font-bold text-gray-600 mb-1">ステータス</label>
            <div className="relative">
              <select
                value={draftFilters.status}
                onChange={(e) => setDraft('status', e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
              >
                <option value="">すべてのステータス</option>
                {CASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="w-44">
            <label className="block text-xs font-bold text-gray-600 mb-1">費用負担先</label>
            <div className="relative">
              <select
                value={draftFilters.costBearer}
                onChange={(e) => setDraft('costBearer', e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
              >
                <option value="">すべて</option>
                {COST_BEARER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={() => setShowAdvancedFilter((v) => !v)}
            className="border border-gray-300 bg-white text-gray-600 px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap h-[38px] flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" /> 詳細フィルタ
          </button>
          <button
            onClick={() => setFilters(draftFilters)}
            className="bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap h-[38px]"
          >
            適用
          </button>
        </div>

        {showAdvancedFilter && (
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">期間（開始）</label>
              <input
                type="date"
                value={draftFilters.from}
                onChange={(e) => setDraft('from', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">期間（終了）</label>
              <input
                type="date"
                value={draftFilters.to}
                onChange={(e) => setDraft('to', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">立替者</label>
              <input
                type="text"
                value={draftFilters.advancer}
                onChange={(e) => setDraft('advancer', e.target.value)}
                placeholder="立替者名で絞り込み"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">対象スタッフ</label>
              <input
                type="text"
                value={draftFilters.targetStaff}
                onChange={(e) => setDraft('targetStaff', e.target.value)}
                placeholder="スタッフ名で絞り込み"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">対象派遣先・農家</label>
              <input
                type="text"
                value={draftFilters.targetHost}
                onChange={(e) => setDraft('targetHost', e.target.value)}
                placeholder="派遣先・農家名で絞り込み"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
              />
            </div>
            <label className="flex items-center text-sm text-gray-700 mt-6">
              <input
                type="checkbox"
                checked={draftFilters.awaitingPayroll}
                onChange={(e) => setDraft('awaitingPayroll', e.target.checked)}
                className="w-4 h-4 mr-2 accent-[#162D50]"
              /> 給与天引き待ちのみ
            </label>
            <label className="flex items-center text-sm text-gray-700 mt-6">
              <input
                type="checkbox"
                checked={draftFilters.awaitingBilling}
                onChange={(e) => setDraft('awaitingBilling', e.target.checked)}
                className="w-4 h-4 mr-2 accent-[#162D50]"
              /> 派遣先請求控除待ちのみ
            </label>
            <label className="flex items-center text-sm text-gray-700 mt-6">
              <input
                type="checkbox"
                checked={draftFilters.missingAttachment}
                onChange={(e) => setDraft('missingAttachment', e.target.checked)}
                className="w-4 h-4 mr-2 accent-[#162D50]"
              /> 添付不足のみ
            </label>
          </div>
        )}
      </div>

      {/* Data Table §1-15 */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-600">
              <th className="py-3 px-6 whitespace-nowrap">ケースID</th>
              <th className="py-3 px-6 whitespace-nowrap">登録者</th>
              <th className="py-3 px-6 whitespace-nowrap">発生日</th>
              <th className="py-3 px-6 whitespace-nowrap">種別</th>
              <th className="py-3 px-6 whitespace-nowrap">立替者</th>
              <th className="py-3 px-6 whitespace-nowrap">対象</th>
              <th className="py-3 px-6 whitespace-nowrap">費用負担先</th>
              <th className="py-3 px-6 whitespace-nowrap">金額</th>
              <th className="py-3 px-6 whitespace-nowrap">農家処理</th>
              <th className="py-3 px-6 whitespace-nowrap">スタッフ処理</th>
              <th className="py-3 px-6 whitespace-nowrap">添付</th>
              <th className="py-3 px-6 whitespace-nowrap">ステータス</th>
              <th className="py-3 px-6 whitespace-nowrap">更新日</th>
              <th className="py-3 px-6 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredCases.map((c) => {
              const farmer = getFarmerProcess(c);
              const staff = getStaffProcess(c);
              const status = deriveCaseStatus(c);
              return (
                <tr
                  key={c.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedCase?.id === c.id ? 'bg-gray-50' : ''}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <td className="py-4 px-6 text-gray-600">{c.id}</td>
                  <td className="py-4 px-6 text-gray-600">{c.registeredBy}</td>
                  <td className="py-4 px-6 text-gray-600">{c.occurredOn}</td>
                  <td className="py-4 px-6 text-gray-600">{c.type}</td>
                  <td className="py-4 px-6 text-gray-800">{c.advancer}</td>
                  <td className="py-4 px-6 text-gray-800">{c.target}</td>
                  <td className="py-4 px-6 text-gray-600">{c.costBearer}</td>
                  <td className="py-4 px-6 font-bold text-gray-800">{yen(c.amount)}</td>
                  <td className="py-4 px-6">
                    {farmer ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${PROCESS_STATUS_COLORS[farmer.process.status]}`}>{farmer.process.status}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">ー</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {staff ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${PROCESS_STATUS_COLORS[staff.process.status]}`}>{staff.process.status}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">ー</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {c.attachments.length > 0 ? (
                      <span className="flex items-center text-gray-500 text-xs">
                        <FileText className="w-4 h-4 mr-1 text-gray-400" />{c.attachments.length}
                      </span>
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${CASE_STATUS_COLORS[status]}`}>{status}</span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{c.updatedOn}</td>
                  <td className="py-4 px-6">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); }} className="text-[#162D50] font-bold hover:underline">詳細</button>
                  </td>
                </tr>
              );
            })}
            {filteredCases.length === 0 && (
              <tr>
                <td colSpan={14} className="py-10 text-center text-gray-400">条件に一致する案件はありません</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Case Detail §1-17 */}
      {selectedCase && (
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-md mt-8">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-md">
            <h3 className="text-[#162D50] text-lg font-bold">案件詳細 — {selectedCase.id}</h3>
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${CASE_STATUS_COLORS[deriveCaseStatus(selectedCase)]}`}>
              {deriveCaseStatus(selectedCase)}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 bg-white">
            {/* 基本情報 */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">基本情報</h4>
              <div className="space-y-3 text-sm">
                <Row label="ケースID" value={selectedCase.id} />
                <Row label="申請者・登録者" value={selectedCase.registeredBy} />
                <Row label="発生日・利用日" value={selectedCase.occurredOn} />
                <Row label="種別" value={selectedCase.type} />
                <Row label="該当パターン" value={getPattern(selectedCase.advancerCategory, selectedCase.costBearerCategory)?.label} />
              </div>
            </div>

            {/* 立替者・対象・費用負担先 §基本業務ルール（3つを別情報として管理） */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">立替者・対象・費用負担先</h4>
              <div className="space-y-3 text-sm">
                <Row label="立替者区分" value={selectedCase.advancerCategory} />
                <Row label="立替者" value={selectedCase.advancer} />
                <Row label="対象区分" value={selectedCase.targetCategory} />
                <Row label="対象" value={selectedCase.target} />
                <Row label="費用負担先区分" value={selectedCase.costBearerCategory} />
                <Row label="費用負担先" value={selectedCase.costBearer} />
              </div>
            </div>

            {/* 金額・内容 */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">金額・内容</h4>
              <div className="space-y-3 text-sm">
                <Row label="金額" value={yen(selectedCase.amount)} />
                <Row label="理由" value={selectedCase.reason} />
                <Row label="内容" value={selectedCase.detail} />
                <Row label="備考" value={selectedCase.note} />
                {Object.entries(selectedCase.extras || {}).map(([k, v]) => (
                  <Row key={k} label={k} value={v} />
                ))}
              </div>
            </div>
          </div>

          {/* 精算処理・回収処理 §1-7 */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 bg-white border-t border-gray-100">
            <ProcessCard
              title="立替者への精算処理"
              process={selectedCase.settlement}
              onEdit={canUpdateProcess ? () => setProcessLeg('settlement') : null}
            />
            <ProcessCard
              title="費用負担先からの回収処理"
              process={selectedCase.recovery}
              onEdit={canUpdateProcess ? () => setProcessLeg('recovery') : null}
            />

            {/* 添付書類 §1-13 */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">添付書類（{selectedCase.attachments.length}件）</h4>
              <div className="space-y-3">
                {can(user.role, PERMISSIONS.VIEW_ATTACHMENT) ? (
                  selectedCase.attachments.length > 0 ? (
                    selectedCase.attachments.map((file, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-md px-4 py-3 flex justify-between items-center text-sm">
                        <div className="flex items-center text-gray-700 min-w-0">
                          <FileText className="w-4 h-4 mr-2 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0 ml-3">
                          <span className="text-xs text-gray-500">{file.kind}</span>
                          {file.storedName && (
                            <button
                              onClick={() => handleOpenAttachment(file.storedName)}
                              className="text-gray-400 hover:text-[#162D50] transition-colors"
                              title="開く"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit && file.storedName && (
                            <button
                              onClick={() => handleDeleteAttachment(file.storedName)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex justify-between items-center text-sm">
                      <span className="text-gray-400">添付なし</span>
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                  )
                ) : (
                  <p className="text-sm text-gray-400">添付ファイルの閲覧権限がありません</p>
                )}

                {canEdit && (
                  <label className="border-2 border-dashed border-gray-300 rounded-md bg-[#FAFAFA] px-4 py-3 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-500">
                    <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                    <UploadCloud className="w-4 h-4 mr-2" />
                    {uploading ? 'アップロード中…' : '書類を追加（PDF・PNG・JPG）'}
                  </label>
                )}
              </div>

              {selectedCase.rejection && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-600">
                  差戻し理由：{selectedCase.rejection.reason}
                  <div className="mt-1 text-red-400">{selectedCase.rejection.by} / {selectedCase.rejection.at}</div>
                </div>
              )}
              {selectedCase.cancellation && (
                <div className="mt-4 bg-gray-100 border border-gray-200 rounded-md p-3 text-xs text-gray-600">
                  取消理由：{selectedCase.cancellation.reason}
                  <div className="mt-1 text-gray-400">{selectedCase.cancellation.by} / {selectedCase.cancellation.at}</div>
                </div>
              )}
            </div>
          </div>

          {/* 分割天引き明細 §1-10 ／ 派遣先請求・控除情報 §1-12 */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-t border-gray-100">
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">分割天引き明細</h4>
              {selectedCase.installments.length > 0 ? (
                <>
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500">
                        <th className="py-2 px-3">対象月</th>
                        <th className="py-2 px-3 text-right">金額</th>
                        <th className="py-2 px-3 text-center">状態</th>
                        <th className="py-2 px-3">処理日</th>
                        {canUpdateProcess && <th className="py-2 px-3 text-right">操作</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCase.installments.map((inst, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-600">{inst.month}</td>
                          <td className="py-2 px-3 text-right font-bold text-gray-800">{yen(inst.amount)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${PROCESS_STATUS_COLORS[inst.status]}`}>{inst.status}</span>
                          </td>
                          <td className="py-2 px-3 text-gray-500 text-xs">{inst.processedOn || 'ー'}</td>
                          {canUpdateProcess && (
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => handleInstallmentToggle(i, inst.status)}
                                className="text-[#162D50] font-bold hover:underline text-xs whitespace-nowrap"
                              >
                                {inst.status === '完了' ? '未処理に戻す' : '完了にする'}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className={`mt-3 text-xs ${isInstallmentBalanced(selectedCase) ? 'text-gray-500' : 'text-red-600'}`}>
                    分割金額の合計 {yen(installmentTotal(selectedCase.installments))} ／ 天引き総額 {yen(selectedCase.recovery?.plannedAmount)}
                    {isInstallmentBalanced(selectedCase) ? '（一致）' : '（不一致・要確認）'}
                  </div>
                  {selectedCase.installmentNote && (
                    <div className="mt-2 text-xs text-gray-500">分割に関する備考：{selectedCase.installmentNote}</div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">分割払いの指定はありません</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-gray-500 tracking-wider">派遣先請求・控除情報</h4>
                {canUpdateProcess && selectedCase.billing && (
                  <button onClick={() => setEditingBilling(true)} className="flex items-center text-xs font-bold text-[#162D50] hover:underline">
                    <Pencil className="w-3 h-3 mr-1" /> 更新
                  </button>
                )}
              </div>
              {selectedCase.billing ? (
                <div className="bg-[#E9ECEF] rounded-md p-4 text-sm space-y-2">
                  <Row label="対象派遣先・農家" value={selectedCase.billing.host} />
                  <Row label="対象請求月" value={selectedCase.billing.month} />
                  <Row label="対象スタッフ" value={selectedCase.billing.staff} />
                  <Row label="費用種別" value={selectedCase.billing.type} />
                  <Row label={`${selectedCase.billing.kind}額`} value={yen(selectedCase.billing.amount)} />
                  <Row label="控除理由" value={selectedCase.billing.reason} />
                  <Row label="請求書への表示内容" value={selectedCase.billing.display} />
                  <Row label="処理状態" value={selectedCase.billing.status} />
                  <Row label="処理日" value={selectedCase.billing.processedOn} />
                  <Row label="担当者" value={selectedCase.billing.handler} />
                  <Row label="備考" value={selectedCase.billing.note} />
                </div>
              ) : (
                <p className="text-sm text-gray-400">派遣先への請求・控除はありません</p>
              )}
            </div>
          </div>

          {/* 退職時の給与天引き管理 §1-11 ／ コメント §1-17 */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-t border-gray-100">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-gray-500 tracking-wider">退職時の給与天引き管理</h4>
                {canUpdateProcess && (
                  <button onClick={() => setEditingResignation(true)} className="flex items-center text-xs font-bold text-[#162D50] hover:underline">
                    <Pencil className="w-3 h-3 mr-1" /> {selectedCase.resignation ? '更新' : '登録'}
                  </button>
                )}
              </div>
              {selectedCase.resignation ? (
                <div className="bg-[#E9ECEF] rounded-md p-4 text-sm space-y-2">
                  <Row label="本人同意日" value={selectedCase.resignation.consentedOn} />
                  <Row label="天引き誓約書" value={selectedCase.resignation.pledgeAttached ? '添付あり' : '未添付'} />
                  <Row label="確認者" value={selectedCase.resignation.confirmedBy} />
                  <Row label="最終給与で回収可能か" value={selectedCase.resignation.recoverableFromFinalSalary ? '回収可能' : '回収不可'} />
                  <Row label="最終給与で回収できない金額" value={yen(selectedCase.resignation.uncollectableAmount)} />
                  <Row label="未回収時の対応" value={selectedCase.resignation.followUp} />
                  <Row label="備考" value={selectedCase.resignation.note} />
                  {!selectedCase.resignation.pledgeAttached && (
                    <div className="flex items-start bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-600 mt-2">
                      <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                      天引き誓約書が未添付です。回収処理を進める前に添付してください。
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">退職に伴う天引きの対象ではありません</p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">コメント</h4>
              {selectedCase.comments.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {selectedCase.comments.map((cm, i) => (
                    <li key={i} className="bg-white border border-gray-200 rounded-md px-4 py-3">
                      <div className="text-gray-700">{cm.text}</div>
                      <div className="text-xs text-gray-400 mt-1">{cm.by} / {cm.at}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">コメントはありません</p>
              )}

              <div className="mt-4 flex items-start space-x-3">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="コメントを入力"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  投稿
                </button>
              </div>
            </div>
          </div>

          {/* 処理履歴・更新履歴 §1-21 */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-t border-gray-100">
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">処理履歴</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                {selectedCase.history.map((h, i) => (
                  <li key={i}>{h.at}　{h.action}（{h.by}）</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">更新履歴</h4>
              {selectedCase.history.some((h) => h.field) ? (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500">
                      <th className="py-2 px-3">操作日時</th>
                      <th className="py-2 px-3">項目</th>
                      <th className="py-2 px-3">変更前</th>
                      <th className="py-2 px-3">変更後</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCase.history.filter((h) => h.field).map((h, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">{h.at}</td>
                        <td className="py-2 px-3 text-gray-600">{h.field}</td>
                        <td className="py-2 px-3 text-gray-500">{h.before || 'ー'}</td>
                        <td className="py-2 px-3 font-bold text-gray-800">{h.after || 'ー'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-400">項目の変更履歴はありません</p>
              )}
            </div>
          </div>

          {/* Action Buttons §1-20 権限に応じて表示 */}
          <div className="p-4 border-t border-gray-200 flex justify-end items-center space-x-4 bg-gray-50 rounded-b-md">
            {canEdit && (
              <button onClick={() => setEditingCase(true)} className="text-[#162D50] font-medium px-4 hover:underline">編集</button>
            )}
            {canEdit && deriveCaseStatus(selectedCase) !== '保留' && (
              <button onClick={handleHold} className="text-gray-500 font-medium px-4 hover:underline">保留</button>
            )}
            {can(user.role, PERMISSIONS.REJECT) && (
              <button onClick={() => setDialogMode('reject')} className="text-red-500 font-medium px-4 hover:underline">差戻し</button>
            )}
            {can(user.role, PERMISSIONS.CANCEL) && (
              <button onClick={() => setDialogMode('cancel')} className="border border-gray-300 bg-white text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50">取消</button>
            )}
            {can(user.role, PERMISSIONS.APPROVE) && (
              <button onClick={handleApprove} className="bg-[#0A192F] text-white px-6 py-2 rounded-md font-bold hover:bg-[#162D50] shadow-sm">承認</button>
            )}
            {canEdit && deriveCaseStatus(selectedCase) === '差戻し' && !can(user.role, PERMISSIONS.APPROVE) && (
              <button onClick={() => setEditingCase(true)} className="bg-[#0A192F] text-white px-6 py-2 rounded-md font-bold hover:bg-[#162D50] shadow-sm">編集して再申請</button>
            )}
          </div>
        </div>
      )}

      {dialogMode && (
        <ReasonDialog mode={dialogMode} onClose={() => setDialogMode(null)} onSubmit={applyDecision} />
      )}
      {processLeg && selectedCase && (
        <ProcessDialog
          leg={processLeg}
          process={selectedCase[processLeg]}
          onClose={() => setProcessLeg(null)}
          onSubmit={handleProcessSubmit}
        />
      )}
      {editingBilling && selectedCase?.billing && (
        <BillingDialog
          billing={selectedCase.billing}
          onClose={() => setEditingBilling(false)}
          onSubmit={handleBillingSubmit}
        />
      )}
      {editingResignation && selectedCase && (
        <ResignationDialog
          resignation={selectedCase.resignation}
          onClose={() => setEditingResignation(false)}
          onSubmit={handleResignationSubmit}
        />
      )}
      {editingCase && selectedCase && (
        <EditCaseDialog
          caseData={selectedCase}
          onClose={() => setEditingCase(false)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
