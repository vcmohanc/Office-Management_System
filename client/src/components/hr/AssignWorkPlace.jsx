import React, { useState, useEffect } from 'react';
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
  Antenna
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

export default function AssignWorkPlace() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const includesValue = (field, value) => {
    if (!field) return false;
    if (Array.isArray(field)) return field.includes(value);
    return field === value;
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/employees')
      .then(res => res.json())
      .then(data => {
        // Fetch all staff so we can route non-active ones to Unassigned
        setEmployees(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching employees:', err);
        setLoading(false);
      });
  };

  const handleAssignWorkPlace = async () => {
    if (!selectedStaff) return;
    setAssigning(true);
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${selectedStaff._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...selectedStaff, assignedWorkPlace: draftWorkPlaces, department: draftDepartments, office: draftOffices, staffType: draftStaffType, onboardingStatus: 'Active' })
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
    const searchString = searchQuery.toLowerCase();
    const nameStr = `${emp.romajiName || ''} ${emp.katakanaName || ''}`.toLowerCase();
    const matchesSearch = nameStr.includes(searchString) || (emp._id && emp._id.toLowerCase().includes(searchString));
    
    const isEmpOffice = emp.staffType ? emp.staffType === 'Office Staff' : (Array.isArray(emp.department) ? emp.department.some(isOffice) : isOffice(emp.department));
    let matchesMainCategory = true;
    if (mainCategory === 'Haken') matchesMainCategory = !isEmpOffice;
    if (mainCategory === 'Office') matchesMainCategory = isEmpOffice;
    
    const isUnassigned = (!emp.assignedWorkPlace || emp.assignedWorkPlace.length === 0) && (!emp.department || emp.department.length === 0) || emp.onboardingStatus !== 'Active';

    let matchesFilter = false;
    if (filterWorkPlace === 'All') {
      matchesFilter = true;
    } else if (filterWorkPlace === 'Unassigned') {
      matchesFilter = isUnassigned;
    } else {
      if (mainCategory === 'Haken') {
        matchesFilter = includesValue(emp.assignedWorkPlace, filterWorkPlace) && emp.onboardingStatus === 'Active';
      } else if (mainCategory === 'Office') {
        const isDepartmentFilter = OFFICE_DEPARTMENTS.includes(filterWorkPlace);
        if (isDepartmentFilter) {
          matchesFilter = includesValue(emp.department, filterWorkPlace) && emp.onboardingStatus === 'Active';
        } else {
          matchesFilter = includesValue(emp.office, filterWorkPlace) && emp.onboardingStatus === 'Active';
        }
      } else {
        matchesFilter = (includesValue(emp.assignedWorkPlace, filterWorkPlace) || includesValue(emp.department, filterWorkPlace) || includesValue(emp.office, filterWorkPlace)) && emp.onboardingStatus === 'Active';
      }
    }
                          
    return matchesSearch && matchesMainCategory && matchesFilter;
  });

  const getStat = (filterVal) => {
    let baseEmps = employees;
    const isEmpOffice = (e) => e.staffType ? e.staffType === 'Office Staff' : (Array.isArray(e.department) ? e.department.some(isOffice) : isOffice(e.department));
    if (mainCategory === 'Haken') baseEmps = employees.filter(e => !isEmpOffice(e));
    if (mainCategory === 'Office') baseEmps = employees.filter(e => isEmpOffice(e));
    
    if (filterVal === 'All') return baseEmps.length;
    if (filterVal === 'Unassigned') return baseEmps.filter(e => (!e.assignedWorkPlace || e.assignedWorkPlace.length === 0) && (!e.department || e.department.length === 0) || e.onboardingStatus !== 'Active').length;
    
    if (mainCategory === 'Haken') {
      return baseEmps.filter(e => includesValue(e.assignedWorkPlace, filterVal) && e.onboardingStatus === 'Active').length;
    } else if (mainCategory === 'Office') {
      const isDepartmentFilter = OFFICE_DEPARTMENTS.includes(filterVal);
      if (isDepartmentFilter) {
        return baseEmps.filter(e => includesValue(e.department, filterVal) && e.onboardingStatus === 'Active').length;
      } else {
        return baseEmps.filter(e => includesValue(e.office, filterVal) && e.onboardingStatus === 'Active').length;
      }
    } else {
      return baseEmps.filter(e => (includesValue(e.assignedWorkPlace, filterVal) || includesValue(e.department, filterVal) || includesValue(e.office, filterVal)) && e.onboardingStatus === 'Active').length;
    }
  };

  const getSummaryStat = (type) => {
    const isEmpOffice = (e) => e.staffType ? e.staffType === 'Office Staff' : (Array.isArray(e.department) ? e.department.some(isOffice) : isOffice(e.department));
    switch (type) {
      case 'Haken':
        return employees.filter(e => !isEmpOffice(e)).length;
      case 'Office':
        return employees.filter(e => isEmpOffice(e)).length;
      default:
        return 0;
    }
  };

  const baseCards = [
    { name: 'Unassigned', id: 'Unassigned', icon: MapPin, color: 'text-amber-500', bgColor: 'bg-white', borderColor: 'border-gray-200' },
    { name: 'Total Staff', id: 'All', icon: Users, color: 'text-blue-600', bgColor: 'bg-white', borderColor: 'border-gray-200' },
  ];

  const hakenCardsConfig = [
    ...baseCards,
    ...WORK_PLACES.map(wp => ({
      name: wp.replace('and', '&').replace('Manufacturing', 'Mfg'),
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
      name: dept,
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
          <p className="text-xs font-bold uppercase tracking-wider">Haken Staff</p>
        </button>
        <button 
          onClick={() => { setMainCategory(mainCategory === 'Office' ? 'All' : 'Office'); setFilterWorkPlace('Unassigned'); }}
          className={`rounded-xl p-6 flex flex-col items-center justify-center shadow-sm transition-all duration-200 border ${
            mainCategory === 'Office' ? 'bg-[#162D50] text-white scale-[1.02] border-[#162D50]' : 'bg-white text-[#002244] border-gray-200 hover:border-[#162D50] hover:shadow-md'
          }`}
        >
          <Building2 className="w-8 h-8 mb-3" />
          <p className="text-3xl font-bold mb-1">{getSummaryStat('Office')}</p>
          <p className={`text-xs font-bold uppercase tracking-wider ${mainCategory === 'Office' ? 'text-gray-200' : 'text-gray-500'}`}>Office Staff</p>
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

      {/* Toolbar */}
      <div className="bg-gray-50 p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-[#162D50] flex-1">
          {filterWorkPlace === 'All' ? 'Staff Work Location Registry' : 
           filterWorkPlace === 'Unassigned' ? 'Unassigned Staff Registry' : 
           `${filterWorkPlace} Staff Registry`}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search staff..." 
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
              <option value="All">{mainCategory === 'Office' ? 'Select Office' : 'All Locations'}</option>
              <option value="Unassigned">Unassigned</option>
              {mainCategory === 'Office' 
                ? OFFICE_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)
                : WORK_PLACES.map(place => <option key={place} value={place}>{place}</option>)
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
                <th className="py-4 px-6">S.No.</th>
                <th className="py-4 px-6">Staff ID</th>
                <th className="py-4 px-6">Full Name</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">{mainCategory === 'Office' ? 'Select Office' : 'Work Place'}</th>
                <th className="py-4 px-6">Join Date</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 px-6 text-center text-gray-500">Loading staff data...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 px-6 text-center text-gray-500">No staff records found.</td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <tr key={employee._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="py-4 px-6 font-medium text-gray-500">{index + 1}</td>
                    <td className="py-4 px-6 font-medium text-[#162D50]">#{employee._id?.slice(-6).toUpperCase() || 'NEW'}</td>
                    <td className="py-4 px-6 font-bold text-gray-900">{employee.romajiName || 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-600">{Array.isArray(employee.department) ? employee.department.join(', ') : employee.department || 'N/A'}</td>
                    <td className="py-4 px-6">
                      {employee.onboardingStatus !== 'Active' ? (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold whitespace-nowrap">
                          {employee.onboardingStatus || 'Inactive'}
                        </span>
                      ) : mainCategory === 'Office' ? (
                        employee.office && employee.office.length > 0 ? (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold whitespace-nowrap">
                            {Array.isArray(employee.office) ? employee.office.join(', ') : employee.office}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold whitespace-nowrap">
                            Pending Assignment
                          </span>
                        )
                      ) : employee.assignedWorkPlace && employee.assignedWorkPlace.length > 0 ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold whitespace-nowrap">
                          {Array.isArray(employee.assignedWorkPlace) ? employee.assignedWorkPlace.join(', ') : employee.assignedWorkPlace}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold whitespace-nowrap">
                          Pending Assignment
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
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
                        className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-[#162D50] hover:bg-gray-200 rounded-full transition-colors"
                        title="View & Assign"
                      >
                        <Eye className="w-5 h-5" />
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
                Assign Work Location
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
                        <span className="font-medium">Joined: {selectedStaff.joinDate ? new Date(selectedStaff.joinDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{Array.isArray(selectedStaff.department) ? selectedStaff.department.join(', ') : (selectedStaff.department || 'No Dept')}</span>
                      </div>
                    </div>
                    
                    {selectedStaff.assignedWorkPlace && (
                      <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Current Assignment</p>
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
                      <h4 className="font-bold text-gray-900 mb-4 text-md border-b border-gray-100 pb-2">Select Staff Type</h4>
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
                                    {type}
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
                        <h4 className="font-bold text-gray-900 mb-4 text-md border-b border-gray-100 pb-2">Select Office</h4>
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
                                    {loc}
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
                      <h4 className="font-bold text-gray-900 mb-4 text-md border-b border-gray-100 pb-2">Select Department</h4>
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
                                  {dept}
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
                      <h4 className="font-bold text-gray-900 mb-4 text-md border-b border-gray-100 pb-2">Select Workplace Category</h4>
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
                                  {place}
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
                Close
              </button>
              <button 
                onClick={handleAssignWorkPlace}
                disabled={assigning}
                className="px-6 py-2.5 bg-[#162D50] text-white font-bold rounded-xl hover:bg-[#0f1f3a] transition-colors focus:ring-4 focus:ring-[#162D50]/30 disabled:opacity-50 flex items-center"
              >
                {assigning ? 'Assigning...' : 'Assign Workplace'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
