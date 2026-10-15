import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';

import {
  Search,
  MapPin,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  X,
  Eye,
  ChevronDown,
  Users,
  Briefcase,
  Bed,
  Utensils,
  Factory,
  Brush,
  Package,
  Smartphone,
  Headphones,
  Tractor,
  Truck,
  ArrowRightLeft,
  Radio,
  Wifi,
  Antenna,
  ExternalLink,
  Globe,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

import { WORK_PLACES, OFFICE_DEPARTMENTS, ALL_DEPARTMENTS } from '../../constants';

const getIconForWorkPlace = (wp) => {
  switch(wp) {
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
  switch(wp) {
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
  "Head Office Tsukiji Office",
  "Harajuku Office",
  "Osaka Office",
  "Nagoya Office",
  "Chitose Office",
  "Sapporo Office",
  "Fukuoka Office",
  "Kumamoto Office",
  "Kagoshima Office",
  "Utsunomiya Office",
  "Odawara Office",
  "Narita Office",
  "Kasai Office",
  "Gunma Office",
  "Others"
];

// Match partners directly via workplaceCategories field (exact category name match)
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
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [draftWorkPlaces, setDraftWorkPlaces] = useState([]);
  const [draftDepartments, setDraftDepartments] = useState([]);
  const [draftOffices, setDraftOffices] = useState([]);
  const [draftStaffType, setDraftStaffType] = useState('Haken Staff');
  const [viewStaff, setViewStaff] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const includesValue = (field, value) => {
    if (!field) return false;
    if (Array.isArray(field)) return field.includes(value);
    return field === value;
  };

  useEffect(() => {
    fetchStaff();
    fetchPartners();
  }, []);

  const fetchStaff = () => {
    setLoading(true);
    apiFetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        setEmployees(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching employees:', err);
        setLoading(false);
      });
  };

  const fetchPartners = () => {
    setPartnersLoading(true);
    apiFetch('/api/b2b/engagements?limit=100')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.data || data.partners || data.engagements || []);
        setPartners(list);
        setPartnersLoading(false);
      })
      .catch(err => {
        console.error('Error fetching partners:', err);
        setPartnersLoading(false);
      });
  };

  // Returns B2B partners matching the current work place filter
  const matchedPartners = useMemo(() => {
    if (!filterWorkPlace || filterWorkPlace === 'All' || filterWorkPlace === 'Unassigned') return [];
    return getPartnersForWorkPlaces([filterWorkPlace], partners);
  }, [filterWorkPlace, partners]);

  const handleAssignWorkPlace = async () => {
    if (!selectedStaff) return;
    setAssigning(true);
    try {
      const res = await apiFetch(`/api/employees/${selectedStaff._id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...selectedStaff, assignedWorkPlace: draftWorkPlaces, department: draftDepartments, office: draftOffices, staffType: draftStaffType, onboardingStatus: 'Active' }),
      });
      
      if (res.ok) {
        setEmployees(prev => prev.map(emp => 
          emp._id === selectedStaff._id ? { ...emp, assignedWorkPlace: draftWorkPlaces, department: draftDepartments, office: draftOffices, staffType: draftStaffType, onboardingStatus: 'Active' } : emp
        ));
        setIsModalOpen(false);
        setSelectedStaff(null);
      }
    } catch (err) {
      console.error('Failed to assign work place:', err);
    } finally {
      setAssigning(false);
    }
  };

  const isOffice = (dept) => [
    'Audit & Compliance', 'Taxation', 'Payroll', 'HR', // Old ones
    ...OFFICE_DEPARTMENTS
  ].includes(dept);

  const filteredEmployees = employees.filter(emp => {
    const excluded = ['Missing Documents', 'Verification Pending'];
    if (excluded.includes(emp.onboardingStatus)) return false;

    const searchString = searchQuery.toLowerCase();
    const nameStr = `${emp.romajiName || ''} ${emp.katakanaName || ''}`.toLowerCase();
    const matchesSearch = nameStr.includes(searchString) || (emp._id && emp._id.toLowerCase().includes(searchString));
    
    const isEmpOffice = emp.staffType ? emp.staffType === 'Office Staff' : (Array.isArray(emp.department) ? emp.department.some(isOffice) : isOffice(emp.department));
    let matchesMainCategory = true;
    if (mainCategory === 'Haken') matchesMainCategory = !isEmpOffice;
    if (mainCategory === 'Office') matchesMainCategory = isEmpOffice;
    
    const isUnassigned = mainCategory === 'Haken' 
      ? (!emp.assignedWorkPlace || emp.assignedWorkPlace.length === 0) 
      : (!emp.office || emp.office.length === 0);

    let matchesFilter = false;
    if (filterWorkPlace === 'All') {
      matchesFilter = !isUnassigned;
    } else if (filterWorkPlace === 'Unassigned') {
      matchesFilter = isUnassigned;
    } else {
      if (mainCategory === 'Haken') {
        matchesFilter = includesValue(emp.assignedWorkPlace, filterWorkPlace);
      } else if (mainCategory === 'Office') {
        const isDepartmentFilter = OFFICE_DEPARTMENTS.includes(filterWorkPlace);
        if (isDepartmentFilter) {
          matchesFilter = includesValue(emp.department, filterWorkPlace);
        } else {
          matchesFilter = includesValue(emp.office, filterWorkPlace);
        }
      } else {
        matchesFilter = (includesValue(emp.assignedWorkPlace, filterWorkPlace) || includesValue(emp.department, filterWorkPlace) || includesValue(emp.office, filterWorkPlace));
      }
    }
                          
    return matchesSearch && matchesMainCategory && matchesFilter;
  });

  const getStat = (filterVal) => {
    const excluded = ['Missing Documents', 'Verification Pending'];
    let baseEmps = employees.filter(e => !excluded.includes(e.onboardingStatus));
    const isEmpOffice = (e) => e.staffType ? e.staffType === 'Office Staff' : (Array.isArray(e.department) ? e.department.some(isOffice) : isOffice(e.department));
    if (mainCategory === 'Haken') baseEmps = baseEmps.filter(e => !isEmpOffice(e));
    if (mainCategory === 'Office') baseEmps = baseEmps.filter(e => isEmpOffice(e));
    if (filterVal === 'All') {
      return baseEmps.filter(e => {
        const unassigned = mainCategory === 'Haken' 
          ? (!e.assignedWorkPlace || e.assignedWorkPlace.length === 0)
          : (!e.office || e.office.length === 0);
        return !unassigned;
      }).length;
    }
    if (filterVal === 'Unassigned') {
      return baseEmps.filter(e => 
        mainCategory === 'Haken' 
          ? (!e.assignedWorkPlace || e.assignedWorkPlace.length === 0)
          : (!e.office || e.office.length === 0)
      ).length;
    }
    
    if (mainCategory === 'Haken') {
      return baseEmps.filter(e => includesValue(e.assignedWorkPlace, filterVal)).length;
    } else if (mainCategory === 'Office') {
      const isDepartmentFilter = OFFICE_DEPARTMENTS.includes(filterVal);
      if (isDepartmentFilter) {
        return baseEmps.filter(e => includesValue(e.department, filterVal)).length;
      } else {
        return baseEmps.filter(e => includesValue(e.office, filterVal)).length;
      }
    } else {
      return baseEmps.filter(e => includesValue(e.assignedWorkPlace, filterVal) || includesValue(e.department, filterVal) || includesValue(e.office, filterVal)).length;
    }
  };

  const getSummaryStat = (type) => {
    const excluded = ['Missing Documents', 'Verification Pending'];
    const validEmps = employees.filter(e => !excluded.includes(e.onboardingStatus));
    const isEmpOffice = (e) => e.staffType ? e.staffType === 'Office Staff' : (Array.isArray(e.department) ? e.department.some(isOffice) : isOffice(e.department));
    switch (type) {
      case 'Haken':
        return validEmps.filter(e => !isEmpOffice(e)).length;
      case 'Office':
        return validEmps.filter(e => isEmpOffice(e)).length;
      default:
        return 0;
    }
  };

  const baseCards = [
    { name: '未配属', id: 'Unassigned', icon: MapPin, color: 'text-amber-500', bgColor: 'bg-white', borderColor: 'border-gray-200' },
    { name: '配属済み', id: 'All', icon: Users, color: 'text-blue-600', bgColor: 'bg-white', borderColor: 'border-gray-200' },
  ];

  const translateWorkPlace = (wp) => {
    switch(wp) {
      case 'Global Bittory': return 'グローバルビクトリー';
      case 'Hotels': return 'ホテル';
      case 'Food and Beverage': return '飲食';
      case 'Food and Beverage Manufacturing': return '飲食製造';
      case 'Cleaning': return '清掃';
      case 'Warehousing/Packaging': return '倉庫/梱包';
      case 'Telecommunications/Retail': return '通信/小売';
      case 'Registration Support': return '登録サポート';
      case 'Agriculture and Forestry': return '農林業';
      case 'Logistics': return '物流';
      case 'Transfer to Headquarters': return '本社へ異動';
      default: return wp.replace('and', '&').replace('Manufacturing', 'Mfg');
    }
  };

  const translateDepartment = (dept) => {
    switch(dept) {
      case 'Management': return '経営';
      case 'Administration': return '総務';
      case 'Accounting & Finance': return '経理・財務';
      case 'HR / Recruitment': return '人事・採用';
      case 'Sales': return '営業';
      case 'Marketing': return 'マーケティング';
      case 'IT / Technical': return 'IT・技術';
      case 'Customer Support': return 'カスタマーサポート';
      case 'Purchasing / Procurement': return '購買・調達';
      case 'Operations': return 'オペレーション';
      case 'Service': return 'サービス';
      case 'Farm Operations': return '農場運営';
      case 'Audit & Compliance': return '監査・コンプライアンス';
      case 'Taxation': return '税務';
      case 'Payroll': return '給与計算';
      case 'HR': return '人事';
      default: return dept;
    }
  };

  const translateOfficeLocation = (loc) => {
    switch(loc) {
      case 'Head Office Tsukiji Office': return '本社（築地）';
      case 'Harajuku Office': return '原宿オフィス';
      case 'Osaka Office': return '大阪オフィス';
      case 'Nagoya Office': return '名古屋オフィス';
      case 'Chitose Office': return '千歳オフィス';
      case 'Sapporo Office': return '札幌オフィス';
      case 'Fukuoka Office': return '福岡オフィス';
      case 'Kumamoto Office': return '熊本オフィス';
      case 'Kagoshima Office': return '鹿児島オフィス';
      case 'Utsunomiya Office': return '宇都宮オフィス';
      case 'Odawara Office': return '小田原オフィス';
      case 'Narita Office': return '成田オフィス';
      case 'Kasai Office': return '葛西オフィス';
      case 'Gunma Office': return '群馬オフィス';
      case 'Others': return 'その他';
      default: return loc;
    }
  };

  const hakenCardsConfig = [
    ...baseCards,
    ...WORK_PLACES.map(wp => ({
      name: translateWorkPlace(wp),
      id: wp,
      icon: getIconForWorkPlace(wp),
      color: getColorForWorkPlace(wp),
      bgColor: 'bg-white',
      borderColor: 'border-gray-200'
    }))
  ];

  const officeCardsConfig = [
    ...baseCards,
    ...OFFICE_DEPARTMENTS.map(dept => ({
      name: translateDepartment(dept),
      id: dept,
      icon: dept.includes('HR') ? Users : Building2,
      color: 'text-indigo-600', // unified color or can be dynamic
      bgColor: 'bg-white',
      borderColor: 'border-gray-200'
    }))
  ];

  const statCardsConfig = mainCategory === 'Haken' ? hakenCardsConfig : mainCategory === 'Office' ? officeCardsConfig : [
    ...hakenCardsConfig,
    ...officeCardsConfig.filter(c => c.id !== 'Unassigned' && c.id !== 'All')
  ];

  return (
    <div className="w-full pb-10">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button 
          onClick={() => { setMainCategory(mainCategory === 'Haken' ? 'All' : 'Haken'); setFilterWorkPlace('Unassigned'); }}
          className={`rounded-xl p-6 flex flex-col items-center justify-center shadow-md transition-all duration-200 border ${
            mainCategory === 'Haken' ? 'bg-[#162D50] text-white scale-[1.02] border-[#162D50]' : 'bg-white text-[#002244] border-gray-200 hover:border-[#162D50]'
          }`}
        >
          <Briefcase className="w-8 h-8 mb-3" />
          <p className="text-3xl font-bold mb-1">{getSummaryStat('Haken')}</p>
          <p className="text-xs font-bold uppercase tracking-wider">派遣スタッフ</p>
        </button>
        <button 
          onClick={() => { setMainCategory(mainCategory === 'Office' ? 'All' : 'Office'); setFilterWorkPlace('Unassigned'); }}
          className={`rounded-xl p-6 flex flex-col items-center justify-center shadow-sm transition-all duration-200 border ${
            mainCategory === 'Office' ? 'bg-[#162D50] text-white scale-[1.02] border-[#162D50]' : 'bg-white text-[#002244] border-gray-200 hover:border-[#162D50] hover:shadow-md'
          }`}
        >
          <Building2 className="w-8 h-8 mb-3" />
          <p className="text-3xl font-bold mb-1">{getSummaryStat('Office')}</p>
          <p className={`text-xs font-bold uppercase tracking-wider ${mainCategory === 'Office' ? 'text-gray-200' : 'text-gray-500'}`}>内勤スタッフ</p>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 mb-8">
        {statCardsConfig.map((card, idx) => {
          const value = getStat(card.id);
          const isSelected = filterWorkPlace === card.id;
            
          const isDark = isSelected || card.bgColor === 'bg-[#162D50]';
          const Icon = card.icon;
          
          return (
            <button 
              key={idx} 
              onClick={() => setFilterWorkPlace(card.id === 'Total Staff' ? 'All' : card.id)}
              className={`w-full text-center border rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'bg-[#162D50] border-[#162D50] shadow-md scale-[1.02]' 
                  : `${card.bgColor} ${card.borderColor} shadow-sm hover:shadow-md hover:-translate-y-1`
              }`}
            >
              {isDark && (
                <div className="absolute top-0 right-0 p-2 opacity-20">
                  <Icon className="w-12 h-12 text-white" />
                </div>
              )}
              <Icon className={`w-7 h-7 mb-2 ${isSelected ? 'text-white' : card.color} ${isDark ? 'opacity-90' : ''}`} />
              <p className={`text-3xl font-bold mb-1 z-10 ${isDark ? 'text-white' : 'text-[#162D50]'}`}>{value}</p>
              <p className={`text-xs font-medium uppercase tracking-wider text-center z-10 ${isDark ? 'text-gray-200' : 'text-gray-500'}`}>
                {card.name}
              </p>
            </button>
          );
        })}
      </div>

      {/* B2B Partner Companies Panel */}
      {mainCategory === 'Haken' && filterWorkPlace !== 'All' && filterWorkPlace !== 'Unassigned' && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#162D50]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#162D50] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#162D50] text-sm">
                  {translateWorkPlace(filterWorkPlace)} — 関連B2Bパートナー
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {partnersLoading ? '読み込み中...' : `${matchedPartners.length}件のパートナー企業`}
                </p>
              </div>
            </div>
          </div>

          {partnersLoading ? (
            <div className="p-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#162D50] rounded-full animate-spin" />
              パートナー情報を読み込み中...
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
                  const today = new Date();
                  const daysLeft = contractEnd ? Math.ceil((contractEnd - today) / (1000 * 60 * 60 * 24)) : null;
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
                  const isExpired = daysLeft !== null && daysLeft <= 0;

                  return (
                    <div
                      key={partner._id}
                      className="rounded-xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                    >
                      {/* Card header */}
                      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#162D50]/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-[#162D50]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#162D50] text-sm leading-tight truncate">{partner.partner_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 truncate">{partner.industry || '—'}</p>
                          </div>
                        </div>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isActive ? '契約中' : partner.status || '—'}
                        </span>
                      </div>

                      {/* Card body */}
                      <div className="px-4 py-3 space-y-2">
                        {partner.contact_name && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{partner.contact_name}</span>
                          </div>
                        )}
                        {partner.contact_phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{partner.contact_phone}</span>
                          </div>
                        )}
                        {partner.contact_email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{partner.contact_email}</span>
                          </div>
                        )}
                        {partner.monthly_revenue != null && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <TrendingUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>¥{Number(partner.monthly_revenue).toLocaleString()}/月</span>
                          </div>
                        )}

                        {/* Contract expiry */}
                        {contractEnd && (
                          <div className={`flex items-center gap-2 text-xs font-medium mt-1 ${
                            isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {isExpired
                              ? `契約終了 ${Math.abs(daysLeft)}日前`
                              : isExpiringSoon
                              ? `契約終了まで${daysLeft}日`
                              : `契約満了: ${contractEnd.toLocaleDateString('ja-JP')}`}
                          </div>
                        )}

                        {/* Staff placed */}
                        {(() => {
                          const placedCount = employees.filter(e =>
                            Array.isArray(e.assignedWorkPlace)
                              ? e.assignedWorkPlace.some(wp => wp === filterWorkPlace)
                              : e.assignedWorkPlace === filterWorkPlace
                          ).length;
                          return (
                            <div className="flex items-center gap-2 text-xs text-[#162D50] font-semibold">
                              <Users className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>配属スタッフ: {placedCount}名</span>
                            </div>
                          );
                        })()}
                      </div>

                      {partner.website && (
                        <div className="px-4 py-2 border-t border-gray-100">
                          <a
                            href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            <Globe className="w-3 h-3" />
                            ウェブサイト
                            <ExternalLink className="w-3 h-3" />
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
          {filterWorkPlace === 'All' ? '配属先一覧' : 
           filterWorkPlace === 'Unassigned' ? '未配属スタッフ一覧' : 
           `${filterWorkPlace} スタッフ一覧`}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="スタッフを検索..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] bg-white"
            />
          </div>
          <div className="relative w-full sm:w-48 text-sm">
            <select
              value={filterWorkPlace}
              onChange={(e) => setFilterWorkPlace(e.target.value)}
              className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162D50] bg-white appearance-none cursor-pointer"
            >
              <option value="All">{mainCategory === 'Office' ? 'すべてのオフィス' : 'すべての拠点'}</option>
              <option value="Unassigned">未配属</option>
              {mainCategory === 'Office' 
                ? OFFICE_LOCATIONS.map(loc => <option key={loc} value={loc}>{translateOfficeLocation(loc)}</option>)
                : WORK_PLACES.map(place => <option key={place} value={place}>{translateWorkPlace(place)}</option>)
              }
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
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
                <th className="py-4 px-6">入社日</th>
                <th className="py-4 px-6 text-center">アクション</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 px-6 text-center text-gray-500">スタッフデータを読み込み中...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 px-6 text-center text-gray-500">スタッフ記録が見つかりません。</td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <tr key={employee._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="py-4 px-6 font-medium text-gray-500">{index + 1}</td>
                    <td className="py-4 px-6 font-medium text-[#162D50]">#{employee._id?.slice(-6).toUpperCase() || 'NEW'}</td>
                    <td className="py-4 px-6 font-bold text-gray-900">{employee.romajiName || 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-600">{employee.joiningType || employee.staffType || '派遣スタッフ'}</td>
                    <td className="py-4 px-6 text-gray-600">{Array.isArray(employee.department) ? employee.department.map(translateDepartment).join(', ') : translateDepartment(employee.department) || 'N/A'}</td>
                    <td className="py-4 px-6">
                      {mainCategory === 'Office' ? (
                        employee.office && employee.office.length > 0 ? (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold whitespace-nowrap">
                            {Array.isArray(employee.office) ? employee.office.map(translateOfficeLocation).join(', ') : translateOfficeLocation(employee.office)}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold whitespace-nowrap">
                            未配属
                          </span>
                        )
                      ) : employee.assignedWorkPlace && employee.assignedWorkPlace.length > 0 ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold whitespace-nowrap">
                          {Array.isArray(employee.assignedWorkPlace) ? employee.assignedWorkPlace.map(translateWorkPlace).join(', ') : translateWorkPlace(employee.assignedWorkPlace)}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold whitespace-nowrap">
                          未配属
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-center space-x-2">
                      <button
                        onClick={() => { setViewStaff(employee); setIsViewModalOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-[#162D50] hover:bg-blue-50 rounded-md transition-colors"
                        title="詳細を表示"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        className="px-3 py-1.5 bg-[#162D50] text-white hover:bg-[#0f1f3a] rounded-md text-xs font-bold transition-colors"
                        onClick={() => {
                          const handleOpenModal = (staff) => {
                            setSelectedStaff(staff);
                            setDraftWorkPlaces(Array.isArray(staff.assignedWorkPlace) ? staff.assignedWorkPlace : (staff.assignedWorkPlace ? [staff.assignedWorkPlace] : []));
                            setDraftDepartments(Array.isArray(staff.department) ? staff.department : (staff.department ? [staff.department] : []));
                            setDraftOffices(Array.isArray(staff.office) ? staff.office : (staff.office ? [staff.office] : []));
                            
                            if (staff.staffType) {
                              setDraftStaffType(staff.staffType);
                            } else if (staff.department) {
                              const deptArray = Array.isArray(staff.department) ? staff.department : [staff.department];
                              const isOfficeDept = deptArray.some(d => ['Audit & Compliance', 'Taxation', 'Payroll', 'HR', ...OFFICE_DEPARTMENTS].includes(d));
                              setDraftStaffType(isOfficeDept ? 'Office Staff' : 'Haken Staff');
                            } else {
                              setDraftStaffType('Haken Staff');
                            }
                            
                            setIsModalOpen(true);
                          };
                          handleOpenModal(employee);
                        }}
                      >
                        配属する
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {isModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-[#162D50] flex items-center">
                <MapPin className="w-6 h-6 mr-3 text-blue-600" />
                配属先詳細
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1 bg-gray-50/50">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Left Col: Staff Details */}
                <div className="w-full md:w-1/3">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#162D50] to-blue-800 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-md mx-auto">
                      {(selectedStaff.romajiName || 'A').charAt(0)}
                    </div>
                    <div className="text-center mb-6">
                      <h4 className="font-bold text-xl text-gray-900 mb-1">{selectedStaff.romajiName}</h4>
                      <p className="text-sm text-gray-500">{selectedStaff.katakanaName}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{selectedStaff.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="font-medium truncate" title={selectedStaff.email}>{selectedStaff.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="font-medium">入社日: {selectedStaff.joinDate ? new Date(selectedStaff.joinDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{Array.isArray(selectedStaff.department) ? selectedStaff.department.map(translateDepartment).join(', ') : (translateDepartment(selectedStaff.department) || '部署なし')}</span>
                      </div>
                    </div>
                    
                    {selectedStaff.assignedWorkPlace && (
                      <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">現在の配属</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-center text-blue-800 font-bold text-center">
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          {Array.isArray(selectedStaff.assignedWorkPlace) ? selectedStaff.assignedWorkPlace.join(', ') : selectedStaff.assignedWorkPlace}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Col: Workplace & Department Selection */}
                <div className="w-full md:w-2/3">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-full flex flex-col gap-8">
                    
                    {/* Staff Type */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 text-md border-b border-gray-100 pb-2">スタッフタイプを選択</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {['Haken Staff', 'Office Staff'].map((type, idx) => {
                          const isSelected = draftStaffType === type;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setDraftStaffType(type);
                                setDraftDepartments([]); // Reset dept when changing type
                              }}
                              disabled={assigning}
                              className={`
                                group text-left p-3 rounded-lg border-2 transition-all duration-200 relative overflow-hidden
                                ${isSelected 
                                  ? 'border-[#162D50] bg-[#162D50] text-white shadow-sm' 
                                  : 'border-gray-200 bg-white hover:border-[#162D50] text-gray-700'
                                }
                                ${assigning ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              <div className="flex items-center justify-between relative z-10 text-sm">
                                <div className="flex items-center">
                                  {type === 'Haken Staff' ? <Briefcase className="w-4 h-4 mr-2 opacity-80" /> : <Building2 className="w-4 h-4 mr-2 opacity-80" />}
                                  <span className={`font-semibold leading-tight pr-4 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                    {type === 'Haken Staff' ? '派遣スタッフ' : '内勤スタッフ'}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Select Office (Only for Office Staff) */}
                    {draftStaffType === 'Office Staff' && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-4 text-md border-b border-gray-100 pb-2">オフィスを選択</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {OFFICE_LOCATIONS.map((loc, idx) => {
                            const isSelected = draftOffices.includes(loc);
                            return (
                              <button
                                key={idx}
                                onClick={() => setDraftOffices(draftOffices.includes(loc) ? draftOffices.filter(d => d !== loc) : [...draftOffices, loc])}
                                disabled={assigning}
                                className={`
                                  group text-left p-3 rounded-lg border-2 transition-all duration-200 relative overflow-hidden
                                  ${isSelected 
                                    ? 'border-[#162D50] bg-[#162D50] text-white shadow-sm' 
                                    : 'border-gray-200 bg-white hover:border-[#162D50] text-gray-700'
                                  }
                                  ${assigning ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                              >
                                <div className="flex items-center justify-between relative z-10 text-sm">
                                  <span className={`font-semibold leading-tight pr-4 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                    {translateOfficeLocation(loc)}
                                  </span>
                                  {isSelected ? (
                                    <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Department */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 text-md border-b border-gray-100 pb-2">部署を選択</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ALL_DEPARTMENTS.filter(dept => 
                          draftStaffType === 'Office Staff' 
                            ? [
                                'Audit & Compliance', 'Taxation', 'Payroll', 'HR', // Old
                                ...OFFICE_DEPARTMENTS
                              ].includes(dept)
                            : ![
                                'Audit & Compliance', 'Taxation', 'Payroll', 'HR', // Old
                                ...OFFICE_DEPARTMENTS
                              ].includes(dept)
                        ).map((dept, idx) => {
                          const isSelected = draftDepartments.includes(dept);
                          return (
                            <button
                              key={idx}
                              onClick={() => setDraftDepartments(draftDepartments.includes(dept) ? draftDepartments.filter(d => d !== dept) : [...draftDepartments, dept])}
                              disabled={assigning}
                              className={`
                                group text-left p-3 rounded-lg border-2 transition-all duration-200 relative overflow-hidden
                                ${isSelected 
                                  ? 'border-[#162D50] bg-[#162D50] text-white shadow-sm' 
                                  : 'border-gray-200 bg-white hover:border-[#162D50] text-gray-700'
                                }
                                ${assigning ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              <div className="flex items-center justify-between relative z-10 text-sm">
                                <span className={`font-semibold leading-tight pr-4 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                  {translateDepartment(dept)}
                                </span>
                                {isSelected ? (
                                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Workplace Category */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 text-md border-b border-gray-100 pb-2">配属先カテゴリーを選択</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {WORK_PLACES.map((place, idx) => {
                          const isSelected = draftWorkPlaces.includes(place);
                          return (
                            <button
                              key={idx}
                              onClick={() => setDraftWorkPlaces(draftWorkPlaces.includes(place) ? draftWorkPlaces.filter(p => p !== place) : [...draftWorkPlaces, place])}
                              disabled={assigning}
                              className={`
                                group text-left p-3 rounded-lg border-2 transition-all duration-200 relative overflow-hidden
                                ${isSelected 
                                  ? 'border-[#162D50] bg-[#162D50] text-white shadow-sm' 
                                  : 'border-gray-200 bg-white hover:border-[#162D50] text-gray-700'
                                }
                                ${assigning ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              <div className="flex items-center justify-between relative z-10 text-sm">
                                <span className={`font-semibold leading-tight pr-4 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                  {translateWorkPlace(place)}
                                </span>
                                {isSelected ? (
                                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors focus:ring-4 focus:ring-gray-100"
              >
                閉じる
              </button>
              <button 
                onClick={handleAssignWorkPlace}
                disabled={assigning}
                className="px-6 py-2.5 bg-[#162D50] text-white font-bold rounded-xl hover:bg-[#0f1f3a] transition-colors focus:ring-4 focus:ring-[#162D50]/30 disabled:opacity-50 flex items-center"
              >
                {assigning ? '配属中...' : '配属を確定'}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Staff View Modal */}
      {isViewModalOpen && viewStaff && (() => {
        const _status = viewStaff.onboardingStatus || viewStaff['onboardingステータス'] || 'Active';
        const _isActive = _status === 'Active';
        const _tenureDays = viewStaff.joinDate ? Math.floor((new Date() - new Date(viewStaff.joinDate)) / (1000*60*60*24)) : null;
        const _tenureText = _tenureDays === null ? '—' : _tenureDays < 30 ? `${_tenureDays}日` : _tenureDays < 365 ? `${Math.floor(_tenureDays/30)}ヶ月` : `${Math.floor(_tenureDays/365)}年${Math.floor((_tenureDays%365)/30)}ヶ月`;
        const _visaEnd = viewStaff.visaEndDate ? new Date(viewStaff.visaEndDate) : null;
        const _visaDaysLeft = _visaEnd ? Math.ceil((_visaEnd - new Date()) / (1000*60*60*24)) : null;
        const _workPlaces = Array.isArray(viewStaff.assignedWorkPlace) ? viewStaff.assignedWorkPlace : (viewStaff.assignedWorkPlace ? [viewStaff.assignedWorkPlace] : []);
        const _departments = Array.isArray(viewStaff.department) ? viewStaff.department : (viewStaff.department ? [viewStaff.department] : []);
        const _offices = Array.isArray(viewStaff.office) ? viewStaff.office : (viewStaff.office ? [viewStaff.office] : []);
        const _linkedPartners = _workPlaces.length > 0
          ? getPartnersForWorkPlaces(_workPlaces, partners)
          : partners.filter(p => (p.status||'').toLowerCase() === 'active').slice(0, 4);
        const _isUnassignedPartners = _workPlaces.length === 0;
        const _colleagues = _workPlaces.length > 0
          ? employees.filter(e => e._id !== viewStaff._id && _workPlaces.some(wp => Array.isArray(e.assignedWorkPlace) ? e.assignedWorkPlace.includes(wp) : e.assignedWorkPlace === wp)).length
          : 0;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-[#162D50] via-[#1a3460] to-[#0f2040] px-6 pt-6 pb-0 flex-shrink-0">
              <button onClick={() => { setIsViewModalOpen(false); setViewStaff(null); }} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-end gap-5 pb-5">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {(viewStaff.romajiName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white ${_isActive ? 'bg-green-400' : 'bg-amber-400'}`} />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${_isActive ? 'bg-green-400/20 text-green-300' : 'bg-amber-400/20 text-amber-300'}`}>{_status}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70">{viewStaff.staffType || viewStaff.joiningType || 'Haken Staff'}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white leading-tight truncate">{viewStaff.romajiName || 'N/A'}</h2>
                  <p className="text-sm text-white/60">{viewStaff.katakanaName || ''}</p>
                  <p className="text-xs font-mono text-white/40 mt-1">ID: #{viewStaff._id?.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 border-t border-white/10 -mx-6">
                {[
                  { label: '勤続期間', value: _tenureText, sub: viewStaff.joinDate ? new Date(viewStaff.joinDate).toLocaleDateString('ja-JP') : '—' },
                  { label: '配属先', value: _workPlaces.length > 0 ? translateWorkPlace(_workPlaces[0]) : '未配属', sub: _workPlaces.length > 1 ? `+${_workPlaces.length-1}` : '' },
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

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT col */}
                <div className="space-y-4">
                  {/* Contact card */}
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
                  {/* Visa card */}
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
                          <div className="flex justify-between text-xs text-gray-400 mb-1"><span>残存率</span><span>{_visaDaysLeft !== null && _visaDaysLeft > 0 ? `${Math.min(100,Math.round(_visaDaysLeft/365*100))}%` : '0%'}</span></div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${_visaDaysLeft !== null && _visaDaysLeft <= 60 ? 'bg-red-400' : _visaDaysLeft !== null && _visaDaysLeft <= 180 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${_visaDaysLeft !== null && _visaDaysLeft > 0 ? Math.min(100,Math.round(_visaDaysLeft/365*100)) : 0}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT col */}
                <div className="space-y-4">
                  {/* Work assignment */}
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
                            const wpCol = getColorForWorkPlace(wp);
                            return (<span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold"><WpIcon className={`w-3.5 h-3.5 ${wpCol}`} />{translateWorkPlace(wp)}</span>);
                          }) : <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold">未配属</span>}
                        </div>
                      </div>
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
                    </div>
                  </div>
                  {/* Linked B2B */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#162D50]" />
                        <span className="text-xs font-bold text-[#162D50] uppercase tracking-wider">関連B2Bパートナー</span>
                        {_isUnassignedPartners && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">アクティブ一覧</span>}
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{_linkedPartners.length}社</span>
                    </div>

                    {partnersLoading ? (
                      <div className="p-5 flex items-center justify-center gap-2 text-gray-400 text-sm">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-[#162D50] rounded-full animate-spin" />
                        読み込み中...
                      </div>
                    ) : _linkedPartners.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                        <p className="text-sm text-gray-400 font-medium">パートナー企業が見つかりません</p>
                        <p className="text-xs text-gray-400 mt-1">配属先を設定するとパートナーが表示されます</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                        {_linkedPartners.map((p) => {
                          const _pEnd = p.contract_end_date ? new Date(p.contract_end_date) : null;
                          const _pStart = p.contract_start_date ? new Date(p.contract_start_date) : null;
                          const _pDays = _pEnd ? Math.ceil((_pEnd - new Date()) / (1000*60*60*24)) : null;
                          const _totalDays = (_pEnd && _pStart) ? Math.ceil((_pEnd - _pStart) / (1000*60*60*24)) : null;
                          const _usedDays = (_pEnd && _pStart) ? Math.ceil((new Date() - _pStart) / (1000*60*60*24)) : null;
                          const _contractPct = (_totalDays && _usedDays) ? Math.min(100, Math.max(0, Math.round(_usedDays / _totalDays * 100))) : null;
                          const _pStatusCfg = {
                            'active':        { label: '契約中', cls: 'bg-green-100 text-green-700' },
                            'expiring soon': { label: '期限間近', cls: 'bg-amber-100 text-amber-700' },
                            'pending':       { label: '提案中', cls: 'bg-blue-100 text-blue-700' },
                            'terminated':    { label: '終了', cls: 'bg-red-100 text-red-700' },
                          }[(p.status||'').toLowerCase()] || { label: p.status||'—', cls: 'bg-gray-100 text-gray-500' };
                          const _priorityCfg = {
                            'High':   'bg-red-50 text-red-600 border-red-200',
                            'Medium': 'bg-amber-50 text-amber-600 border-amber-200',
                            'Low':    'bg-gray-50 text-gray-500 border-gray-200',
                          }[p.priority] || 'bg-gray-50 text-gray-500 border-gray-200';

                          return (
                            <div key={p._id} className="px-4 py-3 hover:bg-blue-50/30 transition-colors group">
                              {/* Top row */}
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-[#162D50] leading-tight truncate">{p.partner_name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{p.industry||'—'}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {p.priority && <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${_priorityCfg}`}>{p.priority}</span>}
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${_pStatusCfg.cls}`}>{_pStatusCfg.label}</span>
                                </div>
                              </div>

                              {/* Details row */}
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                                {p.contact_name && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <User className="w-3 h-3 text-gray-400" />{p.contact_name}
                                  </span>
                                )}
                                {p.contact_phone && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-gray-400" />{p.contact_phone}
                                  </span>
                                )}
                                {p.monthly_revenue > 0 && (
                                  <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-green-500" />¥{Number(p.monthly_revenue).toLocaleString()}/月
                                  </span>
                                )}
                              </div>

                              {/* Contract progress bar */}
                              {_contractPct !== null && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>契約進捗</span>
                                    <span className={_pDays !== null && _pDays <= 30 ? 'text-red-500 font-medium' : ''}>
                                      {_pDays !== null && _pDays <= 0 ? '期限切れ' : _pDays !== null ? `残${_pDays}日` : '—'}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${_pDays !== null && _pDays <= 30 ? 'bg-red-400' : _pDays !== null && _pDays <= 90 ? 'bg-amber-400' : 'bg-[#162D50]'}`}
                                      style={{ width: `${_contractPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Notes */}
                              {p.notes && (
                                <p className="text-xs text-gray-400 mt-1.5 italic leading-tight line-clamp-1">{p.notes}</p>
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

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  const staff = viewStaff;
                  setIsViewModalOpen(false);
                  setViewStaff(null);
                  setSelectedStaff(staff);
                  setDraftWorkPlaces(Array.isArray(staff.assignedWorkPlace) ? staff.assignedWorkPlace : (staff.assignedWorkPlace ? [staff.assignedWorkPlace] : []));
                  setDraftDepartments(Array.isArray(staff.department) ? staff.department : (staff.department ? [staff.department] : []));
                  setDraftOffices(Array.isArray(staff.office) ? staff.office : (staff.office ? [staff.office] : []));
                  const _deptArr = Array.isArray(staff.department) ? staff.department : (staff.department ? [staff.department] : []);
                  const _isOfficeDept = _deptArr.some(d => ['Audit & Compliance', 'Taxation', 'Payroll', 'HR', ...OFFICE_DEPARTMENTS].includes(d));
                  setDraftStaffType(staff.staffType || (_isOfficeDept ? 'Office Staff' : 'Haken Staff'));
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#162D50] text-white font-bold rounded-xl hover:bg-[#0f1f3a] transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
                配属を変更
              </button>
              <button
                onClick={() => { setIsViewModalOpen(false); setViewStaff(null); }}
                className="px-5 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
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
