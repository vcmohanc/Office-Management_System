import { useState } from 'react';
import { User, ChevronDown, Box, Calendar, UploadCloud, ArrowRight, Wallet, Landmark, FileText, ArrowLeft, Image } from 'lucide-react';

export default function NewCase() {
  const [newCaseStep, setNewCaseStep] = useState(1);
  const [cases, setCases] = useState([{
    id: 1,
    expenseType: 'Select Type',
    advancerCategory: 'Select Category',
    bearingParty: 'Select Bearing Party',
    expenseAmount: 0,
    advancerName: ''
  }]);
  
  const [staffInfo, setStaffInfo] = useState({ fullName: '', id: '', location: '' });
  const [unsettledBalance, setUnsettledBalance] = useState(0);
  const [includeBalance, setIncludeBalance] = useState(false);
  const [settlementMethod, setSettlementMethod] = useState('Bank Transfer');
  const [recoveryPlan, setRecoveryPlan] = useState('Payroll Deduction (3 Months)');
  const [expectedSettlementDate, setExpectedSettlementDate] = useState('');
  const [collectionMethod, setCollectionMethod] = useState('Select Method');
  const [collectionStartMonth, setCollectionStartMonth] = useState('');

  const updateCase = (index, field, value) => {
    const newCases = [...cases];
    newCases[index][field] = value;
    setCases(newCases);
  };

  const handleAddAnotherCase = () => {
    setCases([...cases, {
      id: Date.now(),
      expenseType: 'Select Type',
      advancerCategory: 'Select Category',
      bearingParty: 'Select Bearing Party',
      expenseAmount: 0,
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

  const totalExpenseAmount = cases.reduce((sum, c) => sum + Number(c.expenseAmount || 0), 0);
  const finalTotalAmount = totalExpenseAmount + (includeBalance ? unsettledBalance : 0);

  let installments = 1;
  if (recoveryPlan.includes('3 Months')) installments = 3;
  else if (recoveryPlan.includes('6 Months')) installments = 6;
  const monthlyDeduction = finalTotalAmount / installments;

  const handleSubmit = async () => {
    try {
      const submissions = cases.map(caseItem => {
        const payload = {
          staffName: staffInfo.fullName || "N/A",
          staffId: staffInfo.id || "N/A",
          location: staffInfo.location || "N/A",
          expenseType: caseItem.expenseType,
          advancerCategory: caseItem.advancerCategory,
          advancerName: caseItem.advancerName || "N/A",
          bearingParty: caseItem.bearingParty,
          amount: Number(caseItem.expenseAmount) || 0,
          expensePeriodStart: caseItem.expensePeriodStart || new Date().toISOString(),
          expensePeriodEnd: caseItem.expensePeriodEnd || new Date().toISOString(),
          receipts: (caseItem.receipts || []).map(f => f.name),
          remark: caseItem.remark || "",
          totalExpense: totalExpenseAmount,
          currency: 'JPY',
          previousBalance: unsettledBalance,
          includeBalance: includeBalance,
          finalTotal: finalTotalAmount,
          settlementMethod: settlementMethod,
          expectedSettlementDate: expectedSettlementDate || new Date().toISOString(),
          collectionMethod: collectionMethod,
          installmentPlan: recoveryPlan,
          collectionStartMonth: collectionStartMonth || "TBD",
          status: 'Pending'
        };

        return fetch('http://localhost:5000/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      });

      await Promise.all(submissions);
      alert(`Successfully Submitted ${cases.length} Cases to Database!`);
      
      // Reset form
      setNewCaseStep(1);
      setCases([{
        id: Date.now(),
        expenseType: 'Select Type',
        advancerCategory: 'Select Category',
        bearingParty: 'Select Bearing Party',
        expenseAmount: 0,
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
      alert("Failed to submit cases. Check console for details.");
    }
  };

  const renderDynamicFields = (type, index, caseItem) => {
    switch (type) {
      case 'Postage':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sender</label>
              <input type="text" value={caseItem.sender || ''} onChange={(e) => updateCase(index, 'sender', e.target.value)} placeholder="Enter sender" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Recipient</label>
              <input type="text" value={caseItem.recipient || ''} onChange={(e) => updateCase(index, 'recipient', e.target.value)} placeholder="Enter recipient" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>
        );
      case 'Transportation Expenses / Flight Fare':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Departure Location</label>
              <input type="text" value={caseItem.departure || ''} onChange={(e) => updateCase(index, 'departure', e.target.value)} placeholder="Enter departure" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Destination</label>
              <input type="text" value={caseItem.destination || ''} onChange={(e) => updateCase(index, 'destination', e.target.value)} placeholder="Enter destination" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Date Used</label>
              <div className="relative">
                <input type="text" value={caseItem.dateUsed || ''} onChange={(e) => updateCase(index, 'dateUsed', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Mode of Transportation</label>
              <input type="text" value={caseItem.transportMode || ''} onChange={(e) => updateCase(index, 'transportMode', e.target.value)} placeholder="e.g. Train, Flight" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>
        );
      case 'Waiting Dormitory Fee':
        return (
          <div className="grid grid-cols-3 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Dormitory Name</label>
              <input type="text" value={caseItem.dormitoryName || ''} onChange={(e) => updateCase(index, 'dormitoryName', e.target.value)} placeholder="Enter name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Usage Start Date</label>
              <div className="relative">
                <input type="text" value={caseItem.dormitoryStartDate || ''} onChange={(e) => updateCase(index, 'dormitoryStartDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Usage End Date</label>
              <div className="relative">
                <input type="text" value={caseItem.dormitoryEndDate || ''} onChange={(e) => updateCase(index, 'dormitoryEndDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
          </div>
        );
      case 'Hospital Fee':
        return (
          <div className="grid grid-cols-3 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Consultation Date</label>
              <div className="relative">
                <input type="text" value={caseItem.consultationDate || ''} onChange={(e) => updateCase(index, 'consultationDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Consultation Fee</label>
              <input type="number" value={caseItem.consultationFee || 0} onChange={(e) => updateCase(index, 'consultationFee', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Medicine Cost</label>
              <input type="number" value={caseItem.medicineCost || 0} onChange={(e) => updateCase(index, 'medicineCost', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
          </div>
        );
      case 'Equipment/Supplies':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
              <input type="text" value={caseItem.itemName || ''} onChange={(e) => updateCase(index, 'itemName', e.target.value)} placeholder="Enter item" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Quantity</label>
              <input type="number" value={caseItem.quantity || 1} onChange={(e) => updateCase(index, 'quantity', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Purchase Date</label>
              <div className="relative">
                <input type="text" value={caseItem.purchaseDate || ''} onChange={(e) => updateCase(index, 'purchaseDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Reason for damage, malfunction, shortage, etc.</label>
              <textarea value={caseItem.damageReason || ''} onChange={(e) => updateCase(index, 'damageReason', e.target.value)} placeholder="Enter reason" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"></textarea>
            </div>
          </div>
        );
      case 'WIFI':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Target Host Company / Farm</label>
              <input type="text" value={caseItem.hostCompany || ''} onChange={(e) => updateCase(index, 'hostCompany', e.target.value)} placeholder="Enter company/farm" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Usage Start Date</label>
              <div className="relative">
                <input type="text" value={caseItem.wifiStartDate || ''} onChange={(e) => updateCase(index, 'wifiStartDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header and Stepper */}
      <div className="flex justify-between items-start pt-2">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-2">New Case Registration</h2>
          <p className="text-gray-500 text-sm">Register a new advance or settlement case with relevant financial details.</p>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium mt-2">
          <div className="flex items-center text-[#162D50]">
            <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">1</div>
            Case Details
          </div>
          <div className={`w-16 h-px ${newCaseStep >= 2 ? 'bg-[#162D50]' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${newCaseStep >= 2 ? 'text-[#162D50]' : 'text-gray-400'}`}>
            {newCaseStep >= 2 && (
              <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">2</div>
            )}
            Expense Details
          </div>
          <div className={`w-16 h-px ${newCaseStep >= 3 ? 'bg-[#162D50]' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${newCaseStep >= 3 ? 'text-[#162D50]' : 'text-gray-400'}`}>
            {newCaseStep >= 3 ? (
              <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">3</div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mr-2">3</div>
            )}
            Confirmation
          </div>
        </div>
      </div>

      {newCaseStep === 1 && (
        <>
          {/* Staff Information Section */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="p-6">
          <div className="flex items-center text-[#162D50] font-bold mb-4">
            <User className="w-4 h-4 mr-2" />
            Staff Information
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Enter full name" value={staffInfo.fullName} onChange={e => setStaffInfo({...staffInfo, fullName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Staff ID <span className="text-red-500">*</span></label>
              <input type="text" placeholder="ID-00000" value={staffInfo.id} onChange={e => setStaffInfo({...staffInfo, id: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
              <div className="relative">
                <select value={staffInfo.location} onChange={e => setStaffInfo({...staffInfo, location: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option>Select Location</option>
                  <option>Tokyo Office</option>
                  <option>Osaka Office</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Category Section */}
      {cases.map((caseItem, index) => (
      <div key={index} className="bg-white border border-gray-200 rounded-md mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-[#162D50] font-bold">
              <Box className="w-4 h-4 mr-2" />
              Case Category {cases.length > 1 && `#${index + 1}`}
            </div>
            {cases.length > 1 && (
              <button 
                onClick={() => removeCase(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center transition-colors">
                Delete Category
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Expense Type <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={caseItem.expenseType}
                  onChange={(e) => updateCase(index, 'expenseType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option>Select Type</option>
                  <option>Postage</option>
                  <option>Transportation Expenses / Flight Fare</option>
                  <option>Waiting Dormitory Fee</option>
                  <option>Hospital Fee</option>
                  <option>Equipment/Supplies</option>
                  <option>WIFI</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Advancer Category <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={caseItem.advancerCategory}
                  onChange={(e) => updateCase(index, 'advancerCategory', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option>Select Category</option>
                  <option>Office</option>
                  <option>Staff</option>
                  <option>Host Company</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Advancer Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="Enter name" 
                value={caseItem.advancerName}
                onChange={(e) => updateCase(index, 'advancerName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bearing Party <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={caseItem.bearingParty}
                  onChange={(e) => updateCase(index, 'bearingParty', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option>Select Bearing Party</option>
                  <option>Office</option>
                  <option>Staff</option>
                  <option>Host Company</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Expense Amount (¥) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                value={caseItem.expenseAmount} 
                onChange={(e) => updateCase(index, 'expenseAmount', e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Expense Period</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input type="text" placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                </div>
                <span className="text-gray-500">-</span>
                <div className="relative flex-1">
                  <input type="text" placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-tight">Note: Claims are typically processed for expenses between the 11th and 27th of the month.</p>
            </div>
          </div>

          {renderDynamicFields(caseItem.expenseType, index, caseItem)}

          {/* Bill/Receipt Upload and Remark for this case */}
          <div className="border-t border-gray-200 mt-6 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bill / Receipt Upload</label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const newCases = [...cases];
                    newCases[index].receipts = [...(newCases[index].receipts || []), ...files];
                    setCases(newCases);
                  }} />
                  <FileText className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Drag and drop files or click to upload</p>
                </div>
                {caseItem.receipts && caseItem.receipts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {caseItem.receipts.map((file, i) => (
                      <div key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center">
                        <FileText className="w-3 h-3 mr-1" /> {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Remarks</label>
                <textarea 
                  value={caseItem.remark || ''} 
                  onChange={(e) => updateCase(index, 'remark', e.target.value)}
                  placeholder="Enter any additional details or remarks for this case..." 
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
              <div className="font-bold text-sm text-gray-800 mb-1">Multiple Case Summary</div>
              <div className="text-xs text-gray-500">Total calculation of all items above</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs text-gray-800 mb-1">Total Expense Amount</div>
              <div className="text-2xl font-bold text-[#162D50]">¥ {totalExpenseAmount.toLocaleString()}</div>
            </div>
          </div>

          {/* Add Another Case Button */}
          <button 
            onClick={handleAddAnotherCase}
            className="flex items-center px-5 py-2 border border-[#162D50] text-[#162D50] rounded-md font-bold text-sm hover:bg-gray-50 transition-colors">
            + Add Another Case
          </button>
        </div>
      </div>


      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => {
            if (!staffInfo.fullName || !staffInfo.id || !staffInfo.location || staffInfo.location === 'Select Location') {
              alert('Please fill out all required Staff Information fields.');
              return;
            }
            for (let i = 0; i < cases.length; i++) {
              const c = cases[i];
              if (c.expenseType === 'Select Type' || c.advancerCategory === 'Select Category' || c.bearingParty === 'Select Bearing Party' || !c.expenseAmount) {
                alert(`Please fill out all required fields for Case Category #${i+1}.`);
                return;
              }
              if (c.advancerCategory !== 'Office' && !c.advancerName) {
                alert(`Please provide the Advancer Name for Case Category #${i+1}.`);
                return;
              }
            }
            setNewCaseStep(2);
          }}
          className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
      </>
      )}

      {newCaseStep === 2 && (
        <>
          {/* Amount Details Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <Wallet className="w-4 h-4 mr-2" />
                Amount Details
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Total Expense (¥)</label>
                  <input type="number" value={totalExpenseAmount} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                  <div className="relative">
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>JPY (Japanese Yen)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Previous Unsettled Balance (¥)</label>
                  <input type="number" value={unsettledBalance} onChange={e => setUnsettledBalance(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Add unsettled balance to the total?</label>
                  <div className="flex items-center mt-3">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle" checked={includeBalance} onChange={e => setIncludeBalance(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                      <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                    <span className="text-gray-500 text-sm font-medium">Include balance</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Final Total Amount (¥)</label>
                <div className="w-full bg-[#162D50] text-white px-4 py-3 rounded-md font-bold">
                  ¥ {finalTotalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Settlement Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <Landmark className="w-4 h-4 mr-2" />
                Settlement to Advancer
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Settlement Method <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={settlementMethod} onChange={e => setSettlementMethod(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>Bank Transfer</option>
                      <option>Cash</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Expected Settlement Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" value={expectedSettlementDate} onChange={e => setExpectedSettlementDate(e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                    <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
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
                Collection from Bearing Party
              </div>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Collection Method <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={collectionMethod} onChange={e => setCollectionMethod(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>Select Method</option>
                      <option>Bank Transfer</option>
                      <option>Cash</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Installment Plan</label>
                  <div className="relative">
                    <select value={recoveryPlan} onChange={e => setRecoveryPlan(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>Single Payment</option>
                      <option>Payroll Deduction (3 Months)</option>
                      <option>Payroll Deduction (6 Months)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Collection Start Month <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" value={collectionStartMonth} onChange={e => setCollectionStartMonth(e.target.value)} placeholder="YYYY-MM" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                    <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                  </div>
                </div>
              </div>

              {/* Navigation Buttons for Step 2 */}
              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  onClick={() => setNewCaseStep(1)}
                  className="px-8 py-2 border border-gray-300 text-gray-700 rounded-md font-bold text-sm flex items-center hover:bg-gray-50 transition-colors shadow-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button 
                  onClick={() => {
                    if (!settlementMethod || !expectedSettlementDate || collectionMethod === 'Select Method' || !collectionStartMonth) {
                      alert('Please fill out all required Settlement and Collection fields.');
                      return;
                    }
                    setNewCaseStep(3);
                  }}
                  className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {newCaseStep === 3 && (
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-8">
          <h3 className="text-[#162D50] text-xl font-bold mb-2">Confirmation & Submission</h3>
          <p className="text-gray-500 text-sm mb-8">Please review all case information before final submission.</p>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Left Column: Case Information */}
            <div>
              <h4 className="text-[#162D50] font-bold mb-4">Case Information</h4>
              <div className="bg-white border border-gray-200 rounded-md p-6 mb-4">
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Staff Name</span>
                    <span className="font-bold text-[#162D50]">{staffInfo.fullName || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Staff ID</span>
                    <span className="font-bold text-[#162D50]">{staffInfo.id || "N/A"}</span>
                  </div>
                </div>
              </div>
              
              <h4 className="text-[#162D50] font-bold mb-4 mt-6">Expense Details</h4>
              <div className="space-y-4">
                {cases.map((c, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-md p-4">
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Type</span>
                        <span className="font-bold text-[#162D50]">{c.expenseType}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-bold text-[#162D50]">¥ {Number(c.expenseAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Financial Overview */}
            <div>
              <h4 className="text-[#162D50] font-bold mb-4">Financial Overview</h4>
              <div className="bg-[#162D50] rounded-md p-6 text-white h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-blue-200 text-sm">Total Amount</span>
                  <span className="text-2xl font-bold">¥ {finalTotalAmount.toLocaleString()}</span>
                </div>
                <div className="border-t border-blue-800/50 my-2 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Method</span>
                    <span className="font-medium">{settlementMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Collection</span>
                    <span className="font-medium">{collectionMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Recovery</span>
                    <span className="font-medium">{recoveryPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Start Month</span>
                    <span className="font-medium">{collectionStartMonth || "TBD"}</span>
                  </div>
                  {installments > 1 && (
                    <div className="flex justify-between items-center border-t border-blue-800/50 pt-3 mt-3">
                      <span className="text-blue-200">Monthly Deduction ({installments}x)</span>
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
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <button 
              onClick={handleSubmit}
              className="bg-[#0A192F] text-white px-10 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
