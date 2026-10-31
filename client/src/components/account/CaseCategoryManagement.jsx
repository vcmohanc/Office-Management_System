import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  RotateCcw, 
  Check, 
  X, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  UserCheck, 
  Building2, 
  CreditCard,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toastConfirm } from '../../utils/toastConfirm.jsx';
import { apiFetch } from '../../utils/apiFetch.js';
import { 
  toJP, 
  getPaymentMethod, 
  EXPENSE_RULES_MAPPING, 
  sortExpenseTypes,
  optionLabelJP
} from '../../utils/expenseRules.js';

const PAYMENT_METHOD_LABELS = {
  'salary_addition': { label: '給与に加算', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'salary_deduction': { label: '給与から控除', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  'client_invoice': { label: '顧客へ請求', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'direct_transfer': { label: '本人へ振込', color: 'bg-purple-50 text-purple-700 border-purple-200' }
};

export default function CaseCategoryManagement() {
  const [subTab, setSubTab] = useState('expenseTypes'); // 'expenseTypes' | 'advancers' | 'bearers' | 'rules'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formType, setFormType] = useState('ExpenseType');
  const [formLabel, setFormLabel] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDefaultAdvancer, setFormDefaultAdvancer] = useState('');
  const [formDefaultBearer, setFormDefaultBearer] = useState('');
  const [formDefaultPaymentMethod, setFormDefaultPaymentMethod] = useState('');

  // Fetch all options
  const fetchOptions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/options');
      if (res.ok) {
        const data = await res.json();
        setOptions(Array.isArray(data) ? data : []);
      } else {
        toast.error('案件カテゴリ項目の取得に失敗しました');
      }
    } catch (err) {
      console.error('Error fetching options:', err);
      toast.error('サーバー接続エラー');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // Split into categorized lists
  const expenseTypes = useMemo(() => {
    const list = options.filter(o => o.type === 'ExpenseType');
    return sortExpenseTypes(list);
  }, [options]);

  const advancers = useMemo(() => {
    return options.filter(o => o.type === 'AdvancerCategory');
  }, [options]);

  const bearers = useMemo(() => {
    return options.filter(o => o.type === 'BearingParty');
  }, [options]);

  // Quick lookup helper
  const isOthers = (o) => {
    const v = (o.value || '').toLowerCase();
    const l = (o.label || '').toLowerCase();
    return v === 'others' || v === 'other' || v === 'その他' || l === 'others' || l === 'other' || l === 'その他';
  };

  // Filtered lists by search query
  const q = searchQuery.trim().toLowerCase();
  const filterItem = (item) => {
    if (!q) return true;
    const labelJP = toJP(item.label) || '';
    const labelRaw = item.label || '';
    const val = item.value || '';
    return labelJP.toLowerCase().includes(q) || 
           labelRaw.toLowerCase().includes(q) || 
           val.toLowerCase().includes(q);
  };

  const filteredExpenseTypes = useMemo(() => expenseTypes.filter(filterItem), [expenseTypes, q]);
  const filteredAdvancers = useMemo(() => advancers.filter(filterItem), [advancers, q]);
  const filteredBearers = useMemo(() => bearers.filter(filterItem), [bearers, q]);

  // Open Create Modal
  const openCreateModal = (type) => {
    setModalMode('create');
    setEditingItem(null);
    setFormType(type);
    setFormLabel('');
    setFormValue('');
    setFormDefaultAdvancer('');
    setFormDefaultBearer('');
    setFormDefaultPaymentMethod('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormType(item.type);
    setFormLabel(item.label || '');
    setFormValue(item.value || '');
    
    // Fall back to static mapping if not set on item
    const staticRule = EXPENSE_RULES_MAPPING[item.value] || EXPENSE_RULES_MAPPING[item.label] || {};
    setFormDefaultAdvancer(item.defaultAdvancerCategory || staticRule.advancerCategory || '');
    setFormDefaultBearer(item.defaultBearingParty || staticRule.bearingParty || '');
    setFormDefaultPaymentMethod(item.defaultPaymentMethod || '');
    setIsModalOpen(true);
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Save Item (Create or Edit)
  const handleSave = async (e) => {
    e?.preventDefault();
    const label = formLabel.trim();
    const value = formValue.trim() || label;

    if (!label) {
      toast.error('名称（表示名）を入力してください');
      return;
    }

    try {
      if (modalMode === 'create') {
        const payload = {
          type: formType,
          label,
          value,
          defaultAdvancerCategory: formDefaultAdvancer,
          defaultBearingParty: formDefaultBearer,
          defaultPaymentMethod: formDefaultPaymentMethod
        };

        const res = await apiFetch('/api/options', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          setOptions(prev => [...prev, created]);
          toast.success(`「${toJP(label)}」を追加しました`);
          closeModal();
          window.dispatchEvent(new CustomEvent('oms_options_updated'));
        } else {
          const errData = await res.json();
          toast.error(errData.error || '登録に失敗しました');
        }
      } else {
        // Edit
        const payload = {
          label,
          value: isOthers(editingItem) ? editingItem.value : value,
          defaultAdvancerCategory: formDefaultAdvancer,
          defaultBearingParty: formDefaultBearer,
          defaultPaymentMethod: formDefaultPaymentMethod
        };

        const res = await apiFetch(`/api/options/${editingItem._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updated = await res.json();
          setOptions(prev => prev.map(o => o._id === updated._id ? updated : o));
          toast.success(`「${toJP(label)}」を更新しました`);
          closeModal();
          window.dispatchEvent(new CustomEvent('oms_options_updated'));
        } else {
          const errData = await res.json();
          toast.error(errData.error || '更新に失敗しました');
        }
      }
    } catch (err) {
      console.error('Error saving option:', err);
      toast.error('保存中にエラーが発生しました');
    }
  };

  // Delete Item
  const handleDelete = async (item) => {
    if (isOthers(item)) {
      toast.error('「その他」はシステムで必須のため削除できません');
      return;
    }

    const confirm = await toastConfirm(`「${toJP(item.label)}」を削除してもよろしいですか？`);
    if (!confirm) return;

    try {
      const res = await apiFetch(`/api/options/${item._id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setOptions(prev => prev.filter(o => o._id !== item._id));
        toast.success(`「${toJP(item.label)}」を削除しました`);
        window.dispatchEvent(new CustomEvent('oms_options_updated'));
      } else {
        const errData = await res.json();
        toast.error(errData.error || '削除に失敗しました');
      }
    } catch (err) {
      console.error('Error deleting option:', err);
      toast.error('削除中にエラーが発生しました');
    }
  };

  // Sync / populate default rules from EXPENSE_RULES_MAPPING
  const handleSyncDefaultRules = async () => {
    const confirm = await toastConfirm('既定の自動入力ルール（立替者・負担先）を各経費種別に一括適用しますか？');
    if (!confirm) return;

    let updatedCount = 0;
    try {
      setLoading(true);
      for (const exp of expenseTypes) {
        const staticRule = EXPENSE_RULES_MAPPING[exp.value] || EXPENSE_RULES_MAPPING[exp.label];
        if (staticRule) {
          const needUpdate = !exp.defaultAdvancerCategory || !exp.defaultBearingParty;
          if (needUpdate) {
            const res = await apiFetch(`/api/options/${exp._id}`, {
              method: 'PUT',
              body: JSON.stringify({
                label: exp.label,
                value: exp.value,
                defaultAdvancerCategory: exp.defaultAdvancerCategory || staticRule.advancerCategory,
                defaultBearingParty: exp.defaultBearingParty || staticRule.bearingParty
              })
            });
            if (res.ok) updatedCount++;
          }
        }
      }
      await fetchOptions();
      window.dispatchEvent(new CustomEvent('oms_options_updated'));
      toast.success(`${updatedCount}件の自動入力ルールを同期・更新しました`);
    } catch (err) {
      console.error('Error syncing rules:', err);
      toast.error('ルール同期に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Effective payment method in modal (explicit selection or auto-calculated from advancer + bearer)
  const effectivePaymentMethod = useMemo(() => {
    if (formDefaultPaymentMethod) {
      return {
        ...(PAYMENT_METHOD_LABELS[formDefaultPaymentMethod] || { label: formDefaultPaymentMethod, color: 'bg-gray-100 text-gray-700' }),
        isExplicit: true
      };
    }
    if (formDefaultAdvancer && formDefaultBearer) {
      const method = getPaymentMethod(formDefaultAdvancer, formDefaultBearer);
      return {
        ...(PAYMENT_METHOD_LABELS[method] || { label: method, color: 'bg-gray-100 text-gray-700' }),
        isExplicit: false
      };
    }
    return null;
  }, [formDefaultPaymentMethod, formDefaultAdvancer, formDefaultBearer]);

  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* Header Banner */}
      <div className="p-6 border-b border-gray-200 bg-linear-to-r from-slate-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#162D50] text-white rounded-lg shadow-xs">
                <Box className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#162D50]">案件カテゴリ管理</h2>
              <span className="text-xs bg-blue-100 text-[#162D50] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                経費設定
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
              案件登録や経費申請で利用される「経費の種類」「立替者カテゴリ」「負担先」および連動する自動入力ルールを管理します。
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncDefaultRules}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
              title="初期設定ルールを一括反映"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>標準ルール同期</span>
            </button>
            <button
              onClick={fetchOptions}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              <span>更新</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">経費の種類</p>
              <p className="text-lg font-bold text-gray-900">{expenseTypes.length} <span className="text-xs font-normal text-gray-500">項目</span></p>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">立替者カテゴリ</p>
              <p className="text-lg font-bold text-gray-900">{advancers.length} <span className="text-xs font-normal text-gray-500">項目</span></p>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex items-center space-x-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">負担先</p>
              <p className="text-lg font-bold text-gray-900">{bearers.length} <span className="text-xs font-normal text-gray-500">項目</span></p>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">自動連動設定済み</p>
              <p className="text-lg font-bold text-gray-900">
                {expenseTypes.filter(e => e.defaultAdvancerCategory || EXPENSE_RULES_MAPPING[e.value]?.advancerCategory).length}
                <span className="text-xs font-normal text-gray-500"> / {expenseTypes.length}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Bar & Controls */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setSubTab('expenseTypes')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              subTab === 'expenseTypes'
                ? 'bg-[#162D50] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            経費の種類 ({expenseTypes.length})
          </button>
          <button
            onClick={() => setSubTab('advancers')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              subTab === 'advancers'
                ? 'bg-[#162D50] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            立替者カテゴリ ({advancers.length})
          </button>
          <button
            onClick={() => setSubTab('bearers')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              subTab === 'bearers'
                ? 'bg-[#162D50] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            負担先 ({bearers.length})
          </button>
          <button
            onClick={() => setSubTab('rules')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              subTab === 'rules'
                ? 'bg-[#162D50] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            自動入力ルール一覧
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="名称・コードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {subTab !== 'rules' && (
            <button
              onClick={() => {
                const targetType = subTab === 'expenseTypes' ? 'ExpenseType' : subTab === 'advancers' ? 'AdvancerCategory' : 'BearingParty';
                openCreateModal(targetType);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-[#162D50] hover:bg-[#0f1f38] rounded-md transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新規追加</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 overflow-auto flex-1">
        {/* SUBTAB 1: 経費の種類 (Expense Types) */}
        {subTab === 'expenseTypes' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">表示名（日本語）</th>
                  <th className="py-3 px-4">システムコード</th>
                  <th className="py-3 px-4">デフォルト立替者</th>
                  <th className="py-3 px-4">デフォルト負担先</th>
                  <th className="py-3 px-4">自動判定支払タイプ</th>
                  <th className="py-3 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenseTypes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                      該当する経費の種類が見つかりません
                    </td>
                  </tr>
                ) : (
                  filteredExpenseTypes.map((item) => {
                    const staticRule = EXPENSE_RULES_MAPPING[item.value] || EXPENSE_RULES_MAPPING[item.label] || {};
                    const adv = item.defaultAdvancerCategory || staticRule.advancerCategory || '';
                    const bear = item.defaultBearingParty || staticRule.bearingParty || '';
                    const payMethod = item.defaultPaymentMethod || ((adv && bear) ? getPaymentMethod(adv, bear) : null);
                    const payMethodConfig = payMethod ? PAYMENT_METHOD_LABELS[payMethod] : null;

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{toJP(item.label)}</span>
                            {item.label !== toJP(item.label) && (
                              <span className="text-xs text-gray-400">({item.label})</span>
                            )}
                            {isOthers(item) && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                システム保護
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">
                          {item.value}
                        </td>
                        <td className="py-3 px-4">
                          {adv ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {toJP(adv)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">未設定</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {bear ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-800 border border-blue-200">
                              {toJP(bear)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">未設定</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {payMethodConfig ? (
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${payMethodConfig.color}`}>
                              {payMethodConfig.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-gray-600 hover:text-[#162D50] hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                              title="編集"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!isOthers(item) && (
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 2: 立替者カテゴリ (Advancers) */}
        {subTab === 'advancers' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">カテゴリ表示名（日本語）</th>
                  <th className="py-3 px-4">システムコード（Value）</th>
                  <th className="py-3 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAdvancers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 text-sm">
                      該当する立替者カテゴリが見つかりません
                    </td>
                  </tr>
                ) : (
                  filteredAdvancers.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{toJP(item.label)}</span>
                          {item.label !== toJP(item.label) && (
                            <span className="text-xs text-gray-400">({item.label})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">
                        {item.value}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-gray-600 hover:text-[#162D50] hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                            title="編集"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 3: 負担先 (Bearing Parties) */}
        {subTab === 'bearers' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">負担先表示名（日本語）</th>
                  <th className="py-3 px-4">システムコード（Value）</th>
                  <th className="py-3 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBearers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 text-sm">
                      該当する負担先が見つかりません
                    </td>
                  </tr>
                ) : (
                  filteredBearers.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{toJP(item.label)}</span>
                          {item.label !== toJP(item.label) && (
                            <span className="text-xs text-gray-400">({item.label})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">
                        {item.value}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-gray-600 hover:text-[#162D50] hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                            title="編集"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 4: 自動入力ルール一覧 (Rule Matrix) */}
        {subTab === 'rules' && (
          <div className="space-y-6">
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 text-xs sm:text-sm text-blue-900 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">自動連動の仕組み</p>
                <p className="mt-1 text-blue-800 leading-relaxed">
                  案件作成時にスタッフが「経費の種類」を選択すると、ここで定義された「立替者カテゴリ」と「負担先」が瞬時にフォームに自動反映され、それらに基づいて「支払処理タイプ（給与加算/控除/振込等）」が自動決定されます。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseTypes.map((item) => {
                const staticRule = EXPENSE_RULES_MAPPING[item.value] || EXPENSE_RULES_MAPPING[item.label] || {};
                const adv = item.defaultAdvancerCategory || staticRule.advancerCategory || '';
                const bear = item.defaultBearingParty || staticRule.bearingParty || '';
                const payMethod = item.defaultPaymentMethod || ((adv && bear) ? getPaymentMethod(adv, bear) : null);
                const payMethodConfig = payMethod ? PAYMENT_METHOD_LABELS[payMethod] : null;

                return (
                  <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                        <span className="font-bold text-[#162D50] text-sm">{toJP(item.label)}</span>
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>ルール編集</span>
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">立替者:</span>
                          <span className="font-semibold text-gray-800">{adv ? toJP(adv) : '未設定'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">負担先:</span>
                          <span className="font-semibold text-gray-800">{bear ? toJP(bear) : '未設定'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">支払処理:</span>
                      {payMethodConfig ? (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${payMethodConfig.color}`}>
                          {payMethodConfig.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">未連動</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Box className="w-5 h-5 text-[#162D50]" />
                <h3 className="text-base font-bold text-[#162D50]">
                  {modalMode === 'create' ? '新規カテゴリ項目を追加' : 'カテゴリ項目の編集'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  項目種別
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    formType === 'ExpenseType' ? '経費の種類 (ExpenseType)' :
                    formType === 'AdvancerCategory' ? '立替者カテゴリ (AdvancerCategory)' :
                    '負担先 (BearingParty)'
                  }
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md text-gray-600 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  表示名（日本語） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 駐車場代、通信費、宿泊手当など"
                  value={formLabel}
                  onChange={(e) => {
                    setFormLabel(e.target.value);
                    if (modalMode === 'create' && !formValue) {
                      setFormValue(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  識別コード（半角英数またはキー） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={modalMode === 'edit' && isOthers(editingItem)}
                  placeholder="例: Parking Fee, Communication"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] disabled:bg-gray-100 font-mono text-xs"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  システム内部や集計で使用される識別子です。
                </p>
              </div>

              {/* Expense Type specific default auto-fills */}
              {formType === 'ExpenseType' && (
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#162D50]">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>自動連動設定（選択時の既定値）</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        既定の立替者カテゴリ
                      </label>
                      <select
                        value={formDefaultAdvancer}
                        onChange={(e) => setFormDefaultAdvancer(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-white"
                      >
                        <option value="">自動選択なし（空欄）</option>
                        {advancers.map(adv => (
                          <option key={adv._id} value={adv.value}>{toJP(adv.label)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        既定の負担先
                      </label>
                      <select
                        value={formDefaultBearer}
                        onChange={(e) => setFormDefaultBearer(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-white"
                      >
                        <option value="">自動選択なし（空欄）</option>
                        {bearers.map(bear => (
                          <option key={bear._id} value={bear.value}>{toJP(bear.label)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      自動判定支払タイプ
                    </label>
                    <select
                      value={formDefaultPaymentMethod}
                      onChange={(e) => setFormDefaultPaymentMethod(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-white"
                    >
                      <option value="">自動判定（立替者・負担先から自動算出）</option>
                      <option value="salary_addition">給与に加算 (salary_addition)</option>
                      <option value="salary_deduction">給与控除 (salary_deduction)</option>
                      <option value="client_invoice">請求書発行・顧客へ請求 (client_invoice)</option>
                      <option value="direct_transfer">本人へ振込・銀行振込 (direct_transfer)</option>
                    </select>
                  </div>

                  {effectivePaymentMethod && (
                    <div className="mt-2 pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {formDefaultPaymentMethod ? '指定された支払処理タイプ:' : '連動する支払処理（自動判定）:'}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 rounded font-semibold border ${effectivePaymentMethod.color}`}>
                          {effectivePaymentMethod.label}
                        </span>
                        {effectivePaymentMethod.isExplicit && (
                          <span className="text-[10px] text-gray-400 font-medium">（個別指定）</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#162D50] hover:bg-[#0f1f38] rounded-md transition-colors shadow-xs cursor-pointer"
                >
                  {modalMode === 'create' ? '登録する' : '変更を保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}