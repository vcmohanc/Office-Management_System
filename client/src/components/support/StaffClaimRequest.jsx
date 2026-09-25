import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Plus, Trash2, CheckCircle, ChevronDown, User, Box, Image, X, Download } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';
import { fileUrl } from '../../utils/fileUrl.js';
import { validateExpenseAmount } from '../../utils/amountHelper.js';
import toast from 'react-hot-toast';


export default function StaffClaimRequest() {
  const [options, setOptions] = useState({
    拠点: [],
    ExpenseType: [],
    AdvancerCategory: [],
    BearingParty: []
  });

  const [staffInfo, setStaffInfo] = useState({
    fullName: '',
    id: '',
    location: '',
    branchAndFarmName: '',
    visaステータス: '',
    visaAvailableTime: ''
  });
  const [employees, setEmployees] = useState([]);
  const [regions, setRegions] = useState([]);
  const [postalMatrix, setPostalMatrix] = useState({});
  const [travelMatrix, setTravelMatrix] = useState({});

  const initialClaim = {
    expenseType: '',
    advancerCategory: '',
    advancerName: '',
    bearingParty: '',
    expense金額: '',
    suggested金額: 0,
    expensePeriodStart: '',
    expensePeriodEnd: '',
    remark: '',
    receipts: []
  };

  const [currency, setCurrency] = useState('JPY');
  const [previousUnsettledBalance, setPreviousUnsettledBalance] = useState(0);
  const [includeBalance, setIncludeBalance] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [claims, setClaims] = useState([{ ...initialClaim }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileClick = (e, fileUrlStr) => {
    const baseUrl = fileUrlStr.split('?')[0];
    if (baseUrl.match(/\.(jpeg|jpg|gif|png|webp|pdf)$/i)) {
      e.preventDefault();
      setPreviewImage(fileUrlStr);
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await apiFetch('/api/options');
        const data = await response.json();
        
        const groupedOptions = data.reduce((acc, opt) => {
          if (!acc[opt.type]) acc[opt.type] = [];
          acc[opt.type].push(opt);
          return acc;
        }, { 拠点: [], ExpenseType: [], AdvancerCategory: [], BearingParty: [] });

        setOptions(groupedOptions);

        const empResponse = await apiFetch('/api/employees');
        const empData = await empResponse.json();
        setEmployees(empData);

        const regionsResponse = await apiFetch('/api/regions');
        const regionsData = await regionsResponse.json();
        setRegions(regionsData);

        const postalResponse = await apiFetch('/api/expenses/postal');
        const postalData = await postalResponse.json();
        setPostalMatrix(postalData);

        const travelResponse = await apiFetch('/api/expenses/travel');
        const travelData = await travelResponse.json();
        setTravelMatrix(travelData);
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };
    fetchOptions();
  }, []);

  const updateClaim = (index, field, value) => {
    const updatedClaims = [...claims];
    updatedClaims[index][field] = value;

    if (field === 'expenseType') {
      switch (value) {
        case 'Postage':
        case 'Transportation Expenses / Flight Fare':
          updatedClaims[index].advancerCategory = 'Service staff';
          updatedClaims[index].bearingParty = 'VC';
          updatedClaims[index].advancerName = 'Transfer to the person concerned';
          break;
        case 'Visa application fee':
          updatedClaims[index].advancerCategory = 'Service staff';
          updatedClaims[index].bearingParty = 'VC';
          updatedClaims[index].advancerName = 'Salary deduction';
          break;
        case 'Waiting Dormitory Fee':
        case 'Hospital Fee':
          updatedClaims[index].advancerCategory = 'Service staff';
          updatedClaims[index].bearingParty = 'Service staff';
          updatedClaims[index].advancerName = 'Salary deduction';
          break;
        case 'Equipment/Supplies':
        case 'others':
          updatedClaims[index].advancerCategory = 'Select for each project';
          updatedClaims[index].bearingParty = 'Select for each project';
          updatedClaims[index].advancerName = '';
          break;
        case 'WIFI':
          updatedClaims[index].advancerCategory = 'Dispatch destination: Farm';
          updatedClaims[index].bearingParty = 'Dispatch destination: Farm';
          updatedClaims[index].advancerName = 'Invoice from the client company';
          break;
      }
    }

    const currentExpenseType = field === 'expenseType' ? value : updatedClaims[index].expenseType;

    if (currentExpenseType === 'Postage' && (field === 'postageFrom' || field === 'postageTo' || field === 'expenseType')) {
      const senderName = field === 'postageFrom' ? value : updatedClaims[index].postageFrom;
      const recipientName = field === 'postageTo' ? value : updatedClaims[index].postageTo;
      if (senderName && recipientName) {
        const senderId = regions.find(r => r.name1 === senderName)?._id;
        const recipientId = regions.find(r => r.name2 === recipientName)?._id;
        if (senderId && recipientId && postalMatrix[senderId] && postalMatrix[senderId][recipientId]) {
          const rawCost = postalMatrix[senderId][recipientId];
          const numericCost = typeof rawCost === 'string' ? Number(rawCost.replace(/,/g, '')) : rawCost;
          updatedClaims[index].suggested金額 = numericCost || 0;
        } else {
          updatedClaims[index].suggested金額 = 0;
        }
      } else {
        updatedClaims[index].suggested金額 = 0;
      }
    }

    if (currentExpenseType === 'Transportation Expenses / Flight Fare' && (field === 'departure' || field === 'destination' || field === 'expenseType' || field === 'transportMethod')) {
      const departureName = field === 'departure' ? value : updatedClaims[index].departure;
      const destinationName = field === 'destination' ? value : updatedClaims[index].destination;
      const method = field === 'transportMethod' ? value : updatedClaims[index].transportMethod;
      if (departureName && destinationName) {
        const departureId = regions.find(r => r.name1 === departureName)?._id;
        const destinationId = regions.find(r => r.name2 === destinationName)?._id;
        if (departureId && destinationId && travelMatrix[departureId] && travelMatrix[departureId][destinationId]) {
          const rawCost = travelMatrix[departureId][destinationId];
          let numericCost = 0;
          if (typeof rawCost === 'string' || typeof rawCost === 'number') {
            numericCost = typeof rawCost === 'string' ? Number(String(rawCost).replace(/,/g, '')) : Number(rawCost);
          } else if (rawCost && typeof rawCost === 'object') {
            const busCost = rawCost.bus ? Number(String(rawCost.bus).replace(/,/g, '')) : 0;
            const flightCost = rawCost.flight ? Number(String(rawCost.flight).replace(/,/g, '')) : 0;
            if (method === 'Bus') numericCost = busCost;
            else if (method === 'Flight') numericCost = flightCost;
            else numericCost = Math.max(busCost, flightCost);
          }
          updatedClaims[index].suggested金額 = numericCost || 0;
        } else {
          updatedClaims[index].suggested金額 = 0;
        }
      } else {
        updatedClaims[index].suggested金額 = 0;
      }
    }

    setClaims(updatedClaims);
  };

  const handleAddAnotherClaim = () => {
    setClaims([...claims, { ...initialClaim }]);
  };

  const removeClaim = (index) => {
    if (claims.length === 1) return;
    const updatedClaims = claims.filter((_, i) => i !== index);
    setClaims(updatedClaims);
  };

  const handleFileUpload = async (index, e) => {
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
        const updatedClaims = [...claims];
        updatedClaims[index].receipts = [...updatedClaims[index].receipts, ...data.fileNames];
        setClaims(updatedClaims);
      } else {
        console.error('Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const removeFile = (claimIndex, fileIndex) => {
    const updatedClaims = [...claims];
    updatedClaims[claimIndex].receipts = updatedClaims[claimIndex].receipts.filter((_, i) => i !== fileIndex);
    setClaims(updatedClaims);
  };

  const renderDynamicFields = (expenseType, index, claimItem) => {
    switch (expenseType) {
      case 'Postage':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">出発地</label>
              <input type="text" list={`from-list-${index}`} value={claimItem.postageFrom || ''} onChange={(e) => updateClaim(index, 'postageFrom', e.target.value)} placeholder="Enter sender details" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`from-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name1} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">到着地</label>
              <input type="text" list={`to-list-${index}`} value={claimItem.postageTo || ''} onChange={(e) => updateClaim(index, 'postageTo', e.target.value)} placeholder="Enter recipient details" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`to-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name2} />
                ))}
              </datalist>
            </div>
          </div>
        );
      case 'Transportation Expenses / Flight Fare':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">出発拠点</label>
              <input type="text" list={`departure-list-${index}`} value={claimItem.departure || ''} onChange={(e) => updateClaim(index, 'departure', e.target.value)} placeholder="Enter departure" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`departure-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name1} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">目的地</label>
              <input type="text" list={`destination-list-${index}`} value={claimItem.destination || ''} onChange={(e) => updateClaim(index, 'destination', e.target.value)} placeholder="Enter destination" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`destination-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name2} />
                ))}
              </datalist>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">交通手段</label>
              <select value={claimItem.transportMethod || ''} onChange={(e) => updateClaim(index, 'transportMethod', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]">
                <option value="">Select method...</option>
                <option value="Bus">Bus</option>
                <option value="Flight">Flight</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">理由</label>
              <textarea value={claimItem.transportReason || ''} onChange={(e) => updateClaim(index, 'transportReason', e.target.value)} placeholder="Enter reason for travel" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"></textarea>
            </div>
          </div>
        );
      case 'Waiting Dormitory Fee':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用開始日</label>
              <div className="relative">
                <input type="date" value={claimItem.dormitoryStartDate || ''} onChange={(e) => updateClaim(index, 'dormitoryStartDate', e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用終了日</label>
              <div className="relative">
                <input type="date" value={claimItem.dormitoryEndDate || ''} onChange={(e) => updateClaim(index, 'dormitoryEndDate', e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
          </div>
        );
      case 'Hospital Fee':
        return (
          <div className="grid grid-cols-3 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">診察日</label>
              <div className="relative">
                <input type="date" value={claimItem.consultationDate || ''} onChange={(e) => updateClaim(index, 'consultationDate', e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">診察代</label>
              <input type="number" value={claimItem.consultationFee || 0} onChange={(e) => updateClaim(index, 'consultationFee', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">薬代</label>
              <input type="number" value={claimItem.medicineCost || 0} onChange={(e) => updateClaim(index, 'medicineCost', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
          </div>
        );
      case 'Equipment/Supplies':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">品名</label>
              <input type="text" value={claimItem.itemName || ''} onChange={(e) => updateClaim(index, 'itemName', e.target.value)} placeholder="Enter item" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">数量</label>
              <input type="number" value={claimItem.quantity || 1} onChange={(e) => updateClaim(index, 'quantity', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">購入日</label>
              <div className="relative">
                <input type="date" value={claimItem.purchaseDate || ''} onChange={(e) => updateClaim(index, 'purchaseDate', e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">破損、故障、不足などの理由</label>
              <textarea value={claimItem.damageReason || ''} onChange={(e) => updateClaim(index, 'damageReason', e.target.value)} placeholder="Enter reason" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"></textarea>
            </div>
          </div>
        );
      case 'WIFI':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">対象の受入企業/農園</label>
              <input type="text" value={claimItem.hostCompany || ''} onChange={(e) => updateClaim(index, 'hostCompany', e.target.value)} placeholder="Enter company/farm" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用開始日</label>
              <div className="relative">
                <input type="date" value={claimItem.wifiStartDate || ''} onChange={(e) => updateClaim(index, 'wifiStartDate', e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const totalExpense金額 = claims.reduce((sum, claim) => {
    const amt = parseFloat(claim.expense金額);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validate
      if (!staffInfo.fullName || !staffInfo.id || !staffInfo.location) {
        toast.error('必要なスタッフ情報をすべて入力してください。');
        setIsSubmitting(false);
        return;
      }

      for (let i = 0; i < claims.length; i++) {
        const c = claims[i];
        if (!c.expenseType || !c.advancerCategory || !c.bearingParty || !c.expense金額) {
          toast.error(`案件カテゴリ #${i + 1} の必要なフィールドをすべて入力してください。`);
          setIsSubmitting(false);
          return;
        }
        const validation = validateExpenseAmount(c.expense金額, c.suggested金額);
        if (!validation.isValid) {
          toast.error(`Row ${i + 1}: ${validation.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Submit all claims
      for (const claim of claims) {
        const payload = {
          full_name: staffInfo.fullName,
          staff_id: staffInfo.id,
          location: staffInfo.location,
          branch_farm_name: staffInfo.branchAndFarmName || null,
          visa_status: staffInfo.visaステータス || null,
          visa_available_time: staffInfo.visaAvailableTime || null,
          
          expense_type: claim.expenseType,
          advancer_category: claim.advancerCategory,
          payment_process_types: claim.advancerName || null,
          bearing_party: claim.bearingParty,
          expense_amount: parseFloat(claim.expense金額) || 0,
          sender: claim.postageFrom || claim.sender || "",
          recipient: claim.postageTo || claim.recipient || "",
          departure: claim.departure || "",
          destination: claim.destination || "",
          transport_method: claim.transportMethod || "",
          expense_period_start: claim.expensePeriodStart || null,
          expense_period_end: claim.expensePeriodEnd || null,
          bill_receipt_url: claim.receipts || [],
          remarks: claim.remark || null,

          total_expense_amount: parseFloat(claim.expense金額) || 0,
          installment_count: 1,
          collection_start_month: new Date().toISOString().slice(0, 7),
          monthly_deduction: parseFloat(claim.expense金額) || 0
        };
        const response = await apiFetch('/api/claims', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to submit claim');
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setClaims([{ ...initialClaim }]);
        setStaffInfo({ fullName: '', id: '', location: '' });
      }, 3000);

    } catch (error) {
      console.error('Error submitting claims:', error);
      toast.error('An error occurred while submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-green-100 p-4 rounded-full mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">送信が完了しました！</h2>
        <p className="text-gray-500 mb-6">Your expense claims have been submitted.</p>
        <button 
          onClick={() => setShowSuccess(false)}
          className="bg-[#0A192F] text-white px-6 py-2 rounded-md hover:bg-[#162D50] transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10 mt-8">
      
      {/* Staff Information Section */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="p-6">
          <div className="flex items-center text-[#162D50] font-bold mb-4">
            <User className="w-4 h-4 mr-2" />
            Staff Information
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">氏名 <span className="text-red-500">*</span></label>
              <input type="text" placeholder="フルネームを入力" list="claimEmployeeNames" value={staffInfo.fullName} onChange={e => {
                const val = e.target.value;
                setStaffInfo({...staffInfo, fullName: val});
                const match = employees.find(emp => (emp.romajiName && emp.romajiName.toLowerCase() === val.toLowerCase()) || (emp.katakanaName && emp.katakanaName === val));
                if (match) {
                  setStaffInfo({...staffInfo, 
                    fullName: val, 
                    id: 'ID-' + match._id.slice(-6).toUpperCase(), 
                    location: match.location || staffInfo.location,
                    branchAndFarmName: match.branchAndFarmName || match.location || '',
                    visaステータス: match.visaステータス || '',
                    visaAvailableTime: match.visaEndDate ? new Date(match.visaEndDate).toISOString().split('T')[0] : ''
                  });
                }
              }} onBlur={() => {
                if (staffInfo.fullName) {
                  const match = employees.find(emp => (emp.romajiName && emp.romajiName.toLowerCase() === staffInfo.fullName.toLowerCase()) || (emp.katakanaName && emp.katakanaName === staffInfo.fullName));
                  if (!match) {
                    setStaffInfo({...staffInfo, fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: ''});
                    toast.error('リストから有効なスタッフを選択してください。');
                  }
                }
              }} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id="claimEmployeeNames">
                {employees.map(emp => (
                  <option key={emp._id} value={emp.romajiName || emp.katakanaName} />
                ))}
              </datalist>
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">スタッフID <span className="text-red-500">*</span></label>
              <input type="text" placeholder="ID-00000" list="claimEmployeeIds" value={staffInfo.id} onChange={e => {
                const val = e.target.value;
                setStaffInfo({...staffInfo, id: val});
                const searchId = val.replace('ID-', '').toLowerCase();
                const match = employees.find(emp => emp._id.slice(-6) === searchId);
                if (match) {
                  setStaffInfo({...staffInfo, 
                    id: val, 
                    fullName: match.romajiName || match.katakanaName || staffInfo.fullName, 
                    location: match.location || staffInfo.location,
                    branchAndFarmName: match.branchAndFarmName || match.location || '',
                    visaステータス: match.visaステータス || '',
                    visaAvailableTime: match.visaEndDate ? new Date(match.visaEndDate).toISOString().split('T')[0] : ''
                  });
                }
              }} onBlur={() => {
                if (staffInfo.id) {
                  const searchId = staffInfo.id.replace('ID-', '').toLowerCase();
                  const match = employees.find(emp => emp._id.slice(-6) === searchId);
                  if (!match) {
                    setStaffInfo({...staffInfo, fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: ''});
                    toast.error('リストから有効なスタッフIDを選択してください。');
                  }
                }
              }} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id="claimEmployeeIds">
                {employees.map(emp => (
                  <option key={emp._id} value={'ID-' + emp._id.slice(-6).toUpperCase()} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">拠点 <span className="text-red-500">*</span></label>
              <div className="relative">
                <select value={staffInfo.location} onChange={e => setStaffInfo({...staffInfo, location: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="">拠点を選択</option>
                  {options.拠点.map((opt) => (
                    <option key={opt._id} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">支店および農園名</label>
              <input type="text" placeholder="支店/農園" value={staffInfo.branchAndFarmName} onChange={e => setStaffInfo({...staffInfo, branchAndFarmName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ビザステータス</label>
              <input type="text" placeholder="ビザステータス" value={staffInfo.visaステータス} onChange={e => setStaffInfo({...staffInfo, visaステータス: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ビザ有効期限</label>
              <input type="date" value={staffInfo.visaAvailableTime} onChange={e => setStaffInfo({...staffInfo, visaAvailableTime: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Case Category Section */}
      {claims.map((claimItem, index) => (
      <div key={index} className="bg-white border border-gray-200 rounded-md mb-6 shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-[#162D50] font-bold">
              <Box className="w-4 h-4 mr-2" />
              案件カテゴリ {claims.length > 1 && `#${index + 1}`}
            </div>
            {claims.length > 1 && (
              <button 
                onClick={() => removeClaim(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center transition-colors">
                <Trash2 className="w-4 h-4 mr-1" /> カテゴリを削除
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">経費の種類 <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={claimItem.expenseType}
                  onChange={(e) => updateClaim(index, 'expenseType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="">種類を選択</option>
                  {options.ExpenseType.map((opt) => (
                    <option key={opt._id} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Advancer Category <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={claimItem.advancerCategory}
                  onChange={(e) => updateClaim(index, 'advancerCategory', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="">Select Category</option>
                  {options.AdvancerCategory.map((opt) => (
                    <option key={opt._id} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Payment Process Types <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="Enter name" 
                value={claimItem.advancerName}
                onChange={(e) => updateClaim(index, 'advancerName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bearing Party <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={claimItem.bearingParty}
                  onChange={(e) => updateClaim(index, 'bearingParty', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="">Select Bearing Party</option>
                  {options.BearingParty.map((opt) => (
                    <option key={opt._id} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Expense 金額 (¥) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                value={claimItem.expense金額} 
                onChange={(e) => updateClaim(index, 'expense金額', e.target.value)} 
                placeholder="Enter amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-900 font-medium" 
              />
              {(() => {
                const validation = validateExpenseAmount(claimItem.expense金額, claimItem.suggested金額);
                if (!validation.isValid) {
                  return (
                    <div 
                      onClick={() => updateClaim(index, 'expense金額', claimItem.suggested金額)}
                      className="mt-2 text-xs text-red-600 font-medium flex items-center bg-red-50 px-3 py-1.5 rounded border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                      {validation.message} (クリックして適用)
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">経費期間</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input type="date" value={claimItem.expensePeriodStart || ''} onChange={(e) => updateClaim(index, 'expensePeriodStart', e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                </div>
                <span className="text-gray-500">-</span>
                <div className="relative flex-1">
                  <input type="date" value={claimItem.expensePeriodEnd || ''} onChange={(e) => updateClaim(index, 'expensePeriodEnd', e.target.value)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-tight">注：請求は通常、月の11日から27日までの経費に対して処理されます。</p>
            </div>
          </div>

          {renderDynamicFields(claimItem.expenseType, index, claimItem)}

          {/* Bill/Receipt Upload and Remark for this case */}
          <div className="border-t border-gray-200 mt-6 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bill / Receipt Upload</label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative flex flex-col items-center justify-center min-h-[120px]">
                  <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(index, e)} />
                  <FileText className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Drag and drop files or click to upload</p>
                </div>
                {claimItem.receipts && claimItem.receipts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {claimItem.receipts.map((file, i) => (
                      <div key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center">
                        <FileText className="w-3 h-3 mr-1" /> 
                        <a href={fileUrl(file)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => handleFileClick(e, fileUrl(file))}>
                          {typeof file === 'string' ? file.split('-').slice(1).join('-') : file.name}
                        </a>
                        <button onClick={() => removeFile(index, i)} className="ml-2 text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">備考</label>
                <textarea 
                  value={claimItem.remark || ''} 
                  onChange={(e) => updateClaim(index, 'remark', e.target.value)}
                  placeholder="この案件に関する追加の詳細や備考を入力してください..." 
                  className="w-full h-[120px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] resize-none text-gray-600"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
      ))}

      {/* Summary Box & Add Case */}
      <div className="bg-white border border-gray-200 rounded-md mb-8 shadow-sm">
        <div className="p-6">
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-6 flex justify-between items-center mb-6">
            <div>
              <div className="font-bold text-sm text-gray-800 mb-1">Multiple Case Summary</div>
              <div className="text-xs text-gray-500">Total calculation of all items above</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs text-gray-800 mb-1">経費合計金額</div>
              <div className="text-2xl font-bold text-[#162D50]">¥ {totalExpense金額.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button 
              onClick={handleAddAnotherClaim}
              className="flex items-center px-5 py-2 border border-[#162D50] text-[#162D50] rounded-md font-bold text-sm hover:bg-gray-50 transition-colors">
              + 別の案件を追加
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm hover:bg-[#162D50] transition-colors shadow-sm disabled:opacity-70">
              {isSubmitting ? '送信中...' : 'リクエストを送信'}
            </button>
          </div>
        </div>
      </div>


      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" onClick={() => setPreviewImage(null)}>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="text-base font-semibold text-gray-800 flex items-center">
                <Image className="w-4 h-4 mr-2 text-blue-600" />
                画像プレビュー
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
                閉じる
              </button>
              <a 
                href={previewImage} 
                download
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                画像をダウンロード
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
