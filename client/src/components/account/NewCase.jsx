import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';
import { validateExpenseAmount } from '../../utils/amountHelper.js';
import { User, ChevronDown, Box, Calendar, UploadCloud, ArrowRight, Wallet, Landmark, FileText, ArrowLeft, Image } from 'lucide-react';
import toast from 'react-hot-toast';
// Japanese translation map for dropdown option labels
const optionLabelJP = {
  'Postage': '郵便料金',
  'Transportation Expenses / Flight Fare': '交通費 / 航空運賃',
  'Visa application fee': 'ビザ申請料',
  'Waiting Dormitory Fee': '待機寮費',
  'Hospital Fee': '病院費',
  'Equipment/Supplies': '備品・消耗品',
  'WIFI': 'WIFI',
  'others': 'その他',
  'Service staff': 'サービススタッフ',
  'VC': 'VC',
  'Dispatch destination: Farm': '派遣先：農園',
  'Select for each project': 'プロジェクト毎に選択',
  'Office': 'オフィス',
  'Staff': 'スタッフ',
  'Host Company': 'ホスト企業',
  'Transfer to the person concerned': '本人への振込',
  'Salary deduction': '給与控除',
  'Invoice from the client company': 'クライアント会社からの請求書',
};
const toJP = (label) => optionLabelJP[label] ?? label;




