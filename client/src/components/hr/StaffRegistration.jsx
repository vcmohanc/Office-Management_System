import { Calendar, Trash2, Plus, UploadCloud, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { ALL_DEPARTMENTS } from '../../constants';

export default function StaffRegistration({ setActiveTab }) {
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pledgeFileName, setPledgeFileName] = useState(null);
  const [qualifications, setQualifications] = useState([{ passingYear: '', qualification: '', university: '' }]);
  const [workExperiences, setWorkExperiences] = useState([{ companyName: '', workPeriod: '', jobDescription: '' }]);
  const [departments, setDepartments] = useState([]);

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
    
    // Map mismatched fields
    data.dob = data.dateOfBirth;
    data.visaStatus = data.currentVisaStatus;
    
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
    
    try {
      const res = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#F8F9FA]">
          <h2 className="text-xl font-bold text-[#162D50]">New Staff Registration & Onboarding</h2>
          <div className="bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium">
            Staff ID: <span className="font-bold text-[#162D50]">#STF-NEW</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left side: General Info */}
            <div className="w-full md:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Join Date</label>
              <div className="relative">
                <input name="joinDate" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Katakana Name</label>
              <input name="katakanaName" type="text" placeholder="e.g. YAMADA TARO" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Romaji Full Name</label>
              <input name="romajiName" type="text" placeholder="ROMAJI NAME" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Nationality</label>
              <input name="nationality" type="text" placeholder="Enter nationality" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Phone Number</label>
              <input name="phone" type="tel" placeholder="e.g. 090-1234-5678" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Email Address</label>
              <input name="email" type="email" placeholder="e.g. staff@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Departments</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_DEPARTMENTS.map((dept, idx) => {
                  const isSelected = departments.includes(dept);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDepartments(prev => 
                          isSelected ? prev.filter(d => d !== dept) : [...prev, dept]
                        );
                      }}
                      className={`
                        text-left px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                        ${isSelected 
                          ? 'border-[#162D50] bg-[#162D50] text-white shadow-sm' 
                          : 'border-gray-200 bg-white hover:border-[#162D50] text-gray-700'
                        }
                      `}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Date of Birth</label>
                <div className="relative">
                  <input name="dateOfBirth" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" value={dob} onChange={handleDobChange} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Age</label>
                <input name="age" type="text" placeholder="Age" readOnly className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] bg-gray-50 text-gray-500 cursor-not-allowed" value={age} />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Gender</label>
                <select name="gender" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
            </div>

            {/* Right side: Staff Photo */}
            <div className="w-full md:w-1/4 flex flex-col">
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Staff Photo</label>
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-[#F8F9FA] hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-[#162D50] aspect-square overflow-hidden relative">
                <input type="file" name="staffPhoto" accept="image/png, image/jpeg" className="hidden" onChange={handlePhotoChange} />
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="text-sm font-medium text-center">Upload Photo</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Visa and Employment Status */}
          <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Visa & Employment Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Current Visa Status</label>
              <select name="currentVisaStatus" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option value="">Select Visa Status</option>
                <option value="Working Visa">Working Visa</option>
                <option value="Student Visa">Student Visa</option>
                <option value="Permanent Resident">Permanent Resident</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Joining Type</label>
              <select name="joiningType" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option value="">Select Joining Type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Visa Start Date</label>
              <div className="relative">
                <input name="visaStartDate" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Visa End Date</label>
              <div className="relative">
                <input name="visaEndDate" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Visa Renewal Date</label>
              <div className="relative">
                <input name="visaRenewalDate" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Educational Qualifications */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Educational Qualifications</h3>
            {qualifications.map((q, index) => (
              <div key={index} className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md mb-3 flex items-end space-x-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Passing Year</label>
                  <input type="text" placeholder="YYYY" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" value={q.passingYear} onChange={(e) => handleQualificationChange(index, 'passingYear', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Qualification</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700" value={q.qualification} onChange={(e) => handleQualificationChange(index, 'qualification', e.target.value)}>
                    <option value="">Select Qualification</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">University/School</label>
                  <input type="text" placeholder="Institution Name" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" value={q.university} onChange={(e) => handleQualificationChange(index, 'university', e.target.value)} />
                </div>
                <button type="button" onClick={() => removeQualification(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addQualification} className="flex items-center text-sm font-bold text-[#162D50] border border-dashed border-[#162D50] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> ADD QUALIFICATION
            </button>
          </div>

          {/* Work Experience */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Work Experience</h3>
            {workExperiences.map((work, index) => (
              <div key={index} className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md mb-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Company Name</label>
                    <input type="text" placeholder="Company Name" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" value={work.companyName} onChange={(e) => handleWorkExperienceChange(index, 'companyName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Work Period</label>
                    <input type="text" placeholder="e.g. Jan 2020 - Dec 2022" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" value={work.workPeriod} onChange={(e) => handleWorkExperienceChange(index, 'workPeriod', e.target.value)} />
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Job Description</label>
                    <textarea placeholder="Summary of roles and responsibilities" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white resize-none" value={work.jobDescription} onChange={(e) => handleWorkExperienceChange(index, 'jobDescription', e.target.value)}></textarea>
                  </div>
                  <button type="button" onClick={() => removeWorkExperience(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-6 border border-transparent hover:border-red-200">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addWorkExperience} className="flex items-center text-sm font-bold text-[#162D50] border border-dashed border-[#162D50] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> ADD WORK EXPERIENCE
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
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Language Fluency</h3>
            <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">English</label>
                <select name="englishLevel" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option value="">Select Level</option>
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Japanese</label>
                <select name="japaneseLevel" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option value="">Select Level</option>
                  <option value="Native">Native</option>
                  <option value="N1">N1</option>
                  <option value="N2">N2</option>
                  <option value="N3">N3</option>
                  <option value="N4">N4</option>
                  <option value="N5">N5</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Other Language</label>
                <div className="flex space-x-2">
                  <input name="otherLanguageName" type="text" placeholder="Language Name" className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
                  <select name="otherLanguageLevel" className="w-24 px-2 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                    <option value="">Level</option>
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Basic">Basic</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Physical Attributes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Height (cm)</label>
              <input name="height" type="text" placeholder="cm" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Body Weight (kg)</label>
              <input name="weight" type="text" placeholder="kg" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Clothing Size</label>
              <select name="clothingSize" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option value="">Select Size</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Shoe Size (mm/cm)</label>
              <input name="shoeSize" type="text" placeholder="e.g. 26.5" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>

          {/* Uploads */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Onboarding Status</label>
              <select name="onboardingStatus" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option value="Verification Pending">Verification Pending</option>
                <option value="Active">Active</option>
                <option value="Missing Documents">Missing Documents</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Deduction Pledge Document</label>
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-[#F8F9FA] hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-[#162D50]">
                <input type="file" name="pledgeDocument" accept=".pdf, image/png, image/jpeg" className="hidden" onChange={handlePledgeChange} />
                <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                <p className="text-sm font-medium text-center">
                  {pledgeFileName ? pledgeFileName : "Click to upload or drag and drop pledge"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (MAX 5MB)</p>
              </label>
              <div className="flex items-center text-red-500 text-xs mt-2 font-medium">
                <AlertCircle className="w-3 h-3 mr-1" />
                Required for cases with staff deductions or upon resignation.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
            <button type="submit" disabled={loading} className="bg-[#162D50] text-white px-6 py-2.5 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm uppercase tracking-wider disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
            <button type="button" onClick={() => setActiveTab && setActiveTab('Staff List')} className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider">
              Cancel
            </button>
          </div>

        </div>
      </div>
    </form>
  );
}
