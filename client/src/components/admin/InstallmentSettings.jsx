import { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { getInstallmentThreshold, setInstallmentThreshold } from '../../constants/installmentSettings';

export default function InstallmentSettings() {
  const [threshold, setThreshold] = useState(getInstallmentThreshold());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setInstallmentThreshold(Number(threshold));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#162D50] mb-2">分割天引き設定</h2>
        <p className="text-gray-500 text-sm">この金額を超える案件は、新規案件登録の確認時に分割払いが自動的に提案されます（分割回数・条件は都度相談のうえ決定するため、自動計算は行いません）。</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6">
        {saved && (
          <div className="mb-4 p-3 rounded-md flex items-center text-sm bg-green-50 text-green-700">
            <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
            設定を保存しました
          </div>
        )}
        <label className="block text-sm font-bold text-gray-700 mb-2">分割払い提案の上限金額 (¥)</label>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#162D50]"
          />
          <button
            onClick={handleSave}
            className="flex items-center bg-[#162D50] text-white px-6 py-2.5 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm whitespace-nowrap"
          >
            <Save className="w-4 h-4 mr-2" /> 保存
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">現在の設定：この金額（¥{Number(threshold || 0).toLocaleString()}）を超える案件は、分割払いを推奨する案内が表示されます。申請者・経理担当者はこの提案を確認のうえ、実際に分割するかどうかを判断できます。</p>
      </div>
    </div>
  );
}
