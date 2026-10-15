import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, FileSignature, FileText, TrendingUp, Handshake,
  Plus, ChevronDown, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, X, AlertTriangle, Calendar, Clock,
  Briefcase, Search, User, Mail, Phone, Globe, StickyNote,
  CheckCircle2, Flame, Minus, ArrowRight, BarChart2, MapPin,
} from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  '製造業', '建設業', 'IT・通信', '農業・林業', '食品加工',
  '介護・福祉', '流通・物流', 'サービス業', '飲食業', 'その他',
];

const STATUS_OPTIONS = [
  { value: 'Active',        label: 'アクティブ',   color: 'bg-green-100 text-green-700 border border-green-200',  dot: 'bg-green-400' },
  { value: 'Pending',       label: '保留中',        color: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-400' },
  { value: 'Expiring Soon', label: '期限切れ間近',  color: 'bg-red-100 text-red-600 border border-red-200',        dot: 'bg-red-400' },
  { value: 'Terminated',   label: '終了済み',       color: 'bg-gray-100 text-gray-600 border border-gray-200',     dot: 'bg-gray-400' },
];

const PRIORITY_OPTIONS = [
  { value: 'High',   label: '高',  icon: <Flame className="w-3.5 h-3.5" />,  bg: 'bg-red-50 text-red-600 border border-red-200',    activeBg: 'bg-red-500 text-white border-red-500' },
  { value: 'Medium', label: '中',  icon: <Minus className="w-3.5 h-3.5" />,  bg: 'bg-orange-50 text-orange-600 border border-orange-200', activeBg: 'bg-orange-500 text-white border-orange-500' },
  { value: 'Low',    label: '低',  icon: <ArrowRight className="w-3.5 h-3.5 rotate-90" />, bg: 'bg-blue-50 text-blue-600 border border-blue-200', activeBg: 'bg-blue-500 text-white border-blue-500' },
];

const INDUSTRY_ICONS = {
  '製造業': '🏭', '建設業': '🏗️', 'IT・通信': '💻', '農業・林業': '🌾',
  '食品加工': '🍱', '介護・福祉': '🏥', '流通・物流': '🚛', 'サービス業': '🛎️',
  '飲食業': '🍜', 'その他': '📦',
};

// Workplace category options — value matches the English key used in AssignWorkPlace matching
const WORKPLACE_CATEGORY_OPTIONS = [
  // Haken work places
  { value: 'Hotels',                        label: 'ホテル',          group: '派遣先' },
  { value: 'Food and Beverage',             label: '飲食',            group: '派遣先' },
  { value: 'Food and Beverage Manufacturing', label: '飲食製造',      group: '派遣先' },
  { value: 'Cleaning',                      label: '清掃',            group: '派遣先' },
  { value: 'Warehousing/Packaging',         label: '倉庫/梱包',       group: '派遣先' },
  { value: 'Telecommunications/Retail',     label: '通信/小売',       group: '派遣先' },
  { value: 'Registration Support',          label: '登録サポート',    group: '派遣先' },
  { value: 'Agriculture and Forestry',      label: '農林業',          group: '派遣先' },
  { value: 'Logistics',                     label: '物流',            group: '派遣先' },
  { value: 'Transfer to Headquarters',      label: '本社へ異動',      group: '派遣先' },
  // Office / department categories
  { value: '経営',          label: '経営',          group: '部門' },
  { value: '総務',          label: '総務',          group: '部門' },
  { value: '経理・財務',    label: '経理・財務',    group: '部門' },
  { value: '人事・採用',    label: '人事・採用',    group: '部門' },
  { value: '営業',          label: '営業',          group: '部門' },
  { value: 'マーケティング', label: 'マーケティング', group: '部門' },
  { value: 'IT・技術',      label: 'IT・技術',      group: '部門' },
  { value: 'カスタマーサポート', label: 'カスタマーサポート', group: '部門' },
  { value: '購買・調達',    label: '購買・調達',    group: '部門' },
  { value: 'オペレーション', label: 'オペレーション', group: '部門' },
];

const EMPTY_FORM = {
  partner_name: '', industry: '', priority: 'Medium', status: 'Active',
  contract_start_date: '', contract_end_date: '',
  monthly_revenue: '', contact_name: '', contact_email: '',
  contact_phone: '', website: '', notes: '', workplaceCategories: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getStatusConfig = (s) => STATUS_OPTIONS.find(o => o.value === s) || { label: s, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };

const formatCurrency = (v) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(v || 0);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const toInputDate = (d) => { try { return d ? new Date(d).toISOString().split('T')[0] : ''; } catch { return ''; } };

const contractDuration = (start, end) => {
  if (!start || !end) return null;
  const s = new Date(start), e = new Date(end);
  if (isNaN(s) || isNaN(e) || e <= s) return null;
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return months >= 12 ? `${Math.floor(months / 12)}年${months % 12 > 0 ? `${months % 12}ヶ月` : ''}` : `${months}ヶ月`;
};

const suggestStatus = (start, end) => {
  if (!end) return null;
  const today = new Date();
  const endDate = new Date(end);
  if (endDate < today) return 'Terminated';
  const daysLeft = Math.floor((endDate - today) / 86400000);
  if (daysLeft <= 30) return 'Expiring Soon';
  return null;
};

// ─── Partner Drawer Form ──────────────────────────────────────────────────────

function PartnerDrawer({ mode, partner, onClose, onSaved }) {
  const [formData, setFormData] = useState(
    mode === 'edit' && partner
      ? {
          partner_name: partner.partner_name || '',
          industry: partner.industry || '',
          priority: partner.priority || 'Medium',
          status: partner.status || 'Active',
          contract_start_date: toInputDate(partner.contract_start_date),
          contract_end_date: toInputDate(partner.contract_end_date),
          monthly_revenue: partner.monthly_revenue || '',
          contact_name: partner.contact_name || '',
          contact_email: partner.contact_email || '',
          contact_phone: partner.contact_phone || '',
          website: partner.website || '',
          notes: partner.notes || '',
          workplaceCategories: Array.isArray(partner.workplaceCategories) ? partner.workplaceCategories : [],
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const drawerRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  const toggleWorkplaceCategory = (val) => {
    setFormData(prev => {
      const cats = prev.workplaceCategories || [];
      return {
        ...prev,
        workplaceCategories: cats.includes(val) ? cats.filter(c => c !== val) : [...cats, val],
      };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.partner_name.trim()) errs.partner_name = 'パートナー名は必須です';
    if (!formData.industry) errs.industry = '業種を選択してください';
    if (!formData.status) errs.status = 'ステータスを選択してください';
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      errs.contact_email = '有効なメールアドレスを入力してください';
    }
    if (formData.contract_start_date && formData.contract_end_date &&
        new Date(formData.contract_end_date) <= new Date(formData.contract_start_date)) {
      errs.contract_end_date = '終了日は開始日より後に設定してください';
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    setServerError('');
    try {
      const body = {
        ...formData,
        monthly_revenue: Number(formData.monthly_revenue) || 0,
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
        workplaceCategories: formData.workplaceCategories || [],
      };
      const res = await apiFetch(
        mode === 'edit' ? `/api/b2b/partners/${partner._id}` : '/api/b2b/partners',
        { method: mode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      if (!res.ok) { const e = await res.json(); setServerError(e.message || '保存に失敗しました'); return; }
      onSaved();
    } catch { setServerError('ネットワークエラーが発生しました。'); }
    finally { setSubmitting(false); }
  };

  const duration = contractDuration(formData.contract_start_date, formData.contract_end_date);
  const statusSuggestion = suggestStatus(formData.contract_start_date, formData.contract_end_date);
  const annualRevenue = formData.monthly_revenue ? Number(formData.monthly_revenue) * 12 : 0;
  const industryIcon = INDUSTRY_ICONS[formData.industry] || '🏢';
  const priorityCfg = PRIORITY_OPTIONS.find(p => p.value === formData.priority);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* ── Drawer Header ── */}
        <div className="bg-gradient-to-r from-[#162D50] to-[#1e4080] px-6 py-5 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                {mode === 'add' ? '新規登録' : '情報編集'}
              </p>
              <h2 className="text-xl font-bold text-white">
                {mode === 'add' ? 'パートナー企業登録' : 'パートナー情報の更新'}
              </h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live preview card */}
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
                {industryIcon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {formData.partner_name || 'パートナー名を入力してください'}
                </p>
                <p className="text-blue-200 text-xs mt-0.5">{formData.industry || '業種未選択'}</p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                {priorityCfg && (
                  <span className="flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {priorityCfg.icon} {priorityCfg.label}優先度
                  </span>
                )}
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusConfig(formData.status).color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(formData.status).dot}`} />
                  {getStatusConfig(formData.status).label}
                </span>
              </div>
            </div>
            {annualRevenue > 0 && (
              <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                <span className="text-blue-200 text-xs">年間収益予測</span>
                <span className="text-white font-bold text-sm">{formatCurrency(annualRevenue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">

          {serverError && (
            <div className="mx-6 mt-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          {/* ── Section 1: 基本情報 ── */}
          <div className="px-6 pt-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#162D50]/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3.5 h-3.5 text-[#162D50]" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">基本情報</h3>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-4">
              {/* Partner Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  パートナー企業名 <span className="text-red-500">*</span>
                </label>
                <input
                  name="partner_name"
                  value={formData.partner_name}
                  onChange={handleChange}
                  placeholder="例: 株式会社〇〇ジャパン"
                  maxLength={100}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors ${
                    errors.partner_name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.partner_name
                    ? <p className="text-xs text-red-500">{errors.partner_name}</p>
                    : <span />}
                  <span className="text-xs text-gray-300">{formData.partner_name.length}/100</span>
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  業種 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">{industryIcon}</span>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className={`w-full appearance-none border rounded-xl pl-10 pr-10 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors ${
                      errors.industry ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">業種を選択してください</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{INDUSTRY_ICONS[ind]} {ind}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry}</p>}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">優先度</label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set('priority', p.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        formData.priority === p.value ? p.activeBg : p.bg + ' hover:opacity-80'
                      }`}
                    >
                      {p.icon} {p.label}優先度
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 1.5: 配属先カテゴリー ── */}
          <div className="px-6 pt-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">配属先カテゴリー</h3>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 flex-shrink-0">任意・複数選択可</span>
            </div>

            {(['派遣先', '部門']).map(group => {
              const opts = WORKPLACE_CATEGORY_OPTIONS.filter(o => o.group === group);
              return (
                <div key={group} className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {opts.map(opt => {
                      const active = (formData.workplaceCategories || []).includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleWorkplaceCategory(opt.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-[#162D50] text-white border-[#162D50] shadow-sm'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {(formData.workplaceCategories || []).length > 0 && (
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">選択中:</span>
                {formData.workplaceCategories.map(v => {
                  const opt = WORKPLACE_CATEGORY_OPTIONS.find(o => o.value === v);
                  return (
                    <span key={v} className="inline-flex items-center gap-1 bg-[#162D50]/10 text-[#162D50] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {opt ? opt.label : v}
                      <button type="button" onClick={() => toggleWorkplaceCategory(v)} className="ml-0.5 hover:text-red-500 transition-colors">×</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Section 2: 担当者情報 ── */}
          <div className="px-6 pt-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">担当者・連絡先情報</h3>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 flex-shrink-0">任意</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Contact Name */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">担当者名</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    placeholder="山田 太郎"
                    className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">電話番号</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="03-1234-5678"
                    type="tel"
                    className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors"
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">メールアドレス</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="contact@example.co.jp"
                    type="email"
                    className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors ${
                      errors.contact_email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                    }`}
                  />
                </div>
                {errors.contact_email && <p className="text-xs text-red-500 mt-1">{errors.contact_email}</p>}
              </div>

              {/* Website */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">ウェブサイト</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.example.co.jp"
                    type="url"
                    className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: 契約情報 ── */}
          <div className="px-6 pt-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <FileSignature className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">契約・収益情報</h3>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">契約開始日</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      name="contract_start_date"
                      value={formData.contract_start_date}
                      onChange={handleChange}
                      className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">契約終了日</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      name="contract_end_date"
                      value={formData.contract_end_date}
                      onChange={handleChange}
                      className={`w-full border rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors ${
                        errors.contract_end_date ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                      }`}
                    />
                  </div>
                  {errors.contract_end_date && <p className="text-xs text-red-500 mt-1">{errors.contract_end_date}</p>}
                </div>
              </div>

              {/* Contract duration + status suggestion */}
              {(duration || statusSuggestion) && (
                <div className="flex flex-wrap gap-2">
                  {duration && (
                    <div className="flex items-center gap-1.5 bg-[#162D50]/5 text-[#162D50] text-xs font-semibold px-3 py-1.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      契約期間: {duration}
                    </div>
                  )}
                  {statusSuggestion && statusSuggestion !== formData.status && (
                    <button
                      type="button"
                      onClick={() => set('status', statusSuggestion)}
                      className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      「{getStatusConfig(statusSuggestion).label}」に変更を推奨
                    </button>
                  )}
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  ステータス <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => set('status', s.value)}
                      className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        formData.status === s.value
                          ? 'bg-[#162D50] text-white border-[#162D50] shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${formData.status === s.value ? 'bg-white' : s.dot}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Revenue */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">月間収益（円）</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">¥</span>
                  <input
                    type="number"
                    name="monthly_revenue"
                    value={formData.monthly_revenue}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors"
                  />
                </div>
                {annualRevenue > 0 && (
                  <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    <span className="text-xs text-green-700 flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" /> 年間収益予測
                    </span>
                    <span className="text-xs font-bold text-green-700">{formatCurrency(annualRevenue)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 4: 備考 ── */}
          <div className="px-6 pt-6 pb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                <StickyNote className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">備考・メモ</h3>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 flex-shrink-0">任意</span>
            </div>
            <div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="社内メモ、特記事項、商談履歴など..."
                rows={4}
                maxLength={500}
                className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] resize-none transition-colors"
              />
              <p className="text-xs text-gray-300 text-right mt-1">{formData.notes.length}/500</p>
            </div>
          </div>
        </div>

        {/* ── Sticky Footer ── */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-[#162D50] hover:bg-[#0f1f38] text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中…</>
              : <><CheckCircle2 className="w-4 h-4" />{mode === 'add' ? 'パートナーを登録する' : '変更を保存する'}</>}
          </button>
        </div>
      </div>

      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function B2BDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [metrics, setMetrics] = useState({
    activePartnersCount: 0, ongoingContractsCount: 0,
    pendingProposalsCount: 0, expiringSoonCount: 0, totalMonthlyRevenue: 0,
  });
  const [engagements, setEngagements] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingEngagements, setLoadingEngagements] = useState(true);

  // Drawer / modal state
  const [drawerMode, setDrawerMode] = useState(null); // 'add' | 'edit'
  const [viewPartner, setViewPartner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // ─── Fetchers ───────────────────────────────────────────────────────────────

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try { const r = await apiFetch('/api/b2b/metrics'); if (r.ok) setMetrics(await r.json()); }
    catch { /* silent */ } finally { setLoadingMetrics(false); }
  };

  const fetchEngagements = async (page = 1) => {
    setLoadingEngagements(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) q.set('search', search);
      if (statusFilter) q.set('status', statusFilter);
      const r = await apiFetch(`/api/b2b/engagements?${q}`);
      if (r.ok) { const d = await r.json(); setEngagements(d.data || []); setPagination(d.pagination || {}); }
    } catch { /* silent */ } finally { setLoadingEngagements(false); }
  };

  useEffect(() => { fetchMetrics(); }, []);
  useEffect(() => { setCurrentPage(1); fetchEngagements(1); }, [search, statusFilter]);

  const handlePageChange = (p) => { setCurrentPage(p); fetchEngagements(p); };

  const onDrawerSaved = () => {
    setDrawerMode(null); setSelectedPartner(null);
    fetchMetrics(); fetchEngagements(drawerMode === 'edit' ? currentPage : 1);
  };

  const handleDelete = async () => {
    setSubmittingDelete(true);
    try {
      const r = await apiFetch(`/api/b2b/partners/${deleteTarget._id}`, { method: 'DELETE' });
      if (r.ok) { setDeleteTarget(null); fetchMetrics(); fetchEngagements(1); }
    } catch { /* silent */ } finally { setSubmittingDelete(false); }
  };

  const pageNumbers = () => {
    const total = pagination.totalPages || 1;
    return Array.from({ length: total }, (_, i) => i + 1)
      .filter(p => p === 1 || p === total || Math.abs(p - currentPage) <= 1)
      .reduce((acc, p, idx, arr) => {
        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
        acc.push(p); return acc;
      }, []);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#162D50] to-[#1e4080] rounded-2xl p-6 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 right-24 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 relative z-10">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">ビジネスパートナーシップ管理</p>
            <h2 className="text-2xl font-bold">B2B部門</h2>
            <p className="text-blue-200 text-sm mt-1">パートナー企業の契約・収益状況を一元管理します。</p>
          </div>
          <button
            onClick={() => { setSelectedPartner(null); setDrawerMode('add'); }}
            className="flex items-center gap-2 bg-white text-[#162D50] font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-all shadow-sm self-start flex-shrink-0"
          >
            <Plus className="w-4 h-4" />新規パートナー登録
          </button>
        </div>
      </div>

      {/* ALERT BANNER */}
      {!loadingMetrics && metrics.expiringSoonCount > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">契約期限が近いパートナーがあります</p>
            <p className="text-xs text-amber-700 mt-0.5">{metrics.expiringSoonCount}件の契約が期限切れ間近です。早めに更新手続きを行ってください。</p>
          </div>
        </div>
      )}

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'アクティブなパートナー', value: metrics.activePartnersCount, sub: '現在契約中', icon: <Building2 className="w-4 h-4 text-[#162D50]" />, bg: 'bg-[#162D50]/10', loading: loadingMetrics },
          { label: '進行中の契約', value: metrics.ongoingContractsCount, sub: '有効・期限間近', icon: <FileSignature className="w-4 h-4 text-blue-500" />, bg: 'bg-blue-50', loading: loadingMetrics },
          { label: '保留中の提案', value: metrics.pendingProposalsCount, sub: '承認待ち', icon: <FileText className="w-4 h-4 text-orange-500" />, bg: 'bg-orange-50', loading: loadingMetrics, warn: metrics.pendingProposalsCount > 0 },
          { label: '月間総収益', value: formatCurrency(metrics.totalMonthlyRevenue), sub: '全パートナー合計', icon: <TrendingUp className="w-4 h-4 text-green-500" />, bg: 'bg-green-50', loading: loadingMetrics, currency: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>{kpi.icon}</div>
            </div>
            <p className={`font-bold ${kpi.currency ? 'text-lg text-green-600 truncate' : 'text-2xl'} ${kpi.warn ? 'text-orange-500' : kpi.currency ? '' : 'text-gray-900'}`}>
              {kpi.loading ? <span className="text-gray-200 animate-pulse">—</span> : kpi.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Handshake className="w-4 h-4 text-[#162D50]" />
            <h3 className="font-bold text-gray-800 text-sm">B2Bパートナー一覧</h3>
            {!loadingEngagements && <span className="text-xs text-gray-400">({pagination.total}件)</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="名前・業種で検索"
                className="pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#162D50] w-40"
              />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#162D50] cursor-pointer">
                <option value="">すべてのステータス</option>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              onClick={() => { setSelectedPartner(null); setDrawerMode('add'); }}
              className="flex items-center gap-1.5 bg-[#162D50] hover:bg-[#0f1f38] text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />新規登録
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {['パートナー名', '業種', '担当者', '契約開始日', '契約終了日', '月間収益', 'ステータス', '操作'].map(h => (
                  <th key={h} className={`py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h === '操作' ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingEngagements
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[60, 40, 40, 52, 52, 40, 36, 52].map((w, j) => (
                        <td key={j} className="py-4 px-4"><div className={`h-3.5 bg-gray-100 rounded`} style={{ width: w }} /></td>
                      ))}
                    </tr>
                  ))
                : engagements.length === 0
                ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center">
                        <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-500">パートナーが見つかりません</p>
                        <p className="text-xs text-gray-400 mt-1">検索条件を変更するか、新規パートナーを登録してください。</p>
                        <button onClick={() => { setSelectedPartner(null); setDrawerMode('add'); }}
                          className="mt-4 inline-flex items-center gap-1.5 bg-[#162D50] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#0f1f38] transition-colors">
                          <Plus className="w-3.5 h-3.5" />新規パートナー登録
                        </button>
                      </td>
                    </tr>
                  )
                : engagements.map(p => {
                    const sc = getStatusConfig(p.status);
                    const industryIcon = INDUSTRY_ICONS[p.industry] || '📦';
                    return (
                      <tr key={p._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#162D50]/10 flex items-center justify-center flex-shrink-0 text-base">{industryIcon}</div>
                            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{p.partner_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-600 whitespace-nowrap">{p.industry}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-500 whitespace-nowrap">{p.contact_name || <span className="text-gray-300">—</span>}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(p.contract_start_date)}</td>
                        <td className="py-3.5 px-4 text-sm whitespace-nowrap">
                          {p.contract_end_date
                            ? <span className={p.status === 'Expiring Soon' ? 'text-red-500 font-semibold' : 'text-gray-600'}>{formatDate(p.contract_end_date)}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                          {p.monthly_revenue ? formatCurrency(p.monthly_revenue) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => setViewPartner(p)} title="詳細"
                              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => { setSelectedPartner(p); setDrawerMode('edit'); }} title="編集"
                              className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteTarget(p)} title="削除"
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {(pagination.totalPages || 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              全{pagination.total}件中 {((currentPage - 1) * 10) + 1}〜{Math.min(currentPage * 10, pagination.total)}件表示
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers().map((p, i) =>
                p === '…'
                  ? <span key={`e${i}`} className="px-1 text-gray-400 text-xs">…</span>
                  : <button key={p} onClick={() => handlePageChange(p)}
                      className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${currentPage === p ? 'bg-[#162D50] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                      {p}
                    </button>
              )}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === (pagination.totalPages || 1)}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Drawer ─── */}
      {drawerMode && (
        <PartnerDrawer
          mode={drawerMode}
          partner={selectedPartner}
          onClose={() => { setDrawerMode(null); setSelectedPartner(null); }}
          onSaved={onDrawerSaved}
        />
      )}

      {/* ─── VIEW MODAL ─── */}
      {viewPartner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#162D50] to-[#1e4080] px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
                    {INDUSTRY_ICONS[viewPartner.industry] || '🏢'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{viewPartner.partner_name}</h4>
                    <p className="text-blue-200 text-xs mt-0.5">{viewPartner.industry}</p>
                    <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusConfig(viewPartner.status).color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(viewPartner.status).dot}`} />
                      {getStatusConfig(viewPartner.status).label}
                    </span>
                  </div>
                </div>
                <button onClick={() => setViewPartner(null)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-0 max-h-[60vh] overflow-y-auto">
              {[
                { icon: <User className="w-3.5 h-3.5" />, label: '担当者', value: viewPartner.contact_name },
                { icon: <Mail className="w-3.5 h-3.5" />, label: 'メール', value: viewPartner.contact_email && <a href={`mailto:${viewPartner.contact_email}`} className="text-blue-600 hover:underline">{viewPartner.contact_email}</a> },
                { icon: <Phone className="w-3.5 h-3.5" />, label: '電話', value: viewPartner.contact_phone },
                { icon: <Globe className="w-3.5 h-3.5" />, label: 'ウェブサイト', value: viewPartner.website && <a href={viewPartner.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block">{viewPartner.website}</a> },
                { icon: <Calendar className="w-3.5 h-3.5" />, label: '契約開始日', value: formatDate(viewPartner.contract_start_date) },
                { icon: <Calendar className="w-3.5 h-3.5" />, label: '契約終了日', value: <span className={viewPartner.status === 'Expiring Soon' ? 'text-red-500 font-semibold' : ''}>{formatDate(viewPartner.contract_end_date)}</span> },
                { icon: <TrendingUp className="w-3.5 h-3.5" />, label: '月間収益', value: <span className="text-green-600 font-bold">{formatCurrency(viewPartner.monthly_revenue)}</span> },
                { icon: <BarChart2 className="w-3.5 h-3.5" />, label: '年間収益予測', value: <span className="text-green-600 font-bold">{formatCurrency((viewPartner.monthly_revenue || 0) * 12)}</span> },
                { icon: <Flame className="w-3.5 h-3.5" />, label: '優先度', value: PRIORITY_OPTIONS.find(p => p.value === viewPartner.priority)?.label + '優先度' || viewPartner.priority },
                { icon: <Clock className="w-3.5 h-3.5" />, label: '登録日', value: formatDate(viewPartner.createdAt) },
                ...(viewPartner.notes ? [{ icon: <StickyNote className="w-3.5 h-3.5" />, label: '備考', value: <span className="whitespace-pre-wrap text-xs">{viewPartner.notes}</span> }] : []),
              ].filter(r => r.value).map((row, i) => (
                <div key={i} className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0 gap-4">
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 flex-shrink-0">{row.icon}{row.label}</span>
                  <span className="text-sm text-gray-800 text-right">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setViewPartner(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                閉じる
              </button>
              <button
                onClick={() => { setSelectedPartner(viewPartner); setViewPartner(null); setDrawerMode('edit'); }}
                className="px-4 py-2 text-sm font-semibold bg-[#162D50] hover:bg-[#0f1f38] text-white rounded-lg transition-colors"
              >
                編集する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE MODAL ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">パートナーを削除しますか？</h3>
              <p className="text-sm text-gray-600 mb-1">「<span className="font-semibold">{deleteTarget.partner_name}</span>」</p>
              <p className="text-xs text-gray-400">この操作は取り消せません。</p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                キャンセル
              </button>
              <button onClick={handleDelete} disabled={submittingDelete}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50">
                {submittingDelete ? '削除中…' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
