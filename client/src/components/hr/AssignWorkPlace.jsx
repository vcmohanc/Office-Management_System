import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';

import {
  Search, MapPin, Building2, User, Phone, Mail, Calendar, CheckCircle2, X, Eye,
  ChevronDown, Users, Briefcase, Bed, Utensils, Factory, Brush, Package, Smartphone,
  Headphones, Tractor, Truck, ArrowRightLeft, ExternalLink, Globe, TrendingUp,
  AlertCircle, FileText, Clock, ArrowRight
} from 'lucide-react';

import { WORK_PLACES, OFFICE_DEPARTMENTS, ALL_DEPARTMENTS } from '../../constants';

const getIconForWorkPlace = (wp) => {
  switch (wp) {
    case 'Hotels': return Bed;
    case 'Food and Beverage': return Utensils;
    case 'Food and Beverage Manufacturing': return Factory;
    case 'Cleaning': return Brush;
    case 'Warehousing/Packaging': return Package;
    case 'Telecommunications/Retail': return Smartphone;
    case 'Registration Support': return Headphones;
    case 'Agriculture and Forestry': return Tractor;
    case 'Logistics': return Truck;
    case 'Transfer to Headquarters': return ArrowRightLeft;
    default: return Building2;
  }
};

const getColorForWorkPlace = (wp) => {
  switch (wp) {
    case 'Hotels': return 'text-indigo-500';
    case 'Food and Beverage': return 'text-orange-500';
    case 'Food and Beverage Manufacturing': return 'text-orange-600';
    case 'Cleaning': return 'text-teal-500';
    case 'Warehousing/Packaging': return 'text-purple-500';
    case 'Telecommunications/Retail': return 'text-sky-500';
    case 'Registration Support': return 'text-pink-500';
    case 'Agriculture and Forestry': return 'text-green-600';
    case 'Logistics': return 'text-yellow-600';
    case 'Transfer to Headquarters': return 'text-red-500';
    default: return 'text-blue-500';
  }
};

const OFFICE_LOCATIONS = [
  'Head Office Tsukiji Office', 'Harajuku Office', 'Osaka Office', 'Nagoya Office',
  'Chitose Office', 'Sapporo Office', 'Fukuoka Office', 'Kumamoto Office',
  'Kagoshima Office', 'Utsunomiya Office', 'Odawara Office', 'Narita Office',
  'Kasai Office', 'Gunma Office', 'Others'
];

const getPartnersForWorkPlaces = (workPlaceList, allPartners) => {
  if (!workPlaceList || workPlaceList.length === 0) return [];
  return allPartners.filter(p =>
    Array.isArray(p.workplaceCategories) &&
    workPlaceList.some(wp => p.workplaceCategories.includes(wp))
  );
};

