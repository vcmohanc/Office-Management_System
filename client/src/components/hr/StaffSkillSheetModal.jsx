import React, { useRef } from 'react';
import { X, Printer, Download, User, Briefcase, GraduationCap, Globe, Heart } from 'lucide-react';

export default function StaffSkillSheetModal({ employee, onClose }) {
  if (!employee) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:overflow-visible print-area">
        
        {/* Header section */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 print:hidden">
          <h2 className="text-xl font-bold text-[#162D50]">Staff Detail Sheet</h2>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handlePrint}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Save PDF
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#162D50] rounded-lg hover:bg-[#0f1f3a] transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body - Print Area */}
        <div className="p-8 print:p-0">
          
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 pb-8 border-b border-gray-100">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-[#162D50] border-2 border-[#162D50]/10">
              <User className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{employee.romajiName || 'Unknown'}</h1>
                  <p className="text-lg text-gray-500">{employee.katakanaName || 'N/A'}</p>
                </div>
                <div className="mt-2 md:mt-0 text-left md:text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
                    employee.onboardingStatus === 'Active' ? 'bg-green-100 text-green-700' :
                    employee.onboardingStatus === 'Verification Pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {employee.onboardingStatus || 'Active'}
                  </span>
                  <p className="text-sm font-medium text-gray-400">ID: #{employee._id?.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Department</p>
                  <p className="font-medium text-gray-900">{employee.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Join Date</p>
                  <p className="font-medium text-gray-900">{formatDate(employee.joinDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Nationality</p>
                  <p className="font-medium text-gray-900">{employee.nationality}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Gender</p>
                  <p className="font-medium text-gray-900">{employee.gender}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              
              {/* Personal Details */}
              <section className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-[#162D50] mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 opacity-70" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="font-medium text-gray-900">{formatDate(employee.dob)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="font-medium text-gray-900">{employee.age} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Height</p>
                    <p className="font-medium text-gray-900">{employee.physicalAttributes?.height ? `${employee.physicalAttributes.height} cm` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Weight</p>
                    <p className="font-medium text-gray-900">{employee.physicalAttributes?.weight ? `${employee.physicalAttributes.weight} kg` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Clothing Size</p>
                    <p className="font-medium text-gray-900">{employee.physicalAttributes?.clothingSize || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Shoe Size</p>
                    <p className="font-medium text-gray-900">{employee.physicalAttributes?.shoeSize || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Visa & Employment */}
              <section className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-bold text-[#162D50] mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 opacity-70" />
                  Visa & Employment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs text-gray-500">Joining Type</p>
                    <p className="font-medium text-gray-900">{employee.joiningType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Visa Status</p>
                    <p className="font-medium text-gray-900">{employee.visaStatus}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Visa Start Date</p>
                    <p className="font-medium text-gray-900">{formatDate(employee.visaStartDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Visa End Date</p>
                    <p className="font-medium text-gray-900">{formatDate(employee.visaEndDate)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Expected Renewal Date</p>
                    <p className="font-medium text-gray-900">{formatDate(employee.visaRenewalDate)}</p>
                  </div>
                </div>
              </section>

              {/* Skills & Personality */}
              <section className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-[#162D50] mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 opacity-70" />
                  Skills & Personality
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Language Fluency</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm font-medium">
                        Japanese: <span className="text-[#162D50]">{employee.languageFluency?.japanese || 'N/A'}</span>
                      </span>
                      <span className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm font-medium">
                        English: <span className="text-[#162D50]">{employee.languageFluency?.english || 'N/A'}</span>
                      </span>
                      {employee.languageFluency?.other?.name && (
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm font-medium">
                          {employee.languageFluency.other.name}: <span className="text-[#162D50]">{employee.languageFluency.other.level || 'N/A'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Personality Traits</p>
                    <p className="font-medium text-gray-900 mt-1 bg-white border border-gray-200 p-3 rounded-md text-sm">
                      {employee.personality || 'No personality description provided.'}
                    </p>
                  </div>
                </div>
              </section>

            </div>

            {/* Right Column */}
            <div className="space-y-8">
              
              {/* Work Experience */}
              <section>
                <h3 className="text-lg font-bold text-[#162D50] mb-4 flex items-center border-b border-gray-200 pb-2">
                  <Briefcase className="w-5 h-5 mr-2 opacity-70" />
                  Work Experience
                </h3>
                {employee.workExperience && employee.workExperience.length > 0 ? (
                  <div className="space-y-4">
                    {employee.workExperience.map((exp, idx) => (
                      <div key={idx} className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-[-16px] before:w-[2px] before:bg-gray-200 last:before:hidden">
                        <div className="absolute left-[3px] top-[6px] w-[10px] h-[10px] rounded-full bg-[#162D50] border-2 border-white"></div>
                        <h4 className="font-bold text-gray-900">{exp.companyName || 'Company Name Missing'}</h4>
                        <p className="text-xs text-[#162D50] font-semibold mb-1">{exp.workPeriod || 'Period Missing'}</p>
                        <p className="text-sm text-gray-600">{exp.jobDescription || 'No description provided.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No work experience listed.</p>
                )}
              </section>

              {/* Educational Qualifications */}
              <section>
                <h3 className="text-lg font-bold text-[#162D50] mb-4 flex items-center border-b border-gray-200 pb-2">
                  <GraduationCap className="w-5 h-5 mr-2 opacity-70" />
                  Educational Qualifications
                </h3>
                {employee.educationalQualifications && employee.educationalQualifications.length > 0 ? (
                  <div className="space-y-4">
                    {employee.educationalQualifications.map((edu, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-gray-900">{edu.qualification || 'Qualification Missing'}</h4>
                          <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            Class of {edu.passingYear || 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{edu.institution || 'Institution Missing'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No educational qualifications listed.</p>
                )}
              </section>
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
