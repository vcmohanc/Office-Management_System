import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { 
  Building2, 
  CreditCard, 
  FileText, 
  Upload, 
  AlertCircle, 
  Save, 
  CheckCircle,
  Flag,
  ArrowLeft,
  Banknote
} from 'lucide-react';

// Zod Validation Schema
const settlementSchema = z.object({
  paymentDate: z.string().min(1, 'Payment Date is required'),
  settlementMethod: z.enum(['Bank Transfer (Furikomi)', 'Cash Voucher', 'Corporate Card', 'Payroll Deduction']),
  
  // Conditional fields will be validated conditionally below
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  accountType: z.enum(['Ordinary', 'Current']).optional(),
  accountNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  
  payrollCycle: z.string().optional(),
  installmentPlan: z.string().optional(),
  
  referenceNumber: z.string().optional(),
  issuerName: z.string().optional(),
  
  deductions: z.number().min(0, 'Deductions cannot be negative'),
  transactionReference: z.string().min(1, 'Transaction Reference ID is required'),
  accountingRemarks: z.string().optional(),
  isConfirmed: z.literal(true, {
    errorMap: () => ({ message: "You must confirm the settlement to proceed" })
  }),
});

export default function PaymentEntryForm({ caseData, onBack, onSuccess }) {
  // Mock initial case data if not provided
  const data = caseData || {
    id: 'CAS-100234',
    staffId: 'EMP-892',
    staffName: 'Yuki Tanaka',
    expenseType: 'Relocation Advance',
    officeLocation: 'Tokyo HQ',
    approvedAmount: 450000,
  };

  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    settlementMethod: 'Bank Transfer (Furikomi)',
    bankName: '',
    branchName: '',
    accountType: 'Ordinary',
    accountNumber: '',
    accountHolderName: '',
    payrollCycle: '',
    installmentPlan: '',
    referenceNumber: '',
    issuerName: '',
    deductions: 0,
    transactionReference: '',
    accountingRemarks: '',
    isConfirmed: false,
  });

  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const netSettledAmount = data.approvedAmount - (Number(formData.deductions) || 0);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    try {
      // Base validation
      settlementSchema.parse(formData);
      const newErrors = {};
      
      // Conditional validation
      if (formData.settlementMethod === 'Bank Transfer (Furikomi)') {
        if (!formData.bankName) newErrors.bankName = 'Bank Name is required';
        if (!formData.branchName) newErrors.branchName = 'Branch Name is required';
        if (!formData.accountNumber) newErrors.accountNumber = 'Account Number is required';
        if (!formData.accountHolderName) newErrors.accountHolderName = 'Account Holder Name is required';
      } else if (formData.settlementMethod === 'Payroll Deduction') {
        if (!formData.payrollCycle) newErrors.payrollCycle = 'Payroll Cycle is required';
        if (!formData.installmentPlan) newErrors.installmentPlan = 'Installment Plan is required';
      } else {
        if (!formData.referenceNumber) newErrors.referenceNumber = 'Reference Number is required';
        if (!formData.issuerName) newErrors.issuerName = 'Issuer is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return false;
      }
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = {};
        err.errors.forEach(error => {
          fieldErrors[error.path[0]] = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Create FormData payload
      const payload = new FormData();
      payload.append('caseId', data.id);
      Object.keys(formData).forEach(key => {
        payload.append(key, formData[key]);
      });
      payload.append('netSettledAmount', netSettledAmount);
      if (file) {
        payload.append('proofDocument', file);
      }

      // Mock API Call
      // await fetch(`/api/cases/${data.id}/settle`, { method: 'POST', body: payload });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Settlement processed successfully!');
      if (onSuccess) onSuccess();
      if (onBack) onBack();
    } catch (error) {
      console.error('Submission failed', error);
      alert('Failed to process settlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      // Mock API call to save draft
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Draft saved successfully!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlagForAdjustment = async () => {
    if (!flagReason.trim()) {
      alert('Please provide a reason for flagging.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Mock API call to flag case
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Case flagged for adjustment successfully!');
      setShowFlagModal(false);
      if (onBack) onBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center text-[#162D50] hover:underline font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to List
        </button>
      )}

      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-1">Process Payment Settlement</h2>
          <p className="text-gray-500 text-sm">Review case details and record settlement information.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </button>
          <button 
            type="button"
            onClick={() => setShowFlagModal(true)}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 border border-yellow-400 text-yellow-700 bg-yellow-50 rounded-md font-bold text-sm hover:bg-yellow-100 transition-colors"
          >
            <Flag className="w-4 h-4 mr-2" />
            Flag for Adjustment
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section A: Case Context */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#162D50] px-6 py-3 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Section A: Case Context
            </h3>
            <span className="bg-blue-900 text-blue-100 px-2 py-0.5 rounded text-xs font-medium">Read Only</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Case ID</p>
              <p className="font-bold text-[#162D50]">{data.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Staff ID & Name</p>
              <p className="font-bold text-[#162D50]">{data.staffId} - {data.staffName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Expense Type</p>
              <p className="font-bold text-gray-800">{data.expenseType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Office Location</p>
              <p className="font-bold text-gray-800">{data.officeLocation}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 font-medium mb-1">Approved Amount</p>
              <p className="text-2xl font-black text-green-600">¥{data.approvedAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Section B: Settlement Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#F8F9FA] px-6 py-3 border-b border-gray-200">
            <h3 className="text-[#162D50] font-bold text-sm flex items-center">
              <Building2 className="w-4 h-4 mr-2" /> Section B: Settlement Configuration
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Payment Date</label>
              <input 
                type="date" 
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.paymentDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.paymentDate && <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Settlement Method</label>
              <select 
                name="settlementMethod"
                value={formData.settlementMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"
              >
                <option value="Bank Transfer (Furikomi)">Bank Transfer (Furikomi)</option>
                <option value="Cash Voucher">Cash Voucher</option>
                <option value="Corporate Card">Corporate Card</option>
                <option value="Payroll Deduction">Payroll Deduction</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section C: Dynamic Payment Destination */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#F8F9FA] px-6 py-3 border-b border-gray-200">
            <h3 className="text-[#162D50] font-bold text-sm flex items-center">
              <CreditCard className="w-4 h-4 mr-2" /> Section C: Payment Destination
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.settlementMethod === 'Bank Transfer (Furikomi)' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bank Name</label>
                  <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="e.g., MUFG Bank" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.bankName ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Branch Name / Code</label>
                  <input type="text" name="branchName" value={formData.branchName} onChange={handleInputChange} placeholder="e.g., Shibuya Branch / 134" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.branchName ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.branchName && <p className="text-red-500 text-xs mt-1">{errors.branchName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Account Type</label>
                  <select name="accountType" value={formData.accountType} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]">
                    <option value="Ordinary">Ordinary (Futsu)</option>
                    <option value="Current">Current (Toza)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Account Number</label>
                  <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} placeholder="7-digit number" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Account Holder Name</label>
                  <input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleInputChange} placeholder="e.g., TANAKA YUKI" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.accountHolderName ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.accountHolderName && <p className="text-red-500 text-xs mt-1">{errors.accountHolderName}</p>}
                </div>
              </>
            )}

            {formData.settlementMethod === 'Payroll Deduction' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Payroll Cycle / Month</label>
                  <input type="month" name="payrollCycle" value={formData.payrollCycle} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.payrollCycle ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.payrollCycle && <p className="text-red-500 text-xs mt-1">{errors.payrollCycle}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Installment Plan</label>
                  <input type="text" name="installmentPlan" value={formData.installmentPlan} onChange={handleInputChange} placeholder="e.g., Month 1 of 3" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.installmentPlan ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.installmentPlan && <p className="text-red-500 text-xs mt-1">{errors.installmentPlan}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Calculated Monthly Deduction</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-lg font-bold text-red-600">- ¥{data.approvedAmount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Full amount selected for this cycle. Adjust if needed.</p>
                  </div>
                </div>
              </>
            )}

            {(formData.settlementMethod === 'Cash Voucher' || formData.settlementMethod === 'Corporate Card') && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Voucher / Card Reference Number</label>
                  <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleInputChange} placeholder="Reference Number" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.referenceNumber ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.referenceNumber && <p className="text-red-500 text-xs mt-1">{errors.referenceNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Issuer / Disbursing Staff</label>
                  <input type="text" name="issuerName" value={formData.issuerName} onChange={handleInputChange} placeholder="Staff Name" className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.issuerName ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.issuerName && <p className="text-red-500 text-xs mt-1">{errors.issuerName}</p>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section D: Financial Reconciliation & Deductions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#F8F9FA] px-6 py-3 border-b border-gray-200">
            <h3 className="text-[#162D50] font-bold text-sm flex items-center">
              <Banknote className="w-4 h-4 mr-2" /> Section D: Financial Reconciliation
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col space-y-4 max-w-lg">
              <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                <span className="text-gray-600 font-medium">Gross Amount</span>
                <span className="font-bold text-gray-800">¥{data.approvedAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                <span className="text-gray-600 font-medium">Adjustments / Deductions</span>
                <div className="flex items-center">
                  <span className="mr-2 text-gray-500">- ¥</span>
                  <input 
                    type="number" 
                    name="deductions"
                    value={formData.deductions}
                    onChange={handleInputChange}
                    min="0"
                    className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:border-[#162D50]"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center py-3 bg-gray-50 px-4 rounded-md">
                <span className="text-[#162D50] font-bold text-lg">Net Settled Amount</span>
                <span className="font-black text-[#162D50] text-xl">
                  ¥{netSettledAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section E: Verification, Proof & Submission */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#F8F9FA] px-6 py-3 border-b border-gray-200">
            <h3 className="text-[#162D50] font-bold text-sm flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" /> Section E: Verification & Submission
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Transaction Reference ID *</label>
                <input 
                  type="text" 
                  name="transactionReference" 
                  value={formData.transactionReference} 
                  onChange={handleInputChange} 
                  placeholder="Wire or transaction ref ID" 
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] ${errors.transactionReference ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {errors.transactionReference && <p className="text-red-500 text-xs mt-1">{errors.transactionReference}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Transfer Voucher / Proof Upload</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex items-center justify-center space-x-2">
                      <Upload className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-500">{file ? file.name : 'Click to upload PDF, JPG, PNG (Max 5MB)'}</span>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => {
                      if (e.target.files[0] && e.target.files[0].size > 5 * 1024 * 1024) {
                        alert('File exceeds 5MB limit');
                        return;
                      }
                      setFile(e.target.files[0]);
                    }} />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Accounting Remarks</label>
              <textarea 
                name="accountingRemarks"
                value={formData.accountingRemarks}
                onChange={handleInputChange}
                rows="3"
                placeholder="Audit notes or internal remarks..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox"
                  name="isConfirmed"
                  checked={formData.isConfirmed}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#162D50] rounded border-gray-300 focus:ring-[#162D50]"
                />
                <span className="text-sm font-bold text-gray-700">Confirm Settlement & Lock Record *</span>
              </label>
              {errors.isConfirmed && <p className="text-red-500 text-xs mt-1 ml-8">{errors.isConfirmed}</p>}
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center bg-[#162D50] text-white px-8 py-3 rounded-md font-bold hover:bg-[#0f1f38] transition-colors shadow-sm disabled:opacity-70"
              >
                {isSubmitting ? 'Processing...' : 'Submit Settlement'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[#162D50] mb-2 flex items-center">
              <Flag className="w-5 h-5 mr-2 text-yellow-500" /> 
              Flag for Adjustment
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will route the case to Pending Adjustments. Please provide a mandatory reason for this action.
            </p>
            <textarea 
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="State reason for adjustment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              rows="4"
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleFlagForAdjustment}
                disabled={isSubmitting || !flagReason.trim()}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md font-bold text-sm hover:bg-yellow-600 transition-colors disabled:opacity-70"
              >
                Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
