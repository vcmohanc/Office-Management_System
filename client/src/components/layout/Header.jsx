import { Search, Bell, HelpCircle } from 'lucide-react';

import { useSearchParams } from 'react-router-dom';

export default function Header({ activeTab, user, setActiveTab }) {
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

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 min-h-[64px]">
      <h1 className="text-2xl font-bold text-[#162D50]">
        {activeTab === 'Dashboard' ? 'OMS VegeCoop' : activeTab}
      </h1>
      <div className="flex items-center space-x-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={handleSearch}
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
          onClick={() => setActiveTab('Settings')}
          className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border border-gray-200 hover:ring-2 hover:ring-[#162D50] transition-all cursor-pointer focus:outline-none"
          title="Account Settings"
        >
          <img src={`https://ui-avatars.com/api/?name=${avatarName}&background=random`} alt="Avatar" />
        </button>
      </div>
    </header>
  );
}
