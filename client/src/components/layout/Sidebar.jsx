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
  Menu,
  Wallet,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar({ activeTab, setActiveTab, openMenus, toggleMenu, setToken, user, mobileMenuOpen, setMobileMenuOpen }) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allNavItems = [
    { name: 'Dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { name: 'B2B部門', label: 'B2B部門', icon: Briefcase },
    { 
      name: '経理部門', 
      label: '経理部門',
      icon: Building2,
      subItems: [
        { name: 'New Case', label: '新規案件', icon: FilePlus },
        { name: 'Case List', label: '案件一覧', icon: ListTodo },
        { name: 'Paid Status', label: '支払台帳', icon: Banknote },
        { name: 'Payment Entry', label: '支払済請求書一覧', icon: CreditCard }
      ]
    },
    { 
      name: '人事部門', 
      label: '人事部門',
      icon: Users,
      subItems: [
        { name: 'Staff Registration', label: 'スタッフ登録', icon: UserPlus },
        { name: 'Staff List', label: 'スタッフ一覧', icon: List },
        { name: 'Assign Work Place', label: '配属先', icon: MapPin },
        { name: 'Visa Management', label: 'ビザ管理', icon: Plane },
        { name: 'Resignation', label: '退職', icon: UserMinus }
      ]
    },
    { name: '事業部門', label: '事業部門', icon: Briefcase },
    { 
      name: 'サポート部門', 
      label: 'サポート部門',
      icon: LifeBuoy,
      subItems: [
        { name: 'Staff Claim Request', label: 'スタッフ経費精算', icon: FileText },
        { name: 'Case List', label: '案件一覧', icon: ClipboardList }
      ]
    },
    { name: 'Expense SetUp', label: '経費設定', icon: Wallet },
    { name: 'Settings', label: '設定', icon: SettingsIcon },
  ];

  const navItems = allNavItems.filter(item => {
    // Admin sees all departments except 事業部門, Expense SetUp, and Settings
    if (!user || user.role === 'admin') {
      return item.name !== '事業部門' && item.name !== 'Expense SetUp';
    }
    
    // Other roles see their department and Settings
    if (item.name === 'Settings') return true;
    if (user.role === 'hr' && item.name === '人事部門') return true;
    if (user.role === 'account' && (item.name === '経理部門' || item.name === 'Expense SetUp')) return true;
    if (user.role === 'support' && item.name === 'サポート部門') return true;
    
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
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 transform md:transform-none transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64 bg-[#F2F4F7] flex flex-col justify-between border-r border-gray-200 shadow-xl md:shadow-none shrink-0`}>
        <div className="overflow-hidden">
          <div className={`p-4 flex items-center ${isCollapsed ? 'md:justify-center md:flex-col md:space-y-4' : 'justify-between'} justify-between mb-2`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 bg-[#162D50] rounded flex items-center justify-center text-white font-bold uppercase shrink-0 ${isCollapsed ? 'md:mr-0 mr-3' : 'mr-3'}`}>
                {user?.username ? user.username[0] : 'A'}
              </div>
              {(!isCollapsed || mobileMenuOpen) && (
                <div className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>
                  <h2 className="text-[#162D50] font-bold text-lg leading-tight capitalize truncate w-32">{user?.username || '管理者'}</h2>
                  <p className="text-xs text-gray-500 capitalize truncate w-32">{user?.role === 'admin' ? 'システム管理者' : `${user?.role} 部門`}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              {/* Desktop collapse toggle */}
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className="hidden md:block text-[#162D50] hover:bg-gray-200 p-1 rounded-md transition-colors cursor-pointer"
                aria-label="折りたたみ"
              >
                {isCollapsed ? <ChevronsRight className="w-5 h-5" strokeWidth={3} /> : <ChevronsLeft className="w-5 h-5" strokeWidth={3} />}
              </button>
              
              {/* Mobile close button */}
              <button
                onClick={() => setMobileMenuOpen?.(false)}
                className="md:hidden text-[#162D50] hover:bg-gray-200 p-1.5 rounded-md transition-colors cursor-pointer"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              const hasSubItems = !!item.subItems;

              return (
                <div key={item.name} className="flex flex-col">
                  <button
                    onClick={() => {
                      setActiveTab(item.name);
                      setMobileMenuOpen?.(false);
                    }}
                    className={`w-full flex items-center ${isCollapsed ? 'md:justify-center' : 'justify-between'} justify-between px-4 py-2.5 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#162D50] text-white font-bold'
                        : 'text-[#4A5568] hover:bg-gray-100'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 ${isCollapsed ? 'md:mr-0 mr-3' : 'mr-3'} ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      {(!isCollapsed || mobileMenuOpen) && <span className={`text-sm whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>{item.label || item.name}</span>}
                    </div>
                  </button>
                  
                  {/* Sub items static */}
                  {hasSubItems && (!isCollapsed || mobileMenuOpen) && (
                    <div className={`mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1 ${isCollapsed ? 'md:hidden' : ''}`}>
                      {item.subItems.map(subItem => {
                        const SubIcon = subItem.icon;
                        const isSubActive = activeTab === subItem.name;
                        return (
                          <button
                            key={subItem.name}
                            onClick={() => {
                              if (subItem.name === 'Case List' && item.name === 'サポート部門') {
                                sessionStorage.setItem('caseListTab', 'Staff');
                              } else if (subItem.name === 'Case List' && item.name === '経理部門') {
                                sessionStorage.setItem('caseListTab', 'Office');
                              }
                              setActiveTab(subItem.name);
                              setMobileMenuOpen?.(false);
                            }}
                            className={`w-full flex items-center px-4 py-2 rounded-md transition-colors text-sm cursor-pointer ${
                              isSubActive 
                                ? 'bg-[#162D50] text-white font-bold' 
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                          >
                            <SubIcon className={`w-4 h-4 mr-3 ${isSubActive ? 'text-white' : 'text-gray-400'}`} />
                            {subItem.label || subItem.name}
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
          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">サポート</span>}
        </a>
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-2 text-[#4A5568] hover:bg-gray-200 rounded-md transition-colors`}
          title={isCollapsed ? 'Log Out' : undefined}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} text-gray-500`} />
          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">ログアウト</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
