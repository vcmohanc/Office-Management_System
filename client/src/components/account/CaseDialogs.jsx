import { useState } from 'react';
import { SETTLEMENT_METHODS, COLLECTION_METHODS } from '../../constants/expenseTypes';
import { PROCESS_STATUSES } from '../../constants/cases';

// すべてのダイアログで共通の枠。案件詳細のカードと同じ配色・角丸に揃えている。
export function DialogShell({ title, description, children, onClose, onSubmit, submitLabel = '保存', submitDisabled = false, error, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`bg-white border border-gray-200 rounded-md shadow-lg w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-[#162D50] text-lg font-bold">{title}</h3>
          {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-600">{error}</div>}
          {children}
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end items-center space-x-4 bg-gray-50 rounded-b-md">
          <button onClick={onClose} className="border border-gray-300 bg-white text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50">
            キャンセル
          </button>
          <button
            onClick={onSubmit}
            disabled={submitDisabled}
            className="bg-[#0A192F] text-white px-6 py-2 rounded-md font-bold hover:bg-[#162D50] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600';

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  );
}

export function TextField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <Field label={label}>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </Field>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

// §1-18 差戻し・取消の理由入力
export function ReasonDialog({ mode, onClose, onSubmit, error }) {
  const [reason, setReason] = useState('');
  const isReject = mode === 'reject';
  return (
    <DialogShell
      title={isReject ? '差戻し' : '取消'}
      description={isReject ? '申請者へ差し戻す理由を入力してください。' : '取消理由を入力してください。取消者と取消日時が記録されます。'}
      onClose={onClose}
      onSubmit={() => onSubmit(reason)}
      submitLabel={isReject ? '差し戻す' : '取り消す'}
      submitDisabled={!reason.trim()}
      error={error}
    >
      <Field label={isReject ? '差戻し理由' : '取消理由'}>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={isReject ? '例：添付書類（天引き誓約書）が未提出のため' : '例：重複登録のため'}
          className={inputClass}
        />
      </Field>
    </DialogShell>
  );
}

// §1-7 精算・回収処理の更新
export function ProcessDialog({ leg, process, onClose, onSubmit, error }) {
  const isSettlement = leg === 'settlement';
  const [form, setForm] = useState({
    method: process?.method || '',
    plannedOn: process?.plannedOn || '',
    plannedAmount: process?.plannedAmount ?? 0,
    processedAmount: process?.processedAmount ?? 0,
    targetMonth: process?.targetMonth || '',
    processedOn: process?.processedOn || '',
    status: process?.status || '未処理',
    note: process?.note || '',
  });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <DialogShell
      title={isSettlement ? '立替者への精算処理' : '費用負担先からの回収処理'}
      description="処理状態を「完了」にすると、処理日と処理担当者が自動で記録されます。"
      onClose={onClose}
      onSubmit={() => onSubmit({ ...form, plannedAmount: Number(form.plannedAmount), processedAmount: Number(form.processedAmount) })}
      error={error}
      wide
    >
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label={isSettlement ? '精算方法' : '回収方法'}
          value={form.method}
          onChange={(v) => set('method', v)}
          options={['', ...(isSettlement ? SETTLEMENT_METHODS : COLLECTION_METHODS)]}
        />
        <SelectField label="処理状態" value={form.status} onChange={(v) => set('status', v)} options={PROCESS_STATUSES} />
        <TextField label="処理予定額 (¥)" type="number" value={form.plannedAmount} onChange={(v) => set('plannedAmount', v)} />
        <TextField label="処理済み額 (¥)" type="number" value={form.processedAmount} onChange={(v) => set('processedAmount', v)} />
        <TextField label="対象月" value={form.targetMonth} onChange={(v) => set('targetMonth', v)} placeholder="2026年9月" />
        <TextField label="処理予定日" value={form.plannedOn} onChange={(v) => set('plannedOn', v)} placeholder="年/月/日" />
        <TextField label="処理日" value={form.processedOn} onChange={(v) => set('processedOn', v)} placeholder="完了時は自動入力" />
      </div>
      <Field label="備考">
        <textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} className={inputClass} />
      </Field>
    </DialogShell>
  );
}

// §1-12 派遣先請求・控除の更新
export function BillingDialog({ billing, onClose, onSubmit, error }) {
  const [form, setForm] = useState({ ...billing });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <DialogShell
      title="派遣先請求・控除"
      description="請求書への表示内容と処理状態を更新します。"
      onClose={onClose}
      onSubmit={() => onSubmit({ ...form, amount: Number(form.amount) })}
      error={error}
      wide
    >
      <div className="grid grid-cols-2 gap-4">
        <TextField label="対象請求月" value={form.month} onChange={(v) => set('month', v)} placeholder="2026年9月" />
        <TextField label="対象スタッフ" value={form.staff} onChange={(v) => set('staff', v)} />
        <TextField label="費用種別" value={form.type} onChange={(v) => set('type', v)} />
        <SelectField label="区分" value={form.kind} onChange={(v) => set('kind', v)} options={['請求', '控除']} />
        <TextField label="請求額・控除額 (¥)" type="number" value={form.amount} onChange={(v) => set('amount', v)} />
        <SelectField label="処理状態" value={form.status} onChange={(v) => set('status', v)} options={['未処理', '処理中', '完了']} />
        <TextField label="処理日" value={form.processedOn} onChange={(v) => set('processedOn', v)} placeholder="完了時は自動入力" />
      </div>
      <TextField label="控除理由" value={form.reason} onChange={(v) => set('reason', v)} />
      <TextField label="請求書への表示内容" value={form.display} onChange={(v) => set('display', v)} />
      <Field label="備考">
        <textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} className={inputClass} />
      </Field>
    </DialogShell>
  );
}

// §1-11 退職時の給与天引き管理
export function ResignationDialog({ resignation, onClose, onSubmit, error }) {
  const [form, setForm] = useState({
    consentedOn: resignation?.consentedOn || '',
    pledgeAttached: resignation?.pledgeAttached ?? false,
    confirmedBy: resignation?.confirmedBy || '',
    recoverableFromFinalSalary: resignation?.recoverableFromFinalSalary ?? true,
    uncollectableAmount: resignation?.uncollectableAmount ?? 0,
    followUp: resignation?.followUp || '',
    note: resignation?.note || '',
  });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <DialogShell
      title="退職時の給与天引き管理"
      description="天引き誓約書を添付書類として登録すると、誓約書の有無は自動で反映されます。"
      onClose={onClose}
      onSubmit={() => onSubmit({ ...form, uncollectableAmount: Number(form.uncollectableAmount) })}
      error={error}
      wide
    >
      <div className="grid grid-cols-2 gap-4">
        <TextField label="本人同意日" value={form.consentedOn} onChange={(v) => set('consentedOn', v)} placeholder="年/月/日" />
        <TextField label="確認者" value={form.confirmedBy} onChange={(v) => set('confirmedBy', v)} />
        <Field label="最終給与で回収可能か">
          <select
            value={form.recoverableFromFinalSalary ? '回収可能' : '回収不可'}
            onChange={(e) => set('recoverableFromFinalSalary', e.target.value === '回収可能')}
            className={inputClass}
          >
            <option>回収可能</option>
            <option>回収不可</option>
          </select>
        </Field>
        <TextField
          label="最終給与で回収できない金額 (¥)"
          type="number"
          value={form.uncollectableAmount}
          onChange={(v) => set('uncollectableAmount', v)}
        />
      </div>
      <Field label="未回収時の対応">
        <textarea rows={2} value={form.followUp} onChange={(e) => set('followUp', e.target.value)} className={inputClass} />
      </Field>
      <Field label="備考">
        <textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} className={inputClass} />
      </Field>
    </DialogShell>
  );
}

// §1-17 案件の編集（変更した項目は §1-21 の履歴に変更前・変更後が残る）
export function EditCaseDialog({ caseData, onClose, onSubmit, error }) {
  const [form, setForm] = useState({
    occurredOn: caseData.occurredOn || '',
    amount: caseData.amount ?? 0,
    reason: caseData.reason || '',
    detail: caseData.detail || '',
    note: caseData.note || '',
  });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <DialogShell
      title={`案件の編集 — ${caseData.id}`}
      description="変更した項目は、変更前・変更後が操作履歴に記録されます。"
      onClose={onClose}
      onSubmit={() => onSubmit({ ...form, amount: Number(form.amount) })}
      error={error}
      wide
    >
      <div className="grid grid-cols-2 gap-4">
        <TextField label="発生日・利用日" value={form.occurredOn} onChange={(v) => set('occurredOn', v)} placeholder="年/月/日" />
        <TextField label="金額 (¥)" type="number" value={form.amount} onChange={(v) => set('amount', v)} />
      </div>
      <TextField label="理由" value={form.reason} onChange={(v) => set('reason', v)} />
      <Field label="内容">
        <textarea rows={2} value={form.detail} onChange={(e) => set('detail', e.target.value)} className={inputClass} />
      </Field>
      <Field label="備考">
        <textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} className={inputClass} />
      </Field>
    </DialogShell>
  );
}
