import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, CheckCircle, ChevronDown, User, Box, Image, X, Download, Loader2 } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';
import { fileUrl } from '../../utils/fileUrl.js';
import { validateExpenseAmount } from '../../utils/amountHelper.js';
import toast from 'react-hot-toast';

// Japanese translation map for dropdown option labels (keeps English values for internal logic)
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

const PAYMENT_PROCESS_OPTIONS = [
  { value: 'Transfer to the person concerned', label: '本人への振込' },
  { value: 'Salary deduction', label: '給与控除' },
  { value: 'Invoice from the client company', label: 'クライアント会社からの請求書' },
];

const getDefaultPaymentProcess = (expenseType) => {
  switch (expenseType) {
    case 'Postage':
    case 'Transportation Expenses / Flight Fare':
      return 'Transfer to the person concerned';
    case 'Visa application fee':
    case 'Waiting Dormitory Fee':
    case 'Hospital Fee':
      return 'Salary deduction';
    case 'WIFI':
      return 'Invoice from the client company';
    default:
      return '';
  }
};

const getDefaultsForExpenseType = (expenseType) => {
  switch (expenseType) {
    case 'Postage':
    case 'Transportation Expenses / Flight Fare':
      return { advancerCategory: 'Service staff', bearingParty: 'VC' };
    case 'Visa application fee':
      return { advancerCategory: 'Service staff', bearingParty: 'VC' };
    case 'Waiting Dormitory Fee':
    case 'Hospital Fee':
      return { advancerCategory: 'Service staff', bearingParty: 'Service staff' };
    case 'Equipment/Supplies':
    case 'others':
      return { advancerCategory: 'Select for each project', bearingParty: 'Select for each project' };
    case 'WIFI':
      return { advancerCategory: 'Dispatch destination: Farm', bearingParty: 'Dispatch destination: Farm' };
    default:
      return { advancerCategory: '', bearingParty: '' };
  }
};

