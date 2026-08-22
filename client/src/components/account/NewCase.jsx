import { useState } from 'react';
import { User, ChevronDown, Box, Calendar, UploadCloud, ArrowRight, Wallet, Landmark, FileText, ArrowLeft, Image } from 'lucide-react';

export default function NewCase() {
  const [newCaseStep, setNewCaseStep] = useState(1);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header and Stepper */}
      <div className="flex justify-between items-start pt-2">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-2">新規案件登録</h2>
          <p className="text-gray-500 text-sm">関連する財務詳細とともに、新しい前払金または精算案件を登録します。</p>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium mt-2">
          <div className="flex items-center text-[#162D50]">
            <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">1</div>
            案件詳細
          </div>
          <div className={`w-16 h-px ${newCaseStep >= 2 ? 'bg-[#162D50]' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${newCaseStep >= 2 ? 'text-[#162D50]' : 'text-gray-400'}`}>
            {newCaseStep >= 2 && (
              <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">2</div>
            )}
            経費詳細
          </div>
          <div className={`w-16 h-px ${newCaseStep >= 3 ? 'bg-[#162D50]' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${newCaseStep >= 3 ? 'text-[#162D50]' : 'text-gray-400'}`}>
            {newCaseStep >= 3 ? (
              <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">3</div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mr-2">3</div>
            )}
            確認
          </div>
        </div>
      </div>

      {newCaseStep === 1 && (
        <>
          {/* Staff Information Section */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="p-6">
          <div className="flex items-center text-[#162D50] font-bold mb-4">
            <User className="w-4 h-4 mr-2" />
            スタッフ情報
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">氏名</label>
              <input type="text" placeholder="Enter full name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">スタッフID</label>
              <input type="text" placeholder="ID-00000" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">就業場所</label>
              <div className="relative">
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option>Select Location</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Category Section */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="p-6">
          <div className="flex items-center text-[#162D50] font-bold mb-4">
            <Box className="w-4 h-4 mr-2" />
            案件カテゴリー
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">経費タイプ</label>
              <div className="relative">
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option>Select Type</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">立替者カテゴリー</label>
              <div className="relative">
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option>Select Category</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">立替者名</label>
              <input type="text" placeholder="Enter name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">費用負担者</label>
              <div className="relative">
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                  <option>Select Bearing Party</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">金額 (¥)</label>
              <input type="number" defaultValue="0" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">経費期間</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input type="text" placeholder="年 /月/日" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                </div>
                <span className="text-gray-500">-</span>
                <div className="relative flex-1">
                  <input type="text" placeholder="年 /月/日" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-tight">Note: Claims are typically processed for expenses between the 11th and 27th of the month.</p>
            </div>
          </div>

          <hr className="mb-6 border-gray-200" />

          {/* Summary Box */}
          <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-6 flex justify-between items-center mb-6">
            <div>
              <div className="font-bold text-sm text-gray-800 mb-1">複数案件サマリー</div>
              <div className="text-xs text-gray-500">上記すべての項目の合計計算</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs text-gray-800 mb-1">経費合計金額</div>
              <div className="text-2xl font-bold text-[#162D50]">¥ 0</div>
            </div>
          </div>

          {/* Add Another Case Button */}
          <button className="flex items-center px-5 py-2 border border-[#162D50] text-[#162D50] rounded-md font-bold text-sm hover:bg-gray-50 transition-colors">
            + 別の事例を追加する
          </button>
        </div>
      </div>

      {/* Attachment Section */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="p-6">
          <div className="flex items-center text-[#162D50] font-bold mb-2">
            <FileText className="w-4 h-4 mr-2" />
            添付書類
          </div>
          <p className="text-gray-500 text-sm mb-6">領収書、請求書、または誓約書をアップロードしてください。</p>

          <div className="border-2 border-dashed border-gray-300 rounded-md bg-[#FAFAFA] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 bg-[#162D50] rounded-xl flex items-center justify-center mb-4">
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
            <p className="font-bold text-[#162D50] text-sm mb-2">クリックしてアップロード、またはファイルをドラッグ＆ドロップ</p>
            <p className="text-gray-500 text-xs">PDF, PNG, JPG (最大 5MB)</p>
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => setNewCaseStep(2)}
          className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
          次へ <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
      </>
      )}

      {newCaseStep === 2 && (
        <>
          {/* Amount Details Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <Wallet className="w-4 h-4 mr-2" />
                金額詳細
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">経費総額 (¥)</label>
                  <input type="number" defaultValue="0" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">通貨</label>
                  <div className="relative">
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>JPY (Japanese Yen)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">前回の未決済残高 (¥)</label>
                  <input type="number" defaultValue="0" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">未決済残高を合計に加算しますか？</label>
                  <div className="flex items-center mt-3">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                      <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                    <span className="text-gray-500 text-sm font-medium">Include balance</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">最終合計金額 (¥)</label>
                <div className="w-full bg-[#162D50] text-white px-4 py-3 rounded-md font-bold">
                  10000
                </div>
              </div>
            </div>
          </div>

          {/* Settlement Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <Landmark className="w-4 h-4 mr-2" />
                アドバンサーへの精算
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">精算方法</label>
                  <div className="relative">
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>Select Method</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">精算予定日</label>
                  <div className="relative">
                    <input type="text" placeholder="年 /月/日" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                    <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <FileText className="w-4 h-4 mr-2" />
                費用負担者からの回収
              </div>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">回収方法</label>
                  <div className="relative">
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>Select Method</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">分割払いプラン</label>
                  <div className="relative">
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600">
                      <option>Single Payment</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">回収開始月</label>
                  <div className="relative">
                    <input type="text" placeholder="----年--月" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                    <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                  </div>
                </div>
              </div>

              {/* Navigation Buttons for Step 2 */}
              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  onClick={() => setNewCaseStep(1)}
                  className="px-8 py-2 border border-gray-300 text-gray-700 rounded-md font-bold text-sm flex items-center hover:bg-gray-50 transition-colors shadow-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <button 
                  onClick={() => setNewCaseStep(3)}
                  className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {newCaseStep === 3 && (
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-md p-8">
          <h3 className="text-[#162D50] text-xl font-bold mb-2">内容の確認・申請</h3>
          <p className="text-gray-500 text-sm mb-8">最終的な申請の前に、すべての案件情報を確認してください。</p>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Left Column: Case Information */}
            <div>
              <h4 className="text-[#162D50] font-bold mb-4">案件情報</h4>
              <div className="bg-white border border-gray-200 rounded-md p-6">
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Staff Name</span>
                    <span className="font-bold text-[#162D50]">Johnathan Doe</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Staff ID</span>
                    <span className="font-bold text-[#162D50]">EMP-8829</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Expense Type</span>
                    <span className="font-bold text-[#162D50]">Domitory</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">Date</span>
                    <span className="font-bold text-[#162D50]">Oct 24, 2023</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Financial Overview */}
            <div>
              <h4 className="text-[#162D50] font-bold mb-4">財務概要</h4>
              <div className="bg-[#162D50] rounded-md p-6 text-white h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-blue-200 text-sm">Total Amount</span>
                  <span className="text-2xl font-bold">¥ 1,250.00</span>
                </div>
                <div className="border-t border-blue-800/50 my-2 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Method</span>
                    <span className="font-medium">Bank Transfer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Recovery</span>
                    <span className="font-medium">Payroll Deduction (3 Months)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <h4 className="text-[#162D50] font-bold mb-4">添付書類</h4>
            <div className="flex space-x-4">
              <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex items-center text-sm font-bold text-[#162D50] shadow-sm">
                <FileText className="w-4 h-4 mr-2" />
                Receipt.pdf
              </div>
              <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex items-center text-sm font-bold text-[#162D50] shadow-sm">
                <Image className="w-4 h-4 mr-2" />
                Pledge.jpg
              </div>
            </div>
          </div>

          {/* Navigation Buttons for Step 3 */}
          <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
            <button 
              onClick={() => setNewCaseStep(2)}
              className="px-8 py-2 border border-gray-300 text-gray-700 rounded-md font-bold text-sm flex items-center hover:bg-gray-50 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <button 
              onClick={() => {
                alert("Successfully Submitted!");
                setNewCaseStep(1);
              }}
              className="bg-[#0A192F] text-white px-10 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
              申請
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
