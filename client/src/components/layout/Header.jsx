import { Search, Bell, HelpCircle } from 'lucide-react';
import { NAV_LABELS } from '../../constants/navigation';

export default function Header({ activeTab, user, setActiveTab }) {
  const avatarName = user?.username ? user.username : 'User';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 min-h-[64px]">
      <h1 className="text-2xl font-bold text-[#162D50]">
        {NAV_LABELS[activeTab] || '立替・精算管理システム'}
      </h1>
      <div className="flex items-center space-x-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ケースIDで検索..."
            className="pl-9 pr-4 py-2 bg-[#F3F4F6] border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] w-64"
          />
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border border-gray-200 hover:ring-2 hover:ring-[#162D50] transition-all cursor-pointer focus:outline-none"
          title="アカウント設定"
        >
          <img src={`https://ui-avatars.com/api/?name=${avatarName}&background=random`} alt="アバター" />
        </button>
      </div>
    </header>
  );
}
