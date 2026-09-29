import { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Filter, Eye, Edit2, MoreVertical } from 'lucide-react';
import StaffSkillSheetModal from './StaffSkillSheetModal';
import StaffEditModal from './StaffEditModal';
import OnboardingActionModal from './OnboardingActionModal';
import { apiFetch } from '../../utils/apiFetch.js';


export default function StaffList({ setActiveTab }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffToView, setSelectedStaffToView] = useState(null);
  const [selectedStaffToEdit, setSelectedStaffToEdit] = useState(null);
  const [actionModalStaff, setActionModalStaff] = useState(null);
  const [activeTab, setLocalActiveTab] = useState('New Reg. Staff');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [joinDateFilter, setJoinDateFilter] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editModalTab, setEditModalTab] = useState('Basic');

  // Close dropdown when clicking outside
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const OFFICE_DEPARTMENTS = [
    'HR', 'HR / Recruitment', 'HR / Administration',
    'IT', 'IT / Technical', 'Audit & Compliance',
    'Operations', 'Payroll', 'Management'
  ];
  const isOffice = (dept) => OFFICE_DEPARTMENTS.some(d => dept.includes(d));
  const isEmpOffice = (e) => e.staffType ? e.staffType === 'Office Staff' : (Array.isArray(e.department) ? e.department.some(isOffice) : isOffice(e.department || ''));

  useEffect(() => {
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
  }, []);

  const handleEditComplete = (updatedEmployee) => {
    setEmployees(prev => prev.map(emp => 
      emp._id === updatedEmployee._id ? updatedEmployee : emp
    ));
    setSelectedStaffToEdit(null);
  };

  const getPendingItems = (employee) => {
    if (!employee || !employee.onboardingStatus || employee.onboardingStatus === 'Active' || employee.onboardingStatus === 'Completed') return [];
    return employee.onboardingStatus.split(',').map(s => s.trim()).filter(Boolean);
  };

  const getPrimaryAction = (employee) => {
    if (employee.onboardingStatus === 'Active' || employee.onboardingStatus === 'Completed') {
      return { 
        label: 'View', 
        type: 'default', 
        className: 'bg-transparent text-[#162D50] font-bold hover:bg-blue-50',
        onClick: () => setSelectedStaffToView(employee) 
      };
    }

    const pendingItems = getPendingItems(employee);
    if (pendingItems.length > 0 && pendingItems.some(i => i === 'Missing Documents' || i.includes('Verification'))) {
      return { 
        label: 'アクション Required', 
        type: 'urgent', 
        className: 'bg-[#E30A17] text-white hover:bg-red-700 relative group',
        onClick: () => setActionModalStaff(employee),
        badge: pendingItems.length,
        tooltip: pendingItems.join(', ')
      };
    }
    
    if (employee.visaEndDate) {
      const daysUntilExpiry = (new Date(employee.visaEndDate) - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
        return { 
          label: 'Renew', 
          type: 'warning', 
          className: 'bg-[#162D50] text-white hover:bg-[#0f1f3a]',
          onClick: () => { setSelectedStaffToEdit(employee); setEditModalTab('Visa'); } 
        };
      }
    }

    return { 
      label: 'View', 
      type: 'default', 
      className: 'bg-transparent text-[#162D50] font-bold hover:bg-blue-50',
      onClick: () => setSelectedStaffToView(employee) 
    };
  };

  // Filter employees based on all criteria
  const filteredEmployees = employees.filter(employee => {
    // 1. Tab Filtering
    let matchesTab = true;
    
    if (activeTab === 'Haken Staff') {
      matchesTab = !isEmpOffice(employee);
    } else if (activeTab === 'Office Staff') {
      matchesTab = isEmpOffice(employee);
    } else if (activeTab === 'New Reg. Staff') {
      matchesTab = employee.onboardingStatus && employee.onboardingStatus !== 'Active' && employee.onboardingStatus !== 'Completed';
    }

    // 2. Search Query Filtering
    const searchString = searchQuery.toLowerCase();
    const nameStr = `${employee.romajiName || ''} ${employee.katakanaName || ''}`.toLowerCase();
    const idStr = employee._id ? employee._id.toLowerCase() : '';
    const matchesSearch = nameStr.includes(searchString) || idStr.includes(searchString);

    // 3. Join 日付 Filtering
    let matchesDate = true;
    if (joinDateFilter) {
      const empDate = new Date(employee.joinDate).toISOString().split('T')[0];
      matchesDate = empDate === joinDateFilter;
    }

    return matchesTab && matchesSearch && matchesDate;
  });

  return (
    <div className="w-full pb-10">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">全スタッフ</p>
          <p className="text-3xl font-bold text-[#162D50]">{employees.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">全派遣スタッフ</p>
          <p className="text-3xl font-bold text-[#162D50]">
            {employees.filter(e => !isEmpOffice(e)).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">全内勤スタッフ</p>
          <p className="text-3xl font-bold text-[#162D50]">
            {employees.filter(e => isEmpOffice(e)).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">新規登録スタッフ</p>
          <p className="text-3xl font-bold text-yellow-500">
            {employees.filter(e => e.onboardingStatus && e.onboardingStatus !== 'Active' && e.onboardingStatus !== 'Completed').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['All Staff', 'Haken Staff', 'Office Staff', 'New Reg. Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setLocalActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-[#162D50] text-[#162D50] font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'All Staff' ? '全スタッフ' : tab === 'Haken Staff' ? '派遣スタッフ' : tab === 'Office Staff' ? '内勤スタッフ' : '新規登録スタッフ'}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="名前またはスタッフIDで検索..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <input 
            type="date" 
            value={joinDateFilter}
            onChange={(e) => setJoinDateFilter(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
        </div>
        <button 
          onClick={() => {
            setSearchQuery('');
            setJoinDateFilter('');
            setLocalActiveTab('New Reg. Staff');
          }}
          className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto"
        >
          <Filter className="w-4 h-4 mr-2" />
          フィルターをクリア
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6 w-16">S.N.</th>
                <th className="py-4 px-6">スタッフID</th>
                <th className="py-4 px-6">氏名</th>
                <th className="py-4 px-6">部署</th>
                <th className="py-4 px-6">入社日</th>
                <th className="py-4 px-6">オンボーディング状況</th>
                <th className="py-4 px-6 text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-4 px-6 text-center text-gray-500">読み込み中...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 px-6 text-center text-gray-500">条件に一致するスタッフが見つかりません。</td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <tr key={employee._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-600 font-medium">{index + 1}</td>
                    <td className="py-4 px-6 font-medium text-[#162D50]">{employee.staffId ? employee.staffId.replace(/[#-]/g, '') : `STF${employee._id.slice(-6).toUpperCase()}`}</td>
                    <td className="py-4 px-6 font-bold text-gray-900">{employee.romajiName || employee.katakanaName}</td>
                    <td className="py-4 px-6 text-gray-600">{Array.isArray(employee.department) ? employee.department.join(', ') : employee.department}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        employee.onboardingStatus === 'Active' || employee.onboardingStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                        employee.onboardingStatus?.includes('Missing') ? 'bg-red-100 text-red-700' :
                        employee.onboardingStatus?.includes('Verification') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {employee.onboardingStatus === 'Active' ? 'アクティブ' : 
                         employee.onboardingStatus === 'Completed' ? '完了' : 
                         (employee.onboardingStatus || 'アクティブ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(() => {
                          const action = getPrimaryAction(employee);
                          return (
                            <div className="relative group flex items-center">
                              <button 
                                onClick={action.onClick}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors border relative ${action.type === 'default' ? 'border-transparent' : 'border-transparent'} ${action.className}`}
                              >
                                {action.label}
                                {action.badge > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs text-gray-900 font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">
                                    {action.badge}
                                  </span>
                                )}
                              </button>
                              {action.tooltip && (
                                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-max max-w-xs bg-gray-800 text-white text-xs rounded p-2 shadow-lg z-10">
                                  {action.tooltip}
                                  <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        
                        <div className="relative" ref={activeDropdown === employee._id ? dropdownRef : null}>
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === employee._id ? null : employee._id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {activeDropdown === employee._id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-10 py-1">
                              <button 
                                onClick={() => { setSelectedStaffToView(employee); setActiveDropdown(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </button>
                              <button 
                                onClick={() => { setSelectedStaffToEdit(employee); setEditModalTab('Basic'); setActiveDropdown(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStaffToView && (
        <StaffSkillSheetModal 
          employee={selectedStaffToView} 
          onClose={() => setSelectedStaffToView(null)} 
        />
      )}

      {selectedStaffToEdit && (
        <StaffEditModal 
          employee={selectedStaffToEdit} 
          onClose={() => setSelectedStaffToEdit(null)}
          onEditComplete={handleEditComplete}
          initialTab={editModalTab}
        />
      )}

      {actionModalStaff && (
        <OnboardingActionModal 
          employee={actionModalStaff}
          onClose={() => setActionModalStaff(null)}
          onComplete={handleEditComplete}
        />
      )}
    </div>
  );
}
