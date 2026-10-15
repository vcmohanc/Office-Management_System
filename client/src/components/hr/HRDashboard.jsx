import React, { useState, useEffect, useMemo } from 'react';
import {
  Building, UserCheck, AlertTriangle, Users, Handshake,
  ChevronDown, Eye, Edit, Search, Filter, Download, Printer,
  X, Calendar, Briefcase, Hash, Clock, Building2, MapPin,
  Phone, Mail, FileText, ShieldCheck, RefreshCw, Link2,
  BellRing, EyeOff,
} from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',
];

// Read onboarding status from either English or Japanese field name (DB compat)
const getEmpStatus = (emp) => emp.onboardingStatus || emp['onboardingステータス'] || 'Active';

const STATUS_CONFIG = {
  'Active':               { label: 'アクティブ',   dot: 'bg-green-500', pill: 'bg-green-100 text-green-700 border-green-200',  card: 'border-green-300 bg-green-50 text-green-700' },
  'Verification 保留中':  { label: '確認保留中',    dot: 'bg-amber-400', pill: 'bg-amber-100 text-amber-700 border-amber-200',  card: 'border-amber-300 bg-amber-50 text-amber-700' },
  'Verification Pending': { label: '確認保留中',    dot: 'bg-amber-400', pill: 'bg-amber-100 text-amber-700 border-amber-200',  card: 'border-amber-300 bg-amber-50 text-amber-700' },
  'Missing Pledges':      { label: '誓約書未提出',  dot: 'bg-red-500',   pill: 'bg-red-100 text-red-700 border-red-200',        card: 'border-red-300 bg-red-50 text-red-700' },
  '拒否':                 { label: '拒否',          dot: 'bg-red-400',   pill: 'bg-red-50 text-red-500 border-red-100',         card: 'border-red-200 bg-red-50 text-red-500' },
};

const STATUS_OPTIONS = [
  { value: 'Active',              label: 'アクティブ',   dotClass: 'bg-green-500' },
  { value: 'Verification 保留中', label: '確認保留中',    dotClass: 'bg-amber-400' },
  { value: 'Missing Pledges',     label: '誓約書未提出',  dotClass: 'bg-red-500'   },
  { value: '拒否',                label: '拒否',          dotClass: 'bg-red-400'   },
];

const B2B_STATUS_PILL = {
  'Active':       'bg-green-100 text-green-700',
  'Pending':      'bg-yellow-100 text-yellow-700',
  'Expiring Soon':'bg-orange-100 text-orange-700',
  'Terminated':   'bg-gray-100 text-gray-500',
};

const OFFICE_DEPARTMENTS = [
  'HR', 'HR / Recruitment', 'HR / Administration',
  'IT', 'IT / Technical', 'Audit & Compliance',
  'Operations', 'Payroll', 'Management',
];

const isOffice = (dept) => OFFICE_DEPARTMENTS.some(d => dept.includes(d));
const isEmpOffice = (e) =>
  e.staffType === 'Office Staff' ||
  (Array.isArray(e.department) ? e.department.some(isOffice) : isOffice(e.department || ''));

