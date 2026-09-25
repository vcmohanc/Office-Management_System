import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, MoreVertical, Printer } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    return matchesSearch && status !== 'Active';
  });

  // Calculate Metrics
  const activeVisas = employees.filter(e => getVisaステータス(e) === 'Active').length;
  const expiringSoon = employees.filter(e => getVisaステータス(e) === 'Expiring Soon').length;
  const expired = employees.filter(e => getVisaステータス(e) === 'Expired').length;
  const pendingRenewals = employees.filter(e => getVisaステータス(e) === 'Renewal In Progress').length;

  const handlePrint = () => {
    const rows = filteredEmployees.map((emp, idx) => {
      const status = getVisaステータス(emp);
      const statusColor =
        status === 'Expired' ? '#dc2626' :
        status === 'Expiring Soon' ? '#d97706' :
        status === 'Renewal In Progress' ? '#2563eb' : '#16a34a';
      const expiry = emp.visaEndDate
        ? new Date(emp.visaEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';
      return `
        <tr>
          <td style="text-align:center;color:#64748b;width:36px">${idx + 1}</td>
          <td>#${(emp._id?.slice(-6) || '').toUpperCase()}</td>
          <td>${emp.romajiName || 'N/A'}</td>
          <td>${emp.nationality || 'N/A'}</td>
          <td>${emp.visaStatus || 'Employment Visa'}</td>
          <td>${expiry}</td>
          <td>${emp.visaAppステータス || 'Not Applied'}</td>
          <td><span style="color:${statusColor};font-weight:700">${status}</span></td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Visa Management Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #1e293b; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #162d50; }
    p.sub { font-size: 12px; color: #64748b; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #162d50; color: #fff; }
    th { padding: 8px 10px; text-align: left; font-weight: 600; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>ビザ管理レポート (Visa Management Report)</h1>
  <p class="sub">出力日 (Export Date): ${new Date().toLocaleDateString()}</p>
  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:36px">S.No</th><th>STAFF ID</th><th>STAFF NAME</th><th>NATIONALITY</th>
        <th>VISA TYPE</th><th>EXPIRY DATE</th><th>APP STATUS</th><th>STATUS</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  };

  const handleExportPDF = async () => {
    try {
      setIsSubmitting(true);

      const pdf = new jsPDF('p', 'pt', 'a4');
      pdf.addFileToVFS('Kosugi-Regular.ttf', fontBase64);
      pdf.addFont('Kosugi-Regular.ttf', 'Kosugi', 'normal');

      pdf.setFont('Kosugi');

      // Add a premium header
      pdf.setFontSize(22);
      pdf.setTextColor(22, 45, 80); // Slate-800
      pdf.text('ビザ管理レポート (Visa Management Report)', 40, 50);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`出力日 (Export Date): ${new Date().toLocaleDateString()}`, 40, 70);

      // Prepare Table Data
      const tableColumn = ["S.No", "STAFF ID", "STAFF NAME", "NATIONALITY", "VISA TYPE", "EXPIRY DATE", "APP STATUS", "STATUS"];
      const tableRows = [];

      filteredEmployees.forEach((employee, idx) => {
        const status = getVisaステータス(employee);
        const rowData = [
          idx + 1,
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
          font: 'Kosugi',
          fontSize: 9,
          cellPadding: 6,
          textColor: [51, 65, 85]
        },
        headStyles: {
          fillColor: [30, 41, 59], // Slate 800
          textColor: [255, 255, 255],
          fontStyle: 'normal'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate 50
        }
      });

      pdf.save('Visa_Management_Report.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('PDFのエクスポートに失敗しました。\n' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pb-10">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">有効ビザ数</p>
          <p className="text-3xl font-bold text-[#162D50]">{loading ? '...' : activeVisas}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">期限切れ間近（90日以内）</p>
          <p className="text-3xl font-bold text-blue-500">{loading ? '...' : expiringSoon}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">期限切れ／要対応</p>
          <p className="text-3xl font-bold text-red-500">{loading ? '...' : expired}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">更新申請中</p>
          <p className="text-3xl font-bold text-yellow-500">{loading ? '...' : pendingRenewals}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#F8F9FA] p-3 border border-gray-200 rounded-t-md flex justify-between items-center">
        <div className="relative w-80">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="スタッフ名またはIDで検索..." 
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
                <th className="py-4 px-4 text-center w-10">番号</th>
                <th className="py-4 px-6">スタッフID</th>
                <th className="py-4 px-6">氏名</th>
                <th className="py-4 px-6">国籍</th>
                <th className="py-4 px-6">ビザ種別</th>
                <th className="py-4 px-6">有効期限</th>
                <th className="py-4 px-6">申請状況</th>
                <th className="py-4 px-6">ステータス</th>
                <th className="py-4 px-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 px-6 text-center text-gray-500">ビザデータを読み込み中...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 px-6 text-center text-gray-500">検索条件に一致するスタッフが見つかりません。</td>
                </tr>
              ) : (
                filteredEmployees.map((employee, idx) => {
                  const status = getVisaステータス(employee);
                  let statusBadge = null;
                  let actionButton = null;

                  if (status === 'Active') {
                    statusBadge = <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">有効</span>;
                    actionButton = <button onClick={() => handleアクションClick(employee, 'View')} className="text-[#162D50] font-bold hover:underline text-sm">表示</button>;
                  } else if (status === 'Expiring Soon') {
                    statusBadge = <span className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">期限切れ間近</span>;
                    actionButton = <button onClick={() => handleアクションClick(employee, 'Renew')} className="bg-[#162D50] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-[#0f1f38] transition-colors shadow-sm">更新する</button>;
                  } else if (status === 'Expired') {
                    statusBadge = <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">期限切れ</span>;
                    actionButton = <button onClick={() => handleアクションClick(employee, 'アクション Required')} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap">要対応</button>;
                  } else {
                    statusBadge = <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">更新申請中</span>;
                    actionButton = <button onClick={() => handleアクションClick(employee, 'Details')} className="text-[#162D50] font-bold hover:underline text-sm">詳細</button>;
                  }

                  return (
                    <tr key={employee._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-center text-gray-400 text-sm">{idx + 1}</td>
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
        
        {/* Record count */}
        <div className="p-4 border-t border-gray-200 bg-white text-sm text-gray-500">
          {filteredEmployees.length}件表示中（全{employees.length}件）
        </div>
      </div>

      {/* Visa Update Modal */}
      {isModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-[#F8F9FA] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#162D50]">ビザステータス更新</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedStaff.romajiName} さんの情報</p>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">現在の有効期限</label>
                  <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-medium cursor-not-allowed">
                    {selectedStaff.visaEndDate ? new Date(selectedStaff.visaEndDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '未設定'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">新しい開始日</label>
                    <input 
                      type="date" 
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">新しい有効期限 <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#162D50] focus:border-[#162D50] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">新しいステータス</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">申請ステータス</label>
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
                キャンセル
              </button>
              <button 
                onClick={handleUpdateVisa}
                disabled={isSubmitting || !newExpiryDate}
                className={`px-6 py-2.5 rounded-lg font-bold text-white transition-all shadow-sm ${
                  isSubmitting || !newExpiryDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#162D50] hover:bg-[#0f1f38]'
                }`}
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
