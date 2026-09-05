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
  ChevronsRight,
  ChevronsLeft,
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
  Calendar,
  MapPin,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar({ activeTab, setActiveTab, openMenus, toggleMenu, setToken, user }) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
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
        { name: 'Assign Work Place', icon: MapPin },
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
        { name: 'Case List', icon: ClipboardList }
      ]
    },
    { 
      name: 'Settings', 
      icon: SettingsIcon,
      subItems: [
        { name: 'Expense SetUp', icon: Banknote }
      ]
    },
  ];

  const navItems = allNavItems.filter(item => {
    // Admin sees all departments except Business Department, and Settings
    if (!user || user.role === 'admin') {
      return item.name !== 'Business Department';
    }
    
    // Other roles see their department and Settings
    if (item.name === 'Settings') return true;
    if (user.role === 'hr' && item.name === 'HR Department') return true;
    if (user.role === 'account' && item.name === 'Account Department') return true;
    if (user.role === 'support' && item.name === 'Support Department') return true;
    
    return false;
  }).map(item => {
    // Do not show sub-items for Admin
    if (!user || user.role === 'admin') {
      return { ...item, subItems: undefined };
    }
    return item;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    navigate('/login');
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-[#F2F4F7] flex flex-col justify-between border-r border-gray-200 relative z-10`}>
      <div className="overflow-hidden">
        <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center flex-col space-y-4' : 'justify-between'} mb-2`}>
          <div className="flex items-center">
            <div className={`w-10 h-10 bg-[#162D50] rounded flex items-center justify-center text-white font-bold uppercase shrink-0 ${isCollapsed ? '' : 'mr-3'}`}>
              {user?.username ? user.username[0] : 'A'}
            </div>
            {!isCollapsed && (
              <div className="whitespace-nowrap">
                <h2 className="text-[#162D50] font-bold text-lg leading-tight capitalize truncate w-32">{user?.username || 'Admin'}</h2>
                <p className="text-xs text-gray-500 capitalize truncate w-32">{user?.role === 'admin' ? 'System Administrator' : `${user?.role} Department`}</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="text-[#162D50] hover:bg-gray-200 p-1 rounded-md transition-colors"
          >
            {isCollapsed ? <ChevronsRight className="w-5 h-5" strokeWidth={3} /> : <ChevronsLeft className="w-5 h-5" strokeWidth={3} />}
          </button>
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
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-[#162D50] text-white font-bold'
                      : 'text-[#4A5568] hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className="flex items-center">
                    <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.name}</span>}
                  </div>
                </button>
                
                {/* Sub items static */}
                {hasSubItems && !isCollapsed && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                    {item.subItems.map(subItem => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTab === subItem.name;
                      return (
                        <button
                          key={subItem.name}
                          onClick={() => {
                            if (subItem.name === 'Case List' && item.name === 'Support Department') {
                              sessionStorage.setItem('caseListTab', 'Staff');
                            } else if (subItem.name === 'Case List' && item.name === 'Account Department') {
                              sessionStorage.setItem('caseListTab', 'Office');
                            }
                            setActiveTab(subItem.name);
                          }}
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
        <a href="#" className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-2 text-[#4A5568] hover:bg-gray-200 rounded-md transition-colors`} title={isCollapsed ? 'Support' : undefined}>
          <HelpCircle className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} text-gray-500`} />
          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">Support</span>}
        </a>
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-2 text-[#4A5568] hover:bg-gray-200 rounded-md transition-colors`}
          title={isCollapsed ? 'Log Out' : undefined}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} text-gray-500`} />
          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