export default function AssignWorkPlace() {
  const [employees, setEmployees] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mainCategory, setMainCategory] = useState('Haken');
  const [filterWorkPlace, setFilterWorkPlace] = useState('Unassigned');

  // Assignment modal state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [draftWorkPlaces, setDraftWorkPlaces] = useState([]);
  const [draftDepartments, setDraftDepartments] = useState([]);
  const [draftOffices, setDraftOffices] = useState([]);
  const [draftStaffType, setDraftStaffType] = useState('Haken Staff');
  const [draftAssignStartDate, setDraftAssignStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [draftPartnerName, setDraftPartnerName] = useState('');
  const [draftNotes, setDraftNotes] = useState('');

  // View modal state
  const [viewStaff, setViewStaff] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const includesValue = (field, value) => {
    if (!field) return false;
    if (Array.isArray(field)) return field.includes(value);
    return field === value;
  };

  useEffect(() => { fetchStaff(); fetchPartners(); }, []);

  const fetchStaff = () => {
    setLoading(true);
    apiFetch('/api/employees')
      .then(r => r.json())
      .then(data => { setEmployees(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchPartners = () => {
    setPartnersLoading(true);
    apiFetch('/api/b2b/engagements?limit=100')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.data || data.partners || data.engagements || []);
        setPartners(list);
        setPartnersLoading(false);
      })
      .catch(() => setPartnersLoading(false));
  };

  const matchedPartners = useMemo(() => {
    if (!filterWorkPlace || filterWorkPlace === 'All' || filterWorkPlace === 'Unassigned') return [];
    return getPartnersForWorkPlaces([filterWorkPlace], partners);
  }, [filterWorkPlace, partners]);

  const draftMatchedPartners = useMemo(() => {
    return draftWorkPlaces.length > 0 ? getPartnersForWorkPlaces(draftWorkPlaces, partners) : [];
  }, [draftWorkPlaces, partners]);

  // Office Staff: match partners by department category
  const draftMatchedPartnersOffice = useMemo(() => {
    if (draftStaffType !== 'Office Staff' || draftDepartments.length === 0) return [];
    return partners.filter(p =>
      Array.isArray(p.workplaceCategories) &&
      draftDepartments.some(d => p.workplaceCategories.includes(d))
    );
  }, [draftStaffType, draftDepartments, partners]);

  const handleAssignWorkPlace = async () => {
    if (!selectedStaff) return;
    setAssigning(true);
    setAssignError('');
    try {
      const payload = {
        assignedWorkPlace: draftWorkPlaces,
        department: draftDepartments,
        office: draftOffices,
        staffType: draftStaffType,
        onboardingStatus: 'Active',
        assignmentStartDate: draftAssignStartDate || new Date().toISOString().split('T')[0],
        assignedPartnerName: draftPartnerName,
        assignmentNotes: draftNotes,
      };
      const res = await apiFetch(`/api/employees/${selectedStaff._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEmployees(prev => prev.map(emp =>
          emp._id === selectedStaff._id ? { ...emp, ...payload } : emp
        ));
        setAssignSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedStaff(null);
          setAssignSuccess(false);
          setAssignError('');
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({}));
        setAssignError(err.message || `エラー (${res.status}): 配属に失敗しました`);
      }
    } catch {
      setAssignError('ネットワークエラーが発生しました。再度お試しください。');
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = (staff) => {
    setSelectedStaff(staff);
    setDraftWorkPlaces(Array.isArray(staff.assignedWorkPlace) ? staff.assignedWorkPlace : (staff.assignedWorkPlace ? [staff.assignedWorkPlace] : []));
    setDraftDepartments(Array.isArray(staff.department) ? staff.department : (staff.department ? [staff.department] : []));
    setDraftOffices(Array.isArray(staff.office) ? staff.office : (staff.office ? [staff.office] : []));
    const deptArr = Array.isArray(staff.department) ? staff.department : (staff.department ? [staff.department] : []);
    const isOfficeDept = deptArr.some(d => ['Audit & Compliance', 'Taxation', 'Payroll', 'HR', ...OFFICE_DEPARTMENTS].includes(d));
    setDraftStaffType(staff.staffType || (isOfficeDept ? 'Office Staff' : 'Haken Staff'));
    setDraftAssignStartDate(
      staff.assignmentStartDate
        ? new Date(staff.assignmentStartDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
    setDraftPartnerName(staff.assignedPartnerName || '');
    setDraftNotes(staff.assignmentNotes || '');
    setAssignSuccess(false);
    setAssignError('');
    setIsModalOpen(true);
  };

  const isOffice = (dept) => ['Audit & Compliance', 'Taxation', 'Payroll', 'HR', ...OFFICE_DEPARTMENTS].includes(dept);

  const isEmpOffice = (e) => e.staffType
    ? e.staffType === 'Office Staff'
    : (Array.isArray(e.department) ? e.department.some(isOffice) : isOffice(e.department));

  const filteredEmployees = employees.filter(emp => {
    if (['Missing Documents', 'Verification Pending'].includes(emp.onboardingStatus)) return false;
    const nameStr = `${emp.romajiName || ''} ${emp.katakanaName || ''}`.toLowerCase();
    if (!nameStr.includes(searchQuery.toLowerCase()) && !(emp._id || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;

    let matchesMainCategory = true;
    if (mainCategory === 'Haken') matchesMainCategory = !isEmpOffice(emp);
    if (mainCategory === 'Office') matchesMainCategory = isEmpOffice(emp);
    if (!matchesMainCategory) return false;

    const isUnassigned = mainCategory === 'Haken'
      ? (!emp.assignedWorkPlace || emp.assignedWorkPlace.length === 0)
      : (!emp.office || emp.office.length === 0);

    if (filterWorkPlace === 'All') return !isUnassigned;
    if (filterWorkPlace === 'Unassigned') return isUnassigned;
    if (mainCategory === 'Haken') return includesValue(emp.assignedWorkPlace, filterWorkPlace);
    if (mainCategory === 'Office') {
      return OFFICE_DEPARTMENTS.includes(filterWorkPlace)
        ? includesValue(emp.department, filterWorkPlace)
        : includesValue(emp.office, filterWorkPlace);
    }
    return includesValue(emp.assignedWorkPlace, filterWorkPlace) || includesValue(emp.department, filterWorkPlace) || includesValue(emp.office, filterWorkPlace);
  });

  const getStat = (filterVal) => {
    let baseEmps = employees.filter(e => !['Missing Documents', 'Verification Pending'].includes(e.onboardingStatus));
    if (mainCategory === 'Haken') baseEmps = baseEmps.filter(e => !isEmpOffice(e));
    if (mainCategory === 'Office') baseEmps = baseEmps.filter(e => isEmpOffice(e));
    if (filterVal === 'All') return baseEmps.filter(e => {
      const unassigned = mainCategory === 'Haken' ? (!e.assignedWorkPlace || !e.assignedWorkPlace.length) : (!e.office || !e.office.length);
      return !unassigned;
    }).length;
    if (filterVal === 'Unassigned') return baseEmps.filter(e =>
      mainCategory === 'Haken' ? (!e.assignedWorkPlace || !e.assignedWorkPlace.length) : (!e.office || !e.office.length)
    ).length;
    if (mainCategory === 'Haken') return baseEmps.filter(e => includesValue(e.assignedWorkPlace, filterVal)).length;
    if (mainCategory === 'Office') {
      return OFFICE_DEPARTMENTS.includes(filterVal)
        ? baseEmps.filter(e => includesValue(e.department, filterVal)).length
        : baseEmps.filter(e => includesValue(e.office, filterVal)).length;
    }
    return baseEmps.filter(e => includesValue(e.assignedWorkPlace, filterVal) || includesValue(e.department, filterVal) || includesValue(e.office, filterVal)).length;
  };

  const getSummaryStat = (type) => {
    const validEmps = employees.filter(e => !['Missing Documents', 'Verification Pending'].includes(e.onboardingStatus));
    return type === 'Haken' ? validEmps.filter(e => !isEmpOffice(e)).length : validEmps.filter(e => isEmpOffice(e)).length;
  };

  const translateWorkPlace = (wp) => {
    const map = {
      'Global Bittory': 'グローバルビクトリー', 'Hotels': 'ホテル', 'Food and Beverage': '飲食',
      'Food and Beverage Manufacturing': '飲食製造', 'Cleaning': '清掃', 'Warehousing/Packaging': '倉庫/梱包',
      'Telecommunications/Retail': '通信/小売', 'Registration Support': '登録サポート',
      'Agriculture and Forestry': '農林業', 'Logistics': '物流', 'Transfer to Headquarters': '本社へ異動',
    };
    return map[wp] || wp;
  };

  const translateDepartment = (dept) => {
    const map = {
      'Management': '経営', 'Administration': '総務', 'Accounting & Finance': '経理・財務',
      'HR / Recruitment': '人事・採用', 'Sales': '営業', 'Marketing': 'マーケティング',
      'IT / Technical': 'IT・技術', 'Customer Support': 'カスタマーサポート',
      'Purchasing / Procurement': '購買・調達', 'Operations': 'オペレーション',
      'Service': 'サービス', 'Farm Operations': '農場運営',
      'Audit & Compliance': '監査・コンプライアンス', 'Taxation': '税務', 'Payroll': '給与計算', 'HR': '人事',
    };
    return map[dept] || dept;
  };

  const translateOfficeLocation = (loc) => {
    const map = {
      'Head Office Tsukiji Office': '本社（築地）', 'Harajuku Office': '原宿オフィス',
      'Osaka Office': '大阪オフィス', 'Nagoya Office': '名古屋オフィス',
      'Chitose Office': '千歳オフィス', 'Sapporo Office': '札幌オフィス',
      'Fukuoka Office': '福岡オフィス', 'Kumamoto Office': '熊本オフィス',
      'Kagoshima Office': '鹿児島オフィス', 'Utsunomiya Office': '宇都宮オフィス',
      'Odawara Office': '小田原オフィス', 'Narita Office': '成田オフィス',
      'Kasai Office': '葛西オフィス', 'Gunma Office': '群馬オフィス', 'Others': 'その他',
    };
    return map[loc] || loc;
  };

  const baseCards = [
    { name: '未配属', id: 'Unassigned', icon: MapPin, color: 'text-amber-500', bgColor: 'bg-white', borderColor: 'border-gray-200' },
    { name: '配属済み', id: 'All', icon: Users, color: 'text-blue-600', bgColor: 'bg-white', borderColor: 'border-gray-200' },
  ];
  const hakenCardsConfig = [
    ...baseCards,
    ...WORK_PLACES.map(wp => ({ name: translateWorkPlace(wp), id: wp, icon: getIconForWorkPlace(wp), color: getColorForWorkPlace(wp), bgColor: 'bg-white', borderColor: 'border-gray-200' }))
  ];
  const officeCardsConfig = [
    ...baseCards,
    ...OFFICE_DEPARTMENTS.map(dept => ({ name: translateDepartment(dept), id: dept, icon: dept.includes('HR') ? Users : Building2, color: 'text-indigo-600', bgColor: 'bg-white', borderColor: 'border-gray-200' }))
  ];
  const statCardsConfig = mainCategory === 'Haken' ? hakenCardsConfig : mainCategory === 'Office' ? officeCardsConfig : [...hakenCardsConfig, ...officeCardsConfig.filter(c => c.id !== 'Unassigned' && c.id !== 'All')];

  return (
    <div className="w-full pb-10">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { type: 'Haken', label: '派遣スタッフ', icon: Briefcase },
          { type: 'Office', label: '内勤スタッフ', icon: Building2 },
        ].map(({ type, label, icon: Icon }) => {
          const active = mainCategory === type;
          return (
            <button key={type}
              onClick={() => { setMainCategory(mainCategory === type ? 'All' : type); setFilterWorkPlace('Unassigned'); }}
              className={`rounded-xl p-6 flex flex-col items-center justify-center shadow-md transition-all duration-200 border ${active ? 'bg-[#162D50] text-white scale-[1.02] border-[#162D50]' : 'bg-white text-[#002244] border-gray-200 hover:border-[#162D50]'}`}
            >
              <Icon className="w-8 h-8 mb-3" />
              <p className="text-3xl font-bold mb-1">{getSummaryStat(type)}</p>
              <p className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-gray-200' : 'text-gray-500'}`}>{label}</p>
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 mb-8">
        {statCardsConfig.map((card, idx) => {
          const value = getStat(card.id);
          const isSelected = filterWorkPlace === card.id;
          const Icon = card.icon;
          return (
            <button key={idx}
              onClick={() => setFilterWorkPlace(card.id === 'Total Staff' ? 'All' : card.id)}
              className={`w-full text-center border rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-200 cursor-pointer ${isSelected ? 'bg-[#162D50] border-[#162D50] shadow-md scale-[1.02]' : `${card.bgColor} ${card.borderColor} shadow-sm hover:shadow-md hover:-translate-y-1`}`}
            >
              {isSelected && <div className="absolute top-0 right-0 p-2 opacity-20"><Icon className="w-12 h-12 text-white" /></div>}
              <Icon className={`w-7 h-7 mb-2 ${isSelected ? 'text-white' : card.color}`} />
              <p className={`text-3xl font-bold mb-1 z-10 ${isSelected ? 'text-white' : 'text-[#162D50]'}`}>{value}</p>
              <p className={`text-xs font-medium uppercase tracking-wider text-center z-10 ${isSelected ? 'text-gray-200' : 'text-gray-500'}`}>{card.name}</p>
            </button>
          );
        })}
      </div>

      {/* B2B Partner Panel */}
      {mainCategory === 'Haken' && filterWorkPlace !== 'All' && filterWorkPlace !== 'Unassigned' && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#162D50]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#162D50] flex items-center justify-center"><Building2 className="w-4 h-4 text-white" /></div>
              <div>
                <h3 className="font-bold text-[#162D50] text-sm">{translateWorkPlace(filterWorkPlace)} — 関連B2Bパートナー</h3>
                <p className="text-xs text-gray-500 mt-0.5">{partnersLoading ? '読み込み中...' : `${matchedPartners.length}件のパートナー企業`}</p>
              </div>
            </div>
          </div>
          {partnersLoading ? (
            <div className="p-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#162D50] rounded-full animate-spin" /> パートナー情報を読み込み中...
            </div>
          ) : matchedPartners.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
              <AlertCircle className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-400 font-medium">このカテゴリに関連するB2Bパートナーが見つかりません</p>
              <p className="text-xs text-gray-400">B2B部門でパートナーを登録してください</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {matchedPartners.map((partner) => {
                  const isActive = (partner.status || '').toLowerCase() === 'active';
                  const contractEnd = partner.contract_end_date ? new Date(partner.contract_end_date) : null;
                  const daysLeft = contractEnd ? Math.ceil((contractEnd - new Date()) / 86400000) : null;
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
                  const isExpired = daysLeft !== null && daysLeft <= 0;
                  const placedCount = employees.filter(e =>
                    Array.isArray(e.assignedWorkPlace) ? e.assignedWorkPlace.some(wp => wp === filterWorkPlace) : e.assignedWorkPlace === filterWorkPlace
                  ).length;
                  return (
                    <div key={partner._id} className="rounded-xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#162D50]/10 flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-[#162D50]" /></div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#162D50] text-sm leading-tight truncate">{partner.partner_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 truncate">{partner.industry || '—'}</p>
                          </div>
                        </div>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{isActive ? '契約中' : partner.status || '—'}</span>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        {partner.contact_name && (<div className="flex items-center gap-2 text-xs text-gray-600"><User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="truncate">{partner.contact_name}</span></div>)}
                        {partner.contact_phone && (<div className="flex items-center gap-2 text-xs text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>{partner.contact_phone}</span></div>)}
                        {partner.monthly_revenue != null && (<div className="flex items-center gap-2 text-xs text-gray-600"><TrendingUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>¥{Number(partner.monthly_revenue).toLocaleString()}/月</span></div>)}
                        {contractEnd && (
                          <div className={`flex items-center gap-2 text-xs font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-500'}`}>
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {isExpired ? `契約終了 ${Math.abs(daysLeft)}日前` : isExpiringSoon ? `契約終了まで${daysLeft}日` : `契約満了: ${contractEnd.toLocaleDateString('ja-JP')}`}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-[#162D50] font-semibold"><Users className="w-3.5 h-3.5 flex-shrink-0" /><span>配属スタッフ: {placedCount}名</span></div>
                      </div>
                      {partner.website && (
                        <div className="px-4 py-2 border-t border-gray-100">
                          <a href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors" onClick={e => e.stopPropagation()}>
                            <Globe className="w-3 h-3" />ウェブサイト<ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-50 p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-[#162D50] flex-1">
          {filterWorkPlace === 'All' ? '配属先一覧' : filterWorkPlace === 'Unassigned' ? '未配属スタッフ一覧' : `${filterWorkPlace} スタッフ一覧`}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="スタッフを検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] bg-white" />
          </div>
          <div className="relative w-full sm:w-48 text-sm">
            <select value={filterWorkPlace} onChange={e => setFilterWorkPlace(e.target.value)}
              className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162D50] bg-white appearance-none cursor-pointer">
              <option value="All">{mainCategory === 'Office' ? 'すべてのオフィス' : 'すべての拠点'}</option>
              <option value="Unassigned">未配属</option>
              {mainCategory === 'Office'
                ? OFFICE_LOCATIONS.map(loc => <option key={loc} value={loc}>{translateOfficeLocation(loc)}</option>)
                : WORK_PLACES.map(place => <option key={place} value={place}>{translateWorkPlace(place)}</option>)
              }
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">No.</th>
                <th className="py-4 px-6">スタッフID</th>
                <th className="py-4 px-6">氏名</th>
                <th className="py-4 px-6">従業員タイプ</th>
                <th className="py-4 px-6">部署</th>
                <th className="py-4 px-6">{mainCategory === 'Office' ? 'オフィス' : '配属先'}</th>
                <th className="py-4 px-6">配属日</th>
                <th className="py-4 px-6 text-center">アクション</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan="8" className="py-8 px-6 text-center text-gray-500">スタッフデータを読み込み中...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="8" className="py-8 px-6 text-center text-gray-500">スタッフ記録が見つかりません。</td></tr>
              ) : filteredEmployees.map((employee, index) => (
                <tr key={employee._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="py-4 px-6 font-medium text-gray-500">{index + 1}</td>
                  <td className="py-4 px-6 font-medium text-[#162D50]">#{employee._id?.slice(-6).toUpperCase()}</td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-gray-900">{employee.romajiName || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{employee.katakanaName || ''}</p>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{employee.joiningType || employee.staffType || '派遣スタッフ'}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {Array.isArray(employee.department) ? employee.department.map(translateDepartment).join(', ') : translateDepartment(employee.department) || 'N/A'}
                  </td>
                  <td className="py-4 px-6">
                    {mainCategory === 'Office' ? (
                      employee.office && employee.office.length > 0
                        ? <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">{Array.isArray(employee.office) ? employee.office.map(translateOfficeLocation).join(', ') : translateOfficeLocation(employee.office)}</span>
                        : <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">未配属</span>
                    ) : employee.assignedWorkPlace && employee.assignedWorkPlace.length > 0
                      ? <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{Array.isArray(employee.assignedWorkPlace) ? employee.assignedWorkPlace.map(translateWorkPlace).join(', ') : translateWorkPlace(employee.assignedWorkPlace)}</span>
                      : <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">未配属</span>
                    }
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-xs">
                    {employee.assignmentStartDate ? new Date(employee.assignmentStartDate).toLocaleDateString('ja-JP') : '—'}
                  </td>
                  <td className="py-4 px-6 text-center space-x-2">
                    <button onClick={() => { setViewStaff(employee); setIsViewModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-[#162D50] hover:bg-blue-50 rounded-md transition-colors" title="詳細を表示">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => openAssignModal(employee)} className="px-3 py-1.5 bg-[#162D50] text-white hover:bg-[#0f1f3a] rounded-md text-xs font-bold transition-colors">
                      配属する
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────── ASSIGNMENT MODAL (配属先詳細) ─────────── */}
      {isModalOpen && selectedStaff && (() => {
        const tenureDays = selectedStaff.joinDate ? Math.floor((Date.now() - new Date(selectedStaff.joinDate)) / 86400000) : null;
        const tenureText = tenureDays === null ? '—' : tenureDays < 30 ? `${tenureDays}日` : tenureDays < 365 ? `${Math.floor(tenureDays / 30)}ヶ月` : `${Math.floor(tenureDays / 365)}年${Math.floor((tenureDays % 365) / 30)}ヶ月`;
        const visaEnd = selectedStaff.visaEndDate ? new Date(selectedStaff.visaEndDate) : null;
        const visaDaysLeft = visaEnd ? Math.ceil((visaEnd - Date.now()) / 86400000) : null;
        const isVisaUrgent = visaDaysLeft !== null && visaDaysLeft <= 60;
        const currentWorkPlaces = Array.isArray(selectedStaff.assignedWorkPlace) ? selectedStaff.assignedWorkPlace : (selectedStaff.assignedWorkPlace ? [selectedStaff.assignedWorkPlace] : []);
        const stepNum = (n) => draftStaffType === 'Haken Staff' && draftWorkPlaces.length > 0 ? n : (n <= 4 ? n : n - 1);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

              {/* ── Hero Header ── */}
              <div className="relative bg-gradient-to-br from-[#162D50] via-[#1a3460] to-[#0f2040] flex-shrink-0">
                <button onClick={() => { setIsModalOpen(false); setAssignError(''); }} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10">
                  <X className="w-5 h-5" />
                </button>
                <div className="px-6 pt-6 pb-0">
                  <div className="flex items-end gap-5 pb-5">
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {(selectedStaff.romajiName || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-[#162D50] ${selectedStaff.onboardingStatus === 'Active' ? 'bg-green-400' : 'bg-amber-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-xs text-white/40 font-mono mb-1 tracking-widest">配属先詳細 · ASSIGNMENT DETAILS</p>
                      <h2 className="text-2xl font-bold text-white leading-tight">{selectedStaff.romajiName}</h2>
                      <p className="text-sm text-white/60">{selectedStaff.katakanaName}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white/80">{selectedStaff.staffType || selectedStaff.joiningType || 'Haken Staff'}</span>
                        {selectedStaff.nationality && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white/80">{selectedStaff.nationality}</span>}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${currentWorkPlaces.length > 0 ? 'bg-green-500/20 text-green-300 border border-green-400/20' : 'bg-amber-500/20 text-amber-300 border border-amber-400/20'}`}>
                          {currentWorkPlaces.length > 0 ? `配属済 · ${currentWorkPlaces.map(translateWorkPlace).join(', ')}` : '未配属'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 border-t border-white/10 -mx-6">
                    {[
                      { label: 'スタッフID', value: `#${selectedStaff._id?.slice(-6).toUpperCase()}` },
                      { label: '勤続期間', value: tenureText },
                      { label: 'ビザ残日数', value: visaDaysLeft === null ? '—' : visaDaysLeft <= 0 ? '期限切れ' : `${visaDaysLeft}日`, warn: isVisaUrgent },
                      { label: '入社日', value: selectedStaff.joinDate ? new Date(selectedStaff.joinDate).toLocaleDateString('ja-JP') : '—' },
                    ].map((kpi, i) => (
                      <div key={i} className={`px-4 py-3 text-center ${i < 3 ? 'border-r border-white/10' : ''}`}>
                        <p className="text-xs text-white/50 mb-0.5">{kpi.label}</p>
                        <p className={`text-sm font-bold ${kpi.warn ? 'text-red-300' : 'text-white'}`}>{kpi.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar */}
                <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-5 space-y-5">

                  {/* Contact */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">連絡先情報</p>
                    <div className="space-y-2.5">
                      {[
                        { icon: Mail, bg: 'bg-blue-50', color: 'text-blue-500', val: selectedStaff.email },
                        { icon: Phone, bg: 'bg-green-50', color: 'text-green-500', val: selectedStaff.phone },
                      ].map(({ icon: Icon, bg, color, val }, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}><Icon className={`w-3.5 h-3.5 ${color}`} /></div>
                          <span className="text-xs text-gray-600 truncate">{val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Visa */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">ビザ情報</p>
                    <div className={`rounded-xl p-3 border ${isVisaUrgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-700">{selectedStaff.visaStatus || '不明'}</span>
                        {visaDaysLeft !== null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${visaDaysLeft <= 0 ? 'bg-red-100 text-red-700' : visaDaysLeft <= 60 ? 'bg-red-100 text-red-700' : visaDaysLeft <= 180 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {visaDaysLeft <= 0 ? '期限切れ' : `残${visaDaysLeft}日`}
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] ${isVisaUrgent ? 'text-red-600' : 'text-gray-400'}`}>満了: {visaEnd ? visaEnd.toLocaleDateString('ja-JP') : '情報なし'}</p>
                      {visaEnd && (
                        <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${visaDaysLeft <= 60 ? 'bg-red-400' : visaDaysLeft <= 180 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${visaDaysLeft > 0 ? Math.min(100, Math.round(visaDaysLeft / 365 * 100)) : 0}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Current Assignment */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">現在の配属状況</p>
                    {currentWorkPlaces.length > 0 ? (
                      <div className="space-y-1.5">
                        {currentWorkPlaces.map((wp, i) => {
                          const WpIcon = getIconForWorkPlace(wp);
                          return (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                              <WpIcon className={`w-3.5 h-3.5 ${getColorForWorkPlace(wp)}`} />
                              <span className="text-xs font-semibold text-blue-800">{translateWorkPlace(wp)}</span>
                            </div>
                          );
                        })}
                        {selectedStaff.assignmentStartDate && (
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />配属日: {new Date(selectedStaff.assignmentStartDate).toLocaleDateString('ja-JP')}
                          </p>
                        )}
                        {selectedStaff.assignedPartnerName && (
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />{selectedStaff.assignedPartnerName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-5 text-center">
                        <MapPin className="w-7 h-7 text-gray-200 mb-1.5" />
                        <p className="text-xs text-gray-400">まだ配属されていません</p>
                      </div>
                    )}
                  </div>

                  {selectedStaff.assignmentNotes && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">前回の備考</p>
                        <p className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-2 leading-relaxed italic">{selectedStaff.assignmentNotes}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Form */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-5">

                  {/* Error / Success banners */}
                  {assignError && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                      <span className="flex-1">{assignError}</span>
                      <button onClick={() => setAssignError('')} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  {assignSuccess && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      配属が正常に確定されました！画面を更新します...
                    </div>
                  )}

                  {/* Section: Staff Type */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-[#162D50] mb-4 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#162D50] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                      スタッフタイプを選択
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'Haken Staff', label: '派遣スタッフ', icon: Briefcase, desc: '外部派遣・現場勤務' },
                        { id: 'Office Staff', label: '内勤スタッフ', icon: Building2, desc: '社内オフィス勤務' },
                      ].map(({ id, label, icon: Icon, desc }) => {
                        const sel = draftStaffType === id;
                        return (
                          <button key={id} onClick={() => { setDraftStaffType(id); setDraftDepartments([]); setDraftOffices([]); setDraftWorkPlaces([]); setDraftPartnerName(''); }} disabled={assigning}
                            className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${sel ? 'border-[#162D50] bg-[#162D50] shadow-md' : 'border-gray-200 bg-white hover:border-[#162D50]/40 hover:shadow-sm'} ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Icon className={`w-5 h-5 ${sel ? 'text-white' : 'text-[#162D50]'}`} />
                              <span className={`font-bold text-sm ${sel ? 'text-white' : 'text-gray-800'}`}>{label}</span>
                              {sel && <CheckCircle2 className="w-4 h-4 text-white ml-auto" />}
                            </div>
                            <p className={`text-xs ${sel ? 'text-white/70' : 'text-gray-500'}`}>{desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section: Assignment Date */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-[#162D50] mb-4 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#162D50] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                      配属開始日
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="date" value={draftAssignStartDate} onChange={e => setDraftAssignStartDate(e.target.value)} disabled={assigning}
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50]/30 focus:border-[#162D50] bg-white disabled:opacity-50" />
                      </div>
                      <button onClick={() => setDraftAssignStartDate(new Date().toISOString().split('T')[0])} disabled={assigning}
                        className="px-4 py-2.5 text-xs font-semibold text-[#162D50] border border-[#162D50]/30 bg-[#162D50]/5 rounded-xl hover:bg-[#162D50]/10 transition-colors disabled:opacity-50">
                        今日
                      </button>
                    </div>
                  </div>

                  {/* Section: Work Place / Office */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-[#162D50] mb-4 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#162D50] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                      {draftStaffType === 'Haken Staff' ? '配属先カテゴリー' : 'オフィス選択'}
                      {(draftStaffType === 'Haken Staff' ? draftWorkPlaces.length : draftOffices.length) > 0 && (
                        <span className="ml-auto text-[10px] text-[#162D50] bg-[#162D50]/10 px-2 py-0.5 rounded-full font-bold">
                          {draftStaffType === 'Haken Staff' ? draftWorkPlaces.length : draftOffices.length}件選択中
                        </span>
                      )}
                    </h4>
                    {draftStaffType === 'Haken Staff' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {WORK_PLACES.map((place) => {
                          const sel = draftWorkPlaces.includes(place);
                          const Icon = getIconForWorkPlace(place);
                          const iconColor = getColorForWorkPlace(place);
                          return (
                            <button key={place} onClick={() => setDraftWorkPlaces(sel ? draftWorkPlaces.filter(p => p !== place) : [...draftWorkPlaces, place])} disabled={assigning}
                              className={`text-left p-3 rounded-xl border-2 transition-all duration-200 ${sel ? 'border-[#162D50] bg-[#162D50] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'} ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <Icon className={`w-4 h-4 ${sel ? 'text-white/80' : iconColor}`} />
                                {sel && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <span className={`text-xs font-semibold leading-tight block ${sel ? 'text-white' : 'text-gray-700'}`}>{translateWorkPlace(place)}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {OFFICE_LOCATIONS.map((loc) => {
                          const sel = draftOffices.includes(loc);
                          return (
                            <button key={loc} onClick={() => setDraftOffices(sel ? draftOffices.filter(o => o !== loc) : [...draftOffices, loc])} disabled={assigning}
                              className={`text-left p-3 rounded-xl border-2 transition-all duration-200 ${sel ? 'border-[#162D50] bg-[#162D50] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'} ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <Building2 className={`w-3.5 h-3.5 ${sel ? 'text-white/80' : 'text-[#162D50]'}`} />
                                {sel && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <span className={`text-xs font-semibold block ${sel ? 'text-white' : 'text-gray-700'}`}>{translateOfficeLocation(loc)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section: Department */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-[#162D50] mb-4 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#162D50] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
                      部署を選択
                      {draftDepartments.length > 0 && (
                        <span className="ml-auto text-[10px] text-[#162D50] bg-[#162D50]/10 px-2 py-0.5 rounded-full font-bold">{draftDepartments.length}件選択中</span>
                      )}
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {ALL_DEPARTMENTS.filter(dept =>
                        draftStaffType === 'Office Staff'
                          ? ['Audit & Compliance', 'Taxation', 'Payroll', 'HR', ...OFFICE_DEPARTMENTS].includes(dept)
                          : !['Audit & Compliance', 'Taxation', 'Payroll', 'HR', ...OFFICE_DEPARTMENTS].includes(dept)
                      ).map((dept) => {
                        const sel = draftDepartments.includes(dept);
                        return (
                          <button key={dept} onClick={() => setDraftDepartments(sel ? draftDepartments.filter(d => d !== dept) : [...draftDepartments, dept])} disabled={assigning}
                            className={`text-left p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between gap-2 ${sel ? 'border-[#162D50] bg-[#162D50] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'} ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span className={`text-xs font-semibold ${sel ? 'text-white' : 'text-gray-700'}`}>{translateDepartment(dept)}</span>
                            {sel && <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section: Partner Company (Haken + work places selected) */}
                  {draftStaffType === 'Haken Staff' && draftWorkPlaces.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h4 className="text-sm font-bold text-[#162D50] mb-4 flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#162D50] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">5</span>
                        パートナー企業（任意）
                        <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{draftMatchedPartners.length}社</span>
                      </h4>
                      {draftMatchedPartners.length === 0 ? (
                        <div className="text-center py-5">
                          <Building2 className="w-7 h-7 mx-auto mb-2 text-gray-200" />
                          <p className="text-xs text-gray-400">この配属先カテゴリーに登録されたパートナー企業がありません</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button onClick={() => setDraftPartnerName('')}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${draftPartnerName === '' ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <span className="text-xs font-medium text-gray-500">指定しない</span>
                          </button>
                          {draftMatchedPartners.map((p) => {
                            const sel = draftPartnerName === p.partner_name;
                            const active = (p.status || '').toLowerCase() === 'active';
                            return (
                              <button key={p._id} onClick={() => setDraftPartnerName(p.partner_name)} disabled={assigning}
                                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${sel ? 'border-[#162D50] bg-[#162D50]/5' : 'border-gray-200 bg-white hover:border-[#162D50]/30'} ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${sel ? 'bg-[#162D50]' : 'bg-[#162D50]/10'}`}>
                                      <Building2 className={`w-3.5 h-3.5 ${sel ? 'text-white' : 'text-[#162D50]'}`} />
                                    </div>
                                    <div>
                                      <p className={`text-xs font-bold ${sel ? 'text-[#162D50]' : 'text-gray-800'}`}>{p.partner_name}</p>
                                      <p className="text-[10px] text-gray-500">{p.industry || '—'}{p.contact_name ? ` · ${p.contact_name}` : ''}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{active ? '契約中' : p.status}</span>
                                    {sel && <CheckCircle2 className="w-4 h-4 text-[#162D50]" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section: Partner Company (Office Staff + departments selected) */}
                  {draftStaffType === 'Office Staff' && draftDepartments.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h4 className="text-sm font-bold text-[#162D50] mb-4 flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#162D50] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">5</span>
                        パートナー企業（任意）
                        <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{draftMatchedPartnersOffice.length}社</span>
                      </h4>
                      {draftMatchedPartnersOffice.length === 0 ? (
                        <div className="text-center py-5">
                          <Building2 className="w-7 h-7 mx-auto mb-2 text-gray-200" />
                          <p className="text-xs text-gray-400">選択した部署に対応するパートナー企業がありません</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button onClick={() => setDraftPartnerName('')}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${draftPartnerName === '' ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <span className="text-xs font-medium text-gray-500">指定しない</span>
                          </button>
                          {draftMatchedPartnersOffice.map((p) => {
                            const sel = draftPartnerName === p.partner_name;
                            const active = (p.status || '').toLowerCase() === 'active';
                            return (
                              <button key={p._id} onClick={() => setDraftPartnerName(p.partner_name)} disabled={assigning}
                                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${sel ? 'border-[#162D50] bg-[#162D50]/5' : 'border-gray-200 bg-white hover:border-[#162D50]/30'} ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${sel ? 'bg-[#162D50]' : 'bg-[#162D50]/10'}`}>
                                      <Building2 className={`w-3.5 h-3.5 ${sel ? 'text-white' : 'text-[#162D50]'}`} />
                                    </div>
                                    <div>
                                      <p className={`text-xs font-bold ${sel ? 'text-[#162D50]' : 'text-gray-800'}`}>{p.partner_name}</p>
                                      <p className="text-[10px] text-gray-500">{p.industry || '—'}{p.contact_name ? ` · ${p.contact_name}` : ''}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{active ? '契約中' : p.status}</span>
                                    {sel && <CheckCircle2 className="w-4 h-4 text-[#162D50]" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section: Notes */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-[#162D50] mb-4 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#162D50] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {draftStaffType === 'Haken Staff' && draftWorkPlaces.length > 0 ? '6' : '5'}
                      </span>
                      配属備考
                      <span className="ml-auto text-[10px] text-gray-400">{draftNotes.length}/200</span>
                    </h4>
                    <textarea value={draftNotes} onChange={e => setDraftNotes(e.target.value.slice(0, 200))} disabled={assigning}
                      placeholder="配属に関するメモ・補足情報・注意事項などを入力..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50]/30 focus:border-[#162D50] resize-none disabled:opacity-50 bg-gray-50/50 placeholder:text-gray-300" />
                  </div>

                  {/* Preview */}
                  <div className="bg-gradient-to-br from-[#162D50]/5 to-[#162D50]/10 border border-[#162D50]/20 rounded-xl p-5">
                    <h4 className="text-xs font-bold text-[#162D50] mb-3 flex items-center gap-2 uppercase tracking-wider">
                      <Eye className="w-4 h-4" />配属内容プレビュー
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                      <div>
                        <p className="text-gray-500 mb-1">スタッフタイプ</p>
                        <p className="font-bold text-gray-800">{draftStaffType === 'Haken Staff' ? '派遣スタッフ' : '内勤スタッフ'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">配属開始日</p>
                        <p className="font-bold text-gray-800">{draftAssignStartDate ? new Date(draftAssignStartDate + 'T00:00:00').toLocaleDateString('ja-JP') : '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">配属先</p>
                        <p className="font-bold text-gray-800">
                          {draftStaffType === 'Haken Staff'
                            ? (draftWorkPlaces.length > 0 ? draftWorkPlaces.map(translateWorkPlace).join(', ') : '未設定')
                            : (draftOffices.length > 0 ? draftOffices.map(translateOfficeLocation).join(', ') : '未設定')
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">部署</p>
                        <p className="font-bold text-gray-800">{draftDepartments.length > 0 ? draftDepartments.map(translateDepartment).join(', ') : '未設定'}</p>
                      </div>
                      {draftPartnerName && (
                        <div className="col-span-2">
                          <p className="text-gray-500 mb-1">パートナー企業</p>
                          <p className="font-bold text-[#162D50]">{draftPartnerName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3 flex-shrink-0">
                <div className="text-xs">
                  {(draftWorkPlaces.length > 0 || draftOffices.length > 0)
                    ? <span className="text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />配属先が設定されています</span>
                    : <span className="text-amber-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />配属先カテゴリーを選択してください</span>
                  }
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setIsModalOpen(false); setAssignError(''); }}
                    className="px-5 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                    閉じる
                  </button>
                  <button onClick={handleAssignWorkPlace} disabled={assigning || assignSuccess}
                    className="px-6 py-2.5 bg-[#162D50] text-white font-bold rounded-xl hover:bg-[#0f1f3a] transition-colors text-sm disabled:opacity-50 flex items-center gap-2 min-w-36 justify-center">
                    {assignSuccess
                      ? <><CheckCircle2 className="w-4 h-4 text-green-300" />配属完了</>
                      : assigning
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />処理中...</>
                        : <>配属を確定<ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─────────── VIEW MODAL ─────────── */}
      {isViewModalOpen && viewStaff && (() => {
        const _status = viewStaff.onboardingStatus || 'Active';
        const _isActive = _status === 'Active';
        const _tenureDays = viewStaff.joinDate ? Math.floor((Date.now() - new Date(viewStaff.joinDate)) / 86400000) : null;
        const _tenureText = _tenureDays === null ? '—' : _tenureDays < 30 ? `${_tenureDays}日` : _tenureDays < 365 ? `${Math.floor(_tenureDays / 30)}ヶ月` : `${Math.floor(_tenureDays / 365)}年${Math.floor((_tenureDays % 365) / 30)}ヶ月`;
        const _visaEnd = viewStaff.visaEndDate ? new Date(viewStaff.visaEndDate) : null;
        const _visaDaysLeft = _visaEnd ? Math.ceil((_visaEnd - Date.now()) / 86400000) : null;
        const _workPlaces = Array.isArray(viewStaff.assignedWorkPlace) ? viewStaff.assignedWorkPlace : (viewStaff.assignedWorkPlace ? [viewStaff.assignedWorkPlace] : []);
        const _departments = Array.isArray(viewStaff.department) ? viewStaff.department : (viewStaff.department ? [viewStaff.department] : []);
        const _offices = Array.isArray(viewStaff.office) ? viewStaff.office : (viewStaff.office ? [viewStaff.office] : []);
        // Show all partners matching this staff's assigned work places or departments.
        // If a specific partner is assigned (assignedPartnerName), sort it first and badge it.
        const _isOfficeStaff = viewStaff.staffType === 'Office Staff' ||
          (Array.isArray(viewStaff.department) ? viewStaff.department.some(d => ['Management','Administration','Accounting & Finance','HR / Recruitment','Sales','Marketing','IT / Technical','Customer Support','Purchasing / Procurement','Operations'].includes(d)) : false);
        const _rawLinked = _isOfficeStaff
          ? partners.filter(p => Array.isArray(p.workplaceCategories) && _departments.some(d => p.workplaceCategories.includes(d)))
          : _workPlaces.length > 0
            ? getPartnersForWorkPlaces(_workPlaces, partners)
            : [];
        // Assigned partner first, rest alphabetically
        const _linkedPartners = [
          ..._rawLinked.filter(p => p.partner_name === viewStaff.assignedPartnerName),
          ..._rawLinked.filter(p => p.partner_name !== viewStaff.assignedPartnerName),
        ];
        const _colleagues = _workPlaces.length > 0
          ? employees.filter(e => e._id !== viewStaff._id && _workPlaces.some(wp => Array.isArray(e.assignedWorkPlace) ? e.assignedWorkPlace.includes(wp) : e.assignedWorkPlace === wp)).length
          : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
              <div className="relative bg-gradient-to-br from-[#162D50] via-[#1a3460] to-[#0f2040] px-6 pt-6 pb-0 flex-shrink-0">
                <button onClick={() => { setIsViewModalOpen(false); setViewStaff(null); }} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-end gap-5 pb-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {(viewStaff.romajiName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-[#162D50] ${_isActive ? 'bg-green-400' : 'bg-amber-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${_isActive ? 'bg-green-400/20 text-green-300' : 'bg-amber-400/20 text-amber-300'}`}>{_status}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70">{viewStaff.staffType || viewStaff.joiningType || 'Haken Staff'}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight">{viewStaff.romajiName || 'N/A'}</h2>
                    <p className="text-sm text-white/60">{viewStaff.katakanaName || ''}</p>
                    <p className="text-xs font-mono text-white/40 mt-1">ID: #{viewStaff._id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 border-t border-white/10 -mx-6">
                  {[
                    { label: '勤続期間', value: _tenureText, sub: viewStaff.joinDate ? new Date(viewStaff.joinDate).toLocaleDateString('ja-JP') : '—' },
                    { label: '配属先', value: _workPlaces.length > 0 ? translateWorkPlace(_workPlaces[0]) : '未配属', sub: _workPlaces.length > 1 ? `+${_workPlaces.length - 1}` : '' },
                    { label: '同職場の同僚', value: _colleagues, sub: '名' },
                    { label: 'ビザ残日数', value: _visaDaysLeft === null ? '—' : _visaDaysLeft <= 0 ? '期限切れ' : `${_visaDaysLeft}日`, sub: _visaEnd ? _visaEnd.toLocaleDateString('ja-JP') : '情報なし', warn: _visaDaysLeft !== null && _visaDaysLeft <= 60 },
                  ].map((kpi, i) => (
                    <div key={i} className={`px-4 py-3 text-center ${i < 3 ? 'border-r border-white/10' : ''}`}>
                      <p className="text-xs text-white/50 mb-0.5">{kpi.label}</p>
                      <p className={`text-lg font-bold ${kpi.warn ? 'text-red-300' : 'text-white'}`}>{kpi.value}</p>
                      <p className="text-xs text-white/40">{kpi.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#162D50]" />
                        <span className="text-xs font-bold text-[#162D50] uppercase tracking-wider">個人・連絡先情報</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {[
                          { icon: Mail, cls: 'text-blue-500 bg-blue-50', label: 'メールアドレス', value: viewStaff.email || '—' },
                          { icon: Phone, cls: 'text-green-500 bg-green-50', label: '電話番号', value: viewStaff.phone || '—' },
                          { icon: Calendar, cls: 'text-orange-500 bg-orange-50', label: '入社日', value: viewStaff.joinDate ? new Date(viewStaff.joinDate).toLocaleDateString('ja-JP') : '—' },
                          { icon: Briefcase, cls: 'text-purple-500 bg-purple-50', label: 'スタッフ種別', value: viewStaff.staffType || viewStaff.joiningType || '派遣スタッフ' },
                        ].map(({ icon: Icon, cls, label, value }) => (
                          <div key={label} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls.split(' ')[1]}`}>
                              <Icon className={`w-4 h-4 ${cls.split(' ')[0]}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-400">{label}</p>
                              <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${_visaDaysLeft !== null && _visaDaysLeft <= 60 ? 'border-red-200' : 'border-gray-200'}`}>
                      <div className={`px-4 py-3 border-b flex items-center gap-2 ${_visaDaysLeft !== null && _visaDaysLeft <= 60 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                        <CheckCircle2 className={`w-4 h-4 ${_visaDaysLeft !== null && _visaDaysLeft <= 60 ? 'text-red-500' : 'text-sky-600'}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${_visaDaysLeft !== null && _visaDaysLeft <= 60 ? 'text-red-600' : 'text-[#162D50]'}`}>ビザ情報</span>
                        {_visaDaysLeft !== null && _visaDaysLeft <= 60 && (
                          <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{_visaDaysLeft <= 0 ? '期限切れ' : `残${_visaDaysLeft}日`}</span>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-4 h-4 text-sky-500" /></div>
                          <div><p className="text-xs text-gray-400">ビザ種別</p><p className="text-sm font-medium text-gray-800">{viewStaff.visaStatus || '情報なし'}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${_visaDaysLeft !== null && _visaDaysLeft <= 60 ? 'bg-red-50' : 'bg-gray-50'}`}>
                            <Calendar className={`w-4 h-4 ${_visaDaysLeft !== null && _visaDaysLeft <= 60 ? 'text-red-500' : 'text-gray-400'}`} />
                          </div>
                          <div><p className="text-xs text-gray-400">有効期限</p><p className={`text-sm font-medium ${_visaDaysLeft !== null && _visaDaysLeft <= 60 ? 'text-red-600' : 'text-gray-800'}`}>{_visaEnd ? _visaEnd.toLocaleDateString('ja-JP') : '情報なし'}</p></div>
                        </div>
                        {_visaEnd && (
                          <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>残存率</span><span>{_visaDaysLeft !== null && _visaDaysLeft > 0 ? `${Math.min(100, Math.round(_visaDaysLeft / 365 * 100))}%` : '0%'}</span></div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${_visaDaysLeft !== null && _visaDaysLeft <= 60 ? 'bg-red-400' : _visaDaysLeft !== null && _visaDaysLeft <= 180 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${_visaDaysLeft !== null && _visaDaysLeft > 0 ? Math.min(100, Math.round(_visaDaysLeft / 365 * 100)) : 0}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#162D50]" />
                        <span className="text-xs font-bold text-[#162D50] uppercase tracking-wider">配属・勤務情報</span>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-2">配属先カテゴリー</p>
                          <div className="flex flex-wrap gap-1.5">
                            {_workPlaces.length > 0 ? _workPlaces.map((wp, i) => {
                              const WpIcon = getIconForWorkPlace(wp);
                              return (<span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold"><WpIcon className={`w-3.5 h-3.5 ${getColorForWorkPlace(wp)}`} />{translateWorkPlace(wp)}</span>);
                            }) : <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold">未配属</span>}
                          </div>
                        </div>
                        {viewStaff.assignmentStartDate && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">配属開始日</p>
                            <p className="text-sm font-medium text-gray-800">{new Date(viewStaff.assignmentStartDate).toLocaleDateString('ja-JP')}</p>
                          </div>
                        )}
                        {viewStaff.assignedPartnerName && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">担当パートナー企業</p>
                            <p className="text-sm font-semibold text-[#162D50] flex items-center gap-1.5"><Building2 className="w-4 h-4" />{viewStaff.assignedPartnerName}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-400 mb-2">部署</p>
                          <div className="flex flex-wrap gap-1.5">
                            {_departments.length > 0 ? _departments.map((d, i) => (
                              <span key={i} className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-xs font-semibold">{translateDepartment(d)}</span>
                            )) : <span className="text-sm text-gray-400">—</span>}
                          </div>
                        </div>
                        {_offices.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 mb-2">オフィス</p>
                            <div className="flex flex-wrap gap-1.5">
                              {_offices.map((o, i) => (<span key={i} className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-semibold">{translateOfficeLocation(o)}</span>))}
                            </div>
                          </div>
                        )}
                        {viewStaff.assignmentNotes && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">配属備考</p>
                            <p className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-2 italic leading-relaxed">{viewStaff.assignmentNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#162D50]" />
                          <span className="text-xs font-bold text-[#162D50] uppercase tracking-wider">関連B2Bパートナー</span>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{_linkedPartners.length}社</span>
                      </div>
                      {partnersLoading ? (
                        <div className="p-5 flex items-center justify-center gap-2 text-gray-400 text-sm">
                          <div className="w-4 h-4 border-2 border-gray-200 border-t-[#162D50] rounded-full animate-spin" />読み込み中...
                        </div>
                      ) : _linkedPartners.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                          <p className="text-sm text-gray-400 font-medium">関連するパートナー企業がありません</p>
                          <p className="text-xs text-gray-400 mt-1">B2B部門でパートナーを登録してください</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                          {_linkedPartners.map((p) => {
                            const _pEnd = p.contract_end_date ? new Date(p.contract_end_date) : null;
                            const _pStart = p.contract_start_date ? new Date(p.contract_start_date) : null;
                            const _pDays = _pEnd ? Math.ceil((_pEnd - Date.now()) / 86400000) : null;
                            const _totalDays = (_pEnd && _pStart) ? Math.ceil((_pEnd - _pStart) / 86400000) : null;
                            const _usedDays = (_pEnd && _pStart) ? Math.ceil((Date.now() - _pStart) / 86400000) : null;
                            const _contractPct = (_totalDays && _usedDays) ? Math.min(100, Math.max(0, Math.round(_usedDays / _totalDays * 100))) : null;
                            const _pStatusCfg = {
                              'active': { label: '契約中', cls: 'bg-green-100 text-green-700' },
                              'expiring soon': { label: '期限間近', cls: 'bg-amber-100 text-amber-700' },
                              'pending': { label: '提案中', cls: 'bg-blue-100 text-blue-700' },
                              'terminated': { label: '終了', cls: 'bg-red-100 text-red-700' },
                            }[(p.status || '').toLowerCase()] || { label: p.status || '—', cls: 'bg-gray-100 text-gray-500' };
                            const _isAssigned = p.partner_name === viewStaff.assignedPartnerName;
                            return (
                              <div key={p._id} className={`px-4 py-3 transition-colors ${_isAssigned ? 'bg-[#162D50]/5 border-l-2 border-[#162D50]' : 'hover:bg-blue-50/30'}`}>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-sm text-[#162D50] leading-tight truncate">{p.partner_name}</p>
                                    {_isAssigned && (
                                      <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-[#162D50] text-white text-[10px] font-bold rounded-full">
                                        <CheckCircle2 className="w-2.5 h-2.5" />配属先
                                      </span>
                                    )}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${_pStatusCfg.cls}`}>{_pStatusCfg.label}</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{p.industry || '—'}{p.contact_name ? ` · ${p.contact_name}` : ''}</p>
                                {_contractPct !== null && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                      <span>契約進捗</span>
                                      <span className={_pDays !== null && _pDays <= 30 ? 'text-red-500 font-medium' : ''}>{_pDays !== null && _pDays <= 0 ? '期限切れ' : _pDays !== null ? `残${_pDays}日` : '—'}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${_pDays !== null && _pDays <= 30 ? 'bg-red-400' : _pDays !== null && _pDays <= 90 ? 'bg-amber-400' : 'bg-[#162D50]'}`} style={{ width: `${_contractPct}%` }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3 flex-shrink-0">
                <button onClick={() => { setIsViewModalOpen(false); setViewStaff(null); openAssignModal(viewStaff); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#162D50] text-white font-bold rounded-xl hover:bg-[#0f1f3a] transition-colors text-sm">
                  <MapPin className="w-4 h-4" />配属を変更
                </button>
                <button onClick={() => { setIsViewModalOpen(false); setViewStaff(null); }}
                  className="px-5 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                  閉じる
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
