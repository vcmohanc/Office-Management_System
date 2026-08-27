import { useState } from 'react';
import { User, ChevronDown, Box, Calendar, UploadCloud, ArrowRight, Wallet, Landmark, FileText, ArrowLeft, Paperclip } from 'lucide-react';
import {
  EXPENSE_TYPES,
  getExpenseType,
  ADVANCER_CATEGORIES,
  TARGET_CATEGORIES,
  COST_BEARER_CATEGORIES,
  SETTLEMENT_METHODS,
  COLLECTION_METHODS,
  SUGGESTED_METHODS_BY_COST_BEARER,
  ATTACHMENT_HINT,
} from '../../constants/expenseTypes';

export default function NewCase() {
  const [newCaseStep, setNewCaseStep] = useState(1);
  const user = JSON.parse(localStorage.getItem('user')) || { username: '申請者' };

  const [expenseTypeKey, setExpenseTypeKey] = useState('');
  const [advancerCategory, setAdvancerCategory] = useState('');
  const [advancerName, setAdvancerName] = useState('');
  const [targetCategory, setTargetCategory] = useState('');
  const [targetName, setTargetName] = useState('');
  const [costBearer, setCostBearer] = useState('');
  const [amount, setAmount] = useState('');
  const [settlementMethod, setSettlementMethod] = useState('');
  const [collectionMethod, setCollectionMethod] = useState('');
  const [wantsInstallment, setWantsInstallment] = useState(false);
  const [installmentNote, setInstallmentNote] = useState('');
  const [attachments, setAttachments] = useState([]);

  const selectedType = getExpenseType(expenseTypeKey);

  const handleTypeChange = (key) => {
    setExpenseTypeKey(key);
    const type = getExpenseType(key);
    setTargetCategory(type?.targetCategoryFixed ? type.targetCategory : '');
    if (type?.defaultCostBearer) {
      handleCostBearerChange(type.defaultCostBearer);
    }
  };

  const handleCostBearerChange = (value) => {
    setCostBearer(value);
    const suggestion = SUGGESTED_METHODS_BY_COST_BEARER[value];
    if (suggestion) {
      setSettlementMethod(suggestion.settlement);
      setCollectionMethod(suggestion.collection);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header and Stepper */}
      <div className="flex justify-between items-start pt-2">
        <div>
          <h2 className="text-2xl font-bold text-[#162D50] mb-2">新規案件登録</h2>
          <p className="text-gray-500 text-sm">立替が発生した案件の情報を登録し、精算・回収の処理を申請します。</p>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium mt-2">
          <div className="flex items-center text-[#162D50]">
            <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">1</div>
            立替情報
          </div>
          <div className={`w-16 h-px ${newCaseStep >= 2 ? 'bg-[#162D50]' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${newCaseStep >= 2 ? 'text-[#162D50]' : 'text-gray-400'}`}>
            {newCaseStep >= 2 ? (
              <div className="w-6 h-6 rounded-full bg-[#162D50] text-white flex items-center justify-center mr-2">2</div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mr-2">2</div>
            )}
            金額・精算
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
          {/* Applicant Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <User className="w-4 h-4 mr-2" />
                申請者情報
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">申請者</label>
                  <input type="text" value={user.username} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600" />
                </div>
                <div className="col-span-2 flex items-end">
                  <p className="text-xs text-gray-400 leading-tight">申請者は本案件をシステムに登録する人です。実際に費用を立て替えた人（立替者）とは異なる場合があります。</p>
                </div>
              </div>
            </div>
          </div>

          {/* 立替情報 Section (fields (1)-(6)) */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <Box className="w-4 h-4 mr-2" />
                立替情報
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">(1) 種別</label>
                  <div className="relative">
                    <select
                      value={expenseTypeKey}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
                    >
                      <option value="">種別を選択</option>
                      {EXPENSE_TYPES.map((t) => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">(2) 立替者区分</label>
                  <div className="relative">
                    <select
                      value={advancerCategory}
                      onChange={(e) => setAdvancerCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
                    >
                      <option value="">区分を選択</option>
                      {ADVANCER_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">(3) 立替者</label>
                  <input
                    type="text"
                    value={advancerName}
                    onChange={(e) => setAdvancerName(e.target.value)}
                    placeholder="立替者の氏名を入力"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">(4) 対象区分</label>
                  <div className="relative">
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      disabled={!!selectedType?.targetCategoryFixed}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600 ${selectedType?.targetCategoryFixed ? 'bg-gray-50' : ''}`}
                    >
                      <option value="">区分を選択</option>
                      {TARGET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                  {selectedType?.targetCategoryFixed && (
                    <p className="text-xs text-gray-400 mt-1">選択した種別により自動設定されています</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">(5) 対象</label>
                  <input
                    type="text"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    placeholder="対象スタッフ・派遣先名を入力"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">(6) 費用負担先</label>
                  <div className="relative">
                    <select
                      value={costBearer}
                      onChange={(e) => handleCostBearerChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
                    >
                      <option value="">負担先を選択</option>
                      {COST_BEARER_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                  {selectedType?.defaultCostBearer && (
                    <p className="text-xs text-gray-400 mt-1">初期値は種別から自動設定（変更可）</p>
                  )}
                </div>
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
          {/* (7) 金額・内容 Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <Wallet className="w-4 h-4 mr-2" />
                (7) 金額・内容
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">発生日</label>
                  <div className="relative">
                    <input type="text" placeholder="年/月/日" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                    <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">金額 (¥)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">理由</label>
                  <input type="text" placeholder="立替が発生した理由" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                </div>
              </div>

              {selectedType && selectedType.extraFields.length > 0 && (
                <div className="grid grid-cols-3 gap-6 mb-6 bg-[#F8F9FA] border border-gray-200 rounded-md p-4">
                  {selectedType.extraFields.map((f) => (
                    <div key={f.key}>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{f.label}</label>
                      <input type="text" placeholder={f.label} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">内容・備考</label>
                <textarea rows={3} placeholder="内容や補足事項を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
              </div>
            </div>
          </div>

          {/* (8) 精算・回収方法 Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-4">
                <Landmark className="w-4 h-4 mr-2" />
                (8) 精算・回収方法
              </div>

              <div className="mb-2 text-xs font-bold text-gray-500 tracking-wide">立替者への精算</div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">精算方法</label>
                  <div className="relative">
                    <select
                      value={settlementMethod}
                      onChange={(e) => setSettlementMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
                    >
                      <option value="">方法を選択</option>
                      {SETTLEMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">精算予定日</label>
                  <div className="relative">
                    <input type="text" placeholder="年/月/日" className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                    <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-800" />
                  </div>
                </div>
              </div>

              <hr className="mb-6 border-gray-200" />

              <div className="mb-2 text-xs font-bold text-gray-500 tracking-wide">費用負担先からの回収</div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">回収方法</label>
                  <div className="relative">
                    <select
                      value={collectionMethod}
                      onChange={(e) => setCollectionMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-600"
                    >
                      <option value="">方法を選択</option>
                      {COLLECTION_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={wantsInstallment}
                      onChange={(e) => setWantsInstallment(e.target.checked)}
                      className="w-4 h-4 mr-2 accent-[#162D50]"
                    />
                    分割払いを希望する
                  </label>
                </div>
              </div>

              {wantsInstallment && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">分割に関する備考</label>
                  <textarea
                    rows={2}
                    value={installmentNote}
                    onChange={(e) => setInstallmentNote(e.target.value)}
                    placeholder="希望する分割回数など、詳細は経理担当者と別途調整します"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* (9) 添付 Section */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-6">
              <div className="flex items-center text-[#162D50] font-bold mb-2">
                <FileText className="w-4 h-4 mr-2" />
                (9) 添付
              </div>
              <p className="text-gray-500 text-sm mb-6">{ATTACHMENT_HINT}</p>

              <label className="border-2 border-dashed border-gray-300 rounded-md bg-[#FAFAFA] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                <div className="w-12 h-12 bg-[#162D50] rounded-xl flex items-center justify-center mb-4">
                  <UploadCloud className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-[#162D50] text-sm mb-2">クリックしてアップロード、またはファイルをドラッグ＆ドロップ</p>
                <p className="text-gray-500 text-xs">PDF, PNG, JPG（複数選択可、最大5MBまで）</p>
              </label>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {attachments.map((name, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-md px-4 py-2 flex items-center text-sm text-[#162D50] shadow-sm">
                      <Paperclip className="w-4 h-4 mr-2" />
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons for Step 2 */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setNewCaseStep(1)}
              className="px-8 py-2 border border-gray-300 text-gray-700 rounded-md font-bold text-sm flex items-center hover:bg-gray-50 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> 戻る
            </button>
            <button
              onClick={() => setNewCaseStep(3)}
              className="bg-[#0A192F] text-white px-8 py-3 rounded-md font-bold text-sm flex items-center hover:bg-[#162D50] transition-colors shadow-sm">
              次へ <ArrowRight className="w-4 h-4 ml-2" />
            </button>
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
                    <span className="text-gray-500">種別</span>
                    <span className="font-bold text-[#162D50]">{selectedType?.label || '未選択'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">立替者</span>
                    <span className="font-bold text-[#162D50]">{advancerName || '未入力'}（{advancerCategory || '未選択'}）</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">対象</span>
                    <span className="font-bold text-[#162D50]">{targetName || '未入力'}（{targetCategory || '未選択'}）</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-500">費用負担先</span>
                    <span className="font-bold text-[#162D50]">{costBearer || '未選択'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Financial Overview */}
            <div>
              <h4 className="text-[#162D50] font-bold mb-4">精算・回収概要</h4>
              <div className="bg-[#162D50] rounded-md p-6 text-white h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-blue-200 text-sm">金額</span>
                  <span className="text-2xl font-bold">¥ {amount ? Number(amount).toLocaleString() : '0'}</span>
                </div>
                <div className="border-t border-blue-800/50 my-2 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">精算方法</span>
                    <span className="font-medium">{settlementMethod || '未選択'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">回収方法</span>
                    <span className="font-medium">{collectionMethod || '未選択'}{wantsInstallment ? '（分割希望）' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <h4 className="text-[#162D50] font-bold mb-4">添付書類</h4>
            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {attachments.map((name, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-md px-4 py-3 flex items-center text-sm font-bold text-[#162D50] shadow-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    {name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">添付ファイルはありません</p>
            )}
          </div>

          {/* Navigation Buttons for Step 3 */}
          <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
            <button
              onClick={() => setNewCaseStep(2)}
              className="px-8 py-2 border border-gray-300 text-gray-700 rounded-md font-bold text-sm flex items-center hover:bg-gray-50 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> 戻る
            </button>
            <button
              onClick={() => {
                alert('申請しました');
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
