import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Calendar, FileText, AlertTriangle, Image, Edit, X, Download, MessageSquare, Send } from 'lucide-react';
import { fileUrl } from '../../utils/fileUrl.js';
import { apiFetch } from '../../utils/apiFetch.js';
import toast from 'react-hot-toast';
import { toastConfirm } from '../../utils/toastConfirm.jsx';
import { 
  toJP, 
  normalizeOptionValue, 
  sortExpenseTypes, 
  isHostCompanyPairing, 
  isFarmParty,
  getAvailableCollectionMethods 
} from '../../utils/expenseRules.js';

const getCaseTargetTab = (c) => {
  if (!c) return 'Office';
  const isHost = Boolean(
    c.isHostCompanyCase ||
    c.case_type === 'Host Company Case' ||
    isHostCompanyPairing(c.advancer_category || c.advancerCategory, c.bearing_party || c.bearingParty) ||
    isFarmParty(c.advancer_category || c.advancerCategory) ||
    isFarmParty(c.bearing_party || c.bearingParty)
  );
  if (isHost) return 'Host Company';
  const rawAdv = String(c.advancer_category || c.advancerCategory || '').trim().toLowerCase();
  if (
    rawAdv.includes('staff') ||
    rawAdv.includes('スタッフ') ||
    rawAdv.includes('service') ||
    rawAdv.includes('support') ||
    c.claim_id ||
    c.claimId ||
    c._isClaim ||
    c.type === 'Staff Case' ||
    c.case_type === 'Staff Case'
  ) {
    return 'Staff';
  }
  return 'Office';
};

