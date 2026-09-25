import React, { useState } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';

import { X, Save, User, Globe, Briefcase, Heart, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { ALL_DEPARTMENTS } from '../../constants';
import MultiDatePicker from '../common/MultiDatePicker';

export default function StaffEditModal({ employee, onClose, onEditComplete, initialTab = '基本情報' }) {
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
      const response = await apiFetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
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
            <h2 className="text-xl font-bold text-[#162D50]">スタッフプロフィールの編集</h2>
            <p className="text-sm text-gray-500">{formData.romajiName} (ID: #{employee._id?.slice(-6).toUpperCase()})</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-gray-200 bg-gray-50">
          {['基本情報', 'ビザ', '学歴・職歴', '身体情報・その他'].map((tab) => (
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
            <div className={activeTab === '基本情報' ? 'block' : 'hidden'}>
              <div className="mb-6 flex items-center space-x-6">
                <div className="w-24 h-24 border-2 border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 text-xs text-center px-2">写真なし</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">プロフィール写真</label>
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors inline-block">
                    <span>写真をアップロード</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">JPEG または PNG、最大2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">ローマ字氏名</label>
                  <input type="text" name="romajiName" value={formData.romajiName} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">カタカナ氏名</label>
                  <input type="text" name="katakanaName" value={formData.katakanaName} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">電話番号</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">メールアドレス</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">部署</label>
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
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">入社日</label>
                  <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">国籍</label>
                  <input type="text" name="nationality" value={formData.nationality || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">生年月日</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">性別</label>
                  <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]">
                    <option value="">性別を選択</option>
                    <option value="Male">男性</option>
                    <option value="Female">女性</option>
                    <option value="Other">その他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">オンボーディング状況</label>
                  <select name="onboardingステータス" value={formData.onboardingステータス} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required>
                    <option value="Active">アクティブ</option>
                    <option value="Verification 保留中">確認保留中</option>
                    <option value="Missing Documents">書類未提出</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TAB: Visa & ステータス */}
            <div className={activeTab === 'ビザ' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">雇用形態</label>
                  <select name="joiningType" value={formData.joiningType || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]">
                    <option value="">雇用形態を選択</option>
                    <option value="Full-time">正社員</option>
                    <option value="Part-time">アルバイト・パート</option>
                    <option value="Contract">契約社員</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">ビザステータス</label>
                  <select name="visaステータス" value={formData.visaステータス} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" required>
                    <option value="">ビザステータスを選択</option>
                    <option value="Working Visa">就労ビザ</option>
                    <option value="Student Visa">学生ビザ</option>
                    <option value="Permanent Resident">永住者</option>
                    <option value="Dependent Visa">家族滞在ビザ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">ビザ開始日</label>
                  <input type="date" name="visaStartDate" value={formData.visaStartDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">ビザ終了日</label>
                  <input type="date" name="visaEndDate" value={formData.visaEndDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">ビザ更新日</label>
                  <input type="date" name="visaRenewalDate" value={formData.visaRenewalDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-[#162D50]" />
                </div>
              </div>


            </div>

            {/* TAB: Education & Experience */}
            <div className={activeTab === '学歴・職歴' ? 'block' : 'hidden'}>
              {/* Education */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[#162D50]">学歴</h3>
                  <button type="button" onClick={() => addArrayItem('educationalQualifications', { passingYear: '', qualification: '', institution: '' })} className="flex items-center text-sm text-[#162D50] hover:underline">
                    <Plus className="w-4 h-4 mr-1" /> 学歴を追加
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.educationalQualifications.map((edu, index) => (
                    <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <input type="text" placeholder="年 (例: 2022)" value={edu.passingYear} onChange={(e) => updateArrayItem('educationalQualifications', index, 'passingYear', e.target.value)} className="w-1/4 px-3 py-2 border rounded text-sm" />
                      <input type="text" placeholder="学位・資格" value={edu.qualification} onChange={(e) => updateArrayItem('educationalQualifications', index, 'qualification', e.target.value)} className="w-1/4 px-3 py-2 border rounded text-sm" />
                      <input type="text" placeholder="学校・機関名" value={edu.institution} onChange={(e) => updateArrayItem('educationalQualifications', index, 'institution', e.target.value)} className="flex-1 px-3 py-2 border rounded text-sm" />
                      <button type="button" onClick={() => removeArrayItem('educationalQualifications', index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.educationalQualifications.length === 0 && <p className="text-sm text-gray-500 italic">追加された学歴はありません。</p>}
                </div>
              </div>

              {/* Work Experience */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[#162D50]">職歴</h3>
                  <button type="button" onClick={() => addArrayItem('workExperience', { companyName: '', workPeriod: '', jobDescription: '' })} className="flex items-center text-sm text-[#162D50] hover:underline">
                    <Plus className="w-4 h-4 mr-1" /> 職歴を追加
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.workExperience.map((exp, index) => (
                    <div key={index} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 relative">
                      <div className="flex gap-4">
                        <input type="text" placeholder="会社名" value={exp.companyName} onChange={(e) => updateArrayItem('workExperience', index, 'companyName', e.target.value)} className="w-1/2 px-3 py-2 border rounded text-sm" />
                        <input type="text" placeholder="勤務期間 (例: 2020年1月 - 2022年12月)" value={exp.workPeriod} onChange={(e) => updateArrayItem('workExperience', index, 'workPeriod', e.target.value)} className="w-1/2 px-3 py-2 border rounded text-sm" />
                      </div>
                      <textarea placeholder="職務内容" value={exp.jobDescription} onChange={(e) => updateArrayItem('workExperience', index, 'jobDescription', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" rows="2" />
                      <button type="button" onClick={() => removeArrayItem('workExperience', index)} className="absolute top-4 right-4 p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.workExperience.length === 0 && <p className="text-sm text-gray-500 italic">追加された職歴はありません。</p>}
                </div>
              </div>
            </div>

            {/* TAB: Physical & More */}
            <div className={activeTab === '身体情報・その他' ? 'block' : 'hidden'}>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Physical Attributes */}
                <div>
                  <h3 className="font-bold text-[#162D50] mb-4">身体的特徴</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">身長 (cm)</label>
                      <input type="number" value={formData.physicalAttributes.height} onChange={(e) => handleNestedChange('physicalAttributes', 'height', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">体重 (kg)</label>
                      <input type="number" value={formData.physicalAttributes.weight} onChange={(e) => handleNestedChange('physicalAttributes', 'weight', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">服のサイズ</label>
                      <input type="text" value={formData.physicalAttributes.clothingSize} onChange={(e) => handleNestedChange('physicalAttributes', 'clothingSize', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">靴のサイズ (cm)</label>
                      <input type="text" value={formData.physicalAttributes.shoeSize} onChange={(e) => handleNestedChange('physicalAttributes', 'shoeSize', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" />
                    </div>
                  </div>
                </div>

                {/* Language & Personality */}
                <div>
                  <h3 className="font-bold text-[#162D50] mb-4">語学力・性格</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">英語レベル</label>
                      <input type="text" value={formData.languageFluency.english} onChange={(e) => handleNestedChange('languageFluency', 'english', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="例: 流暢、基礎" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">日本語レベル</label>
                      <input type="text" value={formData.languageFluency.japanese} onChange={(e) => handleNestedChange('languageFluency', 'japanese', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="例: ネイティブ、N2" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-600 mb-1">その他の言語</label>
                        <input type="text" value={formData.languageFluency.other.name} onChange={(e) => handleOtherLanguageChange('name', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="言語名" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-600 mb-1">レベル</label>
                        <input type="text" value={formData.languageFluency.other.level} onChange={(e) => handleOtherLanguageChange('level', e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="レベル" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 mt-4">性格的特徴</label>
                      <input type="text" name="personality" value={formData.personality || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-md text-sm" placeholder="例: フレンドリー、働き者" />
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
            キャンセル
          </button>
          <button type="submit" form="editStaffForm" disabled={saving} className="flex items-center px-6 py-2.5 text-sm font-bold text-white bg-[#162D50] rounded-lg hover:bg-[#0f1f3a] transition-colors shadow-sm disabled:opacity-50">
            <Save className="w-4 h-4 mr-2" />
            {saving ? '保存中...' : '変更を保存'}
          </button>
        </div>

      </div>
    </div>
  );
}
