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
            <h2 className="text-lg font-bold text-gray-800">スタッフ詳細シート</h2>
            <div className="flex items-center space-x-2">
              <button onClick={handlePrint} className="px-3 py-1.5 text-sm font-medium border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center">
                <Download className="w-4 h-4 mr-2" /> PDF
              </button>
              <button onClick={handlePrint} className="px-3 py-1.5 text-sm font-medium border border-gray-300 bg-[#162D50] text-white hover:bg-[#0f1f3a] flex items-center">
                <Printer className="w-4 h-4 mr-2" /> 印刷
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
            <h1 className="text-2xl font-bold uppercase tracking-widest text-gray-900">スタッフスキルシート</h1>
          </div>

          {/* Profile Section */}
          <div className="flex flex-col md:flex-row items-start justify-between mb-8">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <div className="w-24 h-24 border-2 border-gray-800 flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
                {employee.photo ? (
                  <img src={employee.photo} alt="スタッフ写真" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{employee.romajiName || 'Unknown'}</h2>
                <p className="text-gray-600 mb-2">{employee.katakanaName || 'N/A'}</p>
                <div className="text-sm">
                  <span className="font-semibold uppercase mr-2">スタッフID:</span> #{employee._id?.slice(-6).toUpperCase()}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-semibold uppercase mr-2">ステータス:</span> {employee.onboardingステータス || 'Active'}
                </div>
              </div>
            </div>
            <div className="text-left md:text-right text-sm">
              <div className="mb-1"><span className="font-semibold uppercase mr-1">部署:</span> {Array.isArray(employee.department) ? employee.department.join(', ') : (employee.department || 'N/A')}</div>
              <div className="mb-1"><span className="font-semibold uppercase mr-1">入社日:</span> {formatDate(employee.joinDate)}</div>
              <div className="mb-1"><span className="font-semibold uppercase mr-1">国籍:</span> {employee.nationality || 'N/A'}</div>
              <div><span className="font-semibold uppercase mr-1">性別:</span> {employee.gender || 'N/A'}</div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">1. 個人情報</h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <tbody>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">生年月日</td>
                  <td className="border border-gray-300 p-2 w-1/4">{formatDate(employee.dob)}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">年齢</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.age} 歳</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">身長</td>
                  <td className="border border-gray-300 p-2">{employee.physicalAttributes?.height ? `${employee.physicalAttributes.height} cm` : 'N/A'}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">体重</td>
                  <td className="border border-gray-300 p-2">{employee.physicalAttributes?.weight ? `${employee.physicalAttributes.weight} kg` : 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">服のサイズ</td>
                  <td className="border border-gray-300 p-2">{employee.physicalAttributes?.clothingSize || 'N/A'}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">靴のサイズ</td>
                  <td className="border border-gray-300 p-2">{employee.physicalAttributes?.shoeSize ? `${employee.physicalAttributes.shoeSize} cm` : 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Visa & Employment */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">2. ビザ・雇用状況</h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <tbody>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">入社区分</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.joiningType || 'N/A'}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">ビザステータス</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.visaステータス || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">ビザ開始日</td>
                  <td className="border border-gray-300 p-2">{formatDate(employee.visaStartDate)}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">ビザ終了日</td>
                  <td className="border border-gray-300 p-2">{formatDate(employee.visaEndDate)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2">更新予定日</td>
                  <td className="border border-gray-300 p-2" colSpan="3">{formatDate(employee.visaRenewalDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Skills & Language */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">3. スキル・語学力</h3>
            <table className="w-full text-sm border-collapse border border-gray-300 mb-4">
              <tbody>
                <tr>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">日本語</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.languageFluency?.japanese || 'N/A'}</td>
                  <td className="border border-gray-300 bg-gray-100 font-semibold p-2 w-1/4">英語</td>
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
              <span className="font-semibold block mb-1">性格の特徴:</span>
              <p className="border border-gray-300 p-3 bg-gray-50">{employee.personality || '性格の記述はありません。'}</p>
            </div>
          </div>

          {/* Educational Qualifications */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">4. 学歴</h3>
            {employee.educationalQualifications && employee.educationalQualifications.length > 0 ? (
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left w-1/4">卒業年</th>
                    <th className="border border-gray-300 p-2 text-left w-1/3">資格・学位</th>
                    <th className="border border-gray-300 p-2 text-left">学校名</th>
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
              <p className="text-sm italic text-gray-500">学歴が登録されていません。</p>
            )}
          </div>

          {/* Work Experience */}
          <div className="mb-8">
            <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-4 pb-1">5. 職歴</h3>
            {employee.workExperience && employee.workExperience.length > 0 ? (
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left w-1/4">期間</th>
                    <th className="border border-gray-300 p-2 text-left w-1/4">会社名</th>
                    <th className="border border-gray-300 p-2 text-left">職務内容</th>
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
              <p className="text-sm italic text-gray-500">職歴が登録されていません。</p>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
