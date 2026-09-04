import React, { useState, useEffect } from 'react';
import { UserPlus, BedDouble, Radio, Tractor, Building, UserCheck, ChevronDown, Eye, Edit, Search, Filter, Download, Printer } from 'lucide-react';

export default function HRDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newOnboardingStatus, setNewOnboardingStatus] = useState('Verification Pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List Controls State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('All Staff');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/employees`)
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

  // Metrics calculation
  const OFFICE_DEPARTMENTS = [
    'HR', 'HR / Recruitment', 'HR / Administration',
    'IT', 'IT / Technical', 'Audit & Compliance',
    'Operations', 'Payroll', 'Management'
  ];
  const isOffice = (dept) => OFFICE_DEPARTMENTS.some(d => dept.includes(d));
  const isEmpOffice = (e) => e.staffType ? e.staffType === 'Office Staff' : (Array.isArray(e.department) ? e.department.some(isOffice) : isOffice(e.department || ''));

  const totalStaff = employees.length;
  const hakenStaff = employees.filter(e => !isEmpOffice(e)).length;
  const officeStaff = employees.filter(e => isEmpOffice(e)).length;

  // Filter Employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.romajiName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (emp.katakanaName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.staffId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || emp.onboardingStatus === statusFilter || (!emp.onboardingStatus && statusFilter === 'Active');
    const matchesTab = activeTab === 'All Staff' || (activeTab === 'Office Staff' && isEmpOffice(emp)) || (activeTab === 'Haken Staff' && !isEmpOffice(emp));
    return matchesSearch && matchesStatus && matchesTab;
  });

  const handleExportCSV = () => {
    const headers = ['S.N.', 'Staff ID', 'Full Name', 'Department', 'Join Date', 'Status'];
    const rows = filteredEmployees.map((emp, index) => [
      index + 1,
      emp.staffId ? emp.staffId.replace(/[#-]/g, '') : `STF${emp._id?.slice(-6).toUpperCase()}`,
      `"${emp.romajiName || emp.katakanaName || ''}"`,
      `"${Array.isArray(emp.department) ? emp.department.join(', ') : (emp.department || '')}"`,
      emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '',
      emp.onboardingStatus || 'Active'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Staff Directory Report</title>
          <style>
            body { font-family: 'Times New Roman', serif; color: #000; margin: 40px; line-height: 1.5; }
            h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; text-transform: uppercase; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
            th, td { border: 1px solid #000; padding: 8px 12px; text-align: left; }
            th { background-color: #f9f9f9; font-weight: bold; text-transform: uppercase; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-style: italic; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>Staff Directory Report</h1>
          <div class="meta">
            <span>Category: <strong>${activeTab}</strong></span>
            <span>Generated Date: <strong>${new Date().toLocaleDateString()}</strong></span>
          </div>
          <table>
            <thead>
              <tr>
                <th>S.N.</th>
                <th>Staff ID</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEmployees.map((emp, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${emp.staffId ? emp.staffId.replace(/[#-]/g, '') : 'STF' + emp._id?.slice(-6).toUpperCase()}</td>
                  <td>${emp.romajiName || emp.katakanaName || 'N/A'}</td>
                  <td>${Array.isArray(emp.department) ? emp.department.join(', ') : (emp.department || 'N/A')}</td>
                  <td>${emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A'}</td>
                  <td>${emp.onboardingStatus || 'Active'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            - End of Report -
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleEditClick = (emp) => {
    setSelectedStaff(emp);
    setNewOnboardingStatus(emp.onboardingStatus || 'Verification Pending');
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employees/${selectedStaff._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedStaff, onboardingStatus: newOnboardingStatus })
      });
      
      if (res.ok) {
        setEmployees(prev => prev.map(emp => 
          emp._id === selectedStaff._id ? { ...emp, onboardingStatus: newOnboardingStatus } : emp
        ));
        setIsModalOpen(false);
        setSelectedStaff(null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return <span className="px-3 py-1 bg-[#4CAF50] text-white rounded-full text-xs font-bold inline-block w-[140px] text-center shadow-sm">Active</span>;
    } else if (status === 'Missing Pledges') {
      return <span className="px-3 py-1 bg-[#D32F2F] text-white rounded-full text-xs font-bold inline-block w-[140px] text-center shadow-sm">Missing Pledges</span>;
    } else if (status === 'Verification Pending') {
      return <span className="px-3 py-1 bg-[#F5D056] text-[#6b5207] rounded-full text-xs font-bold inline-block w-[140px] text-center shadow-sm">Verification Pending</span>;
    } else if (status === 'Rejected') {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold inline-block w-[140px] text-center shadow-sm">Rejected</span>;
    } else {
      return <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold inline-block w-[140px] text-center shadow-sm">{status || 'Unknown'}</span>;
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-10">

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* All Staff */}
        <div className="bg-[#162D50] text-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UserPlus className="w-16 h-16" />
          </div>
          <UserPlus className="w-6 h-6 mb-3 text-blue-200" />
          <h3 className="text-3xl font-bold mb-1">{totalStaff}</h3>
          <p className="text-[10px] font-bold tracking-widest text-blue-100">ALL STAFF</p>
        </div>

        {/* Haken Staff */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100 hover:border-blue-200 transition-colors">
          <Building className="w-6 h-6 mb-3 text-[#162D50]" />
          <h3 className="text-3xl font-bold text-[#162D50] mb-1">{hakenStaff}</h3>
          <p className="text-[10px] font-bold tracking-widest text-gray-500">HAKEN STAFF</p>
        </div>

        {/* Office Staff */}
        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100 hover:border-blue-200 transition-colors">
          <Building className="w-6 h-6 mb-3 text-[#162D50]" />
          <h3 className="text-3xl font-bold text-[#162D50] mb-1">{officeStaff}</h3>
          <p className="text-[10px] font-bold tracking-widest text-gray-500">OFFICE STAFF</p>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="p-6 border-b border-gray-100 bg-[#F8F9FA] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-[#162D50]">Staff Directory</h3>
          
          <div className="flex flex-wrap items-center gap-3 no-print">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50]"
              />
            </div>
            
            {/* Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#162D50] bg-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Verification Pending">Verification Pending</option>
                <option value="Missing Pledges">Missing Pledges</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Export & Print */}
            <button onClick={handleExportCSV} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button onClick={handlePrint} className="flex items-center space-x-2 px-4 py-2 bg-[#162D50] text-white rounded-lg text-sm font-medium hover:bg-[#0f1f38] transition-colors">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-6 pt-2">
          {['All Staff', 'Haken Staff', 'Office Staff'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-[#162D50] text-[#162D50]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                <th className="py-4 px-6 text-xs font-bold text-[#162D50] uppercase tracking-wider">S.N.</th>
                <th className="py-4 px-6 text-xs font-bold text-[#162D50] uppercase tracking-wider">Staff ID</th>
                <th className="py-4 px-6 text-xs font-bold text-[#162D50] uppercase tracking-wider">Full Name</th>
                <th className="py-4 px-6 text-xs font-bold text-[#162D50] uppercase tracking-wider">Department</th>
                <th className="py-4 px-6 text-xs font-bold text-[#162D50] uppercase tracking-wider">Join Date</th>
                <th className="py-4 px-6 text-xs font-bold text-[#162D50] uppercase tracking-wider">Onboarding Status</th>
                <th className="py-4 px-6 text-xs font-bold text-[#162D50] uppercase tracking-wider text-center no-print">Actions</th>
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
                  <tr key={employee._id} className="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                    <td className="py-5 px-6 text-gray-600 font-medium">{index + 1}</td>
                    <td className="py-5 px-6 text-gray-600 font-medium">{employee.staffId ? employee.staffId.replace(/[#-]/g, '') : `STF${employee._id?.slice(-6).toUpperCase()}`}</td>
                    <td className="py-5 px-6 text-[#162D50] font-bold">{employee.romajiName || employee.katakanaName || 'N/A'}</td>
                    <td className="py-5 px-6 text-gray-600">{Array.isArray(employee.department) ? employee.department.join(', ') : employee.department}</td>
                    <td className="py-5 px-6 text-gray-600">
                      {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="py-5 px-6">
                      {getStatusBadge(employee.onboardingStatus)}
                    </td>
                    <td className="py-5 px-6 text-center no-print">
                      <div className="flex justify-center space-x-3">
                        <button className="text-gray-400 hover:text-blue-600 transition-colors" title="View Details">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(employee)}
                          className="text-gray-400 hover:text-green-600 transition-colors" 
                          title="Update Status"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Status Update Modal */}
      {isModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-[#F8F9FA] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#162D50]">Update Onboarding Status</h3>
                <p className="text-sm text-gray-500 mt-1">For {selectedStaff.romajiName}</p>
              </div>
            </div>
            
            <div className="p-6 flex-1">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select New Status</label>
                  <select
                    value={newOnboardingStatus}
                    onChange={(e) => setNewOnboardingStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none transition-all bg-white"
                  >
                    <option value="Verification Pending">Verification Pending</option>
                    <option value="Missing Pledges">Missing Pledges</option>
                    <option value="Active">Active</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Updating a staff member to "Active" signifies they have completed all necessary verification steps and submitted all required pledges.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-lg font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateStatus}
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-lg font-bold text-white transition-all shadow-sm ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#162D50] hover:bg-[#0f1f38]'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
