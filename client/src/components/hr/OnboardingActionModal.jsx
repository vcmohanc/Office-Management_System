import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch.js';
import toast from 'react-hot-toast';

export default function OnboardingActionModal({ employee, onClose, onComplete }) {
  const [loading, setLoading] = useState(false);
  
  // pendingItems is derived from the string in DB
  const pendingItems = (employee.onboardingStatus || '').split(',').map(s => s.trim()).filter(Boolean).filter(s => s !== 'Active' && s !== 'Completed');
  const [resolvedItems, setResolvedItems] = useState([]);

  const [docFile, setDocFile] = useState(null);
  const [verificationChecked, setVerificationChecked] = useState(false);

  const isResolved = (item) => resolvedItems.includes(item);

  const updateEmployeeStatus = async (newResolvedItems) => {
    const remaining = pendingItems.filter(item => !newResolvedItems.includes(item));
    let newStatus = remaining.length > 0 ? remaining.join(', ') : 'Completed';
    
    try {
      const res = await apiFetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingStatus: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updatedEmp = await res.json();
      onComplete(updatedEmp); // updates parent immediately
    } catch(err) {
      toast.error('Failed to update onboarding status in database');
      throw err;
    }
  };

  const handleDocUpload = async () => {
    if (!docFile) {
      toast.error('Please select a file first.');
      return;
    }
    // simple size check 5MB
    if (docFile.size > 5 * 1024 * 1024) {
      toast.error('File exceeds 5MB limit.');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('files', docFile); // backend upload route expects 'files' array
      
      const res = await apiFetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      // Update employee pledgeDocument
      await apiFetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pledgeDocument: data.fileNames[0] })
      });
      
      const newResolved = [...resolvedItems, 'Missing Documents'];
      setResolvedItems(newResolved);
      await updateEmployeeStatus(newResolved);
      
      toast.success('Document uploaded successfully');
      
      if (newResolved.length === pendingItems.length) {
        toast.success('Onboarding completed. Moved to 未配属スタッフ.');
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload document');
    }
    setLoading(false);
  };

  const handleVerification = async () => {
    if (!verificationChecked) {
      toast.error('Please confirm the details.');
      return;
    }
    setLoading(true);
    try {
      const newResolved = [...resolvedItems, 'Verification Pending', 'Verification 保留中'];
      setResolvedItems(newResolved);
      await updateEmployeeStatus(newResolved);
      
      toast.success('Verification completed');
      
      if (pendingItems.filter(item => !newResolved.includes(item)).length === 0) {
        toast.success('Onboarding completed. Moved to 未配属スタッフ.');
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      toast.error('Failed to verify');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#162D50]">アクション Required: {employee.romajiName || employee.katakanaName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {pendingItems.map((item, idx) => {
            const resolved = isResolved(item);
            
            if (item === 'Missing Documents') {
              return (
                <div key={idx} className={`border rounded-lg p-5 ${resolved ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-bold text-gray-800 flex items-center">
                      {resolved ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> : <AlertCircle className="w-5 h-5 text-red-500 mr-2" />}
                      不足書類の提出 (Missing Documents)
                    </h3>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {resolved ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  {!resolved && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">Please upload the missing required documents. Accepted types: PDF, JPG, PNG (Max 5MB).</p>
                      <input 
                        type="file" 
                        onChange={(e) => setDocFile(e.target.files[0])} 
                        className="text-sm block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#162D50] file:text-white hover:file:bg-[#0f1f38]" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                      />
                      <button onClick={handleDocUpload} disabled={loading} className="px-4 py-2 bg-[#162D50] text-white rounded-md text-sm font-bold flex items-center hover:bg-[#0f1f38]">
                        {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />} Save Upload
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            
            if (item === 'Verification Pending' || item === 'Verification 保留中') {
              return (
                <div key={idx} className={`border rounded-lg p-5 ${resolved ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-bold text-gray-800 flex items-center">
                      {resolved ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> : <AlertCircle className="w-5 h-5 text-red-500 mr-2" />}
                      本人確認 (Verification Pending)
                    </h3>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {resolved ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  {!resolved && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">Please verify the identity details of the staff member.</p>
                      <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={verificationChecked} onChange={(e) => setVerificationChecked(e.target.checked)} className="mr-3 w-4 h-4 rounded text-[#162D50] focus:ring-[#162D50]" />
                        I have verified all identity details.
                      </label>
                      <button onClick={handleVerification} disabled={loading} className="px-4 py-2 bg-[#162D50] text-white rounded-md text-sm font-bold flex items-center hover:bg-[#0f1f38]">
                         {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />} Complete Verification
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            
            return null;
          })}
          
          {pendingItems.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No Action Required</h3>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md flex items-center">
            閉じる (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
