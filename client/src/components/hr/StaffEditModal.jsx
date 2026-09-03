import React, { useState } from 'react';
import { X, Save, User, Globe, Briefcase, Heart, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { ALL_DEPARTMENTS } from '../../constants';
import MultiDatePicker from '../common/MultiDatePicker';

export default function StaffEditModal({ employee, onClose, onEditComplete, initialTab = 'Basic' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Format date correctly for inputs
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    ...employee,
    department: Array.isArray(employee.department) ? employee.department : (employee.department ? [employee.department] : []),
    joinDate: formatDate(employee.joinDate),
    dob: formatDate(employee.dob),
    visaStartDate: formatDate(employee.visaStartDate),
    visaEndDate: formatDate(employee.visaEndDate),
    visaRenewalDate: formatDate(employee.visaRenewalDate),
    phone: employee.phone || '',
    email: employee.email || '',
    workingDays: (employee.workingDays || []).map(formatDate).filter(Boolean),
    educationalQualifications: employee.educationalQualifications || [],
    workExperience: employee.workExperience || [],
    languageFluency: {
      english: employee.languageFluency?.english || '',
      japanese: employee.languageFluency?.japanese || '',
      other: {
        name: employee.languageFluency?.other?.name || '',
        level: employee.languageFluency?.other?.level || ''
      }
    },
    physicalAttributes: {
      height: employee.physicalAttributes?.height || '',
      weight: employee.physicalAttributes?.weight || '',
      clothingSize: employee.physicalAttributes?.clothingSize || '',
      shoeSize: employee.physicalAttributes?.shoeSize || ''
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(employee.photo || null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleOtherLanguageChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      languageFluency: {
        ...prev.languageFluency,
        other: {
          ...prev.languageFluency.other,
          [field]: value
        }
      }
    }));
  };

  // Array Handlers
  const addArrayItem = (field, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultItem]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field, index, key, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = { ...newArray[index], [key]: value };
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          ...formData,
          photo: photoPreview
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update employee');
      }

      const updatedEmployee = await response.json();
      onEditComplete(updatedEmployee);
    } catch (err) {
      console.error(err);
      setError('An error occurred while saving the changes.');
      setSaving(false);
    }
  };

  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#162D50]">Edit Staff Profile</h2>
            <p className="text-sm text-gray-500">{formData.romajiName} (ID: #{employee._id?.slice(-6).toUpperCase()})</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-gray-200 bg-gray-50">
          {['Basic', 'Visa', 'Education & Experience', 'Physical & More'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#162D50] text-[#162D50]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-white">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start border border-red-100">
              <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form id="editStaffForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* TAB: Basic Info */}
            <div className={activeTab === 'Basic' ? 'block' : 'hidden'}>
              <div className="mb-6 flex items-center space-x-6">
                <div className="w-24 h-24 border-2 border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 text-xs text-center px-2">No Photo</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Profile Photo</label>
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors inline-block">
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">JPEG or PNG, max 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Romaji Name</label>
                  <input type="text" name="romajiName" value={formData.romajiName} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Katakana Name</label>
                  <input type="text" name="katakanaName" value={formData.katakanaName} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Departments</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_DEPARTMENTS.map((dept, idx) => {
                      const isSelected = formData.department.includes(dept);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              department: isSelected 
                                ? prev.department.filter(d => d !== dept) 
                                : [...prev.department, dept]
                            }));
                          }}
                          className={`
                            text-left px-3 py-2 rounded border transition-colors text-sm
                            ${isSelected 
                              ? 'border-[#162D50] bg-[#162D50] text-white' 
                              : 'border-gray-300 bg-white text-gray-700 hover:border-[#162D50]'
                            }
                          `}
                        >
                          {dept}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Join Date</label>
                  <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Nationality</label>
                  <input type="text" name="nationality" value={formData.nationality || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Gender</label>
                  <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Onboarding Status</label>
                  <select name="onboardingStatus" value={formData.onboardingStatus} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required>
                    <option value="Active">Active</option>
                    <option value="Verification Pending">Verification Pending</option>
                    <option value="Missing Documents">Missing Documents</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TAB: Visa & Status */}
            <div className={activeTab === 'Visa' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Joining Type</label>
                  <select name="joiningType" value={formData.joiningType || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]">
                    <option value="">Select Joining Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Visa Status</label>
                  <select name="visaStatus" value={formData.visaStatus} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required>
                    <option value="">Select Visa Status</option>
                    <option value="Working Visa">Working Visa</option>
                    <option value="Student Visa">Student Visa</option>
                    <option value="Permanent Resident">Permanent Resident</option>
                    <option value="Dependent Visa">Dependent Visa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Visa Start Date</label>
                  <input type="date" name="visaStartDate" value={formData.visaStartDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Visa End Date</label>
                  <input type="date" name="visaEndDate" value={formData.visaEndDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Visa Renewal Date</label>
                  <input type="date" name="visaRenewalDate" value={formData.visaRenewalDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
              </div>

              <hr className="border-gray-200 my-6" />

              {/* Working Mode Calendar */}
              <div>
                <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Working Days</h3>
                <p className="text-xs text-gray-500 mb-3">Select the specific calendar dates this staff member is scheduled to work.</p>
                <div className="flex justify-center bg-gray-50 p-4 border border-gray-200 rounded-md">
                  <MultiDatePicker 
                    selectedDates={formData.workingDays} 
                    onChange={(newDates) => setFormData(prev => ({...prev, workingDays: newDates}))} 
                  />
                </div>
              </div>
            </div>

            {/* TAB: Education & Experience */}
            <div className={activeTab === 'Education & Experience' ? 'block' : 'hidden'}>
              {/* Education */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[#162D50]">Educational Qualifications</h3>
                  <button type="button" onClick={() => addArrayItem('educationalQualifications', { passingYear: '', qualification: '', institution: '' })} className="flex items-center text-sm text-[#162D50] hover:underline">
                    <Plus className="w-4 h-4 mr-1" /> Add Education
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.educationalQualifications.map((edu, index) => (
                    <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <input type="text" placeholder="Year (e.g. 2022)" value={edu.passingYear} onChange={(e) => updateArrayItem('educationalQualifications', index, 'passingYear', e.target.value)} className="w-1/4 px-3 py-2 border rounded text-sm" />
                      <input type="text" placeholder="Qualification" value={edu.qualification} onChange={(e) => updateArrayItem('educationalQualifications', index, 'qualification', e.target.value)} className="w-1/4 px-3 py-2 border rounded text-sm" />
                      <input type="text" placeholder="Institution" value={edu.institution} onChange={(e) => updateArrayItem('educationalQualifications', index, 'institution', e.target.value)} className="flex-1 px-3 py-2 border rounded text-sm" />
                      <button type="button" onClick={() => removeArrayItem('educationalQualifications', index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.educationalQualifications.length === 0 && <p className="text-sm text-gray-500 italic">No education history added.</p>}
                </div>
              </div>

              {/* Work Experience */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[#162D50]">Work Experience</h3>
                  <button type="button" onClick={() => addArrayItem('workExperience', { companyName: '', workPeriod: '', jobDescription: '' })} className="flex items-center text-sm text-[#162D50] hover:underline">
                    <Plus className="w-4 h-4 mr-1" /> Add Experience
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.workExperience.map((exp, index) => (
                    <div key={index} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 relative">
                      <div className="flex gap-4">
                        <input type="text" placeholder="Company Name" value={exp.companyName} onChange={(e) => updateArrayItem('workExperience', index, 'companyName', e.target.value)} className="w-1/2 px-3 py-2 border rounded text-sm" />
                        <input type="text" placeholder="Work Period (e.g. Jan 2020 - Dec 2022)" value={exp.workPeriod} onChange={(e) => updateArrayItem('workExperience', index, 'workPeriod', e.target.value)} className="w-1/2 px-3 py-2 border rounded text-sm" />
                      </div>
                      <textarea placeholder="Job Description" value={exp.jobDescription} onChange={(e) => updateArrayItem('workExperience', index, 'jobDescription', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" rows="2" />
                      <button type="button" onClick={() => removeArrayItem('workExperience', index)} className="absolute top-4 right-4 p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.workExperience.length === 0 && <p className="text-sm text-gray-500 italic">No work experience added.</p>}
                </div>
              </div>
            </div>

            {/* TAB: Physical & More */}
            <div className={activeTab === 'Physical & More' ? 'block' : 'hidden'}>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Physical Attributes */}
                <div>
                  <h3 className="font-bold text-[#162D50] mb-4">Physical Attributes</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Height (cm)</label>
                      <input type="number" value={formData.physicalAttributes.height} onChange={(e) => handleNestedChange('physicalAttributes', 'height', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Weight (kg)</label>
                      <input type="number" value={formData.physicalAttributes.weight} onChange={(e) => handleNestedChange('physicalAttributes', 'weight', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Clothing Size</label>
                      <input type="text" value={formData.physicalAttributes.clothingSize} onChange={(e) => handleNestedChange('physicalAttributes', 'clothingSize', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Shoe Size (cm)</label>
                      <input type="text" value={formData.physicalAttributes.shoeSize} onChange={(e) => handleNestedChange('physicalAttributes', 'shoeSize', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" />
                    </div>
                  </div>
                </div>

                {/* Language & Personality */}
                <div>
                  <h3 className="font-bold text-[#162D50] mb-4">Language & Personality</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">English Level</label>
                      <input type="text" value={formData.languageFluency.english} onChange={(e) => handleNestedChange('languageFluency', 'english', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="e.g. Fluent, Basic" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Japanese Level</label>
                      <input type="text" value={formData.languageFluency.japanese} onChange={(e) => handleNestedChange('languageFluency', 'japanese', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="e.g. Native, N2" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Other Language</label>
                        <input type="text" value={formData.languageFluency.other.name} onChange={(e) => handleOtherLanguageChange('name', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="Name" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Level</label>
                        <input type="text" value={formData.languageFluency.other.level} onChange={(e) => handleOtherLanguageChange('level', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="Level" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 mt-4">Personality Traits</label>
                      <input type="text" name="personality" value={formData.personality || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="e.g. Friendly, Hardworking" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3 flex-shrink-0">
          <button type="button" onClick={onClose} disabled={saving} className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" form="editStaffForm" disabled={saving} className="flex items-center px-6 py-2.5 text-sm font-bold text-white bg-[#162D50] rounded-lg hover:bg-[#0f1f3a] transition-colors shadow-sm disabled:opacity-50">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}
