import {
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NAV_ITEMS_BY_ROLE, NAV_LABELS } from '../../constants/navigation';
import { ROLES, ROLE_LABELS } from '../../constants/roles';

export default function Sidebar({ activeTab, setActiveTab, openMenus, toggleMenu, setToken, user }) {
  const navigate = useNavigate();
  const role = user?.role || ROLES.ADMIN;
  const navItems = NAV_ITEMS_BY_ROLE[role] || [];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#F2F4F7] flex flex-col justify-between border-r border-gray-200">
      <div>
        <div className="p-5 flex items-center mb-4">
          <div className="w-10 h-10 bg-[#162D50] rounded flex items-center justify-center text-white font-bold mr-3 uppercase">
            {user?.username ? user.username[0] : 'A'}
          </div>
          <div>
            <h2 className="text-[#162D50] font-bold text-lg leading-tight capitalize">{user?.username || 'Admin'}</h2>
            <p className="text-xs text-gray-500">{ROLE_LABELS[role] || role}</p>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            const hasSubItems = !!item.subItems;
            const isOpen = openMenus[item.key];

            return (
              <div key={item.key} className="flex flex-col">
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleMenu(item.key);
                    } else {
                      setActiveTab(item.key);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-gray-200 text-[#162D50] font-bold'
                      : 'text-[#4A5568] hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#162D50]' : 'text-gray-500'}`} />
                    <span className="text-sm">{NAV_LABELS[item.key]}</span>
                  </div>
                  {hasSubItems && (
                    isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {hasSubItems && isOpen && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTab === subItem.key;
                      return (
                        <button
                          key={subItem.key}
                          onClick={() => setActiveTab(subItem.key)}
                          className={`w-full flex items-center px-4 py-2 rounded-md transition-colors text-sm ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                          }`}
                        >
                          <SubIcon className={`w-4 h-4 mr-3 ${isSubActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          {NAV_LABELS[subItem.key]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Settings — always visible for every role */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md transition-colors ${
              activeTab === 'settings' ? 'bg-gray-200 text-[#162D50] font-bold' : 'text-[#4A5568] hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <SettingsIcon className={`w-5 h-5 mr-3 ${activeTab === 'settings' ? 'text-[#162D50]' : 'text-gray-500'}`} />
              <span className="text-sm">{NAV_LABELS.settings}</span>
            </div>
          </button>
        </nav>
      </div>

      <div className="p-3 space-y-1 mb-2">
        <a href="#" className="flex items-center px-4 py-2 text-[#4A5568] hover:bg-gray-200 rounded-md">
          <HelpCircle className="w-5 h-5 mr-3 text-gray-500" />
          <span className="font-medium text-sm">サポート</span>
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-[#4A5568] hover:bg-gray-200 rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-gray-500" />
          <span className="font-medium text-sm">ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
