import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';
import { validateExpenseAmount } from '../../utils/amountHelper.js';
import { getAutoFill, getPaymentMethod } from '../../utils/expenseRules.js';
import { getDirection, calculateInstallments } from '../../utils/paymentUtils.js';
import { User, ChevronDown, Box, Calendar, UploadCloud, ArrowRight, Wallet, Landmark, FileText, ArrowLeft, Image, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
// Japanese translation map for dropdown option labels
const optionLabelJP = {
  'Postage': '郵便料金',
  'Transportation Expenses / Flight Fare': '交通費 / 航空運賃',
  'Visa Application Fee': 'ビザ申請料',
  'Accommodation cost': '宿泊費',
  'Language Course Fee': '語学講習費',
  'Waiting Dormitory Fee': '待機寮費',
  'Hospital/ Drugs Expenses': '病院費/薬代',
  'Equipment / Consumable Items': '備品・消耗品',
  'Wifi': 'WIFI',
  'others': 'その他',
  'サポートスタッフ': 'サポートスタッフ',
  'VC': 'VC',
  'Farm': 'ファーム',
  'Select for each project': 'プロジェクト毎に選択',
  'Office': 'オフィス',
  'Service Staff': 'サービススタッフ',
  'Host Company': 'ホスト企業',
  'salary_addition': '給与に加算',
  'salary_deduction': '給与から控除',
  'client_invoice': 'クライアントへ請求',
  'direct_transfer': '本人へ振込',
  'bank_transfer': '銀行振込',
  'Farm and VC Asset Transfer Agreement': 'Farm and VC Asset Transfer Agreement',
};
const toJP = (label) => optionLabelJP[label] ?? label;




export default function StaffClaimRequest() {
  const [newCaseStep, setNewCaseStep] = useState(1);
  const [options, setOptions] = useState({
    拠点: [],
    ExpenseType: [],
    AdvancerCategory: [],
    BearingParty: []
  });
  const [cases, setCases] = useState([{
    id: 1,
    expenseType: '種類を選択',
    advancerCategory: 'カテゴリを選択',
    bearingParty: '負担先を選択',
    expense金額: 0,
    advancerName: ''
  }]);
  
  const [staffInfo, setStaffInfo] = useState({ fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: '', availableWorkPlaces: [] });
  const [employees, setEmployees] = useState([]);
  const [regions, setRegions] = useState([]);
  const [postalMatrix, setPostalMatrix] = useState({});
  const [travelMatrix, setTravelMatrix] = useState({});
  const [unsettledBalance, setUnsettledBalance] = useState(0);
  const [includeBalance, setIncludeBalance] = useState(false);
  const [settlementMethod, setSettlementMethod] = useState('銀行振込');
  const [recoveryPlan, setRecoveryPlan] = useState('給与控除（3ヶ月）');
  const [expectedSettlementDate, setExpectedSettlementDate] = useState('');
  const [collectionMethod, setCollectionMethod] = useState('方法を選択');
  const [collectionStartMonth, setCollectionStartMonth] = useState('');
  
  // New payment states
  const [payrollMonth, setPayrollMonth] = useState('');
  const [settlementNote, setSettlementNote] = useState('');
  const [installmentCount, setInstallmentCount] = useState(1);
  const [laborConsent, setLaborConsent] = useState(false);
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

  const updateCase = (index, field, value) => {
    const newCases = [...cases];
    newCases[index][field] = value;

    if (field === 'expenseType') {
      const autoFill = getAutoFill(value);
      if (autoFill) {
        Object.assign(newCases[index], autoFill);
      } else if (value === 'others') {
        newCases[index].advancerCategory = 'Select for each project';
        newCases[index].bearingParty = 'Select for each project';
        newCases[index].advancerName = '';
      }
    }

    if (field === 'advancerCategory' || field === 'bearingParty') {
      newCases[index].advancerName = getPaymentMethod(newCases[index].advancerCategory, newCases[index].bearingParty);
    }

    const currentExpenseType = field === 'expenseType' ? value : newCases[index].expenseType;

    if (currentExpenseType === 'Postage' && (field === 'sender' || field === 'recipient' || field === 'expenseType')) {
      const senderName = field === 'sender' ? value : newCases[index].sender;
      const recipientName = field === 'recipient' ? value : newCases[index].recipient;
      if (senderName && recipientName) {
        const senderId = regions.find(r => r.name1 === senderName)?._id;
        const recipientId = regions.find(r => r.name2 === recipientName)?._id;
        if (senderId && recipientId && postalMatrix[senderId] && postalMatrix[senderId][recipientId]) {
          const rawCost = postalMatrix[senderId][recipientId];
          const numericCost = typeof rawCost === 'string' ? Number(rawCost.replace(/,/g, '')) : rawCost;
          newCases[index].suggested金額 = numericCost || 0;
        } else {
          newCases[index].suggested金額 = 0;
        }
      } else {
        newCases[index].suggested金額 = 0;
      }
    }

    if (currentExpenseType === 'Transportation Expenses / Flight Fare' && (field === 'departure' || field === 'destination' || field === 'expenseType' || field === 'transportMethod')) {
      const departureName = field === 'departure' ? value : newCases[index].departure;
      const destinationName = field === 'destination' ? value : newCases[index].destination;
      const method = field === 'transportMethod' ? value : newCases[index].transportMethod;
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
            if (method === 'バス') numericCost = busCost;
            else if (method === '飛行機') numericCost = flightCost;
            else numericCost = Math.max(busCost, flightCost);
          }
          newCases[index].suggested金額 = numericCost || 0;
        } else {
          newCases[index].suggested金額 = 0;
        }
      } else {
        newCases[index].suggested金額 = 0;
      }
    }

    setCases(newCases);
  };

  const handleAddAnotherCase = () => {
    setCases([...cases, {
      id: Date.now(),
      expenseType: '種類を選択',
      advancerCategory: 'カテゴリを選択',
      bearingParty: '負担先を選択',
      expense金額: '',
      suggested金額: 0,
      advancerName: '',
      receipts: [],
      remark: ''
    }]);
  };

  const removeCase = (index) => {
    if (cases.length > 1) {
      const newCases = [...cases];
      newCases.splice(index, 1);
      setCases(newCases);
    }
  };

  const handleFileUpload = async (e, index) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

    const validFiles = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`ファイル形式が無効です: ${file.name}。JPG、PNG、PDFファイルのみアップロード可能です。`);
        // クリア the input so the user can try again
        e.target.value = '';
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`ファイルサイズが大きすぎます: ${file.name}。1ファイルの最大サイズは2MBです。`);
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
        const newCases = [...cases];
        newCases[index].receipts = [...(newCases[index].receipts || []), ...data.fileNames];
        setCases(newCases);
      } else {
        console.error('Failed to upload files');
        toast.error('ファイルのアップロードに失敗しました。');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('ファイルのアップロード中にエラーが発生しました。');
    }
  };

  const totalExpense金額 = cases.reduce((sum, c) => sum + Number(c.expense金額 || 0), 0);
  const finalTotal金額 = totalExpense金額 + (includeBalance ? unsettledBalance : 0);

  const direction = getDirection(cases[0].bearingParty || '');

  // Calculate installments for preview
  const maxDeduction = 50000; // Mock setting
  const installmentSchedule = direction === 'DEDUCT' ? calculateInstallments(finalTotal金額, installmentCount, collectionStartMonth || '2026-10') : [];
  const exceedsMax = installmentSchedule.some(inst => inst.amount > maxDeduction);
  const minInstallments = Math.ceil(finalTotal金額 / maxDeduction);

  const handle送信 = async () => {
    try {
      const submissions = cases.map(caseItem => {
        const payload = {
          case_type: 'Office Case',
          full_name: staffInfo.fullName || "N/A",
          staff_id: staffInfo.id || "N/A",
          location: staffInfo.location || "N/A",
          branch_farm_name: staffInfo.branchAndFarmName || "",
          visa_status: staffInfo.visaステータス || "",
          visa_available_time: staffInfo.visaAvailableTime || null,
          expense_type: caseItem.expenseType,
          advancer_category: caseItem.advancerCategory,
          payment_process_types: caseItem.advancerName || "direct_transfer",
          bearing_party: caseItem.bearingParty,
          expense_amount: parseFloat(caseItem.expense金額) || 0,
          expense_period_start: caseItem.expense期間Start || caseItem.dateUsed || caseItem.dormitoryStartDate || caseItem.consultationDate || caseItem.purchaseDate || caseItem.wifiStartDate || new Date().toISOString(),
          expense_period_end: caseItem.expense期間End || caseItem.dormitoryEndDate || caseItem.expense期間Start || caseItem.dateUsed || caseItem.dormitoryStartDate || caseItem.consultationDate || caseItem.purchaseDate || caseItem.wifiStartDate || new Date().toISOString(),
          sender: caseItem.sender || "",
          recipient: caseItem.postageTo || '',
          departure: caseItem.departure || '',
          destination: caseItem.destination || '',
          transport_method: caseItem.transportMethod || '',
          bill_receipt_url: caseItem.receipts || [],
          remarks: caseItem.remark || caseItem.damageReason || "",
          total_expense_amount: totalExpense金額,
          currency: 'JPY',
          previous_unsettled_balance: unsettledBalance,
          includeBalance: includeBalance,
          final_total_amount: finalTotal金額,
          direction: direction,
          settlement_method: direction === 'ADD' ? '給与に加算' : settlementMethod,
          expected_settlement_date: expectedSettlementDate || new Date().toISOString(),
          payroll_month: payrollMonth,
          settlement_note: settlementNote,
          collection_method: direction === 'DEDUCT' ? '給与控除' : collectionMethod,
          installment_count: installmentCount,
            monthly_deduction: 0,
          collection_start_month: collectionStartMonth || "TBD",
          installment_schedule: installmentSchedule,
          labor_consent: laborConsent,
          status: '保留中'
        };

        return apiFetch('/api/claims', {
          method: 'POST',
          body: JSON.stringify(payload),
        }).then(async res => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || '案件の送信に失敗しました');
          }
          return res;
        });
      });

      await Promise.all(submissions);
      toast.success(`${cases.length}件の案件をデータベースに送信しました！`);
      
      // Reset form
      setNewCaseStep(1);
      setCases([{
        id: Date.now(),
        expenseType: '種類を選択',
        advancerCategory: 'カテゴリを選択',
        bearingParty: '負担先を選択',
        expense金額: '',
        suggested金額: 0,
        advancerName: '',
        receipts: [],
        remark: ''
      }]);
      setStaffInfo({ fullName: '', id: '', location: '' });
      setUnsettledBalance(0);
      setExpectedSettlementDate('');
      setCollectionStartMonth('');
    } catch (error) {
      console.error("Error submitting cases:", error);
      toast.error("案件の送信に失敗しました。詳細はコンソールを確認してください。: " + (error.message || error));
    }
  };

  const renderDynamicFields = (type, index, caseItem) => {
    switch (type) {
      case 'Postage':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 bg-blue-50/70 p-4 sm:p-6 rounded-lg border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">差出人</label>
              <input type="text" list={`sender-list-${index}`} value={caseItem.sender || ''} onChange={(e) => updateCase(index, 'sender', e.target.value)} placeholder="差出人を入力" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" />
              <datalist id={`sender-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name1} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">受取人</label>
              <input type="text" list={`recipient-list-${index}`} value={caseItem.recipient || ''} onChange={(e) => updateCase(index, 'recipient', e.target.value)} placeholder="受取人を入力" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" />
              <datalist id={`recipient-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name2} />
                ))}
              </datalist>
            </div>
          </div>
        );
      case 'Transportation Expenses / Flight Fare':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 bg-blue-50/70 p-4 sm:p-6 rounded-lg border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">出発拠点</label>
              <input type="text" list={`departure-list-${index}`} value={caseItem.departure || ''} onChange={(e) => updateCase(index, 'departure', e.target.value)} placeholder="出発地を入力" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" />
              <datalist id={`departure-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name1} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">目的地</label>
              <input type="text" list={`destination-list-${index}`} value={caseItem.destination || ''} onChange={(e) => updateCase(index, 'destination', e.target.value)} placeholder="目的地を入力" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" />
              <datalist id={`destination-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name2} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">利用日</label>
              <div className="relative">
                <input type="date" value={caseItem.dateUsed || ''} onChange={(e) => updateCase(index, 'dateUsed', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">交通手段</label>
              <select value={caseItem.transportMethod || ''} onChange={(e) => updateCase(index, 'transportMethod', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm text-gray-600">
                <option value="">手段を選択...</option>
                <option value="バス">バス</option>
                <option value="飛行機">飛行機</option>
              </select>
            </div>
          </div>
        );
      case 'Waiting Dormitory Fee':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 bg-blue-50/70 p-4 sm:p-6 rounded-lg border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">寮名</label>
              <input type="text" value={caseItem.dormitoryName || ''} onChange={(e) => updateCase(index, 'dormitoryName', e.target.value)} placeholder="名前を入力" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">利用開始日</label>
              <div className="relative">
                <input type="date" value={caseItem.dormitoryStartDate || ''} onChange={(e) => updateCase(index, 'dormitoryStartDate', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
              </div>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">利用終了日</label>
              <div className="relative">
                <input type="date" value={caseItem.dormitoryEndDate || ''} onChange={(e) => updateCase(index, 'dormitoryEndDate', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
              </div>
            </div>
          </div>
        );
      case 'Hospital/ Drugs Expenses':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 bg-blue-50/70 p-4 sm:p-6 rounded-lg border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">受診日</label>
              <div className="relative">
                <input type="date" value={caseItem.consultationDate || ''} onChange={(e) => updateCase(index, 'consultationDate', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">診察料</label>
              <input type="number" value={caseItem.consultationFee || 0} onChange={(e) => updateCase(index, 'consultationFee', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">薬代</label>
              <input type="number" value={caseItem.medicineCost || 0} onChange={(e) => updateCase(index, 'medicineCost', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
            </div>
          </div>
        );
      case 'Equipment / Consumable Items':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 bg-blue-50/70 p-4 sm:p-6 rounded-lg border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">品名</label>
              <input type="text" value={caseItem.itemName || ''} onChange={(e) => updateCase(index, 'itemName', e.target.value)} placeholder="品名を入力" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">数量</label>
              <input type="number" value={caseItem.quantity || 1} onChange={(e) => updateCase(index, 'quantity', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">購入日</label>
              <div className="relative">
                <input type="date" value={caseItem.purchaseDate || ''} onChange={(e) => updateCase(index, 'purchaseDate', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
              </div>
            </div>
            <div className="col-span-1 sm:col-span-2 md:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">破損、故障、不足などの理由</label>
              <textarea value={caseItem.damageReason || ''} onChange={(e) => updateCase(index, 'damageReason', e.target.value)} placeholder="理由を入力" rows="3" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm"></textarea>
            </div>
          </div>
        );
      case 'Wifi':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 bg-blue-50/70 p-4 sm:p-6 rounded-lg border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">対象ホスト企業/農場</label>
              <input type="text" value={caseItem.hostCompany || ''} onChange={(e) => updateCase(index, 'hostCompany', e.target.value)} placeholder="企業/農場を入力" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">利用開始日</label>
              <div className="relative">
                <input type="date" value={caseItem.wifiStartDate || ''} onChange={(e) => updateCase(index, 'wifiStartDate', e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-1 sm:px-4 md:px-6 lg:px-8 space-y-6 sm:space-y-8 pb-10">
      {/* Header and Stepper */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-1 sm:pt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#162D50] mb-1">スタッフ経費精算</h2>
          <p className="text-gray-500 text-xs sm:text-sm">スタッフの経費請求を登録し、精算処理を行います。</p>
        </div>
        <div className="flex items-center justify-between sm:justify-start space-x-1.5 sm:space-x-3 md:space-x-4 text-xs sm:text-sm font-medium bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-lg sm:rounded-none border border-gray-200 sm:border-0 shadow-xs sm:shadow-none overflow-x-auto">
          <div className="flex items-center text-[#162D50] shrink-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center text-xs mr-1.5 sm:mr-2 shrink-0 font-bold">1</div>
            <span className="whitespace-nowrap font-semibold">案件詳細</span>
          </div>
          <div className={`w-4 sm:w-8 md:w-16 h-px shrink-0 ${newCaseStep >= 2 ? 'bg-[#162D50]' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center shrink-0 ${newCaseStep >= 2 ? 'text-[#162D50] font-semibold' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs mr-1.5 sm:mr-2 shrink-0 ${newCaseStep >= 2 ? 'bg-[#162D50] text-white font-bold' : 'border border-gray-300 text-gray-400'}`}>2</div>
            <span className="whitespace-nowrap">経費詳細</span>
          </div>
          <div className={`w-4 sm:w-8 md:w-16 h-px shrink-0 ${newCaseStep >= 3 ? 'bg-[#162D50]' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center shrink-0 ${newCaseStep >= 3 ? 'text-[#162D50] font-semibold' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs mr-1.5 sm:mr-2 shrink-0 ${newCaseStep >= 3 ? 'bg-[#162D50] text-white font-bold' : 'border border-gray-300 text-gray-400'}`}>3</div>
            <span className="whitespace-nowrap">確認</span>
          </div>
        </div>
      </div>

      {newCaseStep === 1 && (
        <>
          {/* 案件カテゴリ Section */}
          {cases.map((caseItem, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg mb-6 shadow-xs">
              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <div className="flex items-center text-[#162D50] font-bold text-base sm:text-lg">
                    <Box className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                    <span>案件カテゴリ {cases.length > 1 && `#${index + 1}`}</span>
                  </div>
                  {cases.length > 1 && (
                    <button 
                      onClick={() => removeCase(index)}
                      className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium flex items-center transition-colors cursor-pointer">
                      カテゴリを削除
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">経費の種類 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        value={caseItem.expenseType}
                        onChange={(e) => updateCase(index, 'expenseType', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 text-sm">
                        <option value="">種類を選択</option>
                        {options.ExpenseType.filter(opt => !['Drugs'].includes(opt.value)).map((opt) => (
                          <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">立替者カテゴリ <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        value={caseItem.advancerCategory}
                        onChange={(e) => updateCase(index, 'advancerCategory', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 text-sm">
                        <option value="">カテゴリを選択</option>
                        {options.AdvancerCategory.map((opt) => (
                          <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">負担先 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        value={caseItem.bearingParty}
                        onChange={(e) => updateCase(index, 'bearingParty', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 text-sm">
                        <option value="">負担先を選択</option>
                        {options.BearingParty.map((opt) => (
                          <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">支払処理タイプ <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="名前を入力" 
                      value={toJP(caseItem.advancerName)}
                      onChange={(e) => updateCase(index, 'advancerName', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">経費金額 (¥) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={caseItem.expense金額} 
                      onChange={(e) => updateCase(index, 'expense金額', e.target.value)} 
                      placeholder="金額を入力"
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-900 font-medium text-sm" 
                    />
                    {(() => {
                      const validation = validateExpenseAmount(caseItem.expense金額, caseItem.suggested金額);
                      if (!validation.isValid) {
                        return (
                          <div 
                            onClick={() => updateCase(index, 'expense金額', caseItem.suggested金額)}
                            className="mt-2 text-xs text-red-600 font-medium flex items-center bg-red-50 px-3 py-1.5 rounded border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                            {validation.message} （クリックして適用）
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">経費対象期間</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <input type="date" value={caseItem.expense期間Start || ''} onChange={(e) => updateCase(index, 'expense期間Start', e.target.value)} className="w-full px-2.5 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-xs sm:text-sm min-w-0" />
                      </div>
                      <span className="text-gray-500 shrink-0 font-medium">~</span>
                      <div className="relative flex-1 min-w-0">
                        <input type="date" value={caseItem.expense期間End || ''} onChange={(e) => updateCase(index, 'expense期間End', e.target.value)} className="w-full px-2.5 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-xs sm:text-sm min-w-0" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 leading-tight">注: 経費精算は通常、その月の11日から27日の間に処理されます。</p>
                  </div>
                </div>

                {renderDynamicFields(caseItem.expenseType, index, caseItem)}

                {/* Bill/Receipt Upload and Remark for this case */}
                <div className="border-t border-gray-200 mt-6 pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">請求書/領収書のアップロード</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, index)} />
                        <FileText className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                        <p className="text-xs sm:text-sm text-gray-600">ファイルをドラッグ＆ドロップするか、クリックしてアップロード</p>
                      </div>
                      {caseItem.receipts && caseItem.receipts.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {caseItem.receipts.map((file, i) => (
                            <div key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center max-w-full">
                              <FileText className="w-3 h-3 mr-1 shrink-0" /> 
                              <span className="truncate">{typeof file === 'string' ? (file.includes('-') ? file.split('-').slice(1).join('-') : file) : file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">備考</label>
                      <textarea 
                        value={caseItem.remark || ''} 
                        onChange={(e) => updateCase(index, 'remark', e.target.value)}
                        placeholder="この案件に関する追加の詳細や備考を入力してください..." 
                        className="w-full h-[100px] sm:h-[120px] px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] resize-none text-sm"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* スタッフ情報 Section */}
          {cases.some(c => ['Service Staff', 'Service staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.advancerCategory) || ['Service Staff', 'Service staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.bearingParty)) && (() => {
            const validEmployees = employees.filter(emp => {
              const hasValidVisa = !emp.visaEndDate || new Date(emp.visaEndDate) >= new Date();
              const hasWorkPlace = emp.assignedWorkPlace && emp.assignedWorkPlace.length > 0;
              return hasValidVisa && hasWorkPlace;
            });
            return (
              <div className="bg-white border border-gray-200 rounded-lg mb-6 sm:mb-8 shadow-xs">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center text-[#162D50] font-bold text-base sm:text-lg mb-4">
                    <User className="w-4 h-4 mr-2 shrink-0" />
                    スタッフ情報
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="relative">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">氏名 <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="氏名を入力" list="employeeNames" value={staffInfo.fullName} onChange={e => {
                        const val = e.target.value;
                        setStaffInfo({...staffInfo, fullName: val});
                        const match = validEmployees.find(emp => (emp.romajiName && emp.romajiName.toLowerCase() === val.toLowerCase()) || (emp.katakanaName && emp.katakanaName === val));
                        if (match) {
                          setStaffInfo({...staffInfo, 
                            fullName: val, 
                            id: 'ID-' + match._id.slice(-6).toUpperCase(), 
                            location: match.location || staffInfo.location,
                            branchAndFarmName: (match.assignedWorkPlace && match.assignedWorkPlace.length > 0) ? match.assignedWorkPlace[0] : '',
                            availableWorkPlaces: match.assignedWorkPlace || [],
                            visaステータス: match.visaStatus || '',
                            visaAvailableTime: match.visaEndDate ? new Date(match.visaEndDate).toISOString().split('T')[0] : ''
                          });
                        }
                      }} onBlur={() => {
                        if (staffInfo.fullName) {
                          const match = validEmployees.find(emp => (emp.romajiName && emp.romajiName.toLowerCase() === staffInfo.fullName.toLowerCase()) || (emp.katakanaName && emp.katakanaName === staffInfo.fullName));
                          if (!match) {
                            setStaffInfo({...staffInfo, fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: ''});
                            toast.error('リストから有効なスタッフを選択してください。');
                          }
                        }
                      }} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" />
                      <datalist id="employeeNames">
                        {validEmployees.map(emp => (
                          <option key={emp._id} value={emp.romajiName || emp.katakanaName} />
                        ))}
                      </datalist>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">スタッフID <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="ID-00000" list="employeeIds" value={staffInfo.id} onChange={e => {
                        const val = e.target.value;
                        setStaffInfo({...staffInfo, id: val});
                        const searchId = val.replace('ID-', '').toLowerCase();
                        const match = validEmployees.find(emp => emp._id.slice(-6) === searchId);
                        if (match) {
                          setStaffInfo({...staffInfo, 
                            id: val, 
                            fullName: match.romajiName || match.katakanaName || staffInfo.fullName, 
                            location: match.location || staffInfo.location,
                            branchAndFarmName: (match.assignedWorkPlace && match.assignedWorkPlace.length > 0) ? match.assignedWorkPlace[0] : '',
                            availableWorkPlaces: match.assignedWorkPlace || [],
                            visaステータス: match.visaStatus || '',
                            visaAvailableTime: match.visaEndDate ? new Date(match.visaEndDate).toISOString().split('T')[0] : ''
                          });
                        }
                      }} onBlur={() => {
                        if (staffInfo.id) {
                          const searchId = staffInfo.id.replace('ID-', '').toLowerCase();
                          const match = validEmployees.find(emp => emp._id.slice(-6) === searchId);
                          if (!match) {
                            setStaffInfo({...staffInfo, fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: ''});
                            toast.error('リストから有効なスタッフIDを選択してください。');
                          }
                        }
                      }} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-sm" />
                      <datalist id="employeeIds">
                        {validEmployees.map(emp => (
                          <option key={emp._id} value={'ID-' + emp._id.slice(-6).toUpperCase()} />
                        ))}
                      </datalist>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">配属先</label>
                      <div className="relative">
                        <select value={staffInfo.branchAndFarmName} onChange={e => setStaffInfo({...staffInfo, branchAndFarmName: e.target.value})} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 text-sm">
                          <option value="">配属先を選択</option>
                          {staffInfo.availableWorkPlaces?.map((wp, idx) => (
                            <option key={idx} value={wp}>{wp}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ); 
          })()}

          {/* Summary Box & Add Case */}
          <div className="bg-white border border-gray-200 rounded-lg mb-6 sm:mb-8 shadow-xs">
            <div className="p-4 sm:p-6">
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <div className="font-bold text-sm text-gray-800 mb-1">複数案件の概要</div>
                  <div className="text-xs text-gray-500">上記すべての項目の合計</div>
                </div>
                <div className="sm:text-right">
                  <div className="font-bold text-xs text-gray-800 mb-1">経費合計金額</div>
                  <div className="text-xl sm:text-2xl font-bold text-[#162D50]">¥ {totalExpense金額.toLocaleString()}</div>
                </div>
              </div>

              {/* Add Another Case Button */}
              <button 
                onClick={handleAddAnotherCase}
                className="w-full sm:w-auto justify-center flex items-center px-5 py-2.5 border border-[#162D50] text-[#162D50] rounded-md font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                + 案件を追加
              </button>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-2 sm:pt-4">
            <button 
              onClick={() => {
                const showStaffInfo = cases.some(c => ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.advancerCategory) || ['Service staff', 'Service Staff', 'Staff', 'Support staff', 'Support Staff'].includes(c.bearingParty));
                if (showStaffInfo && (!staffInfo.fullName || !staffInfo.id || !staffInfo.branchAndFarmName || staffInfo.branchAndFarmName === '配属先を選択')) {
                  toast.error('必要なスタッフ情報をすべて入力してください。');
                  return;
                }
                for (let i = 0; i < cases.length; i++) {
                  const c = cases[i];
                  if (c.expenseType === '種類を選択' || c.advancerCategory === 'カテゴリを選択' || c.bearingParty === '負担先を選択' || !c.expense金額) {
                    toast.error(`案件カテゴリ #${i+1} の必要な項目をすべて入力してください。`);
                    return;
                  }
                  const validation = validateExpenseAmount(c.expense金額, c.suggested金額);
                  if (!validation.isValid) {
                    toast.error(`第${i + 1}行: ${validation.message}`);
                    return;
                  }
                  if (c.advancerCategory !== 'Office' && !c.advancerName) {
                    toast.error(`案件カテゴリ #${i+1} の支払処理タイプを入力してください。`);
                    return;
                  }
                }
                setNewCaseStep(2);
              }}
              className="w-full sm:w-auto justify-center bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm cursor-pointer">
              次へ <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </>
      )}

      {newCaseStep === 2 && (
        <>
          {/* 金額詳細 Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-xs">
            <div className="p-4 sm:p-6">
              <div className="flex items-center text-[#162D50] font-bold text-base sm:text-lg mb-4">
                <Wallet className="w-4 h-4 mr-2 shrink-0" />
                金額詳細
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">経費合計 (¥)</label>
                  <input type="number" value={totalExpense金額} readOnly className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 bg-gray-50 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">通貨</label>
                  <div className="relative">
                    <select className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm">
                      <option>JPY（日本円）</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">前回未精算残高 (¥)</label>
                  <input type="number" value={unsettledBalance} onChange={e => setUnsettledBalance(Number(e.target.value))} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">未精算残高を合計に含めますか？</label>
                  <div className="flex items-center mt-3">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle" checked={includeBalance} onChange={e => setIncludeBalance(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                      <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                    <span className="text-gray-500 text-sm font-medium">残高を含める</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">最終合計金額 (¥)</label>
                <div className="w-full bg-[#162D50] text-white px-4 py-3 rounded-md font-bold text-lg sm:text-xl">
                  ¥ {finalTotal金額.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Sections Based on Direction */}
          {direction === 'ADD' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-xs mt-6">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div className="flex items-center text-[#162D50] font-bold text-sm sm:text-base">
                    <Landmark className="w-4 h-4 mr-2 shrink-0" />
                    <span>立替者への精算 (Settlement to advancer)</span>
                  </div>
                  <span className="self-start sm:self-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded border border-blue-400">
                    Company-borne (負担先: {cases[0].bearingParty}) → 給与に加算
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">精算方法 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select disabled value="給与に加算" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 appearance-none text-sm">
                        <option value="給与に加算">給与に加算 (Addition to salary)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">給与反映月 (Payroll Month) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="month" value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} min={new Date().toISOString().slice(0, 7)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">精算予定日 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="date" value={expectedSettlementDate} onChange={e => setExpectedSettlementDate(e.target.value)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">備考 (Note)</label>
                    <div className="relative">
                      <input type="text" value={settlementNote} onChange={e => setSettlementNote(e.target.value)} placeholder="任意のメモを入力" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {direction === 'DEDUCT' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-xs mt-6">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div className="flex items-center text-[#162D50] font-bold text-sm sm:text-base">
                    <FileText className="w-4 h-4 mr-2 shrink-0" />
                    <span>負担先からの回収 (Collection from responsible party)</span>
                  </div>
                  <span className="self-start sm:self-auto bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded border border-red-400">
                    Employee-borne (負担先: {cases[0].bearingParty}) → 給与控除
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">回収方法 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select disabled value="給与控除" className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 appearance-none text-sm">
                        <option value="給与控除">給与控除 (Deduction from salary)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">分割回数 (Installments) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select value={installmentCount} onChange={e => setInstallmentCount(Number(e.target.value))} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm">
                        <option value={1}>一括払い (Lump-sum)</option>
                        {[...Array(5)].map((_, i) => (
                          <option key={i+2} value={i+2}>{i+2}回払い</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">回収開始月 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="month" value={collectionStartMonth} onChange={e => setCollectionStartMonth(e.target.value)} min={new Date().toISOString().slice(0, 7)} className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                    </div>
                  </div>
                </div>

                {collectionStartMonth && finalTotal金額 > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">控除スケジュールプレビュー (Deduction Schedule Preview)</label>
                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                      <table className="w-full min-w-[500px] text-xs sm:text-sm text-left text-gray-500 border border-gray-200">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 border-b">No.</th>
                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 border-b">Month</th>
                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 border-b">Amount</th>
                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 border-b">Remaining</th>
                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 border-b">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {installmentSchedule.map((inst) => (
                            <tr key={inst.no} className={`bg-white border-b ${inst.amount > maxDeduction ? 'bg-red-50' : ''}`}>
                              <td className="px-3 sm:px-4 py-2 sm:py-3">{inst.no}</td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3">{inst.month}</td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-red-600 font-semibold">¥{inst.amount.toLocaleString()}</td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3">¥{inst.remaining.toLocaleString()}</td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3"><span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-medium">SCHEDULED</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {exceedsMax && (
                      <div className="mt-2 text-red-600 text-xs sm:text-sm flex items-start sm:items-center">
                        <AlertTriangle className="w-4 h-4 mr-1 shrink-0 mt-0.5 sm:mt-0" />
                        <span>毎月の控除額が上限（¥{maxDeduction.toLocaleString()}）を超えています。少なくとも {minInstallments} 回以上の分割払いを推奨します。</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-start mt-4">
                  <input type="checkbox" id="laborConsent" checked={laborConsent} onChange={e => setLaborConsent(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 shrink-0 cursor-pointer" />
                  <label htmlFor="laborConsent" className="ml-2.5 text-xs sm:text-sm font-medium text-gray-900 leading-relaxed cursor-pointer">
                    労使協定の確認（従業員の同意済み）/ Employee consent confirmed (Labor Standards Act Art. 24) <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons for Step 2 */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-4 mt-6">
            <button 
              onClick={() => setNewCaseStep(1)}
              className="w-full sm:w-auto justify-center px-8 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-md font-bold text-sm flex items-center hover:bg-gray-50 transition-colors shadow-xs cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" /> 戻る
            </button>
            <button 
              onClick={() => {
                if (direction === 'ADD') {
                  if (!payrollMonth || !expectedSettlementDate) {
                    toast.error('必須項目をすべて入力してください。');
                    return;
                  }
                } else {
                  if (!collectionStartMonth) {
                    toast.error('回収開始月を入力してください。');
                    return;
                  }
                  if (!laborConsent) {
                    toast.error('労使協定の確認（同意）にチェックを入れてください。');
                    return;
                  }
                }

                if (staffInfo.visaAvailableTime) {
                  const visaDate = new Date(staffInfo.visaAvailableTime);
                  let isVisaInvalid = false;
                  
                  if (direction === 'ADD') {
                    const expectedDate = new Date(expectedSettlementDate);
                    if (visaDate < expectedDate) isVisaInvalid = true;
                  } else {
                    let finalPlanDate = new Date(collectionStartMonth + '-01');
                    if (installmentCount > 1) {
                      finalPlanDate.setMonth(finalPlanDate.getMonth() + installmentCount - 1);
                    }
                    finalPlanDate = new Date(finalPlanDate.getFullYear(), finalPlanDate.getMonth() + 1, 0);
                    if (visaDate < finalPlanDate) isVisaInvalid = true;
                  }

                  if (isVisaInvalid) {
                    toast.error('ビザの有効期限が精算予定日または分割払いの完了月より前です。期間を見直してください。');
                    return;
                  }
                }

                setNewCaseStep(3);
              }}
              className={`w-full sm:w-auto justify-center px-8 py-3 rounded-md font-bold text-sm flex items-center transition-colors shadow-xs cursor-pointer ${((direction === 'ADD' && (!payrollMonth || !expectedSettlementDate)) || (direction === 'DEDUCT' && (!collectionStartMonth || !laborConsent))) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#0A192F] text-white hover:bg-[#162D50]'}`}
            >
              次へ <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </>
      )}

      {newCaseStep === 3 && (
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8">
          <h3 className="text-[#162D50] text-lg sm:text-xl font-bold mb-1 sm:mb-2">確認・送信</h3>
          <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8">最終送信前に、すべての案件情報をご確認ください。</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 sm:mb-8">
            {/* Left Column: 案件情報 & 経費詳細 */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h4 className="text-[#162D50] font-bold text-sm sm:text-base mb-3">案件情報</h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-gray-50 sm:border-0">
                      <span className="text-gray-500">スタッフ名</span>
                      <span className="font-bold text-[#162D50]">{staffInfo.fullName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">スタッフID</span>
                      <span className="font-bold text-[#162D50]">{staffInfo.id || "N/A"}</span>
                    </div>
                    {staffInfo.branchAndFarmName && (
                      <div className="flex justify-between items-center py-1 border-t border-gray-50 sm:border-0">
                        <span className="text-gray-500">配属先</span>
                        <span className="font-bold text-[#162D50]">{staffInfo.branchAndFarmName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-[#162D50] font-bold text-sm sm:text-base mb-3">経費詳細</h4>
                <div className="space-y-3">
                  {cases.map((c, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">種類 #{i+1}</span>
                          <span className="font-bold text-[#162D50]">{c.expenseType}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">金額</span>
                          <span className="font-bold text-[#162D50]">¥ {Number(c.expense金額).toLocaleString()}</span>
                        </div>
                        {c.advancerName && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">支払処理</span>
                            <span className="font-medium text-gray-700">{toJP(c.advancerName)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: 財務概要 */}
            <div>
              <h4 className="text-[#162D50] font-bold text-sm sm:text-base mb-3">財務概要</h4>
              <div className="bg-[#162D50] rounded-lg p-4 sm:p-6 text-white h-auto flex flex-col justify-between shadow-xs">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-800/50">
                  <span className="text-blue-200 text-xs sm:text-sm font-medium">合計金額</span>
                  <span className="text-xl sm:text-2xl font-bold">¥ {finalTotal金額.toLocaleString()}</span>
                </div>
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200">支払い方向</span>
                    <span className="font-medium">{direction === 'ADD' ? '給与に加算 (Addition)' : '給与から控除 (Deduction)'}</span>
                  </div>
                  {direction === 'ADD' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">給与反映月</span>
                        <span className="font-medium">{payrollMonth}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">精算予定日</span>
                        <span className="font-medium">{expectedSettlementDate}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">分割回数</span>
                        <span className="font-medium">{installmentCount}回払い</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">回収開始月</span>
                        <span className="font-medium">{collectionStartMonth}</span>
                      </div>
                      {installmentCount > 1 && (
                        <div className="flex justify-between items-center border-t border-blue-800/50 pt-3 mt-3">
                          <span className="text-blue-200">初回控除額</span>
                          <span className="font-bold text-white text-base sm:text-lg">¥ {installmentSchedule[0]?.amount.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons for Step 3 */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-4 pt-6 sm:pt-8 border-t border-gray-200 mt-6 sm:mt-8">
            <button 
              onClick={() => setNewCaseStep(2)}
              className="w-full sm:w-auto justify-center px-8 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-md font-bold text-sm flex items-center hover:bg-gray-50 transition-colors shadow-xs cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" /> 戻る
            </button>
            <button 
              onClick={handle送信}
              className="w-full sm:w-auto justify-center bg-[#0A192F] text-white px-10 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-xs cursor-pointer">
              送信
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
