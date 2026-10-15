import React, { useState, useMemo } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';
import {
  X, Save, User, Globe, Briefcase, Heart, AlertCircle, Plus, Trash2,
  Camera, Phone, Mail, MapPin, Calendar, Shield, GraduationCap,
  Building2, CreditCard, Users, CheckCircle2, Clock, ChevronDown,
  Languages, Ruler, Weight, Shirt, Footprints,
} from 'lucide-react';
import { ALL_DEPARTMENTS } from '../../constants';

const TABS = [
  { id: '基本情報',    label: '基本情報',    icon: User },
  { id: '雇用・ビザ', label: '雇用・ビザ',  icon: Shield },
  { id: '学歴・職歴', label: '学歴・職歴',  icon: GraduationCap },
  { id: '語学・その他', label: '語学・その他', icon: Languages },
  { id: '緊急・銀行', label: '緊急・銀行',  icon: CreditCard },
];

const LANG_LEVELS = ['', 'ネイティブ', 'N1', 'N2', 'N3', 'N4', 'N5', '基礎'];
const EN_LEVELS   = ['', 'ネイティブ', '流暢', 'TOEIC900+', 'TOEIC730+', 'TOEIC600+', '中級', '基礎'];

const fmtDate = (d) => { try { return d ? new Date(d).toISOString().split('T')[0] : ''; } catch { return ''; } };
const calcAge = (dob) => {
  if (!dob) return null;
  const b = new Date(dob), n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
  return age;
};
const visaDaysLeft = (end) => {
  if (!end) return null;
  return Math.ceil((new Date(end) - new Date()) / 86400000);
};
const statusColors = {
  Active:              'bg-green-100 text-green-700',
  'Verification Pending': 'bg-yellow-100 text-yellow-700',
  'Missing Documents': 'bg-red-100 text-red-700',
};
const statusLabels = {
  Active: 'アクティブ',
  'Verification Pending': '確認保留中',
  'Missing Documents': '書類未提出',
};

// ── Reusable field components ─────────────────────────────────────────────────

const SectionHead = ({ icon: Icon, label, iconBg = 'bg-[#162D50]/10', iconColor = 'text-[#162D50]', optional }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
    </div>
    <h3 className="font-bold text-gray-800 text-sm">{label}</h3>
    <div className="flex-1 h-px bg-gray-100" />
    {optional && <span className="text-xs text-gray-400 flex-shrink-0">任意</span>}
  </div>
);

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors ${err ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

const selectCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162D50] transition-colors appearance-none';

// ── Main Component ────────────────────────────────────────────────────────────