export default function StaffClaimRequest() {
  const [options, setOptions] = useState({
    拠点: [],
    ExpenseType: [],
    AdvancerCategory: [],
    BearingParty: []
  });
  const [employees, setEmployees] = useState([]);
  const [regions, setRegions] = useState([]);
  const [postalMatrix, setPostalMatrix] = useState({});
  const [travelMatrix, setTravelMatrix] = useState({});
  const [loadingData, setLoadingData] = useState(true);

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
    receipts: [],
    // Postage
    postageFrom: '', postageTo: '',
    // Transport
    departure: '', destination: '', transportMethod: '', transportReason: '',
    // Dormitory
    dormitoryStartDate: '', dormitoryEndDate: '',
    // Hospital
    consultationDate: '', consultationFee: 0, medicineCost: 0,
    // Equipment
    itemName: '', quantity: 1, purchaseDate: '', damageReason: '',
    // WIFI
    hostCompany: '', wifiStartDate: '',
  };

  const [staffInfo, setStaffInfo] = useState({
    fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: ''
  });
  const [claims, setClaims] = useState([{ ...initialClaim }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleFileClick = (e, fileUrlStr) => {
    const base = fileUrlStr.split('?')[0];
    if (base.match(/\.(jpeg|jpg|gif|png|webp|pdf)$/i)) {
      e.preventDefault();
      setPreviewImage(fileUrlStr);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [optRes, empRes, regRes, postalRes, travelRes] = await Promise.all([
          apiFetch('/api/options'),
          apiFetch('/api/employees'),
          apiFetch('/api/regions'),
          apiFetch('/api/expenses/postal'),
          apiFetch('/api/expenses/travel'),
        ]);

        const [optData, empData, regData, postalData, travelData] = await Promise.all([
          optRes.json(),
          empRes.json(),
          regRes.json(),
          postalRes.ok ? postalRes.json() : {},
          travelRes.ok ? travelRes.json() : {},
        ]);

        // Group options — support both '拠点' and 'Location' keys
        const grouped = optData.reduce((acc, opt) => {
          const key = opt.type === 'Location' ? '拠点' : opt.type;
          if (!acc[key]) acc[key] = [];
          acc[key].push(opt);
          return acc;
        }, { 拠点: [], ExpenseType: [], AdvancerCategory: [], BearingParty: [] });

        setOptions(grouped);
        setEmployees(empData);
        setRegions(regData);
        setPostalMatrix(postalData);
        setTravelMatrix(travelData);
      } catch (err) {
        console.error('Error fetching form data:', err);
        toast.error('フォームデータの読み込みに失敗しました');
      } finally {
        setLoadingData(false);
      }
    };
    fetchAll();
  }, []);

  const autofillStaff = (emp, currentInfo = staffInfo) => {
    setStaffInfo({
      ...currentInfo,
      fullName: emp.romajiName || emp.katakanaName || currentInfo.fullName,
      id: 'ID-' + emp._id.slice(-6).toUpperCase(),
      location: emp.location || currentInfo.location,
      branchAndFarmName: emp.branchAndFarmName || emp.location || '',
      visaステータス: emp.visaステータス || emp.visaStatus || '',
      visaAvailableTime: emp.visaEndDate ? new Date(emp.visaEndDate).toISOString().split('T')[0] : '',
    });
  };

  const handleNameChange = (val) => {
    setStaffInfo(prev => ({ ...prev, fullName: val }));
    const match = employees.find(emp =>
      (emp.romajiName && emp.romajiName.toLowerCase() === val.toLowerCase()) ||
      (emp.katakanaName && emp.katakanaName === val)
    );
    if (match) autofillStaff(match, { ...staffInfo, fullName: val });
  };

  const handleIdChange = (val) => {
    setStaffInfo(prev => ({ ...prev, id: val }));
    const searchId = val.replace(/^ID-/i, '').toLowerCase();
    const match = employees.find(emp => emp._id.slice(-6).toLowerCase() === searchId);
    if (match) autofillStaff(match, { ...staffInfo, id: val });
  };

  const updateClaim = (index, field, value) => {
    const updated = [...claims];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'expenseType') {
      const defaults = getDefaultsForExpenseType(value);
      updated[index].advancerCategory = defaults.advancerCategory;
      updated[index].bearingParty = defaults.bearingParty;
      updated[index].advancerName = getDefaultPaymentProcess(value);
      updated[index].suggested金額 = 0;
    }

    // Auto-calculate postage suggested amount
    const expType = field === 'expenseType' ? value : updated[index].expenseType;
    if (expType === 'Postage' && ['postageFrom', 'postageTo', 'expenseType'].includes(field)) {
      const from = field === 'postageFrom' ? value : updated[index].postageFrom;
      const to = field === 'postageTo' ? value : updated[index].postageTo;
      if (from && to) {
        const senderId = regions.find(r => r.name1 === from)?._id;
        const recipId = regions.find(r => r.name2 === to)?._id;
        if (senderId && recipId && postalMatrix[senderId]?.[recipId]) {
          const raw = postalMatrix[senderId][recipId];
          updated[index].suggested金額 = typeof raw === 'string' ? Number(raw.replace(/,/g, '')) : raw;
        } else updated[index].suggested金額 = 0;
      }
    }

    // Auto-calculate travel suggested amount
    if (expType === 'Transportation Expenses / Flight Fare' && ['departure', 'destination', 'transportMethod', 'expenseType'].includes(field)) {
      const dep = field === 'departure' ? value : updated[index].departure;
      const dest = field === 'destination' ? value : updated[index].destination;
      const method = field === 'transportMethod' ? value : updated[index].transportMethod;
      if (dep && dest) {
        const depId = regions.find(r => r.name1 === dep)?._id;
        const destId = regions.find(r => r.name2 === dest)?._id;
        if (depId && destId && travelMatrix[depId]?.[destId]) {
          const raw = travelMatrix[depId][destId];
          let cost = 0;
          if (typeof raw === 'object') {
            const bus = raw.bus ? Number(String(raw.bus).replace(/,/g, '')) : 0;
            const flight = raw.flight ? Number(String(raw.flight).replace(/,/g, '')) : 0;
            cost = method === 'Bus' ? bus : method === 'Flight' ? flight : Math.max(bus, flight);
          } else {
            cost = typeof raw === 'string' ? Number(raw.replace(/,/g, '')) : raw;
          }
          updated[index].suggested金額 = cost || 0;
        } else updated[index].suggested金額 = 0;
      }
    }

    setClaims(updated);
  };

  const addClaim = () => setClaims([...claims, { ...initialClaim }]);
  const removeClaim = (i) => { if (claims.length > 1) setClaims(claims.filter((_, idx) => idx !== i)); };

  const handleFileUpload = async (index, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];
    const MAX = 2 * 1024 * 1024;
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) { toast.error(`無効なファイル形式: ${file.name}`); e.target.value = ''; return; }
      if (file.size > MAX) { toast.error(`ファイルが大きすぎます: ${file.name} (最大2MB)`); e.target.value = ''; return; }
    }
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    try {
      const res = await apiFetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const updated = [...claims];
        updated[index].receipts = [...updated[index].receipts, ...data.fileNames];
        setClaims(updated);
        toast.success('ファイルをアップロードしました');
      } else toast.error('アップロードに失敗しました');
    } catch { toast.error('アップロードエラーが発生しました'); }
  };

  const removeFile = (ci, fi) => {
    const updated = [...claims];
    updated[ci].receipts = updated[ci].receipts.filter((_, i) => i !== fi);
    setClaims(updated);
  };

  const renderDynamicFields = (expenseType, index, c) => {
    switch (expenseType) {
      case 'Postage':
        return (
          <div className="grid grid-cols-2 gap-6 mb-6 bg-blue-50 p-6 rounded-md border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">出発地</label>
              <input type="text" list={`from-list-${index}`} value={c.postageFrom || ''} onChange={e => updateClaim(index, 'postageFrom', e.target.value)} placeholder="送信者の詳細を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`from-list-${index}`}>{regions.map(r => <option key={r._id} value={r.name1} />)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">到着地</label>
              <input type="text" list={`to-list-${index}`} value={c.postageTo || ''} onChange={e => updateClaim(index, 'postageTo', e.target.value)} placeholder="受取人の詳細を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`to-list-${index}`}>{regions.map(r => <option key={r._id} value={r.name2} />)}</datalist>
            </div>
            {c.suggested金額 > 0 && <div className="col-span-2 text-sm text-blue-700 font-medium bg-blue-100 rounded px-3 py-2">推奨金額: ¥{c.suggested金額.toLocaleString()}</div>}
          </div>
        );
      case 'Transportation Expenses / Flight Fare':
        return (
          <div className="grid grid-cols-2 gap-6 mb-6 bg-blue-50 p-6 rounded-md border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">出発拠点</label>
              <input type="text" list={`dep-${index}`} value={c.departure || ''} onChange={e => updateClaim(index, 'departure', e.target.value)} placeholder="出発地を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`dep-${index}`}>{regions.map(r => <option key={r._id} value={r.name1} />)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">目的地</label>
              <input type="text" list={`dest-${index}`} value={c.destination || ''} onChange={e => updateClaim(index, 'destination', e.target.value)} placeholder="目的地を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              <datalist id={`dest-${index}`}>{regions.map(r => <option key={r._id} value={r.name2} />)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">交通手段</label>
              <div className="relative">
                <select value={c.transportMethod || ''} onChange={e => updateClaim(index, 'transportMethod', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700">
                  <option value="">方法を選択</option>
                  <option value="Bus">バス</option>
                  <option value="Flight">フライト</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">理由</label>
              <input type="text" value={c.transportReason || ''} onChange={e => updateClaim(index, 'transportReason', e.target.value)} placeholder="移動理由を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            {c.suggested金額 > 0 && <div className="col-span-2 text-sm text-blue-700 font-medium bg-blue-100 rounded px-3 py-2">推奨金額: ¥{c.suggested金額.toLocaleString()}</div>}
          </div>
        );
      case 'Waiting Dormitory Fee':
        return (
          <div className="grid grid-cols-2 gap-6 mb-6 bg-blue-50 p-6 rounded-md border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用開始日</label>
              <input type="date" value={c.dormitoryStartDate || ''} onChange={e => updateClaim(index, 'dormitoryStartDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用終了日</label>
              <input type="date" value={c.dormitoryEndDate || ''} onChange={e => updateClaim(index, 'dormitoryEndDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
          </div>
        );
      case 'Hospital Fee':
        return (
          <div className="grid grid-cols-3 gap-6 mb-6 bg-blue-50 p-6 rounded-md border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">診察日</label>
              <input type="date" value={c.consultationDate || ''} onChange={e => updateClaim(index, 'consultationDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">診察代 (¥)</label>
              <input type="number" min="0" value={c.consultationFee || ''} onChange={e => updateClaim(index, 'consultationFee', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">薬代 (¥)</label>
              <input type="number" min="0" value={c.medicineCost || ''} onChange={e => updateClaim(index, 'medicineCost', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>
        );
      case 'Equipment/Supplies':
        return (
          <div className="grid grid-cols-2 gap-6 mb-6 bg-blue-50 p-6 rounded-md border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">品名</label>
              <input type="text" value={c.itemName || ''} onChange={e => updateClaim(index, 'itemName', e.target.value)} placeholder="品目を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">数量</label>
              <input type="number" min="1" value={c.quantity || 1} onChange={e => updateClaim(index, 'quantity', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">購入日</label>
              <input type="date" value={c.purchaseDate || ''} onChange={e => updateClaim(index, 'purchaseDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">破損・故障などの理由</label>
              <input type="text" value={c.damageReason || ''} onChange={e => updateClaim(index, 'damageReason', e.target.value)} placeholder="理由を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>
        );
      case 'WIFI':
        return (
          <div className="grid grid-cols-2 gap-6 mb-6 bg-blue-50 p-6 rounded-md border border-blue-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">対象の受入企業/農園</label>
              <input type="text" value={c.hostCompany || ''} onChange={e => updateClaim(index, 'hostCompany', e.target.value)} placeholder="企業/農園を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">利用開始日</label>
              <input type="date" value={c.wifiStartDate || ''} onChange={e => updateClaim(index, 'wifiStartDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const totalExpense = claims.reduce((sum, c) => sum + (parseFloat(c.expense金額) || 0), 0);

  const handleSubmit = async () => {
    if (!staffInfo.fullName || !staffInfo.id || !staffInfo.location) {
      toast.error('必要なスタッフ情報（氏名・ID・拠点）をすべて入力してください。');
      return;
    }
    for (let i = 0; i < claims.length; i++) {
      const c = claims[i];
      if (!c.expenseType || !c.advancerCategory || !c.bearingParty || !c.expense金額) {
        toast.error(`案件カテゴリ #${i + 1} の必須フィールドをすべて入力してください。`);
        return;
      }
      const v = validateExpenseAmount(c.expense金額, c.suggested金額);
      if (!v.isValid) {
        toast.error(`案件 #${i + 1}: ${v.message}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      for (const c of claims) {
        const payload = {
          full_name: staffInfo.fullName,
          staff_id: staffInfo.id,
          location: staffInfo.location,
          branch_farm_name: staffInfo.branchAndFarmName || null,
          visa_status: staffInfo.visaステータス || null,
          visa_available_time: staffInfo.visaAvailableTime || null,
          expense_type: c.expenseType,
          advancer_category: c.advancerCategory,
          payment_process_types: c.advancerName || null,
          bearing_party: c.bearingParty,
          expense_amount: parseFloat(c.expense金額) || 0,
          sender: c.postageFrom || '',
          recipient: c.postageTo || '',
          departure: c.departure || '',
          destination: c.destination || '',
          transport_method: c.transportMethod || '',
          expense_period_start: c.expensePeriodStart || null,
          expense_period_end: c.expensePeriodEnd || null,
          bill_receipt_url: c.receipts || [],
          remarks: c.remark || null,
          total_expense_amount: parseFloat(c.expense金額) || 0,
          installment_count: 1,
          collection_start_month: new Date().toISOString().slice(0, 7),
          monthly_deduction: parseFloat(c.expense金額) || 0,
        };
        const res = await apiFetch('/api/claims', { method: 'POST', body: JSON.stringify(payload) });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || '請求の送信に失敗しました');
        }
      }
      setShowSuccess(true);
    } catch (err) {
      toast.error(err.message || '送信中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setShowSuccess(false);
    setClaims([{ ...initialClaim }]);
    setStaffInfo({ fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: '' });
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#162D50] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">フォームデータを読み込み中...</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-green-100 p-5 rounded-full mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">送信が完了しました！</h2>
        <p className="text-gray-500 mb-6">経費請求が送信されました。管理者が確認します。</p>
        <div className="flex gap-3">
          <button onClick={handleReset} className="bg-[#0A192F] text-white px-6 py-2.5 rounded-md hover:bg-[#162D50] transition-colors font-medium">
            別のリクエストを送信
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10 mt-6">

      {/* Staff Info Section */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="p-6">
          <div className="flex items-center text-[#162D50] font-bold mb-5 text-base">
            <User className="w-4 h-4 mr-2" /> スタッフ情報
          </div>
          <div className="grid grid-cols-3 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">氏名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="フルネームを入力"
                list="claimEmpNames"
                value={staffInfo.fullName}
                onChange={e => handleNameChange(e.target.value)}
                onBlur={() => {
                  if (staffInfo.fullName) {
                    const match = employees.find(emp =>
                      (emp.romajiName && emp.romajiName.toLowerCase() === staffInfo.fullName.toLowerCase()) ||
                      (emp.katakanaName && emp.katakanaName === staffInfo.fullName)
                    );
                    if (!match) {
                      setStaffInfo(p => ({ ...p, fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: '' }));
                      toast.error('リストから有効なスタッフを選択してください。');
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"
              />
              <datalist id="claimEmpNames">
                {employees.map(emp => <option key={emp._id} value={emp.romajiName || emp.katakanaName} />)}
              </datalist>
            </div>

            {/* Staff ID */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">スタッフID <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="ID-000000"
                list="claimEmpIds"
                value={staffInfo.id}
                onChange={e => handleIdChange(e.target.value)}
                onBlur={() => {
                  if (staffInfo.id) {
                    const searchId = staffInfo.id.replace(/^ID-/i, '').toLowerCase();
                    const match = employees.find(emp => emp._id.slice(-6).toLowerCase() === searchId);
                    if (!match) {
                      setStaffInfo(p => ({ ...p, fullName: '', id: '', location: '', branchAndFarmName: '', visaステータス: '', visaAvailableTime: '' }));
                      toast.error('有効なスタッフIDを選択してください。');
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"
              />
              <datalist id="claimEmpIds">
                {employees.map(emp => <option key={emp._id} value={'ID-' + emp._id.slice(-6).toUpperCase()} />)}
              </datalist>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">拠点 <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={staffInfo.location}
                  onChange={e => setStaffInfo(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700"
                >
                  <option value="">拠点を選択</option>
                  {options.拠点.map(opt => <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Branch / Farm */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">支店および農園名</label>
              <input type="text" placeholder="支店/農園" value={staffInfo.branchAndFarmName} onChange={e => setStaffInfo(p => ({ ...p, branchAndFarmName: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>

            {/* Visa Status */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ビザステータス</label>
              <input type="text" placeholder="ビザステータス" value={staffInfo.visaステータス} readOnly className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600 cursor-default" />
            </div>

            {/* Visa Expiry */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ビザ有効期限</label>
              <input type="date" value={staffInfo.visaAvailableTime} readOnly className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600 cursor-default" />
            </div>
          </div>
        </div>
      </div>

      {/* Claim Items */}
      {claims.map((c, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-md shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center text-[#162D50] font-bold text-base">
                <Box className="w-4 h-4 mr-2" />
                案件カテゴリ {claims.length > 1 && `#${index + 1}`}
              </div>
              {claims.length > 1 && (
                <button onClick={() => removeClaim(index)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center transition-colors">
                  <Trash2 className="w-4 h-4 mr-1" /> カテゴリを削除
                </button>
              )}
            </div>

            {/* Row 1: Expense type, Category, Payment type */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">経費の種類 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={c.expenseType} onChange={e => updateClaim(index, 'expenseType', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700">
                    <option value="">種類を選択</option>
                    {options.ExpenseType.map(opt => <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">立替カテゴリ <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={c.advancerCategory} onChange={e => updateClaim(index, 'advancerCategory', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700">
                    <option value="">カテゴリを選択</option>
                    {options.AdvancerCategory.length > 0
                      ? options.AdvancerCategory.map(opt => <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>)
                      : Object.entries(optionLabelJP).filter(([k]) => ['Service staff','VC','Dispatch destination: Farm','Select for each project'].includes(k)).map(([v, l]) => <option key={v} value={v}>{l}</option>)
                    }
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">支払い処理タイプ</label>
                <div className="relative">
                  <select value={c.advancerName} onChange={e => updateClaim(index, 'advancerName', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700">
                    <option value="">タイプを選択</option>
                    {PAYMENT_PROCESS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Bearing party, Amount, Period */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">負担者 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={c.bearingParty} onChange={e => updateClaim(index, 'bearingParty', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700">
                    <option value="">負担者を選択</option>
                    {options.BearingParty.length > 0
                      ? options.BearingParty.map(opt => <option key={opt._id} value={opt.value}>{toJP(opt.label)}</option>)
                      : Object.entries(optionLabelJP).filter(([k]) => ['Office','Staff','Host Company','VC','Service staff','Dispatch destination: Farm','Select for each project'].includes(k)).map(([v, l]) => <option key={v} value={v}>{l}</option>)
                    }
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">経費金額 (¥) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={c.expense金額}
                  onChange={e => updateClaim(index, 'expense金額', e.target.value)}
                  placeholder="金額を入力"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-900 font-medium"
                />
                {(() => {
                  const v = validateExpenseAmount(c.expense金額, c.suggested金額);
                  if (!v.isValid) return (
                    <div onClick={() => updateClaim(index, 'expense金額', c.suggested金額)} className="mt-2 text-xs text-red-600 font-medium flex items-center bg-red-50 px-3 py-1.5 rounded border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                      {v.message}（クリックして適用）
                    </div>
                  );
                  return null;
                })()}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">経費期間</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={c.expensePeriodStart || ''} onChange={e => updateClaim(index, 'expensePeriodStart', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                  <span className="text-gray-400">〜</span>
                  <input type="date" value={c.expensePeriodEnd || ''} onChange={e => updateClaim(index, 'expensePeriodEnd', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                </div>
                <p className="text-xs text-gray-400 mt-1">注：月の11日〜27日の経費に対して処理されます。</p>
              </div>
            </div>

            {/* Dynamic fields per expense type */}
            {renderDynamicFields(c.expenseType, index, c)}

            {/* File upload & Remark */}
            <div className="border-t border-gray-100 mt-4 pt-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">請求書・領収書のアップロード</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative flex flex-col items-center justify-center min-h-[110px]">
                    <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => handleFileUpload(index, e)} />
                    <FileText className="w-7 h-7 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">ファイルをドラッグ＆ドロップするかクリックしてアップロード</p>
                    <p className="text-xs text-gray-400 mt-1">JPG・PNG・PDF (最大2MB)</p>
                  </div>
                  {c.receipts.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.receipts.map((file, i) => (
                        <div key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1.5 rounded flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-500" />
                          <a href={fileUrl(file)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline max-w-[120px] truncate" onClick={e => handleFileClick(e, fileUrl(file))}>
                            {typeof file === 'string' ? file.split('-').slice(1).join('-') : file.name}
                          </a>
                          <button onClick={() => removeFile(index, i)} className="ml-1 text-red-500 hover:text-red-700">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">備考</label>
                  <textarea
                    value={c.remark || ''}
                    onChange={e => updateClaim(index, 'remark', e.target.value)}
                    placeholder="この案件に関する追加の詳細や備考を入力してください..."
                    className="w-full h-[110px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] resize-none text-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Summary & Actions */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="p-6">
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-5 flex justify-between items-center mb-6">
            <div>
              <div className="font-bold text-sm text-gray-800 mb-1">複数案件サマリー</div>
              <div className="text-xs text-gray-500">上記すべての項目の合計金額 ({claims.length}件)</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs text-gray-500 mb-1">経費合計金額</div>
              <div className="text-2xl font-bold text-[#162D50]">¥ {totalExpense.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button onClick={addClaim} className="flex items-center px-5 py-2.5 border border-[#162D50] text-[#162D50] rounded-md font-bold text-sm hover:bg-gray-50 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> 別の案件を追加
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm hover:bg-[#162D50] transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? '送信中...' : 'リクエストを送信'}
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-base font-semibold text-gray-800 flex items-center">
                <Image className="w-4 h-4 mr-2 text-blue-600" /> ファイルプレビュー
              </h3>
              <button onClick={() => setPreviewImage(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-100/50 flex items-center justify-center min-h-[300px]">
              {previewImage.split('?')[0].match(/\.pdf$/i)
                ? <iframe src={previewImage} title="PDF Preview" className="w-full h-[65vh] rounded border border-gray-200 shadow-sm bg-white" />
                : <img src={previewImage} alt="Preview" className="max-w-full max-h-[65vh] object-contain rounded border border-gray-200 shadow-sm bg-white" />
              }
            </div>
            <div className="px-5 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button onClick={() => setPreviewImage(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">閉じる</button>
              <a href={previewImage} download target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" /> ダウンロード
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
