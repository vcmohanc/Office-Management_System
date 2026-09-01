import React from 'react';
import { X, Printer, Download, User } from 'lucide-react';

export default function StaffSkillSheetModal({ employee, onClose }) {
  if (!employee) return null;

  const handlePrint = () => window.print();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-transparent print:p-0">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:overflow-visible print-area shadow-2xl relative border border-gray-300">
        
        {/* Sticky Header Actions */}
        <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-3 flex justify-between items-center z-10 print:hidden">
            <h2 className="text-lg font-bold text-gray-800">Staff Detail Sheet</h2>
            <div className="flex items-center space-x-2">
              <button onClick={handlePrint} className="px-3 py-1.5 text-sm font-medium border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center">
                <Download className="w-4 h-4 mr-2" /> PDF
              </button>
              <button onClick={handlePrint} className="px-3 py-1.5 text-sm font-medium border border-gray-300 bg-[#162D50] text-white hover:bg-[#0f1f3a] flex items-center">
                <Printer className="w-4 h-4 mr-2" /> Print
              </button>
              <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
        </div>

        {/* Modal Body - Classic Document Style */}
        <div className="p-10 print:p-0 text-gray-800">
          
          {/* Header Title */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-gray-900">Staff Skill Sheet</h1>
          </div>

          {/* Profile Section */}
          <div className="flex flex-col md:flex-row items-start justify-between mb-8">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <div className="w-24 h-24 border-2 border-gray-800 flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
                {employee.photo ? (
                  <img src={employee.photo} alt="Staff Photo" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{employee.romajiName || 'Unknown'}</h2>
                <p className="text-gray-600 mb-2">{employee.katakanaName || 'N/A'}</p>
                <div className="text-sm">
                  <span className="font-semibold uppercase mr-2">Staff ID:</span> #{employee._id?.slice(-6).toUpperCase()}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-semibold uppercase mr-2">Status:</span> {employee.onboardingStatus || 'Active'}
                </div>
              </div>
            </div>
            <div className="text-left md:text-right text-sm">
              <div className="mb-1"><span className="font-semibold uppercase mr-1">Department:</span> {Array.isArray(employee.department) ? employee.department.join(', ') : (employee.department || 'N/A')}</div>
              <div className="mb-1"><span className="font-semibold uppercase mr-1">Join Date:</span> {formatDate(employee.joinDate)}</div>
              <div className="mb-1"><span className="font-semibold uppercase mr-1">Nationality:</span> {employee.nationality || 'N/A'}</div>
              <div><span className="font-semibold uppercase mr-1">Gender:</span> {employee.gender || 'N/A'}</div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">1. Personal Information</h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <tbody>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">Date of Birth</td>
                  <td className="border border-gray-300 p-2 w-1/4">{formatDate(employee.dob)}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">Age</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.age} years</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">Height</td>
                  <td className="border border-gray-300 p-2">{employee.physicalAttributes?.height ? `${employee.physicalAttributes.height} cm` : 'N/A'}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">Weight</td>
                  <td className="border border-gray-300 p-2">{employee.physicalAttributes?.weight ? `${employee.physicalAttributes.weight} kg` : 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">Clothing Size</td>
                  <td className="border border-gray-300 p-2">{employee.physicalAttributes?.clothingSize || 'N/A'}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">Shoe Size</td>
                  <td className="border border-gray-300 p-2">{employee.physicalAttributes?.shoeSize ? `${employee.physicalAttributes.shoeSize} cm` : 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Visa & Employment */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">2. Visa & Employment Status</h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <tbody>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">Joining Type</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.joiningType || 'N/A'}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">Visa Status</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.visaStatus || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">Visa Start Date</td>
                  <td className="border border-gray-300 p-2">{formatDate(employee.visaStartDate)}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">Visa End Date</td>
                  <td className="border border-gray-300 p-2">{formatDate(employee.visaEndDate)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">Expected Renewal</td>
                  <td className="border border-gray-300 p-2" colSpan="3">{formatDate(employee.visaRenewalDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Skills & Language */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">3. Skills & Language Fluency</h3>
            <table className="w-full text-sm border-collapse border border-gray-300 mb-4">
              <tbody>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">Japanese</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.languageFluency?.japanese || 'N/A'}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">English</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.languageFluency?.english || 'N/A'}</td>
                </tr>
                {employee.languageFluency?.other?.name && (
                  <tr>
                    <td className="border border-gray-300 bg-gray-100 font-semibold p-2">{employee.languageFluency.other.name}</td>
                    <td className="border border-gray-300 p-2" colSpan="3">{employee.languageFluency.other.level}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="text-sm">
              <span className="font-semibold block mb-1">Personality Traits:</span>
              <p className="border border-gray-300 p-3 bg-gray-50">{employee.personality || 'No personality description provided.'}</p>
            </div>
          </div>

          {/* Educational Qualifications */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">4. Educational Qualifications</h3>
            {employee.educationalQualifications && employee.educationalQualifications.length > 0 ? (
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left w-1/4">Passing Year</th>
                    <th className="border border-gray-300 p-2 text-left w-1/3">Qualification</th>
                    <th className="border border-gray-300 p-2 text-left">Institution</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.educationalQualifications.map((edu, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 p-2">{edu.passingYear || 'N/A'}</td>
                      <td className="border border-gray-300 p-2">{edu.qualification || 'N/A'}</td>
                      <td className="border border-gray-300 p-2">{edu.institution || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm italic text-gray-500">No educational qualifications listed.</p>
            )}
          </div>

          {/* Work Experience */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">5. Work Experience</h3>
            {employee.workExperience && employee.workExperience.length > 0 ? (
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left w-1/4">Period</th>
                    <th className="border border-gray-300 p-2 text-left w-1/4">Company</th>
                    <th className="border border-gray-300 p-2 text-left">Job Description</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.workExperience.map((exp, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 p-2 whitespace-pre-wrap">{exp.workPeriod || 'N/A'}</td>
                      <td className="border border-gray-300 p-2 font-medium">{exp.companyName || 'N/A'}</td>
                      <td className="border border-gray-300 p-2">{exp.jobDescription || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm italic text-gray-500">No work experience listed.</p>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
