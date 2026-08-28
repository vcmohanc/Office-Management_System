import { useState } from 'react';
import { Search, Edit2 } from 'lucide-react';
import {
  TARGET_CATEGORIES,
  COST_BEARER_CATEGORIES,
} from '../../constants/expenseTypes';
import { useExpenseTypes } from '../../hooks/useMasters';
import { createExpenseType, saveExpenseType } from '../../api/client';

const EMPTY_TYPE = {
  key: '',
  label: '',
  targetCategory: '',
  targetCategoryFixed: false,
  defaultCostBearer: '',
  standardProcess: '',
  enabled: true,
};

// §1-2 種別の追加・編集
function TypeDialog({ initial, isNew, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY_TYPE, ...initial });
  const [error, setError] = useState('');

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.key.trim() || !form.label.trim()) {
      setError('種別コードと種別名は必須です');
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-md shadow-lg w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-[#162D50] text-lg font-bold">{isNew ? '種別を追加' : '種別を編集'}</h3>
          <p className="text-gray-500 text-sm mt-1">対象区分・費用負担先の初期値は、案件登録時に自動で設定されます（変更可）。</p>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">種別コード</label>
              <input
                type="text"
                value={form.key}
                onChange={(e) => set('key', e.target.value)}
                readOnly={!isNew}
                placeholder="postage"
                className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 ${isNew ? '' : 'bg-gray-50'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">種別名</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => set('label', e.target.value)}
                placeholder="郵送費"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">対象区分（固定）</label>
              <select
                value={form.targetCategory || ''}
                onChange={(e) => set('targetCategory', e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
              >
                <option value="">案件ごとに選択</option>
                {TARGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">費用負担先（デフォルト）</label>
              <select
                value={form.defaultCostBearer || ''}
                onChange={(e) => set('defaultCostBearer', e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
              >
                <option value="">案件ごとに選択</option>
                {COST_BEARER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">標準処理</label>
            <input
              type="text"
              value={form.standardProcess}
              onChange={(e) => set('standardProcess', e.target.value)}
              placeholder="本人へ振込／給与天引き など"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
            />
          </div>
          <label className="flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.targetCategoryFixed}
              onChange={(e) => set('targetCategoryFixed', e.target.checked)}
              className="w-4 h-4 mr-2 accent-[#162D50]"
            /> 対象区分を固定する（案件登録時に変更できないようにする）
          </label>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end items-center space-x-4 bg-gray-50 rounded-b-md">
          <button onClick={onClose} className="border border-gray-300 bg-white text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50">
            キャンセル
          </button>
          <button onClick={submit} className="bg-[#0A192F] text-white px-6 py-2 rounded-md font-bold hover:bg-[#162D50] shadow-sm">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseTypeMaster() {
  const { types, setTypes, offline } = useExpenseTypes();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const filtered = types.filter((t) => t.label.includes(query) || t.key.includes(query));

  // §1-2 停止・再開
  const toggleEnabled = async (type) => {
    setError('');
    const nextEnabled = type.enabled === false;
    try {
      const updated = await saveExpenseType(type.key, { enabled: nextEnabled });
      setTypes((prev) => prev.map((t) => (t.key === type.key ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (form) => {
    const isNew = editing?.isNew;
    const saved = isNew ? await createExpenseType(form) : await saveExpenseType(form.key, form);
    setTypes((prev) => (isNew ? [...prev, saved] : prev.map((t) => (t.key === saved.key ? saved : t))));
    setEditing(null);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">種別マスタ管理</h2>
        <p className="text-gray-500 text-sm">立替案件で使用する費用種別の一覧です。管理者はここで種別の追加・編集・停止を行います。</p>
        {offline && (
          <p className="text-xs text-yellow-700 mt-2">サーバーに接続できないため、初期値を表示しています。変更は保存されません。</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-600 mb-4">{error}</div>
      )}

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="種別名で検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
        </div>
        <button
          onClick={() => setEditing({ isNew: true, value: EMPTY_TYPE })}
          className="bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap"
        >
          + 種別を追加
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">種別名</th>
                <th className="py-4 px-6">対象区分（固定）</th>
                <th className="py-4 px-6">費用負担先（デフォルト）</th>
                <th className="py-4 px-6">標準処理</th>
                <th className="py-4 px-6">状態</th>
                <th className="py-4 px-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.map((type) => {
                const isDisabled = type.enabled === false;
                return (
                  <tr key={type.key} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-bold text-gray-900">{type.label}</td>
                    <td className="py-4 px-6 text-gray-600">{type.targetCategory || '案件ごとに選択'}</td>
                    <td className="py-4 px-6 text-gray-600">{type.defaultCostBearer || '案件ごとに選択'}</td>
                    <td className="py-4 px-6 text-gray-600">{type.standardProcess}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleEnabled(type)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          isDisabled
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}
                      >
                        {isDisabled ? '停止中' : '有効'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setEditing({ isNew: false, value: type })}
                        className="text-gray-400 hover:text-[#162D50] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <TypeDialog
          initial={editing.value}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