export default function HRDashboard() {
  const [employees, setEmployees] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('All Staff');
  const [partnerFilter, setPartnerFilter] = useState(null); // null | 'unassigned' | partner._id

  const [viewStaff, setViewStaff] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newStatus, setNewStatus] = useState('Active');
  const [newWorkPlace, setNewWorkPlace] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExpiredVisa, setShowExpiredVisa] = useState(false);
  const [expiredAlertDismissed, setExpiredAlertDismissed] = useState(false);

  useEffect(() => { fetchStaff(); fetchPartners(); }, []);

  const fetchStaff = () => {
    setLoading(true);
    apiFetch('/api/employees')
      .then(r => r.json())
      .then(data => { setEmployees(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchPartners = () => {
    apiFetch('/api/b2b/engagements?limit=200')
      .then(r => r.json())
      .then(d => { if (d.data) setPartners(d.data); })
      .catch(() => {});
  };

  // Case-insensitive name match between assignedWorkPlace and partner_name
  const employeeMatchesPartner = (emp, partnerName) => {
    if (!Array.isArray(emp.assignedWorkPlace) || emp.assignedWorkPlace.length === 0) return false;
    const pn = partnerName.toLowerCase();
    return emp.assignedWorkPlace.some(wp => {
      const w = (wp || '').toLowerCase();
      return w && (w === pn || w.includes(pn) || pn.includes(w));
    });
  };

  const getLinkedPartner = (emp) => {
    if (!Array.isArray(emp.assignedWorkPlace) || emp.assignedWorkPlace.length === 0) return null;
    return partners.find(p => employeeMatchesPartner(emp, p.partner_name)) || null;
  };

  // ── Metrics ─────────────────────────────────────────────────────────────────
  const totalStaff  = employees.length;
  const hakenStaff  = employees.filter(e => !isEmpOffice(e)).length;
  const officeStaff = employees.filter(e => isEmpOffice(e)).length;
  const pendingCount = employees.filter(e => {
    const s = getEmpStatus(e);
    return s === 'Verification 保留中' || s === 'Verification Pending';
  }).length;
  const visaExpiredStaff = useMemo(() => employees.filter(e => {
    if (!e.visaEndDate) return false;
    return (new Date(e.visaEndDate) - Date.now()) / 86400000 < 0;
  }), [employees]);
  const visaExpiringSoon = employees.filter(e => {
    if (!e.visaEndDate) return false;
    const d = (new Date(e.visaEndDate) - Date.now()) / 86400000;
    return d >= 0 && d <= 90;
  }).length;
  const activeB2BCount = useMemo(() => partners.filter(p => p.status === 'Active').length, [partners]);

  // ── B2B Partner cards (haken staff per farm) ────────────────────────────────
  const partnerCards = useMemo(() =>
    partners
      .map(p => ({
        ...p,
        staffCount: employees.filter(e => !isEmpOffice(e) && employeeMatchesPartner(e, p.partner_name)).length,
      }))
      .filter(p => p.staffCount > 0)
      .sort((a, b) => b.staffCount - a.staffCount),
    [partners, employees]
  );

  const unassignedCount = useMemo(() =>
    employees.filter(e => !isEmpOffice(e) && (!e.assignedWorkPlace || e.assignedWorkPlace.every(w => !w))).length,
    [employees]
  );

  // ── Filtered list ────────────────────────────────────────────────────────────
  const isVisaExpired = (emp) => {
    if (!emp.visaEndDate) return false;
    return (new Date(emp.visaEndDate) - Date.now()) / 86400000 < 0;
  };

  const filteredEmployees = useMemo(() => employees.filter(emp => {
    // Hide expired-visa staff unless the toggle is on
    if (!showExpiredVisa && isVisaExpired(emp)) return false;

    const matchSearch =
      (emp.romajiName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.katakanaName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.staffId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.assignedWorkPlace || []).some(w => w.toLowerCase().includes(searchQuery.toLowerCase()));

    const empStatus = getEmpStatus(emp);
    const matchStatus = statusFilter === 'All' || empStatus === statusFilter;

    const matchTab =
      activeTab === 'All Staff' ||
      (activeTab === 'Office Staff' && isEmpOffice(emp)) ||
      (activeTab === 'Haken Staff' && !isEmpOffice(emp));

    let matchPartner = true;
    if (partnerFilter === 'unassigned') {
      matchPartner = !isEmpOffice(emp) && (!emp.assignedWorkPlace || emp.assignedWorkPlace.every(w => !w));
    } else if (partnerFilter) {
      const p = partners.find(pt => pt._id === partnerFilter);
      matchPartner = p ? employeeMatchesPartner(emp, p.partner_name) : true;
    }

    return matchSearch && matchStatus && matchTab && matchPartner;
  }), [employees, searchQuery, statusFilter, activeTab, partnerFilter, partners, showExpiredVisa]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getInitials = (emp) => {
    const name = emp.romajiName || emp.katakanaName || '';
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const getStatusBadge = (statusRaw) => {
    const cfg = STATUS_CONFIG[statusRaw] || { label: statusRaw || '不明', dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600 border-gray-200' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  const getVisaCell = (emp) => {
    if (!emp.visaEndDate) return <span className="text-xs text-gray-400">—</span>;
    const days = Math.ceil((new Date(emp.visaEndDate) - Date.now()) / 86400000);
    if (days < 0) return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">期限切れ</span>;
    if (days <= 30) return <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">⚠ {days}日</span>;
    if (days <= 90) return <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">⚡ {days}日</span>;
    return <span className="text-xs text-gray-500">{new Date(emp.visaEndDate).toLocaleDateString('ja-JP', { year: '2-digit', month: 'short', day: 'numeric' })}</span>;
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleEditClick = (emp) => {
    setSelectedStaff(emp);
    setNewStatus(getEmpStatus(emp));
    setNewWorkPlace((emp.assignedWorkPlace && emp.assignedWorkPlace[0]) || '');
    setIsEditOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/employees/${selectedStaff._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          onboardingStatus: newStatus,
          assignedWorkPlace: newWorkPlace ? [newWorkPlace] : [],
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEmployees(prev => prev.map(e => e._id === selectedStaff._id ? { ...e, ...updated } : e));
        setIsEditOpen(false);
        setSelectedStaff(null);
      }
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['S.N.', 'スタッフID', '氏名', '部署', '配属先', 'ビザ状況', 'ビザ期限', '入社日', 'ステータス'];
    const rows = filteredEmployees.map((emp, i) => [
      i + 1,
      emp.staffId ? emp.staffId.replace(/[#-]/g, '') : `STF${emp._id?.slice(-6).toUpperCase()}`,
      `"${emp.romajiName || emp.katakanaName || ''}"`,
      `"${Array.isArray(emp.department) ? emp.department.join(', ') : emp.department || ''}"`,
      `"${Array.isArray(emp.assignedWorkPlace) ? emp.assignedWorkPlace.filter(Boolean).join(', ') : ''}"`,
      emp.visaStatus || '',
      emp.visaEndDate ? new Date(emp.visaEndDate).toLocaleDateString() : '',
      emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '',
      getEmpStatus(emp),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `staff_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = () => {
    const pw = window.open('', '_blank');
    const esc = s => s == null ? 'N/A' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    pw.document.write(`<html><head><title>Staff Directory Report</title><style>
      body{font-family:'Times New Roman',serif;color:#000;margin:40px;line-height:1.5;}
      .header-wrapper{display:flex;align-items:center;justify-content:center;position:relative;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:30px;}
      .header-logo{position:absolute;left:0;top:0;height:50px;}
      h1{text-align:center;margin:0;font-size:24px;text-transform:uppercase;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th,td{border:1px solid #000;padding:7px 10px;text-align:left;}
      th{background:#f9f9f9;font-weight:bold;text-transform:uppercase;}
      .meta{display:flex;justify-content:space-between;margin-bottom:20px;font-style:italic;}
      .footer{text-align:center;margin-top:40px;font-size:12px;font-style:italic;}
    </style></head><body>
      <div class="header-wrapper">
        <img src="${window.location.origin}/vegeicon.png" class="header-logo" alt="Logo"/>
        <h1>Staff Directory Report</h1>
      </div>
      <div class="meta">
        <span>Category: <strong>${activeTab}</strong></span>
        <span>Generated: <strong>${new Date().toLocaleDateString()}</strong></span>
      </div>
      <table><thead><tr>
        <th>S.N.</th><th>ID</th><th>氏名</th><th>部署</th><th>配属先</th><th>ビザ</th><th>入社日</th><th>ステータス</th>
      </tr></thead><tbody>
        ${filteredEmployees.map((emp, i) => `<tr>
          <td>${i+1}</td>
          <td>${esc(emp.staffId ? emp.staffId.replace(/[#-]/g,'') : 'STF'+emp._id?.slice(-6).toUpperCase())}</td>
          <td>${esc(emp.romajiName || emp.katakanaName)}</td>
          <td>${esc(Array.isArray(emp.department) ? emp.department.join(', ') : emp.department)}</td>
          <td>${esc((emp.assignedWorkPlace||[]).filter(Boolean).join(', '))}</td>
          <td>${esc(emp.visaStatus)}</td>
          <td>${emp.joinDate ? esc(new Date(emp.joinDate).toLocaleDateString()) : 'N/A'}</td>
          <td>${esc(getEmpStatus(emp))}</td>
        </tr>`).join('')}
      </tbody></table>
      <div class="footer">- End of Report -</div>
    </body></html>`);
    pw.document.close();
    setTimeout(() => { pw.print(); pw.close(); }, 250);
  };

  const TABS = [
    { key: 'All Staff',    label: '全スタッフ',   count: employees.length },
    { key: 'Haken Staff',  label: '派遣スタッフ', count: hakenStaff },
    { key: 'Office Staff', label: '内勤スタッフ', count: officeStaff },
  ];

  return (
    <div className="flex flex-col space-y-6 pb-10">

      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-r from-[#162D50] to-[#1e4080] rounded-2xl p-6 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-4 right-24 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 right-8 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">人材管理・採用</p>
            <h2 className="text-2xl font-bold text-white leading-tight">人事部門</h2>
            <p className="text-blue-200 text-sm mt-1">スタッフの在籍・配属・オンボーディング状況を管理します。</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchStaff} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 text-white text-sm hover:bg-white/10 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition-colors">
              <Download className="w-4 h-4" /><span>エクスポート</span>
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#162D50] text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm">
              <Printer className="w-4 h-4" /><span>印刷</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip (6 cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#162D50]/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#162D50]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#162D50]">{totalStaff}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">全スタッフ数</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#162D50]">{hakenStaff}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">派遣スタッフ</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#162D50]">{officeStaff}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">内勤スタッフ</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-[#162D50]'}`}>{pendingCount}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">確認保留中</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#162D50]">{activeB2BCount}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">B2Bパートナー</p>
          </div>
        </div>
        <div
          className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 cursor-pointer transition-all ${
            visaExpiredStaff.length > 0 ? 'border-red-200 hover:border-red-300' : 'border-gray-100'
          }`}
          onClick={() => { if (visaExpiredStaff.length > 0) { setShowExpiredVisa(v => !v); setExpiredAlertDismissed(false); } }}
          title={visaExpiredStaff.length > 0 ? 'クリックして期限切れスタッフを表示/非表示' : undefined}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${visaExpiredStaff.length > 0 ? 'bg-red-50' : visaExpiringSoon > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
            <ShieldCheck className={`w-5 h-5 ${visaExpiredStaff.length > 0 ? 'text-red-600' : visaExpiringSoon > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              {visaExpiredStaff.length > 0 && (
                <span className="text-2xl font-bold text-red-600">{visaExpiredStaff.length}</span>
              )}
              {visaExpiringSoon > 0 && (
                <span className={`font-bold ${visaExpiredStaff.length > 0 ? 'text-sm text-orange-400' : 'text-2xl text-orange-500'}`}>
                  {visaExpiredStaff.length > 0 ? `+${visaExpiringSoon}` : visaExpiringSoon}
                </span>
              )}
              {visaExpiredStaff.length === 0 && visaExpiringSoon === 0 && (
                <span className="text-2xl font-bold text-[#162D50]">0</span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
              {visaExpiredStaff.length > 0 ? '期限切れ / 間近' : 'ビザ期限間近'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Expired Visa Alert Banner ── */}
      {visaExpiredStaff.length > 0 && !expiredAlertDismissed && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <BellRing className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-red-800">
                ビザ期限切れ — {visaExpiredStaff.length}名のスタッフが対応必要です
              </p>
              <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">要対応</span>
            </div>
            <p className="text-xs text-red-600 mb-2">
              以下のスタッフのビザが失効しています。速やかに更新手続きを行ってください。
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visaExpiredStaff.slice(0, 6).map(emp => (
                <button
                  key={emp._id}
                  onClick={() => { setViewStaff(emp); }}
                  className="flex items-center gap-1.5 bg-white border border-red-200 hover:border-red-400 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {emp.romajiName || emp.katakanaName || 'N/A'}
                  <span className="text-red-400 font-normal">
                    {emp.visaEndDate ? `（${Math.abs(Math.ceil((new Date(emp.visaEndDate) - Date.now()) / 86400000))}日超過）` : ''}
                  </span>
                </button>
              ))}
              {visaExpiredStaff.length > 6 && (
                <span className="text-xs text-red-500 font-medium self-center">他{visaExpiredStaff.length - 6}名…</span>
              )}
            </div>
            <button
              onClick={() => { setShowExpiredVisa(true); setExpiredAlertDismissed(true); }}
              className="mt-2.5 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
            >
              名簿で期限切れスタッフを表示する →
            </button>
          </div>
          <button
            onClick={() => setExpiredAlertDismissed(true)}
            className="p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors shrink-0"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── B2B Farm Placement Panel ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link2 className="w-4 h-4 text-[#162D50]" />
            <h3 className="text-sm font-bold text-[#162D50]">B2Bファーム配置状況</h3>
            <span className="text-xs text-gray-400 font-normal">カードをクリックして絞り込み</span>
          </div>
          {partnerFilter && (
            <button onClick={() => setPartnerFilter(null)} className="text-xs text-[#162D50] hover:underline font-medium">
              絞り込みを解除
            </button>
          )}
        </div>
        <div className="p-4 flex gap-3 overflow-x-auto pb-5">
          {/* All */}
          <button
            onClick={() => setPartnerFilter(null)}
            className={`flex flex-col items-start p-4 rounded-xl border-2 min-w-[140px] shrink-0 transition-all ${
              partnerFilter === null ? 'border-[#162D50] bg-[#162D50]/5' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
            }`}
          >
            <p className="text-xs font-semibold text-gray-500 mb-2">全配属</p>
            <p className="text-2xl font-bold text-[#162D50]">{hakenStaff}</p>
            <p className="text-xs text-gray-400 mt-1">派遣スタッフ計</p>
          </button>

          {/* Per-partner cards */}
          {partnerCards.map(pc => (
            <button
              key={pc._id}
              onClick={() => setPartnerFilter(partnerFilter === pc._id ? null : pc._id)}
              className={`flex flex-col items-start p-4 rounded-xl border-2 min-w-[160px] shrink-0 transition-all text-left ${
                partnerFilter === pc._id ? 'border-[#162D50] bg-[#162D50]/5' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">{pc.partner_name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${B2B_STATUS_PILL[pc.status] || 'bg-gray-100 text-gray-500'}`}>
                  {pc.status === 'Active' ? '稼働中' : pc.status === 'Expiring Soon' ? '期限間近' : pc.status === 'Pending' ? '保留中' : pc.status}
                </span>
              </div>
              <p className="text-2xl font-bold text-[#162D50]">{pc.staffCount}</p>
              <p className="text-xs text-gray-400 mt-1 truncate w-full">{pc.industry}</p>
              {pc.contract_end_date && (() => {
                const d = Math.ceil((new Date(pc.contract_end_date) - Date.now()) / 86400000);
                return d <= 60 && d >= 0 ? (
                  <p className="text-xs text-orange-500 font-medium mt-1">契約{d}日後</p>
                ) : null;
              })()}
            </button>
          ))}

          {/* Unassigned */}
          {unassignedCount > 0 && (
            <button
              onClick={() => setPartnerFilter(partnerFilter === 'unassigned' ? null : 'unassigned')}
              className={`flex flex-col items-start p-4 rounded-xl border-2 min-w-[140px] shrink-0 transition-all ${
                partnerFilter === 'unassigned' ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50 hover:border-orange-200'
              }`}
            >
              <p className="text-xs font-semibold text-orange-500 mb-2">未配属</p>
              <p className="text-2xl font-bold text-orange-600">{unassignedCount}</p>
              <p className="text-xs text-gray-400 mt-1">配属先なし</p>
            </button>
          )}

          {partnerCards.length === 0 && (
            <div className="flex items-center justify-center w-full py-6 text-sm text-gray-400">
              配属データがありません。スタッフの配属先を設定してください。
            </div>
          )}
        </div>
      </div>

      {/* ── Staff Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Handshake className="w-5 h-5 text-[#162D50]" />
            <h3 className="text-base font-bold text-[#162D50]">スタッフ名簿</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#162D50]/10 text-[#162D50] text-xs font-semibold">{filteredEmployees.length}</span>
            {visaExpiredStaff.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                <EyeOff className="w-3 h-3" />
                期限切れ {visaExpiredStaff.length}名 非表示
              </span>
            )}
            {partnerFilter && partnerFilter !== 'unassigned' && (() => {
              const p = partners.find(pt => pt._id === partnerFilter);
              return p ? <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">{p.partner_name}</span> : null;
            })()}
            {partnerFilter === 'unassigned' && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold">未配属</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="名前・ID・配属先で検索..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#162D50]/30 w-48"
              />
            </div>
            <div className="relative">
              <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="pl-8 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-[#162D50]/30 bg-white"
              >
                <option value="All">すべてのステータス</option>
                <option value="Active">アクティブ</option>
                <option value="Verification 保留中">確認保留中</option>
                <option value="Missing Pledges">誓約書未提出</option>
                <option value="拒否">拒否</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {visaExpiredStaff.length > 0 && (
              <button
                onClick={() => setShowExpiredVisa(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  showExpiredVisa
                    ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
                }`}
              >
                {showExpiredVisa ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showExpiredVisa ? '期限切れ非表示' : `期限切れ表示 (${visaExpiredStaff.length})`}</span>
              </button>
            )}
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" /><span>CSV</span>
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#162D50] text-white rounded-lg text-xs font-medium hover:bg-[#0f1f38] transition-colors">
              <Printer className="w-3.5 h-3.5" /><span>印刷</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-6 pt-1 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPartnerFilter(null); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key ? 'border-[#162D50] text-[#162D50]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.key ? 'bg-[#162D50]/10 text-[#162D50]' : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-10">S.N.</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">スタッフID</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">氏名 / 配属先</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">部署</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">ビザ期限</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">オンボーディング</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">アクション</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[10,20,36,24,16,20,12].map((w, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className={`h-3 w-${w} rounded bg-gray-200 animate-pulse`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Users className="w-10 h-10 text-gray-200" />
                      <p className="text-sm font-medium">スタッフの記録が見つかりません。</p>
                      {(searchQuery || statusFilter !== 'All' || partnerFilter) && (
                        <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); setPartnerFilter(null); }} className="text-xs text-[#162D50] hover:underline">
                          絞り込みをリセット
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  const avatarClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const initials = getInitials(emp);
                  const linkedPartner = getLinkedPartner(emp);
                  const workplace = Array.isArray(emp.assignedWorkPlace) ? emp.assignedWorkPlace.filter(Boolean)[0] : null;
                  const expired = isVisaExpired(emp);
                  return (
                    <tr key={emp._id} className={`border-b transition-colors ${expired ? 'bg-red-50/60 border-red-100 hover:bg-red-50' : 'border-gray-100 bg-white hover:bg-gray-50/70'}`}>
                      <td className="py-3.5 px-4 text-gray-400 text-sm">{index + 1}</td>
                      <td className="py-3.5 px-4 text-gray-500 font-medium text-sm font-mono">
                        {emp.staffId ? emp.staffId.replace(/[#-]/g, '') : `STF${emp._id?.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarClass}`}>
                            {initials}
                          </span>
                          <div>
                            <p className="font-semibold text-[#162D50] text-sm leading-snug">
                              {emp.romajiName || emp.katakanaName || 'N/A'}
                            </p>
                            {workplace ? (
                              <p className="text-xs flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className={`font-medium ${linkedPartner ? 'text-indigo-600' : 'text-gray-400'}`}>
                                  {workplace}
                                </span>
                                {linkedPartner && (
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${B2B_STATUS_PILL[linkedPartner.status] || 'bg-gray-100 text-gray-500'}`}>
                                    {linkedPartner.status === 'Active' ? '稼働中' : linkedPartner.status === 'Expiring Soon' ? '期限間近' : linkedPartner.status}
                                  </span>
                                )}
                              </p>
                            ) : !isEmpOffice(emp) ? (
                              <p className="text-xs text-orange-400 mt-0.5">配属先未設定</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs hidden md:table-cell">
                        {Array.isArray(emp.department) ? emp.department.join(', ') : emp.department || '—'}
                      </td>
                      <td className="py-3.5 px-4 hidden lg:table-cell">{getVisaCell(emp)}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(getEmpStatus(emp))}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => setViewStaff(emp)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="詳細を見る"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(emp)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="編集"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Modal ── */}
      {viewStaff && (() => {
        const linkedPartner = getLinkedPartner(viewStaff);
        const workplace = Array.isArray(viewStaff.assignedWorkPlace) ? viewStaff.assignedWorkPlace.filter(Boolean)[0] : null;
        const daysLeft = viewStaff.visaEndDate
          ? Math.ceil((new Date(viewStaff.visaEndDate) - Date.now()) / 86400000)
          : null;
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#162D50] to-[#1e4080] px-6 py-5 overflow-hidden shrink-0">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute top-2 right-16 w-12 h-12 rounded-full bg-white/5" />
                <div className="flex items-start justify-between relative">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${AVATAR_COLORS[0]}`}>
                      {getInitials(viewStaff)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{viewStaff.romajiName || viewStaff.katakanaName || 'N/A'}</h3>
                      <p className="text-blue-200 text-xs mt-0.5">{viewStaff.katakanaName}</p>
                      <div className="mt-1.5">{getStatusBadge(getEmpStatus(viewStaff))}</div>
                    </div>
                  </div>
                  <button onClick={() => setViewStaff(null)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1">
                {/* Basic Info */}
                <div className="p-5 space-y-0">
                  {[
                    { icon: <Hash className="w-3.5 h-3.5" />, label: 'スタッフID', value: viewStaff.staffId ? viewStaff.staffId.replace(/[#-]/g,'') : `STF${viewStaff._id?.slice(-6).toUpperCase()}` },
                    { icon: <Briefcase className="w-3.5 h-3.5" />, label: 'スタッフ種別', value: viewStaff.staffType || '—' },
                    { icon: <Building className="w-3.5 h-3.5" />, label: '部署', value: Array.isArray(viewStaff.department) ? viewStaff.department.join(', ') : viewStaff.department || '—' },
                    { icon: <Calendar className="w-3.5 h-3.5" />, label: '入社日', value: viewStaff.joinDate ? new Date(viewStaff.joinDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                    ...(viewStaff.phone ? [{ icon: <Phone className="w-3.5 h-3.5" />, label: '電話', value: viewStaff.phone }] : []),
                    ...(viewStaff.email ? [{ icon: <Mail className="w-3.5 h-3.5" />, label: 'メール', value: viewStaff.email }] : []),
                    { icon: <Clock className="w-3.5 h-3.5" />, label: '登録日', value: viewStaff.createdAt ? new Date(viewStaff.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 gap-4">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 shrink-0">{row.icon}{row.label}</span>
                      <span className="text-sm text-gray-800 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Visa Info */}
                {(viewStaff.visaStatus || viewStaff.visaEndDate) && (
                  <div className={`mx-5 mb-4 rounded-xl border p-4 ${daysLeft !== null && daysLeft <= 90 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />ビザ情報
                    </p>
                    <div className="space-y-1.5">
                      {viewStaff.visaStatus && (
                        <div className="flex justify-between text-sm">
                          <span className="text-xs text-gray-500">ビザ種別</span>
                          <span className="text-xs font-medium text-gray-700">{viewStaff.visaStatus}</span>
                        </div>
                      )}
                      {viewStaff.visaEndDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">有効期限</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-700">{new Date(viewStaff.visaEndDate).toLocaleDateString('ja-JP')}</span>
                            {daysLeft !== null && (
                              daysLeft < 0 ? <span className="text-xs font-bold text-red-600">期限切れ</span>
                              : daysLeft <= 30 ? <span className="text-xs font-bold text-red-500">⚠ あと{daysLeft}日</span>
                              : daysLeft <= 90 ? <span className="text-xs font-semibold text-orange-500">⚡ あと{daysLeft}日</span>
                              : <span className="text-xs text-green-600">あと{daysLeft}日</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* B2B Partner Section */}
                <div className="mx-5 mb-5 rounded-xl border overflow-hidden">
                  <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <p className="text-xs font-bold text-indigo-700">B2Bパートナー / 配属先</p>
                  </div>
                  {linkedPartner ? (
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#162D50]">{linkedPartner.partner_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${B2B_STATUS_PILL[linkedPartner.status] || 'bg-gray-100 text-gray-500'}`}>
                          {linkedPartner.status === 'Active' ? '稼働中' : linkedPartner.status === 'Expiring Soon' ? '期限間近' : linkedPartner.status}
                        </span>
                      </div>
                      {[
                        { label: '業種', value: linkedPartner.industry },
                        { label: '担当者', value: linkedPartner.contact_name },
                        { label: 'メール', value: linkedPartner.contact_email, link: `mailto:${linkedPartner.contact_email}` },
                        { label: '電話', value: linkedPartner.contact_phone, link: `tel:${linkedPartner.contact_phone}` },
                        { label: '契約開始', value: linkedPartner.contract_start_date ? new Date(linkedPartner.contract_start_date).toLocaleDateString('ja-JP') : null },
                        { label: '契約終了', value: linkedPartner.contract_end_date ? new Date(linkedPartner.contract_end_date).toLocaleDateString('ja-JP') : null },
                      ].filter(r => r.value).map((row, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 w-14 shrink-0">{row.label}</span>
                          {row.link
                            ? <a href={row.link} className="text-xs text-blue-600 hover:underline truncate">{row.value}</a>
                            : <span className="text-xs text-gray-700 text-right truncate max-w-[200px]">{row.value}</span>
                          }
                        </div>
                      ))}
                    </div>
                  ) : workplace ? (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{workplace}</span>
                      </div>
                      <p className="text-xs text-gray-400">B2Bマスタに一致するパートナーが見つかりませんでした。</p>
                    </div>
                  ) : (
                    <div className="p-4 flex items-center justify-between">
                      <p className="text-xs text-gray-400">配属先が設定されていません</p>
                      <button
                        onClick={() => { setViewStaff(null); handleEditClick(viewStaff); }}
                        className="text-xs text-[#162D50] hover:underline font-semibold"
                      >
                        配属先を設定する
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                <button onClick={() => setViewStaff(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  閉じる
                </button>
                <button
                  onClick={() => { handleEditClick(viewStaff); setViewStaff(null); }}
                  className="px-4 py-2 text-sm font-semibold bg-[#162D50] hover:bg-[#0f1f38] text-white rounded-xl transition-colors"
                >
                  編集する
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Edit Modal ── */}
      {isEditOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#162D50] to-[#1e4080] px-6 py-5 overflow-hidden shrink-0">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="relative">
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-0.5">人事アクション</p>
                <h3 className="text-lg font-bold text-white">スタッフ情報の更新</h3>
                <p className="text-blue-200 text-sm mt-0.5">対象: {selectedStaff.romajiName || selectedStaff.katakanaName}</p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Onboarding Status */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">オンボーディングステータス</p>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map(opt => {
                    const cfg = STATUS_CONFIG[opt.value];
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          newStatus === opt.value ? `${cfg?.card || 'border-gray-200'} border-2` : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={opt.value}
                          checked={newStatus === opt.value}
                          onChange={() => setNewStatus(opt.value)}
                          className="sr-only"
                        />
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${newStatus === opt.value ? 'border-current bg-current' : 'border-gray-300'}`}>
                          {newStatus === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className={`flex items-center gap-2 text-sm font-semibold ${newStatus === opt.value ? (cfg?.card?.split(' ').find(c => c.startsWith('text-')) || 'text-gray-700') : 'text-gray-700'}`}>
                          <span className={`w-2 h-2 rounded-full ${opt.dotClass}`} />
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Workplace (B2B) */}
              {!isEmpOffice(selectedStaff) && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />配属先（B2Bパートナー）
                  </p>
                  <select
                    value={newWorkPlace}
                    onChange={e => setNewWorkPlace(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50]/30 bg-white"
                  >
                    <option value="">配属先なし</option>
                    {partners.map(p => (
                      <option key={p._id} value={p.partner_name}>
                        {p.partner_name} — {p.industry} ({p.status === 'Active' ? '稼働中' : p.status})
                      </option>
                    ))}
                  </select>
                  {newWorkPlace && partners.find(p => p.partner_name === newWorkPlace) && (() => {
                    const p = partners.find(pt => pt.partner_name === newWorkPlace);
                    return (
                      <div className={`mt-2 p-3 rounded-xl border text-xs ${B2B_STATUS_PILL[p.status] ? '' : ''} bg-indigo-50 border-indigo-100`}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#162D50]">{p.partner_name}</span>
                          <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${B2B_STATUS_PILL[p.status]}`}>{p.status}</span>
                        </div>
                        {p.industry && <p className="text-gray-500 mt-1">業種: {p.industry}</p>}
                        {p.contact_name && <p className="text-gray-500">担当: {p.contact_name}</p>}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-800">
                  <strong>注:</strong> 変更は即座にデータベースに保存されます。オンボーディングを「アクティブ」に設定すると、すべての確認手順と誓約書の提出が完了したことを意味します。
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#162D50] hover:bg-[#0f1f38]'}`}
              >
                {isSubmitting ? '保存中...' : '変更を保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