export default function StaffEditModal({ employee, onClose, onEditComplete, initialTab = '基本情報' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(employee.photo || null);

  const [formData, setFormData] = useState({
    ...employee,
    department: Array.isArray(employee.department) ? employee.department : (employee.department ? [employee.department] : []),
    joinDate:        fmtDate(employee.joinDate),
    dob:             fmtDate(employee.dob),
    visaStartDate:   fmtDate(employee.visaStartDate),
    visaEndDate:     fmtDate(employee.visaEndDate),
    visaRenewalDate: fmtDate(employee.visaRenewalDate),
    phone:  employee.phone  || '',
    email:  employee.email  || '',
    address: employee.address || '',
    workingDays: (employee.workingDays || []).map(fmtDate).filter(Boolean),
    educationalQualifications: employee.educationalQualifications || [],
    workExperience: employee.workExperience || [],
    languageFluency: {
      english:  employee.languageFluency?.english  || '',
      japanese: employee.languageFluency?.japanese || '',
      other: {
        name:  employee.languageFluency?.other?.name  || '',
        level: employee.languageFluency?.other?.level || '',
      },
    },
    physicalAttributes: {
      height:       employee.physicalAttributes?.height       || '',
      weight:       employee.physicalAttributes?.weight       || '',
      clothingSize: employee.physicalAttributes?.clothingSize || '',
      shoeSize:     employee.physicalAttributes?.shoeSize     || '',
    },
    emergencyContact: {
      name:         employee.emergencyContact?.name         || '',
      phone:        employee.emergencyContact?.phone        || '',
      relationship: employee.emergencyContact?.relationship || '',
    },
    bankInfo: {
      bankName:      employee.bankInfo?.bankName      || '',
      branchName:    employee.bankInfo?.branchName    || '',
      accountNumber: employee.bankInfo?.accountNumber || '',
      accountType:   employee.bankInfo?.accountType   || '普通',
    },
  });

  const age       = useMemo(() => calcAge(formData.dob), [formData.dob]);
  const visaDays  = useMemo(() => visaDaysLeft(formData.visaEndDate), [formData.visaEndDate]);
  const tenure    = useMemo(() => {
    if (!formData.joinDate) return null;
    const days = Math.floor((new Date() - new Date(formData.joinDate)) / 86400000);
    if (days < 30) return `${days}日`;
    if (days < 365) return `${Math.floor(days / 30)}ヶ月`;
    return `${Math.floor(days / 365)}年${Math.floor((days % 365) / 30) > 0 ? `${Math.floor((days % 365) / 30)}ヶ月` : ''}`;
  }, [formData.joinDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nested = (cat, field, value) =>
    setFormData(prev => ({ ...prev, [cat]: { ...prev[cat], [field]: value } }));

  const otherLang = (field, value) =>
    setFormData(prev => ({ ...prev, languageFluency: { ...prev.languageFluency, other: { ...prev.languageFluency.other, [field]: value } } }));

  const toggleDept = (dept) =>
    setFormData(prev => ({
      ...prev,
      department: prev.department.includes(dept)
        ? prev.department.filter(d => d !== dept)
        : [...prev.department, dept],
    }));

  const addItem  = (f, def) => setFormData(prev => ({ ...prev, [f]: [...prev[f], def] }));
  const rmItem   = (f, i)   => setFormData(prev => ({ ...prev, [f]: prev[f].filter((_, idx) => idx !== i) }));
  const updItem  = (f, i, k, v) => setFormData(prev => {
    const arr = [...prev[f]];
    arr[i] = { ...arr[i], [k]: v };
    return { ...prev, [f]: arr };
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...formData, photo: photoPreview }),
      });
      if (!res.ok) throw new Error('Failed');
      const updated = await res.json();
      setSaved(true);
      setTimeout(() => { onEditComplete(updated); }, 800);
    } catch {
      setError('保存中にエラーが発生しました。再度お試しください。');
      setSaving(false);
    }
  };

  if (!employee) return null;

  const initials = (formData.romajiName || formData.katakanaName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const statusVal = formData.onboardingStatus || 'Active';

  // Visa bar colour
  const visaBarColor = visaDays === null ? 'bg-gray-300'
    : visaDays < 30 ? 'bg-red-500'
    : visaDays < 90 ? 'bg-orange-400'
    : 'bg-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden">

        {/* ── Hero Header ── */}
        <div className="bg-gradient-to-br from-[#162D50] via-[#1a3460] to-[#0f2040] px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative group w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/30 shadow-lg">
                {photoPreview ? (
                  <img src={photoPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">{initials}</div>
                )}
                <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>

              {/* Identity */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[statusVal] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[statusVal] || statusVal}
                  </span>
                  {formData.joiningType && (
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                      {formData.joiningType === 'Full-time' ? '正社員' : formData.joiningType === 'Part-time' ? 'アルバイト' : '契約社員'}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white leading-tight">{formData.romajiName || '—'}</h2>
                <p className="text-blue-200 text-sm">{formData.katakanaName || ''}</p>
              </div>
            </div>

            {/* Close */}
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-4 gap-1 mb-4">
            {[
              { label: 'スタッフID', value: `#${employee._id?.slice(-6).toUpperCase()}` },
              { label: '勤続期間',   value: tenure || '—' },
              { label: '年齢',       value: age !== null ? `${age}歳` : '—' },
              { label: '国籍',       value: formData.nationality || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl px-3 py-2 text-center">
                <p className="text-blue-300 text-xs">{label}</p>
                <p className="text-white font-bold text-sm mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-px">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === id
                    ? 'bg-white text-[#162D50]'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form id="editStaffForm" onSubmit={handleSubmit} noValidate>

            {/* ══ TAB: 基本情報 ══ */}
            <div className={`p-6 space-y-6 ${activeTab === '基本情報' ? '' : 'hidden'}`}>

              {/* Identity */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={User} label="氏名・連絡先" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="ローマ字氏名" required>
                    <input name="romajiName" value={formData.romajiName || ''} onChange={handleChange} className={inputCls()} placeholder="Yamada Taro" />
                  </Field>
                  <Field label="カタカナ氏名" required>
                    <input name="katakanaName" value={formData.katakanaName || ''} onChange={handleChange} className={inputCls()} placeholder="ヤマダ タロウ" />
                  </Field>
                  <Field label="電話番号">
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className={`${inputCls()} pl-10`} placeholder="090-0000-0000" />
                    </div>
                  </Field>
                  <Field label="メールアドレス">
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input name="email" type="email" value={formData.email} onChange={handleChange} className={`${inputCls()} pl-10`} placeholder="yamada@example.co.jp" />
                    </div>
                  </Field>
                  <Field label="住所" >
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input name="address" value={formData.address} onChange={handleChange} className={`${inputCls()} pl-10`} placeholder="東京都新宿区〇〇..." />
                    </div>
                  </Field>
                  <Field label="国籍">
                    <div className="relative">
                      <Globe className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input name="nationality" value={formData.nationality || ''} onChange={handleChange} className={`${inputCls()} pl-10`} placeholder="Vietnam" />
                    </div>
                  </Field>
                </div>
              </div>

              {/* Personal */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={Calendar} label="個人情報" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="生年月日">
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputCls()} />
                    {age !== null && <p className="text-xs text-[#162D50] font-semibold mt-1">現在 {age}歳</p>}
                  </Field>
                  <Field label="性別">
                    <div className="relative">
                      <select name="gender" value={formData.gender || ''} onChange={handleChange} className={selectCls}>
                        <option value="">選択してください</option>
                        <option value="Male">男性</option>
                        <option value="Female">女性</option>
                        <option value="Other">その他</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="入社日" required>
                    <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className={inputCls()} />
                    {tenure && <p className="text-xs text-[#162D50] font-semibold mt-1">勤続 {tenure}</p>}
                  </Field>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={CheckCircle2} label="ステータス" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                <Field label="オンボーディング状況">
                  <div className="grid grid-cols-3 gap-2">
                    {[['Active','アクティブ'],['Verification Pending','確認保留中'],['Missing Documents','書類未提出']].map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => handleChange({ target: { name: 'onboardingStatus', value: val } })}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${formData.onboardingStatus === val ? 'bg-[#162D50] text-white border-[#162D50]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Department */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={Building2} label="部署" optional iconBg="bg-purple-50" iconColor="text-purple-600" />
                <div className="flex flex-wrap gap-2">
                  {ALL_DEPARTMENTS.map((dept) => {
                    const active = formData.department.includes(dept);
                    return (
                      <button key={dept} type="button" onClick={() => toggleDept(dept)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-[#162D50] text-white border-[#162D50] shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                        {dept}
                      </button>
                    );
                  })}
                </div>
                {formData.department.length > 0 && (
                  <p className="text-xs text-gray-400 mt-3">選択中: {formData.department.join(' · ')}</p>
                )}
              </div>
            </div>

            {/* ══ TAB: 雇用・ビザ ══ */}
            <div className={`p-6 space-y-6 ${activeTab === '雇用・ビザ' ? '' : 'hidden'}`}>

              {/* Employment */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={Briefcase} label="雇用情報" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="雇用形態">
                    <div className="relative">
                      <select name="joiningType" value={formData.joiningType || ''} onChange={handleChange} className={selectCls}>
                        <option value="">選択してください</option>
                        <option value="Full-time">正社員</option>
                        <option value="Part-time">アルバイト・パート</option>
                        <option value="Contract">契約社員</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="スタッフ区分">
                    <div className="relative">
                      <select name="staffType" value={formData.staffType || ''} onChange={handleChange} className={selectCls}>
                        <option value="">選択してください</option>
                        <option value="Haken Staff">派遣スタッフ</option>
                        <option value="Direct Staff">直接スタッフ</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </Field>
                </div>
              </div>

              {/* Visa */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={Shield} label="ビザ情報" iconBg="bg-blue-50" iconColor="text-blue-600" />

                {/* Visa countdown */}
                {visaDays !== null && (
                  <div className={`mb-5 p-4 rounded-xl border ${visaDays < 30 ? 'bg-red-50 border-red-200' : visaDays < 90 ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">ビザ残日数</span>
                      <span className={`text-lg font-bold ${visaDays < 30 ? 'text-red-600' : visaDays < 90 ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {visaDays > 0 ? `${visaDays}日` : '期限切れ'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${visaBarColor}`}
                        style={{ width: `${Math.min(100, Math.max(2, (visaDays / 365) * 100))}%` }} />
                    </div>
                    {visaDays < 30 && visaDays > 0 && (
                      <p className="text-xs text-red-600 font-medium mt-2">⚠ 更新手続きが必要です</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="ビザステータス">
                    <div className="relative">
                      <select name="visaStatus" value={formData.visaStatus || ''} onChange={handleChange} className={selectCls}>
                        <option value="">選択してください</option>
                        <option value="Working Visa">就労ビザ</option>
                        <option value="Student Visa">学生ビザ</option>
                        <option value="Permanent Resident">永住者</option>
                        <option value="Dependent Visa">家族滞在ビザ</option>
                        <option value="Specified Skilled Worker">特定技能</option>
                        <option value="Technical Intern">技能実習</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </Field>
                  <div />
                  <Field label="ビザ開始日">
                    <input type="date" name="visaStartDate" value={formData.visaStartDate} onChange={handleChange} className={inputCls()} />
                  </Field>
                  <Field label="ビザ終了日">
                    <input type="date" name="visaEndDate" value={formData.visaEndDate} onChange={handleChange} className={inputCls()} />
                  </Field>
                  <Field label="ビザ更新日">
                    <input type="date" name="visaRenewalDate" value={formData.visaRenewalDate} onChange={handleChange} className={inputCls()} />
                  </Field>
                </div>
              </div>
            </div>

            {/* ══ TAB: 学歴・職歴 ══ */}
            <div className={`p-6 space-y-6 ${activeTab === '学歴・職歴' ? '' : 'hidden'}`}>

              {/* Education */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm">学歴</h3>
                  <div className="flex-1 h-px bg-gray-100" />
                  <button type="button" onClick={() => addItem('educationalQualifications', { passingYear: '', qualification: '', institution: '' })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#162D50] bg-[#162D50]/8 hover:bg-[#162D50]/15 px-3 py-1.5 rounded-full transition-colors">
                    <Plus className="w-3.5 h-3.5" /> 追加
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.educationalQualifications.map((edu, i) => (
                    <div key={i} className="grid grid-cols-[100px_1fr_2fr_auto] gap-3 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <input type="text" placeholder="年 (2022)" value={edu.passingYear}
                        onChange={e => updItem('educationalQualifications', i, 'passingYear', e.target.value)}
                        className={inputCls()} />
                      <input type="text" placeholder="学位・資格" value={edu.qualification}
                        onChange={e => updItem('educationalQualifications', i, 'qualification', e.target.value)}
                        className={inputCls()} />
                      <input type="text" placeholder="学校・機関名" value={edu.institution}
                        onChange={e => updItem('educationalQualifications', i, 'institution', e.target.value)}
                        className={inputCls()} />
                      <button type="button" onClick={() => rmItem('educationalQualifications', i)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.educationalQualifications.length === 0 && (
                    <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                      <GraduationCap className="w-8 h-8 opacity-40" />
                      <p className="text-sm">学歴が登録されていません</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Experience */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm">職歴</h3>
                  <div className="flex-1 h-px bg-gray-100" />
                  <button type="button" onClick={() => addItem('workExperience', { companyName: '', workPeriod: '', jobDescription: '' })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#162D50] bg-[#162D50]/8 hover:bg-[#162D50]/15 px-3 py-1.5 rounded-full transition-colors">
                    <Plus className="w-3.5 h-3.5" /> 追加
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.workExperience.map((exp, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input type="text" placeholder="会社名" value={exp.companyName}
                          onChange={e => updItem('workExperience', i, 'companyName', e.target.value)}
                          className={inputCls()} />
                        <input type="text" placeholder="勤務期間 (例: 2020年 - 2022年)" value={exp.workPeriod}
                          onChange={e => updItem('workExperience', i, 'workPeriod', e.target.value)}
                          className={inputCls()} />
                      </div>
                      <textarea placeholder="職務内容" value={exp.jobDescription} rows={2}
                        onChange={e => updItem('workExperience', i, 'jobDescription', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162D50] resize-none transition-colors" />
                      <button type="button" onClick={() => rmItem('workExperience', i)}
                        className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.workExperience.length === 0 && (
                    <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                      <Briefcase className="w-8 h-8 opacity-40" />
                      <p className="text-sm">職歴が登録されていません</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ══ TAB: 語学・その他 ══ */}
            <div className={`p-6 space-y-6 ${activeTab === '語学・その他' ? '' : 'hidden'}`}>

              {/* Language */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={Languages} label="語学力" iconBg="bg-sky-50" iconColor="text-sky-600" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="日本語レベル">
                    <div className="relative">
                      <select value={formData.languageFluency.japanese} onChange={e => nested('languageFluency', 'japanese', e.target.value)} className={selectCls}>
                        {LANG_LEVELS.map(l => <option key={l} value={l}>{l || '選択してください'}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="英語レベル">
                    <div className="relative">
                      <select value={formData.languageFluency.english} onChange={e => nested('languageFluency', 'english', e.target.value)} className={selectCls}>
                        {EN_LEVELS.map(l => <option key={l} value={l}>{l || '選択してください'}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="その他の言語">
                    <input type="text" value={formData.languageFluency.other.name} onChange={e => otherLang('name', e.target.value)} className={inputCls()} placeholder="例: 中国語、タガログ語" />
                  </Field>
                  <Field label="その他言語レベル">
                    <input type="text" value={formData.languageFluency.other.level} onChange={e => otherLang('level', e.target.value)} className={inputCls()} placeholder="例: 流暢、中級" />
                  </Field>
                </div>
              </div>

              {/* Physical */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={Ruler} label="身体情報" optional iconBg="bg-rose-50" iconColor="text-rose-500" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="身長 (cm)">
                    <div className="relative">
                      <Ruler className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="number" value={formData.physicalAttributes.height} onChange={e => nested('physicalAttributes', 'height', e.target.value)} className={`${inputCls()} pl-10`} placeholder="170" />
                    </div>
                  </Field>
                  <Field label="体重 (kg)">
                    <div className="relative">
                      <Weight className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="number" value={formData.physicalAttributes.weight} onChange={e => nested('physicalAttributes', 'weight', e.target.value)} className={`${inputCls()} pl-10`} placeholder="60" />
                    </div>
                  </Field>
                  <Field label="服のサイズ">
                    <div className="relative">
                      <Shirt className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="text" value={formData.physicalAttributes.clothingSize} onChange={e => nested('physicalAttributes', 'clothingSize', e.target.value)} className={`${inputCls()} pl-10`} placeholder="M" />
                    </div>
                  </Field>
                  <Field label="靴サイズ (cm)">
                    <div className="relative">
                      <Footprints className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="text" value={formData.physicalAttributes.shoeSize} onChange={e => nested('physicalAttributes', 'shoeSize', e.target.value)} className={`${inputCls()} pl-10`} placeholder="26.5" />
                    </div>
                  </Field>
                </div>
              </div>

              {/* Personality */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={Heart} label="性格・特記事項" optional iconBg="bg-pink-50" iconColor="text-pink-500" />
                <Field label="性格的特徴">
                  <textarea name="personality" value={formData.personality || ''} onChange={handleChange} rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162D50] resize-none transition-colors"
                    placeholder="例: フレンドリー、チームワークを大切にする、問題解決が得意..." />
                </Field>
              </div>
            </div>

            {/* ══ TAB: 緊急・銀行 ══ */}
            <div className={`p-6 space-y-6 ${activeTab === '緊急・銀行' ? '' : 'hidden'}`}>

              {/* Emergency Contact */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={Users} label="緊急連絡先" optional iconBg="bg-orange-50" iconColor="text-orange-500" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="氏名">
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="text" value={formData.emergencyContact.name} onChange={e => nested('emergencyContact', 'name', e.target.value)} className={`${inputCls()} pl-10`} placeholder="山田 花子" />
                    </div>
                  </Field>
                  <Field label="続柄">
                    <div className="relative">
                      <select value={formData.emergencyContact.relationship} onChange={e => nested('emergencyContact', 'relationship', e.target.value)} className={selectCls}>
                        <option value="">選択してください</option>
                        <option value="配偶者">配偶者</option>
                        <option value="親">親</option>
                        <option value="子">子</option>
                        <option value="兄弟姉妹">兄弟姉妹</option>
                        <option value="友人">友人</option>
                        <option value="その他">その他</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="電話番号">
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="tel" value={formData.emergencyContact.phone} onChange={e => nested('emergencyContact', 'phone', e.target.value)} className={`${inputCls()} pl-10`} placeholder="090-0000-0000" />
                    </div>
                  </Field>
                </div>
              </div>

              {/* Bank Info */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100">
                <SectionHead icon={CreditCard} label="銀行口座情報" optional iconBg="bg-teal-50" iconColor="text-teal-600" />
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">銀行口座情報は機密情報です。取り扱いに十分ご注意ください。</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="銀行名">
                    <input type="text" value={formData.bankInfo.bankName} onChange={e => nested('bankInfo', 'bankName', e.target.value)} className={inputCls()} placeholder="例: みずほ銀行" />
                  </Field>
                  <Field label="支店名">
                    <input type="text" value={formData.bankInfo.branchName} onChange={e => nested('bankInfo', 'branchName', e.target.value)} className={inputCls()} placeholder="例: 新宿支店" />
                  </Field>
                  <Field label="口座種別">
                    <div className="relative">
                      <select value={formData.bankInfo.accountType} onChange={e => nested('bankInfo', 'accountType', e.target.value)} className={selectCls}>
                        <option value="普通">普通</option>
                        <option value="当座">当座</option>
                        <option value="貯蓄">貯蓄</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="口座番号">
                    <input type="text" value={formData.bankInfo.accountNumber} onChange={e => nested('bankInfo', 'accountNumber', e.target.value)} className={inputCls()} placeholder="0000000" maxLength={8} />
                  </Field>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
            キャンセル
          </button>
          <button type="submit" form="editStaffForm" disabled={saving || saved}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#162D50] hover:bg-[#0f1f38] rounded-xl transition-colors shadow-sm disabled:opacity-60">
            {saved ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-300" />保存しました</>
            ) : saving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中…</>
            ) : (
              <><Save className="w-4 h-4" />変更を保存</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