export default function NewCase() {
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
  
  const [staffInfo, setStaffInfo] = useState({ fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: '' });
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
      switch (value) {
        case 'Postage':
        case 'Transportation Expenses / 飛行機 Fare':
          newCases[index].advancerCategory = 'Service staff';
          newCases[index].bearingParty = 'VC';
          newCases[index].advancerName = 'Transfer to the person concerned';
          break;
        case 'Visa application fee':
          newCases[index].advancerCategory = 'Service staff';
          newCases[index].bearingParty = 'VC';
          newCases[index].advancerName = 'Salary deduction';
          break;
        case 'Waiting Dormitory Fee':
        case 'Hospital Fee':
          newCases[index].advancerCategory = 'Service staff';
          newCases[index].bearingParty = 'Service staff';
          newCases[index].advancerName = 'Salary deduction';
          break;
        case 'Equipment/Supplies':
        case 'others':
          newCases[index].advancerCategory = 'Select for each project';
          newCases[index].bearingParty = 'Select for each project';
          newCases[index].advancerName = '';
          break;
        case 'WIFI':
          newCases[index].advancerCategory = 'Dispatch destination: Farm';
          newCases[index].bearingParty = 'Dispatch destination: Farm';
          newCases[index].advancerName = 'Invoice from the client company';
          break;
      }
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

    if (currentExpenseType === 'Transportation Expenses / 飛行機 Fare' && (field === 'departure' || field === 'destination' || field === 'expenseType' || field === 'transportMethod')) {
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

  let installments = 1;
  if (recoveryPlan.includes('3') || recoveryPlan.includes('3ヶ月')) installments = 3;
  else if (recoveryPlan.includes('6') || recoveryPlan.includes('6ヶ月')) installments = 6;
  const monthlyDeduction = finalTotal金額 / installments;

  const handle送信 = async () => {
    try {
      const submissions = cases.map(caseItem => {
        const payload = {
          case_type: 'Office Case',
          staff_name: staffInfo.fullName || "N/A",
          staff_id: staffInfo.id || "N/A",
          location: staffInfo.location || "N/A",
          branch_farm_name: staffInfo.branchAndFarmName || "",
          visa_status: staffInfo.visaステータス || "",
          visa_available_time: staffInfo.visaAvailableTime || null,
          expense_type: caseItem.expenseType,
          advancer_category: caseItem.advancerCategory,
          payment_process_type: caseItem.advancerName || "N/A",
          bearing_party: caseItem.bearingParty,
          expense_amount: parseFloat(caseItem.expense金額) || 0,
          expense_period_start: caseItem.expense期間Start || caseItem.dateUsed || caseItem.dormitoryStartDate || caseItem.consultationDate || caseItem.purchaseDate || caseItem.wifiStartDate || new Date().toISOString(),
          expense_period_end: caseItem.expense期間End || caseItem.dormitoryEndDate || caseItem.expense期間Start || caseItem.dateUsed || caseItem.dormitoryStartDate || caseItem.consultationDate || caseItem.purchaseDate || caseItem.wifiStartDate || new Date().toISOString(),
          sender: caseItem.sender || "",
          recipient: caseItem.postageTo || '',
          departure: caseItem.departure || '',
          destination: caseItem.destination || '',
          transport_method: caseItem.transportMethod || '',
          receipts: caseItem.receipts || [],
          remark: caseItem.remark || caseItem.damageReason || "",
          total_expense: totalExpense金額,
          currency: 'JPY',
          previous_unsettled_balance: unsettledBalance,
          includeBalance: includeBalance,
          final_total_amount: finalTotal金額,
          settlement_method: settlementMethod,
          expected_settlement_date: expectedSettlementDate || new Date().toISOString(),
          collection_method: collectionMethod,
          installment_plan: recoveryPlan,
          installment_count: installments,
          collection_start_month: collectionStartMonth || "TBD",
          monthly_deduction: monthlyDeduction,
          status: '保留中'
        };

        return apiFetch('/api/cases', {
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
      toast.error("案件の送信に失敗しました。詳細はコンソールを確認してください。");
    }
  };

  const renderDynamicFields = (type, index, caseItem) => {
    switch (type) {
      case 'Postage':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">差出人</label>
              <input type="text" list={`sender-list-${index}`} value={caseItem.sender || ''} onChange={(e) => updateCase(index, 'sender', e.target.value)} placeholder="差出人を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`sender-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name1} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">受取人</label>
              <input type="text" list={`recipient-list-${index}`} value={caseItem.recipient || ''} onChange={(e) => updateCase(index, 'recipient', e.target.value)} placeholder="受取人を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`recipient-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name2} />
                ))}
              </datalist>
            </div>
          </div>
        );
      case 'Transportation Expenses / 飛行機 Fare':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">出発拠点</label>
              <input type="text" list={`departure-list-${index}`} value={caseItem.departure || ''} onChange={(e) => updateCase(index, 'departure', e.target.value)} placeholder="出発地を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`departure-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name1} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">目的地</label>
              <input type="text" list={`destination-list-${index}`} value={caseItem.destination || ''} onChange={(e) => updateCase(index, 'destination', e.target.value)} placeholder="目的地を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`destination-list-${index}`}>
                {regions.map(r => (
                  <option key={r._id} value={r.name2} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用日</label>
              <div className="relative">
                <input type="date" value={caseItem.dateUsed || ''} onChange={(e) => updateCase(index, 'dateUsed', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">交通手段</label>
              <select value={caseItem.transportMethod || ''} onChange={(e) => updateCase(index, 'transportMethod', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]">
                <option value="">手段を選択...</option>
                <option value="バス">バス</option>
                <option value="飛行機">飛行機</option>
              </select>
            </div>
          </div>
        );
      case 'Waiting Dormitory Fee':
        return (
          <div className="grid grid-cols-3 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">寮名</label>
              <input type="text" value={caseItem.dormitoryName || ''} onChange={(e) => updateCase(index, 'dormitoryName', e.target.value)} placeholder="名前を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用開始日</label>
              <div className="relative">
                <input type="date" value={caseItem.dormitoryStartDate || ''} onChange={(e) => updateCase(index, 'dormitoryStartDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用終了日</label>
              <div className="relative">
                <input type="date" value={caseItem.dormitoryEndDate || ''} onChange={(e) => updateCase(index, 'dormitoryEndDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
          </div>
        );
      case 'Hospital Fee':
        return (
          <div className="grid grid-cols-3 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">受診日</label>
              <div className="relative">
                <input type="date" value={caseItem.consultationDate || ''} onChange={(e) => updateCase(index, 'consultationDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">診察料</label>
              <input type="number" value={caseItem.consultationFee || 0} onChange={(e) => updateCase(index, 'consultationFee', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">薬代</label>
              <input type="number" value={caseItem.medicineCost || 0} onChange={(e) => updateCase(index, 'medicineCost', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
          </div>
        );
      case 'Equipment/Supplies':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">品名</label>
              <input type="text" value={caseItem.itemName || ''} onChange={(e) => updateCase(index, 'itemName', e.target.value)} placeholder="品名を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">数量</label>
              <input type="number" value={caseItem.quantity || 1} onChange={(e) => updateCase(index, 'quantity', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">購入日</label>
              <div className="relative">
                <input type="date" value={caseItem.purchaseDate || ''} onChange={(e) => updateCase(index, 'purchaseDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">破損、故障、不足などの理由</label>
              <textarea value={caseItem.damageReason || ''} onChange={(e) => updateCase(index, 'damageReason', e.target.value)} placeholder="理由を入力" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"></textarea>
            </div>
          </div>
        );
      case 'WIFI':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">対象ホスト企業/農場</label>
              <input type="text" value={caseItem.hostCompany || ''} onChange={(e) => updateCase(index, 'hostCompany', e.target.value)} placeholder="企業/農場を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用開始日</label>
              <div className="relative">
                <input type="date" value={caseItem.wifiStartDate || ''} onChange={(e) => updateCase(index, 'wifiStartDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8 pb-10">
      {/* Header and Stepper */}
      <div className="flex justify-between items-start pt-2">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-2">新規案件登録</h2>
          <p className="text-gray-500 text-sm">財務詳細を含む新しい立替・精算案件を登録します。</p>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium mt-2">
          <div className="flex items-center text-[#162D50]">
            <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">1</div>
            案件詳細
          </div>
          <div className={`w-16 h-px ${newCaseStep >= 2 ? 'bg-[#162D50]' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${newCaseStep >= 2 ? 'text-[#162D50]' : 'text-gray-400'}`}>
            {newCaseStep >= 2 && (
              <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">2</div>
            )}
            経費詳細
          </div>
          <div className={`w-16 h-px ${newCaseStep >= 3 ? 'bg-[#162D50]' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${newCaseStep >= 3 ? 'text-[#162D50]' : 'text-gray-400'}`}>
            {newCaseStep >= 3 ? (
              <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">3</div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mr-2">3</div>
            )}
            確認
          </div>
        </div>
      </div>

      {newCaseStep === 1 && (
        <>
          {/* スタッフ情報 Section */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="p-6">
          <div className="flex items-center text-[#162D50] font-bold mb-4">
            <User className="w-4 h-4 mr-2" />
            スタッフ情報
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">氏名 <span className="text-red-500">*</span></label>
              <input type="text" placeholder="氏名を入力" list="employeeNames" value={staffInfo.fullName} onChange={e => {
                const val = e.target.value;
                setStaffInfo({...staffInfo, fullName: val});
                const match = employees.find(emp => (emp.romajiName && emp.romajiName.toLowerCase() === val.toLowerCase()) || (emp.katakanaName && emp.katakanaName === val));
                if (match) {
                  setStaffInfo({...staffInfo, 
                    fullName: val, 
                    id: 'ID-' + match._id.slice(-6).toUpperCase(), 
                    location: match.location || staffInfo.location,
                    branchAndFarmName: (match.assignedWorkPlace && match.assignedWorkPlace.length > 0) ? match.assignedWorkPlace.join(', ') : (match.location || ''),
                    visaステータス: match.visaStatus || '',
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
              <datalist id="employeeNames">
                {employees.map(emp => (
                  <option key={emp._id} value={emp.romajiName || emp.katakanaName} />
                ))}
              </datalist>
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">スタッフID <span className="text-red-500">*</span></label>
              <input type="text" placeholder="ID-00000" list="employeeIds" value={staffInfo.id} onChange={e => {
                const val = e.target.value;
                setStaffInfo({...staffInfo, id: val});
                const searchId = val.replace('ID-', '').toLowerCase();
                const match = employees.find(emp => emp._id.slice(-6) === searchId);
                if (match) {
                  setStaffInfo({...staffInfo, 
                    id: val, 
                    fullName: match.romajiName || match.katakanaName || staffInfo.fullName, 
                    location: match.location || staffInfo.location,
                    branchAndFarmName: (match.assignedWorkPlace && match.assignedWorkPlace.length > 0) ? match.assignedWorkPlace.join(', ') : (match.location || ''),
                    visaステータス: match.visaStatus || '',
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
              <datalist id="employeeIds">
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
                    <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">支店・農場名</label>
              <input type="text" placeholder="支店/農場" value={staffInfo.branchAndFarmName} onChange={e => setStaffInfo({...staffInfo, branchAndFarmName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
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

      {/* 案件カテゴリ Section */}
      {cases.map((caseItem, index) => (
      <div key={index} className="bg-white border border-gray-200 rounded-md mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-[#162D50] font-bold">
              <Box className="w-4 h-4 mr-2" />
              案件カテゴリ {cases.length > 1 && `#${index + 1}`}
            </div>
            {cases.length > 1 && (
              <button 
                onClick={() => removeCase(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center transition-colors">
                カテゴリを削除
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">経費の種類 <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={caseItem.expenseType}
                  onChange={(e) => updateCase(index, 'expenseType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="">種類を選択</option>
                  {options.ExpenseType.map((opt) => (
                    <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">立替者カテゴリ <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={caseItem.advancerCategory}
                  onChange={(e) => updateCase(index, 'advancerCategory', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="">カテゴリを選択</option>
                  {options.AdvancerCategory.map((opt) => (
                    <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">支払処理タイプ <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="名前を入力" 
                value={caseItem.advancerName}
                onChange={(e) => updateCase(index, 'advancerName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">負担先 <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={caseItem.bearingParty}
                  onChange={(e) => updateCase(index, 'bearingParty', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="">負担先を選択</option>
                  {options.BearingParty.map((opt) => (
                    <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">経費金額 (¥) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                value={caseItem.expense金額} 
                onChange={(e) => updateCase(index, 'expense金額', e.target.value)} 
                placeholder="金額を入力"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-900 font-medium" 
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
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">経費対象期間</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input type="date" value={caseItem.expense期間Start || ''} onChange={(e) => updateCase(index, 'expense期間Start', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
                </div>
                <span className="text-gray-500">-</span>
                <div className="relative flex-1">
                  <input type="date" value={caseItem.expense期間End || ''} onChange={(e) => updateCase(index, 'expense期間End', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-tight">注: 経費精算は通常、その月の11日から27日の間に処理されます。</p>
            </div>
          </div>

          {renderDynamicFields(caseItem.expenseType, index, caseItem)}

          {/* Bill/Receipt Upload and Remark for this case */}
          <div className="border-t border-gray-200 mt-6 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">請求書/領収書のアップロード</label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, index)} />
                  <FileText className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">ファイルをドラッグ＆ドロップするか、クリックしてアップロード</p>
                </div>
                {caseItem.receipts && caseItem.receipts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {caseItem.receipts.map((file, i) => (
                      <div key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center">
                        <FileText className="w-3 h-3 mr-1" /> {typeof file === 'string' ? (file.includes('-') ? file.split('-').slice(1).join('-') : file) : file.name}
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
                  className="w-full h-[120px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
      ))}

      {/* Summary Box & Add Case */}
      <div className="bg-white border border-gray-200 rounded-md mb-8">
        <div className="p-6">
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-6 flex justify-between items-center mb-6">
            <div>
              <div className="font-bold text-sm text-gray-800 mb-1">複数案件の概要</div>
              <div className="text-xs text-gray-500">上記すべての項目の合計</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs text-gray-800 mb-1">経費合計金額</div>
              <div className="text-2xl font-bold text-[#162D50]">¥ {totalExpense金額.toLocaleString()}</div>
            </div>
          </div>

          {/* Add Another Case Button */}
          <button 
            onClick={handleAddAnotherCase}
            className="flex items-center px-5 py-2 border border-[#162D50] text-[#162D50] rounded-md font-bold text-sm hover:bg-gray-50 transition-colors">
            + 案件を追加
          </button>
        </div>
      </div>


      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => {
            if (!staffInfo.fullName || !staffInfo.id || !staffInfo.location || staffInfo.location === '拠点を選択') {
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
          className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
          次へ <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
      </>
      )}

      {newCaseStep === 2 && (
        <>
          {/* 金額詳細 Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <Wallet className="w-4 h-4 mr-2" />
                金額詳細
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">経費合計 (¥)</label>
                  <input type="number" value={totalExpense金額} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">通貨</label>
                  <div className="relative">
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>JPY（日本円）</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">前回未精算残高 (¥)</label>
                  <input type="number" value={unsettledBalance} onChange={e => setUnsettledBalance(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">未精算残高を合計に含めますか？</label>
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
                <label className="block text-sm font-bold text-gray-700 mb-2">最終合計金額 (¥)</label>
                <div className="w-full bg-[#162D50] text-white px-4 py-3 rounded-md font-bold">
                  ¥ {finalTotal金額.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Settlement Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <Landmark className="w-4 h-4 mr-2" />
                立替者への精算
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">精算方法 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={settlementMethod} onChange={e => setSettlementMethod(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>銀行振込</option>
                      <option>現金</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">精算予定日 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="date" value={expectedSettlementDate} onChange={e => setExpectedSettlementDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <FileText className="w-4 h-4 mr-2" />
                負担先からの回収
              </div>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">回収方法 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={collectionMethod} onChange={e => setCollectionMethod(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>方法を選択</option>
                      <option>銀行振込</option>
                      <option>現金</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">分割払いプラン</label>
                  <div className="relative">
                    <select value={recoveryPlan} onChange={e => setRecoveryPlan(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>一括払い</option>
                      <option>給与控除（3ヶ月）</option>
                      <option>給与控除（6ヶ月）</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">回収開始月 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="month" value={collectionStartMonth} onChange={e => setCollectionStartMonth(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />

                  </div>
                </div>
              </div>

              {/* Navigation Buttons for Step 2 */}
              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  onClick={() => setNewCaseStep(1)}
                  className="px-8 py-2 border border-gray-300 text-gray-700 rounded-md font-bold text-sm flex items-center hover:bg-gray-50 transition-colors shadow-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> 戻る
                </button>
                <button 
                  onClick={() => {
                    if (!settlementMethod || !expectedSettlementDate || collectionMethod === '方法を選択' || !collectionStartMonth) {
                      toast.error('決済および回収の必須項目をすべて入力してください。');
                      return;
                    }
                    setNewCaseStep(3);
                  }}
                  className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
                  次へ <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {newCaseStep === 3 && (
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-8">
          <h3 className="text-[#162D50] text-xl font-bold mb-2">確認・送信</h3>
          <p className="text-gray-500 text-sm mb-8">最終送信前に、すべての案件情報をご確認ください。</p>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Left Column: 案件情報 */}
            <div>
              <h4 className="text-[#162D50] font-bold mb-4">案件情報</h4>
              <div className="bg-white border border-gray-200 rounded-md p-6 mb-4">
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">スタッフ名</span>
                    <span className="font-bold text-[#162D50]">{staffInfo.fullName || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">スタッフID</span>
                    <span className="font-bold text-[#162D50]">{staffInfo.id || "N/A"}</span>
                  </div>
                </div>
              </div>
              
              <h4 className="text-[#162D50] font-bold mb-4 mt-6">経費詳細</h4>
              <div className="space-y-4">
                {cases.map((c, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-md p-4">
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">種類</span>
                        <span className="font-bold text-[#162D50]">{c.expenseType}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">金額</span>
                        <span className="font-bold text-[#162D50]">¥ {Number(c.expense金額).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: 財務概要 */}
            <div>
              <h4 className="text-[#162D50] font-bold mb-4">財務概要</h4>
              <div className="bg-[#162D50] rounded-md p-6 text-white h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-blue-200 text-sm">合計金額</span>
                  <span className="text-2xl font-bold">¥ {finalTotal金額.toLocaleString()}</span>
                </div>
                <div className="border-t border-blue-800/50 my-2 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">精算方法</span>
                    <span className="font-medium">{settlementMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">回収方法</span>
                    <span className="font-medium">{collectionMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">回収プラン</span>
                    <span className="font-medium">{recoveryPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">開始月</span>
                    <span className="font-medium">{collectionStartMonth || "TBD"}</span>
                  </div>
                  {installments > 1 && (
                    <div className="flex justify-between items-center border-t border-blue-800/50 pt-3 mt-3">
                      <span className="text-blue-200">月次控除額（{installments}回）</span>
                      <span className="font-bold text-white text-lg">¥ {Math.ceil(monthlyDeduction).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* Navigation Buttons for Step 3 */}
          <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
            <button 
              onClick={() => setNewCaseStep(2)}
              className="px-8 py-2 border border-gray-300 text-gray-700 rounded-md font-bold text-sm flex items-center hover:bg-gray-50 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> 戻る
            </button>
            <button 
              onClick={handle送信}
              className="bg-[#0A192F] text-white px-10 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
              送信
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