export default function CaseList({ setActiveTab: onNavigate }) {
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'admin', username: 'admin' };
  
  const [cases, setCases] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // SSE Subscription & dynamic synchronization
  useEffect(() => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || '';
    let sse = null;
    let reconnectTimer = null;

    const connectSSE = () => {
      try {
        sse = new EventSource(`${apiUrl}/api/events?token=${token}`);

        sse.addEventListener('CASE_REGISTERED', (e) => {
          try {
            const newRecord = JSON.parse(e.data);
            if (newRecord.claim_id) {
              setClaims(prev => {
                if (prev.some(p => p._id === newRecord._id || p.claim_id === newRecord.claim_id)) return prev;
                return [newRecord, ...prev];
              });
            } else {
              setCases(prev => {
                if (prev.some(p => p._id === newRecord._id || p.case_id === newRecord.case_id)) return prev;
                return [newRecord, ...prev];
              });
            }
          } catch (err) {
            console.error('Error handling CASE_REGISTERED:', err);
          }
        });

        sse.addEventListener('CASE_UPDATED', (e) => {
          try {
            const updatedRecord = JSON.parse(e.data);
            const isClaimRec = Boolean(updatedRecord.claim_id || updatedRecord.claimId);
            const matchId = (item) => (
              item && (
                item._id === updatedRecord._id ||
                (item.claim_id && item.claim_id === updatedRecord.claim_id) ||
                (item.case_id && item.case_id === updatedRecord.case_id)
              )
            );

            if (isClaimRec) {
              setClaims(prev => prev.map(c => matchId(c) ? { ...c, ...updatedRecord, _isClaim: true } : c));
            } else {
              setCases(prev => prev.map(c => matchId(c) ? { ...c, ...updatedRecord, _isClaim: false } : c));
            }
            // Refresh open detail panel so new messages appear immediately
            setSelectedCase(prev => {
              if (prev && matchId(prev)) {
                return { 
                  ...prev, 
                  ...updatedRecord, 
                  _isClaim: prev._isClaim !== undefined ? prev._isClaim : isClaimRec,
                  messages: updatedRecord.messages || prev.messages 
                };
              }
              return prev;
            });
          } catch (err) {
            console.error('Error handling CASE_UPDATED:', err);
          }
        });

        sse.onerror = () => {
          if (sse) sse.close();
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.error('Failed to connect SSE:', err);
      }
    };

    connectSSE();

    // Periodic dynamic polling sync (every 15s) to guarantee freshness across all sessions
    const syncInterval = setInterval(() => {
      Promise.all([
        apiFetch('/api/cases').then(res => res.json()).catch(() => null),
        apiFetch('/api/claims').then(res => res.json()).catch(() => null)
      ]).then(([cData, clData]) => {
        if (Array.isArray(cData)) setCases(cData);
        if (Array.isArray(clData)) setClaims(clData);
      });
    }, 15000);

    return () => {
      if (sse) sse.close();
      clearTimeout(reconnectTimer);
      clearInterval(syncInterval);
    };
  }, []);
  
  // Use sessionStorage to set initial tab, then clear it
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = sessionStorage.getItem('caseListTab');
    if (savedTab) {
      sessionStorage.removeItem('caseListTab');
      return savedTab;
    }
    return user.role === 'support' ? 'Staff' : 'All';
  });

  const [statusFilter, setStatusFilter] = useState('すべてのステータス');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('すべての種類');
  const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'REJECTED'|'RETURNED_FOR_CORRECTION', comment: '' }
  const [chatInput, setChatInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedCase?.messages?.length]);

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text || !selectedCase || isSendingMsg) return;
    setIsSendingMsg(true);
    setChatInput('');
    const isClaim = Boolean(selectedCase._isClaim || selectedCase.claim_id || selectedCase.claimId || (selectedCase.type === 'Staff Case'));
    const caseId = selectedCase._id || selectedCase.id || selectedCase.claim_id || selectedCase.case_id;
    const endpoint = isClaim
      ? `/api/claims/${caseId}/messages`
      : `/api/cases/${caseId}/messages`;
    try {
      let response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ 
          text, 
          author: user.role === 'support' ? 'support_user' : (user.role === 'admin' ? 'admin' : 'account_user') 
        })
      });

      // If not found, attempt fallback to the alternative endpoint
      if (!response.ok && response.status === 404) {
        const altEndpoint = isClaim
          ? `/api/cases/${caseId}/messages`
          : `/api/claims/${caseId}/messages`;
        const altResponse = await apiFetch(altEndpoint, {
          method: 'POST',
          body: JSON.stringify({ 
            text, 
            author: user.role === 'support' ? 'support_user' : (user.role === 'admin' ? 'admin' : 'account_user') 
          })
        });
        if (altResponse.ok) {
          response = altResponse;
        }
      }

      if (response.ok) {
        const updatedMessages = await response.json();
        setSelectedCase(prev => prev ? { ...prev, _isClaim: isClaim, messages: updatedMessages } : prev);
        if (isClaim) {
          setClaims(prev => prev.map(c => (c._id === caseId || c.claim_id === caseId) ? { ...c, messages: updatedMessages } : c));
        } else {
          setCases(prev => prev.map(c => (c._id === caseId || c.case_id === caseId) ? { ...c, messages: updatedMessages } : c));
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.error('Failed to send message:', response.status, errJson);
        toast.error('メッセージの送信に失敗しました。');
        setChatInput(text);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('エラーが発生しました。');
      setChatInput(text);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleViewDetails = async (caseObj) => {
    setSelectedCase(caseObj);
    setIsEditing(false);
    setChatInput('');

    const isClaim = Boolean(caseObj._isClaim || caseObj.claim_id || caseObj.claimId || (caseObj.type === 'Staff Case'));
    const caseId = caseObj._id || caseObj.id || caseObj.claim_id || caseObj.case_id;
    const endpoint = isClaim ? `/api/claims/${caseId}` : `/api/cases/${caseId}`;

    // Always fetch fresh details so messages are never hidden or lost in any situation
    apiFetch(endpoint)
      .then(async res => {
        if (!res.ok && res.status === 404) {
          const altEndpoint = isClaim ? `/api/cases/${caseId}` : `/api/claims/${caseId}`;
          const altRes = await apiFetch(altEndpoint);
          return altRes.ok ? altRes.json() : null;
        }
        return res.ok ? res.json() : null;
      })
      .then(freshData => {
        if (freshData && Array.isArray(freshData.messages)) {
          setSelectedCase(prev => {
            if (prev && (prev._id === caseId || prev.claim_id === caseId || prev.case_id === caseId)) {
              return { ...prev, ...freshData, _isClaim: isClaim, messages: freshData.messages };
            }
            return prev;
          });
          const updater = isClaim ? setClaims : setCases;
          updater(prev => prev.map(item => (item._id === caseId || item.claim_id === caseId || item.case_id === caseId) ? { ...item, ...freshData, _isClaim: isClaim, messages: freshData.messages } : item));
        }
      })
      .catch(err => console.error('Error fetching fresh case details:', err));

    if (user.role !== 'support' && caseObj.hasAccountNotification) {
      try {
        await apiFetch(endpoint, {
          method: 'PUT',
          body: JSON.stringify({ hasAccountNotification: false }),
        });
        
        const updateState = (items) => items.map(c => c._id === caseObj._id ? { ...c, hasAccountNotification: false } : c);
        if (isClaim) setClaims(updateState);
        else setCases(updateState);
        
        setSelectedCase(prev => prev ? { ...prev, hasAccountNotification: false } : prev);
      } catch (err) {
        console.error('Error clearing notification', err);
      }
    }
    
    if (user.role === 'support' && (caseObj.hasSupportNotification || (caseObj.messages && caseObj.messages.some(m => !m.readBySupport)))) {
      // Clear support notification flag
      if (caseObj.hasSupportNotification) {
        apiFetch(endpoint, {
          method: 'PUT',
          body: JSON.stringify({ hasSupportNotification: false })
        }).catch(err => console.error('Failed to clear support notification', err));
        
        const updateState = (items) => items.map(c => c._id === caseObj._id ? { ...c, hasSupportNotification: false } : c);
        if (isClaim) setClaims(updateState);
        else setCases(updateState);
        setSelectedCase(prev => prev ? { ...prev, hasSupportNotification: false } : prev);
      }

      // Mark messages as read safely without ever overwriting messages with undefined
      if (caseObj.messages && caseObj.messages.some(m => !m.readBySupport)) {
        const msgEndpoint = `${endpoint}/messages/read`;
        apiFetch(msgEndpoint, {
          method: 'POST'
        })
        .then(res => res.ok ? res.json() : null)
        .then(resMessages => {
          if (Array.isArray(resMessages) && resMessages.length > 0) {
            const updater = isClaim ? setClaims : setCases;
            updater(prev => prev.map(item => item._id === caseObj._id ? { ...item, messages: resMessages } : item));
            setSelectedCase(prev => prev && prev._id === caseObj._id ? { ...prev, messages: resMessages } : prev);
          }
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
        toast.error(`Invalid file type: ${file.name}. Only JPG, PNG, and PDF files are allowed.`);
        e.target.value = '';
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`File too large: ${file.name}. Maximum size is 2 MB per file.`);
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
    const isClaim = selectedCase._isClaim;
    const endpoint = isClaim ? `/api/claims/${selectedCase._id}` : `/api/cases/${selectedCase._id}`;

    // Map properties back to their correct names based on isClaim
    const payload = {};
    if (isClaim) {
      payload.expenseType = editData.expense_type;
      payload.totalExpense金額 = parseFloat(editData.total_expense);
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

    const noteAuthor = user.role === 'support' ? 'support_user' : (user.role === 'admin' ? 'admin' : 'account_user');
    if (editData.short_note && editData.short_note.trim() !== '') {
      payload.messages = [
        ...(selectedCase.messages || []),
        {
          text: editData.short_note.trim(),
          date: new Date().toISOString(),
          author: noteAuthor
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
        const newStatus = 'RESUBMITTED';
        const statusEndpoint = isClaim
          ? `/api/claims/${selectedCase._id}/status`
          : `/api/cases/${selectedCase._id}/status`;
        await apiFetch(statusEndpoint, {
          method: 'PATCH',
          body: JSON.stringify({ 
            status: newStatus, 
            hasAccountNotification: true, 
            clearSupportUpdatedFields: true,
            newMessage: editData.short_note?.trim() ? {
              text: editData.short_note.trim(),
              date: new Date().toISOString(),
              author: noteAuthor
            } : undefined
          })
        });

        const mappedUpdated = {
          ...selectedCase,
          ...payload,
          status: newStatus,
          displayStatus: '再提出済み',
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
          setClaims(prev => prev.map(c => c._id === selectedCase._id ? { ...c, ...payload, status: newStatus, displayStatus: '再提出済み' } : c));
        } else {
          setCases(prev => prev.map(c => c._id === selectedCase._id ? { ...c, ...payload, status: newStatus, displayStatus: '再提出済み' } : c));
        }
        setSelectedCase(mappedUpdated);
        setIsEditing(false);
        toast.success('再提出しました。');
      } else {
        console.error('Failed to update record');
        toast.error('更新に失敗しました。');
      }
    } catch (error) {
      console.error('Error updating record', error);
    }
  };

  const handleUpdateStatus = async (newステータス, comment = '') => {
    if (!selectedCase) return;

    const author = user.role === 'support' ? 'support_user' : (user.role === 'admin' ? 'admin' : 'account_user');
    const newMessage = comment.trim()
      ? { text: comment.trim(), author, date: new Date().toISOString() }
      : null;

    const isClaim = selectedCase._isClaim;
    const endpoint = isClaim ? `/api/claims/${selectedCase._id}/status` : `/api/cases/${selectedCase._id}/status`;

    const updateFn = (c) => {
      if (c._id === selectedCase._id) {
        const updatedMessages = c.messages ? [...c.messages] : [];
        if (newMessage) updatedMessages.push(newMessage);
        return { 
          ...c, 
          status: newステータス, 
          statusMessage: comment.trim() || c.statusMessage, 
          messages: updatedMessages, 
          supportUpdatedFields: [] 
        };
      }
      return c;
    };

    if (isClaim) {
      setClaims(prev => prev.map(updateFn));
    } else {
      setCases(prev => prev.map(updateFn));
    }

    setSelectedCase(prev => {
      const updatedMessages = prev.messages ? [...prev.messages] : [];
      if (newMessage) updatedMessages.push(newMessage);
      return { 
        ...prev, 
        status: newステータス, 
        statusMessage: comment.trim() || prev?.statusMessage, 
        messages: updatedMessages, 
        supportUpdatedFields: [] 
      };
    });

    try {
      const res = await apiFetch(`${endpoint}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: newステータス, 
          newMessage, 
          statusMessage: comment.trim() || undefined,
          clearSupportUpdatedFields: true, 
          hasSupportNotification: user.role !== 'support',
          hasAccountNotification: user.role === 'support'
        })
      });
      return res;
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('ステータスの更新に失敗しました');
    }
  };

  const openActionModal = (type) => {
    setActionModal({ type, comment: '' });
  };

  const submitActionModal = () => {
    if (!actionModal) return;
    handleUpdateStatus(actionModal.type, actionModal.comment);
    setActionModal(null);
  };

  const handleDelete = async (e, record) => {
    e.stopPropagation();
    const confirmed = await toastConfirm(`Are you sure you want to delete ${record.displayId}?`);
    if (!confirmed) return;

    const isClaim = record._isClaim;
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

  const filterOld拒否 = (c) => {
    if (c.status === '拒否' || c.status === 'REJECTED') {
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

  const isCaseRegisteredBySupport = (caseItem) => {
    if (!caseItem) return false;
    
    const regBy = caseItem.registered_by || caseItem.registeredBy || caseItem.created_by || caseItem.createdBy;
    const regRole = caseItem.registered_by_role || caseItem.registeredByRole || caseItem.created_by_role || caseItem.createdByRole;
    
    if (regBy) {
      const regByLower = String(regBy).toLowerCase();
      if (regByLower === 'support_user' || regByLower.includes('support') || regByLower === 'サポート部門') {
        return true;
      }
      if (regByLower === 'account_user' || regByLower.includes('account') || regByLower === '経理部門' || regByLower === 'admin') {
        return false;
      }
    }
    
    if (regRole) {
      const regRoleLower = String(regRole).toLowerCase();
      if (regRoleLower === 'support' || regRoleLower.includes('support')) {
        return true;
      }
      if (regRoleLower === 'account' || regRoleLower === 'admin') {
        return false;
      }
    }
    
    if (caseItem._isClaim || caseItem.claim_id || caseItem.claimId) {
      return true;
    }
    
    if (caseItem.type === 'Staff Case' || caseItem.case_type === 'Staff Case') {
      return true;
    }
    
    return false;
  };

  // Map Cases
  const mappedCases = cases.filter(filterOld拒否).map(c => {
    const isHost = c.isHostCompanyCase || c.case_type === 'Host Company Case' || isHostCompanyPairing(c.advancer_category || c.advancerCategory, c.bearing_party || c.bearingParty);
    return {
      ...c,
      _isClaim: false,
      type: isHost ? 'Host Company Case' : (c.case_type || 'Office Case'),
      displayId: c.case_id || c.caseId || `#CAS-${(c._id || '').slice(-6).toUpperCase()}`,
      displayDate: new Date(c.expensePeriodStart || c.expense_period_start || c.createdAt).toLocaleDateString('en-US'),
      displayName: c.staffName || c.staff_name || 'N/A',
      displayTotal: c.finalTotal || c.totalExpense || c.total_expense || c.final_total_amount || 0,
      currencySymbol: c.currency === 'JPY' ? '¥' : '$',
      expense_type: c.expenseType || c.expense_type || 'N/A',
      registered_by: c.registered_by || 'account_user',
      registered_by_role: c.registered_by_role || 'account',
    };
  });

  // Map Claims
  const mappedClaims = claims.filter(filterOld拒否).map(c => {
    const isHost = c.isHostCompanyCase || c.case_type === 'Host Company Case' || isHostCompanyPairing(c.advancer_category || c.advancerCategory, c.bearing_party || c.bearingParty);
    return {
      ...c,
      _isClaim: true,
      type: isHost ? 'Host Company Case' : 'Staff Case',
      displayId: c.claim_id || c.claimId || `#CLM-${(c._id || '').slice(-6).toUpperCase()}`,
      displayDate: new Date(c.expensePeriodStart || c.expense_period_start || c.createdAt).toLocaleDateString('en-US'),
      displayName: c.fullName || c.full_name || 'N/A',
      displayTotal: c.expenseAmount || c.expense_amount || c.totalExpense金額 || c.total_expense_amount || 0,
      currencySymbol: c.currency === 'JPY' ? '¥' : '$',
      expense_type: c.expenseType || c.expense_type || 'N/A',
      registered_by: c.registered_by || c.registeredBy || '',
      registered_by_role: c.registered_by_role || 'support',
    };
  });

  const getDisplayStatus = (status) => {
    if (['Pending', 'New', 'Registered', '保留中'].includes(status)) return '新た';
    if (['REJECTED', '拒否'].includes(status)) return '拒否';
    if (['RETURNED_FOR_CORRECTION', '保留中 Correction'].includes(status)) return '修正依頼';
    if (['RESUBMITTED', '再提出済み'].includes(status)) return '再提出済み';
    return status;
  };

  const allRecords = [...mappedCases, ...mappedClaims]
    .filter(c => {
      if (c.status && c.status.includes('完了')) return false;
      if (user.role === 'support') {
        const reg = c.registered_by || c.registeredBy;
        return reg === user.username;
      }
      return !['APPROVED_FOR_PAYMENT', 'Approve for Payment', '支払承認', '承認済 for Payment', 'Payment 保留中', '処理中', 'Processing', 'processing', 'Completed', 'completed'].includes(c.status);
    })
    .map(c => ({ ...c, displayStatus: getDisplayStatus(c.status) }));

  const baseFiltered = allRecords.filter(c => {
    const matchesStatus = statusFilter === 'すべてのステータス' || c.displayStatus === statusFilter;
    const matchesType = expenseTypeFilter === 'すべての種類' || 
      c.expense_type === expenseTypeFilter || 
      (c.expense_type || '').toLowerCase() === (expenseTypeFilter || '').toLowerCase() ||
      toJP(c.expense_type) === toJP(expenseTypeFilter);
    return matchesStatus && matchesType;
  });

  const officeCasesCount = baseFiltered.filter(c => c.type === 'Office Case').length;
  const staffCasesCount = baseFiltered.filter(c => c.type === 'Staff Case').length;
  const hostCompanyCasesCount = baseFiltered.filter(c => c.type === 'Host Company Case').length;
  const allCasesCount = officeCasesCount + staffCasesCount + hostCompanyCasesCount;

  const hasOfficeNotification = mappedCases.some(c => 
    c.type === 'Office Case' && (
      (user.role === 'support' && (c.registered_by === user.username) && (c.hasSupportNotification || (c.messages && c.messages.some(m => !m.readBySupport)))) ||
      (user.role !== 'support' && c.hasAccountNotification)
    )
  );

  const hasStaffNotification = mappedClaims.some(c => 
    (user.role === 'support' && (c.registered_by === user.username) && (c.hasSupportNotification || (c.messages && c.messages.some(m => !m.readBySupport)))) ||
    (user.role !== 'support' && c.hasAccountNotification)
  );

  const hasHostCompanyNotification = mappedCases.some(c => 
    c.type === 'Host Company Case' && (
      (user.role === 'support' && (c.registered_by === user.username) && (c.hasSupportNotification || (c.messages && c.messages.some(m => !m.readBySupport)))) ||
      (user.role !== 'support' && c.hasAccountNotification)
    )
  );

  const filteredRecords = baseFiltered.filter(c => {
    const matchesTab = activeTab === 'All' ||
      c.type === activeTab + ' Case' || 
      (activeTab === 'Host Company' && c.type === 'Host Company Case');
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (c.displayId || '').toLowerCase().includes(q) ||
      (c.displayName || '').toLowerCase().includes(q) ||
      (c.expense_type || '').toLowerCase().includes(q) ||
      toJP(c.expense_type).toLowerCase().includes(q);
    const recordDate = new Date(c.expensePeriodStart || c.expense_period_start || c.createdAt);
    const matchesDateStart = !dateFilterStart || recordDate >= new Date(dateFilterStart);
    const matchesDateEnd = !dateFilterEnd || recordDate <= new Date(dateFilterEnd + 'T23:59:59');
    return matchesTab && matchesSearch && matchesDateStart && matchesDateEnd;
  });

  useEffect(() => {
    if (selectedCase?._id) {
      sessionStorage.setItem('openCaseDetailId', selectedCase._id);
      sessionStorage.setItem('openCaseIsClaim', selectedCase._isClaim ? 'true' : 'false');
    } else {
      sessionStorage.removeItem('openCaseDetailId');
      sessionStorage.removeItem('openCaseIsClaim');
    }
  }, [selectedCase?._id, selectedCase?._isClaim]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/cases').then(res => res.json()).catch(() => []),
      apiFetch('/api/claims').then(res => res.json()).catch(() => []),
      apiFetch('/api/options').then(res => res.json()).catch(() => [])
    ]).then(([casesData, claimsData, optionsData]) => {
      setCases(casesData);
      setClaims(claimsData);
      
      const types = sortExpenseTypes(optionsData.filter(opt => opt.type === 'ExpenseType'));
      setExpenseTypeOptions(types);
      setLoading(false);

      // Restore and refresh currently open case detail (e.g. after refresh)
      const savedCaseId = sessionStorage.getItem('openCaseDetailId');
      const savedIsClaim = sessionStorage.getItem('openCaseIsClaim') === 'true';
      if (savedCaseId) {
        const found = (savedIsClaim ? claimsData : casesData).find(x => x._id === savedCaseId);
        if (found) {
          const isHost = found.isHostCompanyCase || found.case_type === 'Host Company Case' || isHostCompanyPairing(found.advancer_category || found.advancerCategory, found.bearing_party || found.bearingParty);
          setSelectedCase({
            ...found,
            _isClaim: savedIsClaim,
            type: isHost ? 'Host Company Case' : (savedIsClaim ? 'Staff Case' : (found.case_type || 'Office Case')),
            displayId: savedIsClaim ? (found.claim_id || found.claimId || `#CLM-${(found._id || '').slice(-6).toUpperCase()}`) : (found.case_id || found.caseId || `#CAS-${(found._id || '').slice(-6).toUpperCase()}`),
            displayDate: new Date(found.expensePeriodStart || found.expense_period_start || found.createdAt).toLocaleDateString('en-US'),
            displayName: savedIsClaim ? (found.fullName || found.full_name || 'N/A') : (found.staffName || found.staff_name || 'N/A'),
            displayTotal: savedIsClaim ? (found.expenseAmount || found.expense_amount || found.totalExpense金額 || found.total_expense_amount || 0) : (found.finalTotal || found.totalExpense || found.total_expense || found.final_total_amount || 0),
            currencySymbol: found.currency === 'JPY' ? '¥' : '$',
            expense_type: found.expenseType || found.expense_type || 'N/A',
            registered_by: found.registered_by || (savedIsClaim ? 'support_user' : 'account_user'),
            registered_by_role: found.registered_by_role || (savedIsClaim ? 'support' : 'account'),
            messages: found.messages || []
          });
        }
      }
    });
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6 pb-10">
      <h2 className="text-2xl font-bold text-[#162D50] mb-4">案件一覧</h2>
      
      {/* Top Tabs */}
      <div className="bg-[#F2F4F7] p-1 rounded-md flex space-x-1 mb-4 border border-gray-200">
        {user.role !== 'support' && (
          <button 
            onClick={() => setActiveTab('All')}
            className={`relative flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'All' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
            すべて <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'All' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{allCasesCount}</span>
            {(hasOfficeNotification || hasStaffNotification || hasHostCompanyNotification) && (
              <span className="absolute top-2 right-4 flex h-3 w-3" title="New updates available">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </button>
        )}
        {user.role !== 'support' && (
          <button 
            onClick={() => setActiveTab('Office')}
            className={`relative flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'Office' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
            オフィス案件 <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'Office' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{officeCasesCount}</span>
            {hasOfficeNotification && (
              <span className="absolute top-2 right-4 flex h-3 w-3" title="New updates available">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </button>
        )}
        <button 
          onClick={() => setActiveTab('Staff')}
          className={`relative flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'Staff' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
          スタッフ案件 <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'Staff' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{staffCasesCount}</span>
          {hasStaffNotification && (
            <span className="absolute top-2 right-4 flex h-3 w-3" title="New updates available">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
        {user.role !== 'support' && (
          <button 
            onClick={() => setActiveTab('Host Company')}
            className={`relative flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'Host Company' ? 'text-white bg-[#0A192F] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
            ホスト会社案件 <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'Host Company' ? 'bg-white text-[#0A192F]' : 'bg-gray-200 text-gray-600'}`}>{hostCompanyCasesCount}</span>
            {hasHostCompanyNotification && (
              <span className="absolute top-2 right-4 flex h-3 w-3" title="New updates available">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-bold text-gray-600 mb-1">検索</label>
          <div className="relative">
            <input type="text" placeholder="Search 案件ID, スタッフ名..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-xs font-bold text-gray-600 mb-1">ステータス</label>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
              <option value="すべてのステータス">すべてのステータス</option>
              {['新た', '拒否', '修正依頼', '再提出済み'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-xs font-bold text-gray-600 mb-1">経費の種類</label>
          <div className="relative">
            <select value={expenseTypeFilter} onChange={e => setExpenseTypeFilter(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
              <option value="すべての種類">すべての種類</option>
              {sortExpenseTypes(expenseTypeOptions).map(opt => (
                <option key={opt._id || opt.value} value={opt.value}>{toJP(opt.label)}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:w-36">
            <label className="block text-xs font-bold text-gray-600 mb-1">開始日</label>
            <input type="date" value={dateFilterStart} onChange={e => setDateFilterStart(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
          </div>
          <div className="w-full sm:w-36">
            <label className="block text-xs font-bold text-gray-600 mb-1">終了日</label>
            <input type="date" value={dateFilterEnd} onChange={e => setDateFilterEnd(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
          </div>
        </div>
        {(searchQuery || dateFilterStart || dateFilterEnd || statusFilter !== 'すべてのステータス' || expenseTypeFilter !== 'すべての種類') && (
          <button onClick={() => { setSearchQuery(''); setDateFilterStart(''); setDateFilterEnd(''); setStatusFilter('すべてのステータス'); setExpenseTypeFilter('すべての種類'); }} className="w-full sm:w-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-200 transition-colors whitespace-nowrap h-[38px]">
            クリア
          </button>
        )}
      </div>

      {/* Data Table — Mobile cards */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg py-8 text-center text-gray-500 text-sm">読み込み中...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg py-8 text-center text-gray-500 text-sm">案件が見つかりません.</div>
        ) : (
          filteredRecords.map(c => (
            <div key={c._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono text-gray-500">{c.displayId}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  c.displayStatus === '修正依頼' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  c.displayStatus === '拒否' ? 'bg-red-100 text-red-700 border-red-200' :
                  c.displayStatus === '新た' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  c.displayStatus === '再提出済み' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}>{c.displayStatus}</span>
              </div>
              <div className="font-bold text-gray-800 text-sm mb-0.5">{c.displayName}</div>
              <div className="text-xs text-gray-500 mb-2">{toJP(c.expense_type)}</div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400">{c.displayDate}</span>
                <span className="font-bold text-gray-800 text-sm">{c.currencySymbol}{c.displayTotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                <div className="relative inline-block">
                  <button onClick={() => handleViewDetails(c)} className="text-[#162D50] font-bold hover:underline text-sm">
                    View Details
                  </button>
                  {user.role === 'support' && (c.hasSupportNotification || (c.messages && c.messages.some(m => !m.readBySupport))) && (
                    <span className="absolute -top-1 -right-3 flex h-3 w-3" title="New update from 経理部門">
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
                  <button onClick={(e) => handleDelete(e, c)} className="text-red-500 font-bold hover:underline text-sm">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Data Table — Desktop */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-md overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-gray-200 text-xs font-bold text-gray-600">
              <th className="py-3 px-6">案件ID</th>
              <th className="py-3 px-6">日付</th>
              <th className="py-3 px-6">スタッフ名</th>
              <th className="py-3 px-6">経費の種類</th>
              <th className="py-3 px-6">合計金額</th>
              <th className="py-3 px-6">ステータス</th>
              <th className="py-3 px-6">アクション</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-4 px-6 text-center text-gray-500">読み込み中...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-4 px-6 text-center text-gray-500">案件が見つかりません.</td>
              </tr>
            ) : (
              filteredRecords.map(c => (
                <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#162D50]">{c.displayId}</span>
                      {activeTab === 'All' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${
                          c.type === 'Staff Case' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          c.type === 'Host Company Case' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {c.type === 'Staff Case' ? 'スタッフ' : c.type === 'Host Company Case' ? 'ホスト会社' : 'オフィス'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {c.displayDate}
                  </td>
                  <td className="py-4 px-6 text-gray-800">{c.displayName}</td>
                  <td className="py-4 px-6 text-gray-600">{toJP(c.expense_type)}</td>
                  <td className="py-4 px-6 font-bold text-gray-800">
                    {c.currencySymbol}{c.displayTotal.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      c.displayStatus === '修正依頼' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      c.displayStatus === '拒否' ? 'bg-red-100 text-red-700 border-red-200' :
                      c.displayStatus === '新た' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      c.displayStatus === '再提出済み' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {c.displayStatus}
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
                            <span className="absolute -top-1 -right-3 flex h-3 w-3" title="New update from 経理部門">
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
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white rounded-t-md">
            <h3 className="text-[#162D50] text-lg font-bold">案件詳細プレビュー</h3>
            <div className="flex items-center flex-wrap gap-2">
              {selectedCase.missingReceipt && (
                <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium border border-red-200">領収書不足</span>
              )}
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="text-gray-600 font-bold text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} className="bg-[#0A192F] text-white font-bold text-sm px-4 py-2 rounded-md hover:bg-[#162D50] transition-colors">
                    再提出
                  </button>
                </>
              ) : (
                <button onClick={handleEditClick} className="flex items-center text-[#162D50] font-bold text-sm px-4 py-2 border border-[#162D50] rounded-md hover:bg-gray-50 transition-colors">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
              <button 
                onClick={() => setSelectedCase(null)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors ml-1 cursor-pointer" 
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 bg-white">
            {/* CASE INFORMATION */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">案件情報</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">案件ID</span>
                  <span className="font-bold text-gray-800">{selectedCase.displayId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">スタッフ名</span>
                  <span className="font-bold text-gray-800">{selectedCase.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">日付</span>
                  <span className="font-bold text-gray-800">{selectedCase.displayDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">経費の種類</span>
                  {isEditing ? (
                    <select
                      value={normalizeOptionValue(expenseTypeOptions, editData.expense_type)}
                      onChange={(e) => setEditData({...editData, expense_type: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-800"
                    >
                      {expenseTypeOptions.map(opt => (
                        <option key={opt._id || opt.value} value={opt.value}>{toJP(opt.label)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`font-bold ${selectedCase.supportUpdatedFields?.includes('expense_type') ? 'text-blue-600' : 'text-gray-800'}`}>
                      {toJP(selectedCase.expense_type)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">合計金額</span>
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
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">決済の内訳</h4>
              <div className="bg-[#E9ECEF] rounded-md p-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">前払者への決済</span>
                  <span className="font-bold text-gray-800">{selectedCase.currencySymbol}{selectedCase.displayTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-4 pb-4 border-b border-gray-300 items-center">
                  <span className="text-gray-500">方法</span>
                  {isEditing ? (
                    <input 
                      type="text"
                      value={editData.settlement_method || ''}
                      onChange={(e) => setEditData({...editData, settlement_method: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 w-32 text-right"
                    />
                  ) : (
                    <span className={`${selectedCase.supportUpdatedFields?.includes('settlement_method') ? 'text-blue-600 font-bold' : 'text-gray-800'}`}>
                      {toJP(selectedCase.settlement_method) || '銀行振込'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Recovery Method:</div>
                  {isEditing ? (
                    (() => {
                      const paymentType = selectedCase.payment_process_types || selectedCase.payment_process_type || selectedCase.advancerName || '';
                      const advancer = selectedCase.advancer_category || selectedCase.advancerCategory || '';
                      const bearer = selectedCase.bearing_party || selectedCase.bearingParty || '';
                      const available = getAvailableCollectionMethods(paymentType, advancer, bearer);
                      return available.length > 0 ? (
                        <div className="relative">
                          <select 
                            value={editData.collection_method || ''}
                            onChange={(e) => setEditData({...editData, collection_method: e.target.value})}
                            className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 w-full appearance-none bg-white pr-7"
                          >
                            <option value="">回収方法を選択</option>
                            {available.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      ) : (
                        <input 
                          type="text"
                          value={editData.collection_method || ''}
                          onChange={(e) => setEditData({...editData, collection_method: e.target.value})}
                          className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 w-full"
                        />
                      );
                    })()
                  ) : (
                    <div className={`${selectedCase.supportUpdatedFields?.includes('collection_method') ? 'text-blue-600 font-bold' : 'text-gray-800'}`}>
                      {toJP(selectedCase.collection_method) || '会社経費（VC負担）'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ATTACHMENTS */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">添付ファイル</h4>
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative flex flex-col items-center justify-center">
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                      <FileText className="w-6 h-6 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">ファイルをドラッグ＆ドロップするか、クリックしてアップロード</p>
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

            {/* STATUS MESSAGE & SHORT NOTE / REASON */}
            <div className="md:col-span-3 mt-4 border-t border-gray-200 pt-6">
              {isEditing && (
                <div className="mb-6 w-full md:w-2/3">
                  <h4 className="text-xs font-bold text-gray-500 mb-2 tracking-wider">短いメモを追加</h4>
                  <textarea 
                    value={editData.short_note || ''} 
                    onChange={(e) => setEditData({...editData, short_note: e.target.value})}
                    placeholder="Enter an optional note or remark to attach to this case..." 
                    className="w-full h-[80px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] resize-none text-gray-600"
                  ></textarea>
                </div>
              )}

              <div className="w-full">
                {(() => {
                  const allMessages = [...(selectedCase.messages || [])];
                  if (selectedCase.statusMessage && !allMessages.some(m => m.text === selectedCase.statusMessage)) {
                    allMessages.unshift({
                      text: selectedCase.statusMessage,
                      author: 'account_user',
                      date: selectedCase.updatedAt || selectedCase.createdAt
                    });
                  }
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#162D50]" />
                          <h4 className="text-xs font-bold text-gray-700 tracking-wider">
                            理由 / メッセージ履歴（経理部門 ↔ サポート部門）
                          </h4>
                        </div>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                          {allMessages.length} 件
                        </span>
                      </div>

                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        {/* Legend bar */}
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-5 text-xs font-medium text-gray-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
                              経理部門
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                              サポート部門
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#162D50] inline-block" />
                              管理者
                            </span>
                          </div>
                        </div>

                        {/* Chat thread */}
                        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-[#F9FAFB]">
                          {allMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-1">
                              <MessageSquare className="w-8 h-8 text-gray-300 mb-1" />
                              <span>メッセージはまだありません</span>
                              <span className="text-xs text-gray-400">経理部門とサポート部門の連絡や確認事項を送信できます</span>
                            </div>
                          )}
                          {[...allMessages]
                            .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
                            .map((m, i) => {
                              const authorLower = String(m.author || '').toLowerCase();
                              const isSupport = authorLower === 'support_user' || authorLower.includes('support') || authorLower === 'サポート部門';
                              const isAdmin = authorLower === 'admin' || authorLower === '管理者';
                              const isAccount = !isSupport && !isAdmin;

                              const isMe = (user.role === 'support' && isSupport) ||
                                           (user.role === 'account' && isAccount) ||
                                           (user.role === 'admin' && (isAdmin || m.author === user.username));

                              const authorLabel = isSupport 
                                ? (isMe ? 'サポート部門 (あなた)' : 'サポート部門')
                                : isAdmin 
                                  ? (isMe ? '管理者 (あなた)' : '管理者')
                                  : (isMe ? '経理部門 (あなた)' : '経理部門');

                              return (
                                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-sm transition-all ${
                                    isMe 
                                      ? (isSupport ? 'bg-blue-600 text-white rounded-tr-sm' : isAdmin ? 'bg-[#162D50] text-white rounded-tr-sm' : 'bg-orange-500 text-white rounded-tr-sm')
                                      : (isSupport 
                                          ? 'bg-blue-50 border border-blue-200 text-blue-950 rounded-tl-sm'
                                          : isAdmin
                                            ? 'bg-slate-100 border border-slate-300 text-slate-900 rounded-tl-sm'
                                            : 'bg-orange-50 border border-orange-200 text-orange-950 rounded-tl-sm')
                                  }`}>
                                    <div className="flex items-center justify-between gap-3 mb-1">
                                      <span className={`text-[11px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded ${
                                        isMe 
                                          ? 'bg-white/20 text-white' 
                                          : isSupport
                                            ? 'bg-blue-200/60 text-blue-800'
                                            : isAdmin
                                              ? 'bg-slate-200 text-slate-800'
                                              : 'bg-orange-200/60 text-orange-800'
                                      }`}>
                                        {authorLabel}
                                      </span>
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                      {m.text}
                                    </div>
                                    <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                                      {m.date ? new Date(m.date).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="border-t border-gray-200 p-3 bg-gray-50 flex gap-2 items-end">
                          <textarea
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder={
                              user.role === 'support' 
                                ? '経理部門へのメッセージを入力… (Shift+Enter で改行)' 
                                : user.role === 'account' 
                                  ? 'サポート部門へのメッセージを入力… (Shift+Enter で改行)' 
                                  : 'メッセージを入力… (Shift+Enter で改行)'
                            }
                            rows={1}
                            className="flex-1 resize-none min-h-[38px] max-h-[100px] px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] bg-white text-gray-800"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isSendingMsg}
                            className="shrink-0 flex items-center gap-1.5 bg-[#162D50] hover:bg-[#0f1f3d] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {isSendingMsg ? '…' : '送信'}
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* アクション Buttons */}
          <div className="p-4 border-t border-gray-200 flex flex-wrap justify-end items-center gap-3 bg-gray-50 rounded-b-md">
            {user.role !== 'support' && (
              <>
                {(selectedCase.status === '拒否' || selectedCase.status === 'REJECTED' || selectedCase.status === '保留中 Correction' || selectedCase.status === 'RETURNED_FOR_CORRECTION') && (
                  <button 
                    onClick={() => handleUpdateStatus('保留中')}
                    className="text-blue-600 font-medium px-4 hover:underline mr-auto"
                  >
                    保留中に戻す
                  </button>
                )}
                <button
                  onClick={() => openActionModal('REJECTED')}
                  className="text-red-500 font-medium px-4 hover:underline"
                >
                  拒否
                </button>
                <button
                  onClick={() => openActionModal('RETURNED_FOR_CORRECTION')}
                  className="border border-gray-300 bg-white text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50"
                >
                  修正依頼
                </button>
                <button 
                  onClick={async () => {
                    const targetTab = getCaseTargetTab(selectedCase);
                    try {
                      sessionStorage.setItem('activePaymentTab', targetTab);
                    } catch (_) {}
                    await handleUpdateStatus('APPROVED_FOR_PAYMENT');
                    toast.success('支払承認を完了しました');
                    if (typeof onNavigate === 'function') {
                      onNavigate('Paid Status');
                    }
                  }}
                  className="bg-[#0A192F] text-white px-6 py-2 rounded-md font-bold hover:bg-[#162D50] shadow-sm"
                >
                  支払承認
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 拒否 / 修正依頼 Comment Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setActionModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className={`text-base font-bold mb-1 ${actionModal.type === 'REJECTED' ? 'text-red-600' : 'text-orange-600'}`}>
              {actionModal.type === 'REJECTED' ? '拒否の確認' : '修正依頼の確認'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {actionModal.type === 'REJECTED'
                ? `案件 ${selectedCase?.displayId} を拒否します。理由をご入力ください（任意）。`
                : `案件 ${selectedCase?.displayId} に修正を依頼します。コメントをご入力ください（任意）。`}
            </p>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              コメント / 理由
            </label>
            <textarea
              autoFocus
              value={actionModal.comment}
              onChange={e => setActionModal(prev => ({ ...prev, comment: e.target.value }))}
              placeholder={actionModal.type === 'REJECTED' ? '拒否の理由を入力...' : '修正が必要な内容を入力...'}
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162D50] text-sm resize-y mb-5"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={submitActionModal}
                className={`px-5 py-2 text-sm font-bold text-white rounded-md ${actionModal.type === 'REJECTED' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {actionModal.type === 'REJECTED' ? '拒否する' : '修正依頼を送る'}
              </button>
            </div>
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
