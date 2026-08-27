import { Calendar, Trash2, Plus, UploadCloud, AlertCircle } from 'lucide-react';

export default function StaffRegistration() {
  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#F8F9FA]">
          <h2 className="text-xl font-bold text-[#162D50]">New Staff Registration & Onboarding</h2>
          <div className="bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium">
            Staff ID: <span className="font-bold text-[#162D50]">#STF-8824</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Select Department</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>Select Department</option>
                <option>Audit & Compliance</option>
                <option>Taxation</option>
                <option>Payroll</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Join Date</label>
              <div className="relative">
                <input type="text" placeholder="YYYY / MM / DD" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Katakana Name</label>
              <input type="text" placeholder="e.g. YAMADA TARO" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Romaji Full Name</label>
              <input type="text" placeholder="ROMAJI NAME" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Nationality</label>
              <input type="text" placeholder="Enter nationality" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Date of Birth</label>
              <div className="relative">
                <input type="text" placeholder="YYYY / MM / DD" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Age</label>
              <input type="text" placeholder="Age" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Gender</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Visa and Employment Status */}
          <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Visa & Employment Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Current Visa Status</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>Select Visa Status</option>
                <option>Working Visa</option>
                <option>Student Visa</option>
                <option>Permanent Resident</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Joining Type</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>Select Joining Type</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Visa Start Date</label>
              <div className="relative">
                <input type="text" placeholder="YYYY / MM / DD" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Visa End Date</label>
              <div className="relative">
                <input type="text" placeholder="YYYY / MM / DD" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Visa Renewal Date</label>
              <div className="relative">
                <input type="text" placeholder="YYYY / MM / DD" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Educational Qualifications */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Educational Qualifications</h3>
            <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md mb-3 flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Passing Year</label>
                <input type="text" placeholder="YYYY" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Qualification</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option>Select Qualification</option>
                  <option>Bachelor's Degree</option>
                  <option>Master's Degree</option>
                  <option>PhD</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">University/School</label>
                <input type="text" placeholder="Institution Name" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
              </div>
              <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <button className="flex items-center text-sm font-bold text-[#162D50] border border-dashed border-[#162D50] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> ADD QUALIFICATION
            </button>
          </div>

          {/* Work Experience */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Work Experience</h3>
            <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md mb-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Company Name</label>
                  <input type="text" placeholder="Company Name" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Work Period</label>
                  <input type="text" placeholder="e.g. Jan 2020 - Dec 2022" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Job Description</label>
                  <textarea placeholder="Summary of roles and responsibilities" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white resize-none"></textarea>
                </div>
                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-6 border border-transparent hover:border-red-200">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button className="flex items-center text-sm font-bold text-[#162D50] border border-dashed border-[#162D50] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> ADD WORK EXPERIENCE
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Personality */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Personality</h3>
            <input type="text" placeholder="Key traits" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-[#F8F9FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
          </div>

          {/* Language Fluency */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">Language Fluency</h3>
            <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">English</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option>Select Level</option>
                  <option>Native</option>
                  <option>Fluent</option>
                  <option>Conversational</option>
                  <option>Basic</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Japanese</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option>Select Level</option>
                  <option>Native</option>
                  <option>N1</option>
                  <option>N2</option>
                  <option>N3</option>
                  <option>N4</option>
                  <option>N5</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Other Language</label>
                <div className="flex space-x-2">
                  <input type="text" placeholder="Language Name" className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
                  <select className="w-24 px-2 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                    <option>Level</option>
                    <option>Native</option>
                    <option>Fluent</option>
                    <option>Basic</option>
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
              <input type="text" placeholder="cm" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Body Weight (kg)</label>
              <input type="text" placeholder="kg" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Clothing Size</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>Select Size</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Shoe Size (mm/cm)</label>
              <input type="text" placeholder="e.g. 26.5" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>

          {/* Uploads */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Staff Photo / Document Upload</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-[#F8F9FA] hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-[#162D50]">
                <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                <p className="text-sm font-medium text-center">Click to upload or drag and drop staff photo or pledge document</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (MAX 5MB)</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Onboarding Status</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>Verification Pending</option>
                <option>Active</option>
                <option>Missing Documents</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Deduction Pledge Document</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-[#F8F9FA] hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-[#162D50]">
                <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                <p className="text-sm font-medium text-center">Click to upload or drag and drop pledge</p>
                <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (MAX 5MB)</p>
              </div>
              <div className="flex items-center text-red-500 text-xs mt-2 font-medium">
                <AlertCircle className="w-3 h-3 mr-1" />
                Required for cases with staff deductions or upon resignation.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
            <button className="bg-[#162D50] text-white px-6 py-2.5 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm uppercase tracking-wider">
              Submit Registration
            </button>
            <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider">
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
