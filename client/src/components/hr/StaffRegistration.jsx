import { Calendar, Trash2, Plus, UploadCloud, AlertCircle } from 'lucide-react';

export default function StaffRegistration() {
  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#F8F9FA]">
          <h2 className="text-xl font-bold text-[#162D50]">スタッフ新規登録・オンボーディング</h2>
          <div className="bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium">
            スタッフID: <span className="font-bold text-[#162D50]">#STF-8824</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">部門を選択</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>部門を選択</option>
                <option>監査・コンプライアンス</option>
                <option>税務</option>
                <option>給与</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">入社日</label>
              <div className="relative">
                <input type="text" placeholder="年 / 月 / 日" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">カタカナ氏名</label>
              <input type="text" placeholder="例：ヤマダ タロウ" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">ローマ字氏名</label>
              <input type="text" placeholder="例：TARO YAMADA" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">国籍</label>
              <input type="text" placeholder="国籍を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">生年月日</label>
              <div className="relative">
                <input type="text" placeholder="年 / 月 / 日" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">年齢</label>
              <input type="text" placeholder="年齢" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">性別</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>性別を選択</option>
                <option>男性</option>
                <option>女性</option>
                <option>その他</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Visa and Employment Status */}
          <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">ビザ・雇用状況</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">現在のビザ区分</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>ビザ区分を選択</option>
                <option>就労ビザ</option>
                <option>留学ビザ</option>
                <option>永住者</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">雇用形態</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>雇用形態を選択</option>
                <option>正社員</option>
                <option>パート・アルバイト</option>
                <option>契約社員</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">ビザ開始日</label>
              <div className="relative">
                <input type="text" placeholder="年 / 月 / 日" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">ビザ終了日</label>
              <div className="relative">
                <input type="text" placeholder="年 / 月 / 日" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">ビザ更新日</label>
              <div className="relative">
                <input type="text" placeholder="年 / 月 / 日" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Educational Qualifications */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">学歴</h3>
            <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md mb-3 flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">卒業年</label>
                <input type="text" placeholder="例：2020" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">学位・資格</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option>学位・資格を選択</option>
                  <option>学士</option>
                  <option>修士</option>
                  <option>博士</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">学校名</label>
                <input type="text" placeholder="学校名を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
              </div>
              <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <button className="flex items-center text-sm font-bold text-[#162D50] border border-dashed border-[#162D50] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> 学歴を追加
            </button>
          </div>

          {/* Work Experience */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">職歴</h3>
            <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md mb-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">会社名</label>
                  <input type="text" placeholder="会社名を入力" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">在籍期間</label>
                  <input type="text" placeholder="例：2020年1月～2022年12月" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">業務内容</label>
                  <textarea placeholder="担当業務・役割の概要" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white resize-none"></textarea>
                </div>
                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-6 border border-transparent hover:border-red-200">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button className="flex items-center text-sm font-bold text-[#162D50] border border-dashed border-[#162D50] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> 職歴を追加
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Personality */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">性格・特性</h3>
            <input type="text" placeholder="特徴的な性格・特性" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-[#F8F9FA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
          </div>

          {/* Language Fluency */}
          <div>
            <h3 className="text-sm font-bold text-[#162D50] uppercase tracking-wider mb-4">語学力</h3>
            <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-md grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">英語</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option>レベルを選択</option>
                  <option>ネイティブ</option>
                  <option>流暢</option>
                  <option>日常会話レベル</option>
                  <option>初級</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">日本語</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                  <option>レベルを選択</option>
                  <option>ネイティブ</option>
                  <option>N1</option>
                  <option>N2</option>
                  <option>N3</option>
                  <option>N4</option>
                  <option>N5</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">その他の言語</label>
                <div className="flex space-x-2">
                  <input type="text" placeholder="言語名" className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm bg-white" />
                  <select className="w-24 px-2 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700">
                    <option>レベル</option>
                    <option>ネイティブ</option>
                    <option>流暢</option>
                    <option>初級</option>
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
              <input type="text" placeholder="cm" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">体重 (kg)</label>
              <input type="text" placeholder="kg" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">衣類サイズ</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>サイズを選択</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">靴のサイズ (cm)</label>
              <input type="text" placeholder="例：26.5" className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50]" />
            </div>
          </div>

          {/* Uploads */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">スタッフ写真・書類アップロード</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-[#F8F9FA] hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-[#162D50]">
                <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                <p className="text-sm font-medium text-center">クリックしてアップロード、またはスタッフ写真・誓約書をドラッグ＆ドロップ</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF（最大5MBまで）</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">オンボーディング状況</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#162D50] text-gray-700 bg-white">
                <option>確認待ち</option>
                <option>在籍中</option>
                <option>書類不備</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">天引き誓約書</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-[#F8F9FA] hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-[#162D50]">
                <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                <p className="text-sm font-medium text-center">クリックしてアップロード、または誓約書をドラッグ＆ドロップ</p>
                <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG（最大5MBまで）</p>
              </div>
              <div className="flex items-center text-red-500 text-xs mt-2 font-medium">
                <AlertCircle className="w-3 h-3 mr-1" />
                給与天引きが発生する案件、または退職時には提出が必要です。
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
            <button className="bg-[#162D50] text-white px-6 py-2.5 rounded-md text-sm font-bold hover:bg-[#0f1f38] transition-colors shadow-sm uppercase tracking-wider">
              登録を確定
            </button>
            <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider">
              キャンセル
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
