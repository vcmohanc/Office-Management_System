import { useState, useEffect } from 'react';
import { Search, ChevronDown, Calendar, FileText, AlertTriangle, Image, Edit, X, Download } from 'lucide-react';
import { fileUrl } from '../../utils/fileUrl.js';
import { apiFetch } from '../../utils/apiFetch.js';


export default function CaseList() {
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'admin', username: 'admin' };
  
  const [cases, setCases] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // SSE Subscription
  useEffect(() => {
    const token = localStorage.getItem('token');
    const sse = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events?token=${token}`);

    sse.addEventListener('CASE_REGISTERED', (e) => {
      const newRecord = JSON.parse(e.data);
      if (newRecord.claim_id) {
        setClaims(prev => [newRecord, ...prev]);
      } else {
        setCases(prev => [newRecord, ...prev]);
      }
    });

    sse.addEventListener('CASE_UPDATED', (e) => {
      const updatedRecord = JSON.parse(e.data);
      if (updatedRecord.claim_id) {
        setClaims(prev => prev.map(c => c._id === updatedRecord._id ? updatedRecord : c));
      } else {
        setCases(prev => prev.map(c => c._id === updatedRecord._id ? updatedRecord : c));
      }
    });

    return () => sse.close();
  }, []);
  
  // Use sessionStorage to set initial tab, then clear it
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = sessionStorage.getItem('caseListTab');
    if (savedTab) {
      sessionStorage.removeItem('caseListTab');
      return savedTab;
    }
    return 'Office';
  });

  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('All Types');
  const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  
  const handleViewDetails = async (caseObj) => {
    setSelectedCase(caseObj);
    setIsEditing(false);

    if (user.role !== 'support' && caseObj.hasAccountNotification) {
      try {
        const isClaim = caseObj.type === 'Staff Case';
        const endpoint = isClaim ? `/api/claims/${caseObj._id}` : `/api/cases/${caseObj._id}`;
        await apiFetch(`${endpoint}`, {
          method: 'PUT',
          body: JSON.stringify({ hasAccountNotification: false }),
        });
        
        const updateState = (items) => items.map(c => c._id === caseObj._id ? { ...c, hasAccountNotification: false } : c);
        if (isClaim) setClaims(updateState);
        else setCases(updateState);
        
        setSelectedCase(prev => ({ ...prev, hasAccountNotification: false }));
      } catch (err) {
        console.error('Error clearing notification', err);
      }
    }
    
    if (user.role === 'support' && (caseObj.hasSupportNotification || (caseObj.messages && caseObj.messages.some(m => !m.readBySupport)))) {
      const isClaim = caseObj.type === 'Staff Case';
      
      // Clear support notification flag
      if (caseObj.hasSupportNotification) {
        const updateEndpoint = isClaim ? `/api/claims/${caseObj._id}` : `/api/cases/${caseObj._id}`;
        apiFetch(updateEndpoint, {
          method: 'PUT',
          body: JSON.stringify({ hasSupportNotification: false })
        }).catch(err => console.error('Failed to clear support notification', err));
        
        const updateState = (items) => items.map(c => c._id === caseObj._id ? { ...c, hasSupportNotification: false } : c);
        if (isClaim) setClaims(updateState);
        else setCases(updateState);
        setSelectedCase(prev => ({ ...prev, hasSupportNotification: false }));
      }

      // Mark messages as read
      if (caseObj.messages && caseObj.messages.some(m => !m.readBySupport)) {
        const msgEndpoint = isClaim ? `/api/claims/${caseObj._id}/messages/read` : `/api/cases/${caseObj._id}/messages/read`;
        fetch(`${import.meta.env.VITE_API_URL}${msgEndpoint}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(res => res.json())
        .then(updatedCase => {
          const updater = isClaim ? setClaims : setCases;
          updater(prev => prev.map(item => item._id === caseObj._id ? { ...item, messages: updatedCase.messages } : item));
          setSelectedCase(prev => ({ ...prev, messages: updatedCase.messages }));
        })
        .catch(err => console.error('Failed to mark messages as read', err));
      }
    }
  };

  const handleFileClick = (e, fileUrl) => {
    const baseUrl = fileUrl.split('?')[0];
    if (baseUrl.match(/\.(jpeg|jpg|gif|png|webp|pdf)$/i)) {
      e.preventDefault();
      setPreviewImage(fileUrl);
    }
  };

  const handleEditClick = () => {
    setEditData({
      expense_type: selectedCase.expense_type,
      total_expense: selectedCase.displayTotal,
      settlement_method: selectedCase.settlement_method || 'Bank Transfer',
      collection_method: selectedCase.collection_method || 'Company Expense (VC Bears)',
      receipts: selectedCase.receipts || selectedCase.bill_receipt_url || []
    });
    setIsEditing(true);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

    const validFiles = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only JPG, PNG, and PDF files are allowed.`);
        e.target.value = '';
        return;
      }
      if (file.size > MAX_SIZE) {
        alert(`File too large: ${file.name}. Maximum size is 2 MB per file.`);
        e.target.value = '';
        return;
      }
      validFiles.push(file);
    }

    const formData = new FormData();
    validFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setEditData(prev => ({
          ...prev,
          receipts: [...(prev.receipts || []), ...data.fileNames]
        }));
      } else {
        console.error('Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const removeFile = (fileIndex) => {
    setEditData(prev => ({
      ...prev,
      receipts: prev.receipts.filter((_, i) => i !== fileIndex)
    }));
  };

  const handleSaveEdit = async () => {
    const isClaim = selectedCase.type === 'Staff Case';
    const endpoint = isClaim ? `/api/claims/${selectedCase._id}` : `/api/cases/${selectedCase._id}`;

    // Map properties back to their correct names based on isClaim
    const payload = {};
    if (isClaim) {
      payload.expenseType = editData.expense_type;
      payload.totalExpenseAmount = parseFloat(editData.total_expense);
      payload.settlement_method = editData.settlement_method;
      payload.collection_method = editData.collection_method;
      payload.bill_receipt_url = editData.receipts;
    } else {
      payload.expense_type = editData.expense_type;
      payload.final_total_amount = parseFloat(editData.total_expense);
      payload.settlement_method = editData.settlement_method;
      payload.collection_method = editData.collection_method;
      payload.receipts = editData.receipts;
    }

    if (user.role === 'support') {
      const updatedFields = [];
      if (editData.expense_type !== selectedCase.expense_type) updatedFields.push('expense_type');
      if (parseFloat(editData.total_expense) !== selectedCase.displayTotal) updatedFields.push('total_expense');
      if (editData.settlement_method !== selectedCase.settlement_method) updatedFields.push('settlement_method');
      if (editData.collection_method !== selectedCase.collection_method) updatedFields.push('collection_method');
      
      const oldReceipts = selectedCase.receipts || selectedCase.bill_receipt_url || [];
      const newReceipts = editData.receipts || [];
      const receiptsChanged = oldReceipts.length !== newReceipts.length || oldReceipts.some((r, i) => r !== newReceipts[i]);
      if (receiptsChanged) updatedFields.push('receipts');

      if (updatedFields.length > 0) {
        payload.hasAccountNotification = true;
        const previousUpdatedFields = selectedCase.supportUpdatedFields || [];
        payload.supportUpdatedFields = Array.from(new Set([...previousUpdatedFields, ...updatedFields]));
      }
    } else {
      payload.hasSupportNotification = true;
    }

    if (editData.short_note && editData.short_note.trim() !== '') {
      payload.messages = [
        ...(selectedCase.messages || []),
        {
          text: editData.short_note,
          date: new Date().toISOString(),
          author: user.username === 'account_user' ? 'Account Department' : (user.username || 'Account Department')
        }
      ];
      if (user.role !== 'support') {
        payload.hasSupportNotification = true;
      } else {
        payload.hasAccountNotification = true;
      }
    }

    try {
      const response = await apiFetch(`${endpoint}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const mappedUpdated = {
          ...selectedCase,
          ...payload,
          displayTotal: parseFloat(editData.total_expense),
          expense_type: editData.expense_type,
          settlement_method: editData.settlement_method,
          collection_method: editData.collection_method,
          receipts: isClaim ? undefined : editData.receipts,
          bill_receipt_url: isClaim ? editData.receipts : undefined,
          hasAccountNotification: payload.hasAccountNotification !== undefined ? payload.hasAccountNotification : selectedCase.hasAccountNotification,
          supportUpdatedFields: payload.supportUpdatedFields !== undefined ? payload.supportUpdatedFields : selectedCase.supportUpdatedFields
        };
        
        if (isClaim) {
          setClaims(prev => prev.map(c => c._id === selectedCase._id ? { ...c, ...payload } : c));
        } else {
          setCases(prev => prev.map(c => c._id === selectedCase._id ? { ...c, ...payload } : c));
        }
        setSelectedCase(mappedUpdated);
        setIsEditing(false);
      } else {
        console.error('Failed to update record');
      }
    } catch (error) {
      console.error('Error updating record', error);
    }
  };

  const handleUpdateStatus = (newStatus) => {
    if (!selectedCase) return;
    
    let newMessage = null;
    if (newStatus === 'REJECTED' || newStatus === 'RETURNED_FOR_CORRECTION') {
      const promptMessage = window.prompt(
        newStatus === 'REJECTED' 
          ? `Please enter mandatory reason for Rejecting:` 
          : `Please enter feedback for Returning for Correction:`
      );
      if (promptMessage === null) return; // User cancelled
      if (!promptMessage.trim()) {
        alert("A reason/feedback is required for this action.");
        return;
      }

      newMessage = { 
        text: promptMessage, 
        date: new Date().toISOString(), 
        author: user.username === 'account_user' ? 'Account Department' : (user.username || 'Account Department') 
      };
    }

    const isClaim = selectedCase.type === 'Staff Case';
    const endpoint = isClaim ? `/api/claims/${selectedCase._id}/status` : `/api/cases/${selectedCase._id}/status`;

    // Update main list
    const updateFn = (c) => {
      if (c._id === selectedCase._id) {
        const updatedMessages = c.messages ? [...c.messages] : [];
        if (newMessage) updatedMessages.push(newMessage);
        return { ...c, status: newStatus, messages: updatedMessages, supportUpdatedFields: [] };
      }
      return c;
    };
    
    if (isClaim) {
      setClaims(prev => prev.map(updateFn));
    } else {
      setCases(prev => prev.map(updateFn));
    }
    
    // Update currently selected case to reflect immediately
    setSelectedCase(prev => {
      const updatedMessages = prev.messages ? [...prev.messages] : [];
      if (newMessage) updatedMessages.push(newMessage);
      return { ...prev, status: newStatus, messages: updatedMessages, supportUpdatedFields: [] };
    });

    // Update the backend
    apiFetch(`${endpoint}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, newMessage, clearSupportUpdatedFields: true, hasSupportNotification: true })
    }).catch(err => console.error('Failed to update status', err));
  };

  const handleDelete = async (e, record) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ${record.displayId}?`)) return;

    const isClaim = record.type === 'Staff Case';
    const endpoint = isClaim ? `/api/claims/${record._id}` : `/api/cases/${record._id}`;

    try {
      const response = await apiFetch(`${endpoint}`, { method: 'DELETE' });
      
      if (response.ok) {
        if (isClaim) {
          setClaims(prev => prev.filter(c => c._id !== record._id));
        } else {
          setCases(prev => prev.filter(c => c._id !== record._id));
        }
        if (selectedCase?._id === record._id) {
          setSelectedCase(null);
        }
      } else {
        console.error('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record', error);
    }
  };


  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filterOldRejected = (c) => {
    if (c.status === 'Rejected' || c.status === 'REJECTED') {
      let rejectDate = c.updatedAt ? new Date(c.updatedAt) : new Date(c.createdAt || Date.now());
      if (c.messages && c.messages.length > 0) {
        const lastMsgDate = new Date(c.messages[c.messages.length - 1].date);
        if (!isNaN(lastMsgDate.getTime())) {
          rejectDate = lastMsgDate;
        }
      }
      return rejectDate >= thirtyDaysAgo;
    }
    return true;
  };

  // Map Cases
  const mappedCases = cases.filter(filterOldRejected).map(c => ({
    ...c,
    type: c.case_type || 'Office Case',
    displayId: c.case_id || c.caseId || `#CAS-${(c._id || '').slice(-6).toUpperCase()}`,
    displayDate: new Date(c.expensePeriodStart || c.expense_period_start || c.createdAt).toLocaleDateString('en-US'),
    displayName: c.staffName || c.staff_name || 'N/A',
    displayTotal: c.finalTotal || c.totalExpense || c.total_expense || c.final_total_amount || 0,
    currencySymbol: c.currency === 'JPY' ? '¥' : '$',
    expense_type: c.expenseType || c.expense_type || 'N/A',
  }));

  // Map Claims
  const mappedClaims = claims.filter(filterOldRejected).map(c => ({
    ...c,
    type: 'Staff Case',
    displayId: c.claim_id || c.claimId || `#CLM-${(c._id || '').slice(-6).toUpperCase()}`,
    displayDate: new Date(c.expensePeriodStart || c.expense_period_start || c.createdAt).toLocaleDateString('en-US'),
    displayName: c.fullName || c.full_name || 'N/A',
    displayTotal: c.totalExpenseAmount || c.total_expense_amount || 0,
    currencySymbol: c.currency === 'JPY' ? '¥' : '$',
    expense_type: c.expenseType || c.expense_type || 'N/A',
  }));

  const isPreApprovalStatus = (status) => ['New', 'Pending', 'Pending Correction', 'RETURNED_FOR_CORRECTION', 'Rejected', 'REJECTED', 'Registered', 'New Case'].includes(status);

  const preApprovalCases = mappedCases.filter(c => isPreApprovalStatus(c.status));
  const preApprovalClaims = mappedClaims.filter(c => isPreApprovalStatus(c.status));

  const allRecords = [...preApprovalCases, ...preApprovalClaims];

  const officeCasesCount = preApprovalCases.filter(c => c.type === 'Office Case').length;
  const staffCasesCount = preApprovalClaims.length;
  const hostCompanyCasesCount = preApprovalCases.filter(c => c.type === 'Host Company Case').length;

  const hasOfficeNotification = preApprovalCases.some(c => 
    c.type === 'Office Case' && (
      (user.role === 'support' && (c.hasSupportNotification || (c.messages && c.messages.some(m => !m.readBySupport)))) ||
      (user.role !== 'support' && c.hasAccountNotification)
    )
  );

  const hasStaffNotification = preApprovalClaims.some(c => 
    (user.role === 'support' && (c.hasSupportNotification || (c.messages && c.messages.some(m => !m.readBySupport)))) ||
    (user.role !== 'support' && c.hasAccountNotification)
  );

  const hasHostCompanyNotification = preApprovalCases.some(c => 
    c.type === 'Host Company Case' && (
      (user.role === 'support' && (c.hasSupportNotification || (c.messages && c.messages.some(m => !m.readBySupport)))) ||
      (user.role !== 'support' && c.hasAccountNotification)
    )
  );

  const filteredRecords = allRecords.filter(c => {
    const activeCaseType = activeTab + ' Case';
    const matchesTab = c.type === activeCaseType || (activeTab === 'Host Company' && false);
    const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
    const matchesType = expenseTypeFilter === 'All Types' || c.expense_type === expenseTypeFilter;
    
    return matchesTab && matchesStatus && matchesType;
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/cases').then(res => res.json()).catch(() => []),
      apiFetch('/api/claims').then(res => res.json()).catch(() => []),
      apiFetch('/api/options').then(res => res.json()).catch(() => [])
    ]).then(([casesData, claimsData, optionsData]) => {
      setCases(casesData);
      setClaims(claimsData);
      
      const types = optionsData.filter(opt => opt.type === 'ExpenseType');
      setExpenseTypeOptions(types);
      setLoading(false);
    });
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 pb-10">
      <h2 className="text-2xl font-bold text-[#162D50] mb-4">Case List</h2>
      
      {/* Top Tabs */}
      <div className="bg-[#F2F4F7] p-1 rounded-md flex space-x-1 mb-4 border border-gray-200">
        <button 
          onClick={() => setActiveTab('Office')}
          className={`relative flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'Office' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          Office Case <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'Office' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{officeCasesCount}</span>
          {hasOfficeNotification && (
            <span className="absolute top-2 right-4 flex h-3 w-3" title="New updates available">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('Staff')}
          className={`relative flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'Staff' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          Staff Case <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'Staff' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{staffCasesCount}</span>
          {hasStaffNotification && (
            <span className="absolute top-2 right-4 flex h-3 w-3" title="New updates available">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('Host Company')}
          className={`relative flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'Host Company' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          Host Company Case <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'Host Company' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{hostCompanyCasesCount}</span>
          {hasHostCompanyNotification && (
            <span className="absolute top-2 right-4 flex h-3 w-3" title="New updates available">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-4 flex items-end space-x-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">Search</label>
          <div className="relative">
            <input type="text" placeholder="Search Case ID, Staff Name..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
              <option value="All Statuses">All Statuses</option>
              {[...new Set(cases.map(c => c.status))].filter(Boolean).map(status => (
                <option key={status} value={status}>{status === 'Pending' ? 'New-Case' : status}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-600 mb-1">Expense Type</label>
          <div className="relative">
            <select value={expenseTypeFilter} onChange={e => setExpenseTypeFilter(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
              <option value="All Types">All Types</option>
              {expenseTypeOptions.map(opt => (
                <option key={opt._id || opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-600 mb-1">Date Range</label>
          <div className="relative">
            <input type="text" placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
          </div>
        </div>
        <button className="bg-[#0A192F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#162D50] transition-colors shadow-sm whitespace-nowrap h-[38px]">
          Apply Filters
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-600">
              <th className="py-3 px-6">Case ID</th>
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Staff Name</th>
              <th className="py-3 px-6">Expense Type</th>
              <th className="py-3 px-6">Total Amount</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-4 px-6 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-4 px-6 text-center text-gray-500">No cases found.</td>
              </tr>
            ) : (
              filteredRecords.map(c => (
                <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-gray-600">{c.displayId}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {c.displayDate}
                  </td>
                  <td className="py-4 px-6 text-gray-800">{c.displayName}</td>
                  <td className="py-4 px-6 text-gray-600">{c.expense_type}</td>
                  <td className="py-4 px-6 font-bold text-gray-800">
                    {c.currencySymbol}{c.displayTotal.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      c.status === 'Pending Correction' || c.status === 'RETURNED_FOR_CORRECTION' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      c.status === 'Rejected' || c.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                      c.status === 'New' || c.status === 'Registered' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      c.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {c.status === 'Pending' ? 'New-Case' : c.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="relative inline-block">
                        <button 
                          onClick={() => handleViewDetails(c)}
                          className="text-[#162D50] font-bold hover:underline"
                        >
                          View Details
                        </button>
                        {user.role === 'support' && (c.hasSupportNotification || (c.messages && c.messages.some(m => !m.readBySupport))) && (
                            <span className="absolute -top-1 -right-3 flex h-3 w-3" title="New update from Account Department">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        )}
                        {user.role !== 'support' && c.hasAccountNotification && (
                            <span className="absolute -top-1 -right-3 flex h-3 w-3" title="Updated by Support">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                          </span>
                        )}
                      </div>
                      {user.role !== 'support' && (
                        <button
                          onClick={(e) => handleDelete(e, c)}
                          className="text-red-500 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Case Detail Preview */}
      {selectedCase && (
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-md mt-8">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-md">
            <h3 className="text-[#162D50] text-lg font-bold">Case Detail Preview</h3>
            <div className="flex items-center space-x-3">
              {selectedCase.missingReceipt && (
                <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium border border-red-200">Missing Receipt</span>
              )}
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="text-gray-600 font-bold text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} className="bg-[#0A192F] text-white font-bold text-sm px-4 py-2 rounded-md hover:bg-[#162D50] transition-colors">
                    Save
                  </button>
                </>
              ) : (
                <button onClick={handleEditClick} className="flex items-center text-[#162D50] font-bold text-sm px-4 py-2 border border-[#162D50] rounded-md hover:bg-gray-50 transition-colors">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 bg-white">
            {/* CASE INFORMATION */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">CASE INFORMATION</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Case ID</span>
                  <span className="font-bold text-gray-800">{selectedCase.displayId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Staff Name</span>
                  <span className="font-bold text-gray-800">{selectedCase.displayName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Expense Type</span>
                  {isEditing ? (
                    <select
                      value={editData.expense_type || ''}
                      onChange={(e) => setEditData({...editData, expense_type: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-800"
                    >
                      {expenseTypeOptions.map(opt => (
                        <option key={opt._id || opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`font-bold ${selectedCase.supportUpdatedFields?.includes('expense_type') ? 'text-blue-600' : 'text-gray-800'}`}>
                      {selectedCase.expense_type}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Amount</span>
                  {isEditing ? (
                    <div className="flex items-center">
                      <span className="mr-1 font-bold text-gray-800">{selectedCase.currencySymbol}</span>
                      <input 
                        type="number" 
                        value={editData.total_expense || ''}
                        onChange={(e) => setEditData({...editData, total_expense: e.target.value})}
                        className="border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-800 w-24 text-right"
                      />
                    </div>
                  ) : (
                    <span className={`font-bold ${selectedCase.supportUpdatedFields?.includes('total_expense') ? 'text-blue-600' : 'text-gray-800'}`}>
                      {selectedCase.currencySymbol}{selectedCase.displayTotal.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SETTLEMENT BREAKDOWN */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">SETTLEMENT BREAKDOWN</h4>
              <div className="bg-[#E9ECEF] rounded-md p-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Settlement to Advancer</span>
                  <span className="font-bold text-gray-800">{selectedCase.currencySymbol}{selectedCase.displayTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-4 pb-4 border-b border-gray-300 items-center">
                  <span className="text-gray-500">Method</span>
                  {isEditing ? (
                    <input 
                      type="text"
                      value={editData.settlement_method || ''}
                      onChange={(e) => setEditData({...editData, settlement_method: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 w-32 text-right"
                    />
                  ) : (
                    <span className={`${selectedCase.supportUpdatedFields?.includes('settlement_method') ? 'text-blue-600 font-bold' : 'text-gray-800'}`}>
                      {selectedCase.settlement_method || 'Bank Transfer'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Recovery Method:</div>
                  {isEditing ? (
                    <input 
                      type="text"
                      value={editData.collection_method || ''}
                      onChange={(e) => setEditData({...editData, collection_method: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 w-full"
                    />
                  ) : (
                    <div className={`${selectedCase.supportUpdatedFields?.includes('collection_method') ? 'text-blue-600 font-bold' : 'text-gray-800'}`}>
                      {selectedCase.collection_method || 'Company Expense (VC Bears)'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ATTACHMENTS */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">ATTACHMENTS</h4>
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative flex flex-col items-center justify-center">
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                      <FileText className="w-6 h-6 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Drag and drop files or click to upload</p>
                    </div>
                    {editData.receipts && editData.receipts.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        {editData.receipts.map((fileName, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-md px-4 py-2 flex justify-between items-center text-sm">
                            <a href={fileUrl(fileName)} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline truncate mr-2" onClick={(e) => handleFileClick(e, fileUrl(fileName))}>
                              <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{fileName || `Receipt_${idx + 1}`}</span>
                            </a>
                            <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700 ml-2 font-bold p-1">X</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  (selectedCase.receipts || selectedCase.bill_receipt_url) && (selectedCase.receipts || selectedCase.bill_receipt_url).length > 0 ? (
                    (selectedCase.receipts || selectedCase.bill_receipt_url).map((fileName, idx) => (
                      <div key={idx} className={`bg-white border rounded-md px-4 py-3 flex justify-between items-center text-sm ${selectedCase.supportUpdatedFields?.includes('receipts') ? 'border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'border-gray-200'}`}>
                        <a href={fileUrl(fileName)} target="_blank" rel="noopener noreferrer" className={`flex items-center hover:underline truncate ${selectedCase.supportUpdatedFields?.includes('receipts') ? 'text-blue-700 font-bold' : 'text-blue-600'}`} onClick={(e) => handleFileClick(e, fileUrl(fileName))}>
                          <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{fileName || `Receipt_${idx + 1}`}</span>
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No attachments found.</div>
                  )
                )}
              </div>
            </div>

            {/* STATUS MESSAGE & SHORT NOTE */}
            <div className="md:col-span-3 mt-4 border-t border-gray-200 pt-6">
              {isEditing && (
                <div className="mb-6 w-full md:w-2/3">
                  <h4 className="text-xs font-bold text-gray-500 mb-2 tracking-wider">ADD SHORT NOTE</h4>
                  <textarea 
                    value={editData.short_note || ''} 
                    onChange={(e) => setEditData({...editData, short_note: e.target.value})}
                    placeholder="Enter an optional note or remark to attach to this case..." 
                    className="w-full h-[80px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] resize-none text-gray-600"
                  ></textarea>
                </div>
              )}
              {selectedCase.messages && selectedCase.messages.length > 0 && (
                <div className="w-full">
                  <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">REASON / MESSAGE HISTORY</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Department Messages */}
                    <div>
                      <h5 className="text-sm font-bold text-orange-700 mb-3 border-b border-orange-200 pb-1">Account Department</h5>
                      <div className="space-y-3">
                        {selectedCase.messages.filter(m => m.author === 'account_user' || m.author === 'Account Department' || !m.author).map((m, i) => (
                          <div key={i} className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-gray-700">
                            <div className="flex justify-between items-center mb-1 pb-1 border-b border-orange-200/50">
                              <span className="text-xs font-bold text-orange-700">Account Department</span>
                              <span className="text-xs text-orange-600">{m.date ? new Date(m.date).toLocaleString() : ''}</span>
                            </div>
                            <div className="whitespace-pre-wrap mt-1">{m.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Support Department Messages */}
                    <div>
                      <h5 className="text-sm font-bold text-blue-700 mb-3 border-b border-blue-200 pb-1">Support Department</h5>
                      <div className="space-y-3">
                        {selectedCase.messages.filter(m => !(m.author === 'account_user' || m.author === 'Account Department' || !m.author)).map((m, i) => {
                          const displayAuthor = m.author === 'support_user' ? 'Support Department' : m.author;
                          return (
                            <div key={i} className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-gray-700">
                              <div className="flex justify-between items-center mb-1 pb-1 border-b border-blue-200/50">
                                <span className="text-xs font-bold text-blue-700">{displayAuthor}</span>
                                <span className="text-xs text-blue-600">{m.date ? new Date(m.date).toLocaleString() : ''}</span>
                              </div>
                              <div className="whitespace-pre-wrap mt-1">{m.text}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200 flex justify-end items-center space-x-4 bg-gray-50 rounded-b-md">
            {user.role !== 'support' && (
              <>
                {(selectedCase.status === 'Rejected' || selectedCase.status === 'REJECTED' || selectedCase.status === 'Pending Correction' || selectedCase.status === 'RETURNED_FOR_CORRECTION') && (
                  <button 
                    onClick={() => handleUpdateStatus('Pending')}
                    className="text-blue-600 font-medium px-4 hover:underline mr-auto"
                  >
                    Revert to Pending
                  </button>
                )}
                <button 
                  onClick={() => handleUpdateStatus('REJECTED')}
                  className="text-red-500 font-medium px-4 hover:underline"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleUpdateStatus('RETURNED_FOR_CORRECTION')}
                  className="border border-gray-300 bg-white text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50"
                >
                  Return for Correction
                </button>
                <button 
                  onClick={() => {
                    handleUpdateStatus('APPROVED_FOR_PAYMENT');
                    // Additional toast or local UI feedback can go here
                  }}
                  className="bg-[#0A192F] text-white px-6 py-2 rounded-md font-bold hover:bg-[#162D50] shadow-sm"
                >
                  Approve for Payment
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" onClick={() => setPreviewImage(null)}>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="text-base font-semibold text-gray-800 flex items-center">
                <Image className="w-4 h-4 mr-2 text-blue-600" />
                Image Preview
              </h3>
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 bg-gray-100/50 flex items-center justify-center min-h-[300px]">
              {previewImage && previewImage.split('?')[0].match(/\.pdf$/i) ? (
                <iframe
                  src={previewImage}
                  title="PDF Preview"
                  className="w-full h-[65vh] rounded border border-gray-200 shadow-sm bg-white"
                />
              ) : (
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="max-w-full max-h-[65vh] object-contain rounded border border-gray-200 shadow-sm bg-white"
                />
              )}
            </div>
            
            <div className="px-5 py-4 border-t border-gray-100 bg-white flex justify-end">
              <button 
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
              <a 
                href={previewImage} 
                download
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
