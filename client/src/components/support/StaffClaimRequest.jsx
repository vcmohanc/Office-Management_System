import React, { useState } from 'react';
import { UploadCloud, FileText, Calendar } from 'lucide-react';

export default function StaffClaimRequest() {
  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Admin' };
  
  const [formData, setFormData] = useState({
    expenseType: '',
    expenseDate: '',
    amount: '',
    expenseCategory: 'Service Staff',
    costBearer: 'Service Staff',
    staffName: user.username,
    projectRef: '',
    paymentMethod: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting claim:', formData);
    // Submit logic here
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-[#162D50]" />
            <h1 className="text-xl font-bold text-[#162D50]">New Expense Claim</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Expense claim submission period is from the 11th to the 27th of every month.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Expense Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Expense Type</label>
              <select 
                name="expenseType" 
                value={formData.expenseType} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Select Type</option>
                <option value="travel">Travel</option>
                <option value="meals">Meals & Entertainment</option>
                <option value="office_supplies">Office Supplies</option>
                <option value="transportation">Transportation / Mileage</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Expense Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Expense Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none hidden md:block" />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input 
                  type="number" 
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Expense Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Expense Category</label>
              <select 
                name="expenseCategory" 
                value={formData.expenseCategory} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="Service Staff">Service Staff</option>
                <option value="Management">Management</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Cost Bearer */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Cost Bearer</label>
              <select 
                name="costBearer" 
                value={formData.costBearer} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="Service Staff">Service Staff</option>
                <option value="Department A">Department A</option>
                <option value="Department B">Department B</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Staff Name (Auto-filled) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Staff Name</label>
              <input 
                type="text" 
                name="staffName"
                value={formData.staffName}
                disabled
                className="w-full border border-gray-200 bg-gray-50 rounded-md px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed capitalize"
              />
            </div>

            {/* Project Reference */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Project Reference</label>
              <input 
                type="text" 
                name="projectRef"
                placeholder="Optional"
                value={formData.projectRef}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Payment Method</label>
              <select 
                name="paymentMethod" 
                value={formData.paymentMethod} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Select Method</option>
                <option value="out_of_pocket">Out of Pocket (Reimburse)</option>
                <option value="corporate_card">Corporate Card</option>
              </select>
            </div>

          </div>

          {/* Description / Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Description / Reason</label>
            <textarea 
              name="description"
              rows={4}
              placeholder="Provide details about the expense..."
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            ></textarea>
          </div>

          {/* Upload Area */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Receipt / Voucher Upload</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer transition-colors bg-white group">
              <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-blue-500 mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX 5MB)</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100 mt-8">
            <button 
              type="button" 
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              Save Draft
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-[#162D50] text-white font-medium rounded-md hover:bg-[#1f3f6f] transition-colors shadow-sm text-sm"
            >
              Submit Request
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
