import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Plus, Trash2, CheckCircle, ChevronDown, User, Box } from 'lucide-react';

export default function StaffClaimRequest() {
  const [options, setOptions] = useState({
    Location: [],
    ExpenseType: [],
    AdvancerCategory: [],
    BearingParty: []
  });

  const [staffInfo, setStaffInfo] = useState({
    fullName: '',
    id: '',
    location: ''
  });

  const initialClaim = {
    expenseType: '',
    advancerCategory: '',
    advancerName: '',
    bearingParty: '',
    expenseAmount: '',
    expensePeriodStart: '',
    expensePeriodEnd: '',
    remark: '',
    receipts: []
  };

  const [claims, setClaims] = useState([{ ...initialClaim }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/options');
        const data = await response.json();
        
        const groupedOptions = data.reduce((acc, opt) => {
          if (!acc[opt.type]) acc[opt.type] = [];
          acc[opt.type].push(opt);
          return acc;
        }, { Location: [], ExpenseType: [], AdvancerCategory: [], BearingParty: [] });

        setOptions(groupedOptions);
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };
    fetchOptions();
  }, []);

  const updateClaim = (index, field, value) => {
    const updatedClaims = [...claims];
    updatedClaims[index][field] = value;
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

  const handleFileUpload = (index, e) => {
    const files = Array.from(e.target.files);
    const fileNames = files.map(f => f.name);
    
    const updatedClaims = [...claims];
    updatedClaims[index].receipts = [...updatedClaims[index].receipts, ...fileNames];
    setClaims(updatedClaims);
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
              <label className="block text-sm font-bold text-gray-700 mb-2">From</label>
              <input type="text" value={claimItem.postageFrom || ''} onChange={(e) => updateClaim(index, 'postageFrom', e.target.value)} placeholder="Enter sender details" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">To</label>
              <input type="text" value={claimItem.postageTo || ''} onChange={(e) => updateClaim(index, 'postageTo', e.target.value)} placeholder="Enter recipient details" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>
        );
      case 'Transportation Expenses / Flight Fare':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Departure Route / Method</label>
              <input type="text" value={claimItem.departureRoute || ''} onChange={(e) => updateClaim(index, 'departureRoute', e.target.value)} placeholder="Enter departure details" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Return Route / Method</label>
              <input type="text" value={claimItem.returnRoute || ''} onChange={(e) => updateClaim(index, 'returnRoute', e.target.value)} placeholder="Enter return details" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Reason</label>
              <textarea value={claimItem.transportReason || ''} onChange={(e) => updateClaim(index, 'transportReason', e.target.value)} placeholder="Enter reason for travel" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"></textarea>
            </div>
          </div>
        );
      case 'Waiting Dormitory Fee':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Usage Start Date</label>
              <div className="relative">
                <input type="text" value={claimItem.dormitoryStartDate || ''} onChange={(e) => updateClaim(index, 'dormitoryStartDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Usage End Date</label>
              <div className="relative">
                <input type="text" value={claimItem.dormitoryEndDate || ''} onChange={(e) => updateClaim(index, 'dormitoryEndDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
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
                <input type="text" value={claimItem.consultationDate || ''} onChange={(e) => updateClaim(index, 'consultationDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Consultation Fee</label>
              <input type="number" value={claimItem.consultationFee || 0} onChange={(e) => updateClaim(index, 'consultationFee', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Medicine Cost</label>
              <input type="number" value={claimItem.medicineCost || 0} onChange={(e) => updateClaim(index, 'medicineCost', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
          </div>
        );
      case 'Equipment/Supplies':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
              <input type="text" value={claimItem.itemName || ''} onChange={(e) => updateClaim(index, 'itemName', e.target.value)} placeholder="Enter item" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Quantity</label>
              <input type="number" value={claimItem.quantity || 1} onChange={(e) => updateClaim(index, 'quantity', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Purchase Date</label>
              <div className="relative">
                <input type="text" value={claimItem.purchaseDate || ''} onChange={(e) => updateClaim(index, 'purchaseDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Reason for damage, malfunction, shortage, etc.</label>
              <textarea value={claimItem.damageReason || ''} onChange={(e) => updateClaim(index, 'damageReason', e.target.value)} placeholder="Enter reason" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"></textarea>
            </div>
          </div>
        );
      case 'WIFI':
        return (
          <div className="grid grid-cols-2 gap-6 mb-8 bg-blue-50 p-6 rounded-md">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Target Host Company / Farm</label>
              <input type="text" value={claimItem.hostCompany || ''} onChange={(e) => updateClaim(index, 'hostCompany', e.target.value)} placeholder="Enter company/farm" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Usage Start Date</label>
              <div className="relative">
                <input type="text" value={claimItem.wifiStartDate || ''} onChange={(e) => updateClaim(index, 'wifiStartDate', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const totalExpenseAmount = claims.reduce((sum, claim) => {
    const amt = parseFloat(claim.expenseAmount);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validate
      if (!staffInfo.fullName || !staffInfo.id || !staffInfo.location) {
        alert('Please fill out all required Staff Information fields.');
        setIsSubmitting(false);
        return;
      }

      for (let i = 0; i < claims.length; i++) {
        const c = claims[i];
        if (!c.expenseType || !c.advancerCategory || !c.bearingParty || !c.expenseAmount) {
          alert(`Please fill out all required fields for Case Category #${i + 1}.`);
          setIsSubmitting(false);
          return;
        }
      }

      // Submit all claims
      for (const claim of claims) {
        const payload = {
          staffInfo,
          ...claim
        };
        const response = await fetch('http://localhost:5000/api/claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
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
      alert('An error occurred while submitting. Please try again.');
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
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">Submitted Successfully!</h2>
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
                  <option value="">Select Location</option>
                  {options.Location.map((opt) => (
                    <option key={opt._id} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
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
              Case Category {claims.length > 1 && `#${index + 1}`}
            </div>
            {claims.length > 1 && (
              <button 
                onClick={() => removeClaim(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center transition-colors">
                <Trash2 className="w-4 h-4 mr-1" /> Delete Category
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Expense Type <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  value={claimItem.expenseType}
                  onChange={(e) => updateClaim(index, 'expenseType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option value="">Select Type</option>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Advancer Name <span className="text-red-500">*</span></label>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Expense Amount (¥) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                value={claimItem.expenseAmount} 
                onChange={(e) => updateClaim(index, 'expenseAmount', e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Expense Period</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input type="text" value={claimItem.expensePeriodStart} onChange={(e) => updateClaim(index, 'expensePeriodStart', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                </div>
                <span className="text-gray-500">-</span>
                <div className="relative flex-1">
                  <input type="text" value={claimItem.expensePeriodEnd} onChange={(e) => updateClaim(index, 'expensePeriodEnd', e.target.value)} placeholder="YYYY / MM / DD" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 text-sm" />
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-tight">Note: Claims are typically processed for expenses between the 11th and 27th of the month.</p>
            </div>
          </div>

          {renderDynamicFields(claimItem.expenseType, index, claimItem)}

          {/* Bill/Receipt Upload and Remark for this case */}
          <div className="border-t border-gray-200 mt-6 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bill / Receipt Upload</label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative flex flex-col items-center justify-center min-h-[120px]">
                  <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(index, e)} />
                  <FileText className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Drag and drop files or click to upload</p>
                </div>
                {claimItem.receipts && claimItem.receipts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {claimItem.receipts.map((file, i) => (
                      <div key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center">
                        <FileText className="w-3 h-3 mr-1" /> {file}
                        <button onClick={() => removeFile(index, i)} className="ml-2 text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Remarks</label>
                <textarea 
                  value={claimItem.remark || ''} 
                  onChange={(e) => updateClaim(index, 'remark', e.target.value)}
                  placeholder="Enter any additional details or remarks for this case..." 
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
              <div className="font-bold text-xs text-gray-800 mb-1">Total Expense Amount</div>
              <div className="text-2xl font-bold text-[#162D50]">¥ {totalExpenseAmount.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button 
              onClick={handleAddAnotherClaim}
              className="flex items-center px-5 py-2 border border-[#162D50] text-[#162D50] rounded-md font-bold text-sm hover:bg-gray-50 transition-colors">
              + Add Another Case
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm hover:bg-[#162D50] transition-colors shadow-sm disabled:opacity-70">
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
