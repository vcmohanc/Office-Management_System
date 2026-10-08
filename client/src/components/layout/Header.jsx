import { Search, Bell, HelpCircle, Menu } from 'lucide-react';

import { useSearchParams } from 'react-router-dom';

export default function Header({ activeTab, user, setActiveTab, setMobileMenuOpen }) {
  const avatarName = user?.username ? user.username : 'Admin User';
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';

  const handleSearch = (e) => {
    if (e.target.value) {
      searchParams.set('search', e.target.value);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const tabLabels = {
    'Dashboard': 'ダッシュボード',
    'New Case': '新規案件',
    'Case List': '案件一覧',
    'Payment Entry': '支払済請求書一覧',
    'Paid Status': '支払台帳',
    'Staff Registration': 'スタッフ登録',
    'Staff List': 'スタッフ一覧',
    'Assign Work Place': '配属先',
    'Visa Management': 'ビザ管理',
    'Resignation': '退職',
    'Staff Claim Request': 'スタッフ経費精算',
    'Expense SetUp': '経費設定',
    'Settings': '設定',
    'B2B部門': 'B2B部門',
    '経理部門': '経理部門',
    '人事部門': '人事部門',
    '事業部門': '事業部門',
    'サポート部門': 'サポート部門'
  };

  const displayTab = tabLabels[activeTab] || activeTab;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 md:px-8 min-h-[64px] shrink-0">
      <div className="flex items-center min-w-0 mr-2">
        <button 
          onClick={() => setMobileMenuOpen?.(prev => !prev)}
          className="md:hidden mr-2.5 p-1.5 text-[#162D50] hover:bg-gray-100 rounded-md focus:outline-none cursor-pointer shrink-0"
          aria-label="メニュー"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-2xl font-bold text-[#162D50] truncate">
          {activeTab === 'Dashboard' ? 'OMS' : displayTab}
        </h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="検索..." 
            value={search}
            onChange={handleSearch}
            className="pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-[#F3F4F6] border-none rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#162D50] w-28 sm:w-44 md:w-64"
          />
        </div>
        <button className="text-gray-500 hover:text-gray-700 hidden sm:block p-1">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-gray-500 hover:text-gray-700 hidden sm:block p-1">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveTab('Settings')}
          className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border border-gray-200 hover:ring-2 hover:ring-[#162D50] transition-all cursor-pointer focus:outline-none shrink-0"
          title="Account Settings"
        >
          <img src={`https://ui-avatars.com/api/?name=${avatarName}&background=random`} alt="Avatar" />
        </button>
      </div>
    </header>
  );
}
