import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, MoreVertical, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';


export default function VisaManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newVisaステータス, setNewVisaステータス] = useState('Renewal In Progress');
  const [newVisaAppステータス, setNewVisaAppステータス] = useState('Not Applied');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    fetchStaff();
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

  const getVisaステータス = (emp) => {
    if (emp.visaステータス === 'Renewal In Progress') return 'Renewal In Progress';
    if (!emp.visaEndDate) return 'Active'; // Default if no date provided
    
    const endDate = new Date(emp.visaEndDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays <= 90) return 'Expiring Soon';
    return 'Active';
  };

  const handleアクションClick = (emp, actionType) => {
    if (actionType === 'アクション Required' || actionType === 'Renew' || actionType === 'Details') {
      setSelectedStaff(emp);
      setNewExpiryDate(emp.visaEndDate ? new Date(emp.visaEndDate).toISOString().split('T')[0] : '');
      setNewStartDate(emp.visaStartDate ? new Date(emp.visaStartDate).toISOString().split('T')[0] : '');
      setNewVisaステータス('Renewal In Progress');
      setNewVisaAppステータス(emp.visaAppステータス || 'Not Applied');
      setIsModalOpen(true);
    }
  };

  const handleAppステータスChange = (e) => {
    const status = e.target.value;
    setNewVisaAppステータス(status);
    
    if (status === '承認済') {
      setNewVisaステータス('Employment Visa');
    } else if (status === 'Waiting for Visa' || status === 'Applied') {
      setNewVisaステータス('Renewal In Progress');
    }
  };

  const handleUpdateVisa = async () => {
    if (!selectedStaff || !newExpiryDate) return;
    setIsSubmitting(true);
    try {
      const history = selectedStaff.visaExpiryHistory ? [...selectedStaff.visaExpiryHistory] : [];
      // Only push the old date if it exists and is different from the new date
      const currentDateString = selectedStaff.visaEndDate ? new Date(selectedStaff.visaEndDate).toISOString().split('T')[0] : null;
      if (currentDateString && currentDateString !== newExpiryDate) {
        history.push(selectedStaff.visaEndDate);
      }

      const res = await apiFetch(`/api/employees/${selectedStaff._id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          ...selectedStaff, 
          visaEndDate: newExpiryDate, 
          visaStartDate: newStartDate,
          visaステータス: newVisaステータス, 
          visaAppステータス: newVisaAppステータス,
          visaExpiryHistory: history
        }),
      });
      
      if (res.ok) {
        setEmployees(prev => prev.map(emp => 
          emp._id === selectedStaff._id ? { 
            ...emp, 
            visaEndDate: newExpiryDate, 
            visaStartDate: newStartDate,
            visaステータス: newVisaステータス, 
            visaAppステータス: newVisaAppステータス,
            visaExpiryHistory: history
          } : emp
        ));
        setIsModalOpen(false);
        setSelectedStaff(null);
      }
    } catch (err) {
      console.error('Failed to update visa:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchString = searchQuery.toLowerCase();
    const nameStr = `${emp.romajiName || ''} ${emp.katakanaName || ''}`.toLowerCase();
    const matchesSearch = nameStr.includes(searchString) || (emp._id && emp._id.toLowerCase().includes(searchString));
    
    const status = getVisaステータス(emp);
    const matchesステータス = status === 'Expired' || status === 'Renewal In Progress' || status === 'Expiring Soon';

    return matchesSearch && matchesステータス;
  });

  // Calculate Metrics
  const activeVisas = employees.filter(e => getVisaステータス(e) === 'Active').length;
  const expiringSoon = employees.filter(e => getVisaステータス(e) === 'Expiring Soon').length;
  const expired = employees.filter(e => getVisaステータス(e) === 'Expired').length;
  const pendingRenewals = employees.filter(e => getVisaステータス(e) === 'Renewal In Progress').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      setIsSubmitting(true);
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const pdf = new jsPDF('p', 'pt', 'a4');

      // Fetch the local Japanese font
      const fontResponse = await fetch('/mplus.ttf');
      const fontBuffer = await fontResponse.arrayBuffer();
      const fontBase64 = btoa(
        new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      pdf.addFileToVFS('mplus.ttf', fontBase64);
      pdf.addFont('mplus.ttf', 'mplus', 'normal');
      pdf.setFont('mplus');

      // Add a premium header
      pdf.setFontSize(22);
      pdf.setTextColor(22, 45, 80); // Slate-800
      pdf.text('ビザ管理レポート (Visa Management Report)', 40, 50);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`出力日 (Export Date): ${new Date().toLocaleDateString()}`, 40, 70);

      // Prepare Table Data
      const tableColumn = ["STAFF ID", "STAFF NAME", "NATIONALITY", "VISA TYPE", "EXPIRY DATE", "APP STATUS", "STATUS"];
      const tableRows = [];

      filteredEmployees.forEach((employee) => {
        const status = getVisaステータス(employee);
        const rowData = [
          "#" + (employee._id?.slice(-6).toUpperCase() || ''),
          employee.romajiName || 'N/A',
          employee.nationality || 'N/A',
          employee.visaStatus || 'Employment Visa',
          employee.visaEndDate ? new Date(employee.visaEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          employee.visaAppStatus || 'Not Applied',
          status
        ];
        tableRows.push(rowData);
      });

      autoTable(pdf, {
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        styles: { 
          font: 'mplus',
          fontSize: 9,
          cellPadding: 6,
          textColor: [51, 65, 85]
        },
        headStyles: {
          fillColor: [30, 41, 59], // Slate 800
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate 50
        }
      });

      pdf.save('Visa_Management_Report.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('PDFのエクスポートに失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pb-10">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">TOTAL ACTIVE VISAS</p>
          <p className="text-3xl font-bold text-[#162D50]">{loading ? '...' : activeVisas}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">EXPIRING SOON (90 DAYS)</p>
          <p className="text-3xl font-bold text-blue-500">{loading ? '...' : expiringSoon}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">EXPIRED/ACTION REQUIRED</p>
          <p className="text-3xl font-bold text-red-500">{loading ? '...' : expired}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">PENDING RENEWALS</p>
          <p className="text-3xl font-bold text-yellow-500">{loading ? '...' : pendingRenewals}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#F8F9FA] p-3 border border-gray-200 rounded-t-md flex justify-between items-center">
        <div className="relative w-80">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by スタッフ名 or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-white"
          />
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            印刷
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isSubmitting}
            className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {isSubmitting ? '処理中...' : 'エクスポート'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">STAFF ID</th>
                <th className="py-4 px-6">STAFF NAME</th>
                <th className="py-4 px-6">NATIONALITY</th>
                <th className="py-4 px-6">VISA TYPE</th>
                <th className="py-4 px-6">EXPIRY DATE</th>
                <th className="py-4 px-6">APP STATUS</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 px-6 text-center text-gray-500">Loading visa data...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 px-6 text-center text-gray-500">No staff found matching your search.</td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const status = getVisaステータス(employee);
                  let statusBadge = null;
                  let actionButton = null;

                  if (status === 'Active') {
                    statusBadge = <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>;
                    actionButton = <button onClick={() => handleアクションClick(employee, 'View')} className="text-[#162D50] font-bold hover:underline text-sm">表示</button>;
                  } else if (status === 'Expiring Soon') {
                    statusBadge = <span className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Expiring Soon</span>;
                    actionButton = <button onClick={() => handleアクションClick(employee, 'Renew')} className="bg-[#162D50] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-[#0f1f38] transition-colors shadow-sm">Renew</button>;
                  } else if (status === 'Expired') {
                    statusBadge = <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Expired</span>;
                    actionButton = <button onClick={() => handleアクションClick(employee, 'アクション Required')} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap">アクション Required</button>;
                  } else {
                    statusBadge = <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Renewal In Progress</span>;
                    actionButton = <button onClick={() => handleアクションClick(employee, 'Details')} className="text-[#162D50] font-bold hover:underline text-sm">Details</button>;
                  }

                  return (
                    <tr key={employee._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-gray-800 font-medium">#{employee._id?.slice(-6).toUpperCase()}</td>
                      <td className="py-4 px-6 font-bold text-[#162D50]">{employee.romajiName || 'N/A'}</td>
                      <td className="py-4 px-6 text-gray-600">{employee.nationality || 'N/A'}</td>
                      <td className="py-4 px-6 text-gray-600">{employee.visaステータス || 'Employment Visa'}</td>
                      <td className="py-4 px-6 text-gray-600">
                        {employee.visaEndDate ? new Date(employee.visaEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          employee.visaAppステータス === 'Applied' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                          employee.visaAppステータス === 'Waiting for Visa' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' :
                          employee.visaAppステータス === '承認済' ? 'bg-green-50 text-green-600 border border-green-200' :
                          employee.visaAppステータス === '拒否' ? 'bg-red-50 text-red-600 border border-red-200' :
                          'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                          {employee.visaAppステータス || 'Not Applied'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {statusBadge}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          {actionButton}
                          <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-white text-sm text-gray-600">
          <div>Showing {filteredEmployees.length > 0 ? 1 : 0}-{filteredEmployees.length} of {employees.length} staff</div>
          <div className="flex space-x-2">
            <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-400 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Visa Update Modal */}
      {isModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-[#F8F9FA] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#162D50]">Update Visa ステータス</h3>
                <p className="text-sm text-gray-500 mt-1">For {selectedStaff.romajiName}</p>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Expiry 日付</label>
                  <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-medium cursor-not-allowed">
                    {selectedStaff.visaEndDate ? new Date(selectedStaff.visaEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">New Start 日付</label>
                    <input 
                      type="date" 
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">New Expiry 日付 <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New ステータス</label>
                  <select
                    value={newVisaステータス}
                    onChange={(e) => setNewVisaステータス(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none transition-all"
                  >
                    <option value="Renewal In Progress">Renewal In Progress</option>
                    <option value="Employment Visa">Active (Employment Visa)</option>
                    <option value="Work Permit">Active (Work Permit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Application ステータス</label>
                  <select
                    value={newVisaAppステータス}
                    onChange={handleAppステータスChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none transition-all"
                  >
                    <option value="Not Applied">Not Applied</option>
                    <option value="Applied">Applied</option>
                    <option value="Waiting for Visa">Waiting for Visa</option>
                    <option value="承認済">承認済</option>
                    <option value="拒否">拒否</option>
                  </select>
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
                onClick={handleUpdateVisa}
                disabled={isSubmitting || !newExpiryDate}
                className={`px-6 py-2.5 rounded-lg font-bold text-white transition-all shadow-sm ${
                  isSubmitting || !newExpiryDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#162D50] hover:bg-[#0f1f38]'
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
