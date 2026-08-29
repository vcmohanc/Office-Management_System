import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Briefcase,
  LifeBuoy,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  FilePlus,
  ListTodo,
  CreditCard,
  Banknote,
  Plane,
  UserMinus,
  List,
  UserPlus,
  FileText,
  ClipboardList,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ activeTab, setActiveTab, openMenus, toggleMenu, setToken, user }) {
  const navigate = useNavigate();

  const allNavItems = [
    { name: 'B2B Department', icon: Briefcase },
    { 
      name: 'Account Department', 
      icon: Building2,
      subItems: [
        { name: 'New Case', icon: FilePlus },
        { name: 'Case List', icon: ListTodo },
        { name: 'Payment Status', icon: CreditCard },
        { name: 'Payment Entry', icon: Banknote }
      ]
    },
    { 
      name: 'HR Department', 
      icon: Users,
      subItems: [
        { name: 'Staff Registration', icon: UserPlus },
        { name: 'Staff List', icon: List },
        { name: 'Visa Management', icon: Plane },
        { name: 'Resignation', icon: UserMinus }
      ]
    },
    { name: 'Business Department', icon: Briefcase },
    { 
      name: 'Support Department', 
      icon: LifeBuoy,
      subItems: [
        { name: 'Staff Claim Request', icon: FileText },
        { name: 'Claim List', icon: ClipboardList }
      ]
    },
    { name: 'Settings', icon: SettingsIcon },
  ];

  const navItems = allNavItems.filter(item => {
    // Admin sees B2B Department and Settings
    if (!user || user.role === 'admin') {
      return item.name === 'B2B Department' || item.name === 'Settings';
    }
    
    // Other roles see their department and Settings
    if (item.name === 'Settings') return true;
    if (user.role === 'hr' && item.name === 'HR Department') return true;
    if (user.role === 'account' && item.name === 'Account Department') return true;
    if (user.role === 'support' && item.name === 'Support Department') return true;
    
    return false;
  });

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
            <p className="text-xs text-gray-500 capitalize">{user?.role === 'admin' ? 'System Administrator' : `${user?.role} Department`}</p>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            const hasSubItems = !!item.subItems;
            const isOpen = openMenus[item.name];

            return (
              <div key={item.name} className="flex flex-col">
                <button
                  onClick={() => {
                    setActiveTab(item.name);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-[#162D50] text-white font-bold'
                      : 'text-[#4A5568] hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                </button>
                
                {/* Sub items static */}
                {hasSubItems && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                    {item.subItems.map(subItem => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTab === subItem.name;
                      return (
                        <button
                          key={subItem.name}
                          onClick={() => setActiveTab(subItem.name)}
                          className={`w-full flex items-center px-4 py-2 rounded-md transition-colors text-sm ${
                            isSubActive 
                              ? 'bg-[#162D50] text-white font-bold' 
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                          }`}
                        >
                          <SubIcon className={`w-4 h-4 mr-3 ${isSubActive ? 'text-white' : 'text-gray-400'}`} />
                          {subItem.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-3 space-y-1 mb-2">
        <a href="#" className="flex items-center px-4 py-2 text-[#4A5568] hover:bg-gray-200 rounded-md">
          <HelpCircle className="w-5 h-5 mr-3 text-gray-500" />
          <span className="font-medium text-sm">Support</span>
        </a>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-[#4A5568] hover:bg-gray-200 rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-gray-500" />
          <span className="font-medium text-sm">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
