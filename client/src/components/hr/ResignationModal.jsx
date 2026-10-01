import React, { useState, useEffect } from 'react';
import { X, Search, Check, AlertCircle } from 'lucide-react';

const STEPS = ['スタッフ選択', '退職情報', 'クリアランス', '退職面談', '精算・書類', '確認'];

export default function ResignationModal({ isOpen, onClose, onSave, employees }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Step 2
  const [reasonType, setReasonType] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [submitDate, setSubmitDate] = useState(new Date().toISOString().split('T')[0]);
  const [resignationDate, setResignationDate] = useState('');
  const [lastWorkingDate, setLastWorkingDate] = useState('');
  const [usePaidLeave, setUsePaidLeave] = useState(false);
  const [fireReason, setFireReason] = useState('');
  const [fireNoticeDate, setFireNoticeDate] = useState('');
  const [payFireAllowance, setPayFireAllowance] = useState(false);
  const [visaNoticeDate, setVisaNoticeDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  // Step 3
  const [clearanceSoumu, setClearanceSoumu] = useState({ idCard: false, keys: false, uniform: false });
  const [clearanceIT, setClearanceIT] = useState({ pc: false, phone: false });
  const [clearanceHR, setClearanceHR] = useState({ healthIns: false });
  const [clearanceAcct, setClearanceAcct] = useState({ expense: false, loan: false });
  const [accountStopDate, setAccountStopDate] = useState('');

  // Step 4
  const [interviewEnabled, setInterviewEnabled] = useState(true);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewPerson, setInterviewPerson] = useState('');
  const [interviewType, setInterviewType] = useState('対面');
  const [interviewUrl, setInterviewUrl] = useState('');
  const [interviewMemo, setInterviewMemo] = useState('');

  // Step 5
  const [finalPayDate, setFinalPayDate] = useState('');
  const [hasSeverance, setHasSeverance] = useState(false);
  const [severanceAmount, setSeveranceAmount] = useState('');
  const [docGensen, setDocGensen] = useState(true);
  const [docKoyou, setDocKoyou] = useState(true);
  const [docRishoku, setDocRishoku] = useState(false);
  const [docTaishoku, setDocTaishoku] = useState(false);
  const [docNenkin, setDocNenkin] = useState(false);
  const [sendAddressType, setSendAddressType] = useState('registered');
  const [otherZip, setOtherZip] = useState('');
  const [otherAddress, setOtherAddress] = useState('');

  useEffect(() => {
    if (reasonType === '会社都合' || reasonType === '解雇' || reasonType === '契約期間満了') {
      setDocRishoku(true);
    }
  }, [reasonType]);

  const selectedStaff = employees.find(e => e._id === selectedStaffId);

  if (!isOpen) return null;

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 0) {
      if (!selectedStaffId) newErrors.staff = 'スタッフを選択してください';
      // Block if already in process
      if (selectedStaff && selectedStaff.resignationStatus) {
        newErrors.staff = 'このスタッフは既に退職手続き中です';
      }
    } else if (currentStep === 1) {
      if (!reasonType) newErrors.reasonType = '退職区分は必須です';
      if (reasonType === '自己都合' && !reasonDetail) newErrors.reasonDetail = '退職理由は必須です';
      if (reasonType === 'その他' && !reasonDetail) newErrors.reasonDetail = '詳細は必須です';
      if (!submitDate) newErrors.submitDate = '退職届提出日は必須です';
      if (!resignationDate) newErrors.resignationDate = '退職日は必須です';
      if (!lastWorkingDate) newErrors.lastWorkingDate = '最終出勤日は必須です';
      
      if (submitDate && resignationDate && resignationDate < submitDate) newErrors.resignationDate = '退職日は提出日以降にしてください';
      if (resignationDate && lastWorkingDate && lastWorkingDate > resignationDate) newErrors.lastWorkingDate = '最終出勤日は退職日以前にしてください';

      if (reasonType === '解雇') {
        if (!fireReason) newErrors.fireReason = '解雇理由は必須です';
        if (!fireNoticeDate) newErrors.fireNoticeDate = '解雇予告日は必須です';
      }
      
      if (selectedStaff?.nationality && selectedStaff.nationality !== 'Japan' && selectedStaff.nationality !== '日本') {
        if (!visaNoticeDate) newErrors.visaNoticeDate = '入管届出予定日は必須です';
      }
    } else if (currentStep === 2) {
      if (!accountStopDate) newErrors.accountStopDate = 'アカウント停止日は必須です';
      if (accountStopDate && lastWorkingDate && accountStopDate < lastWorkingDate) newErrors.accountStopDate = 'アカウント停止日は最終出勤日以降にしてください';
    } else if (currentStep === 3) {
      if (interviewEnabled) {
        if (!interviewDate) newErrors.interviewDate = '面談日は必須です';
        if (!interviewTime) newErrors.interviewTime = '時間は必須です';
        if (!interviewPerson) newErrors.interviewPerson = '担当者は必須です';
        if (interviewType === 'オンライン' && !interviewUrl) newErrors.interviewUrl = '会議URLは必須です';
      }
    } else if (currentStep === 4) {
      if (!finalPayDate) newErrors.finalPayDate = '最終給与支払日は必須です';
      if (hasSeverance && (!severanceAmount || severanceAmount <= 0)) newErrors.severanceAmount = '有効な金額を入力してください';
      if (sendAddressType === 'other') {
        if (!otherZip) newErrors.otherZip = '郵便番号は必須です';
        if (!otherAddress) newErrors.otherAddress = '住所は必須です';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!window.confirm('入力内容を確認しましたか？')) return;
    
    setLoading(true);
    const data = {
      staffId: selectedStaffId,
      resignation: {
        reasonType,
        reasonDetail,
        submitDate,
        resignationDate,
        lastWorkingDate,
        usePaidLeave,
        accountStopDate,
        interviewEnabled,
        interviewDate,
        interviewTime,
        finalPayDate,
        hasSeverance,
        severanceAmount
      },
      status: 'In Progress'
    };
    
    await onSave(data, selectedStaff);
    setLoading(false);
  };

  const renderError = (field) => {
    if (!errors[field]) return null;
    return <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors[field]}</p>;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-xl shadow-2xl max-w-4xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-[#F8F9FA] sm:rounded-t-xl">
          <h2 className="text-xl font-bold text-[#162D50]">新規退職</h2>
          <button onClick={() => { if(window.confirm('入力内容が破棄されます。閉じますか？')) onClose(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-white overflow-hidden">
          <div className="flex items-center justify-between w-full">
            {STEPS.map((step, idx) => (
              <React.Fragment key={idx}>
                <div 
                  className={`flex flex-col xl:flex-row items-center cursor-pointer ${idx <= currentStep ? 'text-[#162D50]' : 'text-gray-400'} flex-shrink-0`}
                  onClick={() => { if (idx < currentStep) setCurrentStep(idx); }}
                >
                  <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-bold xl:mr-2 mb-1 xl:mb-0 transition-colors ${idx < currentStep ? 'bg-[#162D50] text-white' : idx === currentStep ? 'border-2 border-[#162D50] text-[#162D50]' : 'bg-gray-100 text-gray-400'}`}>
                    {idx < currentStep ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : idx + 1}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap hidden sm:block">{step}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 md:mx-4 ${idx < currentStep ? 'bg-[#162D50]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">スタッフ検索 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="名前またはID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#162D50]"
                  />
                </div>
              </div>

              {!selectedStaffId && (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                  {employees.filter(e => e.romajiName?.toLowerCase().includes(searchQuery.toLowerCase()) || e._id?.toLowerCase().includes(searchQuery.toLowerCase())).map(emp => (
                    <div key={emp._id} onClick={() => setSelectedStaffId(emp._id)} className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                      <div>
                        <p className="font-bold text-[#162D50]">{emp.romajiName}</p>
                        <p className="text-xs text-gray-500">#{emp._id?.slice(-6).toUpperCase()}</p>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{emp.staffType || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedStaff && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-[#162D50] mb-1">{selectedStaff.romajiName}</h3>
                    <p className="text-sm text-gray-600 mb-3">ID: #{selectedStaff._id?.slice(-6).toUpperCase()} | {selectedStaff.staffType || 'N/A'}</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
                      <p><span className="text-gray-500">部署:</span> {Array.isArray(selectedStaff.department) ? selectedStaff.department.join(', ') : selectedStaff.department || 'N/A'}</p>
                      <p><span className="text-gray-500">入社日:</span> {selectedStaff.joinDate ? new Date(selectedStaff.joinDate).toLocaleDateString() : 'N/A'}</p>
                      <p><span className="text-gray-500">在留資格/期限:</span> {selectedStaff.visaStatus || 'N/A'} / {selectedStaff.visaEndDate ? new Date(selectedStaff.visaEndDate).toLocaleDateString() : 'N/A'}</p>
                      <p><span className="text-gray-500">有給残日数:</span> {selectedStaff.paidLeaveBalance || 0}日</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStaffId('')} className="text-blue-600 text-sm hover:underline font-medium">変更</button>
                </div>
              )}
              {renderError('staff')}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">退職区分 <span className="text-red-500">*</span></label>
                  <select value={reasonType} onChange={(e) => setReasonType(e.target.value)} className={`w-full p-2 border ${errors.reasonType ? 'border-red-300' : 'border-gray-300'} rounded-md`}>
                    <option value="">選択してください</option>
                    <option value="自己都合">自己都合</option>
                    <option value="会社都合">会社都合</option>
                    <option value="契約期間満了">契約期間満了</option>
                    <option value="定年">定年</option>
                    <option value="解雇">解雇</option>
                    <option value="その他">その他</option>
                  </select>
                  {renderError('reasonType')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">詳細 <span className="text-red-500">{reasonType === '自己都合' || reasonType === 'その他' ? '*' : ''}</span></label>
                  <input type="text" value={reasonDetail} onChange={(e) => setReasonDetail(e.target.value)} className={`w-full p-2 border ${errors.reasonDetail ? 'border-red-300' : 'border-gray-300'} rounded-md`} placeholder="理由や詳細を入力..." />
                  {renderError('reasonDetail')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">退職届提出日 <span className="text-red-500">*</span></label>
                  <input type="date" value={submitDate} onChange={(e) => setSubmitDate(e.target.value)} className={`w-full p-2 border ${errors.submitDate ? 'border-red-300' : 'border-gray-300'} rounded-md`} />
                  {renderError('submitDate')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">退職日 <span className="text-red-500">*</span></label>
                  <input type="date" value={resignationDate} onChange={(e) => setResignationDate(e.target.value)} className={`w-full p-2 border ${errors.resignationDate ? 'border-red-300' : 'border-gray-300'} rounded-md`} />
                  {renderError('resignationDate')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">最終出勤日 <span className="text-red-500">*</span></label>
                  <input type="date" value={lastWorkingDate} onChange={(e) => setLastWorkingDate(e.target.value)} className={`w-full p-2 border ${errors.lastWorkingDate ? 'border-red-300' : 'border-gray-300'} rounded-md`} />
                  {renderError('lastWorkingDate')}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <input type="checkbox" id="paidleave" checked={usePaidLeave} onChange={(e) => setUsePaidLeave(e.target.checked)} className="w-4 h-4 text-[#162D50] border-gray-300 rounded focus:ring-[#162D50]" />
                <label htmlFor="paidleave" className="text-sm text-gray-700 font-medium">有給消化を行う</label>
              </div>

              {reasonType === '解雇' && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg space-y-4">
                  <p className="text-sm font-bold text-red-700">解雇情報</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">解雇理由 <span className="text-red-500">*</span></label>
                      <input type="text" value={fireReason} onChange={e => setFireReason(e.target.value)} className={`w-full p-2 border ${errors.fireReason ? 'border-red-300' : 'border-gray-300'} rounded-md text-sm`} />
                      {renderError('fireReason')}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">解雇予告日 <span className="text-red-500">*</span></label>
                      <input type="date" value={fireNoticeDate} onChange={e => setFireNoticeDate(e.target.value)} className={`w-full p-2 border ${errors.fireNoticeDate ? 'border-red-300' : 'border-gray-300'} rounded-md text-sm`} />
                      {renderError('fireNoticeDate')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="fireallowance" checked={payFireAllowance} onChange={(e) => setPayFireAllowance(e.target.checked)} className="w-4 h-4 text-red-600 rounded" />
                    <label htmlFor="fireallowance" className="text-sm text-gray-700">解雇予告手当を支払う</label>
                  </div>
                </div>
              )}

              {selectedStaff?.nationality && selectedStaff.nationality !== 'Japan' && selectedStaff.nationality !== '日本' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                  <p className="text-sm font-bold text-[#162D50]">ビザ関連処理</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">入管届出予定日 <span className="text-red-500">*</span></label>
                      <input type="date" value={visaNoticeDate} onChange={e => setVisaNoticeDate(e.target.value)} className={`w-full p-2 border ${errors.visaNoticeDate ? 'border-red-300' : 'border-gray-300'} rounded-md text-sm`} />
                      {renderError('visaNoticeDate')}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">帰国予定日 (任意)</label>
                      <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">出国予定日 (任意)</label>
                      <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">アカウント停止予定日 <span className="text-red-500">*</span></label>
                <input type="date" value={accountStopDate} onChange={(e) => setAccountStopDate(e.target.value)} className={`w-full md:w-1/3 p-2 border ${errors.accountStopDate ? 'border-red-300' : 'border-gray-300'} rounded-md`} />
                {renderError('accountStopDate')}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">クリアランス項目</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 p-4 rounded-lg">
                    <p className="font-bold text-sm text-[#162D50] mb-3">総務</p>
                    <label className="flex items-center space-x-2 mb-2 text-sm"><input type="checkbox" checked={clearanceSoumu.idCard} onChange={e=>setClearanceSoumu({...clearanceSoumu, idCard: e.target.checked})} className="rounded"/><span>社員証回収</span></label>
                    <label className="flex items-center space-x-2 mb-2 text-sm"><input type="checkbox" checked={clearanceSoumu.keys} onChange={e=>setClearanceSoumu({...clearanceSoumu, keys: e.target.checked})} className="rounded"/><span>鍵回収</span></label>
                    <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={clearanceSoumu.uniform} onChange={e=>setClearanceSoumu({...clearanceSoumu, uniform: e.target.checked})} className="rounded"/><span>制服回収</span></label>
                  </div>
                  <div className="border border-gray-200 p-4 rounded-lg">
                    <p className="font-bold text-sm text-[#162D50] mb-3">IT</p>
                    <label className="flex items-center space-x-2 mb-2 text-sm"><input type="checkbox" checked={clearanceIT.pc} onChange={e=>setClearanceIT({...clearanceIT, pc: e.target.checked})} className="rounded"/><span>PC返却</span></label>
                    <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={clearanceIT.phone} onChange={e=>setClearanceIT({...clearanceIT, phone: e.target.checked})} className="rounded"/><span>社用携帯返却</span></label>
                  </div>
                  <div className="border border-gray-200 p-4 rounded-lg">
                    <p className="font-bold text-sm text-[#162D50] mb-3">人事</p>
                    <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={clearanceHR.healthIns} onChange={e=>setClearanceHR({...clearanceHR, healthIns: e.target.checked})} className="rounded"/><span>健康保険証回収</span></label>
                  </div>
                  <div className="border border-gray-200 p-4 rounded-lg">
                    <p className="font-bold text-sm text-[#162D50] mb-3">経理</p>
                    <label className="flex items-center space-x-2 mb-2 text-sm"><input type="checkbox" checked={clearanceAcct.expense} onChange={e=>setClearanceAcct({...clearanceAcct, expense: e.target.checked})} className="rounded"/><span>立替金精算</span></label>
                    <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={clearanceAcct.loan} onChange={e=>setClearanceAcct({...clearanceAcct, loan: e.target.checked})} className="rounded"/><span>貸付金返済</span></label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <input type="checkbox" id="interviewEn" checked={interviewEnabled} onChange={(e) => setInterviewEnabled(e.target.checked)} className="w-4 h-4 rounded text-[#162D50] focus:ring-[#162D50]" />
                <label htmlFor="interviewEn" className="font-semibold text-gray-700">退職面談を実施する</label>
              </div>

              {interviewEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">面談日 <span className="text-red-500">*</span></label>
                    <input type="date" value={interviewDate} onChange={e=>setInterviewDate(e.target.value)} className={`w-full p-2 border ${errors.interviewDate ? 'border-red-300' : 'border-gray-300'} rounded-md`} />
                    {renderError('interviewDate')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">時間 <span className="text-red-500">*</span></label>
                    <input type="time" value={interviewTime} onChange={e=>setInterviewTime(e.target.value)} className={`w-full p-2 border ${errors.interviewTime ? 'border-red-300' : 'border-gray-300'} rounded-md`} />
                    {renderError('interviewTime')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">担当者 <span className="text-red-500">*</span></label>
                    <input type="text" value={interviewPerson} onChange={e=>setInterviewPerson(e.target.value)} placeholder="人事担当者名" className={`w-full p-2 border ${errors.interviewPerson ? 'border-red-300' : 'border-gray-300'} rounded-md`} />
                    {renderError('interviewPerson')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">形式</label>
                    <select value={interviewType} onChange={e=>setInterviewType(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="対面">対面</option>
                      <option value="オンライン">オンライン</option>
                      <option value="電話">電話</option>
                    </select>
                  </div>
                  {interviewType === 'オンライン' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">会議URL <span className="text-red-500">*</span></label>
                      <input type="url" value={interviewUrl} onChange={e=>setInterviewUrl(e.target.value)} placeholder="https://..." className={`w-full p-2 border ${errors.interviewUrl ? 'border-red-300' : 'border-gray-300'} rounded-md`} />
                      {renderError('interviewUrl')}
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">メモ (任意)</label>
                    <textarea value={interviewMemo} onChange={e=>setInterviewMemo(e.target.value)} rows="3" className="w-full p-2 border border-gray-300 rounded-md" placeholder="特記事項..." />
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">最終給与支払日 <span className="text-red-500">*</span></label>
                  <input type="date" value={finalPayDate} onChange={e=>setFinalPayDate(e.target.value)} className={`w-full p-2 border ${errors.finalPayDate ? 'border-red-300' : 'border-gray-300'} rounded-md`} />
                  {renderError('finalPayDate')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">退職金</label>
                  <div className="flex items-center h-10 space-x-4">
                    <label className="flex items-center space-x-2 text-sm"><input type="radio" checked={!hasSeverance} onChange={()=>setHasSeverance(false)} className="text-[#162D50]"/><span>なし</span></label>
                    <label className="flex items-center space-x-2 text-sm"><input type="radio" checked={hasSeverance} onChange={()=>setHasSeverance(true)} className="text-[#162D50]"/><span>あり</span></label>
                  </div>
                </div>
                {hasSeverance && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">退職金額 (¥) <span className="text-red-500">*</span></label>
                    <input type="number" value={severanceAmount} onChange={e=>setSeveranceAmount(e.target.value)} className={`w-full p-2 border ${errors.severanceAmount ? 'border-red-300' : 'border-gray-300'} rounded-md`} placeholder="0" />
                    {renderError('severanceAmount')}
                  </div>
                )}
              </div>

              <hr className="border-gray-200" />
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">発行書類</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={docGensen} onChange={e=>setDocGensen(e.target.checked)} className="rounded" disabled/> <span className="text-gray-500">源泉徴収票 (必須)</span></label>
                  <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={docKoyou} onChange={e=>setDocKoyou(e.target.checked)} className="rounded" disabled/> <span className="text-gray-500">雇用保険被保険者証 (必須)</span></label>
                  <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={docRishoku} onChange={e=>setDocRishoku(e.target.checked)} className="rounded"/> <span>離職票</span></label>
                  <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={docTaishoku} onChange={e=>setDocTaishoku(e.target.checked)} className="rounded"/> <span>退職証明書</span></label>
                  <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={docNenkin} onChange={e=>setDocNenkin(e.target.checked)} className="rounded"/> <span>年金手帳</span></label>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">書類送付先</label>
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center space-x-2 text-sm"><input type="radio" checked={sendAddressType === 'registered'} onChange={()=>setSendAddressType('registered')} className="text-[#162D50]"/><span>登録住所</span></label>
                  <label className="flex items-center space-x-2 text-sm"><input type="radio" checked={sendAddressType === 'other'} onChange={()=>setSendAddressType('other')} className="text-[#162D50]"/><span>別の住所</span></label>
                </div>
                {sendAddressType === 'other' && (
                  <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">郵便番号 <span className="text-red-500">*</span></label>
                      <input type="text" value={otherZip} onChange={e=>setOtherZip(e.target.value)} placeholder="123-4567" className={`w-full md:w-1/3 p-2 border ${errors.otherZip ? 'border-red-300' : 'border-gray-300'} rounded-md text-sm`} />
                      {renderError('otherZip')}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">住所 <span className="text-red-500">*</span></label>
                      <input type="text" value={otherAddress} onChange={e=>setOtherAddress(e.target.value)} className={`w-full p-2 border ${errors.otherAddress ? 'border-red-300' : 'border-gray-300'} rounded-md text-sm`} />
                      {renderError('otherAddress')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-bold text-yellow-800 mb-1 flex items-center"><AlertCircle className="w-4 h-4 mr-2"/>最終確認</p>
                <p className="text-xs text-yellow-700">以下の内容で退職手続きを開始します。完了前に内容を確認してください。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:border-[#162D50] transition-colors relative">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-[#162D50] text-sm flex items-center"><span className="w-1.5 h-4 bg-[#162D50] rounded-full mr-2"></span>スタッフ情報</h4>
                    <button onClick={()=>setCurrentStep(0)} className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded font-medium transition-colors">編集</button>
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                      {selectedStaff?.romajiName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{selectedStaff?.romajiName}</p>
                      <p className="text-xs text-gray-500">ID: #{selectedStaff?._id?.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 inline-block px-2 py-1 rounded">{selectedStaff?.department || '部署未設定'}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:border-[#162D50] transition-colors relative">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-[#162D50] text-sm flex items-center"><span className="w-1.5 h-4 bg-[#162D50] rounded-full mr-2"></span>退職情報</h4>
                    <button onClick={()=>setCurrentStep(1)} className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded font-medium transition-colors">編集</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-500 text-xs">退職区分</p>
                      <p className="font-semibold text-gray-800">{reasonType || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-500 text-xs">退職日</p>
                      <p className="font-semibold text-gray-800">{resignationDate || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-500 text-xs">最終出勤日</p>
                      <p className="font-semibold text-gray-800">{lastWorkingDate || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:border-[#162D50] transition-colors relative">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-[#162D50] text-sm flex items-center"><span className="w-1.5 h-4 bg-[#162D50] rounded-full mr-2"></span>面談・クリアランス</h4>
                    <button onClick={()=>setCurrentStep(3)} className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded font-medium transition-colors">編集</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-500 text-xs">面談予定</p>
                      <p className="font-semibold text-gray-800">{interviewEnabled ? `${interviewDate} ${interviewTime}` : '実施なし'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-500 text-xs">アカウント停止日</p>
                      <p className="font-semibold text-gray-800">{accountStopDate || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:border-[#162D50] transition-colors relative">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-[#162D50] text-sm flex items-center"><span className="w-1.5 h-4 bg-[#162D50] rounded-full mr-2"></span>精算・書類</h4>
                    <button onClick={()=>setCurrentStep(4)} className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded font-medium transition-colors">編集</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-500 text-xs">最終給与日</p>
                      <p className="font-semibold text-gray-800">{finalPayDate || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-500 text-xs">退職金</p>
                      <p className="font-semibold text-gray-800">{hasSeverance && severanceAmount ? `¥${Number(severanceAmount).toLocaleString()}` : 'なし'}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 bg-[#F8F9FA] flex justify-between items-center sm:rounded-b-xl">
          <button 
            onClick={() => { if(window.confirm('入力内容が破棄されます。キャンセルしますか？')) onClose(); }}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
          >
            キャンセル
          </button>
          <div className="flex space-x-3">
            {currentStep > 0 && (
              <button 
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md text-sm font-medium transition-colors"
              >
                戻る
              </button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <button 
                onClick={handleNext}
                className="px-6 py-2 bg-[#162D50] text-white hover:bg-[#0f1f38] rounded-md text-sm font-bold shadow-sm transition-colors"
              >
                次へ
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-[#162D50] text-white hover:bg-[#0f1f38] rounded-md text-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? '処理中...' : '登録する'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
