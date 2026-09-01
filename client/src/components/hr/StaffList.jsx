import { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Filter, Eye, Edit2, MoreVertical } from 'lucide-react';
import StaffSkillSheetModal from './StaffSkillSheetModal';
import StaffEditModal from './StaffEditModal';

export default function StaffList({ setActiveTab }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffToView, setSelectedStaffToView] = useState(null);
  const [selectedStaffToEdit, setSelectedStaffToEdit] = useState(null);
  const [activeTab, setLocalActiveTab] = useState('All Staff');
  
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

  useEffect(() => {
    fetch('http://localhost:5000/api/employees')
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

  const getPrimaryAction = (employee) => {
    if (employee.onboardingStatus === 'Active') {
      return { 
        label: 'View', 
        type: 'default', 
        className: 'bg-transparent text-[#162D50] font-bold hover:bg-blue-50',
        onClick: () => setSelectedStaffToView(employee) 
      };
    }

    if (employee.onboardingStatus === 'Missing Documents') {
      return { 
        label: 'Action Required', 
        type: 'urgent', 
        className: 'bg-[#E30A17] text-white hover:bg-red-700',
        onClick: () => { setSelectedStaffToEdit(employee); setEditModalTab('Basic'); } 
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
    const deptStr = Array.isArray(employee.department) ? employee.department.join(' ') : (employee.department || '');
    const dept = deptStr.toLowerCase();
    if (activeTab === 'Service Staff') {
      matchesTab = dept.includes('service');
    } else if (activeTab === 'Farm Staff') {
      matchesTab = dept.includes('farm') || dept.includes('agriculture');
    } else if (activeTab === 'Office Staff') {
      matchesTab = !dept.includes('service') && !dept.includes('farm') && !dept.includes('agriculture');
    }

    // 2. Search Query Filtering
    const searchString = searchQuery.toLowerCase();
    const nameStr = `${employee.romajiName || ''} ${employee.katakanaName || ''}`.toLowerCase();
    const idStr = employee._id ? employee._id.toLowerCase() : '';
    const matchesSearch = nameStr.includes(searchString) || idStr.includes(searchString);

    // 3. Join Date Filtering
    let matchesDate = true;
    if (joinDateFilter) {
      const empDate = new Date(employee.joinDate).toISOString().split('T')[0];
      matchesDate = empDate === joinDateFilter;
    }

    return matchesTab && matchesSearch && matchesDate;
  });

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">Staff List</h2>
        <p className="text-gray-500 text-sm">Manage and track all staff across office, service, and farm departments.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Total Staff</p>
          <p className="text-3xl font-bold text-[#162D50]">{filteredEmployees.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">New Hires (This Month)</p>
          <p className="text-3xl font-bold text-[#162D50]">
            {filteredEmployees.filter(e => {
              const joinDate = new Date(e.joinDate);
              const now = new Date();
              return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Active Deployments</p>
          <p className="text-3xl font-bold text-[#162D50]">{filteredEmployees.filter(e => e.onboardingStatus === 'Active' || !e.onboardingStatus).length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['All Staff', 'Office Staff', 'Service Staff', 'Farm Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setLocalActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-[#162D50] text-[#162D50] font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
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
            placeholder="Search by name or Staff ID..." 
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
            setLocalActiveTab('All Staff');
          }}
          className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto"
        >
          <Filter className="w-4 h-4 mr-2" />
          Clear Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">Staff ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Join Date</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-4 px-6 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 px-6 text-center text-gray-500">No staff found matching the filters.</td>
                </tr>
              ) : (
                filteredEmployees.map(employee => (
                  <tr key={employee._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-[#162D50]">#{employee._id.slice(-6).toUpperCase()}</td>
                    <td className="py-4 px-6 font-bold text-gray-900">{employee.romajiName || employee.katakanaName}</td>
                    <td className="py-4 px-6 text-gray-600">{Array.isArray(employee.department) ? employee.department.join(', ') : employee.department}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        employee.onboardingStatus === 'Active' ? 'bg-green-100 text-green-700' :
                        employee.onboardingStatus === 'Verification Pending' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {employee.onboardingStatus || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(() => {
                          const action = getPrimaryAction(employee);
                          return (
                            <button 
                              onClick={action.onClick}
                              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors border ${action.type === 'default' ? 'border-transparent' : 'border-transparent'} ${action.className}`}
                            >
                              {action.label}
                            </button>
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
    </div>
  );
}
