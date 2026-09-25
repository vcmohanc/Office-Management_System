import { Calendar, Trash2, Plus, UploadCloud, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';
import { ALL_DEPARTMENTS } from '../../constants';
import MultiDatePicker from '../common/MultiDatePicker';

export default function StaffRegistration({ setActiveTab }) {
  const [loading, setLoading] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pledgeFileName, setPledgeFileName] = useState(null);
  const [qualifications, setQualifications] = useState([{ passingYear: '', qualification: '', university: '' }]);
  
  // Generate random スタッフID on component mount
  useEffect(() => {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    setStaffId(`STF${randomHex}`);
  }, []);
  const [workExperiences, setWorkExperiences] = useState([{ companyName: '', workPeriod: '', jobDescription: '' }]);
  const [departments, setDepartments] = useState([]);
  const [workingDays, setWorkingDays] = useState([]);

  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');

  const handleDobChange = (e) => {
    const newDob = e.target.value;
    setDob(newDob);
    if (newDob) {
      const birthDate = new Date(newDob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    } else {
      setAge('');
    }
  };

  const addWorkExperience = () => {
    setWorkExperiences([...workExperiences, { companyName: '', workPeriod: '', jobDescription: '' }]);
  };

  const removeWorkExperience = (index) => {
    setWorkExperiences(workExperiences.filter((_, i) => i !== index));
  };

  const handleWorkExperienceChange = (index, field, value) => {
    const newWork = [...workExperiences];
    newWork[index][field] = value;
    setWorkExperiences(newWork);
  };

  const addQualification = () => {
    setQualifications([...qualifications, { passingYear: '', qualification: '', university: '' }]);
  };

  const removeQualification = (index) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const handleQualificationChange = (index, field, value) => {
    const newQuals = [...qualifications];
    newQuals[index][field] = value;
    setQualifications(newQuals);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePledgeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPledgeFileName(file.name);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Add dynamic arrays
    data.educationalQualifications = qualifications.map(q => ({
      passingYear: q.passingYear,
      qualification: q.qualification,
      institution: q.university
    }));
    data.workExperience = workExperiences;
    if (photoPreview) {
      data.photo = photoPreview;
    }
    
    data.workingDays = workingDays;

    console.log("Submitting Data:", data);
    data.dob = data.dateOfBirth;
    data.visaステータス = data.currentVisaステータス;
    
    // Map nested objects
    data.languageFluency = {
      english: data.englishLevel,
      japanese: data.japaneseLevel,
      other: {
        name: data.otherLanguageName,
        level: data.otherLanguageLevel
      }
    };
    
    data.physicalAttributes = {
      height: data.height,
      weight: data.weight,
      clothingSize: data.clothingSize,
      shoeSize: data.shoeSize
    };
    
    // Use selected departments array
    data.department = departments;
    data.staffId = staffId;
    
    try {
      const res = await apiFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        if (setActiveTab) {
            setActiveTab('Staff List');
        }
      } else {
        console.error('Failed to register staff');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-10">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#F8F9FA]">
          <h2 className="text-xl font-bold text-[#162D50]">新規スタッフ登録とオンボーディング</h2>
          <div className="bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium">
            スタッフID: <span className="font-bold text-[#162D50]">{staffId}</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left side: General Info */}
            <div className="w-full md:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">入社日 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input required name="joinDate" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">カタカナ氏名 <span className="text-red-500">*</span></label>
              <input required name="katakanaName" type="text" placeholder="例: ヤマダ タロウ" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">ローマ字氏名 <span className="text-red-500">*</span></label>
              <input required name="romajiName" type="text" placeholder="例: YAMADA TARO" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">国籍 <span className="text-red-500">*</span></label>
              <input required name="nationality" type="text" placeholder="国籍を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">電話番号 <span className="text-red-500">*</span></label>
              <input required name="phone" type="tel" placeholder="例: 090-1234-5678" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">メールアドレス <span className="text-red-500">*</span></label>
              <input required name="email" type="email" placeholder="例: staff@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>


            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">生年月日 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input required name="dateOfBirth" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" value={dob} onChange={handleDobChange} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">年齢</label>
                <input name="age" type="text" placeholder="年齢" readOnly className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-gray-50 text-gray-500 cursor-not-allowed" value={age} />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">性別 <span className="text-red-500">*</span></label>
                <select required name="gender" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                  <option value="">性別を選択</option>
                  <option value="Male">男性</option>
                  <option value="Female">女性</option>
                  <option value="Other">その他</option>
                </select>
              </div>
            </div>
          </div>
            </div>

            {/* Right side: Staff Photo */}
            <div className="w-full md:w-1/4 flex flex-col">
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">スタッフ写真</label>
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-[#F8F9FA] hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-[#162D50] aspect-square overflow-hidden relative">
                <input type="file" name="staffPhoto" accept="image/png, image/jpeg" className="hidden" onChange={handlePhotoChange} />
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="text-sm font-medium text-center">写真をアップロード</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Visa and Employment ステータス */}
          <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">ビザと雇用ステータス</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">現在のビザステータス</label>
              <select name="currentVisaステータス" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option value="">ビザステータスを選択</option>
                <option value="Working Visa">就労ビザ</option>
                <option value="Student Visa">学生ビザ</option>
                <option value="Permanent Resident">永住者</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">雇用形態</label>
              <select name="joiningType" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option value="">雇用形態を選択</option>
                <option value="Full-time">正社員</option>
                <option value="Part-time">アルバイト・パート</option>
                <option value="Contract">契約社員</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">ビザ開始日</label>
              <div className="relative">
                <input name="visaStartDate" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">ビザ終了日</label>
              <div className="relative">
                <input name="visaEndDate" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">ビザ更新日</label>
              <div className="relative">
                <input name="visaRenewalDate" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>
          </div>

          <hr className="border-gray-200 mt-6" />



          {/* Educational Qualifications */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">学歴</h3>
            {qualifications.map((q, index) => (
              <div key={index} className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md mb-3 flex items-end space-x-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">卒業年</label>
                  <input type="text" placeholder="年 (例: 2022)" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" value={q.passingYear} onChange={(e) => handleQualificationChange(index, 'passingYear', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">学位・資格</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700" value={q.qualification} onChange={(e) => handleQualificationChange(index, 'qualification', e.target.value)}>
                    <option value="">学位・資格を選択</option>
                    <option value="Bachelor's Degree">学士</option>
                    <option value="Master's Degree">修士</option>
                    <option value="PhD">博士</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">学校名</label>
                  <input type="text" placeholder="学校・機関名" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" value={q.university} onChange={(e) => handleQualificationChange(index, 'university', e.target.value)} />
                </div>
                <button type="button" onClick={() => removeQualification(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addQualification} className="flex items-center text-sm font-bold text-[#162D50] border border-dashed border-[#162D50] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> 学歴を追加
            </button>
          </div>

          {/* Work Experience */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">職歴</h3>
            {workExperiences.map((work, index) => (
              <div key={index} className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md mb-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">会社名</label>
                    <input type="text" placeholder="会社名" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" value={work.companyName} onChange={(e) => handleWorkExperienceChange(index, 'companyName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">勤務期間</label>
                    <input type="text" placeholder="例: 2020年1月 - 2022年12月" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" value={work.workPeriod} onChange={(e) => handleWorkExperienceChange(index, 'workPeriod', e.target.value)} />
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">職務内容</label>
                    <textarea placeholder="役割と責任の概要" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white resize-none" value={work.jobDescription} onChange={(e) => handleWorkExperienceChange(index, 'jobDescription', e.target.value)}></textarea>
                  </div>
                  <button type="button" onClick={() => removeWorkExperience(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-6 border border-transparent hover:border-red-200">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addWorkExperience} className="flex items-center text-sm font-bold text-[#162D50] border border-dashed border-[#162D50] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> 職歴を追加
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Personality */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Personality</h3>
            <input name="personality" type="text" placeholder="Key traits" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-[#F8F9FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
          </div>

          {/* Language Fluency */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">語学力</h3>
            <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">英語</label>
                <select name="englishLevel" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option value="">レベルを選択</option>
                  <option value="Native">ネイティブ</option>
                  <option value="Fluent">流暢</option>
                  <option value="Conversational">日常会話</option>
                  <option value="Basic">基礎</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">日本語</label>
                <select name="japaneseLevel" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option value="">レベルを選択</option>
                  <option value="Native">ネイティブ</option>
                  <option value="N1">N1</option>
                  <option value="N2">N2</option>
                  <option value="N3">N3</option>
                  <option value="N4">N4</option>
                  <option value="N5">N5</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">その他の言語</label>
                <div className="flex space-x-2">
                  <input name="otherLanguageName" type="text" placeholder="言語名" className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
                  <select name="otherLanguageLevel" className="w-24 px-2 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                    <option value="">レベル</option>
                    <option value="Native">ネイティブ</option>
                    <option value="Fluent">流暢</option>
                    <option value="Basic">基礎</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Physical Attributes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">身長 (cm)</label>
              <input name="height" type="text" placeholder="cm" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">体重 (kg)</label>
              <input name="weight" type="text" placeholder="kg" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">服のサイズ</label>
              <select name="clothingSize" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option value="">サイズを選択</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">靴のサイズ (cm)</label>
              <input name="shoeSize" type="text" placeholder="例: 26.5" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>

          {/* Uploads */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">オンボーディング状況</label>
              <select name="onboardingステータス" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option value="Verification 保留中">確認保留中</option>
                <option value="Active">アクティブ</option>
                <option value="Missing Documents">書類未提出</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">控除誓約書</label>
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-[#F8F9FA] hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-[#162D50]">
                <input type="file" name="pledgeDocument" accept=".pdf, image/png, image/jpeg" className="hidden" onChange={handlePledgeChange} />
                <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                <p className="text-sm font-medium text-center">
                  {pledgeFileName ? pledgeFileName : "クリックまたはドラッグ＆ドロップでアップロード"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (最大 5MB)</p>
              </label>
              <div className="flex items-center text-red-500 text-xs mt-2 font-medium">
                <AlertCircle className="w-3 h-3 mr-1" />
                スタッフの控除や退職時に必要です。
              </div>
            </div>
          </div>

          {/* アクション Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
            <button type="submit" disabled={loading} className="bg-[#162D50] text-white px-6 py-2.5 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm uppercase tracking-wider disabled:opacity-50">
              {loading ? '送信中...' : '登録する'}
            </button>
            <button type="button" onClick={() => setActiveTab && setActiveTab('Staff List')} className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider">
              キャンセル
            </button>
          </div>

        </div>
      </div>
    </form>
  );
}
